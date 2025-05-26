import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function createTestUser() {
  const testEmail = process.env.E2E_TEST_USER_EMAIL || 'e2e-test@example.com';
  const testPassword = process.env.E2E_TEST_USER_PASSWORD || 'TestPassword123!';
  const testName = process.env.E2E_TEST_USER_NAME || 'E2E Test User';

  try {
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: testEmail },
    });

    if (existingUser) {
      console.log(`✅ Test user already exists: ${testEmail}`);
      return;
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(testPassword, 12);

    // Create the test user
    const user = await prisma.user.create({
      data: {
        name: testName,
        email: testEmail,
        password: hashedPassword,
      },
    });

    console.log(`✅ Created test user: ${user.email} (ID: ${user.id})`);
  } catch (error) {
    console.error('❌ Error creating test user:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

createTestUser();
