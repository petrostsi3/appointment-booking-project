import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Alert, Spinner, Badge, Modal } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { FaCalendarAlt, FaUserClock, FaCog, FaList, FaPlus, FaBuilding, FaEllipsisV, FaEdit, FaTrash, FaEye } from 'react-icons/fa';
import businessService from '../../services/businesses';
import appointmentService from '../../services/appointments';
import moment from 'moment';


const BusinessDashboard = () => {
  const [businesses, setBusinesses] = useState([]);
  const [appointments, setAppointments] = useState({
    all: [],
    today: [],
    upcoming: [],
    thisWeek: []});
  const [selectedBusiness, setSelectedBusiness] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showBusinessModal, setShowBusinessModal] = useState(false);
  const [openDropdownId, setOpenDropdownId] = useState(null);
  const navigate = useNavigate();
  const handleDropdownToggle = (businessId, event) => {
    event.stopPropagation();
    if (openDropdownId === businessId) {
      // If clicking the same dropdown, close it
      setOpenDropdownId(null);
    } else {
      // If clicking a different dropdown, open it and close others
      setOpenDropdownId(businessId);
    }
  };

  // FIX 11/08/2025: Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.business-dropdown-container')) {
        setOpenDropdownId(null);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, []);
  useEffect(() => {
    const fetchBusinesses = async () => {
      try {
        setLoading(true);
        setError(null);
        console.log('=== BUSINESS PROFILE: LOADING ===');
        const userBusinesses = await businessService.getMyBusinesses();
        console.log('User businesses:', userBusinesses);
        setBusinesses(userBusinesses);
        if (userBusinesses.length > 0) {
          setSelectedBusiness(userBusinesses[0]);
        }
        setLoading(false);
      } catch (err) {
        console.error('Error fetching businesses:', err);
        setError('Failed to load businesses. Please try again later.');
        setLoading(false);
      }
    };
    
    fetchBusinesses();
  }, []);

  useEffect(() => {
    if (!selectedBusiness) return;

    const fetchAppointments = async () => {
      try {
        const today = moment().format('YYYY-MM-DD');
        const startOfWeek = moment().startOf('week').format('YYYY-MM-DD');
        const endOfWeek = moment().endOf('week').format('YYYY-MM-DD');
        const appointmentsData = await appointmentService.getMyAppointments();
        const allAppointments = [...appointmentsData.upcoming, ...appointmentsData.past];
        const businessAppointments = allAppointments.filter(appt => {
          return appt.business === selectedBusiness.id || 
                 (appt.business_details && appt.business_details.id === selectedBusiness.id);
        });
        const todayAppointments = businessAppointments.filter(
          appt => appt.date === today
        );
        const upcomingAppointments = businessAppointments.filter(
          appt => moment(appt.date).isAfter(today)
        );
        const thisWeekAppointments = businessAppointments.filter(
          appt => moment(appt.date).isBetween(startOfWeek, endOfWeek, 'day', '[]')
        );
        setAppointments({
          all: businessAppointments,
          today: todayAppointments,
          upcoming: upcomingAppointments,
          thisWeek: thisWeekAppointments
        });
      } catch (err) {
        console.error('Error fetching appointments:', err);
      }
    };

    fetchAppointments();
  }, [selectedBusiness]);

  const handleSelectBusiness = (business) => {
    setSelectedBusiness(business);
    setOpenDropdownId(null);
  };

  const handleDeleteBusiness = async (businessToDelete) => {
    if (!window.confirm(`Are you sure you want to delete "${businessToDelete.name}"? This action cannot be undone and will also delete all associated appointments.`)) {
      return;
    }
    try {
      setLoading(true);
      await businessService.deleteBusiness(businessToDelete.id);
      
      const updatedBusinesses = businesses.filter(b => b.id !== businessToDelete.id);
      setBusinesses(updatedBusinesses);
      
      if (selectedBusiness && selectedBusiness.id === businessToDelete.id) {
        setSelectedBusiness(updatedBusinesses.length > 0 ? updatedBusinesses[0] : null);
      }
      
      setLoading(false);
      setOpenDropdownId(null); // Close dropdown after action
    } catch (err) {
      console.error('Error deleting business:', err);
      setError('Failed to delete business. Please try again.');
      setLoading(false);
    }
  };

  // FIX 11/08/2025: Business card component with proper dropdown state management
  const BusinessCard = ({ business, isSelected, onSelect, onEdit, onDelete }) => {
    const isDropdownOpen = openDropdownId === business.id;
    const isAnyDropdownOpen = openDropdownId !== null;
    const shouldHideButton = isAnyDropdownOpen && !isDropdownOpen;
    return (
      <Card className={`mb-3 business-card-item ${isSelected ? 'border-primary' : ''}`}>
        <Card.Body>
          <div className="d-flex justify-content-between align-items-start">
            <div 
              onClick={() => onSelect(business)} 
              className="flex-grow-1" 
              style={{ cursor: 'pointer' }}
            >
              <Card.Title className="mb-2">{business.name}</Card.Title>
              <Card.Text className="text-muted small mb-2">
                {business.description || 'No description'}
              </Card.Text>
              <div className="d-flex gap-2">
                <Badge bg="info">{business.services?.length || 0} services</Badge>
                {isSelected && <Badge bg="primary">Selected</Badge>}
              </div>
            </div>
            
            {/* FIX 11/08/2025: Custom dropdown with state management and conditional visibility */}
            <div className="business-dropdown-container">
              <button
                type="button"
                className={`business-dropdown-toggle ${shouldHideButton ? 'hidden' : ''}`}
                onClick={(e) => handleDropdownToggle(business.id, e)}
                aria-expanded={isDropdownOpen}
                aria-haspopup="true"
              >
                <FaEllipsisV />
              </button>
              
              {/* FIX 11/08/2025: Conditional dropdown menu */}
              {isDropdownOpen && (
                <div className="business-dropdown-menu">
                  <button
                    type="button"
                    className="dropdown-item-custom"
                    onClick={(e) => {
                      e.stopPropagation();
                      setOpenDropdownId(null);
                      onEdit(business);
                    }}
                  >
                    <FaEdit className="me-2" />
                    Edit Details
                  </button>
                  
                  <button
                    type="button"
                    className="dropdown-item-custom"
                    onClick={(e) => {
                      e.stopPropagation();
                      setOpenDropdownId(null);
                      navigate(`/business/services?business=${business.id}`);
                    }}
                  >
                    <FaList className="me-2" />
                    Manage Services
                  </button>
                  
                  <button
                    type="button"
                    className="dropdown-item-custom"
                    onClick={(e) => {
                      e.stopPropagation();
                      setOpenDropdownId(null);
                      navigate(`/business/hours?business=${business.id}`);
                    }}
                  >
                    <FaUserClock className="me-2" />
                    Business Hours
                  </button>
                  
                  <div className="dropdown-divider"></div>
                  
                  <button
                    type="button"
                    className="dropdown-item-custom text-danger"
                    onClick={(e) => {
                      e.stopPropagation();
                      setOpenDropdownId(null);
                      onDelete(business);
                    }}
                  >
                    <FaTrash className="me-2" />
                    Delete Business
                  </button>
                </div>
              )}
            </div>
          </div>
        </Card.Body>
      </Card>
    );
  };

  const renderAppointmentItem = (appointment) => (
    <div key={appointment.id} className="appointment-item p-2 border-bottom">
      <div className="d-flex justify-content-between">
        <div>
          <strong>
            {appointment.client_details?.first_name} {appointment.client_details?.last_name}
          </strong><br />
          <small>{appointment.service_details?.name}</small><br />
          <small className="text-muted">
            {moment(appointment.date).format('MMM D')} at {appointment.start_time}
          </small>
        </div>
        <div className="text-end">
          <span className={`badge bg-${
            appointment.status === 'confirmed' ? 'success' :
            appointment.status === 'pending' ? 'warning' :
            appointment.status === 'cancelled' ? 'danger' : 'info'
          }`}>
            {appointment.status_display}
          </span>
        </div>
      </div>
    </div>
  );

  if (loading && businesses.length === 0) {
    return (
      <Container className="py-5 text-center">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
      </Container>
    );
  }

  if (businesses.length === 0) {
    return (
      <Container className="py-5">
        <Alert variant="info">
          <Alert.Heading>No Business Found</Alert.Heading>
          <p>
            You don't have any business registered yet. Create your first business to start managing appointments.
          </p>
          <div className="d-flex gap-2">
            <Button variant="primary" onClick={() => navigate('/business/profile')}>
              Create Business
            </Button>
            <Button variant="outline-secondary" onClick={() => window.location.reload()}>
              Refresh
            </Button>
          </div>
        </Alert>
      </Container>
    );
  }

  return (
    <>
      <Container className="py-4">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h1>Business Dashboard</h1>
          <div className="d-flex gap-2">
            <Button 
              variant="outline-primary" 
              onClick={() => setShowBusinessModal(true)}
            >
              <FaBuilding className="me-2" />
              Manage Businesses ({businesses.length})
            </Button>
            <Button 
              variant="primary" 
              onClick={() => navigate('/business/profile')}
            >
              <FaPlus className="me-2" />
              Create Business
            </Button>
          </div>
        </div>
        
        {error && (
          <Alert variant="danger" onClose={() => setError(null)} dismissible>
            {error}
          </Alert>
        )}
        
        {selectedBusiness && (
          <>
            {/* Current Business Info */}
            <Card className="mb-4 shadow-sm">
              <Card.Body>
                <div className="d-flex justify-content-between align-items-start">
                  <div>
                    <h4 className="mb-2">
                      <FaBuilding className="me-2 text-primary" />
                      {selectedBusiness.name}
                    </h4>
                    <p className="text-muted mb-2">{selectedBusiness.description}</p>
                    <div className="d-flex flex-wrap gap-2">
                      {selectedBusiness.address && (
                        <small className="text-muted">{selectedBusiness.address}</small>
                      )}
                      {selectedBusiness.phone && (
                        <small className="text-muted">• {selectedBusiness.phone}</small>
                      )}
                      {selectedBusiness.email && (
                        <small className="text-muted">• {selectedBusiness.email}</small>
                      )}
                    </div>
                  </div>
                  <Button 
                    variant="outline-primary"
                    onClick={() => navigate(`/business/profile?edit=${selectedBusiness.id}`)}
                  >
                    <FaCog className="me-2" />
                    Edit Details
                  </Button>
                </div>
              </Card.Body>
            </Card>

            {/* Main Dashboard Cards */}
            <Row className="mb-4">
              <Col md={6} className="mb-3">
                <Card className="h-100 shadow-sm">
                  <Card.Body>
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <Card.Title className="mb-0">Today's Appointments</Card.Title>
                      <Badge bg="primary">{appointments.today.length}</Badge>
                    </div>
                    
                    {appointments.today.length === 0 ? (
                      <div className="text-center text-muted py-3">
                        <FaCalendarAlt size={32} className="mb-2 opacity-50" />
                        <p className="mb-0">No appointments today</p>
                      </div>
                    ) : (
                      <div className="appointment-list" style={{ maxHeight: '200px', overflowY: 'auto' }}>
                        {appointments.today.slice(0, 3).map(renderAppointmentItem)}
                        {appointments.today.length > 3 && (
                          <small className="text-muted">...and {appointments.today.length - 3} more</small>
                        )}
                      </div>
                    )}
                    
                    <div className="mt-3">
                      <Button 
                        variant="outline-primary" 
                        className="w-100"
                        onClick={() => navigate('/business/appointments')}
                      >
                        View All Appointments ({appointments.all.length})
                      </Button>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
              
              <Col md={6} className="mb-3">
                <Card className="h-100 shadow-sm">
                  <Card.Body>
                    <Card.Title>Quick Actions</Card.Title>
                    
                    <div className="d-grid gap-2">
                      <Button 
                        variant="primary"
                        onClick={() => navigate('/business/create-appointment')}
                      >
                        <FaPlus className="me-2" />
                        Create Walk-in Appointment
                      </Button>
                      
                      <Button 
                        variant="outline-primary"
                        onClick={() => navigate('/business/services')}
                      >
                        <FaList className="me-2" />
                        Manage Services ({selectedBusiness.services?.length || 0})
                      </Button>
                      
                      <Button 
                        variant="outline-primary"
                        onClick={() => navigate('/business/hours')}
                      >
                        <FaUserClock className="me-2" />
                        Set Business Hours
                      </Button>
                    </div>
                    
                    <div className="mt-3 pt-3 border-top">
                      <small className="text-muted">
                        <strong>This week:</strong> {appointments.thisWeek.length} appointments
                      </small>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            </Row>
          </>
        )}

        {/* Business Management Modal */}
        <Modal 
          show={showBusinessModal} 
          onHide={() => {
            setShowBusinessModal(false);
            setOpenDropdownId(null); // Close any open dropdowns when modal closes
          }} 
          size="lg"
        >
          <Modal.Header closeButton>
            <Modal.Title>
              <FaBuilding className="me-2" />
              Manage Your Businesses
            </Modal.Title>
          </Modal.Header>
          <Modal.Body className="business-modal-body">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h6 className="mb-0">Your Businesses ({businesses.length})</h6>
              <Button 
                variant="primary" 
                size="sm"
                onClick={() => {
                  setShowBusinessModal(false);
                  setOpenDropdownId(null);
                  navigate('/business/profile');
                }}
              >
                <FaPlus className="me-1" />
                Add New
              </Button>
            </div>
            
            <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
              {businesses.map(business => (
                <BusinessCard
                  key={business.id}
                  business={business}
                  isSelected={selectedBusiness?.id === business.id}
                  onSelect={(business) => {
                    handleSelectBusiness(business);
                    setShowBusinessModal(false);
                  }}
                  onEdit={(business) => {
                    setShowBusinessModal(false);
                    setOpenDropdownId(null);
                    navigate(`/business/profile?edit=${business.id}`);
                  }}
                  onDelete={handleDeleteBusiness}
                />
              ))}
            </div>
          </Modal.Body>
        </Modal>
      </Container>

      {/* FIX 11/08/2025: Updated CSS with proper dropdown management */}
      <style jsx>{`
        /* Business card dropdown styling */
        .business-card-item {
          overflow: visible !important;
          position: relative;
        }

        .business-dropdown-container {
          position: relative;
          z-index: 100;
        }

        .business-dropdown-toggle {
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          width: 32px !important;
          height: 32px !important;
          border-radius: 50% !important;
          transition: all 0.2s ease !important;
          text-decoration: none !important;
          background: transparent !important;
          border: none !important;
          cursor: pointer !important;
          color: #6c757d !important;
        }

        .business-dropdown-toggle:hover {
          background-color: rgba(0, 0, 0, 0.1) !important;
          color: #495057 !important;
        }

        .business-dropdown-toggle:focus {
          box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25) !important;
          outline: none !important;
        }

        .business-dropdown-toggle[aria-expanded="true"] {
          background-color: rgba(0, 123, 255, 0.1) !important;
          color: #007bff !important;
        }

        .business-dropdown-toggle.hidden {
          opacity: 0 !important;
          visibility: hidden !important;
          pointer-events: none !important;
          transform: scale(0.8) !important;
        }

        /* FIX 11/08/2025: Custom dropdown menu positioning and visibility */
        .business-dropdown-menu {
          position: absolute !important;
          top: 100% !important;
          right: 0 !important;
          left: auto !important;
          z-index: 9999 !important;
          min-width: 200px !important;
          margin-top: 4px !important;
          padding: 8px !important;
          background-color: white !important;
          border: 1px solid rgba(0, 0, 0, 0.15) !important;
          border-radius: 8px !important;
          box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15) !important;
          transform: none !important;
          opacity: 1 !important;
          visibility: visible !important;
          display: block !important;
        }

        /* FIX 11/08/2025: Dropdown item styling */
        .dropdown-item-custom {
          display: flex !important;
          align-items: center !important;
          width: 100% !important;
          padding: 10px 12px !important;
          border-radius: 6px !important;
          margin: 2px 0 !important;
          transition: all 0.2s ease !important;
          color: #495057 !important;
          text-decoration: none !important;
          cursor: pointer !important;
          font-size: 14px !important;
          white-space: nowrap !important;
          background: transparent !important;
          border: none !important;
          text-align: left !important;
        }

        .dropdown-item-custom:hover {
          background-color: #f8f9fa !important;
          color: #495057 !important;
          transform: translateX(4px) !important;
        }

        .dropdown-item-custom.text-danger {
          color: #dc3545 !important;
        }

        .dropdown-item-custom.text-danger:hover {
          background-color: #f8d7da !important;
          color: #721c24 !important;
        }

        .dropdown-divider {
          height: 0;
          margin: 8px 0;
          overflow: hidden;
          border-top: 1px solid #e9ecef;
        }

        /* Ensure modal content allows overflow */
        .business-modal-body {
          overflow: visible !important;
        }

        .modal-body {
          overflow: visible !important;
        }

        .modal-content {
          overflow: visible !important;
        }

        .modal {
          overflow: visible !important;
        }

        /* Ensure cards don't clip dropdowns */
        .card {
          overflow: visible !important;
        }

        .card-body {
          overflow: visible !important;
        }

        /* Container and row fixes */
        .container,
        .row,
        .col,
        .col-md-6,
        .col-lg-4 {
          overflow: visible !important;
        }

        /* Mobile responsiveness */
        @media (max-width: 768px) {
          .business-dropdown-menu {
            right: 0 !important;
            left: auto !important;
            min-width: 180px !important;
          }
        }

        /* High z-index for dropdown */
        .business-dropdown-menu {
          z-index: 9999 !important;
          display: block !important;
          opacity: 1 !important;
          visibility: visible !important;
        }

        /* Prevent dropdown toggle interference */
        .business-dropdown-toggle:focus {
          box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25) !important;
        }
      `}</style>
    </>
  );
};

export default BusinessDashboard;