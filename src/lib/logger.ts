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

/**
 * Helper to format and handle errors consistently across the app
 * @param error The error object or message
 * @param context Optional context information about where the error occurred
 * @returns Formatted error message
 */
export function handleError(error: unknown, context?: string): string {
  let message: string;
  
  if (error instanceof Error) {
    message = error.message;
  } else if (typeof error === 'string') {
    message = error;
  } else {
    message = 'An unknown error occurred';
  }
  
  const errorWithContext = context ? `${context}: ${message}` : message;
  // Log the error using the logger's error function
  console.error(errorWithContext);
  
  return errorWithContext;
}

const logger = {
  log,
  warn,
  error,
  handleError
};

export default logger;
