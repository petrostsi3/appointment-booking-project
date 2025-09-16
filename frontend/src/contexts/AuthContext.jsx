import React, { createContext, useState, useEffect, useCallback } from 'react';
import authService from '../services/auth';


export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userType, setUserType] = useState(null);
  const [error, setError] = useState(null);
  const initializeAuth = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (authService.isAuthenticated()) {
        const storedUser = authService.getCurrentUser(); 
        if (storedUser) {
          setUser(storedUser);
          const userTypeResponse = await authService.getUserType();
          setUserType(userTypeResponse.user_type);
        } else {
          try {
            const profileData = await authService.getUserProfile();
            setUser(profileData);
            const userTypeResponse = await authService.getUserType();
            setUserType(userTypeResponse.user_type);
          } catch (profileError) {
            authService.logout();
          }
        }
      }
    } catch (err) {
      console.error('Authentication initialization error:', err);
      setError('Failed to initialize authentication');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  const login = async (username, password) => {
    setLoading(true);
    setError(null); 
    try {
      await authService.login(username, password);      
      const userData = authService.getCurrentUser();
      setUser(userData);    
      const userTypeResponse = await authService.getUserType();
      setUserType(userTypeResponse.user_type);      
      setLoading(false);
      return true;
    } catch (err) {
      console.error('Login error:', err);
      setError(err.response?.data?.detail || 'Login failed. Please check your credentials.');
      setLoading(false);
      return false;
    }
  };

  const register = async (userData) => {
    setLoading(true);
    setError(null);  
    try {
      await authService.register(userData);
      setLoading(false);
      return true;
    } catch (err) {
      console.error('Registration error:', err);
      setError(err.response?.data?.detail || 'Registration failed. Please try again.');
      setLoading(false);
      return false;
    }
  };

  const logout = () => {
    authService.logout();
    setUser(null);
    setUserType(null);
  };

  const updateProfile = async (profileData) => {
    setLoading(true);
    setError(null);  
    try {
      console.log('AuthContext: Updating profile with data:', profileData);  
      const updatedProfile = await authService.updateProfile(profileData);
      console.log('AuthContext: Profile updated successfully:', updatedProfile); 
      setUser(updatedProfile);
      setLoading(false);
      return true;
    } catch (err) {
      console.error('AuthContext: Profile update error:', err);
      let errorMessage = 'Profile update failed. Please try again.';
      if (err.response?.data) {
        const errorData = err.response.data;
        if (typeof errorData === 'object') {
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
      } else if (err.message) {
        errorMessage = err.message;
      }
      setError(errorMessage);
      setLoading(false);
      throw new Error(errorMessage);
    }
  };

  const contextValue = {
    user,
    userType,
    loading,
    error,
    login,
    register,
    logout,
    updateProfile,
    isAuthenticated: !!user,
    isAdmin: userType === 'admin',
    isBusiness: userType === 'business',
    isClient: userType === 'client',
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = React.useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};