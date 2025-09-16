import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Form, Button, Card, Alert } from 'react-bootstrap';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [validated, setValidated] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [showUnverifiedAlert, setShowUnverifiedAlert] = useState(false);
  const [unverifiedEmail, setUnverifiedEmail] = useState('');
  
  const { login, loading, error, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  const from = location.state?.from?.pathname || '/';
  
  const verificationMessage = location.state?.message;
  const isVerified = location.state?.verified;
  
  // If already authenticated, redirect
  useEffect(() => {
    if (isAuthenticated) {
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, from]);
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    const form = e.currentTarget;
    
    // Form validation
    if (form.checkValidity() === false) {
      e.stopPropagation();
      setValidated(true);
      return;
    }
    
    setLoginError('');
    setShowUnverifiedAlert(false);
    
    try {
      console.log('Attempting login with:', username, password);
      const success = await login(username, password);
      
      if (success) {
        navigate(from, { replace: true });
      }
    } catch (err) {
      console.error('Login failed:', err);
      
      if (err.isUnverified) {
        setShowUnverifiedAlert(true);
        setUnverifiedEmail(username.includes('@') ? username : '');
        setLoginError('Your account is not verified. Please check your email and verify your account before logging in.');
      } else {
        setLoginError('Login failed. Please check your credentials and try again.');
      }
    }
  };
  
  const handleResendVerification = () => {
    const email = unverifiedEmail || username;
    navigate('/resend-verification', { state: { email } });
  };
  
  return (
    <Container>
      <Row className="justify-content-center mt-5">
        <Col md={6} lg={5}>
          <Card className="shadow-sm">
            <Card.Body className="p-4">
              <div className="text-center mb-4">
                <h2>Login</h2>
                <p className="text-muted">Sign in to your account</p>
              </div>
              
              {/* Verification Success Message or Password Reset Success */}
              {verificationMessage && isVerified && (
                <Alert variant="success" className="mb-4">
                  <div className="d-flex align-items-center">
                    <div style={{ fontSize: '1.5rem', marginRight: '0.5rem' }}>✅</div>
                    <div>{verificationMessage}</div>
                  </div>
                </Alert>
              )}
              
              {/* Unverified Account Alert */}
              {showUnverifiedAlert && (
                <Alert variant="warning" className="mb-4">
                  <Alert.Heading className="h6">Email Verification Required</Alert.Heading>
                  <p className="mb-2">
                    Your account is not verified. Please check your email and click the verification link.
                  </p>
                  <div className="d-flex gap-2">
                    <Button 
                      variant="outline-warning" 
                      size="sm"
                      onClick={handleResendVerification}
                    >
                      Resend Verification Email
                    </Button>
                  </div>
                </Alert>
              )}
              
              {(loginError || error) && !showUnverifiedAlert && (
                <Alert variant="danger">{loginError || error}</Alert>
              )}
              
              <Form noValidate validated={validated} onSubmit={handleSubmit}>
                <Form.Group className="mb-3" controlId="username">
                  <Form.Label>Username or Email</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Enter username or email"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                  />
                  <Form.Control.Feedback type="invalid">
                    Please enter your username or email.
                  </Form.Control.Feedback>
                </Form.Group>
                
                <Form.Group className="mb-3" controlId="password">
                  <Form.Label>Password</Form.Label>
                  <Form.Control
                    type="password"
                    placeholder="Enter password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <Form.Control.Feedback type="invalid">
                    Please enter your password.
                  </Form.Control.Feedback>
                </Form.Group>
                
                {/* Forgot Password Link */}
                <div className="d-flex justify-content-end mb-3">
                  <Link 
                    to="/forgot-password" 
                    className="text-decoration-none small"
                  >
                    Forgot your password?
                  </Link>
                </div>
                
                <div className="d-grid">
                  <Button variant="primary" type="submit" disabled={loading}>
                    {loading ? 'Signing in...' : 'Sign In'}
                  </Button>
                </div>
              </Form>
              
              <div className="text-center mt-4">
                <p className="mb-0">
                  Don't have an account?{' '}
                  <Link to="/register" className="text-decoration-none">Register</Link>
                </p>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default Login;