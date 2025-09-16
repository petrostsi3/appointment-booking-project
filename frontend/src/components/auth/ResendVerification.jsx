import React, { useState } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import authService from '../../services/auth';


const ResendVerification = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
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
      setMessage('');
      const response = await authService.resendVerificationEmail(email);
      if (response.already_verified) {
        setMessage('This email address is already verified! You can log in to your account.');
      } else {
        setMessage('Verification email sent! Please check your inbox and spam folder.');
        setEmailSent(true);
      }
      setLoading(false);
    } catch (err) {
      console.error('Resend verification failed:', err);
      const errorMessage = err.response?.data?.error || 
                          'Failed to send verification email. Please try again.';
      setError(errorMessage);
      setLoading(false);
    }
  };
  if (emailSent) {
    return (
      <Container className="py-5">
        <Row className="justify-content-center">
          <Col md={6} lg={5}>
            <Card className="shadow-sm">
              <Card.Body className="p-4 text-center">
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📧</div>
                <h3 className="mb-3">Verification Email Sent!</h3>
                <Alert variant="success">{message}</Alert>
                
                <div className="mb-4">
                  <p className="text-muted">
                    We've sent a verification link to:
                  </p>
                  <p><strong>{email}</strong></p>
                  <p className="text-muted small">
                    Please check your inbox and spam/junk folders. The link will expire in 24 hours.
                  </p>
                </div>
                
                <div className="d-grid gap-2">
                  <Button 
                    variant="outline-primary"
                    onClick={() => {
                      setEmailSent(false);
                      setEmail('');
                      setMessage('');
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
                <h2>Resend Verification Email</h2>
                <p className="text-muted">
                  Enter your email address to receive a new verification link
                </p>
              </div>
              
              {error && (
                <Alert variant="danger" onClose={() => setError('')} dismissible>
                  {error}
                </Alert>
              )}
              
              {message && !emailSent && (
                <Alert variant="info" onClose={() => setMessage('')} dismissible>
                  {message}
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
                  />
                  <Form.Text className="text-muted">
                    Enter the email address you used to register your account.
                  </Form.Text>
                </Form.Group>
                
                <div className="d-grid mb-3">
                  <Button variant="primary" type="submit" disabled={loading}>
                    {loading ? 'Sending...' : 'Send Verification Email'}
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
                  Need to create an account?{' '}
                  <Link to="/register" className="text-decoration-none">
                    Register
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

export default ResendVerification;