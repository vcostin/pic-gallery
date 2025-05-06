import { ZodError } from 'zod';
import { NextResponse } from 'next/server';
import type { ApiResponse } from './types/api';

export function apiSuccess<T>(data: T, status = 200): NextResponse<ApiResponse<T>> {
  return NextResponse.json({ success: true, data }, { status });
}

export function apiError(message: string, status = 500, details?: unknown): NextResponse<ApiResponse<never>> {
  return NextResponse.json({ success: false, error: message, details }, { status });
}

export function apiValidationError(error: ZodError, status = 400): NextResponse<ApiResponse<never>> {
  return NextResponse.json({
    success: false,
    error: 'Validation error',
    issues: error.errors.map(e => ({
      path: e.path.join('.'),
      message: e.message,
    })),
  }, { status });
}

export function apiUnauthorized(message = 'Unauthorized'): NextResponse<ApiResponse<never>> {
  return apiError(message, 401);
}

export function apiNotFound(message = 'Not found'): NextResponse<ApiResponse<never>> {
  return apiError(message, 404);
}

// Higher-order handler for API routes
export function withApiHandler<T>(handler: (req: Request) => Promise<NextResponse<ApiResponse<T>>>) {
  return async function (req: Request) {
    try {
      return await handler(req);
    } catch (error) {
      if (error instanceof ZodError) {
        return apiValidationError(error);
      }
      if (error instanceof Error) {
        return apiError(error.message);
      }
      return apiError('Internal Server Error');
    }
  };
}
