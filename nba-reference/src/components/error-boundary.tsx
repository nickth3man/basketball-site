'use client';

import type { ErrorInfo, ReactNode } from 'react';
import { Component } from 'react';
import { Button } from '@/components/ui/button';
import { logError } from '@/lib/logger';

interface Props {
  children: ReactNode;
  fallback?: ReactNode | ((error: Error) => ReactNode);
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
    logError('Error caught by boundary', {
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
    });
  }

  override render(): ReactNode {
    if (this.state.hasError) {
      const { fallback } = this.props;
      const { error } = this.state;
      if (typeof fallback === 'function' && error) {
        return fallback(error);
      }
      const nodeFallback = typeof fallback !== 'function' ? fallback : undefined;
      return (
        nodeFallback ?? (
          <div className="mx-auto max-w-2xl p-6 text-center">
            <h2 className="mb-4 inscription-title text-xl text-[var(--dc-secondary)]">
              Something went wrong
            </h2>
            <p className="mb-4 text-muted">
              We encountered an error while loading this page. Please try refreshing.
            </p>
            <Button
              onClick={(): void => {
                window.location.reload();
              }}
              variant="danger"
              size="lg"
            >
              Reload Page
            </Button>
          </div>
        )
      );
    }

    return this.props.children;
  }
}
