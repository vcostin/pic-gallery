// Single-user authentication configuration for E2E tests
// This user is created once, used for all tests, and deleted only at the very end
export const TEST_USER = {
  email: 'e2e-single-user@example.com',
  password: 'testpassword123',
  name: 'E2E Single Test User',
  storageStatePath: './playwright/.auth/single-user.json'
} as const;

export type TestUser = typeof TEST_USER;
