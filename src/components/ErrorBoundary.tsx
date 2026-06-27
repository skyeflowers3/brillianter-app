import { Component, type ErrorInfo, type ReactNode } from 'react'

interface ErrorBoundaryProps {
  children: ReactNode
}

interface ErrorBoundaryState {
  hasError: boolean
}

/**
 * Catches render-time errors anywhere below it and shows a recoverable message instead of letting a
 * single exception unmount the whole app (which renders as a blank/black screen). Without this, an
 * unexpected value in persisted data — e.g. a mastery tier a newer build wrote that this build does
 * not recognize — would take the entire UI down with no way to recover but a manual reload.
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Unhandled UI error', error, info)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="app-error-fallback" role="alert">
          <h1>Something went wrong</h1>
          <p>The app hit an unexpected error. Reloading usually fixes it.</p>
          <button
            type="button"
            className="button button--primary"
            onClick={() => window.location.reload()}
          >
            Reload
          </button>
        </div>
      )
    }

    return this.props.children
  }
}
