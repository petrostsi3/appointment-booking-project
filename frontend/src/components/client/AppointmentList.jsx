import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Badge, Spinner, Alert, Tabs, Tab } from 'react-bootstrap';
import { FaCalendarAlt, FaClock, FaMapMarkerAlt } from 'react-icons/fa';
import appointmentService from '../../services/appointments';
import moment from 'moment';


const AppointmentList = () => {
  const [appointments, setAppointments] = useState({
    upcoming: [],
    past: []});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [success, setSuccess] = useState(null);
  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        setLoading(true);
        const data = await appointmentService.getMyAppointments();
        setAppointments(data);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching appointments:', err);
        setError('Failed to load your appointments. Please try again later.');
        setLoading(false);
      }
    };

    fetchAppointments();
  }, []);

  const handleCancelAppointment = async (appointmentId) => {
    if (!window.confirm('Are you sure you want to cancel this appointment?')) {
      return;
    }
    try {
      setCancelLoading(true);
      await appointmentService.cancelAppointment(appointmentId);
      setAppointments(prev => ({
        upcoming: prev.upcoming.map(appt => 
          appt.id === appointmentId ? { ...appt, status: 'cancelled', status_display: 'Cancelled' } : appt
        ),
        past: prev.past
      }));
      setSuccess('Appointment cancelled successfully.');
      setCancelLoading(false);
      setTimeout(() => {
        setSuccess(null);
      }, 3000);
    } catch (err) {
      console.error('Error cancelling appointment:', err);
      setError('Failed to cancel appointment. Please try again.');
      setCancelLoading(false);
    }
  };

  const renderAppointmentCard = (appointment) => {
    const formattedDate = moment(appointment.date).format('dddd, MMMM D, YYYY');
    const statusVariant = 
      appointment.status === 'confirmed' ? 'success' :
      appointment.status === 'pending' ? 'warning' :
      appointment.status === 'cancelled' ? 'danger' : 'info';
    return (
      <Card key={appointment.id} className="mb-3 shadow-sm">
        <Card.Body>
          <Row>
            <Col md={8}>
              <h5>{appointment.business_details?.name}</h5>
              <p className="mb-2">{appointment.service_details?.name} - €{appointment.service_details?.price}</p>
              
              <div className="d-flex mb-2">
                <FaCalendarAlt className="me-2 mt-1 text-secondary" />
                <span>{formattedDate}</span>
              </div>
              
              <div className="d-flex mb-2">
                <FaClock className="me-2 mt-1 text-secondary" />
                <span>{appointment.start_time} - {appointment.end_time}</span>
              </div>
              
              {appointment.business_details?.address && (
                <div className="d-flex mb-2">
                  <FaMapMarkerAlt className="me-2 mt-1 text-secondary" />
                  <span>{appointment.business_details.address}</span>
                </div>
              )}
              
              {appointment.notes && (
                <div className="mt-3">
                  <strong>Notes:</strong>
                  <p className="mb-0">{appointment.notes}</p>
                </div>
              )}
            </Col>
            
            <Col md={4} className="text-md-end">
              <Badge bg={statusVariant} className="mb-3">
                {appointment.status_display}
              </Badge>
              
              {appointment.status !== 'cancelled' && appointment.status !== 'completed' && (
                <div className="d-grid">
                  <Button
                    variant="outline-danger"
                    onClick={() => handleCancelAppointment(appointment.id)}
                    disabled={cancelLoading}
                  >
                    {cancelLoading ? 'Cancelling...' : 'Cancel Appointment'}
                  </Button>
                </div>
              )}
            </Col>
          </Row>
        </Card.Body>
      </Card>
    );
  };

  if (loading) {
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
      <h1 className="mb-4">My Appointments</h1>
      
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
      
      <Tabs defaultActiveKey="upcoming" className="mb-4">
        <Tab eventKey="upcoming" title="Upcoming">
          {appointments.upcoming.length === 0 ? (
            <Alert variant="info">
              You don't have any upcoming appointments.
            </Alert>
          ) : (
            appointments.upcoming.map(renderAppointmentCard)
          )}
        </Tab>
        
        <Tab eventKey="past" title="Past">
          {appointments.past.length === 0 ? (
            <Alert variant="info">
              You don't have any past appointments.
            </Alert>
          ) : (
            appointments.past.map(renderAppointmentCard)
          )}
        </Tab>
      </Tabs>
    </Container>
  );
};

export default AppointmentList;