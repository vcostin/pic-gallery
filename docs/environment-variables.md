# Environment Configuration Variables

This document describes all environment variables used in the Pic Gallery application.

## Configuration

Most application settings can be overridden through environment variables. The default values are specified in the `src/lib/config.ts` file, but can be customized in your `.env` file or through environment variables in your deployment platform.

## Available Environment Variables

### Core Application

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `DATABASE_URL` | PostgreSQL connection string | None | ✅ |
| `NEXTAUTH_SECRET` | Secret used to encrypt cookies/tokens | None | ✅ |
| `NEXTAUTH_URL` | Base URL of your application | None | ✅ |
| `NODE_ENV` | Node environment (development, production, test) | `development` | ❌ |
| `PORT` | Port for the Next.js server to run on | `3000` | ❌ |

### Authentication & Security

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `BCRYPT_SALT_ROUNDS` | Number of salt rounds for password hashing. Higher values are more secure but slower. Recommended: 10-12 | `10` | ❌ |
| `SESSION_MAX_AGE` | Session expiration time in seconds | `2592000` (30 days) | ❌ |

### Database Configuration

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `PRISMA_QUERY_LOG` | Enable Prisma query logging. Set to "true" to log all database queries to console | `false` | ❌ |

### API Configuration

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `MAX_REQUEST_SIZE` | Maximum size of API requests | `10mb` | ❌ |
| `RATE_LIMIT_RPM` | Rate limit for API requests (requests per minute per IP) | `100` | ❌ |

### Feature Flags

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `ENABLE_REGISTRATION` | Whether user registration is enabled | `true` | ❌ |
| `ENABLE_PASSWORD_RESET` | Whether password reset functionality is enabled | `true` | ❌ |
| `NEXT_PUBLIC_ENABLE_E2E_TEST_FEATURES` | Whether E2E test features (like cleanup button) are visible | `false` | ❌ |

### CI/CD Configuration

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `CI` | Set to "true" when running in CI environment. Affects logging and debugging behavior | `false` | ❌ |

### Playwright E2E Testing Configuration

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `PLAYWRIGHT_BASE_URL` | Base URL for Playwright tests | `http://localhost:3000` | ❌ |
| `BASE_URL` | Alternative base URL (fallback for Playwright) | `http://localhost:3000` | ❌ |
| `PLAYWRIGHT_FAST` | Enable fast mode for Playwright tests (reduced timeouts, minimal setup) | `false` | ❌ |
| `PLAYWRIGHT_OPTIMIZED` | Enable optimized mode for Playwright tests (performance enhancements) | `false` | ❌ |
| `PLAYWRIGHT_PERF_LOG` | Enable performance logging for Playwright tests | `false` | ❌ |
| `PLAYWRIGHT_SHARED_DATA` | Enable shared data between Playwright tests | `false` | ❌ |
| `PLAYWRIGHT_FAIL_FAST` | Stop on first test failure | `true` | ❌ |

### E2E Test User Credentials

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `E2E_TEST_USER_EMAIL` | Email of the E2E test user (server-side) | `test@example.com` | ✅ for E2E |
| `E2E_TEST_USER_PASSWORD` | Password for E2E test user | None | ✅ for E2E |
| `E2E_TEST_USER_NAME` | Display name for E2E test user | `Test User` | ✅ for E2E |
| `NEXT_PUBLIC_E2E_TEST_USER_EMAIL` | Email of the E2E test user (client-side) | Should match `E2E_TEST_USER_EMAIL` | ✅ for E2E |

## Usage in Code

When adding new configuration values:

1. Add the value to `src/lib/config.ts` with a reasonable default
2. Document it in this file and update `.env.example`
3. Use the value in your code by importing from the config file:

```typescript
import { auth, api, features } from '@/lib/config';

// Use the configuration values
const saltRounds = auth.saltRounds;
const maxRequests = api.rateLimit.requestsPerMinute;
```

## Environment Variable Categories

### Production vs Development
- **Core Application** variables are required in all environments
- **E2E Testing** variables are only needed when running tests
- **Playwright** variables control test execution behavior

### Client vs Server
- Variables prefixed with `NEXT_PUBLIC_` are available on the client-side
- All other variables are server-side only for security

### Security Considerations
- Never commit actual secrets to version control
- Use strong, unique values for `NEXTAUTH_SECRET`
- Consider using higher `BCRYPT_SALT_ROUNDS` values (12+) for production
- Keep E2E test credentials separate from production users

## Environment Setup Examples

### Development
```bash
NODE_ENV="development"
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/pic_gallery_dev"
NEXTAUTH_SECRET="dev-secret-change-in-production"
NEXTAUTH_URL="http://localhost:3000"
PRISMA_QUERY_LOG="true"  # Enable for debugging
NEXT_PUBLIC_ENABLE_E2E_TEST_FEATURES="true"
```

### Production
```bash
NODE_ENV="production"
DATABASE_URL="postgresql://user:password@prod-host:5432/pic_gallery"
NEXTAUTH_SECRET="super-secure-random-string-here"
NEXTAUTH_URL="https://your-domain.com"
BCRYPT_SALT_ROUNDS="12"  # Higher security
ENABLE_REGISTRATION="false"  # Disable if needed
PRISMA_QUERY_LOG="false"  # Disable in production
NEXT_PUBLIC_ENABLE_E2E_TEST_FEATURES="false"
```

### CI/CD Testing
```bash
NODE_ENV="test"
CI="true"
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/pic_gallery_test"
PLAYWRIGHT_FAST="true"
PLAYWRIGHT_FAIL_FAST="true"
E2E_TEST_USER_EMAIL="ci-test@example.com"
E2E_TEST_USER_PASSWORD="ci-test-password"
```

## Troubleshooting

### Common Issues

1. **Database Connection Errors**
   - Check `DATABASE_URL` format and credentials
   - Ensure database server is running
   - Verify database exists and is accessible

2. **Authentication Errors**
   - Ensure `NEXTAUTH_SECRET` is set and consistent
   - Check `NEXTAUTH_URL` matches your application URL
   - Verify callback URLs in your OAuth providers

3. **E2E Test Failures**
   - Ensure test user credentials are correct
   - Check that `NEXT_PUBLIC_ENABLE_E2E_TEST_FEATURES` is enabled
   - Verify `PLAYWRIGHT_BASE_URL` matches your running application

4. **Performance Issues**
   - Consider lowering `BCRYPT_SALT_ROUNDS` for development
   - Enable `PRISMA_QUERY_LOG` to identify slow queries
   - Adjust `RATE_LIMIT_RPM` based on your traffic patterns

### Validation
You can validate your environment configuration by running:
```bash
npm run test:config  # If available
```

Or check the configuration values in your application logs during startup.
