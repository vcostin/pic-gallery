/**
 * @fileoverview ProfileForm Component
 * 
 * A form for editing user profiles with Zod schema validation.
 * This is the modern implementation with strong type safety and validation.
 */

'use client';

import { useState, useRef, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { ErrorMessage, SuccessMessage } from '@/components/StatusMessages';
import { UserService, type User } from '@/lib/services/userService';
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import logger from '@/lib/logger';

// Define augmented User type with profile fields
interface ExtendedUser extends User {
  bio?: string;
  website?: string;
  location?: string;
}

// Define profile update schema
const profileSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Valid email is required'),
  image: z.union([
    z.string().url('Must be a valid URL'),
    z.string().max(0) // Empty string is valid
  ]).nullable().optional(),
  bio: z.string().optional(),
  website: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  location: z.string().optional()
});

// Define the form data type
export type ProfileFormData = z.infer<typeof profileSchema>;

// API response type
interface ProfileUpdateResponse {
  success: boolean;
  data?: ExtendedUser;
  message?: string;
}

// Props interface for the component
export interface ProfileFormProps {
  initialData?: User;
  onProfileUpdate?: (user: User) => void;
  className?: string;
  readOnly?: boolean;
}

// Type for form errors
type FormErrors = {
  [K in keyof ProfileFormData]?: {
    message?: string;
  };
};

/**
 * ProfileForm component for updating user profiles
 */
export function ProfileForm({ initialData, onProfileUpdate, className = '', readOnly = false }: ProfileFormProps) {
  // State for form handling
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [previewImage, setPreviewImage] = useState<string | null>(initialData?.image || null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const abortControllerRef = useRef<AbortController | null>(null);

  // Cast to extended user for form fields
  const extendedUser = initialData as ExtendedUser;

  // Setup form with zod validation
  const { register, handleSubmit, setValue, reset, formState } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: initialData?.name || '',
      email: initialData?.email || '',
      image: initialData?.image || '',
      bio: extendedUser?.bio || '',
      website: extendedUser?.website || '',
      location: extendedUser?.location || '',
    },
  });

  // Get errors and isDirty from form state
  const errors = formState.errors as FormErrors;
  const isDirty = Boolean(formState.isDirty);

  // Reset form when user data changes
  useEffect(() => {
    if (initialData) {
      setValue('name', initialData.name || '');
      setValue('email', initialData.email || '');
      setValue('image', initialData.image || '');
      setValue('bio', extendedUser?.bio || '');
      setValue('website', extendedUser?.website || '');
      setValue('location', extendedUser?.location || '');
      setPreviewImage(initialData.image || null);
    }
  }, [initialData, setValue, extendedUser]);

  // Cleanup abort controller on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // Handle image file selection
  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      
      // Handle file size validation
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        setError('Image must be less than 5MB');
        return;
      }
      
      try {
        // Create object URL for preview
        const url = URL.createObjectURL(file);
        setPreviewImage(url);
        
        // If uploadThing is available in the environment, use it
        if (typeof window !== 'undefined' && window.uploadThing) {
          const result = await window.uploadThing.startUpload([file]);
          if (result && result[0]?.url) {
            setValue('image', result[0].url, { shouldDirty: true });
          }
        } else {
          // For testing or when uploadThing is not available
          setValue('image', url, { shouldDirty: true });
        }
      } catch (err) {
        logger.error('Image upload error:', err);
        setError('Failed to upload image. Please try again.');
      }
    }
  };

  // Trigger file input dialog
  const handleSelectImage = () => {
    fileInputRef.current?.click();
  };

  // Remove the current image
  const handleRemoveImage = () => {
    setPreviewImage(null);
    setValue('image', '', { shouldDirty: true });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Handle form reset
  const handleReset = () => {
    if (initialData) {
      reset({
        name: initialData.name || '',
        email: initialData.email || '',
        image: initialData.image || '',
        bio: extendedUser?.bio || '',
        website: extendedUser?.website || '',
        location: extendedUser?.location || '',
      });
      setPreviewImage(initialData.image || null);
    }
  };

  // Submit form data
  const onSubmit = async (data: ProfileFormData) => {
    setError('');
    setSuccess('');
    setIsSubmitting(true);
    
    // Abort previous request if it exists
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    
    // Create new abort controller
    const abortController = new AbortController();
    abortControllerRef.current = abortController;
    
    try {
      // In a real app, you would upload the image here if it's a file
      // and then set data.image to the URL from your storage service
      
      let response;
      
      if (initialData?.id) {
        // Update specific user if we have an ID
        response = await fetch(`/api/users/${initialData.id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: data.name,
            email: data.email,
            image: data.image || undefined,
          }),
          signal: abortController.signal
        });
        
        const result = await response.json();
        
        if (result.success) {
          setSuccess('Profile updated successfully!');
          onProfileUpdate?.(result.data as User);
          router.refresh(); // Refresh the page to show the updates
        } else {
          setError(result.error || 'Failed to update profile');
        }
      } else {
        // Use the service method if no specific ID
        const serviceResponse = await UserService.updateProfile({
          name: data.name,
          email: data.email,
          image: data.image || undefined,
        }, abortController.signal) as unknown as ProfileUpdateResponse;
        
        if (serviceResponse.success) {
          setSuccess('Profile updated successfully');
          onProfileUpdate?.(serviceResponse.data as User);
          router.refresh(); // Refresh the page to show the updates
        } else {
          setError(serviceResponse.message || 'Failed to update profile');
        }
      }
    } catch (err) {
      if (!(err instanceof DOMException && err.name === 'AbortError')) {
        logger.error('Profile update error:', err);
        setError('An unexpected error occurred. Please try again.');
      }
    } finally {
      if (abortControllerRef.current === abortController) {
        abortControllerRef.current = null;
        setIsSubmitting(false);
      }
    }
  };

  // Render read-only view if readOnly is true
  if (readOnly && initialData) {
    return (
      <Card className={`max-w-2xl mx-auto ${className}`}>
        <CardHeader>
          <h2 className="text-2xl font-bold">Profile</h2>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <div className="flex items-start space-x-4">
            <div className="relative h-24 w-24 overflow-hidden rounded-full border bg-gray-100 dark:bg-gray-800">
              {initialData.image ? (
                <Image
                  src={initialData.image}
                  alt="Profile picture"
                  width={96}
                  height={96}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-gray-400">
                  No Image
                </div>
              )}
            </div>
            <div>
              <h3 className="text-xl font-medium">{initialData.name}</h3>
              <p className="text-gray-500">{initialData.email}</p>
              {extendedUser?.bio && <p className="mt-2">{extendedUser.bio}</p>}
              {extendedUser?.location && <p className="text-sm text-gray-500">{extendedUser.location}</p>}
              {extendedUser?.website && <p className="text-sm text-blue-500"><a href={extendedUser.website}>{extendedUser.website}</a></p>}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`max-w-2xl mx-auto ${className}`}>
      <CardHeader>
        <h2 className="text-2xl font-bold">Profile Settings</h2>
        <p className="text-gray-500">Update your personal information and preferences</p>
      </CardHeader>
      
      <form onSubmit={handleSubmit(onSubmit)} role="form">
        <CardContent className="space-y-6">
          {/* Error and success messages */}
          {error && <ErrorMessage error={error} />}
          {success && <SuccessMessage message={success} />}
          
          {/* Profile Image */}
          <div className="space-y-4">
            <label className="block text-sm font-medium">
              Profile Image
            </label>
            <div className="flex items-start space-x-4">
              <div className="relative h-24 w-24 overflow-hidden rounded-full border bg-gray-100 dark:bg-gray-800">
                {previewImage ? (
                  <Image
                    src={previewImage}
                    alt="Profile picture"
                    width={96}
                    height={96}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-gray-400">
                    No Image
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImageChange}
                  accept="image/*"
                  className="hidden"
                  data-testid="image-upload"
                />
                {/* Image URL input is hidden but used by the form */}
                <input
                  type="hidden"
                  {...register('image')}
                />
                <div className="flex space-x-2">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={handleSelectImage}
                    disabled={isSubmitting}
                  >
                    Change
                  </Button>
                  {previewImage && (
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={handleRemoveImage}
                      disabled={isSubmitting}
                    >
                      Remove
                    </Button>
                  )}
                </div>
                <p className="text-xs text-gray-500">
                  Recommended: Square JPG or PNG, max 5MB
                </p>
                {errors.image && (
                  <p className="text-xs text-red-500">{errors.image.message}</p>
                )}
              </div>
            </div>
          </div>
          
          {/* Name Field */}
          <div className="space-y-2">
            <label htmlFor="name" className="block text-sm font-medium">
              Name <span className="text-red-500">*</span>
            </label>
            <input
              id="name"
              type="text"
              placeholder="Your full name"
              {...register('name')}
              data-testid="name-input"
              className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700"
              disabled={isSubmitting}
            />
            {errors.name && (
              <p className="text-xs text-red-500">{errors.name.message}</p>
            )}
          </div>
          
          {/* Email Field */}
          <div className="space-y-2">
            <label htmlFor="email" className="block text-sm font-medium">
              Email <span className="text-red-500">*</span>
            </label>
            <input
              id="email"
              type="email"
              placeholder="your.email@example.com"
              {...register('email')}
              data-testid="email-input"
              className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700"
              disabled={isSubmitting}
            />
            {errors.email && (
              <p className="text-xs text-red-500">{errors.email.message}</p>
            )}
          </div>
          
          {/* Bio Field */}
          <div className="space-y-2">
            <label htmlFor="bio" className="block text-sm font-medium">
              Bio
            </label>
            <textarea
              id="bio"
              placeholder="Tell us about yourself"
              {...register('bio')}
              rows={4}
              className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700"
              disabled={isSubmitting}
            />
            {errors.bio && (
              <p className="text-xs text-red-500">{errors.bio.message}</p>
            )}
          </div>
          
          {/* Website Field */}
          <div className="space-y-2">
            <label htmlFor="website" className="block text-sm font-medium">
              Website
            </label>
            <input
              id="website"
              type="url"
              placeholder="https://yourwebsite.com"
              {...register('website')}
              className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700"
              disabled={isSubmitting}
            />
            {errors.website && (
              <p className="text-xs text-red-500">{errors.website.message}</p>
            )}
          </div>
          
          {/* Location Field */}
          <div className="space-y-2">
            <label htmlFor="location" className="block text-sm font-medium">
              Location
            </label>
            <input
              id="location"
              type="text"
              placeholder="City, Country"
              {...register('location')}
              className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700"
              disabled={isSubmitting}
            />
            {errors.location && (
              <p className="text-xs text-red-500">{errors.location.message}</p>
            )}
          </div>
        </CardContent>
        
        <CardFooter className="flex justify-between space-x-2">
          <Button
            type="button"
            variant="outline"
            onClick={handleReset}
            disabled={isSubmitting}
            data-testid="reset-button"
          >
            Reset
          </Button>
          <Button
            type="submit"
            data-testid="submit-button"
            disabled={isSubmitting || !isDirty}
          >
            {isSubmitting ? 'Saving...' : 'Save Changes'}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
