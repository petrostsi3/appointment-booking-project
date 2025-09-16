import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Spinner, Alert, Form, Modal, Table, Badge } from 'react-bootstrap';
import moment from 'moment';
import appointmentService from '../../services/appointments';
import businessService from '../../services/businesses';
import CalendarView from './CalendarView'; 


const AppointmentCalendar = () => {
  const [businesses, setBusinesses] = useState([]);
  const [selectedBusiness, setSelectedBusiness] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [filteredAppointments, setFilteredAppointments] = useState([]);
  const [currentDate, setCurrentDate] = useState(moment());
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'calendar'
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [newStatus, setNewStatus] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  
  useEffect(() => {
    const fetchBusinesses = async () => {
      try {
        setLoading(true);
        const userBusinesses = await businessService.getMyBusinesses();
        console.log('Calendar: User businesses:', userBusinesses);
        setBusinesses(userBusinesses);
        if (userBusinesses.length > 0) {
          setSelectedBusiness(userBusinesses[0]);
        }
        setLoading(false);
      } catch (err) {
        console.error('Error fetching businesses:', err);
        setError('Failed to load your businesses. Please try again later.');
        setLoading(false);
      }
    };
    fetchBusinesses();
  }, []);
  useEffect(() => {
    if (!selectedBusiness) return;
    const fetchAppointments = async () => {
      try {
        setLoading(true);
        console.log('--- FETCHING APPOINTMENTS FOR BUSINESS ---');
        console.log('Selected business:', selectedBusiness);
        const data = await appointmentService.getMyAppointments();
        console.log('All appointments data:', data);
        const allAppointments = [...data.upcoming, ...data.past];
        const businessAppointments = allAppointments.filter(appointment => {
          const matches = appointment.business === selectedBusiness.id || 
                         (appointment.business_details && appointment.business_details.id === selectedBusiness.id);
          if (matches) {
            console.log('Found appointment for business:', appointment);
          }
          return matches;
        });
        console.log('Filtered business appointments:', businessAppointments);
        businessAppointments.sort((a, b) => {
          const dateA = moment(`${a.date} ${a.start_time}`);
          const dateB = moment(`${b.date} ${b.start_time}`);
          return dateA - dateB;
        });
        setAppointments(businessAppointments);
        setFilteredAppointments(businessAppointments);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching appointments:', err);
        setError('Failed to load appointments. Please try again later.');
        setLoading(false);
      }
    };
    fetchAppointments();
  }, [selectedBusiness]);
  
  useEffect(() => {
    let filtered = [...appointments];
    if (filterStatus !== 'all') {
      filtered = filtered.filter(apt => apt.status === filterStatus);
    }
    setFilteredAppointments(filtered);
  }, [appointments, filterStatus]);

  const handleBusinessChange = (event) => {
    const businessId = parseInt(event.target.value);
    const business = businesses.find(b => b.id === businessId);
    setSelectedBusiness(business);
  };
  
  const handleOpenStatusModal = (appointment) => {
    setSelectedAppointment(appointment);
    setNewStatus(appointment.status);
    setShowStatusModal(true);
  };
  
  const handleUpdateStatus = async () => {
    if (!selectedAppointment || !newStatus) return;
    try {
      setLoading(true);
      await appointmentService.updateAppointment(selectedAppointment.id, {
        status: newStatus
      });
      setAppointments(prev => 
        prev.map(appt => 
          appt.id === selectedAppointment.id ? 
            { ...appt, status: newStatus, status_display: getStatusDisplay(newStatus) } : 
            appt
        )
      );
      setShowStatusModal(false);
      setLoading(false);
    } catch (err) {
      console.error('Error updating appointment status:', err);
      setError('Failed to update appointment status. Please try again.');
      setLoading(false);
    }
  };

  const getStatusDisplay = (status) => {
    switch (status) {
      case 'pending': return 'Pending';
      case 'confirmed': return 'Confirmed';
      case 'cancelled': return 'Cancelled';
      case 'completed': return 'Completed';
      default: return status;
    }
  };

  const getStatusBadgeColor = (status) => {
    switch (status) {
      case 'pending': return 'warning';
      case 'confirmed': return 'success';
      case 'cancelled': return 'danger';
      case 'completed': return 'info';
      default: return 'secondary';
    }
  };
  
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
            You don't have any business registered yet. Create your first business to manage appointments.
          </p>
          <Button variant="primary" href="/business/profile">
            Create Business
          </Button>
        </Alert>
      </Container>
    );
  }
  
  return (
    <Container className="py-4">
      <h1 className="mb-4">Appointment Management</h1>
      
      {error && (
        <Alert variant="danger" onClose={() => setError(null)} dismissible>
          {error}
        </Alert>
      )}
      
      <Row className="mb-4">
        <Col md={4}>
          {businesses.length > 1 && (
            <Form.Group>
              <Form.Label>Select Business:</Form.Label>
              <Form.Select
                value={selectedBusiness?.id || ''}
                onChange={handleBusinessChange}
              >
                {businesses.map(business => (
                  <option key={business.id} value={business.id}>
                    {business.name}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
          )}
        </Col>
        <Col md={4}>
          <Form.Group>
            <Form.Label>Filter by Status:</Form.Label>
            <Form.Select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="all">All Appointments</option>
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="cancelled">Cancelled</option>
              <option value="completed">Completed</option>
            </Form.Select>
          </Form.Group>
        </Col>
        <Col md={4} className="d-flex align-items-end">
          <div className="d-flex gap-2">
            <Button 
              variant={viewMode === 'list' ? 'primary' : 'outline-primary'}
              onClick={() => setViewMode('list')}
            >
              List View
            </Button>
            <Button 
              variant={viewMode === 'calendar' ? 'primary' : 'outline-primary'}
              onClick={() => setViewMode('calendar')}
            >
              Calendar View
            </Button>
          </div>
        </Col>
      </Row>
      
      {selectedBusiness && (
        <Card className="shadow-sm">
          <Card.Header>
            <h5 className="mb-0">
              Appointments for {selectedBusiness.name} 
              <Badge bg="secondary" className="ms-2">
                {filteredAppointments.length} total
              </Badge>
            </h5>
          </Card.Header>
          <Card.Body>
            {loading ? (
              <div className="text-center py-3">
                <Spinner animation="border" role="status">
                  <span className="visually-hidden">Loading...</span>
                </Spinner>
              </div>
            ) : filteredAppointments.length === 0 ? (
              <Alert variant="info">
                No appointments found for the selected filters.
              </Alert>
            ) : viewMode === 'list' ? (
              <Table responsive hover>
                <thead>
                  <tr>
                    <th>Date & Time</th>
                    <th>Client</th>
                    <th>Service</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAppointments.map(appointment => (
                    <tr key={appointment.id}>
                      <td>
                        <div>
                          <strong>{moment(appointment.date).format('ddd, MMM D, YYYY')}</strong>
                        </div>
                        <div className="text-muted">
                          {appointment.start_time} - {appointment.end_time}
                        </div>
                      </td>
                      <td>
                        <div>
                          <strong>
                            {appointment.client_details?.first_name} {appointment.client_details?.last_name}
                          </strong>
                        </div>
                        <div className="text-muted small">
                          {appointment.client_details?.email}
                        </div>
                      </td>
                      <td>
                        <div>{appointment.service_details?.name}</div>
                        <div className="text-muted small">
                          €{appointment.service_details?.price} • {appointment.service_details?.duration}min
                        </div>
                      </td>
                      <td>
                        <Badge bg={getStatusBadgeColor(appointment.status)}>
                          {appointment.status_display || getStatusDisplay(appointment.status)}
                        </Badge>
                      </td>
                      <td>
                        <Button
                          variant="outline-primary"
                          size="sm"
                          onClick={() => handleOpenStatusModal(appointment)}
                        >
                          Update Status
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            ) : (
              <CalendarView 
                appointments={filteredAppointments}
                onAppointmentClick={handleOpenStatusModal}
                getStatusBadgeColor={getStatusBadgeColor}
              />
            )}
          </Card.Body>
        </Card>
      )}
      
      {/* Status Update Modal */}
      <Modal show={showStatusModal} onHide={() => setShowStatusModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Update Appointment Status</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedAppointment && (
            <>
              <div className="mb-3">
                <strong>Client:</strong> {selectedAppointment.client_details?.first_name} {selectedAppointment.client_details?.last_name}<br />
                <strong>Service:</strong> {selectedAppointment.service_details?.name}<br />
                <strong>Date:</strong> {moment(selectedAppointment.date).format('MMMM D, YYYY')}<br />
                <strong>Time:</strong> {selectedAppointment.start_time} - {selectedAppointment.end_time}
              </div>
              
              <Form.Group>
                <Form.Label>Status:</Form.Label>
                <Form.Select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                >
                  <option value="pending">Pending</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="cancelled">Cancelled</option>
                  <option value="completed">Completed</option>
                </Form.Select>
              </Form.Group>
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowStatusModal(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleUpdateStatus}>
            Update Status
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default AppointmentCalendar;