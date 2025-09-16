import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert, Spinner, Tabs, Tab, ProgressBar } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import authService from '../../services/auth';
import CleanPasswordInput from '../common/CleanPasswordInput';


const UserProfile = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone_number: '',
    username: ''});
  const [passwordForm, setPasswordForm] = useState({
    current_password: '',
    new_password: '',
    confirm_password: ''});
  const [loading, setLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [error, setError] = useState(null);
  const [passwordError, setPasswordError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [passwordSuccess, setPasswordSuccess] = useState(null);
  const [validated, setValidated] = useState(false);
  const [passwordValidated, setPasswordValidated] = useState(false);
  useEffect(() => {
    const getUserData = async () => {
      try {
        const userData = await authService.getUserProfile();
        setUser(userData);
        setFormData({
          first_name: userData.first_name || '',
          last_name: userData.last_name || '',
          email: userData.email || '',
          phone_number: userData.phone_number || '',
          username: userData.username || ''
        });
      } catch (err) {
        console.error('Error fetching user data:', err);
        setError('Failed to load profile data.');
      }
    };

    getUserData();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleCurrentPasswordChange = (e) => {
    setPasswordForm(prev => ({
      ...prev,
      current_password: e.target.value
    }));
  };

  const handleNewPasswordChange = (e) => {
    setPasswordForm(prev => ({
      ...prev,
      new_password: e.target.value
    }));
  };

  const handleConfirmPasswordChange = (e) => {
    setPasswordForm(prev => ({
      ...prev,
      confirm_password: e.target.value
    }));
  };

  const handleUpdateProfile = async () => {
    if (!formData.first_name || !formData.last_name || !formData.email || !formData.username) {
      setError('Please fill in all required fields.');
      return;
    }
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);
      await authService.updateProfile(formData);
      setSuccess('Profile updated successfully.');
      setLoading(false);
      setTimeout(() => {
        setSuccess(null);
      }, 3000); 
    } catch (err) {
      console.error('Error updating profile:', err);
      setError('Failed to update profile. Please try again.');
      setLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (!passwordForm.current_password || !passwordForm.new_password || !passwordForm.confirm_password) {
      setPasswordError('Please fill in all password fields.');
      return;
    }
    if (passwordForm.new_password !== passwordForm.confirm_password) {
      setPasswordError('New password and confirmation do not match.');
      return;
    }
    try {
      setPasswordLoading(true);
      setPasswordError(null);
      setPasswordSuccess(null);    
      await authService.changePassword({
        current_password: passwordForm.current_password,
        new_password: passwordForm.new_password,
        confirm_password: passwordForm.confirm_password
      });  
      setPasswordSuccess('Password changed successfully.');
      setPasswordForm({
        current_password: '',
        new_password: '',
        confirm_password: ''
      });
      setPasswordLoading(false);
      setTimeout(() => {
        setPasswordSuccess(null);
      }, 3000); 
    } catch (err) {
      console.error('Error changing password:', err);
      let errorMessage = 'Failed to change password. Please try again.';
      if (err.response?.data?.details) {
        const details = err.response.data.details;
        if (details.current_password) {
          errorMessage = Array.isArray(details.current_password) 
            ? details.current_password[0] 
            : details.current_password;
        } else if (details.new_password) {
          errorMessage = Array.isArray(details.new_password) 
            ? details.new_password.join(' ') 
            : details.new_password;
        } else if (details.confirm_password) {
          errorMessage = Array.isArray(details.confirm_password)
            ? details.confirm_password[0]
            : details.confirm_password;
        } else {
          errorMessage = err.response.data.error || errorMessage;
        }
      } else if (err.response?.data?.error) {
        errorMessage = err.response.data.error;
      }
      setPasswordError(errorMessage);
      setPasswordLoading(false);
    }
  };
  
  if (!user) {
    return (
      <Container className="py-5 text-center">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
      </Container>
    );
  }

  return (
    <Container className="py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>My Profile</h1>
        <Button variant="outline-secondary" onClick={() => navigate('/')}>
          Back to Home
        </Button>
      </div>

      <Row className="justify-content-center">
        <Col md={10} lg={8}>
          <Card className="shadow-sm">
            <Card.Header>
              <h5 className="mb-0">Account Settings</h5>
            </Card.Header>
            <Card.Body>
              <Tabs defaultActiveKey="profile" className="mb-4">
                {/* PROFILE INFO TAB */}
                <Tab eventKey="profile" title="Profile Information">
                  {error && (
                    <Alert variant="danger" onClose={() => setError(null)} dismissible>
                      {error}
                    </Alert>
                  )}
                  
                  {success && (
                    <Alert variant="success" onClose={() => setSuccess(null)} dismissible>
                      {success}
                    </Alert>
                  )}

                  <Form noValidate validated={validated}>
                    <Row>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>First Name *</Form.Label>
                          <Form.Control
                            type="text"
                            name="first_name"
                            value={formData.first_name}
                            onChange={handleChange}
                            required
                            placeholder="Enter your first name"
                          />
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Last Name *</Form.Label>
                          <Form.Control
                            type="text"
                            name="last_name"
                            value={formData.last_name}
                            onChange={handleChange}
                            required
                            placeholder="Enter your last name"
                          />
                        </Form.Group>
                      </Col>
                    </Row>

                    <Form.Group className="mb-3">
                      <Form.Label>Username *</Form.Label>
                      <Form.Control
                        type="text"
                        name="username"
                        value={formData.username}
                        onChange={handleChange}
                        required
                        placeholder="Enter your username"
                      />
                      <Form.Text className="text-muted">
                        Your username is used for login and must be unique.
                      </Form.Text>
                    </Form.Group>

                    <Form.Group className="mb-3">
                      <Form.Label>Email Address *</Form.Label>
                      <Form.Control
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                        placeholder="Enter your email address"
                      />
                    </Form.Group>

                    <Form.Group className="mb-4">
                      <Form.Label>Phone Number</Form.Label>
                      <Form.Control
                        type="tel"
                        name="phone_number"
                        value={formData.phone_number}
                        onChange={handleChange}
                        placeholder="Enter your phone number"
                      />
                    </Form.Group>

                    <div className="d-grid gap-2">
                      <Button
                        variant="primary"
                        onClick={handleUpdateProfile}
                        disabled={loading}
                        size="lg"
                      >
                        {loading ? 'Updating...' : 'Update Profile'}
                      </Button>
                    </div>
                  </Form>
                </Tab>

                {/* PASSWORD CHANGE TAB */}
                <Tab eventKey="password" title="Change Password">
                  {passwordError && (
                    <Alert variant="danger" onClose={() => setPasswordError(null)} dismissible>
                      {passwordError}
                    </Alert>
                  )}
                  
                  {passwordSuccess && (
                    <Alert variant="success" onClose={() => setPasswordSuccess(null)} dismissible>
                      {passwordSuccess}
                    </Alert>
                  )}

                  <Form noValidate validated={passwordValidated}>
                    <CleanPasswordInput
                      label="Current Password"
                      password={passwordForm.current_password}
                      onPasswordChange={handleCurrentPasswordChange}
                      placeholder="Enter your current password"
                      required={true}
                      showRequirements={false}
                    />

                    <CleanPasswordInput
                      label="New Password"
                      password={passwordForm.new_password}
                      onPasswordChange={handleNewPasswordChange}
                      username={user?.username || ''}
                      placeholder="Enter your new password"
                      required={true}
                      checkPasswordStrength={authService.checkPasswordStrength}
                      showRequirements={true}
                    />

                    <CleanPasswordInput
                      label="Confirm New Password"
                      password={passwordForm.confirm_password}
                      onPasswordChange={handleConfirmPasswordChange}
                      placeholder="Confirm your new password"
                      required={true}
                      showRequirements={false}
                    />

                    {passwordForm.confirm_password && passwordForm.new_password !== passwordForm.confirm_password && (
                      <Alert variant="danger" className="mt-2">
                        Passwords do not match.
                      </Alert>
                    )}

                    <div className="d-grid gap-2 mt-4">
                      <Button
                        variant="primary"
                        onClick={handleChangePassword}
                        disabled={passwordLoading}
                        size="lg"
                      >
                        {passwordLoading ? 'Changing Password...' : 'Change Password'}
                      </Button>
                    </div>
                  </Form>

                  <div className="mt-4 p-3 bg-light rounded">
                    <small className="text-muted">
                      <strong>Security Note:</strong> After changing your password, you may need to log in again on other devices for security reasons.
                    </small>
                  </div>
                </Tab>
              </Tabs>

              <hr className="my-4" />

              <div className="text-center">
                <h6 className="text-muted mb-3">Account Information</h6>
                <div className="row">
                  <div className="col-md-6">
                    <p className="mb-2">
                      <strong>Account Type:</strong><br />
                      <span className="text-capitalize">{user?.user_type || 'Client'}</span>
                    </p>
                  </div>
                  <div className="col-md-6">
                    <p className="mb-2">
                      <strong>Member Since:</strong><br />
                      {user?.date_joined ? new Date(user.date_joined).toLocaleDateString() : 'N/A'}
                    </p>
                  </div>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default UserProfile;