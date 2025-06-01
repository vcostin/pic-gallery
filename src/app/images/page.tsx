'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { ImageGrid } from "@/components/ImageGrid";
import { z } from 'zod';
import { PaginatedImagesResponseSchema } from '@/lib/schemas';
import { Button } from '@/components/ui/Button';
import { LoadingSpinner, ErrorMessage, EmptyState } from '@/components/StatusMessages';
import { ImageService } from '@/lib/services/imageService';
import logger from '@/lib/logger';

// Define type for Image based on PaginatedImagesResponseSchema
type ImageType = z.infer<typeof PaginatedImagesResponseSchema>['data']['data'][number];

const DEBOUNCE_DELAY = 500; // 500ms debounce delay

export default function ImagesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Create AbortController ref for API requests
  const controllerRef = useRef<AbortController | null>(null);

  // State
  const [searchQuery, setSearchQuery] = useState(searchParams.get('searchQuery') || '');
  const [tag, setTag] = useState(searchParams.get('tag') || '');
  const [images, setImages] = useState<ImageType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<{ 
    currentPage: number; 
    lastPage: number; 
    total: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  } | null>(null);
  const [debounceTimeout, setDebounceTimeout] = useState<NodeJS.Timeout | null>(null);

  // Cleanup function to abort any in-flight requests when component unmounts
  useEffect(() => {
    return () => {
      if (controllerRef.current) {
        controllerRef.current.abort();
        controllerRef.current = null;
      }
      
      if (debounceTimeout) {
        clearTimeout(debounceTimeout);
      }
    };
  }, [debounceTimeout]);

  const fetchImages = useCallback(async (page = 1, currentSearch = searchQuery, currentTag = tag) => {
    setIsLoading(true);
    setError(null);
    
    // Cancel any existing request
    if (controllerRef.current) {
      controllerRef.current.abort();
    }
    
    // Create a new AbortController
    const abortController = new AbortController();
    controllerRef.current = abortController;
    
    try {
      // Use ImageService to fetch images
      const paginatedImages = await ImageService.getImages({
        page,
        searchQuery: currentSearch,
        tag: currentTag
      }, abortController.signal);
      
      // Only process if the request wasn't aborted
      if (!abortController.signal.aborted) {
        // paginatedImages contains { data: Image[], meta: PaginationInfo }
        setImages(paginatedImages.data);
        setPagination({
          currentPage: paginatedImages.meta.currentPage,
          lastPage: paginatedImages.meta.lastPage,
          total: paginatedImages.meta.total,
          hasNextPage: paginatedImages.meta.hasNextPage,
          hasPrevPage: paginatedImages.meta.hasPrevPage
        });
        
        const newParams = new URLSearchParams(window.location.search);
        if (currentSearch) newParams.set('searchQuery', currentSearch); else newParams.delete('searchQuery');
        if (currentTag) newParams.set('tag', currentTag); else newParams.delete('tag');
        if (page > 1) newParams.set('page', page.toString()); else newParams.delete('page');
        
        // Only push new state if params actually changed to avoid unnecessary history entries
        if (newParams.toString() !== searchParams.toString()) {
          router.replace(`/images?${newParams.toString()}`, { scroll: false });
        }
      }
    } catch (err) {
      // Only set error if request wasn't aborted
      if (!(err instanceof DOMException && err.name === 'AbortError')) {
        const errorMessage = err instanceof Error ? err.message : "Failed to fetch images.";
        setError(errorMessage);
        setImages([]);
        setPagination(null);
        logger.error('Error fetching images:', err);
      }
    } finally {
      if (controllerRef.current === abortController) {
        controllerRef.current = null;
        setIsLoading(false);
      }
    }
  }, [router, searchParams, searchQuery, tag]);

  // Effect for initial load and when URL searchParams change (e.g., browser back/forward)
  useEffect(() => {
    const pageFromUrl = parseInt(searchParams.get('page') || '1', 10);
    const searchFromUrl = searchParams.get('searchQuery') || '';
    const tagFromUrl = searchParams.get('tag') || '';

    // Update state if URL params differ from local state, then fetch
    if (searchFromUrl !== searchQuery || tagFromUrl !== tag) {
      setSearchQuery(searchFromUrl);
      setTag(tagFromUrl);
    }
    
    fetchImages(pageFromUrl, searchFromUrl, tagFromUrl);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]); // Only trigger on direct searchParams changes from URL

  // Effect for debounced fetching when local searchQuery or tag state changes by user input
  useEffect(() => {
    if (debounceTimeout) {
      clearTimeout(debounceTimeout);
    }
    
    const timeoutId = setTimeout(() => {
      // Fetch with current state values, reset to page 1 for new filters
      fetchImages(1, searchQuery, tag);
    }, DEBOUNCE_DELAY);
    
    setDebounceTimeout(timeoutId);

    return () => {
      if (debounceTimeout) {
        clearTimeout(debounceTimeout);
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, tag]); // Trigger when user types into search or tag inputs
  
  const handlePageChange = (newPage: number) => {
    fetchImages(newPage, searchQuery, tag);
  };

  return (
    <div className="container mx-auto px-4 py-8" data-testid="images-page">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">My Images</h1>
        <Link 
          href="/images/upload" 
          className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-md transition-colors"
          data-testid="upload-image-link"
        >
          Upload New Image
        </Link>
      </div>

      <div className="mb-8 p-4 border rounded-lg bg-gray-50 dark:bg-gray-800">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
          <div>
            <label htmlFor="searchQuery" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Search by Title/Description
            </label>
            <input
              type="text"
              id="searchQuery"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              placeholder="e.g., Sunset, Mountains"
              data-testid="search-input"
            />
          </div>
          <div>
            <label htmlFor="tag" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Filter by Tag
            </label>
            <input
              type="text"
              id="tag"
              value={tag}
              onChange={(e) => setTag(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              placeholder="e.g., nature, portrait"
              data-testid="tag-input"
            />
          </div>
        </div>
      </div>

      {isLoading && <LoadingSpinner text="Fetching images..." data-testid="loading-spinner" />}
      {error && <ErrorMessage error={error} retry={() => fetchImages(1, searchQuery, tag)} data-testid="error-message" />}
      {!isLoading && !error && images && images.length === 0 && (
        <div data-testid="empty-state">
          <EmptyState title="No Images Found" description="Try adjusting your filters or upload new images." />
        </div>
      )}
      {!isLoading && !error && images && images.length > 0 && (
        <>
          <ImageGrid 
            images={images}
            data-testid="image-grid"
          />
          {pagination && pagination.lastPage > 1 && (
            <div className="mt-8 flex justify-center items-center space-x-2" data-testid="pagination">
              <Button 
                onClick={() => handlePageChange(pagination.currentPage - 1)} 
                disabled={!pagination.hasPrevPage || isLoading}
                variant="outline"
                data-testid="prev-page-button"
              >
                Previous
              </Button>
              <span data-testid="page-info">Page {pagination.currentPage} of {pagination.lastPage} (Total: {pagination.total})</span>
              <Button 
                onClick={() => handlePageChange(pagination.currentPage + 1)} 
                disabled={!pagination.hasNextPage || isLoading}
                variant="outline"
                data-testid="next-page-button"
              >
                Next
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
