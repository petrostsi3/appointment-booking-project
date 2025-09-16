import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Spinner } from 'react-bootstrap';


const PrivateRoute = ({ component: Component, allowedUserTypes = [], redirectTo = '/login' }) => {
  const { isAuthenticated, userType, loading } = useAuth();
  const location = useLocation();
  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '70vh' }}>
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
      </div>
    );
  }
  if (!isAuthenticated) {
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }
  if (allowedUserTypes.length === 0 || allowedUserTypes.includes(userType)) {
    return <Component />;
  }
  let unauthorizedRedirect = '/';  
  if (userType === 'client') {
    unauthorizedRedirect = '/';
  } else if (userType === 'business') {
    unauthorizedRedirect = '/business/dashboard';
  } else if (userType === 'admin') {
    unauthorizedRedirect = '/admin/dashboard';
  } 
  return <Navigate to={unauthorizedRedirect} replace />;
};

export default PrivateRoute;