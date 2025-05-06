import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { authOptions } from "@/lib/auth";
import logger from "@/lib/logger";

import { ImageInGallery, Image, Prisma } from "@prisma/client";

type ImageInGalleryWithImage = ImageInGallery & {
  image: Image;
  order: number;
};

// Schema for query parameters for fetching gallery images
const getGalleryImagesQuerySchema = z.object({
  imageSearchQuery: z.string().optional(),
  imageTag: z.string().optional(),
  // Potentially add sortBy, sortDir for images within gallery later
});

const updateGallerySchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  isPublic: z.boolean().optional(),
  coverImageId: z.string().nullable().optional(),
  images: z.array(z.object({
    id: z.string(),
    imageId: z.string().optional(), // Add imageId for temp images
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
    const { searchParams } = new URL(req.url);

    const queryValidation = getGalleryImagesQuerySchema.safeParse({
      imageSearchQuery: searchParams.get("imageSearchQuery") || undefined,
      imageTag: searchParams.get("imageTag") || undefined,
    });

    if (!queryValidation.success) {
      return NextResponse.json({ error: "Invalid query parameters for image search", details: queryValidation.error.format() }, { status: 400 });
    }
    const imageFilters = queryValidation.data;

    const session = await getServerSession(authOptions);

    // Build the where clause for images within the gallery
    const imagesWhere: Prisma.ImageInGalleryWhereInput = {}; 
    
    const imageSubQuery: Prisma.ImageWhereInput = {}; 

    if (imageFilters.imageSearchQuery) {
      imageSubQuery.OR = [
        { title: { contains: imageFilters.imageSearchQuery, mode: 'insensitive' } },
        { description: { contains: imageFilters.imageSearchQuery, mode: 'insensitive' } },
      ];
    }

    if (imageFilters.imageTag) {
      imageSubQuery.tags = {
        some: { name: imageFilters.imageTag },
      };
    }

    if (Object.keys(imageSubQuery).length > 0) {
      imagesWhere.image = imageSubQuery;
    }

    const gallery = await prisma.gallery.findUnique({
      where: {
        id: id,
      },
      include: {
        images: {
          where: Object.keys(imagesWhere).length > 0 ? imagesWhere : undefined, // Apply filters only if they exist
          include: {
            image: {
              include: {
                tags: true,
              },
            },
          },
          orderBy: {
            order: 'asc',
          },
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

    // If coverImageId exists, fetch the cover image separately
    let coverImage = null;
    if (gallery.coverImageId) {
      coverImage = await prisma.image.findUnique({
        where: { id: gallery.coverImageId },
        include: { tags: true }
      });
      
      // If cover image doesn't exist anymore, remove the reference
      if (!coverImage) {
        await prisma.gallery.update({
          where: { id: gallery.id },
          data: { coverImageId: null }
        });
        gallery.coverImageId = null;
      }
    }

    // Add the cover image to the response if it exists
    const responseData = {
      ...gallery,
      coverImage
    };

    return NextResponse.json(responseData);
  } catch (error) {
    logger.error("Error fetching gallery:", error);
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
    logger.log("Received update request:", JSON.stringify(json));
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

    // Handle cover image updates - properly handle null/empty cases
    if (body.coverImageId !== undefined) {
      // If coverImageId is an empty string or null, set it to null in the database
      updateData.coverImageId = body.coverImageId || null;
    }

    logger.log("Updating gallery with data:", updateData);

    // First update the gallery metadata
    await prisma.gallery.update({
      where: { id: id },
      data: updateData,
    });

    // Handle adding new images to the gallery if addImages is provided
    if (body.addImages && body.addImages.length > 0) {
      logger.log(`Adding ${body.addImages.length} new images to gallery`);
      
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

    // If image updates are provided (including empty arrays for removing all images)
    if (body.images !== undefined) {
      // First, get the current image IDs in the gallery
      const currentImageIds = gallery.images.map(img => img.id);
      
      // If body.images is empty, it means all images should be removed
      if (body.images.length === 0) {
        // Remove all images from the gallery
        await prisma.imageInGallery.deleteMany({
          where: {
            galleryId: id
          }
        });
        logger.log(`Removed all images from gallery ${id}`);
      } else {
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
          logger.log(`Removed ${imageIdsToRemove.length} images from gallery`);
        }
        
        // Separate permanent images from temporary ones
        const permanentImages = body.images.filter(img => !img.id.startsWith('temp-'));
        const tempImages = body.images.filter(img => img.id.startsWith('temp-'));
        
        // Update the existing permanent images
        if (permanentImages.length > 0) {
          const imageUpdates = await Promise.all(
            permanentImages.map(async (imageUpdate) => {
              try {
                logger.log(`Updating image ${imageUpdate.id} with order ${imageUpdate.order}`);
                // Update ImageInGallery with description and order
                return prisma.imageInGallery.update({
                  where: { id: imageUpdate.id },
                  data: {
                    description: imageUpdate.description !== undefined ? imageUpdate.description : undefined,
                    // Ensure order is always updated with the new value
                    order: imageUpdate.order
                  },
                });
              } catch (error) {
                logger.error(`Error updating image ${imageUpdate.id}:`, error);
                return null;
              }
            })
          );
          
          logger.log(`Updated ${imageUpdates.filter(Boolean).length} gallery images`);
        }
        
        // Handle temporary images - these need to be created
        if (tempImages.length > 0) {
          logger.log(`Creating ${tempImages.length} new gallery images`);
          
          // For temp images, create new ImageInGallery records
          await Promise.all(
            tempImages.map(async (tempImg) => {
              // Log the entire tempImg object for debugging
              logger.log(`Processing temp image: ${JSON.stringify(tempImg)}`);
              
              // Only process if imageId is provided
              if (!tempImg.imageId) {
                logger.error(`Missing imageId for temp image ${tempImg.id}`);
                return null;
              }
              
              try {
                // Create a new ImageInGallery record
                return prisma.imageInGallery.create({
                  data: {
                    galleryId: id,
                    imageId: tempImg.imageId,
                    order: tempImg.order || 0,
                    description: tempImg.description,
                  }
                });
              } catch (error) {
                logger.error(`Error creating image from temp ${tempImg.id}:`, error);
                return null;
              }
            })
          );
          
          logger.log(`Created ${tempImages.length} new gallery images`);
        }
      }
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

    logger.log("Gallery updated successfully");
    return NextResponse.json(fullUpdatedGallery);
  } catch (err) {
    logger.error("Error updating gallery:", err);
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
    logger.error("Error deleting gallery:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(
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

    const requestBody = await req.json();
    const { imageIds } = requestBody;

    if (!imageIds || !Array.isArray(imageIds) || imageIds.length === 0) {
      return NextResponse.json({ error: "No images specified" }, { status: 400 });
    }

    // Check that the images belong to the user
    const userImages = await prisma.image.findMany({
      where: {
        id: { in: imageIds },
        userId: session.user.id
      }
    });
    
    if (userImages.length !== imageIds.length) {
      return NextResponse.json({ 
        error: "Some images don't exist or don't belong to you" 
      }, { status: 400 });
    }

    // Get the current highest order value
    const maxOrder = gallery.images.length > 0
      ? Math.max(...gallery.images.map(img => (img as ImageInGalleryWithImage).order || 0))
      : -1;
    
    // Add images to the gallery with incrementing order values
    await Promise.all(
      userImages.map(async (image, index) => {
        // Check if the image is already in the gallery
        const existingImage = gallery.images.find(img => img.imageId === image.id);
        if (!existingImage) {
          await prisma.imageInGallery.create({
            data: {
              galleryId: id,
              imageId: image.id,
              order: maxOrder + index + 1,
            }
          });
        }
      })
    );

    // If this is the first image and the gallery has no cover image, set it as the cover
    if (gallery.images.length === 0 && !gallery.coverImageId && userImages.length > 0) {
      await prisma.gallery.update({
        where: { id: id },
        data: { coverImageId: userImages[0].id }
      });
    }

    // Get the updated gallery with all related data
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
            image: true,
          }
        }
      },
    });

    return NextResponse.json(updatedGallery);
  } catch (error) {
    logger.error("Error adding images to gallery:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
