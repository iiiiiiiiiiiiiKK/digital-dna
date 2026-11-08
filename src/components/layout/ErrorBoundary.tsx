import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

/**
 * Route-level error boundary.
 *
 * Without this a thrown render error (or a failed lazy chunk fetch) unmounts the
 * whole page body, leaving an empty <main> and no way for the user to recover.
 * Here the shell survives and the user is offered a reload plus a link home.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // Keep the details in the console for anyone debugging; never send them
    // anywhere, because the app has no server.
    console.error('Digital DNA render error:', error, info.componentStack);
  }

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;

    return (
      <div className="shell flex min-h-[60vh] flex-col items-center justify-center gap-3 text-center">
        <p className="font-mono text-[11px] tracking-[0.24em] text-amber-300/70">RECOVERY</p>
        <h1 className="h2 text-white/90">Something broke while rendering</h1>
        <p className="max-w-md text-[13px] leading-relaxed text-white/45">
          Your saved data is still in this browser — this was a display error, not a data loss. Reload to try again.
        </p>
        <p className="max-w-md break-words font-mono text-[11px] text-white/25">{error.message}</p>
        <div className="mt-2 flex gap-2">
          <button type="button" onClick={() => window.location.reload()} className="btn-primary">
            Reload
          </button>
          <a href="#/" onClick={() => this.setState({ error: null })} className="btn-ghost">
            Back to home
          </a>
        </div>
      </div>
    );
  }
}
