import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Navbar, Container, Nav, NavDropdown, Badge } from 'react-bootstrap';
import { useAuth } from '../../contexts/AuthContext';


const Header = () => {
  const { user, userType, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <Navbar bg="dark" variant="dark" expand="lg" className="shadow-sm" fixed={false}>
      <Container>
        <Navbar.Brand as={Link} to="/" className="fw-bold">
          <span className="d-none d-sm-inline">Appointment Booking</span>
          <span className="d-inline d-sm-none">AppBook</span>
        </Navbar.Brand>
        
        <Navbar.Toggle 
          aria-controls="basic-navbar-nav" 
          className="border-0"
          style={{ padding: '4px 8px' }}
        >
          <span className="navbar-toggler-icon"></span>
        </Navbar.Toggle>
        
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="me-auto">
            <Nav.Link as={Link} to="/" className="nav-link-custom">
              <i className="fas fa-home d-lg-none me-2"></i>
              Home
            </Nav.Link>
            <Nav.Link as={Link} to="/businesses" className="nav-link-custom">
              <i className="fas fa-building d-lg-none me-2"></i>
              Browse
            </Nav.Link>
            
            {isAuthenticated && (
              <>
                {userType === 'client' && (
                  <Nav.Link as={Link} to="/my-appointments" className="nav-link-custom">
                    <i className="fas fa-calendar-alt d-lg-none me-2"></i>
                    My Appointments
                  </Nav.Link>
                )}
                
                {userType === 'business' && (
                  <>
                    <Nav.Link as={Link} to="/business/dashboard" className="nav-link-custom">
                      <i className="fas fa-tachometer-alt d-lg-none me-2"></i>
                      Dashboard
                    </Nav.Link>
                    <Nav.Link as={Link} to="/business/appointments" className="nav-link-custom">
                      <i className="fas fa-calendar-check d-lg-none me-2"></i>
                      <span className="d-none d-lg-inline">Appointments</span>
                      <span className="d-inline d-lg-none">Bookings</span>
                    </Nav.Link>
                  </>
                )}
                
                {userType === 'admin' && (
                  <Nav.Link as={Link} to="/admin/dashboard" className="nav-link-custom">
                    <i className="fas fa-user-shield d-lg-none me-2"></i>
                    Admin
                  </Nav.Link>
                )}
              </>
            )}
          </Nav>
          
          <Nav>
            {isAuthenticated ? (
              <NavDropdown 
                title={
                  <span className="d-flex align-items-center">
                    <i className="fas fa-user-circle me-2 d-lg-none"></i>
                    <span className="d-none d-lg-inline">{user?.first_name || user?.username || 'Account'}</span>
                    <span className="d-inline d-lg-none">Account</span>
                    {userType && (
                      <Badge 
                        bg={userType === 'admin' ? 'danger' : userType === 'business' ? 'primary' : 'success'} 
                        className="ms-2 d-none d-lg-inline"
                        style={{ fontSize: '0.7rem' }}
                      >
                        {userType === 'admin' ? 'Admin' : userType === 'business' ? 'Business' : 'Client'}
                      </Badge>
                    )}
                  </span>
                } 
                id="user-dropdown"
                align="end"
                className="user-dropdown-custom"
              >
                {/* Profile Section */}
                <NavDropdown.Header className="d-lg-none">
                  <div className="d-flex align-items-center">
                    <i className="fas fa-user-circle me-2" style={{ fontSize: '1.5rem' }}></i>
                    <div>
                      <div className="fw-bold">{user?.first_name} {user?.last_name}</div>
                      <small className="text-muted">{user?.email}</small>
                    </div>
                  </div>
                </NavDropdown.Header>
                
                <NavDropdown.Item as={Link} to="/profile">
                  <i className="fas fa-user me-2"></i>
                  Profile Settings
                </NavDropdown.Item>
                
                {userType === 'business' && (
                  <>
                    <NavDropdown.Divider />
                    <NavDropdown.Header>Business</NavDropdown.Header>
                    <NavDropdown.Item as={Link} to="/business/profile">
                      <i className="fas fa-store me-2"></i>
                      Business Profile
                    </NavDropdown.Item>
                    <NavDropdown.Item as={Link} to="/business/services">
                      <i className="fas fa-concierge-bell me-2"></i>
                      Services
                    </NavDropdown.Item>
                    <NavDropdown.Item as={Link} to="/business/hours">
                      <i className="fas fa-clock me-2"></i>
                      Business Hours
                    </NavDropdown.Item>
                    <NavDropdown.Item as={Link} to="/business/create-appointment">
                      <i className="fas fa-plus me-2"></i>
                      Walk-in Appointment
                    </NavDropdown.Item>
                  </>
                )}
                
                {userType === 'admin' && (
                  <>
                    <NavDropdown.Divider />
                    <NavDropdown.Header>Administration</NavDropdown.Header>
                    <NavDropdown.Item as={Link} to="/admin/users">
                      <i className="fas fa-users me-2"></i>
                      Manage Users
                    </NavDropdown.Item>
                    <NavDropdown.Item as={Link} to="/admin/businesses">
                      <i className="fas fa-building me-2"></i>
                      Manage Businesses
                    </NavDropdown.Item>
                  </>
                )}
                
                <NavDropdown.Divider />
                <NavDropdown.Item onClick={handleLogout} className="text-danger">
                  <i className="fas fa-sign-out-alt me-2"></i>
                  Logout
                </NavDropdown.Item>
              </NavDropdown>
            ) : (
              <div className="d-flex flex-column flex-lg-row">
                <Nav.Link as={Link} to="/login" className="nav-link-custom">
                  <i className="fas fa-sign-in-alt d-lg-none me-2"></i>
                  Login
                </Nav.Link>
                <Nav.Link as={Link} to="/register" className="nav-link-custom">
                  <i className="fas fa-user-plus d-lg-none me-2"></i>
                  Register
                </Nav.Link>
              </div>
            )}
          </Nav>
        </Navbar.Collapse>
      </Container>

      <style jsx>{`
        .navbar {
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(10px);
          position: relative;
          z-index: 1030;
        }

        .navbar-brand {
          font-size: 1.4rem;
          letter-spacing: -0.5px;
        }

        .nav-link-custom {
          padding: 0.75rem 1rem !important;
          border-radius: 8px;
          margin: 2px 4px;
          transition: all 0.2s ease;
        }

        .nav-link-custom:hover {
          background-color: rgba(255, 255, 255, 0.1);
          transform: translateY(-1px);
        }

        .navbar-toggler {
          border: none;
          padding: 4px 8px;
        }

        .navbar-toggler:focus {
          box-shadow: none;
        }

        .navbar-nav .nav-link {
          font-weight: 500;
        }

        /* FIX: Dropdown positioning */
        .user-dropdown-custom .dropdown-menu {
          border: none;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
          border-radius: 12px;
          padding: 8px;
          margin-top: 8px;
          position: absolute;
          top: 100%;
          right: 0;
          left: auto;
          z-index: 1050;
          min-width: 250px;
          max-width: 300px;
        }

        .dropdown-item {
          border-radius: 8px;
          padding: 12px 16px;
          margin: 2px 0;
          transition: all 0.2s ease;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .dropdown-item:hover {
          background-color: #f8f9fa;
          transform: translateX(4px);
        }

        .dropdown-header {
          font-weight: 600;
          color: #495057;
          padding: 12px 16px 8px;
          font-size: 0.875rem;
        }

        .dropdown-divider {
          margin: 8px 0;
        }

        /* FIX: Mobile dropdown positioning */
        @media (max-width: 991.98px) {
          .navbar-nav {
            margin-top: 1rem;
            padding-top: 1rem;
            border-top: 1px solid rgba(255, 255, 255, 0.1);
          }

          .nav-link-custom {
            padding: 12px 16px !important;
            margin: 2px 0;
            border-bottom: 1px solid rgba(255, 255, 255, 0.05);
          }

          .user-dropdown-custom .dropdown-menu {
            background-color: #495057;
            margin-top: 0;
            box-shadow: none;
            border-radius: 0;
            position: static;
            float: none;
            width: 100%;
            max-width: none;
          }

          .dropdown-item {
            color: rgba(255, 255, 255, 0.9);
            border-bottom: 1px solid rgba(255, 255, 255, 0.05);
          }

          .dropdown-item:hover {
            background-color: rgba(255, 255, 255, 0.1);
            color: white;
            transform: none;
          }

          .dropdown-header {
            color: rgba(255, 255, 255, 0.7);
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
          }
        }

        .navbar-nav .dropdown {
          position: static;
        }

        @media (min-width: 992px) {
          .navbar-nav .dropdown {
            position: relative;
          }
        }
      `}</style>
    </Navbar>
  );
};

export default Header;