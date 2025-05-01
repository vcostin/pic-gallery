'use client';

import React from 'react';

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
      <button
        type="button"
        onClick={() => setViewMode(ViewMode.Compact)}
        className={`px-3 py-1 text-sm rounded-md ${
          viewMode === ViewMode.Compact
            ? 'bg-white dark:bg-gray-600 shadow'
            : 'text-gray-600 dark:text-gray-300 hover:bg-white/50 dark:hover:bg-gray-600/50'
        }`}
        title="Compact view"
      >
        Compact
      </button>
      <button
        type="button"
        onClick={() => setViewMode(ViewMode.Standard)}
        className={`px-3 py-1 text-sm rounded-md ${
          viewMode === ViewMode.Standard
            ? 'bg-white dark:bg-gray-600 shadow'
            : 'text-gray-600 dark:text-gray-300 hover:bg-white/50 dark:hover:bg-gray-600/50'
        }`}
        title="Standard view"
      >
        Standard
      </button>
      <button
        type="button"
        onClick={() => setViewMode(ViewMode.Grid)}
        className={`px-3 py-1 text-sm rounded-md ${
          viewMode === ViewMode.Grid
            ? 'bg-white dark:bg-gray-600 shadow'
            : 'text-gray-600 dark:text-gray-300 hover:bg-white/50 dark:hover:bg-gray-600/50'
        }`}
        title="Grid view"
      >
        Grid
      </button>
    </div>
  );
}
