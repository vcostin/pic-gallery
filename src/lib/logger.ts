/**
 * Logger utility for consistent logging throughout the application
 * Logs are only displayed in development environment
 */

const isDevelopment = process.env.NODE_ENV === 'development';

/**
 * Log informational messages (only in development)
 */
export function log(...args: unknown[]): void {
  if (isDevelopment) {
    console.log(...args);
  }
}

/**
 * Log warning messages (only in development) 
 */
export function warn(...args: unknown[]): void {
  if (isDevelopment) {
    console.warn(...args);
  }
}

/**
 * Log error messages (always logged for debugging purposes)
 * In production, this could be connected to an error tracking service
 */
export function error(...args: unknown[]): void {
  console.error(...args);
}

const logger = {
  log,
  warn,
  error,
};

export default logger;
