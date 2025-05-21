import React from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

interface FormProviderWrapperProps {
  children: React.ReactNode;
  defaultValues?: Record<string, any>;
  schema?: z.ZodSchema<any>;
}

export function FormProviderWrapper({ children, defaultValues = {}, schema }: FormProviderWrapperProps) {
  const methods = useForm({
    defaultValues,
    resolver: schema ? zodResolver(schema) : undefined
  });

  return (
    <FormProvider {...methods}>
      {children}
    </FormProvider>
  );
}
