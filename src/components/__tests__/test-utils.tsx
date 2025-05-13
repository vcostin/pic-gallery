import type { FormEvent } from 'react';

// Utility types for tests
export interface DialogProps {
  isOpen: boolean;
  title?: string;
  message?: string;
  onConfirm?: () => void;
  onCancel?: () => void;
  children?: React.ReactNode;
}

export type SubmitCallback = (e?: FormEvent) => Promise<any>;

export interface FetchApiOptions extends RequestInit {
  signal?: AbortSignal;
}

export interface UseFetchReturnType {
  fetchApi: <T>(url: string, options?: FetchApiOptions) => Promise<T>;
  isLoading: boolean;
  error: Error | null;
  setError: (error: Error | null) => void;
}

export interface UseSubmitReturnType {
  handleSubmit: (e?: FormEvent) => Promise<any>;
  isSubmitting: boolean;
  error: Error | null;
  reset: () => void;
}
