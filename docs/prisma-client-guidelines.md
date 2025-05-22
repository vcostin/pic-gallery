# Prisma Client Generation Guidelines

## Overview

This document outlines the approach for handling generated Prisma client code within our project.

## Best Practices

### 1. Do Not Commit Generated Prisma Files

The generated Prisma client files located in `/src/lib/generated/prisma-client/` **should not be committed** to version control. These files are:

- Automatically generated
- Potentially large (especially binary engine files)
- Different across platforms
- Subject to frequent changes when the schema changes

### 2. Generate On-demand

Instead of committing the files, we use the following approach:

- The client files are generated during development and build processes
- The npm scripts have been configured to include Prisma generation steps
- A `postinstall` script ensures the client is generated after dependencies are installed

### 3. Configured Scripts

We have set up the following scripts in `package.json`:

```json
"dev": "prisma generate && next dev --turbopack",
"build": "prisma generate && next build",
"postinstall": "prisma generate",
```

This ensures the Prisma client is always up-to-date before the application runs.

### 4. Gitignore Configuration

The `/src/lib/generated/prisma-client/` directory is listed in `.gitignore` to prevent these files from being committed.

### 5. Imports

Always import the Prisma client from the central `db.ts` file, not directly from the generated code:

```typescript
// Correct:
import { prisma } from '@/lib/db';

// Incorrect:
import { PrismaClient } from '@/lib/generated/prisma-client';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
```

## Deployment Considerations

When deploying the application:

1. Ensure your CI/CD pipeline runs `npm install`, which will trigger the `postinstall` script
2. For Vercel, Netlify, and similar platforms, this happens automatically
3. For custom deployments, make sure `prisma generate` runs before starting the application
