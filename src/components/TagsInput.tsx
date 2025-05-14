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
  maxTags = 10
}: TagsInputProps<T>) {
  const [inputValue, setInputValue] = useState<string>('');
  const { field } = useController({ name, control });

  // Initialize tags if they're provided
  useEffect(() => {
    if (initialTags && initialTags.length > 0 && (!field.value || field.value.length === 0)) {
      field.onChange(initialTags);
    }
  }, [initialTags, field]);

  // Get current tags from the field
  const currentTags = useMemo(() => {
    return Array.isArray(field.value) ? field.value : [];
  }, [field.value]);

  // Handle adding a new tag
  const addTag = (tag: string) => {
    const trimmedTag = tag.trim();
    
    // Skip if the tag is empty or we're at max tags
    if (!trimmedTag || (maxTags && currentTags.length >= maxTags)) {
      return;
    }
    
    // Skip if the tag already exists (case insensitive)
    if (currentTags.some(t => t.toLowerCase() === trimmedTag.toLowerCase())) {
      return;
    }
    
    // Add the new tag
    field.onChange([...currentTags, trimmedTag]);
  };

  // Handle removing a tag
  const removeTag = (index: number) => {
    const newTags = [...currentTags];
    newTags.splice(index, 1);
    field.onChange(newTags);
  };

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  // Handle key down for comma and Enter key
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      
      // Get the input value and split by comma
      const tags = inputValue.split(',').map(t => t.trim()).filter(Boolean);
      
      // Add each tag
      tags.forEach(addTag);
      
      // Clear input
      setInputValue('');
    } else if (e.key === 'Backspace' && inputValue === '' && currentTags.length > 0) {
      // Remove the last tag when pressing backspace in an empty input
      removeTag(currentTags.length - 1);
    }
  };

  // Handle blur event for adding tags
  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    // Add any remaining tags on blur
    if (inputValue.trim()) {
      const tags = inputValue.split(',').map(t => t.trim()).filter(Boolean);
      tags.forEach(addTag);
      setInputValue('');
    }
    field.onBlur();
  };

  return (
    <div className={`space-y-2 ${className}`}>
      {label && <label className="block text-sm font-medium">{label}</label>}
      <div className="flex flex-wrap gap-2 p-2 border rounded-md min-h-10 bg-background">
        {/* Render existing tags */}
        {currentTags.map((tag, index) => (
          <Badge key={`${tag}-${index}`} variant="secondary" className="text-sm flex items-center gap-1">
            {tag}
            <button 
              type="button" 
              onClick={() => removeTag(index)} 
              className="focus:outline-none"
              disabled={disabled}
              aria-label={`Remove tag ${tag}`}
            >
              <X className="w-3 h-3" />
            </button>
          </Badge>
        ))}
        
        {/* Input for new tags */}
        <input
          className="flex-1 outline-none bg-transparent min-w-[120px]"
          placeholder={currentTags.length ? '' : placeholder}
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
          disabled={disabled || (maxTags && currentTags.length >= maxTags)}
        />
      </div>
      
      {maxTags && (
        <p className="text-xs text-muted-foreground">
          {currentTags.length} / {maxTags} tags
        </p>
      )}
    </div>
  );
}

// For backwards compatibility with non-react-hook-form implementations
export function TagsField({
  value = [],
  onChange,
  label = 'Tags',
  placeholder = 'Add tags separated by commas',
  disabled = false,
  className = '',
  maxTags = 10
}: {
  value: string[];
  onChange: (tags: string[]) => void;
  label?: string;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  maxTags?: number;
}) {
  const [tags, setTags] = useState<string[]>(value);
  const [inputValue, setInputValue] = useState<string>('');

  // Sync internal state with external value
  useEffect(() => {
    setTags(value || []);
  }, [value]);

  // Notify parent of changes
  useEffect(() => {
    onChange(tags);
  }, [tags, onChange]);

  // Handle adding a new tag
  const addTag = (tag: string) => {
    const trimmedTag = tag.trim();
    
    // Skip if the tag is empty or we're at max tags
    if (!trimmedTag || (maxTags && tags.length >= maxTags)) {
      return;
    }
    
    // Skip if the tag already exists (case insensitive)
    if (tags.some(t => t.toLowerCase() === trimmedTag.toLowerCase())) {
      return;
    }
    
    // Add the new tag
    setTags([...tags, trimmedTag]);
  };

  // Handle removing a tag
  const removeTag = (index: number) => {
    const newTags = [...tags];
    newTags.splice(index, 1);
    setTags(newTags);
  };

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  // Handle key down for comma and Enter key
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      
      // Get the input value and split by comma
      const newTags = inputValue.split(',').map(t => t.trim()).filter(Boolean);
      
      // Add each tag
      newTags.forEach(addTag);
      
      // Clear input
      setInputValue('');
    } else if (e.key === 'Backspace' && inputValue === '' && tags.length > 0) {
      // Remove the last tag when pressing backspace in an empty input
      removeTag(tags.length - 1);
    }
  };

  // Handle blur event for adding tags
  const handleBlur = () => {
    // Add any remaining tags on blur
    if (inputValue.trim()) {
      const newTags = inputValue.split(',').map(t => t.trim()).filter(Boolean);
      newTags.forEach(addTag);
      setInputValue('');
    }
  };

  return (
    <div className={`space-y-2 ${className}`}>
      {label && <label className="block text-sm font-medium">{label}</label>}
      <div className="flex flex-wrap gap-2 p-2 border rounded-md min-h-10 bg-background">
        {/* Render existing tags */}
        {tags.map((tag, index) => (
          <Badge key={`${tag}-${index}`} variant="secondary" className="text-sm flex items-center gap-1">
            {tag}
            <button 
              type="button" 
              onClick={() => removeTag(index)} 
              className="focus:outline-none"
              disabled={disabled}
              aria-label={`Remove tag ${tag}`}
            >
              <X className="w-3 h-3" />
            </button>
          </Badge>
        ))}
        
        {/* Input for new tags */}
        <input
          className="flex-1 outline-none bg-transparent min-w-[120px]"
          placeholder={tags.length ? '' : placeholder}
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
          disabled={disabled || (maxTags && tags.length >= maxTags)}
        />
      </div>
      
      {maxTags && (
        <p className="text-xs text-muted-foreground">
          {tags.length} / {maxTags} tags
        </p>
      )}
    </div>
  );
}
