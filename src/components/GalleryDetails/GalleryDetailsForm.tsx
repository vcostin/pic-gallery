/**
 * @fileoverview GalleryDetailsForm Component
 * 
 * A form for creating and editing gallery details with Zod schema validation.
 * This is the modern implementation with strong type safety and validation.
 */

'use client';

import React from 'react';
import { z } from 'zod';
import { FieldErrors, UseFormRegister } from '@/lib/form-types';
import { CreateGallerySchema } from '@/lib/schemas';

// Simple inline Card components to avoid import issues
const Card = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <div data-testid="card" className={`rounded-lg shadow bg-white dark:bg-gray-800 ${className}`}>{children}</div>
);

const CardHeader = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <div data-testid="card-header" className={`p-4 border-b border-gray-200 dark:border-gray-700 ${className}`}>{children}</div>
);

const CardContent = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <div data-testid="card-content" className={`p-4 ${className}`}>{children}</div>
);

// Extract the schema type for the gallery form
export type GalleryFormData = z.infer<typeof CreateGallerySchema>;

/**
 * Props for GalleryDetailsForm component
 */
export interface GalleryDetailsFormProps {
  // Form handling (provided by react-hook-form)
  register: UseFormRegister<GalleryFormData>;
  errors: FieldErrors<GalleryFormData>;
  
  // Optional form change handler
  onChange?: (field: string, value: unknown) => void;
  
  // Optional display customization
  submitText?: string;
  showCancelButton?: boolean;
  onCancel?: () => void;
  isSubmitting?: boolean;
  
  // Additional content
  children?: React.ReactNode;
  className?: string;
}

/**
 * Gallery details form component with Zod validation
 */
export function GalleryDetailsForm({
  register,
  errors,
  onChange,
  submitText = 'Save',
  showCancelButton = true,
  onCancel,
  isSubmitting = false,
  children,
  className = '',
}: GalleryDetailsFormProps) {
  return (
    <Card className={className}>
      <CardHeader>
        <h2 className="text-lg font-medium">Gallery Details</h2>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4">
          <div>
            <label htmlFor="title" className="block mb-1 font-medium">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              id="title"
              {...register('title', {
                onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
                  onChange?.('title', e.target.value);
                }
              })}
              className={`w-full p-2 border ${errors.title ? 'border-red-500' : 'border-gray-300'} rounded`}
              aria-invalid={!!errors.title}
              data-testid="gallery-title-input"
              aria-errormessage={errors.title ? "title-error" : undefined}
            />
            {errors.title && (
              <p id="title-error" className="mt-1 text-sm text-red-500">
                {errors.title.message}
              </p>
            )}
          </div>
          
          <div>
            <label htmlFor="description" className="block mb-1 font-medium">
              Description
            </label>
            <textarea
              id="description"
              {...register('description', {
                onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => {
                  onChange?.('description', e.target.value);
                }
              })}
              className={`w-full p-2 border ${errors.description ? 'border-red-500' : 'border-gray-300'} rounded`}
              rows={4}
              aria-invalid={!!errors.description}
              data-testid="gallery-description-input"
              aria-errormessage={errors.description ? "description-error" : undefined}
            />
            {errors.description && (
              <p id="description-error" className="mt-1 text-sm text-red-500">
                {errors.description.message}
              </p>
            )}
          </div>
          
          <div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                {...register('isPublic', {
                  onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
                    onChange?.('isPublic', e.target.checked);
                  }
                })}
                className="w-4 h-4"
                data-testid="gallery-is-public-checkbox"
              />
              <span>Public Gallery</span>
            </label>
            <p className="text-sm text-gray-500 mt-1">
              Public galleries can be viewed by anyone with the link
            </p>
          </div>
          
          {/* Theme options */}
          <div className="bg-gray-50 p-3 rounded-md">
            <h3 className="font-medium mb-3">Gallery Appearance</h3>
            
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label htmlFor="themeColor" className="block mb-1 text-sm font-medium">
                  Theme Color
                </label>
                <input
                  id="themeColor"
                  type="color"
                  {...register('themeColor', {
                    onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
                      onChange?.('themeColor', e.target.value);
                    }
                  })}
                  className="w-full p-1 border border-gray-300 rounded h-10"
                  data-testid="gallery-theme-color-input"
                  defaultValue="#6366f1"
                />
              </div>
              
              <div>
                <label htmlFor="backgroundColor" className="block mb-1 text-sm font-medium">
                  Background Color
                </label>
                <input
                  id="backgroundColor"
                  type="color"
                  {...register('backgroundColor', {
                    onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
                      onChange?.('backgroundColor', e.target.value);
                    }
                  })}
                  className="w-full p-1 border border-gray-300 rounded h-10"
                  data-testid="gallery-background-color-input"
                  defaultValue="#ffffff"
                />
              </div>
              
              <div>
                <label htmlFor="accentColor" className="block mb-1 text-sm font-medium">
                  Accent Color
                </label>
                <input
                  id="accentColor"
                  type="color"
                  {...register('accentColor', {
                    onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
                      onChange?.('accentColor', e.target.value);
                    }
                  })}
                  className="w-full p-1 border border-gray-300 rounded h-10"
                  data-testid="gallery-accent-color-input"
                  defaultValue="#10b981"
                />
              </div>
              
              <div>
                <label htmlFor="fontFamily" className="block mb-1 text-sm font-medium">
                  Font Family
                </label>
                <select
                  id="fontFamily"
                  {...register('fontFamily', {
                    onChange: (e: React.ChangeEvent<HTMLSelectElement>) => {
                      onChange?.('fontFamily', e.target.value);
                    }
                  })}
                  className="w-full p-2 border border-gray-300 rounded"
                  data-testid="gallery-font-family-select"
                  defaultValue="sans-serif"
                >
                  <option value="sans-serif">Sans Serif</option>
                  <option value="serif">Serif</option>
                  <option value="monospace">Monospace</option>
                </select>
              </div>
              
              <div>
                <label htmlFor="displayMode" className="block mb-1 text-sm font-medium">
                  Display Mode
                </label>
                <select
                  id="displayMode"
                  {...register('displayMode', {
                    onChange: (e: React.ChangeEvent<HTMLSelectElement>) => {
                      onChange?.('displayMode', e.target.value);
                    }
                  })}
                  className="w-full p-2 border border-gray-300 rounded"
                  data-testid="gallery-display-mode-select"
                  defaultValue="grid"
                >
                  <option value="grid">Grid</option>
                  <option value="carousel">Carousel</option>
                  <option value="slideshow">Slideshow</option>
                </select>
              </div>
              
              <div>
                <label htmlFor="layoutType" className="block mb-1 text-sm font-medium">
                  Layout Type
                </label>
                <select
                  id="layoutType"
                  {...register('layoutType', {
                    onChange: (e: React.ChangeEvent<HTMLSelectElement>) => {
                      onChange?.('layoutType', e.target.value);
                    }
                  })}
                  className="w-full p-2 border border-gray-300 rounded"
                  data-testid="gallery-layout-type-select"
                  defaultValue="masonry"
                >
                  <option value="masonry">Masonry</option>
                  <option value="uniform">Uniform</option>
                  <option value="compact">Compact</option>
                </select>
              </div>
            </div>
          </div>
          
          {/* Additional content */}
          {children}
          
          <div className="flex justify-between pt-4">
            {showCancelButton && onCancel && (
              <button
                type="button"
                onClick={onCancel}
                className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
                disabled={isSubmitting}
                data-testid="gallery-details-cancel-button"
              >
                Cancel
              </button>
            )}
            <button
              type="submit"
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 ml-auto"
              disabled={isSubmitting}
              data-testid="gallery-details-submit-button"
            >
              {isSubmitting ? 'Saving...' : submitText}
            </button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
