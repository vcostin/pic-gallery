import { getServerSession } from "next-auth";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { authOptions } from "@/lib/auth";
import logger from "@/lib/logger";
import { UserRole, Prisma } from "@prisma/client";
import { apiSuccess, apiError, apiValidationError, apiUnauthorized } from "@/lib/apiResponse";

const getUsersQuerySchema = z.object({
  page: z.number().optional().default(1),
  limit: z.number().optional().default(10),
  search: z.string().optional(),
});

/**
 * GET /api/users - Get all users (admin only)
 */
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user.id) {
      return apiUnauthorized();
    }
    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });
    if (currentUser?.role !== UserRole.ADMIN) {
      return apiError("Forbidden: Admin access required", 403);
    }
    const { searchParams } = new URL(req.url);
    let queryParams;
    try {
      queryParams = getUsersQuerySchema.parse({
        page: searchParams.get("page") ? Number(searchParams.get("page")) : undefined,
        limit: searchParams.get("limit") ? Number(searchParams.get("limit")) : undefined,
        search: searchParams.get("search") || undefined,
      });
    } catch (err) {
      if (err instanceof z.ZodError) {
        return apiValidationError(err);
      }
      throw err;
    }
    const skip = (queryParams.page - 1) * queryParams.limit;
    const where = queryParams.search ? {
      OR: [
        { name: { contains: queryParams.search, mode: Prisma.QueryMode.insensitive } },
        { email: { contains: queryParams.search, mode: Prisma.QueryMode.insensitive } },
      ],
    } : {};
    const [users, totalUsers] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
          emailVerified: true,
          role: true,
          _count: {
            select: {
              images: true,
              galleries: true,
            }
          }
        },
        skip,
        take: queryParams.limit,
        orderBy: {
          name: 'asc',
        },
      }),
      prisma.user.count({ where }),
    ]);
    const totalPages = Math.ceil(totalUsers / queryParams.limit);
    // Return in the new consistent format
    return apiSuccess({
      data: users,
      meta: {
        page: queryParams.page,
        limit: queryParams.limit,
        totalUsers,
        totalPages,
      }
    });
  } catch (err) {
    logger.error("Error fetching users:", err);
    if (err instanceof z.ZodError) {
      return apiValidationError(err);
    }
    return apiError("Internal Server Error");
  }
}
