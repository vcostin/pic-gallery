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
  // Initialize form state with defaults merged with initialData
  const [formData, setFormData] = useState<GalleryDetailsFormData>({
    title: '',
    description: '',
    isPublic: true,
    themeColor: '#6366f1',
    backgroundColor: '#ffffff',
    backgroundImageUrl: '',
    accentColor: '#10b981',
    fontFamily: 'sans-serif',
    displayMode: 'grid',
    layoutType: 'masonry',
    ...initialData
  });
  
  // For tracking validation errors
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // Update form field values
  const updateField = (field: keyof GalleryDetailsFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error for this field if it exists
    if (errors[field]) {
      setErrors(prev => {
        const { [field]: _, ...rest } = prev;
        return rest;
      });
    }
  };
  
  // Validate form before submission
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    // Required field validation
    if (!formData.title) {
      newErrors.title = 'Title is required';
    } else if (formData.title.length < 3) {
      newErrors.title = 'Title must be at least 3 characters';
    } else if (formData.title.length > 100) {
      newErrors.title = 'Title must be less than 100 characters';
    }
    
    // Description validation (optional field)
    if (formData.description && formData.description.length > 500) {
      newErrors.description = 'Description must be less than 500 characters';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      onSubmit(formData);
    }
  };
  
  return (
    <Card>
      <CardHeader>
        <h2 className="text-xl font-semibold">Gallery Details</h2>
      </CardHeader>
      <CardContent>
        <form id="gallery-details-form" onSubmit={handleSubmit}>
          <div className="space-y-6">
            <div>
              <label htmlFor="title" className="block text-sm font-medium mb-1">
                Title <span className="text-red-500">*</span>
              </label>
              <input
                id="title"
                type="text"
                value={formData.title}
                onChange={(e) => updateField('title', e.target.value)}
                className={`w-full p-2 border ${
                  errors.title ? 'border-red-500' : 'border-gray-300'
                } rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500`}
                placeholder="Enter gallery title"
              />
              {errors.title && (
                <p className="mt-1 text-sm text-red-500">{errors.title}</p>
              )}
            </div>
            
            <div>
              <label htmlFor="description" className="block text-sm font-medium mb-1">
                Description
              </label>
              <textarea
                id="description"
                value={formData.description}
                onChange={(e) => updateField('description', e.target.value)}
                className={`w-full p-2 border ${
                  errors.description ? 'border-red-500' : 'border-gray-300'
                } rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500`}
                rows={3}
                placeholder="Enter gallery description"
              />
              {errors.description && (
                <p className="mt-1 text-sm text-red-500">{errors.description}</p>
              )}
              <p className="mt-1 text-xs text-gray-500">
                Optional: Describe what this gallery contains
              </p>
            </div>
            
            <div>
              <div className="flex items-center">
                <input
                  id="isPublic"
                  type="checkbox"
                  checked={formData.isPublic}
                  onChange={(e) => updateField('isPublic', e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="isPublic" className="ml-2 block text-sm">
                  Public Gallery
                </label>
              </div>
              <p className="mt-1 text-xs text-gray-500">
                When enabled, anyone with the link can view this gallery
              </p>
            </div>
            
            <div className="border border-gray-200 rounded-md p-4 bg-gray-50">
              <h3 className="text-sm font-medium mb-4">Gallery Appearance</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="themeColor" className="block text-xs font-medium mb-1">
                    Theme Color
                  </label>
                  <div className="flex items-center">
                    <input
                      id="themeColor"
                      type="color"
                      value={formData.themeColor}
                      onChange={(e) => updateField('themeColor', e.target.value)}
                      className="border border-gray-300 rounded w-10 h-10 mr-2"
                    />
                    <input
                      type="text"
                      value={formData.themeColor}
                      onChange={(e) => updateField('themeColor', e.target.value)}
                      className="flex-1 p-2 border border-gray-300 rounded"
                    />
                  </div>
                </div>
                
                <div>
                  <label htmlFor="backgroundColor" className="block text-xs font-medium mb-1">
                    Background Color
                  </label>
                  <div className="flex items-center">
                    <input
                      id="backgroundColor"
                      type="color"
                      value={formData.backgroundColor}
                      onChange={(e) => updateField('backgroundColor', e.target.value)}
                      className="border border-gray-300 rounded w-10 h-10 mr-2"
                    />
                    <input
                      type="text"
                      value={formData.backgroundColor}
                      onChange={(e) => updateField('backgroundColor', e.target.value)}
                      className="flex-1 p-2 border border-gray-300 rounded"
                    />
                  </div>
                </div>
                
                <div>
                  <label htmlFor="accentColor" className="block text-xs font-medium mb-1">
                    Accent Color
                  </label>
                  <div className="flex items-center">
                    <input
                      id="accentColor"
                      type="color"
                      value={formData.accentColor}
                      onChange={(e) => updateField('accentColor', e.target.value)}
                      className="border border-gray-300 rounded w-10 h-10 mr-2"
                    />
                    <input
                      type="text"
                      value={formData.accentColor}
                      onChange={(e) => updateField('accentColor', e.target.value)}
                      className="flex-1 p-2 border border-gray-300 rounded"
                    />
                  </div>
                </div>
                
                <div>
                  <label htmlFor="fontFamily" className="block text-xs font-medium mb-1">
                    Font Family
                  </label>
                  <select
                    id="fontFamily"
                    value={formData.fontFamily}
                    onChange={(e) => updateField('fontFamily', e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded"
                  >
                    <option value="sans-serif">Sans-serif</option>
                    <option value="serif">Serif</option>
                    <option value="monospace">Monospace</option>
                    <option value="cursive">Cursive</option>
                  </select>
                </div>
                
                <div>
                  <label htmlFor="displayMode" className="block text-xs font-medium mb-1">
                    Display Mode
                  </label>
                  <select
                    id="displayMode"
                    value={formData.displayMode}
                    onChange={(e) => updateField('displayMode', e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded"
                  >
                    <option value="grid">Grid</option>
                    <option value="carousel">Carousel</option>
                    <option value="slideshow">Slideshow</option>
                    <option value="list">List</option>
                  </select>
                </div>
                
                <div>
                  <label htmlFor="layoutType" className="block text-xs font-medium mb-1">
                    Layout Type
                  </label>
                  <select
                    id="layoutType"
                    value={formData.layoutType}
                    onChange={(e) => updateField('layoutType', e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded"
                  >
                    <option value="masonry">Masonry</option>
                    <option value="uniform">Uniform</option>
                    <option value="compact">Compact</option>
                    <option value="featured">Featured</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </form>
      </CardContent>
      
      <CardFooter className="flex justify-between">
        {onCancel && (
          <Button
            variant="outline"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
        )}
        <Button
          type="submit"
          form="gallery-details-form"
          disabled={isSubmitting || Object.keys(errors).length > 0}
          className="ml-auto"
        >
          {isSubmitting ? 'Saving...' : 'Save Gallery'}
        </Button>
      </CardFooter>
    </Card>
  );
}
