import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ImageGrid } from "@/components/ImageGrid";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export default async function ImagesPage() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    redirect("/api/auth/signin");
  }

  const images = await prisma.image.findMany({
    where: {
      userId: session.user.id,
    },
    include: {
      tags: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">My Images</h1>
        <Link 
          href="/images/upload" 
          className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-md transition-colors"
        >
          Upload New Image
        </Link>
      </div>
      <ImageGrid images={images} />
    </div>
  );
}
