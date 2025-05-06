import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { authOptions } from "@/lib/auth";
import logger from "@/lib/logger";

const createGallerySchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(), // Gallery description can be undefined (if not provided) or a string
  isPublic: z.boolean().default(false),
  images: z.array(z.object({
    id: z.string(), // This is the Image ID
    description: z.string().nullable().optional(), // Image description can be null, undefined, or a string
    order: z.number().optional(),
  })).optional(),
  coverImageId: z.string().nullable().optional(),
});

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const json = await req.json();
    const body = createGallerySchema.parse(json);

    // First create the gallery
    const gallery = await prisma.gallery.create({
      data: {
        title: body.title,
        description: body.description,
        isPublic: body.isPublic,
        userId: session.user.id,
        coverImageId: body.coverImageId, // Save cover image ID
      },
    });

    // Then create the image associations if there are any images
    if (body.images && body.images.length > 0) {
      // Ensure images are sorted by order if provided, otherwise use index
      const sortedImages = body.images.sort((a, b) => (a.order ?? Infinity) - (b.order ?? Infinity));
      
      await prisma.imageInGallery.createMany({
        data: sortedImages.map((img, index) => ({
          imageId: img.id,
          galleryId: gallery.id,
          description: img.description,
          order: img.order ?? index, // Use provided order or fallback to index
        })),
      });
    }

    // Fetch the complete gallery with all relationships
    const completeGallery = await prisma.gallery.findUnique({
      where: { id: gallery.id },
      include: {
        images: {
          include: {
            image: {
              include: {
                tags: true,
              }
            }
          }
        }
      },
    });

    return NextResponse.json(completeGallery);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    logger.error('Gallery creation error:', error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const { searchParams } = new URL(req.url);
    const includePrivate = searchParams.get("includePrivate") === "true";
    
    const where = includePrivate && session?.user.id
      ? { OR: [{ isPublic: true }, { userId: session.user.id }] }
      : { isPublic: true };

    const galleries = await prisma.gallery.findMany({
      where,
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
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(galleries);
  } catch {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
