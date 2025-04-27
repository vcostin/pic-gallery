import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { authOptions } from "@/lib/auth";
import fs from 'fs';
import path from 'path';
import { Gallery } from "@prisma/client";
import logger from "@/lib/logger";

interface GalleryWithCoverImage extends Gallery {
  id: string;
  title: string;
  coverImageId: string | null;
}

const updateImageSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Await params to solve the Next.js dynamic route parameters issue
    const { id } = await params;

    const session = await getServerSession(authOptions);
    if (!session?.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const image = await prisma.image.findUnique({
      where: { id: id },
    });

    if (!image) {
      return NextResponse.json({ error: "Image not found" }, { status: 404 });
    }

    if (image.userId !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const json = await req.json();
    const body = updateImageSchema.parse(json);

    const updatedImage = await prisma.image.update({
      where: { id: id },
      data: {
        title: body.title,
        description: body.description,
        tags: body.tags ? {
          set: [], // First disconnect all existing tags
          connectOrCreate: body.tags.map(tag => ({
            where: { name: tag },
            create: { name: tag },
          })),
        } : undefined,
      },
      include: {
        tags: true,
      },
    });

    return NextResponse.json(updatedImage);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(req.url);
    const forceDelete = searchParams.get('force') === 'true';

    const session = await getServerSession(authOptions);
    if (!session?.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if the image exists and belongs to the current user
    const image = await prisma.image.findUnique({
      where: { id },
      include: {
        inGalleries: {
          include: {
            gallery: true
          }
        }
      }
    });

    if (!image) {
      return NextResponse.json({ error: "Image not found" }, { status: 404 });
    }

    if (image.userId !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Use raw query to find galleries using this image as cover
    const galleriesUsingAsCover = await prisma.$queryRaw<GalleryWithCoverImage[]>`
      SELECT * FROM "Gallery" 
      WHERE "coverImageId" = ${id} AND "userId" = ${session.user.id}
    `;

    // Return warning if the image is used in galleries and we're not force deleting
    if (!forceDelete && (image.inGalleries.length > 0 || galleriesUsingAsCover.length > 0)) {
      const galleriesFromRelations = image.inGalleries.map(ig => ig.gallery);
      const allGalleries = [
        ...galleriesFromRelations,
        ...galleriesUsingAsCover.filter(g => 
          !galleriesFromRelations.some(rg => rg.id === g.id)
        )
      ];
      
      return NextResponse.json({
        warning: "Image is used in galleries",
        galleries: allGalleries.map(g => ({
          id: g.id,
          title: g.title,
          isCover: galleriesUsingAsCover.some(cover => cover.id === g.id)
        }))
      }, { status: 409 });
    }

    // If force delete, update galleries using this as cover image to have no cover image
    if (galleriesUsingAsCover.length > 0) {
      // Use raw query to update galleries
      await prisma.$executeRaw`
        UPDATE "Gallery" 
        SET "coverImageId" = NULL 
        WHERE "coverImageId" = ${id}
      `;
    }

    // Extract filename from URL
    const urlParts = image.url.split('/');
    const filename = urlParts[urlParts.length - 1];
    const uploadPath = path.join(process.cwd(), 'public', 'uploads', filename);

    // Delete the image from the database
    await prisma.image.delete({
      where: { id }
    });

    // Try to delete the file from the uploads folder
    try {
      if (fs.existsSync(uploadPath)) {
        fs.unlinkSync(uploadPath);
      }
    } catch (fileError) {
      logger.error("Error deleting file:", fileError);
      // Continue even if file deletion fails
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error("Error deleting image:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
