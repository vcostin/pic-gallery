/**
 * Application configuration settings
 * 
 * This file centralizes all configuration values that might need to be adjusted
 * without modifying code. Values can be pulled from environment variables
 * or set with reasonable defaults.
 */

// Authentication settings
export const auth = {
  // Number of salt rounds for bcrypt password hashing
  // Higher values increase security but also increase hashing time
  // Range: 10-12 is reasonable for most applications, 12+ for sensitive data
  saltRounds: process.env.BCRYPT_SALT_ROUNDS ? parseInt(process.env.BCRYPT_SALT_ROUNDS, 10) : 10,
  
  // Session expiration time (in seconds)
  sessionMaxAge: process.env.SESSION_MAX_AGE ? parseInt(process.env.SESSION_MAX_AGE, 10) : 30 * 24 * 60 * 60, // 30 days
};

// Database settings
export const database = {
  // Enable Prisma query logging
  queryLogging: process.env.PRISMA_QUERY_LOG === 'true',
};

// API settings
export const api = {
  // Request size limits
  maxRequestSize: process.env.MAX_REQUEST_SIZE || '10mb',
  
  // Rate limiting
  rateLimit: {
    // Maximum number of requests per minute per IP
    requestsPerMinute: process.env.RATE_LIMIT_RPM ? parseInt(process.env.RATE_LIMIT_RPM, 10) : 100,
  },
};

// Feature flags - enable/disable features
export const features = {
  enableRegistration: process.env.ENABLE_REGISTRATION !== 'false',
  enablePasswordReset: process.env.ENABLE_PASSWORD_RESET !== 'false',
};
