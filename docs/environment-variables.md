# Environment Configuration Variables

This document describes the environment variables used in the Pic Gallery application.

## Configuration

Most application settings can be overridden through environment variables. The default values are specified in the `src/lib/config.ts` file, but can be customized in your `.env` file or through environment variables in your deployment platform.

## Available Environment Variables

### Authentication

| Variable | Description | Default |
|----------|-------------|---------|
| `BCRYPT_SALT_ROUNDS` | Number of salt rounds for password hashing. Higher values are more secure but slower. | `10` |
| `SESSION_MAX_AGE` | Session expiration time in seconds | `2592000` (30 days) |
| `NEXTAUTH_SECRET` | Secret used to encrypt cookies/tokens | Required in production |
| `NEXTAUTH_URL` | Base URL of your application | Required in production |

### Database

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | Required |

### E2E Testing

| Variable | Description | Default |
|----------|-------------|---------|
| `E2E_TEST_USER_EMAIL` | Email of the E2E test user (server-side) | Required for E2E tests |
| `E2E_TEST_USER_PASSWORD` | Password for E2E test user | Required for E2E tests |
| `E2E_TEST_USER_NAME` | Display name for E2E test user | Required for E2E tests |
| `NEXT_PUBLIC_E2E_TEST_USER_EMAIL` | Email of the E2E test user (client-side) | Should match `E2E_TEST_USER_EMAIL` |

### API Settings

| Variable | Description | Default |
|----------|-------------|---------|
| `MAX_REQUEST_SIZE` | Maximum size of API requests | `10mb` |
| `RATE_LIMIT_RPM` | Rate limit for API requests (requests per minute) | `100` |

### Feature Flags

| Variable | Description | Default |
|----------|-------------|---------|
| `ENABLE_REGISTRATION` | Whether user registration is enabled | `true` |
| `ENABLE_PASSWORD_RESET` | Whether password reset functionality is enabled | `true` |
| `NEXT_PUBLIC_ENABLE_E2E_TEST_FEATURES` | Whether E2E test features (like cleanup button) are visible | `false` |

## Usage in Code

When adding new configuration values:

1. Add the value to `src/lib/config.ts` with a reasonable default
2. Document it in this file
3. Use the value in your code by importing from the config file:

```typescript
import { auth, api, features } from '@/lib/config';

// Use the configuration values
const saltRounds = auth.saltRounds;
const maxRequests = api.rateLimit.requestsPerMinute;
```

## Example .env File

```
DATABASE_URL="postgresql://user:password@localhost:5432/pic_gallery?schema=public"
NEXTAUTH_SECRET="your-secure-secret-key-here"
NEXTAUTH_URL="http://localhost:3000"
BCRYPT_SALT_ROUNDS=12
ENABLE_REGISTRATION=true

# E2E Testing
E2E_TEST_USER_EMAIL="test@example.com"
E2E_TEST_USER_PASSWORD="your-test-password"
E2E_TEST_USER_NAME="Test User"
NEXT_PUBLIC_E2E_TEST_USER_EMAIL="test@example.com"
NEXT_PUBLIC_ENABLE_E2E_TEST_FEATURES="true"  # Only enable in development/testing
```
