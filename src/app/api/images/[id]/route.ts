import { getServerSession } from "next-auth";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { authOptions } from "@/lib/auth";
import fs from 'fs';
import path from 'path';
import { Gallery } from "@/lib/generated/prisma-client";
import logger from "@/lib/logger";
import { apiSuccess, apiError, apiValidationError, apiUnauthorized, apiNotFound } from "@/lib/apiResponse";
import { UpdateImageSchema } from "@/lib/schemas";

interface GalleryWithCoverImage extends Gallery {
  id: string;
  title: string;
  coverImageId: string | null;
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user.id) {
      return apiUnauthorized();
    }
    const image = await prisma.image.findUnique({ where: { id: id } });
    if (!image) {
      return apiNotFound("Image not found");
    }
    if (image.userId !== session.user.id) {
      return apiUnauthorized();
    }
    const json = await req.json();
    let body;
    try {
      body = UpdateImageSchema.parse(json);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return apiValidationError(err);
      }
      return apiError("Failed to validate request body");
    }
    const updatedImage = await prisma.image.update({
      where: { id: id },
      data: {
        title: body.title,
        description: body.description,
        tags: body.tags ? {
          set: [],
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
    return apiSuccess(updatedImage);
  } catch (error) {
    logger.error("Error updating image:", error);
    if (error instanceof z.ZodError) {
      return apiValidationError(error);
    }
    return apiError("Internal Server Error");
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user.id) {
      return apiUnauthorized();
    }
    
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
      return apiNotFound("Image not found");
    }
    
    if (image.userId !== session.user.id) {
      return apiUnauthorized();
    }
    
    // Find galleries using this image as cover
    const galleriesUsingAsCover = await prisma.$queryRaw<GalleryWithCoverImage[]>`
      SELECT * FROM "Gallery" 
      WHERE "coverImageId" = ${id} AND "userId" = ${session.user.id}
    `;

    // Update any galleries using this image as cover to have null coverImageId
    if (galleriesUsingAsCover.length > 0) {
      await prisma.$executeRaw`
        UPDATE "Gallery" 
        SET "coverImageId" = NULL 
        WHERE "coverImageId" = ${id}
      `;
      logger.log(`Updated ${galleriesUsingAsCover.length} galleries that were using the deleted image as cover`);
    }
    
    // The image might be used in galleries, but we're deleting it anyway
    // Prisma will automatically remove the ImageInGallery records due to cascading deletion
    
    // Delete the image file from the filesystem
    const urlParts = image.url.split('/');
    const filename = urlParts[urlParts.length - 1];
    const uploadPath = path.join(process.cwd(), 'public', 'uploads', filename);
    
    // Delete the image from the database
    await prisma.image.delete({ where: { id } });
    
    // Clean up the file
    try {
      if (fs.existsSync(uploadPath)) {
        fs.unlinkSync(uploadPath);
      }
    } catch (fileError) {
      logger.error("Error deleting file:", fileError);
    }
    
    return apiSuccess({ success: true });
  } catch (error) {
    logger.error("Error deleting image:", error);
    return apiError("Internal Server Error");
  }
}
