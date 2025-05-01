import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Link from "next/link";
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

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">My Galleries</h1>
        <Link
          href="/galleries/create"
          className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
        >
          Create New Gallery
        </Link>
      </div>
      <GalleryGrid galleries={galleries} isOwner={true} />
    </div>
  );
}
