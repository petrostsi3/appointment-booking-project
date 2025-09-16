import axios from 'axios';

const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';
console.log('API Base URL:', BASE_URL);

// Create axios instance
const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for adding the auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    console.log('=== REQUEST DEBUG ===');
    console.log('Making request to:', config.url);
    console.log('Full URL:', config.baseURL + config.url);
    console.log('Method:', config.method);
    console.log('Token exists:', !!token); 
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
      console.log('Authorization header set');
    } else {
      console.log('No token found - request will be unauthenticated');
    }
    return config;
  },
  (error) => {
    console.error('Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for handling token expiration and refresh
apiClient.interceptors.response.use(
  (response) => {
    console.log('=== RESPONSE DEBUG ===');
    console.log('Response status:', response.status);
    console.log('Response URL:', response.config.url);
    return response;
  },
  async (error) => {
    console.log('=== RESPONSE ERROR DEBUG ===');
    console.log('Error status:', error.response?.status);
    console.log('Error URL:', error.config?.url);
    console.log('Error data:', error.response?.data);
    const originalRequest = error.config;
    
    // Only try to refresh token for 401 errors on protected endpoints
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      console.log('=== TOKEN REFRESH ATTEMPT ===');
      const refreshToken = localStorage.getItem('refreshToken');
      if (!refreshToken) {
        console.log('No refresh token available - logging out');
        logout();
        return Promise.reject(error);
      }
      try {
        console.log('Attempting to refresh token...');
        
        // Use a new axios instance to avoid interceptor loops
        const refreshResponse = await axios.post(`${BASE_URL}/api/token/refresh/`, {
          refresh: refreshToken,
        });
        console.log('Token refresh successful');
        const newAccessToken = refreshResponse.data.access;
        localStorage.setItem('token', newAccessToken);
        // Update the failed request with new token
        originalRequest.headers['Authorization'] = `Bearer ${newAccessToken}`;
        console.log('Retrying original request with new token');
        return apiClient(originalRequest);
      } catch (refreshError) {
        console.error('Token refresh failed:', refreshError);
        console.log('Logging out user');
        logout();
        return Promise.reject(refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);

const logout = () => {
  console.log('Performing logout - clearing tokens');
  localStorage.removeItem('token');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('user');
  window.location.href = '/login';
};

export default apiClient;