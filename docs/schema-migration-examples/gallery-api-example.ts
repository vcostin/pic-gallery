/**
 * Example of a refactored API endpoint using Zod schemas
 * This shows how to implement type-safe request validation and response formatting
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { GallerySchema, createApiSuccessSchema } from '@/lib/schemas';
import { validateApiResponse } from '@/lib/apiUtils';

// Mock database for the example
interface UpdateArgs {
  where: { 
    id: string 
  };
  data: { 
    title?: string;
    description?: string | null;
    isPublic?: boolean;
    coverImageId?: string | null;
    themeColor?: string | null;
    backgroundColor?: string | null;
    backgroundImageUrl?: string | null;
    accentColor?: string | null;
    fontFamily?: string | null;
    displayMode?: string | null;
    layoutType?: string | null;
    [key: string]: any;
  };
  include: any;
}

const db = {
  gallery: {
    update: async (args: UpdateArgs) => ({
      id: args.where.id,
      title: args.data.title || 'Example Gallery',
      ...args.data
    })
  }
};

// Define request schema
const UpdateGalleryRequestSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
  isPublic: z.boolean().optional(),
  coverImageId: z.string().nullable().optional(),
  // Theming options
  themeColor: z.string().nullable().optional(),
  backgroundColor: z.string().nullable().optional(),
  backgroundImageUrl: z.string().url().nullable().optional(),
  accentColor: z.string().nullable().optional(),
  fontFamily: z.string().nullable().optional(),
  displayMode: z.string().nullable().optional(),
  layoutType: z.string().nullable().optional(),
});

// Define response schema using the base gallery schema
const GalleryResponseSchema = createApiSuccessSchema(GallerySchema);

// Type for request data from schema - export it so it can be used elsewhere
export type UpdateGalleryRequest = z.infer<typeof UpdateGalleryRequestSchema>;

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Parse and validate the request body
    const body = await request.json();
    const validatedBody = UpdateGalleryRequestSchema.parse(body);
    
    // Process the gallery update (example)
    const updatedGallery = await db.gallery.update({
      where: { id: params.id },
      data: {
        ...(validatedBody.title && { title: validatedBody.title }),
        ...(validatedBody.description !== undefined && { description: validatedBody.description }),
        ...(validatedBody.isPublic !== undefined && { isPublic: validatedBody.isPublic }),
        ...(validatedBody.coverImageId !== undefined && { coverImageId: validatedBody.coverImageId }),
        ...(validatedBody.themeColor !== undefined && { themeColor: validatedBody.themeColor }),
        ...(validatedBody.backgroundColor !== undefined && { backgroundColor: validatedBody.backgroundColor }),
        ...(validatedBody.backgroundImageUrl !== undefined && { backgroundImageUrl: validatedBody.backgroundImageUrl }),
        ...(validatedBody.accentColor !== undefined && { accentColor: validatedBody.accentColor }),
        ...(validatedBody.fontFamily !== undefined && { fontFamily: validatedBody.fontFamily }),
        ...(validatedBody.displayMode !== undefined && { displayMode: validatedBody.displayMode }),
        ...(validatedBody.layoutType !== undefined && { layoutType: validatedBody.layoutType }),
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
        coverImage: true,
        images: {
          include: {
            image: {
              include: {
                tags: true,
              },
            },
          },
          orderBy: {
            order: 'asc',
          },
        },
      },
    });

    // Validate the response against the schema
    const response = {
      success: true as const,
      data: updatedGallery,
    };
    
    // This will throw if the response doesn't match the expected schema
    validateApiResponse(response, GalleryResponseSchema);
    
    return NextResponse.json(response);
  } catch (error) {
    // Handle validation errors specifically
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid request data',
          issues: error.issues.map(issue => ({
            path: issue.path.join('.'),
            message: issue.message,
          })),
        },
        { status: 400 }
      );
    }
    
    // Handle other errors
    console.error('Error updating gallery:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update gallery',
      },
      { status: 500 }
    );
  }
}
