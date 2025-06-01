import { getServerSession } from "next-auth";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { authOptions } from "@/lib/auth";
import logger from "@/lib/logger";
import { apiSuccess, apiError, apiValidationError, apiUnauthorized, apiNotFound } from "@/lib/apiResponse";
import { UpdateGallerySchema } from "@/lib/schemas";

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

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
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
      return apiValidationError(queryValidation.error);
    }
    const imageFilters = queryValidation.data;

    const session = await getServerSession(authOptions);

    // Build the where clause for images within the gallery
    const imagesWhere: Prisma.ImageInGalleryWhereInput = {}; 
    
    const imageSubQuery: Prisma.ImageWhereInput = {}; 

    if (imageFilters.imageSearchQuery) {
      imageSubQuery.OR = [
        { title: { contains: imageFilters.imageSearchQuery } },
        { description: { contains: imageFilters.imageSearchQuery } },
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
      return apiNotFound("Gallery not found");
    }

    if (!gallery.isPublic && gallery.userId !== session?.user.id) {
      return apiUnauthorized();
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

    return apiSuccess(responseData);
  } catch (error) {
    logger.error("Error fetching gallery:", error);
    return apiError("Internal Server Error");
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> } // Corrected type for params
) {
  const session = await getServerSession(authOptions);
  const { id } = await params; // Added await here

  if (!session?.user.id) {
    return apiUnauthorized();
  }

  try {
    const body = await req.json();
    
    // Pre-validation check for common issues
    if (body.images && Array.isArray(body.images)) {
      // First make sure all IDs are valid strings
      const validImages = body.images.filter((img: { id?: string }) => typeof img.id === 'string' && img.id.length > 0);
      
      // Then fix any order issues
      body.images = validImages.map((img: { id: string; order?: unknown }, index: number) => {
        // Fix any non-integer or negative order values
        if (img.order !== undefined) {
          let orderValue: number;
          
          if (typeof img.order === 'number' && Number.isInteger(img.order) && img.order >= 0) {
            // Order is already a valid number
            orderValue = img.order;
          } else if (typeof img.order === 'string') {
            // Try to convert string to number
            const parsed = parseInt(img.order, 10);
            if (!isNaN(parsed) && parsed >= 0) {
              orderValue = parsed;
            } else {
              logger.warn(`Invalid string order "${img.order}" for image ${img.id}, fixing to ${index}`);
              orderValue = index;
            }
          } else {
            logger.warn(`Invalid order type ${typeof img.order} (${String(img.order)}) for image ${img.id}, fixing to ${index}`);
            orderValue = index;
          }
          
          return { ...img, order: orderValue };
        }
        
        return img;
      });
      
      // Double check that all orders are now valid
      const hasInvalidOrders = body.images.some((img: { id: string; order?: unknown }) => {
        return img.order !== undefined && 
          (typeof img.order !== 'number' || !Number.isInteger(img.order) || img.order < 0);
      });
      
      if (hasInvalidOrders) {
        logger.error("Critical: Still have invalid orders after fix attempt:", 
          body.images
            .filter((img: { id: string; order?: unknown }) => {
              return img.order !== undefined && 
                (typeof img.order !== 'number' || !Number.isInteger(img.order) || img.order < 0);
            })
            .map((img: { id: string; order?: unknown }) => ({ id: img.id, order: img.order }))
        );
        
        // Last resort fix - reassign all orders sequentially
        body.images = body.images.map((img: { id: string; order?: unknown }, idx: number) => ({ ...img, order: idx }));
      }
    }
    
    const validation = UpdateGallerySchema.safeParse(body);

    if (!validation.success) {
      logger.error("Gallery validation error:", JSON.stringify({
        errors: validation.error.errors,
        requestData: {
          images: body.images?.map((img: { id: string; order?: unknown }) => ({
            id: img.id,
            order: img.order !== undefined ? 
              `${typeof img.order}: ${String(img.order)}` : "undefined"
          }))
        }
      }, null, 2));
      return apiValidationError(validation.error);
    }

    const {
      title,
      description,
      isPublic,
      coverImageId, // This is string | null | undefined
      images: imagesDataFromValidation,
      addImages: addImagesFromValidation,
      themeColor,
      backgroundColor,
      backgroundImageUrl,
      accentColor,
      fontFamily,
      displayMode,
      layoutType
    } = validation.data;

    const gallery = await prisma.gallery.findUnique({
      where: { id: id },
      include: {
        images: true,
      },
    });

    if (!gallery) {
      return apiNotFound("Gallery not found");
    }

    if (gallery.userId !== session.user.id) {
      return apiUnauthorized();
    }

    const dataToUpdate: Prisma.GalleryUpdateInput = {};
    if (title !== undefined) dataToUpdate.title = title;
    if (description !== undefined) dataToUpdate.description = description;
    if (isPublic !== undefined) dataToUpdate.isPublic = isPublic;

    // Handle coverImage relation update based on coverImageId
    if (coverImageId !== undefined) {
      if (coverImageId === null) {
        dataToUpdate.coverImage = { disconnect: true };
      } else {
        dataToUpdate.coverImage = { connect: { id: coverImageId } };
      }
    }
    
    // Theming options from validated data
    // These assignments assume that schema.prisma is up-to-date and these fields exist on the Gallery model.
    // If TS errors persist here, it likely means `npx prisma generate` needs to be run or LSP is stale.
    if (themeColor !== undefined) dataToUpdate.themeColor = themeColor;
    if (backgroundColor !== undefined) dataToUpdate.backgroundColor = backgroundColor;
    if (backgroundImageUrl !== undefined) dataToUpdate.backgroundImageUrl = backgroundImageUrl;
    if (accentColor !== undefined) dataToUpdate.accentColor = accentColor;
    if (fontFamily !== undefined) dataToUpdate.fontFamily = fontFamily;
    if (displayMode !== undefined) dataToUpdate.displayMode = displayMode;
    if (layoutType !== undefined) dataToUpdate.layoutType = layoutType;
    
    // Perform the update for gallery fields (including theming and coverImage relation)
    await prisma.gallery.update({
      where: { id: id },
      data: dataToUpdate, 
    });

    // Handle image updates, additions, reordering, and removals using validated data
    if (imagesDataFromValidation) {
      const imageUpdates: Prisma.Prisma__ImageInGalleryClient<ImageInGallery, never>[] = [];
      const newImageLinks: Prisma.ImageInGalleryCreateManyInput[] = [];
      let maxOrder = gallery.images.length > 0
        ? Math.max(...gallery.images.map(img => (img as ImageInGalleryWithImage).order || 0))
        : -1;
      
      const tempImageMap = new Map<string, { imageId: string, description: string | null | undefined, order: number }>();
      
      // Create a set of IDs from the payload for quick lookup
      const updatedImageIds = new Set(imagesDataFromValidation
        .filter(imgData => !imgData.id.startsWith('temp-'))
        .map(imgData => imgData.id)
      );
      
      // Find images to remove (images in database but not in the payload)
      const imagesToRemove = gallery.images.filter(img => !updatedImageIds.has(img.id));
      
      // Add deletion operations to the transaction
      const imageRemovals = imagesToRemove.map(img => 
        prisma.imageInGallery.delete({ where: { id: img.id } })
      );
      
      if (imageRemovals.length > 0) {
        logger.log(`Removing ${imageRemovals.length} images from gallery ${id}`);
      }

      for (const imgData of imagesDataFromValidation) {
        if (imgData.id.startsWith('temp-') && imgData.imageId) {
          tempImageMap.set(imgData.id, {
            imageId: imgData.imageId,
            description: imgData.description,
            order: imgData.order !== undefined ? imgData.order : ++maxOrder,
          });
        } else {
          // Find the existing gallery image by its ID
          const existingImageInGallery = gallery.images.find(img => img.id === imgData.id);
          if (existingImageInGallery) {
            const currentOrder = (existingImageInGallery as ImageInGalleryWithImage).order || 0;
            // Make sure we have a valid non-negative integer for order
            let newOrder = currentOrder;
            if (imgData.order !== undefined) {
              // The schema validation should already catch non-integers, but let's be extra safe
              if (typeof imgData.order === 'number' && Number.isInteger(imgData.order) && imgData.order >= 0) {
                newOrder = imgData.order;
              } else {
                logger.warn(`Invalid order value ${imgData.order} for image ${imgData.id}, using current order ${currentOrder}`);
              }
            }
            
            imageUpdates.push(
              prisma.imageInGallery.update({
                where: { id: imgData.id },
                data: {
                  description: imgData.description,
                  order: newOrder,
                },
              })
            );
          }
        }
      }

      if (tempImageMap.size > 0) {
        tempImageMap.forEach(data => {
          newImageLinks.push({
            galleryId: id,
            imageId: data.imageId,
            description: data.description,
            order: data.order,
          });
        });
      }

      if (imageUpdates.length > 0 || newImageLinks.length > 0 || imageRemovals.length > 0) {
        await prisma.$transaction([
          ...imageUpdates,
          ...imageRemovals, // Include image removal operations
          ...(newImageLinks.length > 0 ? [prisma.imageInGallery.createMany({ data: newImageLinks })] : []),
        ]);
        logger.log(`Updated ${imageUpdates.length} images, removed ${imageRemovals.length} images, and created ${newImageLinks.length} new image links.`);
      }
    }

    if (addImagesFromValidation && addImagesFromValidation.length > 0) { // Use validated data
      const imagesToAddById = await prisma.image.findMany({
        where: {
          id: { in: addImagesFromValidation }, // Use validated data
          userId: session.user.id,
        },
      });

      if (imagesToAddById.length !== addImagesFromValidation.length) {
        logger.warn("Some images to add were not found or don't belong to the user.");
      }

      const currentMaxOrder = await prisma.imageInGallery.aggregate({
        _max: { order: true },
        where: { galleryId: id },
      });
      let nextOrder = (currentMaxOrder._max.order ?? -1) + 1;

      const newImagesInGalleryData = imagesToAddById.map((img) => ({
        galleryId: id,
        imageId: img.id,
        order: nextOrder++,
      }));

      if (newImagesInGalleryData.length > 0) {
        await prisma.imageInGallery.createMany({
          data: newImagesInGalleryData,
        });
        logger.log(`Added ${newImagesInGalleryData.length} new images to gallery.`);
      }
    }

    // The galleryUpdateData object is already constructed and used above.
    // The prisma.gallery.update call for these fields was also done.
    // This section can be removed if all fields are covered in the initial dataToUpdate.
    // For now, I'm commenting out the redundant update block as the fields are in dataToUpdate.
    /*
    const galleryUpdateData: Prisma.GalleryUpdateInput = {};
    if (title !== undefined) galleryUpdateData.title = title;
    if (description !== undefined) galleryUpdateData.description = description;
    if (isPublic !== undefined) galleryUpdateData.isPublic = isPublic;
    if (coverImageId !== undefined) galleryUpdateData.coverImageId = coverImageId;
    if (themeColor !== undefined) galleryUpdateData.themeColor = themeColor;
    if (backgroundColor !== undefined) galleryUpdateData.backgroundColor = backgroundColor;
    if (backgroundImageUrl !== undefined) galleryUpdateData.backgroundImageUrl = backgroundImageUrl;
    if (accentColor !== undefined) galleryUpdateData.accentColor = accentColor;
    if (fontFamily !== undefined) galleryUpdateData.fontFamily = fontFamily;
    if (displayMode !== undefined) galleryUpdateData.displayMode = displayMode;
    if (layoutType !== undefined) galleryUpdateData.layoutType = layoutType;

    await prisma.gallery.update({
      where: { id: id },
      data: galleryUpdateData,
    });
    */

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
    return apiSuccess(fullUpdatedGallery);
  } catch (err) {
    if (err instanceof z.ZodError) {
      logger.error("Validation error updating gallery:", err.errors);
      // Pass the ZodError instance directly
      return apiValidationError(err);
    }
    logger.error("Error updating gallery:", err);
    return apiError("Internal Server Error");
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
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

    await prisma.gallery.delete({
      where: { id: id },
    });

    return new Response(null, { status: 204 });
  } catch (error) {
    logger.error("Error deleting gallery:", error);
    return apiError("Internal Server Error");
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
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
      include: { 
        images: {
          include: {
            image: true
          }
        } 
      },
    });

    if (!gallery) {
      return apiNotFound("Gallery not found");
    }

    if (gallery.userId !== session.user.id) {
      return apiUnauthorized();
    }

    const requestBody = await req.json();
    const { imageIds } = requestBody;

    if (!imageIds || !Array.isArray(imageIds) || imageIds.length === 0) {
      return apiError("No images specified", 400);
    }

    // Check that the images belong to the user
    const userImages = await prisma.image.findMany({
      where: {
        id: { in: imageIds },
        userId: session.user.id
      }
    });
    
    if (userImages.length !== imageIds.length) {
      return apiError("Some images don't exist or don't belong to you", 400);
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

    return apiSuccess(updatedGallery);
  } catch (error) {
    logger.error("Error adding images to gallery:", error);
    return apiError("Internal Server Error");
  }
}
