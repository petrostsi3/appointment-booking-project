import React, { useState } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import authService from '../../services/auth';


const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [emailSent, setEmailSent] = useState(false);
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) {
      setError('Please enter your email address.');
      return;
    }
    if (!email.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }
    try {
      setLoading(true);
      setError('');
      const response = await authService.requestPasswordReset(email);
      setSuccess(true);
      setEmailSent(true);
      setLoading(false);
    } catch (err) {
      console.error('Password reset request failed:', err);
      const errorMessage = err.response?.data?.error || 
                          'Failed to send password reset email. Please try again.';
      setError(errorMessage);
      setLoading(false);
    }
  };
  
  if (success && emailSent) {
    return (
      <Container className="py-5">
        <Row className="justify-content-center">
          <Col md={6} lg={5}>
            <Card className="shadow-sm">
              <Card.Body className="p-4 text-center">
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📧</div>
                <h3 className="mb-3">Password Reset Email Sent!</h3>
                
                <Alert variant="success">
                  If an account with this email exists, a password reset link has been sent.
                </Alert>
                
                <div className="mb-4">
                  <p className="text-muted">
                    We've sent a password reset link to:
                  </p>
                  <p><strong>{email}</strong></p>
                  <p className="text-muted small">
                    Please check your inbox and spam/junk folders. The link will expire in 1 hour.
                  </p>
                </div>
                
                <div className="security-notice bg-light p-3 rounded mb-4">
                  <h6 className="mb-2">🔒 Security Tips:</h6>
                  <ul className="text-muted small text-start mb-0">
                    <li>The reset link can only be used once</li>
                    <li>It expires in 1 hour for your security</li>
                    <li>You cannot reuse your previous password</li>
                    <li>If you didn't request this, please ignore the email</li>
                  </ul>
                </div>
                
                <div className="d-grid gap-2">
                  <Button 
                    variant="outline-primary"
                    onClick={() => {
                      setSuccess(false);
                      setEmailSent(false);
                      setEmail('');
                    }}
                  >
                    Send to Different Email
                  </Button>
                  <Link to="/login">
                    <Button variant="primary" className="w-100">
                      Back to Login
                    </Button>
                  </Link>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    );
  }
  
  return (
    <Container className="py-5">
      <Row className="justify-content-center">
        <Col md={6} lg={5}>
          <Card className="shadow-sm">
            <Card.Body className="p-4">
              <div className="text-center mb-4">
                <h2>Forgot Password?</h2>
                <p className="text-muted">
                  Enter your email address and we'll send you a link to reset your password
                </p>
              </div>
              
              {error && (
                <Alert variant="danger" onClose={() => setError('')} dismissible>
                  {error}
                </Alert>
              )}
              
              <Form onSubmit={handleSubmit}>
                <Form.Group className="mb-3" controlId="email">
                  <Form.Label>Email Address</Form.Label>
                  <Form.Control
                    type="email"
                    placeholder="Enter your email address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={loading}
                  />
                  <Form.Text className="text-muted">
                    Enter the email address associated with your account.
                  </Form.Text>
                </Form.Group>
                
                <div className="security-info bg-light p-3 rounded mb-3">
                  <h6 className="mb-2">🔒 What happens next?</h6>
                  <ul className="mb-0 small text-muted">
                    <li>We'll send a secure reset link to your email</li>
                    <li>The link expires in 1 hour for security</li>
                    <li>You'll need to create a new password</li>
                    <li>Your new password cannot be the same as your previous one</li>
                  </ul>
                </div>
                
                <div className="d-grid mb-3">
                  <Button variant="primary" type="submit" disabled={loading} size="lg">
                    {loading ? 'Sending Reset Link...' : 'Send Password Reset Link'}
                  </Button>
                </div>
              </Form>
              
              <div className="text-center">
                <p className="mb-2">
                  Remember your password?{' '}
                  <Link to="/login" className="text-decoration-none">
                    Back to Login
                  </Link>
                </p>
                <p>
                  Don't have an account?{' '}
                  <Link to="/register" className="text-decoration-none">
                    Create Account
                  </Link>
                </p>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default ForgotPassword;