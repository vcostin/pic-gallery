import { getServerSession } from "next-auth";
import { notFound } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { GalleryView } from "@/components/GalleryView";

export default async function GalleryPage({
  params,
}: {
  params: { id: string };
}) {
  // Await params to solve the Next.js dynamic route parameters issue
  const { id } = await params;
  
  const session = await getServerSession(authOptions);
  const gallery = await prisma.gallery.findUnique({
    where: {
      id: id,
    },
    include: {
      images: {
        orderBy: {
          order: 'asc' // Ensure images are sorted by order field
        },
        include: {
          image: {
            include: {
              tags: true,
            },
          },
        },
      },
      user: {
        select: {
          id: true,
          name: true,
          image: true,
        },
      },
    },
  });

  if (!gallery) {
    notFound();
  }

  if (!gallery.isPublic && gallery.userId !== session?.user?.id) {
    notFound();
  }

  const isOwner = session?.user?.id === gallery.userId;

  return <GalleryView gallery={gallery} isOwner={isOwner} />;
}
