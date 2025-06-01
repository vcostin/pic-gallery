'use client';

import React from 'react';

// Simple Card components to bypass potential module resolution issues
export const Card = ({ children, className, ...otherProps }: React.HTMLAttributes<HTMLDivElement> & { children: React.ReactNode; className?: string }) => (
  <div className={`rounded-lg shadow bg-white dark:bg-gray-800 ${className || ''}`} {...otherProps}>{children}</div>
);

export const CardHeader = ({ children, className, ...otherProps }: React.HTMLAttributes<HTMLDivElement> & { children: React.ReactNode; className?: string }) => (
  <div className={`p-4 border-b border-gray-200 dark:border-gray-700 ${className || ''}`} {...otherProps}>{children}</div>
);

export const CardContent = ({ children, className, ...otherProps }: React.HTMLAttributes<HTMLDivElement> & { children: React.ReactNode; className?: string }) => (
  <div className={`p-4 ${className || ''}`} {...otherProps}>{children}</div>
);

export const CardFooter = ({ children, className, ...otherProps }: React.HTMLAttributes<HTMLDivElement> & { children: React.ReactNode; className?: string }) => (
  <div className={`p-4 border-t border-gray-200 dark:border-gray-700 ${className || ''}`} {...otherProps}>{children}</div>
);

export const CardTitle = ({ children, className, ...otherProps }: React.HTMLAttributes<HTMLHeadingElement> & { children: React.ReactNode; className?: string }) => (
  <h3 className={`text-lg font-semibold ${className || ''}`} {...otherProps}>{children}</h3>
);

export const CardDescription = ({ children, className, ...otherProps }: React.HTMLAttributes<HTMLParagraphElement> & { children: React.ReactNode; className?: string }) => (
  <p className={`text-sm text-gray-500 dark:text-gray-400 ${className || ''}`} {...otherProps}>{children}</p>
);
