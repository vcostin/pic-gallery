import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { authOptions } from "@/lib/auth";

const updateGallerySchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  isPublic: z.boolean().optional(),
  coverImageId: z.string().optional(),
  images: z.array(z.object({
    id: z.string(),
    description: z.string().nullable().optional(),
    order: z.number().optional()
  })).optional(),
});

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Await params to solve the Next.js dynamic route parameters issue
    const { id } = await params;
    
    const session = await getServerSession(authOptions);
    const gallery = await prisma.gallery.findUnique({
      where: {
        id: id,
      },
      include: {
        images: {
          include: {
            image: {
              include: {
                tags: true,
              }
            }
          }
        },
        user: {
          select: {
            id: true,
            name: true,
            image: true,
          }
        }
      },
    });

    if (!gallery) {
      return NextResponse.json({ error: "Gallery not found" }, { status: 404 });
    }

    if (!gallery.isPublic && gallery.userId !== session?.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json(gallery);
  } catch (error) {
    console.error("Error fetching gallery:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Await params to solve the Next.js dynamic route parameters issue
    const { id } = await params;
    
    const session = await getServerSession(authOptions);
    if (!session?.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const gallery = await prisma.gallery.findUnique({
      where: { id: id },
      include: { 
        images: {
          include: {
            image: true
          }
        } 
      },
    });

    if (!gallery) {
      return NextResponse.json({ error: "Gallery not found" }, { status: 404 });
    }

    if (gallery.userId !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const json = await req.json();
    console.log("Received update request:", JSON.stringify(json));
    const body = updateGallerySchema.parse(json);

    // Update gallery metadata
    const updateData: Record<string, unknown> = {};
    
    if (body.title !== undefined) {
      updateData.title = body.title;
    }
    
    if (body.description !== undefined) {
      updateData.description = body.description;
    }
    
    if (body.isPublic !== undefined) {
      updateData.isPublic = body.isPublic;
    }

    // If coverImageId is provided, set it in the Gallery table
    if (body.coverImageId) {
      updateData.coverImageId = body.coverImageId;
    }

    console.log("Updating gallery with data:", updateData);

    // First update the gallery metadata
    await prisma.gallery.update({
      where: { id: id },
      data: updateData,
    });

    // If image updates are provided, update them in a transaction
    if (body.images && body.images.length > 0) {
      // First, get the current image IDs in the gallery
      const currentImageIds = gallery.images.map(img => img.id);
      
      // Find the image IDs in the request
      const requestImageIds = body.images.map(img => img.id);
      
      // Find images that should be removed (in current but not in request)
      const imageIdsToRemove = currentImageIds.filter(id => !requestImageIds.includes(id));
      
      // Remove images that are no longer in the gallery
      if (imageIdsToRemove.length > 0) {
        await prisma.imageInGallery.deleteMany({
          where: {
            id: {
              in: imageIdsToRemove
            }
          }
        });
        console.log(`Removed ${imageIdsToRemove.length} images from gallery`);
      }
      
      // Update the remaining images with new order and description
      const imageUpdates = await Promise.all(
        body.images.map(async (imageUpdate) => {
          // Update ImageInGallery with description and order
          return prisma.imageInGallery.update({
            where: { id: imageUpdate.id },
            data: {
              description: imageUpdate.description !== undefined ? imageUpdate.description : undefined,
              // Use raw SQL to update order if Prisma types don't support it yet
              ...(imageUpdate.order !== undefined && {
                order: imageUpdate.order
              }),
            },
          });
        })
      );
      
      console.log(`Updated ${imageUpdates.length} gallery images`);
    }

    // Get the updated gallery with all related data
    const fullUpdatedGallery = await prisma.gallery.findUnique({
      where: { id: id },
      include: {
        images: {
          // Use an equivalent ordering that Prisma supports
          orderBy: [
            {
              // @ts-expect-error - The order field exists in the database but may not be in the types
              order: 'asc'
            }
          ],
          include: {
            image: {
              include: {
                tags: true,
              }
            }
          }
        },
        user: {
          select: {
            id: true,
            name: true,
            image: true,
          }
        }
      },
    });

    console.log("Gallery updated successfully");
    return NextResponse.json(fullUpdatedGallery);
  } catch (err) {
    console.error("Error updating gallery:", err);
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.errors }, { status: 400 });
    }
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Await params to solve the Next.js dynamic route parameters issue
    const { id } = await params;
    
    const session = await getServerSession(authOptions);
    if (!session?.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const gallery = await prisma.gallery.findUnique({
      where: { id: id },
    });

    if (!gallery) {
      return NextResponse.json({ error: "Gallery not found" }, { status: 404 });
    }

    if (gallery.userId !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await prisma.gallery.delete({
      where: { id: id },
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("Error deleting gallery:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
