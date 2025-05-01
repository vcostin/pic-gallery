'use client';

import React from 'react';
import Image from 'next/image';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { SyntheticListenerMap } from '@dnd-kit/core/dist/hooks/utilities';

interface Tag {
  id: string;
  name: string;
}

export interface GalleryImage {
  id: string;
  description: string | null;
  order: number;
  image: {
    id: string;
    url: string;
    title: string;
    tags: Tag[];
  };
  imageId?: string;
}

export interface GalleryCardProps {
  galleryImage: GalleryImage;
  isCover: boolean;
  onDescriptionChange: (id: string, description: string) => void;
  setCoverImage: (id: string) => void;
  onRemoveImage: (id: string) => void;
}

// Define the type for the render props function
type RenderProps = {
  attributes: {
    role: string;
    tabIndex: number;
    'aria-pressed'?: boolean;
    'aria-roledescription'?: string;
    'aria-describedby'?: string;
  };
  listeners: SyntheticListenerMap | undefined;
};

// Base component for sortable gallery images
function BaseSortableCard({ 
  galleryImage, 
  isCover,
  children,
  className = ''
}: { 
  galleryImage: GalleryImage;
  isCover: boolean;
  children: (props: RenderProps) => React.ReactNode;
  className?: string;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({id: galleryImage.id});
  
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };
  
  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`bg-white dark:bg-gray-800 rounded-lg shadow ${isCover ? 'ring-2 ring-blue-500' : ''} ${className}`}
    >
      {children({attributes, listeners})}
    </div>
  );
}

// Compact view gallery image component
export function CompactGalleryCard(props: GalleryCardProps) {
  const { galleryImage, isCover, onDescriptionChange, setCoverImage, onRemoveImage } = props;
  
  return (
    <BaseSortableCard galleryImage={galleryImage} isCover={isCover} className="p-3">
      {({attributes, listeners}) => (
        <>
          <div className="flex justify-between items-center mb-2">
            <div className="cursor-move flex items-center" {...attributes} {...listeners}>
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="8" cy="6" r="1"/><circle cx="8" cy="12" r="1"/><circle cx="8" cy="18" r="1"/>
                <circle cx="16" cy="6" r="1"/><circle cx="16" cy="12" r="1"/><circle cx="16" cy="18" r="1"/>
              </svg>
              <span className="ml-2 text-xs text-gray-500">#{galleryImage.order}</span>
            </div>
            <div className="flex space-x-1">
              <button
                type="button" 
                onClick={() => setCoverImage(galleryImage.image.id)}
                className={`text-xs px-2 py-1 rounded-md ${isCover 
                  ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300' 
                  : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-900/50'}`}
              >
                {isCover ? 'Cover ✓' : 'Set Cover'}
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  onRemoveImage(galleryImage.id);
                }}
                className="text-xs px-2 py-1 bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300 rounded-md hover:bg-red-200 dark:hover:bg-red-800/50"
              >
                Remove
              </button>
            </div>
          </div>

          <div className="flex space-x-3">
            <div className="w-16 h-16 relative flex-shrink-0">
              <Image
                src={galleryImage.image.url}
                alt={galleryImage.image.title}
                fill
                className="object-cover rounded-md"
              />
            </div>
            
            <div className="flex-grow min-w-0">
              <h3 className="font-medium text-sm mb-1 truncate" title={galleryImage.image.title}>
                {galleryImage.image.title}
              </h3>
              
              <div className="flex flex-wrap gap-1 mb-2">
                {galleryImage.image.tags.slice(0, 2).map((tag) => (
                  <span
                    key={tag.id}
                    className="text-xs px-1 py-0.5 bg-gray-100 dark:bg-gray-700 rounded"
                  >
                    {tag.name}
                  </span>
                ))}
                {galleryImage.image.tags.length > 2 && (
                  <span className="text-xs px-1 py-0.5 bg-gray-100 dark:bg-gray-700 rounded">
                    +{galleryImage.image.tags.length - 2}
                  </span>
                )}
              </div>
              
              <textarea
                value={galleryImage.description || ''}
                onChange={(e) => onDescriptionChange(galleryImage.id, e.target.value)}
                className="w-full px-2 py-1 border text-xs rounded-md dark:bg-gray-700 dark:border-gray-600"
                placeholder="Add description"
                rows={2}
              />
            </div>
          </div>
        </>
      )}
    </BaseSortableCard>
  );
}

// Standard view gallery image component
export function StandardGalleryCard(props: GalleryCardProps) {
  const { galleryImage, isCover, onDescriptionChange, setCoverImage, onRemoveImage } = props;
  
  return (
    <BaseSortableCard galleryImage={galleryImage} isCover={isCover}>
      {({attributes, listeners}) => (
        <>
          <div className="cursor-move flex items-center justify-between p-3 border-b dark:border-gray-700" {...attributes} {...listeners}>
            <div className="flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="8" cy="6" r="1"/><circle cx="8" cy="12" r="1"/><circle cx="8" cy="18" r="1"/>
                <circle cx="16" cy="6" r="1"/><circle cx="16" cy="12" r="1"/><circle cx="16" cy="18" r="1"/>
              </svg>
              <span className="ml-2 font-medium">{galleryImage.image.title}</span>
            </div>
            <div className="text-sm text-gray-500">#{galleryImage.order}</div>
          </div>

          <div className="aspect-square relative">
            <Image
              src={galleryImage.image.url}
              alt={galleryImage.image.title}
              fill
              className="object-cover"
            />
          </div>
          
          <div className="p-4">
            <div className="mb-3">
              <label className="block text-sm font-medium mb-1">Description</label>
              <textarea
                value={galleryImage.description || ''}
                onChange={(e) => onDescriptionChange(galleryImage.id, e.target.value)}
                className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
                placeholder="Add a description for this image"
                rows={2}
              />
            </div>
            
            <div className="flex flex-wrap gap-1 mb-4">
              {galleryImage.image.tags.map((tag) => (
                <span
                  key={tag.id}
                  className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded"
                >
                  {tag.name}
                </span>
              ))}
            </div>
            
            <div className="flex space-x-2">
              <button
                type="button" 
                onClick={() => setCoverImage(galleryImage.image.id)}
                className={`flex-1 py-2 text-sm rounded-md ${isCover 
                  ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300' 
                  : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 hover:bg-blue-50'}`}
              >
                {isCover ? 'Cover Image ✓' : 'Set as Cover'}
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  onRemoveImage(galleryImage.id);
                }}
                className="px-3 py-2 bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300 rounded-md hover:bg-red-200"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          </div>
        </>
      )}
    </BaseSortableCard>
  );
}

// Grid view gallery image component
export function GridGalleryCard(props: GalleryCardProps) {
  const { galleryImage, isCover, onDescriptionChange, setCoverImage, onRemoveImage } = props;
  
  return (
    <BaseSortableCard galleryImage={galleryImage} isCover={isCover}>
      {({attributes, listeners}) => (
        <>
          <div className="relative aspect-square group">
            <Image
              src={galleryImage.image.url}
              alt={galleryImage.image.title}
              fill
              className="object-cover rounded-t-lg"
            />
            
            <div className="absolute top-2 right-2 flex space-x-1">
              {isCover && (
                <div className="bg-blue-500 text-white text-xs px-2 py-1 rounded">
                  Cover
                </div>
              )}
              <div className="bg-black/50 text-white text-xs px-2 py-1 rounded">
                #{galleryImage.order}
              </div>
            </div>
            
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/60 transition-all duration-200 flex items-center justify-center opacity-0 group-hover:opacity-100">
              <div className="p-2 flex space-x-2">
                <button 
                  type="button"
                  onClick={() => setCoverImage(galleryImage.image.id)}
                  className={`p-2 rounded-full ${isCover ? 'bg-blue-500 text-white' : 'bg-white/80 hover:bg-blue-500 hover:text-white'}`}
                  title={isCover ? 'Cover Image' : 'Set as Cover'}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </button>
                <button 
                  type="button"
                  {...attributes} {...listeners}
                  className="p-2 rounded-full bg-white/80 hover:bg-yellow-500 hover:text-white"
                  title="Drag to reorder"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                  </svg>
                </button>
                <button 
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    onRemoveImage(galleryImage.id);
                  }}
                  className="p-2 rounded-full bg-white/80 hover:bg-red-500 hover:text-white"
                  title="Remove from gallery"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
          
          <div className="p-3">
            <h3 className="font-medium text-sm truncate mb-1" title={galleryImage.image.title}>
              {galleryImage.image.title}
            </h3>
            <textarea
              value={galleryImage.description || ''}
              onChange={(e) => onDescriptionChange(galleryImage.id, e.target.value)}
              className="w-full px-2 py-1 border text-xs rounded-md dark:bg-gray-700 dark:border-gray-600"
              placeholder="Add description"
              rows={2}
            />
          </div>
        </>
      )}
    </BaseSortableCard>
  );
}

// Drag overlay card component
export function DragOverlayCard({ image }: { image: GalleryImage }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-3 w-72">
      <div className="flex space-x-3">
        <div className="w-16 h-16 relative flex-shrink-0">
          <Image
            src={image.image.url}
            alt={image.image.title}
            fill
            className="object-cover rounded-md"
          />
        </div>
        
        <div className="flex-grow">
          <h3 className="font-medium text-sm mb-1 truncate">{image.image.title}</h3>
          <div className="text-xs text-gray-500">#{image.order}</div>
        </div>
      </div>
    </div>
  );
}
