import { getServerSession } from "next-auth";
import { redirect, notFound } from "next/navigation";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { ProfileForm } from "@/components/Profile";
import { UserStats } from "@/components/UserStats";
import { AdminControls } from "@/components/AdminControls";
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

export default async function UserProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    redirect("/api/auth/signin");
  }

  // Check if the current user is admin or trying to access their own profile
  const currentUser = await prisma.user.findUnique({
    where: { id: session.user.id }
  }) as unknown as { role: UserRole } | null;

  const isAdmin = currentUser?.role === UserRole.ADMIN;
  const isOwnProfile = session.user.id === id;

  // Only allow admins to view other profiles
  if (!isAdmin && !isOwnProfile) {
    redirect("/");
  }

  // Get user information including counts
  const user = await prisma.user.findUnique({
    where: { id },
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
    notFound();
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Breadcrumbs
        items={[
          { label: "Home", href: "/" },
          ...(isAdmin && !isOwnProfile ? [
            { label: "Admin", href: "/admin" },
            { label: "Users", href: "/admin/users" },
            { label: user.name || "User Profile", href: `/profile/${user.id}` }
          ] : [
            { label: "Profile", href: "/profile" }
          ])
        ]}
      />

      {isAdmin && !isOwnProfile && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500 p-4 mb-6">
          <p className="text-blue-700 dark:text-blue-300">
            You are viewing this profile as an administrator.
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-3xl font-bold">
                {isOwnProfile ? "My Profile" : `${user.name || "User"}'s Profile`}
              </h1>
              
              {isAdmin && !isOwnProfile && (
                <AdminControls userId={user.id} userRole={user.role} />
              )}
            </div>
            
            <ProfileForm 
              initialData={{
                id: user.id,
                name: user.name || "",
                email: user.email || "",
                image: user.image || "",
                role: user.role,
              }}
              readOnly={!isOwnProfile && !isAdmin}
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

            {(isOwnProfile || isAdmin) && (
              <div className="mt-8">
                <h3 className="text-lg font-semibold mb-3">Danger Zone</h3>
                <hr className="border-red-200 dark:border-red-800 mb-4" />
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                  Deleting this account will permanently remove all data including images and galleries.
                  This action cannot be undone.
                </p>
                <button
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md transition"
                  data-delete-account-id={user.id}
                >
                  Delete Account
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
