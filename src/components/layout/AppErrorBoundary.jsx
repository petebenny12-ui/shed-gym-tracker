import { Component } from 'react';
import { C3, FONTS } from '../../design';

/**
 * The last thing between a render-time throw and a black screen.
 *
 * Without this, one undefined reference anywhere in the tree unmounts the whole
 * app and leaves the page showing nothing but the background colour — which is
 * exactly what happened when SplashScreen referenced FONTS without importing
 * it. A shed phone with no console gives you no way to see that. So: show the
 * error, and give a thumb-sized way back.
 */
export default class AppErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error('[App] Render crashed:', error, info?.componentStack);
  }

  render() {
    if (!this.state.error) return this.props.children;

    const message = this.state.error?.message || String(this.state.error);

    return (
      <div
        style={{
          minHeight: '100vh',
          background: C3.bg,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 16,
          padding: 24,
          textAlign: 'center',
        }}
      >
        <div
          style={{
            fontFamily: FONTS.sans,
            color: C3.amber,
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: 1.2,
          }}
        >
          Something broke
        </div>
        <div style={{ color: C3.soft, fontSize: 14, maxWidth: 420 }}>
          Your logged sets are safe on the server. This screen failed to draw.
        </div>
        <div
          style={{
            color: C3.muted,
            fontSize: 12,
            maxWidth: 420,
            wordBreak: 'break-word',
            fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
          }}
        >
          {message}
        </div>
        <button
          onClick={() => window.location.reload()}
          style={{
            marginTop: 8,
            minHeight: 48,
            padding: '0 28px',
            background: C3.amber,
            color: C3.bg,
            border: 'none',
            borderRadius: 8,
            fontFamily: FONTS.sans,
            fontWeight: 700,
            fontSize: 15,
            textTransform: 'uppercase',
            letterSpacing: 1.2,
          }}
        >
          Reload
        </button>
      </div>
    );
  }
}
