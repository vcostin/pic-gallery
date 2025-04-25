'use client';

import Image from 'next/image';
import { useMemo, useState } from 'react';

interface Tag {
  id: string;
  name: string;
}

interface ImageType {
  id: string;
  title: string;
  description: string | null;
  url: string;
  tags: Tag[];
}

interface ImageGridProps {
  images: ImageType[];
}

export function ImageGrid({ images }: ImageGridProps) {
  const [selectedTag, setSelectedTag] = useState<string>('');

  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    images.forEach(image => {
      image.tags.forEach(tag => tagSet.add(tag.name));
    });
    return Array.from(tagSet);
  }, [images]);

  const filteredImages = useMemo(() => {
    if (!selectedTag) return images;
    return images.filter(image => 
      image.tags.some(tag => tag.name === selectedTag)
    );
  }, [images, selectedTag]);

  return (
    <div>
      <div className="mb-6 flex flex-wrap gap-2">
        <button
          onClick={() => setSelectedTag('')}
          className={`px-3 py-1 rounded-full text-sm ${
            !selectedTag 
              ? 'bg-blue-500 text-white' 
              : 'bg-gray-200 dark:bg-gray-700'
          }`}
        >
          All
        </button>
        {allTags.map(tag => (
          <button
            key={tag}
            onClick={() => setSelectedTag(tag)}
            className={`px-3 py-1 rounded-full text-sm ${
              selectedTag === tag 
                ? 'bg-blue-500 text-white' 
                : 'bg-gray-200 dark:bg-gray-700'
            }`}
          >
            {tag}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {filteredImages.map(image => (
          <div key={image.id} className="group relative bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
            <div className="aspect-square relative">
              <Image
                src={image.url}
                alt={image.title}
                fill
                className="object-cover"
              />
            </div>
            <div className="p-4">
              <h3 className="font-semibold mb-2">{image.title}</h3>
              {image.description && (
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                  {image.description}
                </p>
              )}
              <div className="flex flex-wrap gap-1">
                {image.tags.map(tag => (
                  <span
                    key={tag.id}
                    className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded"
                  >
                    {tag.name}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
