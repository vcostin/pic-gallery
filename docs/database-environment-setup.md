# Database Environment Setup Guide

This guide explains how the project supports dual database configurations for different environments and how to manage them effectively.

## 🏗️ Architecture Overview

The project uses a **dual database architecture** that automatically switches between database providers based on the environment:

- **🚀 Production**: PostgreSQL (full-featured, scalable)
- **🧪 CI/Testing**: SQLite (lightweight, no external dependencies)
- **💻 Local Development**: Configurable (PostgreSQL by default, SQLite for testing)

## 📁 File Structure

```
prisma/
├── schema.prisma              # Main schema (auto-switched based on environment)
├── schema.sqlite.prisma       # SQLite-specific schema for CI/testing
├── schema.postgresql.prisma   # PostgreSQL schema for production (optional backup)
└── migrations/                # PostgreSQL migrations (production)

scripts/
└── setup-database-ci.sh       # Automated database setup for CI environments

src/lib/
├── db.ts                      # Centralized database client
└── generated/
    └── prisma-client/         # Generated Prisma client (gitignored)
```

## 🔄 Environment Detection & Switching

The system automatically detects the environment and configures the appropriate database:

### Environment Variables

| Variable | Production | CI | Local Dev |
|----------|------------|----|-----------| 
| `CI` | `false` | `true` | `false` |
| `DATABASE_URL` | PostgreSQL connection string | `file:./test.db` | PostgreSQL or SQLite |
| `NODE_ENV` | `production` | `test` | `development` |

### Automatic Schema Switching

The `scripts/setup-database-ci.sh` script automatically:

1. **Detects Environment**: Checks `CI` environment variable
2. **Selects Schema**: Copies appropriate schema to `prisma/schema.prisma`
3. **Generates Client**: Creates Prisma client with correct configuration
4. **Sets Up Database**: Runs migrations or creates SQLite file
5. **Creates Test Data**: Adds E2E test users for CI environments

## 🏠 Local Development Setup

### Option 1: PostgreSQL (Recommended for Production Parity)

1. **Install PostgreSQL** (if not already installed):
   ```bash
   # macOS
   brew install postgresql@15
   brew services start postgresql@15
   
   # Ubuntu/Debian
   sudo apt update
   sudo apt install postgresql postgresql-contrib
   
   # Windows
   # Download from https://www.postgresql.org/download/windows/
   ```

2. **Create Local Database**:
   ```bash
   # Connect to PostgreSQL
   psql postgres
   
   # Create database and user
   CREATE DATABASE pic_gallery_dev;
   CREATE USER pic_user WITH PASSWORD 'your_password';
   GRANT ALL PRIVILEGES ON DATABASE pic_gallery_dev TO pic_user;
   \q
   ```

3. **Configure Environment Variables**:
   ```bash
   # .env.local
   DATABASE_URL="postgresql://pic_user:your_password@localhost:5432/pic_gallery_dev"
   NODE_ENV="development"
   ```

4. **Set Up Database**:
   ```bash
   npm run updatedb
   ```

### Option 2: SQLite (Quick Setup for Testing)

1. **Configure Environment**:
   ```bash
   # .env.local
   DATABASE_URL="file:./dev.db"
   NODE_ENV="development"
   ```

2. **Run Setup Script**:
   ```bash
   ./scripts/setup-database-ci.sh
   ```

### Option 3: Switch Between Databases During Development

You can easily switch between PostgreSQL and SQLite for different scenarios:

#### Switch to SQLite for Testing

```bash
# Create a SQLite environment file
echo 'DATABASE_URL="file:./test-local.db"' > .env.test.local

# Run with SQLite
NODE_ENV=test DATABASE_URL="file:./test-local.db" ./scripts/setup-database-ci.sh

# Run tests with SQLite
NODE_ENV=test npm run test:e2e
```

#### Switch Back to PostgreSQL

```bash
# Use your regular .env.local with PostgreSQL
npm run updatedb
npm run dev
```

#### Quick Environment Switching Script

Create a helper script for easy switching:

```bash
# scripts/switch-db.sh
#!/bin/bash

case "$1" in
  postgres)
    echo "Switching to PostgreSQL..."
    cp .env.local.postgres .env.local
    npm run updatedb
    echo "✅ PostgreSQL ready"
    ;;
  sqlite)
    echo "Switching to SQLite..."
    cp .env.local.sqlite .env.local
    ./scripts/setup-database-ci.sh
    echo "✅ SQLite ready"
    ;;
  *)
    echo "Usage: $0 {postgres|sqlite}"
    exit 1
    ;;
esac
```

## 🚀 Production Environment

### PostgreSQL Configuration

For production deployment, ensure you have:

1. **Database Server**: Managed PostgreSQL instance (AWS RDS, Google Cloud SQL, etc.)
2. **Environment Variables**:
   ```bash
   DATABASE_URL="postgresql://user:password@host:port/database?sslmode=require"
   NODE_ENV="production"
   ```
3. **Migrations**: Run automatically during deployment
   ```bash
   npx prisma migrate deploy
   ```

### Schema Management

- **Schema File**: Uses `prisma/schema.prisma` with PostgreSQL provider
- **Migrations**: Stored in `prisma/migrations/` directory
- **Client Generation**: Happens during build process

## 🧪 CI/Testing Environment

### GitHub Actions Configuration

The CI environment automatically:

1. **Sets Environment Variables**:
   ```yaml
   env:
     CI: true
     DATABASE_URL: "file:./test.db"
     E2E_TEST_USER_EMAIL: "e2e-test@example.com"
     # ... other test variables
   ```

2. **Runs Database Setup**:
   ```yaml
   - name: Setup SQLite database for E2E tests
     run: ./scripts/setup-database-ci.sh
   ```

3. **Generates Fresh Database**: Each CI run gets a clean SQLite database

### SQLite Advantages for CI

- ✅ **No External Dependencies**: No need to provision database servers
- ✅ **Fast Setup**: Database creation is instantaneous
- ✅ **Isolated Tests**: Each run gets a fresh database
- ✅ **Consistent State**: No data leakage between test runs
- ✅ **Cost Effective**: No additional infrastructure costs

## 🔧 Database Client Usage

### Centralized Client Pattern

Always import the database client from the centralized location:

```typescript
// ✅ Correct - Use centralized client
import { prisma } from '@/lib/db';

// ❌ Incorrect - Don't import directly
import { PrismaClient } from '@prisma/client';
```

### Database Client Implementation

```typescript
// src/lib/db.ts
import { PrismaClient } from '@/lib/generated/prisma-client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
```

## 🔍 Schema Differences

### PostgreSQL Features (Production)

```prisma
// PostgreSQL-specific features
model User {
  id          String @id @default(cuid())
  description String? @db.Text  // Large text support
  metadata    Json?              // JSON column support
  createdAt   DateTime @default(now()) @db.Timestamptz
}
```

### SQLite Compatibility (CI/Testing)

```prisma
// SQLite-compatible version
model User {
  id          String @id @default(cuid())
  description String?      // No @db.Text annotation
  metadata    String?      // JSON as string
  createdAt   DateTime @default(now())
}
```

## 🚨 Troubleshooting

### Common Issues

#### 1. Schema Mismatch Errors

```bash
# Solution: Regenerate Prisma client
npx prisma generate
```

#### 2. Database Connection Errors

```bash
# Check environment variables
echo $DATABASE_URL

# Test database connection
npx prisma db push --preview-feature
```

#### 3. Migration Issues

```bash
# Reset database (development only)
npx prisma migrate reset

# Deploy migrations (production)
npx prisma migrate deploy
```

#### 4. CI Database Setup Failures

```bash
# Check if setup script is executable
chmod +x scripts/setup-database-ci.sh

# Test setup script locally
CI=true DATABASE_URL="file:./test.db" ./scripts/setup-database-ci.sh
```

### Environment Variable Debugging

```bash
# Check current environment
echo "CI: $CI"
echo "NODE_ENV: $NODE_ENV"
echo "DATABASE_URL: $DATABASE_URL"

# Verify Prisma client location
ls -la src/lib/generated/prisma-client/
```

## 📋 Best Practices

### 1. Environment Isolation

- Never use production database for development
- Always use separate databases for each environment
- Use environment-specific connection strings

### 2. Schema Management

- Keep SQLite and PostgreSQL schemas in sync
- Test changes in both environments
- Use feature flags for database-specific features

### 3. Data Safety

- Always backup production data before migrations
- Test migrations in staging environment first
- Use transactions for complex data migrations

### 4. CI/CD Pipeline

- Verify database setup in CI before running tests
- Cache database setup when possible
- Monitor CI database performance

## 🔄 Migration Strategy

### From Single DB to Dual DB

If migrating an existing project:

1. **Create SQLite Schema**: Copy and modify existing schema
2. **Set Up CI Script**: Implement automated switching
3. **Update CI Configuration**: Add environment variables
4. **Test Both Environments**: Ensure feature parity
5. **Deploy Gradually**: Roll out environment by environment

### Schema Synchronization

```bash
# Script to sync schemas (example)
#!/bin/bash
# Copy PostgreSQL schema and modify for SQLite
cp prisma/schema.prisma prisma/schema.sqlite.prisma
sed -i 's/@db\.Text//g' prisma/schema.sqlite.prisma
sed -i 's/postgresql/sqlite/g' prisma/schema.sqlite.prisma
```

## 📚 Additional Resources

- [Prisma Database Providers](https://www.prisma.io/docs/reference/database-reference/supported-databases)
- [Environment Variables in Next.js](https://nextjs.org/docs/basic-features/environment-variables)
- [GitHub Actions Environment Variables](https://docs.github.com/en/actions/learn-github-actions/environment-variables)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [SQLite Documentation](https://www.sqlite.org/docs.html)

---

*This dual database setup ensures development flexibility while maintaining production reliability and CI efficiency.*
