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
  
  // Optional legacy props for backward compatibility
  title?: string;
  setTitle?: (title: string) => void;
  description?: string;
  setDescription?: (description: string) => void;
  isPublic?: boolean;
  setIsPublic?: (isPublic: boolean) => void;
  // Theming options
  themeColor?: string | null;
  setThemeColor?: (themeColor: string) => void;
  backgroundColor?: string | null;
  setBackgroundColor?: (backgroundColor: string) => void;
  backgroundImageUrl?: string | null;
  setBackgroundImageUrl?: (backgroundImageUrl: string) => void;
  accentColor?: string | null;
  setAccentColor?: (accentColor: string) => void;
  fontFamily?: string | null;
  setFontFamily?: (fontFamily: string) => void;
  displayMode?: string | null;
  setDisplayMode?: (displayMode: string) => void;
  layoutType?: string | null;
  setLayoutType?: (layoutType: string) => void;
  
  // Flag to determine if we're using the new form api or the old one
  useReactHookForm?: boolean;
}

export function GalleryDetailsForm({
  register,
  errors,
  control,
  useReactHookForm = false,
  // Legacy props
  title = '',
  setTitle = () => {},
  description = '',
  setDescription = () => {},
  isPublic = false,
  setIsPublic = () => {},
  themeColor = '',
  setThemeColor = () => {},
  backgroundColor = '',
  setBackgroundColor = () => {},
  backgroundImageUrl = '',
  setBackgroundImageUrl = () => {},
  accentColor = '',
  setAccentColor = () => {},
  fontFamily = '',
  setFontFamily = () => {},
  displayMode = '',
  setDisplayMode = () => {},
  layoutType = '',
  setLayoutType = () => {}
}: GalleryDetailsFormProps) {
  return (
    <Card>
      <CardHeader>
        <h2 className="text-xl font-semibold">Gallery Details & Theme</h2>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-4">
          <div>
            <label htmlFor="gallery-title" className="block text-sm font-medium mb-1">Title</label>
            <input
              id="gallery-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
              placeholder="Enter gallery title"
              required
            />
          </div>
          
          <div>
            <label htmlFor="gallery-description" className="block text-sm font-medium mb-1">Description</label>
            <textarea
              id="gallery-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
              placeholder="Enter gallery description"
              rows={3}
            />
          </div>
          
          <div>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={isPublic}
                onChange={(e) => setIsPublic(e.target.checked)}
                className="rounded"
                id="gallery-public"
              />
              <span className="text-sm font-medium">Make gallery public</span>
            </label>
          </div>

          {/* Theming Section */}
          <div className="pt-4 border-t dark:border-gray-700">
            <h3 className="text-lg font-medium mb-2">Theme Options</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="theme-color" className="block text-sm font-medium mb-1">Theme Color</label>
                <div className="flex items-center space-x-2">
                  <input
                    id="theme-color-text"
                    type="text"
                    value={themeColor || ''}
                    onChange={(e) => setThemeColor(e.target.value)}
                    className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
                    placeholder="e.g., #FF0000"
                  />
                  <input
                    id="theme-color-picker"
                    type="color"
                    value={themeColor || '#000000'} // Default to black if no color
                    onChange={(e) => setThemeColor(e.target.value)}
                    className="h-10 w-10 p-0 border-none rounded-md cursor-pointer dark:bg-gray-700"
                    title="Select Theme Color"
                  />
                </div>
              </div>
              <div>
                <label htmlFor="background-color" className="block text-sm font-medium mb-1">Background Color</label>
                <div className="flex items-center space-x-2">
                  <input
                    id="background-color-text"
                    type="text"
                    value={backgroundColor || ''}
                    onChange={(e) => setBackgroundColor(e.target.value)}
                    className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
                    placeholder="e.g., #FFFFFF"
                  />
                  <input
                    id="background-color-picker"
                    type="color"
                    value={backgroundColor || '#FFFFFF'} // Default to white if no color
                    onChange={(e) => setBackgroundColor(e.target.value)}
                    className="h-10 w-10 p-0 border-none rounded-md cursor-pointer dark:bg-gray-700"
                    title="Select Background Color"
                  />
                </div>
              </div>
              <div>
                <label htmlFor="accent-color" className="block text-sm font-medium mb-1">Accent Color</label>
                <div className="flex items-center space-x-2">
                  <input
                    id="accent-color-text"
                    type="text"
                    value={accentColor || ''}
                    onChange={(e) => setAccentColor(e.target.value)}
                    className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
                    placeholder="e.g., #0000FF"
                  />
                  <input
                    id="accent-color-picker"
                    type="color"
                    value={accentColor || '#0000FF'} // Default to blue if no color
                    onChange={(e) => setAccentColor(e.target.value)}
                    className="h-10 w-10 p-0 border-none rounded-md cursor-pointer dark:bg-gray-700"
                    title="Select Accent Color"
                  />
                </div>
              </div>
              <div>
                <label htmlFor="font-family" className="block text-sm font-medium mb-1">Font Family</label>
                <input
                  id="font-family"
                  type="text"
                  value={fontFamily || ''}
                  onChange={(e) => setFontFamily(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
                  placeholder="e.g., Arial, sans-serif"
                />
              </div>
              <div className="md:col-span-2">
                <label htmlFor="background-image-url" className="block text-sm font-medium mb-1">Background Image URL</label>
                <input
                  id="background-image-url"
                  type="url"
                  value={backgroundImageUrl || ''}
                  onChange={(e) => setBackgroundImageUrl(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
                  placeholder="https://example.com/image.jpg"
                />
              </div>
              <div>
                <label htmlFor="display-mode" className="block text-sm font-medium mb-1">Display Mode</label>
                <select
                  id="display-mode"
                  value={displayMode || 'carousel'}
                  onChange={(e) => setDisplayMode(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
                >
                  <option value="carousel">Carousel</option>
                  <option value="grid">Grid</option>
                  <option value="wall">Wall</option>
                  <option value="slideshow">Slideshow</option>
                </select>
              </div>
              <div>
                <label htmlFor="layout-type" className="block text-sm font-medium mb-1">Layout Type</label>
                <select
                  id="layout-type"
                  value={layoutType || 'contained'}
                  onChange={(e) => setLayoutType(e.target.value)}
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
