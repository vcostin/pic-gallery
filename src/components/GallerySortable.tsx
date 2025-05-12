'use client';

import React, { useState, useCallback } from 'react';
import { 
  DndContext, 
  closestCenter,
  KeyboardSensor, 
  PointerSensor, 
  useSensor, 
  useSensors,
  DragOverlay,
  DragStartEvent,
  DragEndEvent,
  UniqueIdentifier,
  MeasuringStrategy
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
} from '@dnd-kit/sortable';
import { arrayMove } from '@dnd-kit/sortable';

import { CompactGalleryCard, GridGalleryCard, DragOverlayCard } from './GalleryImageCards';
import { FullImageInGallery } from '@/lib/types';
import { EmptyState } from './StatusMessages';

// Define view mode type
export type ViewMode = 'compact' | 'grid';

interface GallerySortableProps {
  galleryImages: FullImageInGallery[];
  coverImageId: string;
  viewMode: ViewMode;
  onImagesReordered: (reorderedImages: FullImageInGallery[]) => void;
  onDescriptionChange: (id: string, description: string) => void;
  onSetCoverImage: (id: string) => void;
  onRemoveImage: (id: string) => void;
}

export function GallerySortable({ 
  galleryImages,
  coverImageId,
  viewMode,
  onImagesReordered,
  onDescriptionChange,
  onSetCoverImage,
  onRemoveImage 
}: GallerySortableProps) {
  const [activeId, setActiveId] = useState<UniqueIdentifier | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  
  // Configure sensors for drag and drop
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Start drag after moving 8px to prevent accidental drags
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );
  
  // Get the active image for the drag overlay
  const activeImage = activeId ? galleryImages.find(img => img.id === activeId) : null;
  
  // Handle drag start
  const handleDragStart = useCallback((event: DragStartEvent) => {
    const { active } = event;
    setActiveId(active.id);
    setIsDragging(true);
    
    // Add haptic feedback if available
    if (navigator.vibrate) {
      navigator.vibrate(50);
    }
  }, []);
  
  // Handle drag end
  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    
    setIsDragging(false);
    setActiveId(null);
    
    if (over && active.id !== over.id) {
      // Find indices
      const oldIndex = galleryImages.findIndex(img => img.id === active.id);
      const newIndex = galleryImages.findIndex(img => img.id === over.id);
      
      // Reorder the items and set explicit orders starting from 0
      // Ensure each order value is a valid non-negative integer
      const reorderedImages = arrayMove(galleryImages, oldIndex, newIndex).map(
        (image, index) => ({
          ...image,
          order: index // Explicit numeric integer order starting from 0
        })
      );
      
      // Notify parent component with the reordered images
      onImagesReordered(reorderedImages);
      
      // Add haptic feedback for successful drop
      if (navigator.vibrate) {
        navigator.vibrate([40, 30, 40]);
      }
    }
  }, [galleryImages, onImagesReordered]);
  
  // Handle drag cancel
  const handleDragCancel = useCallback(() => {
    setActiveId(null);
    setIsDragging(false);
  }, []);
  
  if (galleryImages.length === 0) {
    return (
      <EmptyState
        title="This gallery has no images"
        description="Click the 'Add Images' button to add some."
      />
    );
  }
  
  // Select the appropriate sorting strategy and layout based on view mode
  let sortingStrategy;
  let gridClassName;
  
  switch (viewMode) {
    case 'grid':
      sortingStrategy = rectSortingStrategy;
      gridClassName = 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4';
      break;
    case 'compact':
    default:
      sortingStrategy = rectSortingStrategy;
      gridClassName = 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3';
  }
  
  return (
    <DndContext 
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
      measuring={{
        droppable: {
          strategy: MeasuringStrategy.Always
        }
      }}
    >
      <SortableContext 
        items={galleryImages.map(img => img.id)} 
        strategy={sortingStrategy}
      >
        <div className={`${gridClassName} ${isDragging ? 'select-none' : ''}`}>
          {galleryImages.map((galleryImage) => {
            const componentProps = {
              galleryImage,
              isCover: coverImageId === galleryImage.image.id,
              onDescriptionChange,
              setCoverImage: onSetCoverImage,
              onRemoveImage
            };
            
            switch (viewMode) {
              case 'grid':
                return <GridGalleryCard key={galleryImage.id} {...componentProps} />;
              case 'compact':
              default:
                return <CompactGalleryCard key={galleryImage.id} {...componentProps} />;
            }
          })}
        </div>
      </SortableContext>
      
      <DragOverlay adjustScale={true} dropAnimation={{
        duration: 300,
        easing: 'cubic-bezier(0.18, 0.67, 0.6, 1.22)',
      }}>
        {activeImage ? <DragOverlayCard image={activeImage as FullImageInGallery} /> : null}
      </DragOverlay>
    </DndContext>
  );
}
