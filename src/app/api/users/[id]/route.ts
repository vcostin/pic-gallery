import { getServerSession } from "next-auth";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { authOptions } from "@/lib/auth";
import logger from "@/lib/logger";
import { UserRole } from "@prisma/client";
import { apiSuccess, apiError, apiValidationError, apiUnauthorized, apiNotFound } from "@/lib/apiResponse";

const updateUserSchema = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email().optional(),
  image: z.string().url().optional().nullable(),
});

/**
 * GET /api/users/[id] - Get a specific user's profile
 */
export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user.id) {
      return apiUnauthorized();
    }
    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });
    const isOwnProfile = session.user.id === id;
    const isAdmin = currentUser?.role === UserRole.ADMIN;
    if (!isOwnProfile && !isAdmin) {
      return apiError("Forbidden", 403);
    }
    const user = await prisma.user.findUnique({
      where: { id },
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
      }
    });
    if (!user) {
      return apiNotFound("User not found");
    }
    return apiSuccess(user);
  } catch (err) {
    logger.error("Error fetching user:", err);
    return apiError("Internal Server Error");
  }
}

/**
 * PATCH /api/users/[id] - Update user profile
 */
export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user.id) {
      return apiUnauthorized();
    }
    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });
    const isOwnProfile = session.user.id === id;
    const isAdmin = currentUser?.role === UserRole.ADMIN;
    if (!isOwnProfile && !isAdmin) {
      return apiError("Forbidden", 403);
    }
    const json = await req.json();
    let body;
    try {
      body = updateUserSchema.parse(json);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return apiValidationError(err);
      }
      throw err;
    }
    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        ...(body.name && { name: body.name }),
        ...(body.email && { email: body.email }),
        ...(body.image !== undefined && { image: body.image }),
      },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        emailVerified: true,
        role: true,
      }
    });
    logger.log(`User updated: ${updatedUser.id}`);
    return apiSuccess(updatedUser);
  } catch (err) {
    logger.error("Error updating user:", err);
    if (err instanceof z.ZodError) {
      return apiValidationError(err);
    }
    return apiError("Internal Server Error");
  }
}

/**
 * DELETE /api/users/[id] - Delete a user (admin only or self-deletion)
 */
export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user.id) {
      return apiUnauthorized();
    }
    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });
    const isOwnAccount = session.user.id === id;
    const isAdmin = currentUser?.role === UserRole.ADMIN;
    if (!isOwnAccount && !isAdmin) {
      return apiError("Forbidden", 403);
    }
    const user = await prisma.user.findUnique({
      where: { id },
    });
    if (!user) {
      return apiNotFound("User not found");
    }
    await prisma.user.delete({
      where: { id },
    });
    logger.log(`User deleted: ${id}${isOwnAccount ? " (self-deletion)" : ""}`);
    return apiSuccess({ message: "User successfully deleted" });
  } catch (err) {
    logger.error("Error deleting user:", err);
    return apiError("Internal Server Error");
  }
}
