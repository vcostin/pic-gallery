// Use Next.js's Jest configuration
const nextJest = require('next/jest');

// Provide the path to your Next.js app to load next.config.js and .env files
const createJestConfig = nextJest({
  dir: './',
});

// Add any custom config to be passed to Jest
/** @type {import('jest').Config} */
const customJestConfig = {
  // For testing React components (UI tests)
  testEnvironment: 'jest-environment-jsdom',
  
  // Add more setup options before each test is run
  setupFilesAfterEnv: ['<rootDir>/jest-setup.cjs'],
  
  // Handle aliases from tsconfig
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  
  // Define patterns for test files
  testMatch: ['**/__tests__/**/*.test.[jt]s?(x)', '**/(*.)+(spec|test).[jt]s?(x)'],
  
  // Handle specific node_modules that use ESM
  transformIgnorePatterns: [
    'node_modules/(?!(@dnd-kit|uuid)/)'
  ],
  
  // Coverage configuration
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts',
    '!src/__mocks__/**',
    '!src/app/api/uploadthing/**',
    '!**/node_modules/**'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['lcov', 'text', 'text-summary'],
};

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config
module.exports = createJestConfig(customJestConfig);
