'use client';

import React from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'outline' | 'ghost';
type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  icon?: React.ReactNode;
  fullWidth?: boolean;
  className?: string;
}

/**
 * Button component with consistent styling and variants
 */
export function Button({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  icon,
  fullWidth = false,
  className = '',
  disabled,
  type = 'button',
  ...props
}: ButtonProps) {
  // Define size classes
  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base'
  };

  // Define variant classes
  const variantClasses = {
    primary: 'bg-blue-500 hover:bg-blue-600 text-white border-transparent focus:ring-blue-400',
    secondary: 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-white border-transparent focus:ring-gray-400',
    danger: 'bg-red-500 hover:bg-red-600 text-white border-transparent focus:ring-red-400',
    outline: 'bg-transparent hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 focus:ring-gray-400',
    ghost: 'bg-transparent hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 border-transparent focus:ring-gray-400'
  };
  
  // Combined classes
  const buttonClasses = `
    inline-flex items-center justify-center
    font-medium rounded-md
    border transition-colors
    focus:outline-none focus:ring-2 focus:ring-opacity-50
    ${isLoading || disabled ? 'opacity-70 cursor-not-allowed' : ''}
    ${fullWidth ? 'w-full' : ''}
    ${sizeClasses[size]}
    ${variantClasses[variant]}
    ${className}
  `.trim();
  
  return (
    <button
      type={type}
      className={buttonClasses}
      disabled={isLoading || disabled}
      {...props}
    >
      {/* Show loading spinner when in loading state */}
      {isLoading ? (
        <>
          <svg
            className="animate-spin -ml-1 mr-2 h-4 w-4"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
          <span>{children}</span>
        </>
      ) : (
        <>
          {/* Show icon if provided */}
          {icon && <span className="mr-2">{icon}</span>}
          <span>{children}</span>
        </>
      )}
    </button>
  );
}
