import React, { useState } from 'react';
import { Container, Row, Col, Form, Button, Card, Alert } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import CleanPasswordInput from '../common/CleanPasswordInput';
import authService from '../../services/auth';


const Register = () => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    first_name: '',
    last_name: '',
    phone_number: '',
    password: '',
    password2: '',
    user_type: 'client',
  });
  const [validated, setValidated] = useState(false);
  const [registerError, setRegisterError] = useState('');
  const [registrationSuccess, setRegistrationSuccess] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState('');
  const [verificationSent, setVerificationSent] = useState(false);
  const { register, loading, error } = useAuth();
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value.trim() });
    if (registerError) setRegisterError('');
  };
  const handlePasswordChange = (e) => {
    setFormData({ ...formData, password: e.target.value });
    if (registerError) setRegisterError('');
  };
  const handleConfirmPasswordChange = (e) => {
    setFormData({ ...formData, password2: e.target.value });
    if (registerError) setRegisterError('');
  };
  const validateForm = () => {
    const errors = [];
    if (!formData.username.trim()) {
      errors.push('Username is required and cannot be empty.');
    }
    if (!formData.email.trim()) {
      errors.push('Email address is required and cannot be empty.');
    } else if (!formData.email.includes('@')) {
      errors.push('Please enter a valid email address.');
    }
    if (!formData.first_name.trim()) {
      errors.push('First name is required and cannot be empty.');
    }
    if (!formData.last_name.trim()) {
      errors.push('Last name is required and cannot be empty.');
    }
    if (!formData.password) {
      errors.push('Password is required.');
    } else if (formData.password.length < 8) {
      errors.push('Password must be at least 8 characters long.');
    }
    if (formData.password !== formData.password2) {
      errors.push('Passwords do not match.');
    }
    return errors;
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    const form = e.currentTarget;
    const validationErrors = validateForm();
    if (validationErrors.length > 0) {
      setRegisterError(validationErrors.join(' '));
      setValidated(true);
      return;
    }
    if (form.checkValidity() === false) {
      e.stopPropagation();
      setValidated(true);
      return;
    }
    setRegisterError('');
    try {
      const success = await register(formData);
      if (success) {
        setRegistrationSuccess(true);
        setRegisteredEmail(formData.email);
        setVerificationSent(true);
      }
    } catch (err) {
      console.error('Registration error:', err);
      
      // Handle specific error messages from backend
      let errorMessage = 'Registration failed. Please try again.';
      if (err.response?.data) {
        const errorData = err.response.data;
        if (typeof errorData === 'object') {
          // Handle field-specific errors
          const fieldErrors = [];
          Object.keys(errorData).forEach(key => {
            if (Array.isArray(errorData[key])) {
              fieldErrors.push(`${key}: ${errorData[key].join(', ')}`);
            } else {
              fieldErrors.push(`${key}: ${errorData[key]}`);
            }
          });
          if (fieldErrors.length > 0) {
            errorMessage = fieldErrors.join('. ');
          }
        } else if (typeof errorData === 'string') {
          errorMessage = errorData;
        }
      }
      setRegisterError(errorMessage);
    }
  };
  
  // Registration success screen
  if (registrationSuccess) {
    return (
      <Container className="py-5">
        <Row className="justify-content-center">
          <Col md={8} lg={6}>
            <Card className="shadow-sm">
              <Card.Body className="p-5 text-center">
                <div className="success-icon mb-4">
                  <div className="check-circle">
                    ✓
                  </div>
                </div>
                
                <h2 className="text-success mb-4">Registration Successful!</h2>
                
                <div className="verification-info mb-4">
                  <h5 className="mb-3">Please Check Your Email</h5>
                  <p className="mb-2">
                    We've sent a verification email to:
                  </p>
                  <p className="email-display mb-3">{registeredEmail}</p>
                  <p className="text-muted">
                    Click the verification link in the email to activate your account.
                  </p>
                </div>
                
                <div className="next-steps mb-4">
                  <h6 className="mb-3">Next Steps:</h6>
                  <ol className="text-start steps-list">
                    <li>Check your inbox (and spam folder)</li>
                    <li>Click the verification link</li>
                    <li>Return to login once verified</li>
                  </ol>
                  <p className="text-muted small">
                    The verification link expires in 24 hours.
                  </p>
                </div>
                
                <div className="action-buttons d-grid gap-2">
                  <Link to="/resend-verification">
                    <Button variant="outline-primary" className="w-100">
                      Didn't Receive Email? Resend
                    </Button>
                  </Link>
                  <Link to="/login">
                    <Button variant="primary" className="w-100">
                      Go to Login Page
                    </Button>
                  </Link>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        <style jsx>{`
          .success-icon {
            margin-bottom: 2rem;
          }
          
          .check-circle {
            width: 80px;
            height: 80px;
            background: linear-gradient(135deg, #28a745, #20c997);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 2.5rem;
            font-weight: bold;
            margin: 0 auto;
            box-shadow: 0 10px 30px rgba(40, 167, 69, 0.3);
          }
          
          .email-display {
            background: #f8f9fa;
            padding: 12px 20px;
            border-radius: 8px;
            font-weight: 600;
            color: #495057;
            border: 2px solid #e9ecef;
          }
          
          .verification-info {
            background: #f8f9fa;
            border-radius: 12px;
            padding: 2rem;
            border: 1px solid #e9ecef;
          }
          
          .steps-list {
            max-width: 300px;
            margin: 0 auto;
          }
          
          .steps-list li {
            padding: 4px 0;
          }
          
          .next-steps {
            text-align: left;
            max-width: 400px;
            margin: 0 auto;
          }
          
          .next-steps h6 {
            text-align: center;
          }
          
          @media (max-width: 768px) {
            .verification-info {
              padding: 1.5rem;
            }
          }
        `}</style>
      </Container>
    );
  }
  
  return (
    <Container>
      <Row className="justify-content-center mt-5">
        <Col md={8} lg={6}>
          <Card className="shadow-sm">
            <Card.Body className="p-4">
              <div className="text-center mb-4">
                <h2>Create Your Account</h2>
                <p className="text-muted">Join our appointment booking platform</p>
              </div>
              
              {(registerError || error) && (
                <Alert variant="danger" onClose={() => setRegisterError('')} dismissible>
                  {registerError || error}
                </Alert>
              )}
              
              <Form noValidate validated={validated} onSubmit={handleSubmit}>
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Username *</Form.Label>
                      <Form.Control
                        type="text"
                        placeholder="Choose username"
                        name="username"
                        value={formData.username}
                        onChange={handleChange}
                        required
                        isInvalid={validated && !formData.username.trim()}
                      />
                      <Form.Control.Feedback type="invalid">
                        Username is required and cannot be empty.
                      </Form.Control.Feedback>
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Email Address *</Form.Label>
                      <Form.Control
                        type="email"
                        placeholder="Enter email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                        isInvalid={validated && (!formData.email.trim() || !formData.email.includes('@'))}
                      />
                      <Form.Control.Feedback type="invalid">
                        Please enter a valid email address.
                      </Form.Control.Feedback>
                    </Form.Group>
                  </Col>
                </Row>
                
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>First Name *</Form.Label>
                      <Form.Control
                        type="text"
                        placeholder="Enter first name"
                        name="first_name"
                        value={formData.first_name}
                        onChange={handleChange}
                        required
                        isInvalid={validated && !formData.first_name.trim()}
                      />
                      <Form.Control.Feedback type="invalid">
                        First name is required and cannot be empty.
                      </Form.Control.Feedback>
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Last Name *</Form.Label>
                      <Form.Control
                        type="text"
                        placeholder="Enter last name"
                        name="last_name"
                        value={formData.last_name}
                        onChange={handleChange}
                        required
                        isInvalid={validated && !formData.last_name.trim()}
                      />
                      <Form.Control.Feedback type="invalid">
                        Last name is required and cannot be empty.
                      </Form.Control.Feedback>
                    </Form.Group>
                  </Col>
                </Row>
                
                <Form.Group className="mb-3">
                  <Form.Label>Phone Number</Form.Label>
                  <Form.Control
                    type="tel"
                    placeholder="Enter phone number (optional)"
                    name="phone_number"
                    value={formData.phone_number}
                    onChange={handleChange}
                  />
                </Form.Group>
                
                <Form.Group className="mb-3">
                  <Form.Label>Account Type</Form.Label>
                  <Form.Select
                    name="user_type"
                    value={formData.user_type}
                    onChange={handleChange}
                    required
                  >
                    <option value="client">Client</option>
                    <option value="business">Business Owner</option>
                  </Form.Select>
                </Form.Group>
                
                <Row>
                  <Col md={6}>
                    <CleanPasswordInput
                      label="Password"
                      password={formData.password}
                      onPasswordChange={handlePasswordChange}
                      username={formData.username}
                      placeholder="Create a strong password"
                      required={true}
                      checkPasswordStrength={authService.checkPasswordStrength}
                      showRequirements={true}
                    />
                  </Col>
                  <Col md={6}>
                    <CleanPasswordInput
                      label="Confirm Password"
                      password={formData.password2}
                      onPasswordChange={handleConfirmPasswordChange}
                      placeholder="Confirm your password"
                      required={true}
                      showRequirements={false}
                    />
                    {formData.password2 && formData.password !== formData.password2 && (
                      <div className="text-danger small mt-1">
                        Passwords do not match.
                      </div>
                    )}
                  </Col>
                </Row>
                
                <div className="d-grid mt-4">
                  <Button variant="primary" type="submit" disabled={loading} size="lg">
                    {loading ? 'Creating Account...' : 'Create Account'}
                  </Button>
                </div>
              </Form>
              
              <div className="text-center mt-4">
                <p>
                  Already have an account?{' '}
                  <Link to="/login" className="text-decoration-none">Login</Link>
                </p>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default Register;