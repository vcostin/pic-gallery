'use client';

import { useState, useRef, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import { ErrorMessage, SuccessMessage } from './StatusMessages';
import { UserService, type User } from '@/lib/services/userService';
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import logger from '@/lib/logger';

// Define profile update schema
const profileSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  image: z.string().url('Must be a valid URL').optional().nullable(),
});

type ProfileFormData = z.infer<typeof profileSchema>;

interface ProfileFormZodProps {
  user: User;
}

export function ProfileFormWithZod({ user }: ProfileFormZodProps) {
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const router = useRouter();
  const abortControllerRef = useRef<AbortController | null>(null);
  
  // Setup form with react-hook-form and zod resolver
  const { 
    register, 
    handleSubmit, 
    formState: { errors, isDirty, isSubmitting },
    reset
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user.name || '',
      image: user.image || null,
    }
  });

  // Reset form when user prop changes
  useEffect(() => {
    reset({
      name: user.name || '',
      image: user.image || null,
    });
  }, [user, reset]);
  
  // Clean up any pending requests when the component unmounts
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
    };
  }, []);
  
  // Handle form submission
  const onSubmit = async (data: ProfileFormData) => {
    // Cancel any previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    // Set error state to null
    setError(null);
    
    // Create new AbortController for this request
    const abortController = new AbortController();
    abortControllerRef.current = abortController;
    
    try {
      // Use UserService to update the profile
      const updatedUser = await UserService.updateProfile(
        {
          name: data.name,
          image: data.image || undefined,
        },
        abortController.signal
      );
      
      // Update the form with the returned data
      reset({
        name: updatedUser.name || '',
        image: updatedUser.image || null,
      }, { keepDirty: false });
      
      // This will force Next.js to refresh the page data
      router.refresh();
      
      // Show success message
      setSuccessMessage('Profile updated successfully!');
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
    } catch (err) {
      if (!(err instanceof DOMException && err.name === 'AbortError')) {
        const errorObj = err instanceof Error ? err : new Error(String(err));
        setError(errorObj);
        logger.error('Error updating profile:', err);
      }
    } finally {
      // Only update state if this is still the current request
      if (abortControllerRef.current === abortController) {
        abortControllerRef.current = null;
      }
    }
  };
  
  return (
    <Card>
      <CardHeader>
        <h2 className="text-xl font-semibold">Update Your Profile</h2>
      </CardHeader>
      
      <CardContent>
        {/* Success and error messages */}
        {successMessage && (
          <SuccessMessage 
            message={successMessage} 
            className="mb-4"
          />
        )}
        
        {error && (
          <ErrorMessage 
            error={error} 
            retry={() => setError(null)}
            className="mb-4"
          />
        )}
        
        <form id="profile-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="name">
              Name
            </label>
            <input
              {...register('name')}
              id="name"
              data-testid="name-input"
              type="text"
              className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
              placeholder="Your name"
              aria-invalid={errors.name ? 'true' : 'false'}
            />
            {errors.name && (
              <p className="text-red-500 text-sm mt-1" data-testid="name-error">
                {errors.name.message}
              </p>
            )}
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="image">
              Profile Image URL
            </label>
            <input
              {...register('image')}
              id="image"
              data-testid="image-input"
              type="url"
              className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
              placeholder="https://example.com/your-image.jpg"
              aria-invalid={errors.image ? 'true' : 'false'}
            />
            {errors.image && (
              <p className="text-red-500 text-sm mt-1" data-testid="image-error">
                {errors.image.message}
              </p>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              Enter a URL to an image. Leave empty to use your default profile image.
            </p>
          </div>
        </form>
      </CardContent>
      
      <CardFooter className="flex justify-end">
        <Button
          variant="primary"
          type="submit"
          form="profile-form"
          disabled={!isDirty || isSubmitting}
          isLoading={isSubmitting}
        >
          Save Changes
        </Button>
      </CardFooter>
    </Card>
  );
}
