import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { authOptions } from "@/lib/auth";

const createImageSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  url: z.string().min(1), // Accept any non-empty string instead of requiring URL format
  tags: z.array(z.string()).optional(),
});

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const json = await req.json();
    const body = createImageSchema.parse(json);

    const image = await prisma.image.create({
      data: {
        title: body.title,
        description: body.description,
        url: body.url,
        userId: session.user.id,
        tags: body.tags ? {
          connectOrCreate: body.tags.map(tag => ({
            where: { name: tag },
            create: { name: tag },
          }))
        } : undefined,
      },
      include: {
        tags: true,
      },
    });

    return NextResponse.json(image);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const tag = searchParams.get("tag");

    const images = await prisma.image.findMany({
      where: {
        userId: session.user.id,
        ...(tag ? {
          tags: {
            some: {
              name: tag,
            },
          },
        } : {}),
      },
      include: {
        tags: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(images);
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
