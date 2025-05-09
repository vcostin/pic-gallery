import { getServerSession } from "next-auth";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { authOptions } from "@/lib/auth";
import logger from "@/lib/logger";
import { UserRole } from "@prisma/client";
import { apiSuccess, apiError, apiValidationError, apiUnauthorized } from "@/lib/apiResponse";

const updateUserRoleSchema = z.object({
  role: z.enum([UserRole.USER, UserRole.ADMIN]),
});

/**
 * PUT /api/users/[id]/role - Update a user's role
 * Only admins can change user roles
 */
export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id: targetUserId } = await params; // Added await
    
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user.id) {
      return apiUnauthorized();
    }
    
    // Get the current user to check if they're an admin
    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });
    
    // Only admins can change user roles
    if (currentUser?.role !== UserRole.ADMIN) {
      return apiError("Forbidden: Admin access required", 403);
    }
    
    // Parse request body
    const json = await req.json();
    let body;
    try {
      body = updateUserRoleSchema.parse(json);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return apiValidationError(err);
      }
      throw err;
    }
    
    // Update the target user's role
    const updatedUser = await prisma.user.update({
      where: { id: targetUserId },
      data: { role: body.role },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
    });
    
    const message = body.role === UserRole.ADMIN 
      ? `User ${updatedUser.email} promoted to admin`
      : `User ${updatedUser.email} demoted to regular user`;
    
    logger.log(`${message} by admin ${session.user.id}`);
    
    return apiSuccess({
      message,
      user: updatedUser,
    });
  } catch (err) {
    logger.error("Error updating user role:", err);
    if (err instanceof z.ZodError) {
      return apiValidationError(err);
    }
    return apiError("Internal Server Error");
  }
}
