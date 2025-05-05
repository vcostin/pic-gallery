/**
 * This script promotes a user to admin status based on their email address.
 * It's mainly used for the first admin user in the system when no admins exist yet.
 * 
 * Usage: 
 * npx ts-node scripts/make-admin.ts user@example.com
 */

import { PrismaClient, UserRole } from "@prisma/client";

const prisma = new PrismaClient();

async function makeUserAdmin() {
  try {
    const email = process.argv[2];
    
    if (!email) {
      console.error("❌ Error: Please provide an email address of the user to promote.");
      console.error("Usage: npx ts-node scripts/make-admin.ts user@example.com");
      process.exit(1);
    }

    // Find the user by email
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, name: true, email: true, role: true }
    });

    if (!user) {
      console.error(`❌ Error: No user found with email: ${email}`);
      process.exit(1);
    }

    if (user.role === UserRole.ADMIN) {
      console.log(`✅ User ${user.name || email} is already an admin.`);
      process.exit(0);
    }

    // Promote the user to admin
    const updatedUser = await prisma.user.update({
      where: { email },
      data: { role: UserRole.ADMIN },
      select: { id: true, name: true, email: true, role: true }
    });

    console.log(`✅ Success! User ${updatedUser.name || updatedUser.email} has been promoted to admin role.`);
    console.log("They can now access the admin panel at /admin/users");

  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

makeUserAdmin();
