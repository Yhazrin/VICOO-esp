import { Component, type ReactNode, type ErrorInfo } from 'react';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(_error: Error, _info: ErrorInfo) {
    // Error logging handled by server-side monitoring
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div role="alert" style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          minHeight: '50vh', padding: '4rem 1.5rem', textAlign: 'center',
        }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.5rem' }}>
            Something went wrong
          </h2>
          <p style={{ color: '#666', marginBottom: '1.5rem', maxWidth: '28rem' }}>
            An unexpected error occurred. Please try again.
          </p>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <button
              onClick={this.handleReset}
              style={{
                padding: '0.5rem 1.5rem', background: '#111', color: '#fff',
                border: 'none', borderRadius: '4px', cursor: 'pointer',
              }}
            >
              Try again
            </button>
            <a
              href="/admin/"
              style={{
                padding: '0.5rem 1.5rem', border: '1px solid #ddd',
                borderRadius: '4px', textDecoration: 'none', color: '#111',
              }}
            >
              Go home
            </a>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
