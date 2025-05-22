import { getServerSession } from "next-auth";
import { notFound } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { ThemedGalleryView } from "@/components/ThemedGalleryView";
import { FullGallery } from "@/lib/types"; // Assuming FullGallery is defined here or adjust path
import { UserRole } from '@prisma/client'; // Import UserRole

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

  // Removed unused isOwner variable

  // Augment the user object to match the expected structure for FullGallery
  const augmentedUser = {
    ...gallery.user,
    email: gallery.user.email || 'user@example.com', // Default email (should always have a value now)
    emailVerified: null, // Add missing property
    role: UserRole.USER, // Add missing property, provide a default or fetch actual role
  };

  const fullGallery: FullGallery = {
    ...gallery,
    user: augmentedUser,
    // Ensure all theming fields from the fetched gallery are mapped
    // These should already be on `gallery` if your GET request includes them
    // and if the Prisma model for Gallery has them.
    // If they are optional and might be null/undefined, ensure FullGallery type allows this.
    themeColor: gallery.themeColor || null,
    backgroundColor: gallery.backgroundColor || null,
    backgroundImageUrl: gallery.backgroundImageUrl || null,
    accentColor: gallery.accentColor || null,
    fontFamily: gallery.fontFamily || null,
    displayMode: gallery.displayMode || null,
    layoutType: gallery.layoutType || null,
  };

  return <ThemedGalleryView gallery={fullGallery} />;
}
