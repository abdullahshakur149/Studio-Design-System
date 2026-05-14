import { Component, type ReactNode } from 'react';
import * as Sentry from '@sentry/react';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  override state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(_error: Error): ErrorBoundaryState {
    return { hasError: true };
  }

  override componentDidCatch(error: Error, info: { componentStack?: string | null }): void {
    Sentry.captureException(error, {
      contexts: { react: { componentStack: info.componentStack ?? '' } },
    });
  }

  private handleReload = (): void => {
    window.location.reload();
  };

  override render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div className="page page-narrow" style={{ minHeight: '100vh', display: 'grid', placeItems: 'center' }}>
          <div className="card" style={{ maxWidth: 480, textAlign: 'center' }}>
            <h2 style={{ marginTop: 0 }}>Something went wrong</h2>
            <p className="text-secondary">
              We've logged the error and will look into it. Try reloading the page.
            </p>
            <div style={{ marginTop: 24 }}>
              <button className="btn btn-primary" onClick={this.handleReload}>Reload page</button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
