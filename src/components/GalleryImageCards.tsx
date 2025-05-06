'use client';

import React from 'react';
import Image from 'next/image';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// Define types
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

// Base sortable card
function BaseSortableCard(props: { 
  galleryImage: GalleryImage; 
  isCover: boolean;
  className?: string;
  children: (data: {
    attributes: ReturnType<typeof useSortable>['attributes'];
    listeners: ReturnType<typeof useSortable>['listeners'];
    isDragging: boolean;
    isOver: boolean;
  }) => React.ReactNode;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
    isOver,
  } = useSortable({
    id: props.galleryImage.id,
  });
  
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 1000 : 1,
  };

  const cardClasses = `
    bg-white dark:bg-gray-800 rounded-lg shadow 
    ${props.isCover ? 'ring-2 ring-blue-500' : ''} 
    ${isOver ? 'ring-2 ring-green-400 dark:ring-green-600' : ''}
    ${isDragging ? 'opacity-50' : ''}
    ${props.className || ''}
  `;
  
  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cardClasses.trim()}
    >
      {props.children({
        attributes,
        listeners,
        isDragging,
        isOver
      })}
    </div>
  );
}

// Reusable component for image tags
function GalleryImageTags({ tags, max = 3 }: { tags: Tag[]; max?: number }) {
  if (!tags.length) return null;
  return (
    <div className="flex flex-wrap gap-1 mb-2 max-h-8 overflow-y-auto">
      {tags.slice(0, max).map((tag) => (
        <span
          key={tag.id}
          className="text-xs px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 rounded-sm border border-gray-200 dark:border-gray-600"
        >
          {tag.name}
        </span>
      ))}
      {tags.length > max && (
        <span className="text-xs px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 rounded-sm border border-gray-200 dark:border-gray-600">
          +{tags.length - max} more
        </span>
      )}
    </div>
  );
}

// Reusable component for action buttons
function GalleryImageActionButtons({
  isCover,
  onSetCover,
  onRemove,
  coverLabel = 'Set as Cover',
  removeLabel = 'Remove',
  compact = false,
}: {
  isCover: boolean;
  onSetCover: () => void;
  onRemove: () => void;
  coverLabel?: string;
  removeLabel?: string;
  compact?: boolean;
}) {
  return (
    <div className={`flex ${compact ? 'justify-between items-center' : 'space-x-2'}`}>
      <button
        type="button"
        onClick={onSetCover}
        className={
          compact
            ? `py-1.5 px-2 text-xs rounded ${isCover
                ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 border border-blue-300'
                : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-blue-50 dark:hover:bg-blue-900/50'}`
            : `px-3 py-1.5 text-xs font-semibold rounded-full transition-colors ${
                isCover
                  ? 'bg-blue-600 text-white'
                  : 'bg-white/90 text-gray-800 hover:bg-blue-600 hover:text-white'
              }`
        }
      >
        {isCover ? 'Cover ✓' : coverLabel}
      </button>
      <button
        type="button"
        onClick={onRemove}
        className={
          compact
            ? 'py-1.5 px-2 text-xs bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300 rounded border border-red-200 dark:border-red-900 hover:bg-red-200'
            : 'w-8 h-8 bg-white/90 hover:bg-red-600 text-gray-800 hover:text-white rounded-full flex items-center justify-center'
        }
        title={removeLabel}
      >
        {compact ? removeLabel : (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        )}
      </button>
    </div>
  );
}

// Compact view
export function CompactGalleryCard(props: GalleryCardProps) {
  const renderContent = (data: {
    attributes: ReturnType<typeof useSortable>['attributes'];
    listeners: ReturnType<typeof useSortable>['listeners'];
    isDragging: boolean;
    isOver: boolean;
  }) => {
    const { galleryImage, isCover, onDescriptionChange, setCoverImage, onRemoveImage } = props;
    const { attributes, listeners } = data;
    
    return (
      <div className="flex flex-row p-3 border border-gray-200 dark:border-gray-700">
        {/* Left section with image and index */}
        <div className="relative flex-shrink-0 w-1/3 mr-4">
          {/* Image */}
          <div className="relative aspect-square overflow-hidden rounded-lg">
            <Image
              src={galleryImage.image.url}
              alt={galleryImage.image.title}
              fill
              className="object-cover"
            />
            
            {/* Order badge */}
            <div className="absolute top-0 right-0 bg-black/70 text-white px-2 py-1 text-xs font-mono rounded-bl-lg">
              #{galleryImage.order}
            </div>
            
            {/* Cover indicator */}
            {isCover && (
              <div className="absolute bottom-0 left-0 right-0 bg-blue-600 py-1 text-xs text-white text-center font-medium">
                COVER IMAGE
              </div>
            )}
          </div>
          
          {/* Drag handle */}
          <div 
            className="absolute -top-2 -left-2 w-8 h-8 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center cursor-move shadow-md border border-gray-300 dark:border-gray-600"
            {...attributes} 
            {...listeners}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-gray-500 dark:text-gray-400">
              <circle cx="8" cy="6" r="1"/><circle cx="8" cy="12" r="1"/><circle cx="8" cy="18" r="1"/>
              <circle cx="16" cy="6" r="1"/><circle cx="16" cy="12" r="1"/><circle cx="16" cy="18" r="1"/>
            </svg>
          </div>
        </div>
        
        {/* Right section with details */}
        <div className="flex-grow flex flex-col">
          {/* Title */}
          <h3 className="font-medium text-sm mb-2 line-clamp-1" title={galleryImage.image.title}>
            {galleryImage.image.title}
          </h3>
          
          {/* Description */}
          <div className="mb-2 flex-grow">
            <textarea
              value={galleryImage.description || ''}
              onChange={(e) => onDescriptionChange(galleryImage.id, e.target.value)}
              className="w-full px-2 py-1 border text-xs rounded-md dark:bg-gray-700 dark:border-gray-600"
              placeholder="Add image description..."
              rows={3}
            />
          </div>
          
          {/* Tags */}
          <GalleryImageTags tags={galleryImage.image.tags} max={3} />
          
          {/* Action buttons */}
          <GalleryImageActionButtons
            isCover={isCover}
            onSetCover={() => setCoverImage(galleryImage.image.id)}
            onRemove={() => onRemoveImage(galleryImage.id)}
            compact
          />
        </div>
      </div>
    );
  };

  return (
    <BaseSortableCard
      galleryImage={props.galleryImage}
      isCover={props.isCover}
      className="transition-all duration-200 hover:shadow-md"
    >
      {renderContent}
    </BaseSortableCard>
  );
}

// Grid view
export function GridGalleryCard(props: GalleryCardProps) {
  const renderContent = (data: {
    attributes: ReturnType<typeof useSortable>['attributes'];
    listeners: ReturnType<typeof useSortable>['listeners'];
    isDragging: boolean;
    isOver: boolean;
  }) => {
    const { galleryImage, isCover, onDescriptionChange, setCoverImage, onRemoveImage } = props;
    const { attributes, listeners } = data;
    
    return (
      <div className="flex flex-col">
        {/* Image container with large aspect ratio */}
        <div className="relative aspect-[4/3] overflow-hidden group">
          {/* Main image */}
          <Image
            src={galleryImage.image.url}
            alt={galleryImage.image.title}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
          
          {/* Gradient overlay on hover */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          
          {/* Order indicator */}
          <div className="absolute top-3 right-3 flex items-center justify-center w-8 h-8 bg-black/70 rounded-full text-white text-xs font-bold">
            {galleryImage.order}
          </div>
          
          {/* Cover image badge */}
          {isCover && (
            <div className="absolute top-3 left-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg">
              COVER
            </div>
          )}
          
          {/* Bottom controls that appear on hover */}
          <div className="absolute bottom-0 left-0 right-0 p-3 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out flex justify-between items-center">
            <GalleryImageActionButtons
              isCover={isCover}
              onSetCover={() => setCoverImage(galleryImage.image.id)}
              onRemove={() => onRemoveImage(galleryImage.id)}
              coverLabel="Set Cover"
              removeLabel=""
              compact={false}
            />
            {/* Drag handle */}
            <button
              type="button"
              {...attributes}
              {...listeners}
              className="w-8 h-8 bg-white/90 hover:bg-yellow-500 text-gray-800 hover:text-white rounded-full flex items-center justify-center"
              title="Drag to reorder"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14m-7-7h14" />
              </svg>
            </button>
          </div>
        </div>
        
        {/* Image details */}
        <div className="pt-3 pb-2 px-2">
          {/* Title */}
          <h3 className="font-semibold text-sm mb-1.5 truncate" title={galleryImage.image.title}>
            {galleryImage.image.title}
          </h3>
          
          {/* Tags */}
          <GalleryImageTags tags={galleryImage.image.tags} max={3} />
          
          {/* Simple description input */}
          <input
            type="text"
            value={galleryImage.description || ''}
            onChange={(e) => onDescriptionChange(galleryImage.id, e.target.value)}
            className="w-full px-2 py-1.5 text-xs rounded border border-gray-200 dark:border-gray-600 dark:bg-gray-700"
            placeholder="Add quick description..."
          />
        </div>
      </div>
    );
  };

  return (
    <BaseSortableCard
      galleryImage={props.galleryImage}
      isCover={props.isCover}
      className="transition-all duration-300 hover:shadow-lg relative overflow-hidden"
    >
      {renderContent}
    </BaseSortableCard>
  );
}

// Drag overlay component
export function DragOverlayCard({ image }: { image: GalleryImage }) {
  return (
    <div className="bg-white dark:bg-gray-800 shadow-lg rounded-lg p-3 border border-blue-500">
      <div className="mb-2 flex justify-between items-center">
        <div className="flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-500">
            <circle cx="8" cy="6" r="1"/><circle cx="8" cy="12" r="1"/><circle cx="8" cy="18" r="1"/>
            <circle cx="16" cy="6" r="1"/><circle cx="16" cy="12" r="1"/><circle cx="16" cy="18" r="1"/>
          </svg>
          <span className="ml-2 font-medium text-sm text-blue-600 dark:text-blue-400 truncate max-w-[180px]">
            {image.image.title}
          </span>
        </div>
        <div className="bg-blue-500 text-white text-xs px-2 py-1 rounded">
          #{image.order}
        </div>
      </div>

      <div className="flex gap-2">
        <div className="w-16 h-16 relative flex-shrink-0 rounded-md overflow-hidden">
          <Image
            src={image.image.url}
            alt={image.image.title}
            fill
            className="object-cover"
          />
        </div>
        
        <div className="flex-grow">
          <div className="text-xs text-blue-600 dark:text-blue-400 font-medium">Dragging...</div>
          
          {image.description && (
            <div className="text-xs text-gray-500 mt-1 truncate">
              {image.description}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
