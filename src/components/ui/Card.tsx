'use client';

import React, { forwardRef } from 'react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
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
  ...otherProps
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
      {...otherProps}
    >
      {children}
    </div>
  );
});

Card.displayName = 'Card';

export interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
}

/**
 * CardHeader component for card title area
 */
export function CardHeader({ children, className = '', ...otherProps }: CardHeaderProps) {
  return (
    <div className={`p-4 border-b border-gray-200 dark:border-gray-700 ${className}`} {...otherProps}>
      {children}
    </div>
  );
}

export interface CardTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {
  children: React.ReactNode;
  className?: string;
}

/**
 * CardTitle component for card titles
 */
export function CardTitle({ children, className = '', ...otherProps }: CardTitleProps) {
  return (
    <h3 className={`text-lg font-semibold text-gray-900 dark:text-white ${className}`} {...otherProps}>
      {children}
    </h3>
  );
}

export interface CardDescriptionProps extends React.HTMLAttributes<HTMLParagraphElement> {
  children: React.ReactNode;
  className?: string;
}

/**
 * CardDescription component for card descriptions
 */
export function CardDescription({ children, className = '', ...otherProps }: CardDescriptionProps) {
  return (
    <p className={`text-sm text-gray-600 dark:text-gray-400 ${className}`} {...otherProps}>
      {children}
    </p>
  );
}

export interface CardContentProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
}

/**
 * CardContent component for main card content
 */
export function CardContent({ children, className = '', ...otherProps }: CardContentProps) {
  return (
    <div className={`p-4 ${className}`} {...otherProps}>
      {children}
    </div>
  );
}

export interface CardFooterProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
}

/**
 * CardFooter component for card actions area
 */
export function CardFooter({ children, className = '', ...otherProps }: CardFooterProps) {
  return (
    <div className={`p-4 border-t border-gray-200 dark:border-gray-700 ${className}`} {...otherProps}>
      {children}
    </div>
  );
}

/**
 * CardImage component for card image area
 */
export interface CardImageProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
}

export function CardImage({ children, className = '', ...otherProps }: CardImageProps) {
  return (
    <div className={`relative ${className}`} {...otherProps}>
      {children}
    </div>
  );
}
