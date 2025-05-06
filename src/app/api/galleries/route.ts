import { getServerSession } from "next-auth";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { authOptions } from "@/lib/auth";
import { apiSuccess, withApiHandler } from "@/lib/apiResponse";

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

export const POST = withApiHandler(async (req) => {
  const session = await getServerSession(authOptions);
  if (!session?.user.id) {
    return apiSuccess(null, 401); // Or import and use apiUnauthorized if you want the helper
  }
  const json = await req.json();
  const body = createGallerySchema.parse(json);
  const gallery = await prisma.gallery.create({
    data: {
      title: body.title,
      description: body.description,
      isPublic: body.isPublic,
      userId: session.user.id,
      coverImageId: body.coverImageId,
    },
  });
  if (body.images && body.images.length > 0) {
    const sortedImages = body.images.sort((a, b) => (a.order ?? Infinity) - (b.order ?? Infinity));
    await prisma.imageInGallery.createMany({
      data: sortedImages.map((img, index) => ({
        imageId: img.id,
        galleryId: gallery.id,
        description: img.description,
        order: img.order ?? index,
      })),
    });
  }
  const completeGallery = await prisma.gallery.findUnique({
    where: { id: gallery.id },
    include: {
      images: {
        include: {
          image: { include: { tags: true } }
        }
      }
    },
  });
  return apiSuccess(completeGallery);
});

export const GET = withApiHandler(async (req) => {
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
          image: { include: { tags: true } }
        }
      },
      user: { select: { id: true, name: true, image: true } }
    },
    orderBy: { createdAt: "desc" },
  });
  return apiSuccess(galleries);
});
