import { getServerSession } from "next-auth";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { authOptions } from "@/lib/auth";
import { apiSuccess, apiUnauthorized, withApiHandler } from "@/lib/apiResponse";
import { getPaginationOptions, formatPaginatedResponse } from "@/lib/dataFetching";
import { Image } from "@prisma/client";
import logger from "@/lib/logger";
import { Prisma } from "@prisma/client";
import { CreateImageSchema } from "@/lib/schemas";

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
export const POST = withApiHandler(async (req) => {
  const session = await getServerSession(authOptions);
  if (!session?.user.id) {
    return apiUnauthorized();
  }
  const json = await req.json();
  const body = CreateImageSchema.parse(json);
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
    include: { tags: true },
  });
  logger.log(`Image created: ${image.id} by user ${session.user.id}`);
  return apiSuccess(image, 201);
});

/**
 * GET /api/images - Get all images for the current user with pagination and filtering
 */
export const GET = withApiHandler(async (req) => {
  const session = await getServerSession(authOptions);
  if (!session?.user.id) {
    return apiUnauthorized();
  }
  const { searchParams } = new URL(req.url);
  const queryParams = getImagesQuerySchema.parse({
    page: searchParams.get("page") ? Number(searchParams.get("page")) : undefined,
    limit: searchParams.get("limit") ? Number(searchParams.get("limit")) : undefined,
    tag: searchParams.get("tag") || undefined,
    searchQuery: searchParams.get("searchQuery") || undefined,
    sortBy: searchParams.get("sortBy") || undefined,
    sortDir: searchParams.get("sortDir") || undefined,
  });
  const where: Prisma.ImageWhereInput = { userId: session.user.id };
  if (queryParams.tag) {
    where.tags = { some: { name: queryParams.tag } };
  }
  if (queryParams.searchQuery) {
    where.OR = [
      { title: { contains: queryParams.searchQuery, mode: 'insensitive' } },
      { description: { contains: queryParams.searchQuery, mode: 'insensitive' } },
    ];
  }
  const total = await prisma.image.count({ where });
  const images = await prisma.image.findMany({
    where,
    include: { tags: true },
    orderBy: { [queryParams.sortBy]: queryParams.sortDir },
    ...getPaginationOptions({ page: queryParams.page, limit: queryParams.limit }),
  });
  const response = formatPaginatedResponse<Image>(images, total, { page: queryParams.page, limit: queryParams.limit });
  return apiSuccess(response);
});
