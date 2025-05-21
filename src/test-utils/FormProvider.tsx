import React, { ReactNode } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ZodSchema } from 'zod';

type TestFormProviderProps<T> = {
  children: ReactNode;
  schema: ZodSchema<T>;
  defaultValues?: Partial<T>;
};

export function TestFormProvider<T>({ 
  children, 
  schema, 
  defaultValues = {} 
}: TestFormProviderProps<T>) {
  const methods = useForm({
    resolver: zodResolver(schema),
    defaultValues: defaultValues as any,
  });

  return (
    <FormProvider {...methods}>
      <form onSubmit={methods.handleSubmit(() => {})}>
        {children}
      </form>
    </FormProvider>
  );
}
