'use client';

import React from 'react';

// Simple Card components to bypass potential module resolution issues
export const Card = (props: { children: React.ReactNode; className?: string }) => (
  <div className={`rounded-lg shadow bg-white dark:bg-gray-800 ${props.className || ''}`}>{props.children}</div>
);

export const CardHeader = (props: { children: React.ReactNode; className?: string }) => (
  <div className={`p-4 border-b border-gray-200 dark:border-gray-700 ${props.className || ''}`}>{props.children}</div>
);

export const CardContent = (props: { children: React.ReactNode; className?: string }) => (
  <div className={`p-4 ${props.className || ''}`}>{props.children}</div>
);

export const CardFooter = (props: { children: React.ReactNode; className?: string }) => (
  <div className={`p-4 border-t border-gray-200 dark:border-gray-700 ${props.className || ''}`}>{props.children}</div>
);

export const CardTitle = (props: { children: React.ReactNode; className?: string }) => (
  <h3 className={`text-lg font-semibold ${props.className || ''}`}>{props.children}</h3>
);

export const CardDescription = (props: { children: React.ReactNode; className?: string }) => (
  <p className={`text-sm text-gray-500 dark:text-gray-400 ${props.className || ''}`}>{props.children}</p>
);
