import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Merges multiple class names into a single string.
 * Uses clsx for conditional classes and twMerge for deduplication and conflict resolution.
 * 
 * @param inputs - Class values to merge
 * @returns Merged class string
 * 
 * @example
 * cn('text-red-500', condition && 'bg-blue-500', 'p-4 p-8') // "text-red-500 bg-blue-500 p-8"
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
