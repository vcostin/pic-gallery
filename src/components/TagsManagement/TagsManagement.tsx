/**
 * @fileoverview TagsManagement Component
 * 
 * A component for managing image tags with Zod schema validation.
 * This is the modern implementation with strong type safety and validation.
 */

'use client';

import { useState, useEffect } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from '@/components/ui/Toast';
import { ImageService } from '@/lib/services/imageService';
import { TagsInput } from '@/components/TagsManagement/TagsInput';
import { X } from 'lucide-react';

// Import UI components
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/Card';
import { Spinner } from '@/components/ui/Spinner';

// Define the schema for tag management
const TagManagementSchema = z.object({
  newTagName: z.string().min(1, { message: 'Tag name is required' }).max(30, { message: 'Tag name too long' }),
});

// Define types based on the schema
type TagManagementFormData = z.infer<typeof TagManagementSchema>;

// Define tag type
export type Tag = {
  id: string;
  name: string;
  imageCount?: number;
};

// Define component props
interface TagsManagementProps {
  imageId?: string; // Optional - when managing tags for a specific image
  initialTags?: Tag[];
  onTagsUpdated?: (tags: Tag[]) => void;
  selectedTags?: string[]; // IDs of tags that should be pre-selected
  mode?: 'admin' | 'image' | 'gallery';
  galleryId?: string;
}

/**
 * TagsManagement component for creating, assigning and managing tags
 */
export function TagsManagement({
  imageId,
  initialTags = [],
  onTagsUpdated,
  selectedTags = [],
  mode = 'admin',
  galleryId,
}: TagsManagementProps) {
  // State management
  const [tags, setTags] = useState<Tag[]>(initialTags);
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>(selectedTags);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Form setup with zod validation
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<TagManagementFormData>({
    resolver: zodResolver(TagManagementSchema),
    defaultValues: {
      newTagName: '',
    },
  });

  // Fetch tags on component mount
  useEffect(() => {
    if (initialTags.length === 0) {
      fetchTags();
    }
  }, [initialTags]);

  // Fetch all tags from the API
  const fetchTags = async () => {
    setIsLoading(true);
    try {
      const response = await ImageService.getTags();
      if (response.success) {
        setTags(response.data);
      } else {
        toast({
          title: 'Error',
          description: 'Failed to load tags',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error fetching tags:', error);
      toast({
        title: 'Error',
        description: 'An unexpected error occurred',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Create a new tag
  const createTag = async (data: TagManagementFormData) => {
    setIsSubmitting(true);
    try {
      const response = await ImageService.createTag({ name: data.newTagName });
      if (response.success) {
        setTags(prevTags => [...prevTags, response.data]);
        toast({
          title: 'Success',
          description: 'Tag created successfully',
          variant: 'default',
        });
        reset();
      } else {
        toast({
          title: 'Error',
          description: response.message || 'Failed to create tag',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error creating tag:', error);
      toast({
        title: 'Error',
        description: 'An unexpected error occurred',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete a tag
  const deleteTag = async (tagId: string) => {
    try {
      const response = await ImageService.deleteTag(tagId);
      if (response.success) {
        setTags(prevTags => prevTags.filter(tag => tag.id !== tagId));
        setSelectedTagIds(prevSelected => prevSelected.filter(id => id !== tagId));
        toast({
          title: 'Success',
          description: 'Tag deleted successfully',
          variant: 'default',
        });
      } else {
        toast({
          title: 'Error',
          description: response.message || 'Failed to delete tag',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error deleting tag:', error);
      toast({
        title: 'Error',
        description: 'An unexpected error occurred',
        variant: 'destructive',
      });
    }
  };

  // Toggle tag selection
  const toggleTag = async (tagId: string) => {
    const isCurrentlySelected = selectedTagIds.includes(tagId);
    const newSelectedTags = isCurrentlySelected
      ? selectedTagIds.filter(id => id !== tagId)
      : [...selectedTagIds, tagId];
    
    setSelectedTagIds(newSelectedTags);
    
    if (imageId) {
      try {
        const response = await ImageService.updateImageTags(imageId, newSelectedTags);
        if (response.success) {
          onTagsUpdated?.(response.data.tags);
          toast({
            title: 'Success',
            description: 'Tags updated successfully',
            variant: 'default',
          });
        } else {
          // Revert selection if update fails
          setSelectedTagIds(selectedTagIds);
          toast({
            title: 'Error',
            description: response.message || 'Failed to update tags',
            variant: 'destructive',
          });
        }
      } catch (error) {
        console.error('Error updating image tags:', error);
        // Revert selection if update fails
        setSelectedTagIds(selectedTagIds);
        toast({
          title: 'Error',
          description: 'An unexpected error occurred',
          variant: 'destructive',
        });
      }
    } else {
      // If no imageId, just notify parent component
      onTagsUpdated?.(tags.filter(tag => newSelectedTags.includes(tag.id)));
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Tag Management</CardTitle>
        <CardDescription>
          {mode === 'admin' 
            ? 'Create and manage your tags' 
            : 'Select tags for your image'}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {isLoading ? (
          <div className="flex justify-center p-4">
            <Spinner />
          </div>
        ) : (
          <>
            {mode === 'admin' && (
              <form onSubmit={handleSubmit(createTag)} className="space-y-2">
                <div className="flex flex-col space-y-1">
                  <label htmlFor="newTagName">Create New Tag</label>
                  <div className="flex space-x-2">
                    <Input
                      id="newTagName"
                      placeholder="Enter tag name"
                      {...register('newTagName')}
                      className="flex-1"
                    />
                    <Button type="submit" disabled={isSubmitting}>
                      {isSubmitting ? <Spinner size="sm" /> : 'Create'}
                    </Button>
                  </div>
                </div>
                {errors.newTagName && (
                  <p className="text-sm text-red-500">{errors.newTagName.message}</p>
                )}
              </form>
            )}
            
            <div className="space-y-2">
              <h3 className="text-sm font-medium">
                {mode === 'admin' ? 'All Tags' : 'Available Tags'}
              </h3>
              
              <div className="flex flex-wrap gap-2">
                {tags.length === 0 ? (
                  <p className="text-sm text-gray-500">No tags available</p>
                ) : (
                  tags.map((tag) => (
                    <Badge
                      key={tag.id}
                      variant={selectedTagIds.includes(tag.id) ? "default" : "outline"}
                      className="cursor-pointer hover:bg-primary/20 h-8"
                      onClick={() => toggleTag(tag.id)}
                    >
                      {tag.name}
                      {tag.imageCount !== undefined && ` (${tag.imageCount})`}
                      
                      {mode === 'admin' && (
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-5 w-5 p-0 ml-1 hover:bg-red-100 hover:text-red-600"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteTag(tag.id);
                          }}
                        >
                          <X className="h-3 w-3" />
                          <span className="sr-only">Delete tag</span>
                        </Button>
                      )}
                    </Badge>
                  ))
                )}
              </div>
            </div>
          </>
        )}
      </CardContent>
      
      <CardFooter className="flex justify-end">
        {mode !== 'admin' && (
          <div className="text-sm text-gray-500">
            {selectedTagIds.length} tags selected
          </div>
        )}
      </CardFooter>
    </Card>
  );
}
