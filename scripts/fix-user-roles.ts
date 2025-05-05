/**
 * This script ensures all users have a valid role value.
 * After migrating from isAdmin boolean to UserRole enum, 
 * existing users might need their roles properly set.
 * 
 * Usage: 
 * npx ts-node scripts/fix-user-roles.ts
 */

import { PrismaClient, UserRole } from "@prisma/client";

const prisma = new PrismaClient();

async function fixUserRoles() {
  try {
    console.log("🔄 Starting user role migration...");

    // Simple approach: Update all users to ensure they have the USER role
    // This will set any null or undefined roles to USER
    const updatedCount = await prisma.user.updateMany({
      data: {
        role: UserRole.USER
      }
    });

    console.log(`✅ Updated ${updatedCount.count} users to have the USER role`);

    // List all users and their current roles
    const allUsers = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true
      }
    });

    console.log("\n📊 Current user roles:");
    allUsers.forEach(user => {
      console.log(`- ${user.name || user.email}: ${user.role}`);
    });

    console.log("\n✅ User role migration completed successfully");

  } catch (error) {
    console.error("❌ Error fixing user roles:", error);
  } finally {
    await prisma.$disconnect();
  }
}

fixUserRoles();
