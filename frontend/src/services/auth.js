import apiClient from './api';


const AUTH_ENDPOINTS = {
  LOGIN: '/api/token/',
  REGISTER: '/api/accounts/register/',
  PROFILE: '/api/accounts/profile/',
  USER_TYPE: '/api/accounts/user-type/',
  CHANGE_PASSWORD: '/api/accounts/change-password/',
  // FIX: Password reset endpoints
  PASSWORD_RESET_REQUEST: '/api/accounts/password-reset/',
  PASSWORD_RESET_CONFIRM: '/api/accounts/password-reset-confirm/',
  PASSWORD_STRENGTH: '/api/accounts/password-strength/',
};

const authService = {
  // FIX: Request password reset
  requestPasswordReset: async (email) => {
    try {
      console.log('AUTH SERVICE: Requesting password reset for:', email);
      const response = await apiClient.post(AUTH_ENDPOINTS.PASSWORD_RESET_REQUEST, {
        email: email
      });
      console.log('AUTH SERVICE: Password reset request successful');
      return response.data;
    } catch (error) {
      console.error('AUTH SERVICE: Password reset request error:', error);
      throw error;
    }
  },

  // FIX: Confirm password reset with token
  confirmPasswordReset: async (token, newPassword, confirmPassword) => {
    try {
      console.log('AUTH SERVICE: Confirming password reset...');
      const response = await apiClient.post(AUTH_ENDPOINTS.PASSWORD_RESET_CONFIRM, {
        token: token,
        new_password: newPassword,
        confirm_password: confirmPassword
      });
      console.log('AUTH SERVICE: Password reset confirmed successfully');
      return response.data;
    } catch (error) {
      console.error('AUTH SERVICE: Password reset confirmation error:', error);
      throw error;
    }
  },

  // FIX: Check password strength for real-time validation
  checkPasswordStrength: async (password, username = '') => {
    try {
      const response = await apiClient.post(AUTH_ENDPOINTS.PASSWORD_STRENGTH, {
        password: password,
        username: username
      });
      return response.data;
    } catch (error) {
      console.error('AUTH SERVICE: Password strength check error:', error);
      throw error;
    }
  },

  verifyEmail: async (token) => {
    try {
      console.log('AUTH SERVICE: Verifying email with token...');
      const response = await apiClient.post('/api/accounts/verify-email/', {
        token: token
      });
      console.log('AUTH SERVICE: Email verification successful');
      return response.data;
    } catch (error) {
      console.error('AUTH SERVICE: Email verification error:', error);
      throw error;
    }
  },

  resendVerificationEmail: async (email) => {
    try {
      console.log('AUTH SERVICE: Resending verification email...');
      const response = await apiClient.post('/api/accounts/resend-verification/', {
        email: email
      });
      console.log('AUTH SERVICE: Verification email resent successfully');
      return response.data;
    } catch (error) {
      console.error('AUTH SERVICE: Resend verification email error:', error);
      throw error;
    }
  },

  checkVerificationStatus: async (email) => {
    try {
      console.log('AUTH SERVICE: Checking verification status...');
      const response = await apiClient.post('/api/accounts/check-verification/', {
        email: email
      });
      return response.data;
    } catch (error) {
      console.error('AUTH SERVICE: Check verification status error:', error);
      throw error;
    }
  },

  login: async (username, password) => {
    try {
      console.log('=== LOGIN ATTEMPT ===');
      console.log('Username:', username);
      const response = await apiClient.post('/api/token/', {
        username,
        password,
      });
      console.log('Login response:', response.data);
      if (response.data.access && response.data.refresh) {
        localStorage.setItem('token', response.data.access);
        localStorage.setItem('refreshToken', response.data.refresh);
        console.log('Tokens stored, fetching user profile...');
        await authService.getUserProfile();
        console.log('Login completed successfully');
        return response.data;
      } else {
        throw new Error('No tokens received from login');
      }
    } catch (error) {
      console.error('Login error:', error);

      if (error.response?.status === 400 && 
          error.response?.data?.detail?.includes('inactive')) {
        throw {
          ...error,
          isUnverified: true,
          message: 'Your account is not verified. Please check your email and verify your account.'
        };
      }
      throw error;
    }
  },
  
  register: async (userData) => {
    try {
      console.log('=== REGISTRATION ATTEMPT ===');
      const response = await apiClient.post(AUTH_ENDPOINTS.REGISTER, userData);
      console.log('Registration successful');
      return response.data;
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  },
  
  getUserProfile: async () => {
    try {
      console.log('=== FETCHING USER PROFILE ===');
      const response = await apiClient.get(AUTH_ENDPOINTS.PROFILE);
      console.log('User profile response:', response.data);
      localStorage.setItem('user', JSON.stringify(response.data));
      return response.data;
    } catch (error) {
      console.error('Get profile error:', error);
      throw error;
    }
  },
  
  getUserType: async () => {
    try {
      const response = await apiClient.get(AUTH_ENDPOINTS.USER_TYPE);
      return response.data;
    } catch (error) {
      console.error('Get user type error:', error);
      throw error;
    }
  },
  
  updateProfile: async (profileData) => {
    try {
      console.log('AUTH SERVICE: Updating profile with:', profileData);
      const response = await apiClient.patch('/api/accounts/profile/', profileData);
      console.log('AUTH SERVICE: Response:', response.data);
      localStorage.setItem('user', JSON.stringify(response.data));    
      return response.data;
    } catch (error) {
      console.error('AUTH SERVICE: Update profile error:', error);
      throw error;
    }
  },

  // FIX: Enhanced change password with better validation
  changePassword: async (passwordData) => {
    try {
      console.log('AUTH SERVICE: Changing password...');
      const response = await apiClient.post(AUTH_ENDPOINTS.CHANGE_PASSWORD, {
        current_password: passwordData.current_password,
        new_password: passwordData.new_password,
        confirm_password: passwordData.confirm_password
      });
      console.log('AUTH SERVICE: Password changed successfully');
      return response.data;
    } catch (error) {
      console.error('AUTH SERVICE: Change password error:', error);
      throw error;
    }
  },
  
  logout: () => {
    console.log('Auth service logout called');
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
  },
  
  getCurrentUser: () => {
    const userStr = localStorage.getItem('user');
    if (!userStr) return null;
    try {
      return JSON.parse(userStr);
    } catch (e) {
      console.error('Error parsing user data:', e);
      return null;
    }
  },
  
  isAuthenticated: () => {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    return !!(token && user);
  },
};

export default authService;