import { getServerSession } from "next-auth";
import { prisma } from "@/lib/db";
import { authOptions } from "@/lib/auth";
import logger from "@/lib/logger";
import { apiSuccess, apiError, apiUnauthorized, apiNotFound } from "@/lib/apiResponse";

/**
 * DELETE /api/galleries/[id]/images/[imageId]
 * Removes an image from a gallery
 */
export async function DELETE(
  req: Request,
  { params }: { params: { id: string; imageId: string } }
) {
  try {
    // Await params to solve the Next.js dynamic route parameters issue
    const { id, imageId } = await params;
    
    const session = await getServerSession(authOptions);
    if (!session?.user.id) {
      return apiUnauthorized();
    }

    // First, check if the gallery exists and belongs to the user
    const gallery = await prisma.gallery.findUnique({
      where: { id },
      select: { userId: true },
    });

    if (!gallery) {
      return apiNotFound("Gallery not found");
    }

    if (gallery.userId !== session.user.id) {
      return apiUnauthorized();
    }

    // Check if the image exists in the gallery
    const imageInGallery = await prisma.imageInGallery.findUnique({
      where: { id: imageId },
    });

    if (!imageInGallery) {
      return apiNotFound("Image not found in gallery");
    }

    if (imageInGallery.galleryId !== id) {
      return apiError("Image does not belong to this gallery", 400);
    }

    // Delete the image from the gallery
    await prisma.imageInGallery.delete({
      where: { id: imageId },
    });

    // If this was the cover image, update the gallery to remove the cover image reference
    await prisma.gallery.update({
      where: { 
        id,
        coverImageId: imageInGallery.imageId, // Only update if this was the cover
      },
      data: { coverImageId: null },
    });

    // Return success with no content
    return apiSuccess({ success: true });
  } catch (error) {
    logger.error("Error removing image from gallery:", error);
    return apiError("Internal Server Error");
  }
}
