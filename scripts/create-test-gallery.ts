// File: scripts/create-test-gallery.ts
// Script to create a test gallery with images for E2E testing

import { PrismaClient } from '@prisma/client';
import path from 'path';
import fs from 'fs';

const prisma = new PrismaClient();

async function createTestGallery() {
  try {
    console.log('Creating test gallery for E2E tests...');
    
    // Check if the test user exists (typically created by the E2E auth setup)
    const testUser = await prisma.user.findFirst({
      where: {
        email: 'test@example.com',
      },
    });
    
    if (!testUser) {
      console.log('Test user not found, creating one...');
      const newUser = await prisma.user.create({
        data: {
          email: 'test@example.com',
          name: 'Test User',
          password: '$2b$10$lJsqvKFIJfTGgBzTavfMu.8Y8b4mOl0nHJR9I3qJRzb.Vu.KkzA92', // "password" hashed
        },
      });
      console.log(`Created test user with ID: ${newUser.id}`);
    }
    
    const userId = testUser?.id || (await prisma.user.findFirst({ where: { email: 'test@example.com' } }))!.id;
    
    // Create test gallery
    const gallery = await prisma.gallery.create({
      data: {
        title: 'Test Gallery for E2E',
        description: 'This gallery is created for E2E testing purposes',
        userId,
        isPublic: true,
      },
    });
    
    console.log(`Created test gallery with ID: ${gallery.id}`);
    
    // Create some test images
    for (let i = 1; i <= 3; i++) {
      const image = await prisma.image.create({
        data: {
          title: `Test Image ${i}`,
          description: `Description for test image ${i}`,
          url: `https://picsum.photos/id/${30 + i}/500/500`,
          userId,
          alt: `Test image ${i}`,
          tags: ['test', 'e2e'],
        },
      });
      
      console.log(`Created test image with ID: ${image.id}`);
      
      // Add image to gallery
      await prisma.imageInGallery.create({
        data: {
          galleryId: gallery.id,
          imageId: image.id,
          order: i - 1,
        },
      });
      
      console.log(`Added image ${image.id} to gallery ${gallery.id}`);
    }
    
    console.log('Test gallery setup completed successfully');
  } catch (error) {
    console.error('Error creating test gallery:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestGallery();
