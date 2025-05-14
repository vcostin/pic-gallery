'use client';

import React from 'react';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { UseFormRegister, FieldErrors, Controller, Control } from 'react-hook-form';
import { z } from 'zod';
import { CreateGallerySchema } from '@/lib/schemas';

// Define the form data type from the schema
export type GalleryFormData = z.infer<typeof CreateGallerySchema>;

// Props that accept react-hook-form register and errors
interface GalleryDetailsFormProps {
  register: UseFormRegister<GalleryFormData>;
  errors: FieldErrors<GalleryFormData>;
  control: Control<GalleryFormData>;
  defaultValues?: Partial<GalleryFormData>;
}

export function GalleryDetailsFormWithZod({
  register,
  errors,
  control,
  defaultValues
}: GalleryDetailsFormProps) {
  return (
    <Card>
      <CardHeader>
        <h2 className="text-xl font-semibold">Gallery Details & Theme</h2>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-4">
          <div>
            <label htmlFor="title" className="block text-sm font-medium mb-1">Title</label>
            <input
              id="title"
              {...register('title')}
              className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
              placeholder="Enter gallery title"
            />
            {errors.title && (
              <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
            )}
          </div>
          
          <div>
            <label htmlFor="description" className="block text-sm font-medium mb-1">Description</label>
            <textarea
              id="description"
              {...register('description')}
              className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
              placeholder="Enter gallery description"
              rows={3}
            />
            {errors.description && (
              <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
            )}
          </div>
          
          <div>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="isPublic"
                {...register('isPublic')}
                className="rounded"
              />
              <span className="text-sm font-medium">Make gallery public</span>
            </label>
          </div>

          {/* Theming Section */}
          <div className="pt-4 border-t dark:border-gray-700">
            <h3 className="text-lg font-medium mb-2">Theme Options</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="themeColor" className="block text-sm font-medium mb-1">Theme Color</label>
                <div className="flex items-center space-x-2">
                  <Controller
                    name="themeColor"
                    control={control}
                    render={({ field }) => (
                      <>
                        <input
                          id="themeColor-text"
                          type="text"
                          value={field.value || ''}
                          onChange={(e) => field.onChange(e.target.value)}
                          className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
                          placeholder="e.g., #FF0000"
                        />
                        <input
                          id="themeColor-picker"
                          type="color"
                          value={field.value || '#000000'} // Default to black if no color
                          onChange={(e) => field.onChange(e.target.value)}
                          className="h-10 w-10 p-0 border-none rounded-md cursor-pointer dark:bg-gray-700"
                          title="Select Theme Color"
                        />
                      </>
                    )}
                  />
                </div>
              </div>
              <div>
                <label htmlFor="backgroundColor" className="block text-sm font-medium mb-1">Background Color</label>
                <div className="flex items-center space-x-2">
                  <Controller
                    name="backgroundColor"
                    control={control}
                    render={({ field }) => (
                      <>
                        <input
                          id="backgroundColor-text"
                          type="text"
                          value={field.value || ''}
                          onChange={(e) => field.onChange(e.target.value)}
                          className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
                          placeholder="e.g., #FFFFFF"
                        />
                        <input
                          id="backgroundColor-picker"
                          type="color"
                          value={field.value || '#FFFFFF'} // Default to white if no color
                          onChange={(e) => field.onChange(e.target.value)}
                          className="h-10 w-10 p-0 border-none rounded-md cursor-pointer dark:bg-gray-700"
                          title="Select Background Color"
                        />
                      </>
                    )}
                  />
                </div>
              </div>
              <div>
                <label htmlFor="accentColor" className="block text-sm font-medium mb-1">Accent Color</label>
                <div className="flex items-center space-x-2">
                  <Controller
                    name="accentColor"
                    control={control}
                    render={({ field }) => (
                      <>
                        <input
                          id="accentColor-text"
                          type="text"
                          value={field.value || ''}
                          onChange={(e) => field.onChange(e.target.value)}
                          className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
                          placeholder="e.g., #0000FF"
                        />
                        <input
                          id="accentColor-picker"
                          type="color"
                          value={field.value || '#0000FF'} // Default to blue if no color
                          onChange={(e) => field.onChange(e.target.value)}
                          className="h-10 w-10 p-0 border-none rounded-md cursor-pointer dark:bg-gray-700"
                          title="Select Accent Color"
                        />
                      </>
                    )}
                  />
                </div>
              </div>
              
              <div>
                <label htmlFor="fontFamily" className="block text-sm font-medium mb-1">Font Family</label>
                <input
                  id="fontFamily"
                  {...register('fontFamily')}
                  className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
                  placeholder="e.g., Arial, sans-serif"
                />
              </div>
              
              <div className="md:col-span-2">
                <label htmlFor="backgroundImageUrl" className="block text-sm font-medium mb-1">Background Image URL</label>
                <input
                  id="backgroundImageUrl"
                  {...register('backgroundImageUrl')}
                  className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
                  placeholder="https://example.com/image.jpg"
                />
              </div>
              
              <div>
                <label htmlFor="displayMode" className="block text-sm font-medium mb-1">Display Mode</label>
                <select
                  id="displayMode"
                  {...register('displayMode')}
                  className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
                >
                  <option value="carousel">Carousel</option>
                  <option value="grid">Grid</option>
                  <option value="wall">Wall</option>
                  <option value="slideshow">Slideshow</option>
                </select>
              </div>
              
              <div>
                <label htmlFor="layoutType" className="block text-sm font-medium mb-1">Layout Type</label>
                <select
                  id="layoutType"
                  {...register('layoutType')}
                  className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
                >
                  <option value="contained">Contained</option>
                  <option value="full-width">Full Width</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
