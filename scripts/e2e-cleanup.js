#!/usr/bin/env node
// filepath: /Users/vcostin/Work/pic-gallery/scripts/e2e-cleanup.js

/**
 * E2E Test Cleanup Script
 * 
 * This script provides a simple way to manually clean up test data
 * when E2E tests fail and leave data behind.
 * 
 * Usage:
 *   node scripts/e2e-cleanup.js [--delete-user]
 * 
 * Options:
 *   --delete-user: Also delete the E2E test user account
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { PrismaClient } = require('@prisma/client');

// Check for --delete-user flag
const deleteUser = process.argv.includes('--delete-user');

// Load environment variables from .env.local if it exists
try {
  if (fs.existsSync('.env.local')) {
    require('dotenv').config({ path: '.env.local' });
    console.log('Loaded environment from .env.local');
  } else {
    require('dotenv').config();
    console.log('Loaded environment from .env');
  }
} catch (error) {
  console.warn('Failed to load environment variables:', error.message);
}

// Get the E2E test user email from env or use default
const testUserEmail = process.env.E2E_TEST_USER_EMAIL || 'e2e-test@example.com';

async function cleanup() {
  console.log(`Starting manual E2E test cleanup for user: ${testUserEmail}`);
  console.log(`Delete user account: ${deleteUser ? 'YES' : 'NO'}`);
  
  const prisma = new PrismaClient();
  
  try {
    // Find the test user
    const user = await prisma.user.findUnique({
      where: { email: testUserEmail },
    });
    
    if (!user) {
      console.log(`Test user not found: ${testUserEmail}`);
      return;
    }
    
    console.log(`Found test user: ${user.name} (${user.email}), ID: ${user.id}`);
    
    // Get all galleries owned by the test user
    const galleries = await prisma.gallery.findMany({
      where: { userId: user.id },
      include: { images: true }
    });
    
    console.log(`Found ${galleries.length} galleries`);
    
    // Delete gallery-image relationships
    if (galleries.length > 0) {
      const deleted = await prisma.imageInGallery.deleteMany({
        where: {
          galleryId: {
            in: galleries.map(gallery => gallery.id)
          }
        }
      });
      console.log(`Deleted ${deleted.count} gallery-image relationships`);
    }
    
    // Delete galleries
    const deletedGalleries = await prisma.gallery.deleteMany({
      where: { userId: user.id }
    });
    console.log(`Deleted ${deletedGalleries.count} galleries`);
    
    // Delete images
    const deletedImages = await prisma.image.deleteMany({
      where: { userId: user.id }
    });
    console.log(`Deleted ${deletedImages.count} images`);
    
    // Delete user if requested
    if (deleteUser) {
      await prisma.user.delete({
        where: { id: user.id }
      });
      console.log(`Deleted user account: ${user.email}`);
    }
    
    console.log('Cleanup completed successfully');
  } catch (error) {
    console.error('Error during cleanup:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the cleanup
cleanup().catch(error => {
  console.error('Unhandled error:', error);
  process.exit(1);
});
