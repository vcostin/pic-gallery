import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { authOptions } from "@/lib/auth";
import { ImageInGallery, Image } from "@prisma/client";

type ImageInGalleryWithImage = ImageInGallery & {
  image: Image;
  order: number;
};

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
  // New field for adding images
  addImages: z.array(z.string()).optional(),
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
          },
          orderBy: {
            order: 'asc'
          }
        },
        coverImage: true,
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

    // Handle case where coverImage was deleted but coverImageId still exists
    if (gallery.coverImageId && !gallery.coverImage) {
      // Update gallery to remove the coverImageId reference
      await prisma.gallery.update({
        where: { id: gallery.id },
        data: { coverImageId: null }
      });
      
      // Remove coverImageId from the response
      gallery.coverImageId = null;
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

    // Handle adding new images to the gallery if addImages is provided
    if (body.addImages && body.addImages.length > 0) {
      console.log(`Adding ${body.addImages.length} new images to gallery`);
      
      // Get the current highest order value
      const maxOrder = gallery.images.length > 0
        ? Math.max(...gallery.images.map(img => (img as ImageInGalleryWithImage).order || 0))
        : -1;
      
      // Check that the images belong to the user
      const userImages = await prisma.image.findMany({
        where: {
          id: { in: body.addImages },
          userId: session.user.id
        }
      });
      
      if (userImages.length !== body.addImages.length) {
        return NextResponse.json({ 
          error: "Some images don't exist or don't belong to you" 
        }, { status: 400 });
      }
      
      // Add images to the gallery with incrementing order values
      await Promise.all(
        userImages.map(async (image, index) => {
          await prisma.imageInGallery.create({
            data: {
              galleryId: id,
              imageId: image.id,
              order: maxOrder + index + 1,
            }
          });
        })
      );
    }

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
          orderBy: {
            order: 'asc'
          },
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
