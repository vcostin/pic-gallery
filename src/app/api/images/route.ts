import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { authOptions } from "@/lib/auth";
import { 
  getPaginationOptions, 
  formatPaginatedResponse,
  handleFetchError
} from "@/lib/dataFetching";
import { Image, PaginatedResponse, ApiErrorResponse } from "@/lib/types";
import logger from "@/lib/logger";
import { Prisma } from "@prisma/client"; // Import Prisma

// Schema validation for image creation
const createImageSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  url: z.string().min(1, "Image URL is required"),
  tags: z.array(z.string()).optional(),
});

// Schema validation for query parameters
const getImagesQuerySchema = z.object({
  page: z.coerce.number().min(1).optional().default(1),
  limit: z.coerce.number().min(1).max(100).optional().default(20),
  tag: z.string().optional(),
  searchQuery: z.string().optional(), // Added for general search
  sortBy: z.enum(['createdAt', 'title', 'updatedAt']).optional().default('createdAt'),
  sortDir: z.enum(['asc', 'desc']).optional().default('desc'),
});

/**
 * POST /api/images - Create a new image
 */
export async function POST(req: Request) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user.id) {
      return NextResponse.json<ApiErrorResponse>(
        { error: "Unauthorized" }, 
        { status: 401 }
      );
    }

    // Parse and validate request body
    const json = await req.json();
    const body = createImageSchema.parse(json);

    // Create image in database
    const image = await prisma.image.create({
      data: {
        title: body.title,
        description: body.description,
        url: body.url,
        userId: session.user.id,
        tags: body.tags ? {
          connectOrCreate: body.tags.map(tag => ({
            where: { name: tag },
            create: { name: tag },
          }))
        } : undefined,
      },
      include: {
        tags: true,
      },
    });

    logger.log(`Image created: ${image.id} by user ${session.user.id}`);
    return NextResponse.json(image, { status: 201 });
  } catch (error) {
    // Handle validation errors
    if (error instanceof z.ZodError) {
      return NextResponse.json<ApiErrorResponse>(
        { error: JSON.stringify(error.errors) }, 
        { status: 400 }
      );
    }
    
    // Log and handle other errors
    const errorMessage = logger.handleError(error, "Error creating image");
    return NextResponse.json<ApiErrorResponse>(
      { error: errorMessage }, 
      { status: 500 }
    );
  }
}

/**
 * GET /api/images - Get all images for the current user with pagination and filtering
 */
export async function GET(req: Request) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user.id) {
      return NextResponse.json<ApiErrorResponse>(
        { error: "Unauthorized" }, 
        { status: 401 }
      );
    }

    // Parse query parameters
    const { searchParams } = new URL(req.url);
    const queryParams = getImagesQuerySchema.parse({
      page: searchParams.get("page") ? Number(searchParams.get("page")) : undefined,
      limit: searchParams.get("limit") ? Number(searchParams.get("limit")) : undefined,
      tag: searchParams.get("tag") || undefined,
      searchQuery: searchParams.get("searchQuery") || undefined, // Parse searchQuery
      sortBy: searchParams.get("sortBy") || undefined,
      sortDir: searchParams.get("sortDir") || undefined,
    });

    // Create the where clause
    const where: Prisma.ImageWhereInput = { // Replaced any with Prisma.ImageWhereInput
      userId: session.user.id,
    };

    if (queryParams.tag) {
      where.tags = {
        some: {
          name: queryParams.tag,
        },
      };
    }

    if (queryParams.searchQuery) {
      where.OR = [
        {
          title: {
            contains: queryParams.searchQuery,
            mode: 'insensitive', // Case-insensitive search
          },
        },
        {
          description: {
            contains: queryParams.searchQuery,
            mode: 'insensitive',
          },
        },
      ];
    }

    // Get total count for pagination
    const total = await prisma.image.count({ where });

    // Get paginated images
    const images = await prisma.image.findMany({
      where,
      include: {
        tags: true,
      },
      orderBy: {
        [queryParams.sortBy]: queryParams.sortDir,
      },
      ...getPaginationOptions({
        page: queryParams.page,
        limit: queryParams.limit,
      }),
    });

    // Format the response with pagination metadata
    const response = formatPaginatedResponse<Image>(
      images, 
      total, 
      { page: queryParams.page, limit: queryParams.limit }
    );

    return NextResponse.json<PaginatedResponse<Image>>(response);
  } catch (error) {
    // Handle validation errors
    if (error instanceof z.ZodError) {
      return NextResponse.json<ApiErrorResponse>(
        { error: JSON.stringify(error.errors) }, 
        { status: 400 }
      );
    }
    
    // Log and handle other errors
    const errorMessage = handleFetchError(error, "images");
    return NextResponse.json<ApiErrorResponse>(
      { error: errorMessage }, 
      { status: 500 }
    );
  }
}
