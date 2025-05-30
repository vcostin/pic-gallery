# Database Quick Reference

## 🚀 Quick Commands

### Environment Setup

```bash
# PostgreSQL (Production-like)
DATABASE_URL="postgresql://user:pass@localhost:5432/dbname" npm run updatedb

# SQLite (Testing)
DATABASE_URL="file:./test.db" ./scripts/setup-database-ci.sh

# Auto-detect CI environment
CI=true ./scripts/setup-database-ci.sh
```

### Switch Databases Locally

```bash
# Switch to SQLite for testing
echo 'DATABASE_URL="file:./dev-test.db"' > .env.local
./scripts/setup-database-ci.sh
npm run test:e2e

# Switch back to PostgreSQL
echo 'DATABASE_URL="postgresql://user:pass@localhost:5432/dbname"' > .env.local
npm run updatedb
npm run dev
```

### Common Operations

```bash
# Generate Prisma client
npx prisma generate

# Push schema changes
npx prisma db push

# Reset database (dev only)
npx prisma migrate reset

# View database
npx prisma studio
```

## 🔍 Environment Detection

| Environment | `CI` | `NODE_ENV` | Database | Auto-Setup |
|-------------|------|------------|----------|------------|
| **Local Dev** | `false` | `development` | PostgreSQL | Manual |
| **Local Test** | `false` | `test` | SQLite | Manual |
| **CI/Actions** | `true` | `test` | SQLite | Automatic |
| **Production** | `false` | `production` | PostgreSQL | Deployment |

## 📁 Key Files

- `scripts/setup-database-ci.sh` - Automated database setup
- `prisma/schema.prisma` - Active schema (auto-switched)
- `prisma/schema.sqlite.prisma` - SQLite template
- `src/lib/db.ts` - Database client (use this for imports)
- `.env.local` - Local environment variables

## 🔧 Troubleshooting

```bash
# Check current setup
echo "Database: $DATABASE_URL"
npx prisma --version

# Fix common issues
chmod +x scripts/setup-database-ci.sh
npm run updatedb
npx prisma generate

# Test database connection
npx prisma db push --preview-feature
```

## 📋 Environment Variables

```bash
# .env.local (PostgreSQL)
DATABASE_URL="postgresql://user:password@localhost:5432/pic_gallery_dev"
NODE_ENV="development"

# .env.local (SQLite)
DATABASE_URL="file:./dev.db"
NODE_ENV="development"

# CI Environment (automatic)
CI=true
DATABASE_URL="file:./test.db"
E2E_TEST_USER_EMAIL="e2e-test@example.com"
```
