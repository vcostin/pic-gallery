import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { authOptions } from "@/lib/auth";

const updateImageSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const image = await prisma.image.findUnique({
      where: { id: params.id },
    });

    if (!image) {
      return NextResponse.json({ error: "Image not found" }, { status: 404 });
    }

    if (image.userId !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const json = await req.json();
    const body = updateImageSchema.parse(json);

    const updatedImage = await prisma.image.update({
      where: { id: params.id },
      data: {
        title: body.title,
        description: body.description,
        tags: body.tags ? {
          deleteMany: {},
          create: body.tags.map(tag => ({
            name: tag,
          })),
        } : undefined,
      },
      include: {
        tags: true,
      },
    });

    return NextResponse.json(updatedImage);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
