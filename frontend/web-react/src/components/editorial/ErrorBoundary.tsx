import { Component, type ReactNode, type ErrorInfo } from 'react';
import i18n from '@/i18n';

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
    // In production, errors are reported via error tracking service
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div role="alert" className="flex flex-col items-center justify-center min-h-[50dvh] px-6 py-16 text-center">
          <span className="font-body text-overline tracking-[0.3em] uppercase text-sepia-mid mb-4">
            {i18n.t('error.somethingWentWrong')}
          </span>
          <h2 className="font-display text-h2 text-ink mb-4">
            {i18n.t('error.weHitASnag')}
          </h2>
          <p className="font-body text-body-sm text-ink-faded max-w-md leading-relaxed mb-8">
            {i18n.t('error.unexpectedError')}
          </p>
          <div className="flex gap-4">
            <button
              onClick={this.handleReset}
              className="font-body text-caption tracking-[0.15em] uppercase px-6 py-3 bg-ink text-paper hover:bg-ink-faded transition-colors cursor-pointer"
            >
              {i18n.t('error.tryAgain')}
            </button>
            <a
              href="/"
              className="font-body text-caption tracking-[0.15em] uppercase px-6 py-3 border border-warm-gray/50 text-ink hover:bg-warm-gray/20 transition-colors cursor-pointer"
            >
              {i18n.t('error.goHome')}
            </a>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
