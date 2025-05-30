import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { ProfileForm } from "@/components/Profile";
import { UserStats } from "@/components/UserStats";
import { DeleteAccountDialog } from "@/components/DeleteAccountDialog";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { UserRole } from "@/lib/types";

// Extend PrismaUser interface to include the role and _count fields
interface PrismaUser {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
  emailVerified: Date | null;
  role: UserRole;
  _count: {
    images: number;
    galleries: number;
  }
}

export default async function ProfilePage() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    redirect("/api/auth/signin");
  }

  // Get more detailed user information including counts
  const userId = session.user.id;
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      _count: {
        select: {
          images: true,
          galleries: true,
        }
      }
    }
  }) as unknown as PrismaUser | null;

  if (!user) {
    redirect("/api/auth/signin");
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Breadcrumbs
        items={[
          { label: "Home", href: "/" },
          { label: "Profile", href: "/profile" },
        ]}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <h1 className="text-3xl font-bold mb-6">My Profile</h1>
            <ProfileForm 
              initialData={{
                id: user.id,
                name: user.name || "",
                email: user.email || "",
                image: user.image || "",
                role: user.role
              }} 
            />
          </div>
        </div>

        <div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold mb-4">Account Statistics</h2>
            <UserStats 
              galleryCount={user._count.galleries}
              imageCount={user._count.images} 
              memberSince={user.emailVerified}
              role={user.role}
            />

            <div className="mt-8">
              <h3 className="text-lg font-semibold mb-3">Danger Zone</h3>
              <hr className="border-red-200 dark:border-red-800 mb-4" />
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                Deleting your account will permanently remove all your data including images and galleries.
                This action cannot be undone.
              </p>
              <button
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md transition"
                data-delete-account-id={user.id}
                data-testid="delete-account-button"
              >
                Delete My Account
              </button>
            </div>
          </div>
        </div>
      </div>

      <DeleteAccountDialog userId={user.id} />
    </div>
  );
}
