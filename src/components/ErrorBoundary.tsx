import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public override state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public override componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("WebGL 3D Engine Error:", error, errorInfo);
  }

  public override render() {
    if (this.state.hasError) {
      return (
        <div style={{
          position: 'absolute',
          top: '20px',
          left: '20px',
          right: '20px',
          maxHeight: '85vh',
          background: 'rgba(15, 6, 24, 0.95)',
          backdropFilter: 'blur(12px)',
          color: '#ff0055',
          border: '2px solid #ff007f',
          padding: '24px',
          borderRadius: '12px',
          fontFamily: 'monospace',
          zIndex: 9999,
          overflow: 'auto',
          boxShadow: '0 0 30px rgba(255, 0, 127, 0.5)',
          pointerEvents: 'auto'
        }}>
          <h2 style={{ 
            marginBottom: '12px', 
            fontFamily: "'Orbitron', sans-serif", 
            textShadow: '0 0 10px rgba(255, 0, 127, 0.5)',
            fontSize: '20px',
            fontWeight: 'bold'
          }}>
            3D ENGINE LOAD FAILURE
          </h2>
          <p style={{ color: '#fff', marginBottom: '16px', fontSize: '14px', fontFamily: 'sans-serif' }}>
            A critical error occurred while initializing or rendering the 3D viewport:
          </p>
          <pre style={{ 
            whiteSpace: 'pre-wrap', 
            fontSize: '11px', 
            background: 'rgba(0, 0, 0, 0.5)', 
            padding: '12px', 
            borderRadius: '6px',
            border: '1px solid rgba(255, 255, 255, 0.05)',
            color: '#00f3ff'
          }}>
            {this.state.error?.toString()}
            {"\n\n"}
            {this.state.error?.stack}
          </pre>
          <button 
            onClick={() => window.location.reload()}
            style={{
              marginTop: '16px',
              padding: '10px 20px',
              background: 'transparent',
              color: '#fff',
              border: '1px solid #00f3ff',
              borderRadius: '4px',
              cursor: 'pointer',
              fontFamily: "'Orbitron', sans-serif",
              fontSize: '12px',
              textShadow: '0 0 5px rgba(0, 243, 255, 0.5)',
              boxShadow: '0 0 8px rgba(0, 243, 255, 0.2)'
            }}
          >
            RELOAD SYSTEM
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
export default ErrorBoundary;
