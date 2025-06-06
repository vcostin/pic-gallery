import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import CreateGallery from "@/components/CreateGallery"; // Import default export
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { authOptions } from "@/lib/auth";

export default async function CreateGalleryPage() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    redirect("/api/auth/signin");
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Breadcrumbs
        items={[
          { label: 'Galleries', href: '/galleries' },
          { label: 'Create Gallery', href: '/galleries/create' },
        ]}
      />
      
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Create New Gallery</h1>
        <Link
          href="/galleries"
          className="px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600"
        >
          Cancel
        </Link>
      </div>
      
      <CreateGallery />
    </div>
  );
}
