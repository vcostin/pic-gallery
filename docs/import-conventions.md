# Import Conventions

## Path Aliases

This project uses the `@/` import alias to reference files from the `src` directory. Always use the alias instead of relative paths when importing from within the `src` directory.

### Correct Usage

```typescript
// Correct - Using path alias
import { prisma } from '@/lib/db';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/lib/hooks/useAuth';
```

### Incorrect Usage

```typescript
// Incorrect - Using relative paths
import { prisma } from '../../../../lib/db';
import { Button } from '../../components/ui/Button';
import { useAuth } from '../../../lib/hooks/useAuth';
```

## Benefits of Path Aliases

1. **Readability**: Makes imports cleaner and more readable
2. **Maintainability**: Prevents import path breakage when files are moved
3. **Consistency**: Provides a uniform approach across the codebase
4. **IDE Support**: Better autocomplete and navigation in most IDEs

## Additional Conventions

- Group imports by external dependencies first, followed by internal imports
- Sort imports alphabetically within each group
- Use named imports where possible instead of default imports for better refactoring support

```typescript
// External dependencies
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { z } from 'zod';

// Internal imports (using path aliases)
import { Button } from '@/components/ui/Button';
import { prisma } from '@/lib/db';
import { useAuth } from '@/lib/hooks/useAuth';
```
