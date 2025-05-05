import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { authOptions } from "@/lib/auth";
import logger from "@/lib/logger";
import { UserRole, Prisma } from "@prisma/client";

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
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Check if user is an admin
    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    if (currentUser?.role !== UserRole.ADMIN) {
      return NextResponse.json(
        { error: "Forbidden: Admin access required" },
        { status: 403 }
      );
    }

    // Parse query parameters
    const { searchParams } = new URL(req.url);
    const queryParams = getUsersQuerySchema.parse({
      page: searchParams.get("page") ? Number(searchParams.get("page")) : undefined,
      limit: searchParams.get("limit") ? Number(searchParams.get("limit")) : undefined,
      search: searchParams.get("search") || undefined,
    });

    // Calculate pagination
    const skip = (queryParams.page - 1) * queryParams.limit;

    // Create the where clause for search
    const where = queryParams.search ? {
      OR: [
        { name: { contains: queryParams.search, mode: Prisma.QueryMode.insensitive } },
        { email: { contains: queryParams.search, mode: Prisma.QueryMode.insensitive } },
      ],
    } : {};

    // Get users with pagination
    const [users, totalUsers] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
          emailVerified: true,
          role: true,  // Added role field here
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

    // Calculate total pages
    const totalPages = Math.ceil(totalUsers / queryParams.limit);

    return NextResponse.json({
      users,
      pagination: {
        page: queryParams.page,
        limit: queryParams.limit,
        totalUsers,
        totalPages,
      }
    });
  } catch (err) {
    logger.error("Error fetching users:", err);
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.errors }, { status: 400 });
    }
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
