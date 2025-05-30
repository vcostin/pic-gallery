'use client';

import React, { forwardRef } from 'react';

export interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  hover?: boolean;
  border?: boolean;
}

/**
 * Card component for displaying content in a box with consistent styling
 */
export const Card = forwardRef<HTMLDivElement, CardProps>(({
  children,
  className = '',
  onClick,
  hover = false,
  border = false,
}, ref) => {
  const baseClasses = 'bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden';
  const hoverClasses = hover ? 'hover:shadow-md transition-shadow' : '';
  const borderClasses = border ? 'border border-gray-200 dark:border-gray-700' : '';
  const clickableClasses = onClick ? 'cursor-pointer' : '';
  
  return (
    <div 
      ref={ref}
      onClick={onClick}
      className={`${baseClasses} ${hoverClasses} ${borderClasses} ${clickableClasses} ${className}`}
    >
      {children}
    </div>
  );
});

Card.displayName = 'Card';

export interface CardHeaderProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * CardHeader component for card title area
 */
export function CardHeader({ children, className = '' }: CardHeaderProps) {
  return (
    <div className={`p-4 border-b border-gray-200 dark:border-gray-700 ${className}`}>
      {children}
    </div>
  );
}

export interface CardTitleProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * CardTitle component for card titles
 */
export function CardTitle({ children, className = '' }: CardTitleProps) {
  return (
    <h3 className={`text-lg font-semibold text-gray-900 dark:text-white ${className}`}>
      {children}
    </h3>
  );
}

export interface CardDescriptionProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * CardDescription component for card descriptions
 */
export function CardDescription({ children, className = '' }: CardDescriptionProps) {
  return (
    <p className={`text-sm text-gray-600 dark:text-gray-400 ${className}`}>
      {children}
    </p>
  );
}

export interface CardContentProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * CardContent component for main card content
 */
export function CardContent({ children, className = '' }: CardContentProps) {
  return (
    <div className={`p-4 ${className}`}>
      {children}
    </div>
  );
}

export interface CardFooterProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * CardFooter component for card actions area
 */
export function CardFooter({ children, className = '' }: CardFooterProps) {
  return (
    <div className={`p-4 border-t border-gray-200 dark:border-gray-700 ${className}`}>
      {children}
    </div>
  );
}

/**
 * CardImage component for card image area
 */
export interface CardImageProps {
  children: React.ReactNode;
  className?: string;
}

export function CardImage({ children, className = '' }: CardImageProps) {
  return (
    <div className={`relative ${className}`}>
      {children}
    </div>
  );
}
