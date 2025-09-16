import React from 'react';
import { Container, Card, Button } from 'react-bootstrap';


class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true };
  }
  componentDidCatch(error, errorInfo) {
    this.setState({
      error: error,
      errorInfo: errorInfo
    });
    if (process.env.NODE_ENV === 'development') {
      console.error('Error Boundary caught an error:', error, errorInfo);
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <Container className="py-5">
          <Card className="text-center shadow-sm">
            <Card.Body className="py-5">
              <div style={{ fontSize: '4rem', marginBottom: '1rem' }}></div>
              <h2 className="mb-3">Oops! Something went wrong</h2>
              <p className="text-muted mb-4">
                We're sorry, but something unexpected happened. Our team has been notified.
              </p>
              <div className="d-flex gap-2 justify-content-center">
                <Button 
                  variant="primary"
                  onClick={() => window.location.reload()}
                >
                  Refresh Page
                </Button>
                <Button 
                  variant="outline-secondary"
                  onClick={() => window.location.href = '/'}
                >
                  Go Home
                </Button>
              </div>
              
              {process.env.NODE_ENV === 'development' && (
                <details className="mt-4 text-start">
                  <summary className="mb-2 text-danger cursor-pointer">
                    <strong>Error Details (Development Only)</strong>
                  </summary>
                  <pre className="bg-light p-3 rounded text-danger small">
                    {this.state.error && this.state.error.toString()}
                    <br />
                    {this.state.errorInfo.componentStack}
                  </pre>
                </details>
              )}
            </Card.Body>
          </Card>
        </Container>
      );
    }

    return this.props.children;
  }
}

export const NotFoundPage = () => (
  <Container className="py-5">
    <Card className="text-center shadow-sm">
      <Card.Body className="py-5">
        <div style={{ fontSize: '6rem', marginBottom: '1rem' }}>🔍</div>
        <h1 className="display-4 mb-3">404</h1>
        <h2 className="mb-3">Page Not Found</h2>
        <p className="text-muted mb-4">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="d-flex gap-2 justify-content-center">
          <Button 
            variant="primary"
            onClick={() => window.history.back()}
          >
            Go Back
          </Button>
          <Button 
            variant="outline-primary"
            href="/"
          >
            Go Home
          </Button>
        </div>
      </Card.Body>
    </Card>
  </Container>
);

export const MaintenancePage = () => (
  <Container className="py-5">
    <Card className="text-center shadow-sm">
      <Card.Body className="py-5">
        <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🔧</div>
        <h2 className="mb-3">Under Maintenance</h2>
        <p className="text-muted mb-4">
          We're currently performing scheduled maintenance. We'll be back shortly!
        </p>
        <Button 
          variant="outline-primary"
          onClick={() => window.location.reload()}
        >
          Try Again
        </Button>
      </Card.Body>
    </Card>
  </Container>
);

export default ErrorBoundary;