import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { EnhancedUploadImage } from "@/components/EnhancedUploadImage";
import { authOptions } from "@/lib/auth";

export default async function UploadImagePage() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    redirect("/api/auth/signin");
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <Link 
          href="/images" 
          className="px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 rounded-md transition-colors"
        >
          ← Back to Images
        </Link>
      </div>
      <EnhancedUploadImage />
    </div>
  );
}
