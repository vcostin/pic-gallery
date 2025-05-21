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
import { ErrorMessage, SuccessMessage } from '../StatusMessages';
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

// Define the form data type
export type ProfileFormData = z.infer<typeof profileSchema>;

// Define extended user type with profile fields
interface ExtendedUser extends User {
  bio?: string;
  website?: string;
  location?: string;
}

// API response type
interface ProfileUpdateResponse {
  success: boolean;
  data?: ExtendedUser;
  message?: string;
}

// API response type
interface ProfileUpdateResponse {
  success: boolean;
  data?: ExtendedUser;
  message?: string;
}

// Props interface for the component
export interface ProfileFormProps {
  user?: User;
  onProfileUpdate?: (user: User) => void;
  className?: string;
}

/**
 * ProfileForm component for updating user profiles
 */
export function ProfileForm({ user, onProfileUpdate, className = '' }: ProfileFormProps) {
  // State for form handling
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [previewImage, setPreviewImage] = useState<string | null>(user?.image || null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // Cast to extended user for form fields
  const extendedUser = user as ExtendedUser;

  // Setup form with zod validation
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isDirty }
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user?.name || '',
      email: user?.email || '',
      image: user?.image || '',
      bio: extendedUser?.bio || '',
      website: extendedUser?.website || '',
      location: extendedUser?.location || '',
    },
  });

  // Reset form when user data changes
  useEffect(() => {
    if (user) {
      setValue('name', user.name || '');
      setValue('email', user.email || '');
      setValue('image', user.image || '');
      setValue('bio', extendedUser?.bio || '');
      setValue('website', extendedUser?.website || '');
      setValue('location', extendedUser?.location || '');
      setPreviewImage(user.image || null);
    }
  }, [user, setValue, extendedUser]);

  // Handle image file selection
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      
      // Handle file size validation
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        setError('Image must be less than 5MB');
        return;
      }
      
      // Create object URL for preview
      const url = URL.createObjectURL(file);
      setPreviewImage(url);
      
      // This would be used in a real implementation to upload the file
      // For now, we'll just set the image URL directly
      setValue('image', url, { shouldDirty: true });
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

  // Submit form data
  const onSubmit = async (data: ProfileFormData) => {
    setError('');
    setSuccess('');
    setIsSubmitting(true);
    
    try {
      // In a real app, you would upload the image here if it's a file
      // and then set data.image to the URL from your storage service
      
      const response = await UserService.updateProfile({
        ...data,
        // Add any extra fields needed by your API
      }) as unknown as ProfileUpdateResponse;
      
      if (response.success) {
        setSuccess('Profile updated successfully');
        onProfileUpdate?.(response.data as User);
        router.refresh(); // Refresh the page to show the updates
      } else {
        setError(response.message || 'Failed to update profile');
      }
    } catch (err) {
      logger.error('Profile update error:', err);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className={`max-w-2xl mx-auto ${className}`}>
      <CardHeader>
        <h2 className="text-2xl font-bold">Profile Settings</h2>
        <p className="text-gray-500">Update your personal information and preferences</p>
      </CardHeader>
      
      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="space-y-6">
          {/* Error and success messages */}
          {error && <ErrorMessage message={error} />}
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
                    alt="Profile"
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
        
        <CardFooter className="flex justify-end space-x-2">
          <Button
            type="submit"
            disabled={isSubmitting || !isDirty}
          >
            {isSubmitting ? 'Saving...' : 'Save Changes'}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
