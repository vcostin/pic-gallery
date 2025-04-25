'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface EditImageDialogProps {
  image: {
    id: string;
    title: string;
    description?: string | null;
    tags?: { name: string }[];
  };
  isOpen: boolean;
  onClose: () => void;
}

export function EditImageDialog({ image, isOpen, onClose }: EditImageDialogProps) {
  const [title, setTitle] = useState(image.title);
  const [description, setDescription] = useState(image.description || '');
  const [tags, setTags] = useState(image.tags?.map(t => t.name).join(', ') || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const response = await fetch(`/api/images/${image.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title,
          description,
          tags: tags.split(',').map(tag => tag.trim()).filter(Boolean),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update image');
      }

      router.refresh();
      onClose();
    } catch (error) {
      console.error('Error updating image:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-semibold mb-4">Edit Image</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
              placeholder="Enter image title"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
              placeholder="Enter image description"
              rows={3}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Tags</label>
            <input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
              placeholder="Enter tags separated by commas"
            />
          </div>
          <div className="flex justify-end space-x-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-gray-400"
            >
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
