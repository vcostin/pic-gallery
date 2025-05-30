'use client';

import { LoadingSpinner } from '@/components/StatusMessages';

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
}

/**
 * Spinner component that wraps LoadingSpinner for consistent UI usage
 */
export function Spinner({ size = 'md' }: SpinnerProps) {
  // Map spinner sizes to LoadingSpinner sizes
  const sizeMap = {
    sm: 'small' as const,
    md: 'medium' as const,
    lg: 'large' as const,
  };

  return <LoadingSpinner size={sizeMap[size]} text="" />;
}
