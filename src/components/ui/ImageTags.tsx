import React from 'react';

interface Tag {
  id: string;
  name: string;
}

export function ImageTags({ tags, max = 3 }: { tags: Tag[]; max?: number }) {
  if (!tags?.length) return null;
  return (
    <div className="flex flex-wrap gap-1 mb-2">
      {tags.slice(0, max).map(tag => (
        <span
          key={tag.id}
          className="text-xs px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded font-medium"
        >
          {tag.name}
        </span>
      ))}
      {tags.length > max && (
        <span className="text-xs px-2 py-1 bg-gray-500 dark:bg-gray-600 text-white rounded font-medium">
          +{tags.length - max}
        </span>
      )}
    </div>
  );
}
