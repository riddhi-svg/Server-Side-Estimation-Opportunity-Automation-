import { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="bg-rose-50/70 border border-rose-200 rounded-2xl p-6 my-4 text-rose-900 shadow-sm">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div className="space-y-2 flex-1">
              <h3 className="text-sm font-bold text-rose-900">
                {this.props.fallbackTitle || 'An error occurred while displaying this section.'}
              </h3>
              {this.state.error?.message && (
                <p className="text-xs font-mono bg-rose-100/70 p-2.5 rounded-lg text-rose-800 break-words">
                  {this.state.error.message}
                </p>
              )}
              <button
                onClick={this.handleReset}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-rose-300 text-rose-700 text-xs font-medium hover:bg-rose-50 transition shadow-xs"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Retry Render
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
