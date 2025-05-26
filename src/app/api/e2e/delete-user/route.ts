import { z } from "zod";
import { prisma } from "@/lib/db";
import logger from "@/lib/logger";
import { apiSuccess, apiError, apiValidationError } from "@/lib/apiResponse";

/**
 * E2E test user deletion API endpoint
 * 
 * This endpoint is specifically designed for E2E tests to delete test users
 * It can delete users by email without requiring authentication
 * (for setup/teardown purposes in tests)
 */

const deleteUserSchema = z.object({
  email: z.string().email(),
});

export async function DELETE(req: Request) {
  try {
    // Only allow this in development/test environment
    if (process.env.NODE_ENV === 'production' && process.env.NEXT_PUBLIC_ENABLE_E2E_TEST_FEATURES !== 'true') {
      logger.warn('E2E delete-user endpoint called in production');
      return apiError("Not available in production", 403);
    }

    const body = await req.json();
    
    // Validate request body
    const validation = deleteUserSchema.safeParse(body);
    if (!validation.success) {
      return apiValidationError(validation.error);
    }

    const { email } = validation.data;

    // Only allow deletion of E2E test users (emails that contain 'e2e' or match the configured test email)
    const e2eTestEmail = process.env.E2E_TEST_USER_EMAIL || 'e2e-test@example.com';
    if (!email.includes('e2e') && email !== e2eTestEmail) {
      logger.warn(`Attempted to delete non-E2E user: ${email}`);
      return apiError("Can only delete E2E test users", 403);
    }

    logger.log(`Attempting to delete E2E test user: ${email}`);

    // Find the user
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      logger.log(`E2E test user not found: ${email}`);
      return apiSuccess({
        message: "User not found (already deleted or never existed)",
        deleted: false
      });
    }

    // Delete user data in the correct order to handle foreign key constraints
    try {
      // First, delete all gallery-image relationships for galleries owned by this user
      const userGalleries = await prisma.gallery.findMany({
        where: { userId: user.id },
        select: { id: true }
      });

      if (userGalleries.length > 0) {
        await prisma.imageInGallery.deleteMany({
          where: {
            galleryId: {
              in: userGalleries.map(g => g.id)
            }
          }
        });
      }

      // Delete galleries owned by the user
      await prisma.gallery.deleteMany({
        where: { userId: user.id }
      });

      // Delete images owned by the user
      await prisma.image.deleteMany({
        where: { userId: user.id }
      });

      // Delete any accounts linked to the user
      await prisma.account.deleteMany({
        where: { userId: user.id }
      });

      // Finally, delete the user
      await prisma.user.delete({
        where: { id: user.id }
      });

      logger.log(`E2E test user deleted successfully: ${email}`);

      return apiSuccess({
        message: "E2E test user deleted successfully",
        deleted: true,
        email: email
      });

    } catch (dbError) {
      logger.error(`Database error while deleting E2E test user ${email}:`, dbError);
      return apiError("Database error during user deletion");
    }

  } catch (error) {
    logger.error("Error in E2E delete-user endpoint:", error);
    return apiError("Internal Server Error");
  }
}

// Also support POST method for compatibility
export const POST = DELETE;
