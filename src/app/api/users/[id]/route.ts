import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { authOptions } from "@/lib/auth";
import logger from "@/lib/logger";
import { UserRole } from "@prisma/client";

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
    const { id } = params;
    
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    // Check if the current user is an admin
    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });
    
    // Users can only view their own profile or admins can view any
    const isOwnProfile = session.user.id === id;
    const isAdmin = currentUser?.role === UserRole.ADMIN;
    
    if (!isOwnProfile && !isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    
    // Get user profile with stats
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
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    
    return NextResponse.json(user);
  } catch (err) {
    logger.error("Error fetching user:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
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
    const { id } = params;
    
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    // Check if the current user is an admin
    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });
    
    // Users can only update their own profile or admins can update any
    const isOwnProfile = session.user.id === id;
    const isAdmin = currentUser?.role === UserRole.ADMIN;
    
    if (!isOwnProfile && !isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    
    // Validate request body
    const json = await req.json();
    const body = updateUserSchema.parse(json);
    
    // Update user
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
    return NextResponse.json(updatedUser);
  } catch (err) {
    logger.error("Error updating user:", err);
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.errors }, { status: 400 });
    }
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
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
    const { id } = params;
    
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    // Check if the current user is an admin
    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });
    
    // Only allow users to delete their own account or admins to delete any account
    const isOwnAccount = session.user.id === id;
    const isAdmin = currentUser?.role === UserRole.ADMIN;
    
    if (!isOwnAccount && !isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    
    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id },
    });
    
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    
    // Delete user (cascading deletion will handle related data)
    await prisma.user.delete({
      where: { id },
    });
    
    logger.log(`User deleted: ${id}${isOwnAccount ? " (self-deletion)" : ""}`);
    return NextResponse.json({ message: "User successfully deleted" });
  } catch (err) {
    logger.error("Error deleting user:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
