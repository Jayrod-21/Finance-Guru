/**
 * Error boundary — catches unhandled React rendering errors and displays
 * a user-friendly fallback instead of a blank screen.
 */
import React from "react";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="max-w-lg mx-auto mt-20 text-center">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-8">
            <h2 className="text-xl font-bold text-red-600 dark:text-red-400 mb-3">Something went wrong</h2>
            <p className="text-sm text-muted-light dark:text-muted-dark mb-4">
              An unexpected error occurred. Try refreshing the page.
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-600 mb-6 font-mono">
              {this.state.error?.message}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-2.5 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg transition-colors"
            >
              Refresh Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
