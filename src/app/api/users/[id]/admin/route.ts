import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { authOptions } from "@/lib/auth";
import logger from "@/lib/logger";
import { UserRole } from "@prisma/client";

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
    const { id: targetUserId } = params;
    
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    // Get the current user to check if they're an admin
    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });
    
    // Only admins can change user roles
    if (currentUser?.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
    }
    
    // Parse request body
    const json = await req.json();
    const body = updateUserRoleSchema.parse(json);
    
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
    
    return NextResponse.json({
      message,
      user: updatedUser,
    });
  } catch (err) {
    logger.error("Error updating user role:", err);
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.errors }, { status: 400 });
    }
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
