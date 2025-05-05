'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useUploadThing } from '@/lib/uploadthing';
import { useSubmit } from '@/lib/hooks';

interface ProfileFormProps {
  initialData: {
    id: string;
    name: string;
    email: string;
    image: string;
  };
  readOnly?: boolean;
}

export function ProfileForm({ initialData, readOnly = false }: ProfileFormProps) {
  const [name, setName] = useState(initialData.name);
  const [email, setEmail] = useState(initialData.email);
  const [image, setImage] = useState(initialData.image);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const router = useRouter();
  
  // For image upload
  const { startUpload, isUploading } = useUploadThing('imageUploader');
  
  // For profile update
  const {
    handleSubmit,
    isSubmitting,
    error: submitError,
    reset: resetSubmitState
  } = useSubmit(async () => {
    try {
      // First upload the image if there is one
      let imageUrl = image;
      if (imageFile) {
        const uploadResult = await startUpload([imageFile]);
        if (uploadResult && uploadResult[0]) {
          imageUrl = uploadResult[0].url;
        }
      }

      // Then update the user profile
      const response = await fetch(`/api/users/${initialData.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          image: imageUrl,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update profile');
      }

      // Refresh the page to show updated data
      router.refresh();
      
      return "Profile updated successfully!";
    } catch (err) {
      console.error('Error updating profile:', err);
      throw err;
    }
  });

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      // Create a preview URL for the image
      const objectUrl = URL.createObjectURL(file);
      setImage(objectUrl);
    }
  };

  if (readOnly) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row gap-6 items-start">
          <div className="flex-shrink-0">
            <div className="relative w-24 h-24 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700">
              {image ? (
                <Image
                  src={image}
                  alt="Profile picture"
                  fill
                  sizes="96px"
                  className="object-cover"
                />
              ) : (
                <div className="flex items-center justify-center h-full text-4xl text-gray-400">
                  👤
                </div>
              )}
            </div>
          </div>
          <div className="flex-1">
            <div className="mt-4 md:mt-0">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Name</p>
              <p className="text-lg">{name || 'Not specified'}</p>
            </div>
            <div className="mt-4">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Email</p>
              <p className="text-lg">{email || 'Not specified'}</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <form 
      onSubmit={(e) => {
        e.preventDefault();
        handleSubmit(null);
      }}
      className="space-y-6"
    >
      {submitError && (
        <div className="bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200 p-4 rounded-md mb-4">
          {submitError.message}
        </div>
      )}

      <div className="flex flex-col md:flex-row gap-6 items-start">
        <div className="flex-shrink-0">
          <div className="relative w-24 h-24 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700">
            {image ? (
              <Image
                src={image}
                alt="Profile picture"
                fill
                sizes="96px"
                className="object-cover"
              />
            ) : (
              <div className="flex items-center justify-center h-full text-4xl text-gray-400">
                👤
              </div>
            )}
          </div>
        </div>

        <div className="flex-1">
          <label className="block text-sm font-medium mb-1">Profile Picture</label>
          <input
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            className="w-full text-sm text-gray-500 dark:text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 dark:file:bg-blue-900/20 dark:file:text-blue-200 hover:file:bg-blue-100 dark:hover:file:bg-blue-800/30"
          />
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Recommended: Square image, at least 200x200px
          </p>
        </div>
      </div>

      <div>
        <label htmlFor="name" className="block text-sm font-medium mb-1">
          Name
        </label>
        <input
          id="name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full px-4 py-2 rounded-md border border-gray-300 dark:border-gray-600 dark:bg-gray-700"
          required
        />
      </div>

      <div>
        <label htmlFor="email" className="block text-sm font-medium mb-1">
          Email
        </label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full px-4 py-2 rounded-md border border-gray-300 dark:border-gray-600 dark:bg-gray-700"
          required
        />
      </div>

      <div className="flex justify-end space-x-3">
        <button
          type="button"
          onClick={() => {
            setName(initialData.name);
            setEmail(initialData.email);
            setImage(initialData.image);
            setImageFile(null);
            resetSubmitState();
          }}
          className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition"
        >
          Reset
        </button>
        <button
          type="submit"
          disabled={isSubmitting || isUploading}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition disabled:opacity-50"
        >
          {isSubmitting || isUploading ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </form>
  );
}
