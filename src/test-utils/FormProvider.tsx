import React, { ReactNode } from 'react';
import { FormProvider, useForm, FieldValues } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ZodSchema } from 'zod';

type TestFormProviderProps<T extends FieldValues> = {
  children: ReactNode;
  schema: ZodSchema<T>;
  defaultValues?: Partial<T>;
};

export function TestFormProvider<T extends FieldValues>({ 
  children, 
  schema, 
  defaultValues = {} 
}: TestFormProviderProps<T>) {
  const methods = useForm<T>({
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
