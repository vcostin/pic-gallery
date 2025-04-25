import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { UploadImage } from "@/components/UploadImage";
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
      <h1 className="text-3xl font-bold mb-8">My Images</h1>
      <div className="mb-8">
        <UploadImage />
      </div>
      <ImageGrid images={images} />
    </div>
  );
}
