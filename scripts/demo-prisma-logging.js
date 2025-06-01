#!/usr/bin/env node
/**
 * Demo script to show Prisma query logging in action
 * Run this script to see the difference between enabled/disabled query logging
 */

console.log('🔍 Prisma Query Logging Demo');
console.log('============================\n');

async function demonstrateQueryLogging() {
  // Test with logging disabled
  console.log('📴 Testing with PRISMA_QUERY_LOG=false');
  process.env.PRISMA_QUERY_LOG = 'false';
  
  try {
    // Dynamic import to get fresh config
    const { PrismaClient } = await import('@prisma/client');
    const { database } = await import('./src/lib/config');
    
    console.log(`   Config value: ${database.queryLogging}`);
    console.log('   Expected: No query logs should appear below\n');
    
    const prisma = new PrismaClient({
      log: database.queryLogging ? ['query'] : [],
    });
    
    // Execute a simple query
    console.log('   Executing: prisma.user.count()');
    const userCount = await prisma.user.count();
    console.log(`   Result: ${userCount} users found`);
    await prisma.$disconnect();
    
  } catch (error) {
    console.log(`   Error: ${error.message}`);
  }
  
  console.log('\n' + '='.repeat(50) + '\n');
  
  // Test with logging enabled
  console.log('📊 Testing with PRISMA_QUERY_LOG=true');
  process.env.PRISMA_QUERY_LOG = 'true';
  
  try {
    // Clear module cache to get fresh config
    const configPath = './src/lib/config';
    delete require.cache[require.resolve(configPath)];
    
    const { PrismaClient } = await import('@prisma/client');
    const { database } = await import('./src/lib/config');
    
    console.log(`   Config value: ${database.queryLogging}`);
    console.log('   Expected: Query logs should appear below\n');
    
    const prisma = new PrismaClient({
      log: database.queryLogging ? ['query'] : [],
    });
    
    // Execute a simple query
    console.log('   Executing: prisma.user.count()');
    const userCount = await prisma.user.count();
    console.log(`   Result: ${userCount} users found`);
    await prisma.$disconnect();
    
  } catch (error) {
    console.log(`   Error: ${error.message}`);
  }
  
  console.log('\n🎉 Demo completed!');
  console.log('\n💡 To use in your app:');
  console.log('   1. Set PRISMA_QUERY_LOG="true" in your .env file');
  console.log('   2. Restart your development server');
  console.log('   3. Watch the console for query logs');
  console.log('   4. Set back to "false" when debugging is done');
}

demonstrateQueryLogging().catch(console.error);
