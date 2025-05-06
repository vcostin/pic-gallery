'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation'; // Import useSearchParams and useRouter
import { ImageGrid } from "@/components/ImageGrid";
import { useFetch } from '@/lib/hooks'; // Assuming useFetch can be used on client
import { Image as ImageType, PaginatedResponse } from '@/lib/types'; // Rename Image to ImageType to avoid conflict
import { Button } from '@/components/ui/Button';
import { LoadingSpinner, ErrorMessage, EmptyState } from '@/components/StatusMessages';

const DEBOUNCE_DELAY = 500; // 500ms debounce delay

export default function ImagesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [searchQuery, setSearchQuery] = useState(searchParams.get('searchQuery') || '');
  const [tag, setTag] = useState(searchParams.get('tag') || '');
  const [images, setImages] = useState<ImageType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<{ currentPage: number; lastPage: number; total: number } | null>(null);
  const [debounceTimeout, setDebounceTimeout] = useState<NodeJS.Timeout | null>(null);

  const { fetchApi } = useFetch();

  const fetchImages = useCallback(async (page = 1, currentSearch = searchQuery, currentTag = tag) => {
    setIsLoading(true);
    setError(null);
    try {
      const query = new URLSearchParams();
      if (currentSearch) query.set('searchQuery', currentSearch);
      if (currentTag) query.set('tag', currentTag);
      query.set('page', page.toString());
      // Add limit if you have it, e.g., query.set('limit', '20');

      const response = await fetchApi<PaginatedResponse<ImageType>>(`/api/images?${query.toString()}`);
      setImages(response.data);
      setPagination(response.meta);
      
      const newParams = new URLSearchParams(window.location.search);
      if (currentSearch) newParams.set('searchQuery', currentSearch); else newParams.delete('searchQuery');
      if (currentTag) newParams.set('tag', currentTag); else newParams.delete('tag');
      if (page > 1) newParams.set('page', page.toString()); else newParams.delete('page');
      // Only push new state if params actually changed to avoid unnecessary history entries
      if (newParams.toString() !== searchParams.toString()) {
        router.replace(`/images?${newParams.toString()}`, { scroll: false });
      }

    } catch (e: any) {
      setError(e.message || "Failed to fetch images.");
      setImages([]);
      setPagination(null);
    } finally {
      setIsLoading(false);
    }
  }, [fetchApi, router, searchParams, searchQuery, tag]); // Added searchQuery and tag here, though they are passed as args too

  // Effect for initial load and when URL searchParams change (e.g., browser back/forward)
  useEffect(() => {
    const pageFromUrl = parseInt(searchParams.get('page') || '1', 10);
    const searchFromUrl = searchParams.get('searchQuery') || '';
    const tagFromUrl = searchParams.get('tag') || '';

    // Update state if URL params differ from local state, then fetch
    // This handles cases where user navigates directly with query params or uses back/forward
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

  // Removed handleFilter as it's no longer needed

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">My Images</h1>
        <Link 
          href="/images/upload" 
          className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-md transition-colors"
        >
          Upload New Image
        </Link>
      </div>

      <div className="mb-8 p-4 border rounded-lg bg-gray-50 dark:bg-gray-800">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end"> {/* Changed to md:grid-cols-2 */}
          <div>
            <label htmlFor="searchQuery" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Search by Title/Description
            </label>
            <input
              type="text"
              id="searchQuery"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              // Removed onKeyDown
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              placeholder="e.g., Sunset, Mountains"
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
              // Removed onKeyDown
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              placeholder="e.g., nature, portrait"
            />
          </div>
          {/* Apply Filters Button Removed */}
        </div>
      </div>

      {isLoading && <LoadingSpinner text="Fetching images..." />}
      {error && <ErrorMessage error={error} retry={() => fetchImages(1, searchQuery, tag)} />}
      {!isLoading && !error && images.length === 0 && (
        <EmptyState title="No Images Found" description="Try adjusting your filters or upload new images." />
      )}
      {!isLoading && !error && images.length > 0 && (
        <>
          <ImageGrid images={images} />
          {pagination && pagination.lastPage > 1 && (
            <div className="mt-8 flex justify-center items-center space-x-2">
              <Button 
                onClick={() => handlePageChange(pagination.currentPage - 1)} 
                disabled={pagination.currentPage <= 1 || isLoading}
                variant="outline"
              >
                Previous
              </Button>
              <span>Page {pagination.currentPage} of {pagination.lastPage} (Total: {pagination.total})</span>
              <Button 
                onClick={() => handlePageChange(pagination.currentPage + 1)} 
                disabled={pagination.currentPage >= pagination.lastPage || isLoading}
                variant="outline"
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
