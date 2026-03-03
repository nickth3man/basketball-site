'use client';

import type { ErrorInfo, ReactNode } from 'react';
import { Component } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

/**
 * Error Boundary component for catching and handling React errors gracefully.
 *
 * Prevents entire app crashes by catching errors in child components and
 * displaying a fallback UI instead of a blank screen.
 *
 * @example
 * <ErrorBoundary fallback={<CustomErrorUI />}>
 *   <PageContent />
 * </ErrorBoundary>
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  override componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  override render(): ReactNode {
    if (this.state.hasError) {
      return (
        this.props.fallback ?? (
          <div className="mx-auto max-w-2xl p-6 text-center">
            <h2 className="mb-4 text-xl font-bold text-red-600">Something went wrong</h2>
            <p className="mb-4 text-gray-600">
              We encountered an error while loading this page. Please try refreshing.
            </p>
            <button
              onClick={(): void => {
                this.setState({ hasError: false });
                window.location.reload();
              }}
              className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
              type="button"
            >
              Reload Page
            </button>
          </div>
        )
      );
    }

    return this.props.children;
  }
}
