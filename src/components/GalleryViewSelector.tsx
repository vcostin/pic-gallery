'use client';

import React from 'react';
import { Button } from './ui/Button';

export enum ViewMode {
  Compact = 'compact',
  Standard = 'standard',
  Grid = 'grid'
}

interface GalleryViewSelectorProps {
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
}

export function GalleryViewSelector({ viewMode, setViewMode }: GalleryViewSelectorProps) {
  return (
    <div className="flex rounded-md shadow-sm p-0.5 bg-gray-100 dark:bg-gray-700">
      <Button
        size="sm"
        variant={viewMode === ViewMode.Compact ? "primary" : "ghost"}
        onClick={() => setViewMode(ViewMode.Compact)}
        className={`rounded-none rounded-l-md ${
          viewMode !== ViewMode.Compact ? 'text-gray-600 dark:text-gray-300' : ''
        }`}
        title="Compact view"
      >
        Compact
      </Button>
      <Button
        size="sm"
        variant={viewMode === ViewMode.Standard ? "primary" : "ghost"}
        onClick={() => setViewMode(ViewMode.Standard)}
        className={`rounded-none border-l-0 border-r-0 ${
          viewMode !== ViewMode.Standard ? 'text-gray-600 dark:text-gray-300' : ''
        }`}
        title="Standard view"
      >
        Standard
      </Button>
      <Button
        size="sm"
        variant={viewMode === ViewMode.Grid ? "primary" : "ghost"}
        onClick={() => setViewMode(ViewMode.Grid)}
        className={`rounded-none rounded-r-md ${
          viewMode !== ViewMode.Grid ? 'text-gray-600 dark:text-gray-300' : ''
        }`}
        title="Grid view"
      >
        Grid
      </Button>
    </div>
  );
}
