'use client';

import { useState, useEffect, useMemo } from 'react';
import { z } from 'zod';
import { Controller, useController, Control } from 'react-hook-form';
import { Badge } from '@/components/ui/Badge';
import { X } from 'lucide-react';

// Define Tag schema
const TagSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1)
});

// Define valid form control types
type TagsInputProps<T = any> = {
  name: string;
  control: Control<T>;
  label?: string;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  initialTags?: string[];
  maxTags?: number;
};

export function TagsInput<T>({
  name,
  control,
  label = 'Tags',
  placeholder = 'Add tags separated by commas',
  disabled = false,
  className = '',
  initialTags = [],
  maxTags = 20
}: TagsInputProps<T>) {
  // Local state for the input field
  const [inputValue, setInputValue] = useState('');
  
  // Use react-hook-form controller to get field value and methods
  const {
    field: { value = [], onChange },
    fieldState: { error }
  } = useController({
    name,
    control,
    defaultValue: [] as any
  });
  
  // Parse and detect tags from input field
  const parseTags = (input: string): string[] => {
    return input
      .split(',') // Split by commas
      .map(tag => tag.trim()) // Trim whitespace
      .filter(tag => tag.length > 0); // Remove empty strings
  };

  // Convert array of string tags to required format
  const formatTags = (stringTags: string[]): { id?: string, name: string }[] => {
    return stringTags.map(tag => ({
      name: tag
    }));
  };

  // Handle adding new tags
  const addTags = (tagsToAdd: string[]) => {
    if (!tagsToAdd.length) return;
    
    // Get current tag names for comparison
    const currentTagNames = value.map((t: { name: string }) => t.name.toLowerCase());
    
    // Filter out duplicates and respect max limit
    const newTags = tagsToAdd
      .filter(tag => !currentTagNames.includes(tag.toLowerCase()))
      .slice(0, maxTags - value.length);
    
    if (newTags.length === 0) return;
    
    // Add new tags to the array
    onChange([...value, ...formatTags(newTags)]);
  };

  // Handle remove tag action
  const removeTag = (indexToRemove: number) => {
    onChange(value.filter((_: any, i: number) => i !== indexToRemove));
  };

  // Handle initial tags (if provided)
  useEffect(() => {
    if (initialTags && initialTags.length > 0 && (!value || value.length === 0)) {
      onChange(formatTags(initialTags));
    }
  }, [initialTags, onChange, value]);

  // Handle form input submission
  const handleInputSubmit = () => {
    const newTags = parseTags(inputValue);
    addTags(newTags);
    setInputValue('');
  };

  // Handle keyboard events
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      handleInputSubmit();
    } else if (e.key === 'Backspace' && inputValue === '' && value.length > 0) {
      // Remove the last tag when backspace is pressed on an empty input
      removeTag(value.length - 1);
    }
  };

  // Calculate tags remaining
  const tagsRemaining = useMemo(() => {
    return Math.max(0, maxTags - value.length);
  }, [maxTags, value]);

  return (
    <div className={`space-y-1 ${className}`} data-testid="tags-input">
      {label && <label className="block text-sm font-medium mb-1">{label}</label>}
      
      <div className="w-full p-1 border rounded-md bg-background flex flex-wrap gap-1 items-center">
        {/* Display existing tags */}
        {value && value.length > 0 && value.map((tag: { name: string }, index: number) => (
          <Badge key={index} variant="secondary" className="flex items-center gap-1" data-testid={`tags-management-tag-${tag.name.toLowerCase().replace(/\s+/g, '-')}`}>
            {tag.name}
            {!disabled && (
              <button
                type="button"
                onClick={() => removeTag(index)}
                className="text-muted-foreground hover:text-foreground"
                data-testid={`tags-management-remove-tag-${tag.name.toLowerCase().replace(/\s+/g, '-')}`}
              >
                <X size={14} />
              </button>
            )}
          </Badge>
        ))}
        
        {/* Input for new tags */}
        {value && value.length < maxTags && !disabled && (
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={handleInputSubmit}
            placeholder={placeholder}
            className="flex-grow min-w-[120px] px-2 py-1 border-none focus:outline-none bg-transparent"
            disabled={disabled}
            data-testid="tags-management-input-field"
          />
        )}
      </div>

      {/* Validation error */}
      {error && <p className="text-red-500 text-xs mt-1">{error.message}</p>}
      
      {/* Tags remaining count */}
      <p className="text-xs text-muted-foreground">
        {tagsRemaining} tag{tagsRemaining !== 1 ? 's' : ''} remaining
      </p>
    </div>
  );
}

export type { TagsInputProps };
export { TagSchema };
