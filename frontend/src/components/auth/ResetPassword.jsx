import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert, ProgressBar } from 'react-bootstrap';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import authService from '../../services/auth';


const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    newPassword: '',
    confirmPassword: ''});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [passwordStrength, setPasswordStrength] = useState({
    is_valid: false,
    errors: [],
    strength_score: 0,
    requirements: {
      min_length: false,
      has_uppercase: false,
      has_special: false,
      not_similar_to_username: true
    }
  });
  const [showRequirements, setShowRequirements] = useState(false);
  const token = searchParams.get('token');
  useEffect(() => {
    if (!token) {
      setError('No reset token provided. Please check your email link.');
      return;
    }
  }, [token]);
  useEffect(() => {
    const checkPasswordStrength = async () => {
      if (formData.newPassword.length > 0) {
        try {
          const result = await authService.checkPasswordStrength(formData.newPassword);
          setPasswordStrength(result);
        } catch (err) {
          console.error('Password strength check failed:', err);
        }
      } else {
        setPasswordStrength({
          is_valid: false,
          errors: [],
          strength_score: 0,
          requirements: {
            min_length: false,
            has_uppercase: false,
            has_special: false,
            not_similar_to_username: true
          }
        });
      }
    };
    const debounceTimer = setTimeout(checkPasswordStrength, 300);
    return () => clearTimeout(debounceTimer);
  }, [formData.newPassword]);
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (name === 'newPassword') {
      setShowRequirements(value.length > 0);
    }
  };
  const getStrengthColor = (score) => {
    if (score >= 75) return 'success';
    if (score >= 50) return 'warning';
    if (score >= 25) return 'danger';
    return 'danger';
  };
  const getStrengthText = (score) => {
    if (score >= 75) return 'Strong';
    if (score >= 50) return 'Good';
    if (score >= 25) return 'Weak';
    return 'Very Weak';
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!token) {
      setError('Invalid reset token. Please request a new password reset.');
      return;
    }
    if (!formData.newPassword || !formData.confirmPassword) {
      setError('Please fill in all fields.');
      return;
    }
    if (formData.newPassword !== formData.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (!passwordStrength.is_valid) {
      setError('Please fix the password requirements before continuing.');
      return;
    }
    try {
      setLoading(true);
      setError('');
      const response = await authService.confirmPasswordReset(
        token, 
        formData.newPassword, 
        formData.confirmPassword);
      setSuccess(true);
      setLoading(false);
      setTimeout(() => {
        navigate('/login', { 
          state: { 
            message: 'Password reset successful! Please log in with your new password.',
            verified: true 
          } 
        });
      }, 3000);
    } catch (err) {
      console.error('Password reset failed:', err);
      let errorMessage = 'Password reset failed. Please try again.';
      if (err.response?.data?.details) {
        const details = err.response.data.details;
        if (details.token) {
          errorMessage = details.token[0] || 'Invalid or expired reset token.';
        } else if (details.new_password) {
          errorMessage = Array.isArray(details.new_password) 
            ? details.new_password.join(' ') 
            : details.new_password;
        } else {
          errorMessage = err.response.data.error || errorMessage;
        }
      }
      setError(errorMessage);
      setLoading(false);
    }
  };
  if (success) {
    return (
      <Container className="py-5">
        <Row className="justify-content-center">
          <Col md={6} lg={5}>
            <Card className="shadow-sm">
              <Card.Body className="p-4 text-center">
                <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>✅</div>
                <h2 className="text-success mb-3">Password Reset Successful!</h2>
                
                <Alert variant="success">
                  Your password has been reset successfully. You can now log in with your new password.
                </Alert>
                
                <div className="mb-4">
                  <p className="text-muted">
                    Redirecting to login page in a few seconds...
                  </p>
                </div>
                
                <div className="d-grid">
                  <Link to="/login">
                    <Button variant="primary" className="w-100" size="lg">
                      Continue to Login
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
                <h2>Reset Your Password</h2>
                <p className="text-muted">
                  Enter your new password below
                </p>
              </div>
              
              {error && (
                <Alert variant="danger" onClose={() => setError('')} dismissible>
                  {error}
                </Alert>
              )}
              
              <Form onSubmit={handleSubmit}>
                <Form.Group className="mb-3" controlId="newPassword">
                  <Form.Label>New Password *</Form.Label>
                  <Form.Control
                    type="password"
                    placeholder="Enter your new password"
                    name="newPassword"
                    value={formData.newPassword}
                    onChange={handleChange}
                    required
                    disabled={loading}
                  />
                  
                  {/* Real-time password strength indicator */}
                  {showRequirements && (
                    <div className="mt-2">
                      <div className="d-flex align-items-center mb-2">
                        <small className="text-muted me-2">Strength:</small>
                        <ProgressBar 
                          now={passwordStrength.strength_score} 
                          variant={getStrengthColor(passwordStrength.strength_score)}
                          className="flex-grow-1 me-2"
                          style={{ height: '8px' }}
                        />
                        <small className={`text-${getStrengthColor(passwordStrength.strength_score)}`}>
                          {getStrengthText(passwordStrength.strength_score)}
                        </small>
                      </div>
                      
                      {/* Password requirements */}
                      <div className="password-requirements">
                        <small className="text-muted d-block mb-1">Password must contain:</small>
                        <div className="requirements-list">
                          <small className={passwordStrength.requirements.min_length ? 'text-success' : 'text-danger'}>
                            {passwordStrength.requirements.min_length ? '✓' : '✗'} At least 8 characters
                          </small><br />
                          <small className={passwordStrength.requirements.has_uppercase ? 'text-success' : 'text-danger'}>
                            {passwordStrength.requirements.has_uppercase ? '✓' : '✗'} One uppercase letter
                          </small><br />
                          <small className={passwordStrength.requirements.has_special ? 'text-success' : 'text-danger'}>
                            {passwordStrength.requirements.has_special ? '✓' : '✗'} One special character (!@#$%^&*)
                          </small><br />
                          <small className={passwordStrength.requirements.not_similar_to_username ? 'text-success' : 'text-danger'}>
                            {passwordStrength.requirements.not_similar_to_username ? '✓' : '✗'} Different from username
                          </small>
                        </div>
                      </div>
                      
                      {/* Show errors if any */}
                      {passwordStrength.errors.length > 0 && (
                        <div className="mt-2">
                          {passwordStrength.errors.map((error, index) => (
                            <small key={index} className="text-danger d-block">
                              • {error}
                            </small>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </Form.Group>
                
                <Form.Group className="mb-4" controlId="confirmPassword">
                  <Form.Label>Confirm New Password *</Form.Label>
                  <Form.Control
                    type="password"
                    placeholder="Confirm your new password"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    required
                    disabled={loading}
                    isInvalid={formData.confirmPassword && formData.newPassword !== formData.confirmPassword}
                  />
                  <Form.Control.Feedback type="invalid">
                    Passwords do not match.
                  </Form.Control.Feedback>
                </Form.Group>
                
                <div className="security-info bg-light p-3 rounded mb-3">
                  <h6 className="mb-2">🔒 Security Note:</h6>
                  <ul className="mb-0 small text-muted">
                    <li>Your new password cannot be the same as your previous password</li>
                    <li>This reset link can only be used once</li>
                    <li>For your security, please choose a strong, unique password</li>
                  </ul>
                </div>
                
                <div className="d-grid mb-3">
                  <Button 
                    variant="primary" 
                    type="submit" 
                    disabled={loading || !passwordStrength.is_valid}
                    size="lg"
                  >
                    {loading ? 'Resetting Password...' : 'Reset Password'}
                  </Button>
                </div>
              </Form>
              
              <div className="text-center">
                <p>
                  Remember your password?{' '}
                  <Link to="/login" className="text-decoration-none">
                    Back to Login
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

export default ResetPassword;