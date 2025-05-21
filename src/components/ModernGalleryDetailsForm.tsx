'use client';

import React, { useState } from 'react';
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

/**
 * Define the gallery form data structure
 */
export type GalleryDetailsFormData = {
  title: string;
  description: string;
  isPublic: boolean;
  themeColor: string;
  backgroundColor: string;
  backgroundImageUrl: string;
  accentColor: string;
  fontFamily: string;
  displayMode: string;
  layoutType: string;
};

/**
 * Props for the ModernGalleryDetailsForm component
 */
export interface ModernGalleryDetailsFormProps {
  initialData: Partial<GalleryDetailsFormData>;
  onSubmit: (data: GalleryDetailsFormData) => void;
  onCancel?: () => void;
  isSubmitting?: boolean;
}

/**
 * A modern form component for gallery details with direct form state management.
 * This component serves as a best-practice example for form implementation.
 */
export function ModernGalleryDetailsForm({
  initialData,
  onSubmit,
  onCancel,
  isSubmitting = false
}: ModernGalleryDetailsFormProps): React.ReactElement {
  // Form state management
  const [formData, setFormData] = useState<GalleryDetailsFormData>({
    title: initialData.title || '',
    description: initialData.description || '',
    isPublic: initialData.isPublic || false,
    themeColor: initialData.themeColor || '#000000',
    backgroundColor: initialData.backgroundColor || '#FFFFFF',
    backgroundImageUrl: initialData.backgroundImageUrl || '',
    accentColor: initialData.accentColor || '#0000FF',
    fontFamily: initialData.fontFamily || '',
    displayMode: initialData.displayMode || 'carousel',
    layoutType: initialData.layoutType || 'contained',
  });
  
  // Form validation state
  const [errors, setErrors] = useState<Partial<Record<keyof GalleryDetailsFormData, string>>>({});
  
  // Handle form field changes
  const handleChange = (field: keyof GalleryDetailsFormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Validate the field
    validateField(field, value);
  };
  
  // Validate a specific field
  const validateField = (field: keyof GalleryDetailsFormData, value: string | boolean): void => {
    let errorMessage: string | null = null;
    
    switch (field) {
      case 'title':
        if (typeof value === 'string' && value.trim() === '') {
          errorMessage = 'Title is required';
        }
        break;
      // Add additional validation as needed
    }
    
    // Update errors state based on validation result
    setErrors(prev => {
      if (errorMessage) {
        return { ...prev, [field]: errorMessage };
      } else {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      }
    });
  };
  
  // Validate all fields
  const validateForm = (): boolean => {
    let isValid = true;
    const newErrors: Partial<Record<keyof GalleryDetailsFormData, string>> = {};
    
    // Title is required
    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
      isValid = false;
    }
    
    // Add additional validation rules as needed
    
    setErrors(newErrors);
    return isValid;
  };
  
  // Handle form submission
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (validateForm()) {
      onSubmit(formData);
    }
  };
  
  // Calculate form dirty state
  const isDirty = initialData.title !== formData.title ||
    initialData.description !== formData.description ||
    initialData.isPublic !== formData.isPublic ||
    initialData.themeColor !== formData.themeColor ||
    initialData.backgroundColor !== formData.backgroundColor ||
    initialData.backgroundImageUrl !== formData.backgroundImageUrl ||
    initialData.accentColor !== formData.accentColor ||
    initialData.fontFamily !== formData.fontFamily ||
    initialData.displayMode !== formData.displayMode ||
    initialData.layoutType !== formData.layoutType;
  
  return (
    <Card>
      <CardHeader>
        <h2 className="text-xl font-semibold">Gallery Details & Theme</h2>
      </CardHeader>
      
      <CardContent>
        <form id="gallery-details-form" onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="title" className="block text-sm font-medium mb-1">Title</label>
            <input
              id="title"
              type="text"
              value={formData.title}
              onChange={(e) => handleChange('title', e.target.value)}
              className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
              placeholder="Enter gallery title"
            />
            {errors.title && (
              <p className="mt-1 text-sm text-red-600">{errors.title}</p>
            )}
          </div>
          
          <div>
            <label htmlFor="description" className="block text-sm font-medium mb-1">Description</label>
            <textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
              placeholder="Enter gallery description"
              rows={3}
            />
            {errors.description && (
              <p className="mt-1 text-sm text-red-600">{errors.description}</p>
            )}
          </div>
          
          <div>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="isPublic"
                checked={formData.isPublic}
                onChange={(e) => handleChange('isPublic', e.target.checked)}
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
                  <input
                    id="themeColor-text"
                    type="text"
                    value={formData.themeColor}
                    onChange={(e) => handleChange('themeColor', e.target.value)}
                    className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
                    placeholder="e.g., #FF0000"
                  />
                  <input
                    id="themeColor-picker"
                    type="color"
                    value={formData.themeColor}
                    onChange={(e) => handleChange('themeColor', e.target.value)}
                    className="h-10 w-10 p-0 border-none rounded-md cursor-pointer dark:bg-gray-700"
                    title="Select Theme Color"
                  />
                </div>
              </div>
              
              <div>
                <label htmlFor="backgroundColor" className="block text-sm font-medium mb-1">Background Color</label>
                <div className="flex items-center space-x-2">
                  <input
                    id="backgroundColor-text"
                    type="text"
                    value={formData.backgroundColor}
                    onChange={(e) => handleChange('backgroundColor', e.target.value)}
                    className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
                    placeholder="e.g., #FFFFFF"
                  />
                  <input
                    id="backgroundColor-picker"
                    type="color"
                    value={formData.backgroundColor}
                    onChange={(e) => handleChange('backgroundColor', e.target.value)}
                    className="h-10 w-10 p-0 border-none rounded-md cursor-pointer dark:bg-gray-700"
                    title="Select Background Color"
                  />
                </div>
              </div>
              
              <div>
                <label htmlFor="accentColor" className="block text-sm font-medium mb-1">Accent Color</label>
                <div className="flex items-center space-x-2">
                  <input
                    id="accentColor-text"
                    type="text"
                    value={formData.accentColor}
                    onChange={(e) => handleChange('accentColor', e.target.value)}
                    className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
                    placeholder="e.g., #0000FF"
                  />
                  <input
                    id="accentColor-picker"
                    type="color"
                    value={formData.accentColor}
                    onChange={(e) => handleChange('accentColor', e.target.value)}
                    className="h-10 w-10 p-0 border-none rounded-md cursor-pointer dark:bg-gray-700"
                    title="Select Accent Color"
                  />
                </div>
              </div>
              
              <div>
                <label htmlFor="fontFamily" className="block text-sm font-medium mb-1">Font Family</label>
                <input
                  id="fontFamily"
                  type="text"
                  value={formData.fontFamily}
                  onChange={(e) => handleChange('fontFamily', e.target.value)}
                  className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
                  placeholder="e.g., Arial, sans-serif"
                />
              </div>
              
              <div className="md:col-span-2">
                <label htmlFor="backgroundImageUrl" className="block text-sm font-medium mb-1">Background Image URL</label>
                <input
                  id="backgroundImageUrl"
                  type="text"
                  value={formData.backgroundImageUrl}
                  onChange={(e) => handleChange('backgroundImageUrl', e.target.value)}
                  className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
                  placeholder="https://example.com/image.jpg"
                />
              </div>
              
              <div>
                <label htmlFor="displayMode" className="block text-sm font-medium mb-1">Display Mode</label>
                <select
                  id="displayMode"
                  value={formData.displayMode}
                  onChange={(e) => handleChange('displayMode', e.target.value)}
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
                  value={formData.layoutType}
                  onChange={(e) => handleChange('layoutType', e.target.value)}
                  className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
                >
                  <option value="contained">Contained</option>
                  <option value="full-width">Full Width</option>
                </select>
              </div>
            </div>
          </div>
        </form>
      </CardContent>
      
      {/* Only show footer with actions if onSubmit is provided */}
      <CardFooter className="flex justify-end space-x-2">
        {onCancel && (
          <Button
            variant="outline"
            type="button"
            onClick={onCancel}
          >
            Cancel
          </Button>
        )}
        <Button
          variant="primary"
          type="submit"
          form="gallery-details-form"
          disabled={isSubmitting || !isDirty || Object.keys(errors).length > 0}
          isLoading={isSubmitting}
        >
          Save Changes
        </Button>
      </CardFooter>
    </Card>
  );
}
