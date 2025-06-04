'use client';

import { useState, useRef, useEffect, KeyboardEvent } from 'react';
import { XMarkIcon } from '@heroicons/react/20/solid';

interface TagInputProps {
  value: string[];
  onChange: (tags: string[]) => void;
  suggestions?: string[];
  placeholder?: string;
  maxTags?: number;
  className?: string;
  disabled?: boolean;
}

export function TagInput({
  value = [],
  onChange,
  suggestions = [],
  placeholder = 'Add tags...',
  maxTags = 10,
  className = '',
  disabled = false
}: TagInputProps) {
  const [inputValue, setInputValue] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Filter suggestions based on input and exclude already selected tags
  const filteredSuggestions = suggestions
    .filter(suggestion => 
      suggestion.toLowerCase().includes(inputValue.toLowerCase()) &&
      !value.includes(suggestion)
    )
    .slice(0, 5); // Limit to 5 suggestions

  useEffect(() => {
    setSelectedSuggestionIndex(-1);
  }, [inputValue]);

  const addTag = (tag: string) => {
    const trimmedTag = tag.trim();
    if (trimmedTag && !value.includes(trimmedTag) && value.length < maxTags) {
      onChange([...value, trimmedTag]);
      setInputValue('');
      setShowSuggestions(false);
    }
  };

  const removeTag = (indexToRemove: number) => {
    onChange(value.filter((_, index) => index !== indexToRemove));
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedSuggestionIndex >= 0 && filteredSuggestions[selectedSuggestionIndex]) {
        addTag(filteredSuggestions[selectedSuggestionIndex]);
      } else if (inputValue.trim()) {
        addTag(inputValue);
      }
    } else if (e.key === 'Backspace' && !inputValue && value.length > 0) {
      removeTag(value.length - 1);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedSuggestionIndex(prev => 
        prev < filteredSuggestions.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedSuggestionIndex(prev => prev > 0 ? prev - 1 : -1);
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
      setSelectedSuggestionIndex(-1);
    } else if (e.key === 'Tab' && selectedSuggestionIndex >= 0) {
      e.preventDefault();
      addTag(filteredSuggestions[selectedSuggestionIndex]);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    setShowSuggestions(newValue.length > 0 && filteredSuggestions.length > 0);
  };

  const handleInputFocus = () => {
    if (inputValue && filteredSuggestions.length > 0) {
      setShowSuggestions(true);
    }
  };

  const handleInputBlur = () => {
    // Delay hiding suggestions to allow clicking on them
    setTimeout(() => {
      setShowSuggestions(false);
      setSelectedSuggestionIndex(-1);
    }, 200);
  };

  return (
    <div className={`relative ${className}`}>
      <div className={`
        min-h-[42px] w-full px-3 py-2 border rounded-md 
        dark:bg-gray-700 dark:border-gray-600 
        focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500
        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        ${value.length >= maxTags ? 'border-yellow-400' : ''}
      `}>
        <div className="flex flex-wrap gap-2 items-center">
          {/* Render existing tags */}
          {value.map((tag, index) => (
            <span
              key={index}
              className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-sm rounded-md"
            >
              {tag}
              {!disabled && (
                <button
                  type="button"
                  onClick={() => removeTag(index)}
                  className="text-blue-600 dark:text-blue-300 hover:text-blue-800 dark:hover:text-blue-100"
                  aria-label={`Remove tag ${tag}`}
                >
                  <XMarkIcon className="w-3 h-3" />
                </button>
              )}
            </span>
          ))}
          
          {/* Input field */}
          {value.length < maxTags && (
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              onFocus={handleInputFocus}
              onBlur={handleInputBlur}
              placeholder={value.length === 0 ? placeholder : ''}
              disabled={disabled}
              className="flex-1 min-w-[120px] bg-transparent border-none outline-none text-sm placeholder-gray-500"
              data-testid="tag-input"
            />
          )}
        </div>

        {/* Max tags warning */}
        {value.length >= maxTags && (
          <div className="text-xs text-yellow-600 dark:text-yellow-400 mt-1">
            Maximum {maxTags} tags reached
          </div>
        )}
      </div>

      {/* Suggestions dropdown */}
      {showSuggestions && filteredSuggestions.length > 0 && (
        <div
          ref={suggestionsRef}
          className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg max-h-60 overflow-auto"
        >
          {filteredSuggestions.map((suggestion, index) => (
            <button
              key={suggestion}
              type="button"
              className={`
                w-full text-left px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700
                ${index === selectedSuggestionIndex ? 'bg-blue-100 dark:bg-blue-900' : ''}
              `}
              onClick={() => addTag(suggestion)}
              onMouseEnter={() => setSelectedSuggestionIndex(index)}
            >
              {suggestion}
            </button>
          ))}
        </div>
      )}

      {/* Keyboard hints */}
      {showSuggestions && (
        <div className="text-xs text-gray-500 mt-1">
          Press Tab or Enter to add, ↑↓ to navigate
        </div>
      )}
    </div>
  );
}
