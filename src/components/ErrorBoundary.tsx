'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import logger from '@/lib/logger';

interface Props {
  children: ReactNode;
  fallback?: ReactNode | ((error: Error) => ReactNode);
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    logger.error('Error caught by ErrorBoundary:', error, errorInfo);
  }

  render(): ReactNode {
    if (this.state.hasError) {
      if (typeof this.props.fallback === 'function') {
        return this.props.fallback(this.state.error as Error);
      }
      
      if (this.props.fallback) {
        return this.props.fallback;
      }
      
      return (
        <div className="p-4 m-4 bg-red-50 border border-red-200 rounded-md text-red-800">
          <h2 className="text-lg font-semibold mb-2">Something went wrong</h2>
          <p className="mb-4">There was an error loading this content.</p>
          <details className="text-sm bg-white p-2 rounded">
            <summary>Error details</summary>
            <p className="mt-1 font-mono text-xs overflow-auto p-2 bg-gray-100">
              {this.state.error?.toString()}
            </p>
          </details>
          <button
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
            onClick={() => this.setState({ hasError: false, error: null })}
          >
            Try Again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
