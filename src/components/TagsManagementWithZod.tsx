// TagsManagementWithZod.tsx
'use client';

import { useState, useEffect } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from '@/components/ui/Toast';
import { ImageService } from '@/lib/services/imageService';

// Mock UI components for testing
const TagsInput = ({ name, control }: any) => <div data-testid="tags-input">Tags Input</div>;
const Button = (props: any) => <button {...props} />;
const Input = (props: any) => <input {...props} />;
const Badge = (props: any) => <span {...props}>{props.children}</span>;
const Card = (props: any) => <div {...props}>{props.children}</div>;
const CardHeader = (props: any) => <div {...props}>{props.children}</div>;
const CardTitle = (props: any) => <h3 {...props}>{props.children}</h3>;
const CardDescription = (props: any) => <p {...props}>{props.children}</p>;
const CardContent = (props: any) => <div {...props}>{props.children}</div>;
const CardFooter = (props: any) => <div {...props}>{props.children}</div>;
const Spinner = (props: any) => <div data-testid="spinner" {...props} />;

// Define the schema for tag management
const TagManagementSchema = z.object({
  tag: z.string().min(1, "Tag name is required").max(30, "Tag cannot exceed 30 characters"),
  imageTags: z.array(z.object({
    id: z.string().optional(),
    name: z.string().min(1)
  })).default([])
});

type TagManagementFormData = z.infer<typeof TagManagementSchema>;

interface TagsManagementWithZodProps {
  initialTags?: { id: string; name: string }[];
  onTagsUpdated?: (tags: { id: string; name: string }[]) => void;
}

export function TagsManagementWithZod({
  initialTags = [],
  onTagsUpdated
}: TagsManagementWithZodProps) {
  const [popularTags, setPopularTags] = useState<{ id: string; name: string; count: number }[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Set up form with zod schema validation
  const {
    register,
    handleSubmit,
    control,
    setValue,
    watch,
    reset,
    formState: { errors }
  } = useForm<TagManagementFormData>({
    resolver: zodResolver(TagManagementSchema),
    defaultValues: {
      tag: '',
      imageTags: initialTags || []
    }
  });

  // Watch for tag changes
  const currentTags = watch('imageTags');

  // Fetch popular tags on component mount
  useEffect(() => {
    fetchPopularTags();
  }, []);

  // Fetch popular tags from the API
  const fetchPopularTags = async () => {
    setIsLoading(true);
    try {
      // This would be a real API call in a production app
      // Using mock data for this example
      const mockPopularTags = [
        { id: '1', name: 'nature', count: 42 },
        { id: '2', name: 'landscape', count: 35 },
        { id: '3', name: 'portrait', count: 28 },
        { id: '4', name: 'architecture', count: 20 },
        { id: '5', name: 'travel', count: 18 },
      ];
      setPopularTags(mockPopularTags);
    } catch (error) {
      console.error('Error fetching popular tags:', error);
      toast.error('Failed to load popular tags');
    } finally {
      setIsLoading(false);
    }
  };

  // Add a tag from the popular tags list
  const addPopularTag = (tag: { id: string; name: string }) => {
    // Check if tag already exists in the current tags
    const tagExists = currentTags.some(t => 
      (t.id && t.id === tag.id) || t.name.toLowerCase() === tag.name.toLowerCase()
    );

    if (!tagExists) {
      setValue('imageTags', [...currentTags, tag]);
      
      if (onTagsUpdated) {
        onTagsUpdated([...currentTags, tag]);
      }
    }
  };

  // Handle form submission to add a new tag
  const onSubmit = (data: TagManagementFormData) => {
    setIsSubmitting(true);
    
    // Check if tag already exists
    const tagExists = currentTags.some(t => 
      t.name.toLowerCase() === data.tag.toLowerCase()
    );

    if (tagExists) {
      toast.error('This tag already exists');
      setIsSubmitting(false);
      return;
    }

    // Create new tag object
    const newTag = { name: data.tag };
    
    // Update tags list
    const updatedTags = [...currentTags, newTag];
    setValue('imageTags', updatedTags);
    
    // Clear input
    setValue('tag', '');
    
    // Notify parent component if callback exists
    if (onTagsUpdated) {
      onTagsUpdated(updatedTags);
    }
    
    toast.success('Tag added successfully');
    setIsSubmitting(false);
  };

  // Remove a tag
  const removeTag = (tagToRemove: { id?: string; name: string }) => {
    const updatedTags = currentTags.filter(tag => 
      (tag.id && tagToRemove.id ? tag.id !== tagToRemove.id : tag.name !== tagToRemove.name)
    );
    
    setValue('imageTags', updatedTags);
    
    if (onTagsUpdated) {
      onTagsUpdated(updatedTags);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Tag Management</CardTitle>
        <CardDescription>Add or remove tags to organize your content</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current tags */}
        <div className="space-y-2">
          <h3 className="text-sm font-medium">Current Tags</h3>
          <div className="flex flex-wrap gap-2">
            {currentTags.length > 0 ? (
              currentTags.map((tag, index) => (
                <Badge 
                  key={tag.id || `tag-${index}`} 
                  variant="secondary"
                  className="pl-2"
                >
                  {tag.name}
                  <button 
                    type="button"
                    className="ml-1 hover:text-destructive"
                    onClick={() => removeTag(tag)}
                  >
                    <span className="sr-only">Remove tag {tag.name}</span>
                    <X size={14} />
                  </button>
                </Badge>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">No tags added yet</p>
            )}
          </div>
        </div>

        {/* Add new tag form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="tag" className="block text-sm font-medium">
              Add New Tag
            </label>
            <div className="flex gap-2">
              <Input
                id="tag"
                placeholder="Enter a tag name"
                {...register('tag')}
                className={errors.tag ? 'border-destructive' : ''}
              />
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? <Spinner size="sm" className="mr-2" /> : null}
                Add
              </Button>
            </div>
            {errors.tag && (
              <p className="text-sm text-destructive">{errors.tag.message}</p>
            )}
          </div>
        </form>

        {/* Popular tags */}
        <div className="space-y-2">
          <h3 className="text-sm font-medium">Popular Tags</h3>
          {isLoading ? (
            <div className="flex justify-center py-4">
              <Spinner />
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {popularTags.length > 0 ? (
                popularTags.map(tag => (
                  <Badge 
                    key={tag.id} 
                    variant="outline"
                    className="cursor-pointer hover:bg-primary hover:text-primary-foreground"
                    onClick={() => addPopularTag(tag)}
                  >
                    {tag.name} ({tag.count})
                  </Badge>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No popular tags found</p>
              )}
            </div>
          )}
        </div>
      </CardContent>
      
      <CardFooter className="border-t px-6 py-4 bg-muted/50">
        <p className="text-xs text-muted-foreground">
          Tags help organize your content and make it more discoverable.
        </p>
      </CardFooter>
    </Card>
  );
}
