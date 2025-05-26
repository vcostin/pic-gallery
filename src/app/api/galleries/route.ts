import { getServerSession } from "next-auth";
import { prisma } from "@/lib/db";
import { authOptions } from "@/lib/auth";
import { apiSuccess, withApiHandler } from "@/lib/apiResponse";
import { CreateGallerySchema } from "@/lib/schemas";

export const POST = withApiHandler(async (req) => {
  const session = await getServerSession(authOptions);
  if (!session?.user.id) {
    return apiSuccess(null, 401); // Or import and use apiUnauthorized if you want the helper
  }
  const json = await req.json();
  const body = CreateGallerySchema.parse(json);
  const gallery = await prisma.gallery.create({
    data: {
      title: body.title,
      description: body.description,
      isPublic: body.isPublic,
      userId: session.user.id,
      coverImageId: body.coverImageId,
      // Theming options
      themeColor: body.themeColor,
      backgroundColor: body.backgroundColor,
      backgroundImageUrl: body.backgroundImageUrl,
      accentColor: body.accentColor,
      fontFamily: body.fontFamily,
      displayMode: body.displayMode,
      layoutType: body.layoutType,
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
