'use client';

import { useState, useCallback } from 'react';
import logger from '@/lib/logger';

interface UseAsyncState<T> {
  data: T | null;
  isLoading: boolean;
  error: Error | null;
  run: (promise: Promise<T>) => Promise<T | null>;
  setData: (data: T) => void;
  reset: () => void;
}

/**
 * A hook for handling asynchronous operations with consistent loading and error states
 * @param initialData Initial data value
 * @returns Object containing data, loading state, error state, and functions to control them
 */
export function useAsync<T>(initialData: T | null = null): UseAsyncState<T> {
  const [data, setData] = useState<T | null>(initialData);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  const run = useCallback(async (promise: Promise<T>): Promise<T | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await promise;
      setData(result);
      return result;
    } catch (err) {
      logger.error('Error in useAsync:', err);
      const errorObject = err instanceof Error ? err : new Error(String(err));
      setError(errorObject);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setData(initialData);
    setIsLoading(false);
    setError(null);
  }, [initialData]);

  return { data, isLoading, error, run, setData, reset };
}

/**
 * A hook for handling form submissions with consistent loading and error states
 * @param onSubmit The submission handler function
 * @returns Object containing submit function, loading state, and error state
 */
export function useSubmit<T>(
  onSubmit: (data: T) => Promise<unknown>
): {
  handleSubmit: (data: T) => Promise<unknown>;
  isSubmitting: boolean;
  error: Error | null;
  reset: () => void;
} {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const handleSubmit = useCallback(
    async (data: T) => {
      setIsSubmitting(true);
      setError(null);

      try {
        return await onSubmit(data);
      } catch (err) {
        logger.error('Error in form submission:', err);
        const errorObject = err instanceof Error ? err : new Error(String(err));
        setError(errorObject);
        throw errorObject;
      } finally {
        setIsSubmitting(false);
      }
    },
    [onSubmit]
  );

  const reset = useCallback(() => {
    setIsSubmitting(false);
    setError(null);
  }, []);

  return { handleSubmit, isSubmitting, error, reset };
}

/**
 * A hook to handle API requests with automatic error handling and response parsing
 * @returns Object containing fetch function and state
 */
export function useFetch() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchApi = useCallback(async <T>(
    url: string,
    options?: RequestInit
  ): Promise<T> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(url, options);
      
      const contentType = response.headers.get('content-type');
      const isJson = contentType && contentType.includes('application/json');
      
      // Parse the response based on content type
      const data = isJson ? await response.json() : await response.text();

      if (!response.ok) {
        const errorMessage = isJson && data.error ? data.error : `Request failed with status: ${response.status}`;
        throw new Error(errorMessage);
      }

      return data as T;
    } catch (err) {
      logger.error('Fetch error:', err);
      const errorObject = err instanceof Error ? err : new Error(String(err));
      setError(errorObject);
      throw errorObject;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { fetchApi, isLoading, error, setError };
}
