/**
 * API route for updating image order in a gallery
 */
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import logger from '@/lib/logger';
import { NextResponse } from 'next/server';

// Create a new PrismaClient instance
const prisma = new PrismaClient();

// Schema for validating the request body
const ImageOrderSchema = z.object({
  id: z.string(),
  order: z.number().int().min(0)
});

const UpdateImageOrderSchema = z.object({
  images: z.array(ImageOrderSchema)
});

// Helper function for API error responses
const apiError = (message: string, status = 400) => {
  return NextResponse.json({ error: message }, { status });
};

/**
 * Update the order of images in a gallery
 */
export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return apiError('Authentication required', 401);
    }

    const { id } = params;
    if (!id) {
      return apiError('Gallery ID is required', 400);
    }

    // Check if gallery exists and belongs to the current user
    const gallery = await prisma.gallery.findUnique({
      where: {
        id: id,
        userId: session.user.id
      },
      include: {
        images: {
          select: {
            id: true,
            imageId: true,
            order: true
          }
        }
      }
    });

    if (!gallery) {
      return apiError('Gallery not found or access denied', 404);
    }

    // Parse and validate request body
    let requestData;
    try {
      const body = await req.json();
      requestData = UpdateImageOrderSchema.parse(body);
    } catch (error) {
      logger.error('Invalid request data for updating image order:', error);
      return apiError('Invalid request data');
    }

    // Validate that all images exist in the gallery
    const imageIds = requestData.images.map(img => img.id);
    const existingIds = gallery.images.map((img: { id: string }) => img.id);
    const invalidIds = imageIds.filter(id => !existingIds.includes(id));

    if (invalidIds.length > 0) {
      return apiError(`Some images don't exist in this gallery: ${invalidIds.join(', ')}`);
    }

    // Update the order of each image
    const updatePromises = requestData.images.map(img =>
      prisma.imageInGallery.update({
        where: {
          id: img.id,
          galleryId: id
        },
        data: {
          order: img.order
        }
      })
    );

    await Promise.all(updatePromises);

    // Get updated gallery with all related data
    const updatedGallery = await prisma.gallery.findUnique({
      where: { id: id },
      include: {
        images: {
          orderBy: {
            order: 'asc'
          },
          include: {
            image: {
              include: {
                tags: true
              }
            }
          }
        },
        user: {
          select: {
            id: true,
            name: true,
            image: true
          }
        },
        coverImage: true
      }
    });

    if (!updatedGallery) {
      return apiError('Failed to retrieve updated gallery', 500);
    }

    // Return the updated gallery
    return NextResponse.json(updatedGallery, { status: 200 });
  } catch (error) {
    logger.error('Error updating image order:', error);
    return apiError('Error updating image order', 500);
  }
}
