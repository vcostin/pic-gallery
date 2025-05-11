/**
 * Custom hooks for making validated API calls
 */
import { useState, useCallback } from 'react';
import { z } from 'zod';
import { fetchApi, isApiError, isApiSuccess } from '../apiUtils';

interface UseApiOptions {
  onSuccess?: (data: any) => void;
  onError?: (error: Error) => void;
}

interface ApiState<T> {
  data: T | null;
  isLoading: boolean;
  error: Error | null;
}

/**
 * Hook for making validated API calls
 * @param dataSchema Zod schema to validate the response data against
 * @param options Options for the API call
 * @returns API state and fetch function
 */
export function useApi<T extends z.ZodTypeAny>(
  dataSchema: T,
  options: UseApiOptions = {}
) {
  type Data = z.infer<typeof dataSchema>;
  const [state, setState] = useState<ApiState<Data>>({
    data: null,
    isLoading: false,
    error: null,
  });

  const fetch = useCallback(
    async (url: string, fetchOptions: RequestInit = {}) => {
      setState(prev => ({ ...prev, isLoading: true, error: null }));

      try {
        const data = await fetchApi(url, fetchOptions, dataSchema);
        
        setState({ data, isLoading: false, error: null });
        options.onSuccess?.(data);
        
        return { success: true as const, data };
      } catch (error) {
        const errorObj = error instanceof Error ? error : new Error(String(error));
        
        setState(prev => ({ ...prev, isLoading: false, error: errorObj }));
        options.onError?.(errorObj);
        
        return { success: false as const, error: errorObj };
      }
    },
    [dataSchema, options]
  );

  return {
    ...state,
    fetch,
    reset: useCallback(() => {
      setState({ data: null, isLoading: false, error: null });
    }, []),
  };
}

/**
 * Hook for making a validated GET request
 * @param url The URL to fetch from
 * @param dataSchema Schema to validate the response data against
 * @param options Options for the API call
 * @returns API state
 */
export function useApiGet<T extends z.ZodTypeAny>(
  url: string | null,
  dataSchema: T,
  options: UseApiOptions & {
    skip?: boolean;
    deps?: any[];
  } = {}
) {
  const api = useApi(dataSchema, options);
  
  const fetchData = useCallback(async () => {
    if (!url || options.skip) return;
    return api.fetch(url, { method: 'GET' });
  }, [url, options.skip, ...(options.deps || []), api.fetch]);
  
  return {
    ...api,
    refetch: fetchData,
  };
}
