/**
 * API utilities for working with Zod schemas
 */
import { z } from 'zod';
import { ApiResponse } from './types/api';
import {
  ApiResponseSchema,
  createApiSuccessSchema,
  ApiErrorResponseSchema,
  ApiSuccessResponseSchema
} from './schemas';

/**
 * Validate an API response against a Zod schema
 * @param response The API response to validate
 * @param schema The Zod schema to validate against
 * @returns The validated response data, or throws an error if validation fails
 */
export function validateApiResponse<T extends z.ZodTypeAny>(
  response: unknown,
  schema: T
): z.infer<T> {
  return schema.parse(response);
}

/**
 * Parse and validate a successful API response
 * @param response The API response
 * @param dataSchema Schema for the data property
 * @returns The validated data
 * @throws Error if the response is not successful or doesn't match the schema
 */
export function parseApiSuccess<T extends z.ZodTypeAny>(
  response: unknown,
  dataSchema: T
): z.infer<T> {
  // First validate it's a success response
  const apiResponse = ApiSuccessResponseSchema.parse(response);
  // Then validate the data
  return dataSchema.parse(apiResponse.data);
}

/**
 * Type guard for API success responses
 * @param response The API response to check
 * @returns True if the response is a success response
 */
export function isApiSuccess<T>(response: ApiResponse<T>): response is { success: true; data: T } {
  return response.success === true;
}

/**
 * Type guard for API error responses
 * @param response The API response to check
 * @returns True if the response is an error response
 */
export function isApiError(response: ApiResponse<unknown>): response is { 
  success: false; 
  error: string; 
  details?: unknown; 
  issues?: { path: string; message: string }[] 
} {
  return response.success === false;
}

/**
 * Wrap a fetch request with error handling and response validation
 * @param url The URL to fetch
 * @param options Fetch options
 * @param responseSchema Schema for the response data
 * @returns The validated response data
 * @throws Error if the request fails or the response doesn't match the schema
 */
export async function fetchWithValidation<T extends z.ZodTypeAny>(
  url: string,
  options: RequestInit,
  responseSchema: T
): Promise<z.infer<T>> {
  const response = await fetch(url, options);
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Request failed with status ${response.status}: ${errorText}`);
  }
  
  const data = await response.json();
  return validateApiResponse(data, responseSchema);
}

/**
 * Utility for making validated API requests
 * @param url The URL to fetch
 * @param options Fetch options
 * @param dataSchema Schema for the expected data
 * @returns The validated data if successful
 * @throws Error if the request fails or the response doesn't match the schema
 */
export async function fetchApi<T extends z.ZodTypeAny>(
  url: string,
  options: RequestInit = {},
  dataSchema: T
): Promise<z.infer<T>> {
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });
  
  const responseData = await response.json() as ApiResponse<unknown>;
  
  if (!isApiSuccess(responseData)) {
    throw new Error(responseData.error || 'API request failed');
  }
  
  return dataSchema.parse(responseData.data);
}
