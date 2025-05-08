import { getServerSession } from "next-auth";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { authOptions } from "@/lib/auth";
import logger from "@/lib/logger";
import { apiSuccess, apiError, apiValidationError, apiUnauthorized, apiNotFound } from "@/lib/apiResponse";

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
  // Theming options
  themeColor: z.string().optional().nullable(),
  backgroundColor: z.string().optional().nullable(),
  backgroundImageUrl: z.string().url().optional().nullable(),
  accentColor: z.string().optional().nullable(),
  fontFamily: z.string().optional().nullable(),
  displayMode: z.string().optional().nullable(),
  layoutType: z.string().optional().nullable(),
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
      return apiValidationError(queryValidation.error);
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
  { params }: { params: { id: string } } // Corrected type for params
) {
  const session = await getServerSession(authOptions);
  const { id } = params; // No await needed for params directly

  if (!session?.user.id) {
    return apiUnauthorized();
  }

  try {
    const body = await req.json();
    const validation = updateGallerySchema.safeParse(body);

    if (!validation.success) {
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

    // Handle image updates, additions, and reordering using validated data
    if (imagesDataFromValidation) {
      const imageUpdates: Prisma.Prisma__ImageInGalleryClient<ImageInGallery, never>[] = [];
      const newImageLinks: Prisma.ImageInGalleryCreateManyInput[] = [];
      let maxOrder = gallery.images.length > 0
        ? Math.max(...gallery.images.map(img => (img as ImageInGalleryWithImage).order || 0))
        : -1;

      const tempImageMap = new Map<string, { imageId: string, description: string | null | undefined, order: number }>();

      for (const imgData of imagesDataFromValidation) { // Use validated data
        if (imgData.id.startsWith('temp-') && imgData.imageId) {
          tempImageMap.set(imgData.id, {
            imageId: imgData.imageId,
            description: imgData.description,
            order: imgData.order !== undefined ? imgData.order : ++maxOrder,
          });
        } else {
          const existingImageInGallery = gallery.images.find(img => img.id === imgData.id);
          if (existingImageInGallery) {
            imageUpdates.push(
              prisma.imageInGallery.update({
                where: { id: imgData.id },
                data: {
                  description: imgData.description,
                  order: imgData.order,
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

      if (imageUpdates.length > 0 || newImageLinks.length > 0) {
        await prisma.$transaction([
          ...imageUpdates,
          ...(newImageLinks.length > 0 ? [prisma.imageInGallery.createMany({ data: newImageLinks })] : []),
        ]);
        logger.log(`Updated ${imageUpdates.length} images and created ${newImageLinks.length} new image links.`);
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
  { params }: { params: { id: string } }
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
  { params }: { params: { id: string } }
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
