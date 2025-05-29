'use client';

import React, { useState } from 'react';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { UseFormRegister, FieldErrors } from 'react-hook-form';

interface ImprovedGalleryDetailsFormProps {
  register: UseFormRegister<any>;
  errors: FieldErrors;
  onChange?: (field: string, value: any) => void;
  submitText?: string;
  showSubmitButton?: boolean;
  showCancelButton?: boolean;
  onCancel?: () => void;
  isSubmitting?: boolean;
  children?: React.ReactNode;
  className?: string;
}

/**
 * Improved Gallery Details Form with Progressive Disclosure and User-Friendly UX
 * 
 * Key improvements:
 * - Step-by-step approach with clear sections
 * - User-friendly terminology instead of technical terms
 * - Progressive disclosure - advanced options are hidden by default
 * - Visual previews and contextual help
 * - Clear indication of when options apply
 */
export function ImprovedGalleryDetailsForm({
  register,
  errors,
  onChange,
  submitText = 'Save',
  showSubmitButton = true,
  showCancelButton = true,
  onCancel,
  isSubmitting = false,
  children,
  className = '',
}: ImprovedGalleryDetailsFormProps) {
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);
  const [selectedDisplayMode, setSelectedDisplayMode] = useState('grid');
  const [selectedLayoutType, setSelectedLayoutType] = useState('masonry');

  const handleDisplayModeChange = (mode: string) => {
    setSelectedDisplayMode(mode);
    onChange?.('displayMode', mode);
  };

  const handleLayoutTypeChange = (layoutType: string) => {
    setSelectedLayoutType(layoutType);
    onChange?.('layoutType', layoutType);
  };

  return (
    <Card className={className}>
      <CardHeader>
        <h2 className="text-xl font-semibold">Gallery Details</h2>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Start with the basics - you can always customize the look later
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Step 1: Essential Information */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold">1</div>
            <h3 className="font-medium">Essential Information</h3>
          </div>
          
          <div>
            <label htmlFor="title" className="block mb-2 text-sm font-medium">
              Gallery Title <span className="text-red-500">*</span>
            </label>
            <input
              id="title"
              type="text"
              {...register('title', {
                onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
                  onChange?.('title', e.target.value);
                }
              })}
              className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.title ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Give your gallery a memorable name..."
              data-testid="gallery-title-input"
            />
            {errors.title && (
              <p className="mt-1 text-sm text-red-500">{errors.title.message?.toString()}</p>
            )}
          </div>

          <div>
            <label htmlFor="description" className="block mb-2 text-sm font-medium">
              Description
            </label>
            <textarea
              id="description"
              {...register('description', {
                onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => {
                  onChange?.('description', e.target.value);
                }
              })}
              className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.description ? 'border-red-500' : 'border-gray-300'
              }`}
              rows={3}
              placeholder="Tell people what this gallery is about..."
              data-testid="gallery-description-input"
            />
            {errors.description && (
              <p className="mt-1 text-sm text-red-500">{errors.description.message?.toString()}</p>
            )}
            <p className="mt-1 text-xs text-gray-500">
              Optional: Help visitors understand what they'll see in this gallery
            </p>
          </div>

          <div>
            <label className="flex items-center gap-3 cursor-pointer p-3 border rounded-lg hover:bg-gray-50 transition-colors">
              <input
                type="checkbox"
                {...register('isPublic', {
                  onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
                    onChange?.('isPublic', e.target.checked);
                  }
                })}
                className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                data-testid="gallery-public"
              />
              <div className="flex-1">
                <span className="font-medium">Make this gallery public</span>
                <p className="text-sm text-gray-500">
                  Anyone with the link can view this gallery
                </p>
              </div>
            </label>
          </div>
        </div>

        {/* Step 2: How should your gallery look? */}
        <div className="border-t pt-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold">2</div>
            <h3 className="font-medium">How should your gallery look?</h3>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block mb-3 text-sm font-medium">
                Choose a style for your gallery
              </label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Grid Option */}
                <label className="cursor-pointer">
                  <input
                    type="radio"
                    {...register('displayMode', {
                      onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
                        handleDisplayModeChange(e.target.value);
                      }
                    })}
                    value="grid"
                    className="sr-only"
                    defaultChecked
                  />
                  <div className={`p-4 border-2 rounded-lg transition-all ${
                    selectedDisplayMode === 'grid' 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}>
                    <div className="flex items-center justify-center h-16 bg-gray-100 rounded mb-3">
                      <div className="grid grid-cols-3 gap-1">
                        {[...Array(9)].map((_, i) => (
                          <div key={i} className="w-2 h-2 bg-gray-400 rounded-sm"></div>
                        ))}
                      </div>
                    </div>
                    <h4 className="font-medium text-center">Photo Grid</h4>
                    <p className="text-xs text-gray-500 text-center mt-1">
                      Perfect for showcasing multiple photos
                    </p>
                  </div>
                </label>

                {/* Carousel Option */}
                <label className="cursor-pointer">
                  <input
                    type="radio"
                    {...register('displayMode', {
                      onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
                        handleDisplayModeChange(e.target.value);
                      }
                    })}
                    value="carousel"
                    className="sr-only"
                  />
                  <div className={`p-4 border-2 rounded-lg transition-all ${
                    selectedDisplayMode === 'carousel' 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}>
                    <div className="flex items-center justify-center h-16 bg-gray-100 rounded mb-3">
                      <div className="relative">
                        <div className="w-8 h-6 bg-gray-400 rounded"></div>
                        <div className="absolute -right-1 top-1 w-6 h-4 bg-gray-300 rounded opacity-50"></div>
                      </div>
                    </div>
                    <h4 className="font-medium text-center">Slideshow</h4>
                    <p className="text-xs text-gray-500 text-center mt-1">
                      One photo at a time with navigation
                    </p>
                  </div>
                </label>

                {/* Slideshow Option */}
                <label className="cursor-pointer">
                  <input
                    type="radio"
                    {...register('displayMode', {
                      onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
                        handleDisplayModeChange(e.target.value);
                      }
                    })}
                    value="slideshow"
                    className="sr-only"
                  />
                  <div className={`p-4 border-2 rounded-lg transition-all ${
                    selectedDisplayMode === 'slideshow' 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}>
                    <div className="flex items-center justify-center h-16 bg-gray-100 rounded mb-3">
                      <div className="w-10 h-8 bg-gray-400 rounded border-2 border-gray-600"></div>
                    </div>
                    <h4 className="font-medium text-center">Presentation</h4>
                    <p className="text-xs text-gray-500 text-center mt-1">
                      Full-screen viewing experience
                    </p>
                  </div>
                </label>
              </div>
            </div>

            {/* Grid Layout Options - Only show when Grid is selected */}
            {selectedDisplayMode === 'grid' && (
              <div className="bg-blue-50 p-4 rounded-lg">
                <label className="block mb-3 text-sm font-medium">
                  Grid arrangement
                </label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <label className="cursor-pointer">
                    <input
                      type="radio"
                      {...register('layoutType', {
                        onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
                          handleLayoutTypeChange(e.target.value);
                        }
                      })}
                      value="masonry"
                      className="sr-only"
                      defaultChecked
                    />
                    <div className={`p-3 border-2 rounded-lg transition-all ${
                      selectedLayoutType === 'masonry' 
                        ? 'border-blue-500 bg-blue-50' 
                        : 'border-gray-200 hover:border-blue-300'
                    }`}>
                      <div className="flex items-center justify-center h-12 bg-white rounded mb-2">
                        <div className="grid grid-cols-3 gap-1">
                          <div className="w-2 h-3 bg-blue-400 rounded-sm"></div>
                          <div className="w-2 h-2 bg-blue-400 rounded-sm"></div>
                          <div className="w-2 h-4 bg-blue-400 rounded-sm"></div>
                          <div className="w-2 h-2 bg-blue-400 rounded-sm"></div>
                          <div className="w-2 h-3 bg-blue-400 rounded-sm"></div>
                          <div className="w-2 h-2 bg-blue-400 rounded-sm"></div>
                        </div>
                      </div>
                      <h5 className="text-sm font-medium text-center">Pinterest Style</h5>
                      <p className="text-xs text-gray-500 text-center">Different heights, flowing layout</p>
                    </div>
                  </label>

                  <label className="cursor-pointer">
                    <input
                      type="radio"
                      {...register('layoutType', {
                        onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
                          handleLayoutTypeChange(e.target.value);
                        }
                      })}
                      value="uniform"
                      className="sr-only"
                    />
                    <div className={`p-3 border-2 rounded-lg transition-all ${
                      selectedLayoutType === 'uniform' 
                        ? 'border-blue-500 bg-blue-50' 
                        : 'border-gray-200 hover:border-blue-300'
                    }`}>
                      <div className="flex items-center justify-center h-12 bg-white rounded mb-2">
                        <div className="grid grid-cols-3 gap-1">
                          {[...Array(6)].map((_, i) => (
                            <div key={i} className="w-2 h-2 bg-blue-400 rounded-sm"></div>
                          ))}
                        </div>
                      </div>
                      <h5 className="text-sm font-medium text-center">Equal Squares</h5>
                      <p className="text-xs text-gray-500 text-center">All photos same size</p>
                    </div>
                  </label>

                  <label className="cursor-pointer">
                    <input
                      type="radio"
                      {...register('layoutType', {
                        onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
                          handleLayoutTypeChange(e.target.value);
                        }
                      })}
                      value="compact"
                      className="sr-only"
                    />
                    <div className={`p-3 border-2 rounded-lg transition-all ${
                      selectedLayoutType === 'compact' 
                        ? 'border-blue-500 bg-blue-50' 
                        : 'border-gray-200 hover:border-blue-300'
                    }`}>
                      <div className="flex items-center justify-center h-12 bg-white rounded mb-2">
                        <div className="grid grid-cols-4 gap-0.5">
                          {[...Array(8)].map((_, i) => (
                            <div key={i} className="w-1.5 h-1.5 bg-blue-400 rounded-sm"></div>
                          ))}
                        </div>
                      </div>
                      <h5 className="text-sm font-medium text-center">Compact</h5>
                      <p className="text-xs text-gray-500 text-center">Fits more photos</p>
                    </div>
                  </label>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Advanced Options - Collapsed by default */}
        <div className="border-t pt-6">
          <button
            type="button"
            onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
            className="flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors"
          >
            <svg 
              className={`w-4 h-4 transition-transform ${showAdvancedOptions ? 'rotate-180' : ''}`} 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
            {showAdvancedOptions ? 'Hide' : 'Show'} styling options
          </button>
          <p className="text-xs text-gray-500 mt-1">
            Customize colors, fonts, and advanced appearance settings
          </p>

          {showAdvancedOptions && (
            <div className="mt-4 bg-gray-50 p-4 rounded-lg space-y-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-6 h-6 bg-gray-400 text-white rounded-full flex items-center justify-center text-sm font-bold">3</div>
                <h3 className="font-medium">Styling Options</h3>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="themeColor" className="block mb-2 text-sm font-medium">
                    Main Color
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      id="themeColor"
                      type="color"
                      {...register('themeColor', {
                        onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
                          onChange?.('themeColor', e.target.value);
                        }
                      })}
                      className="w-12 h-10 border border-gray-300 rounded cursor-pointer"
                      defaultValue="#6366f1"
                    />
                    <div className="text-sm text-gray-600">
                      <p className="font-medium">Accent color for your gallery</p>
                      <p className="text-xs">Used for highlights and buttons</p>
                    </div>
                  </div>
                </div>

                <div>
                  <label htmlFor="fontFamily" className="block mb-2 text-sm font-medium">
                    Text Style
                  </label>
                  <select
                    id="fontFamily"
                    {...register('fontFamily', {
                      onChange: (e: React.ChangeEvent<HTMLSelectElement>) => {
                        onChange?.('fontFamily', e.target.value);
                      }
                    })}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    defaultValue="sans-serif"
                  >
                    <option value="sans-serif">Modern (Sans Serif)</option>
                    <option value="serif">Classic (Serif)</option>
                    <option value="monospace">Technical (Monospace)</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="backgroundColor" className="block mb-2 text-sm font-medium">
                    Background Color
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      id="backgroundColor"
                      type="color"
                      {...register('backgroundColor', {
                        onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
                          onChange?.('backgroundColor', e.target.value);
                        }
                      })}
                      className="w-12 h-10 border border-gray-300 rounded cursor-pointer"
                      defaultValue="#ffffff"
                    />
                    <div className="text-sm text-gray-600">
                      <p className="font-medium">Page background</p>
                      <p className="text-xs">The color behind your photos</p>
                    </div>
                  </div>
                </div>

                <div>
                  <label htmlFor="accentColor" className="block mb-2 text-sm font-medium">
                    Secondary Color
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      id="accentColor"
                      type="color"
                      {...register('accentColor', {
                        onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
                          onChange?.('accentColor', e.target.value);
                        }
                      })}
                      className="w-12 h-10 border border-gray-300 rounded cursor-pointer"
                      defaultValue="#10b981"
                    />
                    <div className="text-sm text-gray-600">
                      <p className="font-medium">Complement color</p>
                      <p className="text-xs">For variety and contrast</p>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <label htmlFor="backgroundImageUrl" className="block mb-2 text-sm font-medium">
                  Background Image URL
                </label>
                <input
                  id="backgroundImageUrl"
                  type="url"
                  {...register('backgroundImageUrl', {
                    onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
                      onChange?.('backgroundImageUrl', e.target.value);
                    }
                  })}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="https://example.com/background-image.jpg"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Optional: Add a background pattern or texture (will be subtle)
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Additional content */}
        {children}

        {/* Action buttons */}
        <div className="flex justify-between pt-6 border-t">
          {showCancelButton && onCancel && (
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isSubmitting}
              data-testid="gallery-details-cancel-button"
            >
              Cancel
            </Button>
          )}
          {showSubmitButton && (
            <Button
              type="submit"
              disabled={isSubmitting}
              className="ml-auto"
              data-testid="gallery-details-submit-button"
            >
              {isSubmitting ? 'Saving...' : submitText}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
