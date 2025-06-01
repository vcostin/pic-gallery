import { PrismaClient } from '@prisma/client'
import { database } from '@/lib/config'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Optimize Prisma client instantiation with connection pooling
// Query logging can be enabled by setting PRISMA_QUERY_LOG=true in environment variables
export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: database.queryLogging ? ['query'] : [],
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  }
})

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
