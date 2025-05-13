// Mock typings for react-hook-form
/* eslint-disable @typescript-eslint/no-explicit-any */
declare module 'react-hook-form' {
  export interface UseFormProps<TFormValues> {
    resolver?: any;
    defaultValues?: Partial<TFormValues>;
  }

  export interface FormState {
    errors: Record<string, { message?: string }>;
  }
  
  export interface UseFormReturn<TFormValues> {
    register: (name: keyof TFormValues) => any;
    handleSubmit: (onSubmit: (data: TFormValues) => void) => (e: any) => void;
    formState: FormState;
  }
  
  export function useForm<TFormValues>(props?: UseFormProps<TFormValues>): UseFormReturn<TFormValues>;
}
