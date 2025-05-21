'use client';

import React from 'react';
import { Controller } from 'react-hook-form';
import { z } from 'zod';
import { FieldErrors, UseFormRegister, Control } from '@/lib/form-types';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ErrorMessage } from '@/components/StatusMessages';

/**
 * Schema for the feature form data
 */
export const FeatureTemplateSchema = z.object({
  name: z.string()
    .min(3, { message: 'Name must be at least 3 characters long' })
    .max(50, { message: 'Name must be less than 50 characters' }),
  description: z.string()
    .max(500, { message: 'Description must be less than 500 characters' })
    .optional(),
  category: z.enum(['personal', 'work', 'other'], {
    errorMap: () => ({ message: 'Please select a valid category' }),
  }),
  isActive: z.boolean().default(true),
  tags: z.array(z.string()).optional(),
  settings: z.object({
    notifications: z.boolean().default(true),
    visibility: z.enum(['public', 'private', 'unlisted']).default('private'),
  }).optional(),
});

// Extract the schema type for the feature form
export type FeatureTemplateData = z.infer<typeof FeatureTemplateSchema>;

/**
 * Props for FeatureTemplateWithZod component
 */
export interface FeatureTemplateWithZodProps {
  // Form handling (provided by react-hook-form)
  register: UseFormRegister<FeatureTemplateData>;
  errors: FieldErrors<FeatureTemplateData>;
  control: Control<FeatureTemplateData>; 
  
  // Optional form change handler
  onChange?: (field: string, value: any) => void;
  
  // Optional display customization
  submitText?: string;
  showCancelButton?: boolean;
  onCancel?: () => void;
  isSubmitting?: boolean;
  
  // Initial data (for edit mode)
  initialData?: Partial<FeatureTemplateData>;
}

/**
 * FeatureTemplateWithZod - A form component using Zod validation
 * 
 * This component is designed to be used with react-hook-form and Zod validation.
 * It demonstrates best practices for form handling in the application.
 */
export function FeatureTemplateWithZod({
  register,
  errors,
  control,
  onChange,
  submitText = 'Save',
  showCancelButton = true,
  onCancel,
  isSubmitting = false,
  initialData,
}: FeatureTemplateWithZodProps) {
  // Handler for controlled form elements
  const handleFieldChange = (field: string, value: any) => {
    if (onChange) {
      onChange(field, value);
    }
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <h2 className="text-2xl font-bold">Feature Template</h2>
        <p className="text-gray-500 dark:text-gray-400">
          Enter the details below to {initialData ? 'update' : 'create'} your feature.
        </p>
      </CardHeader>
      
      <CardContent>
        <form className="space-y-6">
          {/* Name field */}
          <div className="space-y-2">
            <label 
              htmlFor="name" 
              className="block text-sm font-medium text-gray-700 dark:text-gray-200"
            >
              Name *
            </label>
            <input
              id="name"
              type="text"
              {...register('name')}
              className={`w-full px-3 py-2 border rounded-md ${
                errors.name 
                  ? 'border-red-500 focus:ring-red-500 focus:border-red-500' 
                  : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
              } dark:bg-gray-700 dark:border-gray-600`}
              placeholder="Enter name"
              aria-invalid={errors.name ? 'true' : 'false'}
              data-testid="name-input"
            />
            {errors.name && (
              <ErrorMessage>{errors.name.message}</ErrorMessage>
            )}
          </div>
          
          {/* Description field */}
          <div className="space-y-2">
            <label 
              htmlFor="description" 
              className="block text-sm font-medium text-gray-700 dark:text-gray-200"
            >
              Description
            </label>
            <textarea
              id="description"
              {...register('description')}
              className={`w-full px-3 py-2 border rounded-md ${
                errors.description 
                  ? 'border-red-500 focus:ring-red-500 focus:border-red-500' 
                  : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
              } dark:bg-gray-700 dark:border-gray-600`}
              rows={4}
              placeholder="Enter description (optional)"
              aria-invalid={errors.description ? 'true' : 'false'}
              data-testid="description-input"
            />
            {errors.description && (
              <ErrorMessage>{errors.description.message}</ErrorMessage>
            )}
          </div>
          
          {/* Category field - using Controller for custom select */}
          <div className="space-y-2">
            <label 
              htmlFor="category" 
              className="block text-sm font-medium text-gray-700 dark:text-gray-200"
            >
              Category *
            </label>
            <Controller
              name="category"
              control={control}
              render={({ field }) => (
                <select
                  id="category"
                  className={`w-full px-3 py-2 border rounded-md ${
                    errors.category 
                      ? 'border-red-500 focus:ring-red-500 focus:border-red-500' 
                      : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                  } dark:bg-gray-700 dark:border-gray-600`}
                  {...field}
                  onChange={(e) => {
                    field.onChange(e);
                    handleFieldChange('category', e.target.value);
                  }}
                  data-testid="category-select"
                >
                  <option value="">Select a category</option>
                  <option value="personal">Personal</option>
                  <option value="work">Work</option>
                  <option value="other">Other</option>
                </select>
              )}
            />
            {errors.category && (
              <ErrorMessage>{errors.category.message}</ErrorMessage>
            )}
          </div>
          
          {/* IsActive field - checkbox */}
          <div className="flex items-center space-x-2">
            <input
              id="isActive"
              type="checkbox"
              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700"
              {...register('isActive')}
              data-testid="active-checkbox"
            />
            <label 
              htmlFor="isActive" 
              className="text-sm font-medium text-gray-700 dark:text-gray-200"
            >
              Active
            </label>
          </div>
          
          {/* Form actions */}
          <div className="flex justify-end space-x-3 pt-4">
            {showCancelButton && (
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={isSubmitting}
                data-testid="cancel-button"
              >
                Cancel
              </Button>
            )}
            
            <Button
              type="submit"
              disabled={isSubmitting}
              data-testid="submit-button"
            >
              {isSubmitting ? 'Saving...' : submitText}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
