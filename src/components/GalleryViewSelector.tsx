'use client';

import React from 'react';
import { Button } from './ui/Button';
import { ViewMode } from './GallerySortable';

interface GalleryViewSelectorProps {
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
}

export function GalleryViewSelector({ viewMode, setViewMode }: GalleryViewSelectorProps) {
  return (
    <div className="flex rounded-md shadow-sm p-0.5 bg-gray-100 dark:bg-gray-700">
      <Button
        size="sm"
        variant={viewMode === 'compact' ? "primary" : "ghost"}
        onClick={() => setViewMode('compact')}
        className={`rounded-none rounded-l-md ${
          viewMode !== 'compact' ? 'text-gray-600 dark:text-gray-300' : ''
        }`}
        title="Compact view"
      >
        Compact
      </Button>
      <Button
        size="sm"
        variant={viewMode === 'grid' ? "primary" : "ghost"}
        onClick={() => setViewMode('grid')}
        className={`rounded-none rounded-r-md ${
          viewMode !== 'grid' ? 'text-gray-600 dark:text-gray-300' : ''
        }`}
        title="Grid view"
      >
        Grid
      </Button>
    </div>
  );
}
