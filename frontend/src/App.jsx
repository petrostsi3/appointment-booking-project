import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
// Layout components
import Header from './components/layout/Header';
import Footer from './components/layout/Footer';
// Auth components
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import EmailVerification from './components/auth/EmailVerification';
import ResendVerification from './components/auth/ResendVerification';
import ForgotPassword from './components/auth/ForgotPassword';  
import ResetPassword from './components/auth/ResetPassword';    
// Common components
import PrivateRoute from './components/common/PrivateRoute';
// Client components
import HomeScreen from './components/client/HomeScreen';
import BusinessList from './components/client/BusinessList';
import BusinessDetail from './components/client/BusinessDetail';
import BookAppointment from './components/client/BookAppointment';
import ClientAppointments from './components/client/AppointmentList';
import UserProfile from './components/client/UserProfile';
// Business components
import BusinessDashboard from './components/business/BusinessDashboard';
import BusinessProfile from './components/business/BusinessProfile';
import ServiceManagement from './components/business/ServiceManagement';
import BusinessHoursManagement from './components/business/BusinessHours';
import BusinessAppointments from './components/business/AppointmentCalendar';
import CreateAppointment from './components/business/CreateAppointment';
// Admin components
import AdminDashboard from './components/admin/AdminDashboard';
import UserManagement from './components/admin/UserManagement';
import BusinessManagement from './components/admin/BusinessManagement';
// Import bootstrap CSS
import 'bootstrap/dist/css/bootstrap.min.css';
import './styles/global.css';


const App = () => {
  return (
    <AuthProvider>
      <Router>
        <div className="d-flex flex-column min-vh-100">
          <Header />
          <main className="flex-grow-1">
            <Routes>
              {/* Public routes */}
              <Route path="/" element={<HomeScreen />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              
              {/* Email verification routes */}
              <Route path="/verify-email" element={<EmailVerification />} />
              <Route path="/resend-verification" element={<ResendVerification />} />
              
              {/* NEW : Password reset routes */}
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/businesses" element={<BusinessList />} />
              <Route path="/businesses/:id" element={<BusinessDetail />} />
              
              {/* Client routes */}
              <Route 
                path="/book/:businessId/:serviceId" 
                element={
                  <PrivateRoute 
                    component={BookAppointment} 
                    allowedUserTypes={['client', 'admin']}
                  />
                } 
              />
              <Route 
                path="/my-appointments" 
                element={
                  <PrivateRoute 
                    component={ClientAppointments} 
                    allowedUserTypes={['client', 'admin']}
                  />
                } 
              />
              <Route 
                path="/profile" 
                element={
                  <PrivateRoute 
                    component={UserProfile} 
                    allowedUserTypes={['client', 'business', 'admin']}
                  />
                } 
              />
              
              {/* Business routes */}
              <Route 
                path="/business/dashboard" 
                element={
                  <PrivateRoute 
                    component={BusinessDashboard} 
                    allowedUserTypes={['business', 'admin']}
                  />
                } 
              />
              <Route 
                path="/business/profile" 
                element={
                  <PrivateRoute 
                    component={BusinessProfile} 
                    allowedUserTypes={['business', 'admin']}
                  />
                } 
              />
              <Route 
                path="/business/create-appointment" 
                element={
                  <PrivateRoute 
                    component={CreateAppointment} 
                    allowedUserTypes={['business', 'admin']}
                  />
                }
              />
              <Route 
                path="/business/services" 
                element={
                  <PrivateRoute 
                    component={ServiceManagement} 
                    allowedUserTypes={['business', 'admin']}
                  />
                } 
              />
              <Route 
                path="/business/hours" 
                element={
                  <PrivateRoute 
                    component={BusinessHoursManagement} 
                    allowedUserTypes={['business', 'admin']}
                  />
                } 
              />
              <Route 
                path="/business/appointments" 
                element={
                  <PrivateRoute 
                    component={BusinessAppointments} 
                    allowedUserTypes={['business', 'admin']}
                  />
                } 
              />
              
              {/* Admin routes */}
              <Route 
                path="/admin/dashboard" 
                element={
                  <PrivateRoute 
                    component={AdminDashboard} 
                    allowedUserTypes={['admin']}
                  />
                } 
              />
              <Route 
                path="/admin/users" 
                element={
                  <PrivateRoute 
                    component={UserManagement} 
                    allowedUserTypes={['admin']}
                  />
                } 
              />
              <Route 
                path="/admin/businesses" 
                element={
                  <PrivateRoute 
                    component={BusinessManagement} 
                    allowedUserTypes={['admin']}
                  />
                } 
              />
              
              {/* Catch-all redirect */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </Router>
    </AuthProvider>
  );
};

export default App;