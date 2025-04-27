import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { authOptions } from "@/lib/auth";

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = await params;

    const session = await getServerSession(authOptions);
    if (!session?.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if the image exists and belongs to the current user
    const image = await prisma.image.findUnique({
      where: { id },
      include: {
        inGalleries: {
          include: {
            gallery: true
          }
        }
      }
    });

    if (!image) {
      return NextResponse.json({ error: "Image not found" }, { status: 404 });
    }

    if (image.userId !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if the image is used as a cover image for any galleries
    const galleriesUsingAsCover = await prisma.gallery.findMany({
      where: {
        coverImageId: id
      }
    });

    // Return gallery usage information
    if (image.inGalleries.length > 0 || galleriesUsingAsCover.length > 0) {
      const galleries = [
        ...image.inGalleries.map(ig => ig.gallery),
        ...galleriesUsingAsCover.filter(g => 
          !image.inGalleries.some(ig => ig.galleryId === g.id)
        )
      ];
      
      return NextResponse.json({
        galleries: galleries.map(g => ({
          id: g.id,
          title: g.title,
          isCover: galleriesUsingAsCover.some(cover => cover.id === g.id)
        }))
      });
    }

    // If not used in any galleries
    return NextResponse.json({ 
      galleries: [] 
    });
  } catch (error) {
    console.error("Error checking image usage:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
