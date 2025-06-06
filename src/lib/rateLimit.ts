import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Simple in-memory rate limiting 
// In production, you should use Redis or a similar store
const ipRequestCounts = new Map<string, number>();
const ipLastResetTime = new Map<string, number>();
const AUTH_RATE_LIMIT = 20; // 20 requests
const AUTH_RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute

/**
 * A simple rate limiter function that can be used to limit requests
 * for sensitive operations like auth and API operations
 */
export function rateLimiter(req: NextRequest, limit: number = AUTH_RATE_LIMIT, windowMs: number = AUTH_RATE_LIMIT_WINDOW) {
  // Get IP from headers - NextRequest doesn't have ip property directly
  const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown";
  
  const now = Date.now();
  const windowStart = now - windowMs;
  
  // Reset counter if outside the window
  if (!ipLastResetTime.has(ip) || ipLastResetTime.get(ip)! < windowStart) {
    ipRequestCounts.set(ip, 0);
    ipLastResetTime.set(ip, now);
  }
  
  // Increment the request count
  const currentCount = ipRequestCounts.get(ip) || 0;
  ipRequestCounts.set(ip, currentCount + 1);
  
  // Check if over the limit
  if (currentCount >= limit) {
    return NextResponse.json(
      { success: false, message: "Too many requests, please try again later" },
      { status: 429 }
    );
  }
  
  return null; // No rate limit hit
}

/**
 * A more lenient rate limiter specifically for E2E tests
 */
export function e2eRateLimiter(req: NextRequest) {
  // Check for E2E test environment indicators
  const isE2ETest = req.headers.get("x-e2e-test") === "true" || 
                   process.env.NODE_ENV === "test" ||
                   process.env.NEXT_PUBLIC_ENABLE_E2E_TEST_FEATURES === "true";
                   
  if (isE2ETest) {
    // Use a much higher limit for E2E tests - 200 requests per minute
    return rateLimiter(req, 200, AUTH_RATE_LIMIT_WINDOW);
  }
  
  // Standard rate limit for normal traffic
  return rateLimiter(req);
}
