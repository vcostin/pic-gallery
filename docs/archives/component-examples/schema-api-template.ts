/**
 * API endpoint template using schema validation
 * Use this as a reference when creating new API endpoints or refactoring existing ones
 * 
 * Note: This is an example file with mock implementations that use 'any' types
 * deliberately to simplify the template. In real implementations, define proper types.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
// Example mock database client for demonstration purposes
const db = {
  item: {
    findMany: async (query: any) => {
      // Simple mock implementation that respects the query
      console.log('Mock DB query:', query);
      return [];
    },
    count: async () => 0,
    create: async (query: any) => {
      // Return mock data based on the query
      console.log('Mock DB create:', query);
      return { id: '123', title: query?.data?.title || 'New Item' };
    }
  }
};
// Uncomment these when using the helper functions
// import { ApiSuccessResponseSchema, ApiErrorResponseSchema } from '@/lib/schemas';

/**
 * Step 1: Define your request schemas
 */
const GetQuerySchema = z.object({
  limit: z.string().optional().transform(val => val ? parseInt(val, 10) : 10),
  page: z.string().optional().transform(val => val ? parseInt(val, 10) : 1),
  search: z.string().optional(),
});

const CreateRequestSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  isPublic: z.boolean().default(false),
});

/**
 * Step 2: Define your response schema
 */
// Example schema (uncomment when implementing)
/*
const ItemSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string().nullable(),
  isPublic: z.boolean(),
  createdAt: z.date(),
  updatedAt: z.date(),
});
*/

/**
 * Step 3: Create handler functions with schema validation
 */

// GET handler
export async function GET(request: NextRequest) {
  try {
    // Parse and validate query parameters
    const url = new URL(request.url);
    const parsed = GetQuerySchema.safeParse(Object.fromEntries(url.searchParams));
    
    if (!parsed.success) {
      return NextResponse.json({
        success: false,
        error: 'Invalid query parameters',
        issues: parsed.error.issues.map(issue => ({
          path: issue.path.join('.'),
          message: issue.message
        }))
      }, { status: 400 });
    }
    
    const { limit, page, search } = parsed.data;
    
    // Database query with validated parameters
    const items = await db.item.findMany({
      where: {
        ...(search ? {
          OR: [
            { title: { contains: search, mode: 'insensitive' } },
            { description: { contains: search, mode: 'insensitive' } },
          ]
        } : {}),
      },
      take: limit,
      skip: (page - 1) * limit,
      orderBy: { createdAt: 'desc' }
    });
    
    const total = await db.item.count();
    
    // Return validated response
    return NextResponse.json({
      success: true,
      data: {
        data: items,
        meta: {
          total,
          currentPage: page,
          lastPage: Math.ceil(total / limit),
          perPage: limit,
          hasNextPage: page * limit < total,
          hasPrevPage: page > 1,
          nextPage: page * limit < total ? page + 1 : null,
          prevPage: page > 1 ? page - 1 : null,
        }
      }
    });
    
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}

// POST handler
export async function POST(request: NextRequest) {
  try {
    // Parse and validate request body
    const body = await request.json();
    const parsed = CreateRequestSchema.safeParse(body);
    
    if (!parsed.success) {
      return NextResponse.json({
        success: false,
        error: 'Validation error',
        issues: parsed.error.issues.map(issue => ({
          path: issue.path.join('.'),
          message: issue.message
        }))
      }, { status: 400 });
    }
    
    const { title, description, isPublic } = parsed.data;
    
    // Create database record with validated data
    const newItem = await db.item.create({
      data: {
        title,
        description,
        isPublic,
        userId: 'user-id', // Get from authenticated user
      }
    });
    
    // Return validated success response
    return NextResponse.json({
      success: true,
      data: newItem
    }, { status: 201 });
    
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}

/**
 * Helper functions to create typed API responses
 * Uncomment and use these when implementing the API endpoints
 */
/*
function createSuccessResponse<T>(data: T) {
  const response = { success: true as const, data };
  return ApiSuccessResponseSchema.parse(response); // Validate response shape
}

function createErrorResponse(error: string, status = 500, issues?: { path: string; message: string }[]) {
  const response = { 
    success: false as const, 
    error,
    ...(issues && { issues })
  };
  return ApiErrorResponseSchema.parse(response); // Validate response shape
}
*/
