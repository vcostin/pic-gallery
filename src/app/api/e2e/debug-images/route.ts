import { getServerSession } from "next-auth";
import { prisma } from "@/lib/db";
import { authOptions } from "@/lib/auth";
import { apiSuccess, apiUnauthorized, withApiHandler } from "@/lib/apiResponse";

/**
 * Debug endpoint to check what images exist in the database
 */
export const GET = withApiHandler(async () => {
  const session = await getServerSession(authOptions);
  if (!session?.user.id) {
    return apiUnauthorized();
  }

  // Get all images for this user
  const userImages = await prisma.image.findMany({
    where: { userId: session.user.id },
    select: { id: true, title: true, userId: true, createdAt: true }
  });

  // Get total image count (all users)
  const totalImages = await prisma.image.count();

  // Get all images (for debugging)
  const allImages = await prisma.image.findMany({
    select: { id: true, title: true, userId: true, createdAt: true },
    orderBy: { createdAt: 'desc' },
    take: 10
  });

  return apiSuccess({
    sessionUserId: session.user.id,
    userImagesCount: userImages.length,
    userImages,
    totalImagesCount: totalImages,
    recentImages: allImages
  });
});
