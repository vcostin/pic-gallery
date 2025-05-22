import { PaginatedResponse } from '@/lib/types';

// API response types
export interface ApiSuccess<T> {
  success: true;
  data: T;
}

export interface ApiError {
  success: false;
  error: string;
  details?: unknown;
  issues?: { path: string; message: string }[];
}

export type ApiResponse<T> = ApiSuccess<T> | ApiError;

// Re-export the PaginatedResponse from ../types
export type { PaginatedResponse };
