import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { apiSuccess, apiError } from '@/lib/apiResponse';

/**
 * DELETE /api/tags/[id] - Delete a tag
 */
export async function DELETE(
  req: NextRequest, 
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return apiError('Unauthorized', 401);
    }

    const { id: tagId } = await params;

    // Check if the tag exists and belongs to user's images
    const tag = await prisma.tag.findFirst({
      where: {
        id: tagId,
        images: {
          some: {
            userId: session.user.id
          }
        }
      }
    });

    if (!tag) {
      return apiError('Tag not found or unauthorized', 404);
    }

    // Delete the tag
    await prisma.tag.delete({
      where: { id: tagId }
    });

    return apiSuccess({ message: 'Tag deleted successfully' });
  } catch (error) {
    console.error('Error deleting tag:', error);
    return apiError('Failed to delete tag', 500);
  }
}
