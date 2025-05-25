/**
 * Type definitions for React Hook Form types used across the application
 * Re-exports from react-hook-form to provide a consistent interface
 */

// Re-export essential types from react-hook-form
export type {
  Control,
  FieldErrors,
  UseFormRegister,
  ControllerRenderProps,
  ControllerFieldState,
  UseFormHandleSubmit,
  UseFormReturn
} from 'react-hook-form';

// Additional types for form components
export interface FormFieldProps<T = unknown> {
  value: T;
  onChange: (value: T) => void;
  onBlur: () => void;
  name: string;
}
