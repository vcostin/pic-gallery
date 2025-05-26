import { getServerSession } from "next-auth";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { authOptions } from "@/lib/auth";
import logger from "@/lib/logger";
import { apiSuccess, apiError, apiUnauthorized } from "@/lib/apiResponse";

/**
 * E2E test data cleanup API endpoint
 * 
 * This endpoint is specifically designed for E2E tests to clean up test data
 * after tests have completed. It will only work if:
 * 1. The user is authenticated
 * 2. The user's email matches the E2E_TEST_USER_EMAIL environment variable
 * 
 * Query parameters:
 * - deleteUser: if "true", also deletes the user account (default: false)
 */
export async function DELETE(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id || !session?.user?.email) {
      logger.warn('E2E cleanup attempted without authentication');
      return apiUnauthorized();
    }

    // Check if this is actually the E2E test user
    const e2eTestEmail = process.env.E2E_TEST_USER_EMAIL || 'e2e-test@example.com';
    if (session.user.email !== e2eTestEmail) {
      logger.warn(`Unauthorized cleanup attempt by non-test user: ${session.user.email}`);
      return apiUnauthorized();
    }

    // Parse query parameters
    const url = new URL(req.url);
    const deleteUser = url.searchParams.get('deleteUser') === 'true';

    logger.log(`Starting E2E test data cleanup for user: ${session.user.email}${deleteUser ? ' (including user account)' : ''}`);

    // Initialize counters
    let galleryCount = 0;
    let galleryImageCount = 0;
    let imageCount = 0;
    let userDeleted = false;

    try {
      // Get all galleries owned by the test user
      const galleries = await prisma.gallery.findMany({
        where: { userId: session.user.id },
        include: { images: true }
      });

      // Count of items to be deleted for logging
      galleryCount = galleries.length;
      galleryImageCount = galleries.reduce((count, gallery) => count + gallery.images.length, 0);

      // First, delete all gallery-image relationships
      if (galleryCount > 0) {
        await prisma.imageInGallery.deleteMany({
          where: {
            galleryId: {
              in: galleries.map(gallery => gallery.id)
            }
          }
        });
      }

      // Then delete the galleries
      await prisma.gallery.deleteMany({
        where: { userId: session.user.id }
      });

      // Delete all images owned by the test user
      const result = await prisma.image.deleteMany({
        where: { userId: session.user.id }
      });
      imageCount = result.count;

      if (deleteUser) {
        try {
          // Delete the user account itself
          await prisma.user.delete({
            where: { id: session.user.id }
          });
          userDeleted = true;
          logger.log(`E2E test user account deleted: ${session.user.email}`);
        } catch (userDeleteError) {
          logger.error(`Failed to delete test user account: ${userDeleteError}`);
          // Continue with the response even if user deletion fails
        }
      }
    } catch (dbError) {
      logger.error("Database error during E2E test data cleanup:", dbError);
      return apiError("Database error during cleanup");
    }

    logger.log(`E2E test data cleanup complete for user: ${session.user.email}`);
    logger.log(`Deleted: ${galleryCount} galleries, ${galleryImageCount} gallery images, ${imageCount} images${userDeleted ? ', 1 user account' : ''}`);

    return apiSuccess({
      message: `E2E test data cleanup successful${userDeleted ? ' (including user account)' : ''}`,
      deletedCount: {
        galleries: galleryCount,
        galleryImages: galleryImageCount,
        images: imageCount,
        user: userDeleted ? 1 : 0
      }
    });
  } catch (error) {
    logger.error("Error during E2E test data cleanup:", error);
    return apiError("Internal Server Error during E2E test data cleanup");
  }
}
