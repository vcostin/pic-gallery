# Prisma Query Logging Guide

This document explains how to enable and use Prisma query logging in the pic-gallery application.

## Overview

Prisma query logging allows you to see all SQL queries executed by your application, which is useful for:
- **Debugging**: Understanding what queries are being executed
- **Performance optimization**: Identifying slow or inefficient queries
- **Development**: Monitoring database interactions during development

## Configuration

### Environment Variable

The logging is controlled by the `PRISMA_QUERY_LOG` environment variable:

```bash
# Enable query logging
PRISMA_QUERY_LOG="true"

# Disable query logging (default)
PRISMA_QUERY_LOG="false"
```

### Setting Up Query Logging

1. **Development**: Add to your `.env.local` file:
   ```bash
   PRISMA_QUERY_LOG="true"
   ```

2. **Production**: Set as environment variable (not recommended for production)
   ```bash
   export PRISMA_QUERY_LOG="true"
   ```

3. **Docker**: Add to your docker-compose.yml:
   ```yaml
   environment:
     - PRISMA_QUERY_LOG=true
   ```

## Usage Examples

### Enabling for Debugging

When you need to debug database queries:

```bash
# Enable logging temporarily
echo 'PRISMA_QUERY_LOG="true"' >> .env.local

# Run your application
npm run dev

# Disable logging when done
sed -i '' '/PRISMA_QUERY_LOG/d' .env.local
```

### Query Output Example

When enabled, you'll see output like this in your console:

```
prisma:query SELECT "User"."id", "User"."name", "User"."email" FROM "User" WHERE "User"."id" = $1 LIMIT $2 OFFSET $3
prisma:query INSERT INTO "Gallery" ("id", "title", "description", "userId", "createdAt") VALUES ($1, $2, $3, $4, $5)
```

## Performance Considerations

- **Development**: Safe to enable for debugging
- **Testing**: Can be useful for E2E test debugging
- **Production**: **NOT recommended** as it can:
  - Impact performance
  - Expose sensitive data in logs
  - Generate large log files

## Advanced Configuration

The logging configuration supports multiple log levels:

```typescript
// In src/lib/db.ts, you could extend to:
export const prisma = new PrismaClient({
  log: database.queryLogging ? [
    'query',    // SQL queries
    'info',     // General information
    'warn',     // Warnings
    'error'     // Errors
  ] : [],
  // ... other config
})
```

## Troubleshooting

### Logging Not Working?

1. Check that the environment variable is set:
   ```bash
   echo $PRISMA_QUERY_LOG
   ```

2. Verify the value is exactly "true" (case-sensitive)

3. Restart your development server after changing the environment variable

4. Check that the config is being imported correctly:
   ```typescript
   import { database } from '@/lib/config'
   console.log('Query logging enabled:', database.queryLogging)
   ```

### Too Much Output?

If query logging is too verbose:

1. **Filter output**: Use grep to filter relevant queries
   ```bash
   npm run dev 2>&1 | grep "prisma:query.*User"
   ```

2. **Disable temporarily**: Set `PRISMA_QUERY_LOG="false"`

3. **Use in specific contexts**: Only enable for specific debugging sessions

## Best Practices

1. **Never commit** query logging enabled to version control
2. **Use temporarily** for debugging specific issues
3. **Monitor log size** if enabled for extended periods
4. **Filter sensitive data** if you must use in production environments
5. **Use with specific features** rather than globally in development

## Related Documentation

- [Environment Variables](./environment-variables.md) - Complete list of environment variables
- [Database Setup](./database-environment-setup.md) - Database configuration guide
- [Prisma Client Guidelines](./prisma-client-guidelines.md) - Best practices for Prisma usage
