import { getServerSession } from "next-auth";
import { prisma } from "@/lib/db";
import { authOptions } from "@/lib/auth";
import logger from "@/lib/logger";
import { apiSuccess, apiError, apiUnauthorized, apiNotFound } from "@/lib/apiResponse";

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Await params to solve the Next.js dynamic route parameters issue
    const { id } = await params;
    
    const session = await getServerSession(authOptions);
    if (!session?.user.id) {
      return apiUnauthorized();
    }

    const gallery = await prisma.gallery.findUnique({
      where: { id: id },
    });

    if (!gallery) {
      return apiNotFound("Gallery not found");
    }

    if (gallery.userId !== session.user.id) {
      return apiUnauthorized();
    }

    // Delete all image associations first
    await prisma.imageInGallery.deleteMany({
      where: { galleryId: id },
    });

    // Then delete the gallery
    await prisma.gallery.delete({
      where: { id: id },
    });

    return apiSuccess({ message: "Gallery deleted successfully" });
  } catch (error) {
    logger.error("Error deleting gallery:", error);
    return apiError("Internal Server Error");
  }
}
