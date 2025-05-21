'use client';

import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { FeatureTemplateWithZod, FeatureTemplateSchema } from './FeatureTemplateWithZod';
import type { FeatureTemplateData } from './FeatureTemplateWithZod';

/**
 * Props for the bridge component - matches the original API
 */
export interface FeatureTemplateBridgeProps {
  initialData?: Partial<FeatureTemplateData>;
  onSubmit?: (data: FeatureTemplateData) => void | Promise<void>;
  onCancel?: () => void;
  submitText?: string;
  showCancelButton?: boolean;
  isSubmitting?: boolean;
  
  // Legacy direct state setters for backward compatibility
  setName?: (value: string) => void;
  setDescription?: (value: string) => void;
  setCategory?: (value: string) => void;
  setIsActive?: (value: boolean) => void;
}

/**
 * FeatureTemplateBridge - Bridge component for backward compatibility
 * 
 * This component adapts the new Zod-validated component to work with
 * the original API, providing a smooth transition path for existing code.
 */
export function FeatureTemplateBridge({
  initialData,
  onSubmit,
  onCancel,
  submitText = 'Save',
  showCancelButton = true,
  isSubmitting = false,
  
  // Legacy state setters
  setName,
  setDescription,
  setCategory,
  setIsActive,
}: FeatureTemplateBridgeProps) {
  // Initialize the form with react-hook-form and zod validation
  const form = useForm<FeatureTemplateData>({
    resolver: zodResolver(FeatureTemplateSchema),
    defaultValues: initialData || {
      name: '',
      description: '',
      category: 'personal',
      isActive: true,
    },
  });
  
  // Handle form submission
  const handleSubmit = form.handleSubmit(async (data) => {
    if (onSubmit) {
      await onSubmit(data);
    }
  });
  
  // Handle field changes for legacy state setters
  const handleChange = (field: string, value: any) => {
    // Call the appropriate setter based on the field name
    switch (field) {
      case 'name':
        setName?.(value);
        break;
      case 'description':
        setDescription?.(value);
        break;
      case 'category':
        setCategory?.(value);
        break;
      case 'isActive':
        setIsActive?.(value);
        break;
      default:
        break;
    }
  };
  
  return (
    <form onSubmit={handleSubmit}>
      <FeatureTemplateWithZod
        register={form.register}
        errors={form.formState.errors}
        control={form.control}
        onChange={handleChange}
        submitText={submitText}
        showCancelButton={showCancelButton}
        onCancel={onCancel}
        isSubmitting={isSubmitting}
        initialData={initialData}
      />
    </form>
  );
}
