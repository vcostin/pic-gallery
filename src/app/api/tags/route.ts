import { getServerSession } from "next-auth";
import { prisma } from "@/lib/db";
import { authOptions } from "@/lib/auth";
import { apiSuccess, apiUnauthorized, withApiHandler } from "@/lib/apiResponse";
import logger from "@/lib/logger";

/**
 * GET /api/tags - Get all tags used by the current user
 */
export const GET = withApiHandler(async (req) => {
  const session = await getServerSession(authOptions);
  if (!session?.user.id) {
    return apiUnauthorized();
  }

  // Get all distinct tags used by images owned by the current user
  const tags = await prisma.tag.findMany({
    where: {
      images: {
        some: {
          userId: session.user.id
        }
      }
    },
    orderBy: {
      name: 'asc'
    },
    select: {
      id: true,
      name: true,
      _count: {
        select: {
          images: true
        }
      }
    }
  });

  logger.log(`Retrieved ${tags.length} tags for user ${session.user.id}`);
  return apiSuccess(tags);
});

/**
 * POST /api/tags - Create a new tag
 */
export const POST = withApiHandler(async (req) => {
  const session = await getServerSession(authOptions);
  if (!session?.user.id) {
    return apiUnauthorized();
  }

  const { name } = await req.json();
  
  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    return apiSuccess(null, 400);
  }

  const tagName = name.trim();

  // Check if tag already exists
  const existingTag = await prisma.tag.findUnique({
    where: { name: tagName }
  });

  if (existingTag) {
    return apiSuccess(existingTag);
  }

  // Create new tag
  const newTag = await prisma.tag.create({
    data: { name: tagName },
    select: {
      id: true,
      name: true,
      _count: {
        select: {
          images: true
        }
      }
    }
  });

  logger.log(`Created new tag: ${newTag.name} by user ${session.user.id}`);
  return apiSuccess(newTag, 201);
});
