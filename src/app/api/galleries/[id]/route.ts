import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { authOptions } from "@/lib/auth";

const updateGallerySchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  isPublic: z.boolean().optional(),
  coverImageId: z.string().optional(),
  images: z.array(z.object({
    id: z.string(),
    description: z.string().optional()
  })).optional(),
});

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Await params to solve the Next.js dynamic route parameters issue
    const { id } = await params;
    
    const session = await getServerSession(authOptions);
    const gallery = await prisma.gallery.findUnique({
      where: {
        id: id,
      },
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
    });

    if (!gallery) {
      return NextResponse.json({ error: "Gallery not found" }, { status: 404 });
    }

    if (!gallery.isPublic && gallery.userId !== session?.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json(gallery);
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Await params to solve the Next.js dynamic route parameters issue
    const { id } = await params;
    
    const session = await getServerSession(authOptions);
    if (!session?.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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
      return NextResponse.json({ error: "Gallery not found" }, { status: 404 });
    }

    if (gallery.userId !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const json = await req.json();
    console.log("Received update request:", JSON.stringify(json));
    const body = updateGallerySchema.parse(json);

    // Update gallery metadata
    const updateData: any = {
      title: body.title,
      description: body.description,
      isPublic: body.isPublic,
    };

    // If coverImageId is provided, set it in the Gallery table
    if (body.coverImageId) {
      updateData.coverImageId = body.coverImageId;
    }

    console.log("Updating gallery with data:", updateData);

    const updatedGallery = await prisma.gallery.update({
      where: { id: id },
      data: updateData,
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

    console.log("Gallery updated successfully");
    return NextResponse.json(updatedGallery);
  } catch (error) {
    console.error("Error updating gallery:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
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
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const gallery = await prisma.gallery.findUnique({
      where: { id: id },
    });

    if (!gallery) {
      return NextResponse.json({ error: "Gallery not found" }, { status: 404 });
    }

    if (gallery.userId !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await prisma.gallery.delete({
      where: { id: id },
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
