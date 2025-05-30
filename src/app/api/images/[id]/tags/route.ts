import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { apiSuccess, apiError } from '@/lib/apiResponse';
import { z } from 'zod';

const UpdateImageTagsSchema = z.object({
  tagIds: z.array(z.string())
});

/**
 * PATCH /api/images/[id]/tags - Update image tags
 */
export async function PATCH(
  req: NextRequest, 
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return apiError('Unauthorized', 401);
    }

    const { id: imageId } = await params;
    const body = await req.json();
    
    const { tagIds } = UpdateImageTagsSchema.parse(body);

    // Check if the image exists and belongs to the user
    const existingImage = await prisma.image.findFirst({
      where: {
        id: imageId,
        userId: session.user.id
      }
    });

    if (!existingImage) {
      return apiError('Image not found or unauthorized', 404);
    }

    // Update the image tags
    const updatedImage = await prisma.image.update({
      where: { id: imageId },
      data: {
        tags: {
          set: tagIds.map(id => ({ id }))
        }
      },
      include: {
        tags: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    return apiSuccess(updatedImage);
  } catch (error) {
    console.error('Error updating image tags:', error);
    if (error instanceof z.ZodError) {
      return apiError('Invalid request data', 400);
    }
    return apiError('Failed to update image tags', 500);
  }
}
