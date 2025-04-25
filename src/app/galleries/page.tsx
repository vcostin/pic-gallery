import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { CreateGallery } from "@/components/CreateGallery";
import { GalleryGrid } from "@/components/GalleryGrid";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export default async function GalleriesPage() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    redirect("/api/auth/signin");
  }

  const galleries = await prisma.gallery.findMany({
    where: {
      userId: session.user.id,
    },
    include: {
      images: {
        include: {
          image: {
            include: {
              tags: true,
            },
          },
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  const images = await prisma.image.findMany({
    where: {
      userId: session.user.id,
    },
    include: {
      tags: true,
    },
  });

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">My Galleries</h1>
      <div className="mb-8">
        <CreateGallery availableImages={images} />
      </div>
      <GalleryGrid galleries={galleries} isOwner={true} />
    </div>
  );
}
