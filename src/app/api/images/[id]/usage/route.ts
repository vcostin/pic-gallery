import { getServerSession } from "next-auth";
import { prisma } from "@/lib/db";
import { authOptions } from "@/lib/auth";
import { Gallery } from "@prisma/client";
import logger from "@/lib/logger";
import { apiSuccess, apiError, apiUnauthorized, apiNotFound } from "@/lib/apiResponse";

interface GalleryWithCoverImage extends Gallery {
  id: string;
  title: string;
  coverImageId: string | null;
}

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
      return apiNotFound("Image not found");
    }

    if (image.userId !== session.user.id) {
      return apiUnauthorized();
    }

    // Use raw query to find galleries using this image as cover
    const galleriesUsingAsCover = await prisma.$queryRaw<GalleryWithCoverImage[]>`
      SELECT * FROM "Gallery" 
      WHERE "coverImageId" = ${id} AND "userId" = ${session.user.id}
    `;

    // Return gallery usage information
    if (image.inGalleries.length > 0 || galleriesUsingAsCover.length > 0) {
      const galleriesFromRelations = image.inGalleries.map(ig => ig.gallery);
      const allGalleries = [
        ...galleriesFromRelations,
        ...galleriesUsingAsCover.filter(g => 
          !galleriesFromRelations.some(rg => rg.id === g.id)
        )
      ];
      
      return apiSuccess({
        galleries: allGalleries.map(g => ({
          id: g.id,
          title: g.title,
          isCover: galleriesUsingAsCover.some(cover => cover.id === g.id)
        }))
      });
    }

    // If not used in any galleries
    return apiSuccess({ 
      galleries: [] 
    });
  } catch (error) {
    logger.error("Error checking image usage:", error);
    return apiError("Internal Server Error");
  }
}
