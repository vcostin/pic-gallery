import React from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  className?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className = '', ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={`w-full px-3 py-2 border border-gray-300 rounded-md text-sm 
                   focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                   disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed
                   dark:bg-gray-800 dark:border-gray-600 dark:text-white dark:focus:ring-blue-400
                   ${className}`}
        {...props}
      />
    );
  }
);

Input.displayName = 'Input';
