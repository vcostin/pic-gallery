// Use Next.js's Jest configuration with customizations
import { createJestConfig } from 'next/jest';

// Providing the path to your Next.js app which will enable loading next.config.js and .env files
const config = { dir: './' };

// Any custom config you want to pass to Jest
/** @type {import('jest').Config} */
const customJestConfig = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest-setup.js'],
  moduleNameMapper: {
    // Handle module aliases (if you have them in tsconfig.json)
    '^@/(.*)$': '<rootDir>/src/$1',
    // Mock Next.js specific modules if needed
    '^next/navigation$': '<rootDir>/src/__mocks__/next-navigation.js',
    '^next/server$': '<rootDir>/src/__mocks__/next-server.js',
  },
  testMatch: ['**/?(*.)+(spec|test).(js|jsx|ts|tsx)'],
  transformIgnorePatterns: [
    // Transform dependencies that use ESM or need processing
    'node_modules/(?!(@dnd-kit|uuid)/)'
  ],
};

// createJestConfig is exported in this way to ensure that next/jest can load the Next.js configuration
module.exports = createJestConfig(customJestConfig);
