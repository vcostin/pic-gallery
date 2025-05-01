'use client';

import React from 'react';

interface GalleryDetailsFormProps {
  title: string;
  setTitle: (title: string) => void;
  description: string;
  setDescription: (description: string) => void;
  isPublic: boolean;
  setIsPublic: (isPublic: boolean) => void;
}

export function GalleryDetailsForm({
  title,
  setTitle,
  description,
  setDescription,
  isPublic,
  setIsPublic
}: GalleryDetailsFormProps) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold mb-4">Gallery Details</h2>
      
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
      </div>
    </div>
  );
}
