import React, { useState, useEffect } from 'react';
import { Container, Card, Alert, Spinner, Button } from 'react-bootstrap';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import authService from '../../services/auth';


const EmailVerification = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [verificationState, setVerificationState] = useState('verifying'); 
  const [message, setMessage] = useState('');
  const [userInfo, setUserInfo] = useState(null);
  const [error, setError] = useState('');
  const token = searchParams.get('token');
  useEffect(() => {
    if (!token) {
      setVerificationState('error');
      setError('No verification token provided. Please check your email link.');
      return;
    }
    
    verifyEmail();
  }, [token]);
  
  const verifyEmail = async () => {
    try {
      setVerificationState('verifying');
      const response = await authService.verifyEmail(token);
      setVerificationState('success');
      setMessage(response.message);
      setUserInfo(response.user);
  
      // Redirect to login after 5 seconds
      setTimeout(() => {
        navigate('/login', { 
          state: { 
            message: 'Your email has been verified! Please log in to continue.',
            verified: true 
          } 
        });
      }, 5000);
      
    } catch (err) {
      console.error('Email verification failed:', err);
      if (err.response?.data?.expired) {
        setVerificationState('expired');
        setError('Your verification link has expired. Please request a new one.');
      } else if (err.response?.data?.invalid) {
        setVerificationState('error');
        setError('Invalid verification link. Please check your email or request a new verification link.');
      } else {
        setVerificationState('error');
        setError(err.response?.data?.error || 'Email verification failed. Please try again.');
      }
    }
  };
  
  const handleResendVerification = () => {
    navigate('/resend-verification');
  };
  
  if (verificationState === 'verifying') {
    return (
      <Container className="py-5">
        <div className="d-flex justify-content-center">
          <Card className="text-center" style={{ maxWidth: '500px' }}>
            <Card.Body className="py-5">
              <Spinner animation="border" variant="primary" className="mb-3" />
              <h3>Verifying Your Email...</h3>
              <p className="text-muted">Please wait while we verify your email address.</p>
            </Card.Body>
          </Card>
        </div>
      </Container>
    );
  }
  
  if (verificationState === 'success') {
    return (
      <Container className="py-5">
        <div className="d-flex justify-content-center">
          <Card className="text-center" style={{ maxWidth: '600px' }}>
            <Card.Body className="py-5">
              <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🎉</div>
              <h2 className="text-success mb-3">Email Verified Successfully!</h2>
              <Alert variant="success">{message}</Alert>
              {userInfo && (
                <div className="mb-4">
                  <h5>Welcome, {userInfo.first_name} {userInfo.last_name}!</h5>
                  <p className="text-muted">
                    Account Type: <span className="text-capitalize">{userInfo.user_type}</span>
                  </p>
                </div>
              )}
              <div className="d-grid gap-2">
                <Link to="/login">
                  <Button variant="primary" size="lg" className="w-100">
                    Continue to Login
                  </Button>
                </Link>
              </div>
              
              <p className="text-muted mt-3 small">
                You will be automatically redirected to the login page in a few seconds...
              </p>
            </Card.Body>
          </Card>
        </div>
      </Container>
    );
  }
  
  return (
    <Container className="py-5">
      <div className="d-flex justify-content-center">
        <Card className="text-center" style={{ maxWidth: '600px' }}>
          <Card.Body className="py-5">
            <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>
              {verificationState === 'expired' ? '⏰' : '❌'}
            </div>
            <h2 className="text-danger mb-3">
              {verificationState === 'expired' ? 'Link Expired' : 'Verification Failed'}
            </h2>
            <Alert variant="danger">{error}</Alert>
            <div className="d-grid gap-2">
              <Button 
                variant="primary" 
                onClick={handleResendVerification}
                size="lg"
              >
                Get New Verification Link
              </Button>
              <Link to="/login">
                <Button variant="outline-secondary" className="w-100">
                  Back to Login
                </Button>
              </Link>
            </div>
          </Card.Body>
        </Card>
      </div>
    </Container>
  );
};

export default EmailVerification;