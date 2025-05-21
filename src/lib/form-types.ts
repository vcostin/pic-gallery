/**
 * Type definitions for React Hook Form types used across the application
 * This helps standardize form component typing and avoids direct imports
 * from react-hook-form's internals which can change between versions.
 */

// Basic field error type - simplified version of what react-hook-form uses
export type FieldErrors<T> = Partial<Record<keyof T, { message?: string }>>;

// Definition for the register function type
export interface UseFormRegister<T> {
  (name: keyof T): {
    onChange: (e: any) => void;
    onBlur: () => void;
    name: string;
    ref: (instance: any) => void;
  };
}

// Definition for the control object type
export type Control<T> = any;

// Field object passed to Controller render function
export interface FieldRenderProps<T = any> {
  field: {
    value: T;
    onChange: (value: T) => void;
    onBlur: () => void;
    name: string;
    ref: React.Ref<any>;
  };
  fieldState: {
    invalid: boolean;
    isTouched: boolean;
    isDirty: boolean;
    error?: {
      type: string;
      message?: string;
    };
  };
}
