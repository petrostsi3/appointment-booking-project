import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Row, Col, Card, Button, Form, Alert, Spinner } from 'react-bootstrap';
import businessService from '../../services/businesses';
import appointmentService from '../../services/appointments';
import { useAuth } from '../../contexts/AuthContext';
import moment from 'moment';


const BookAppointment = () => {
  const { businessId, serviceId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [business, setBusiness] = useState(null);
  const [service, setService] = useState(null);
  const [date, setDate] = useState('');
  const [availableSlots, setAvailableSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(true);
  const [slotLoading, setSlotLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const today = moment().format('YYYY-MM-DD');
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const businessData = await businessService.getBusinessById(businessId);
        setBusiness(businessData);
        const serviceData = businessData.services.find(s => s.id === parseInt(serviceId));
        if (!serviceData) {
          throw new Error('Service not found');
        }
        setService(serviceData);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load business or service details. Please try again.');
        setLoading(false);
      }
    };
    
    fetchData();
  }, [businessId, serviceId]);

  useEffect(() => {
    if (!date || !businessId || !serviceId) return;
    const fetchAvailableSlots = async () => {
      try {
        setSlotLoading(true);
        setError(null);
        console.log('--- FETCHING AVAILABLE SLOTS ---');
        console.log('Business ID:', businessId);
        console.log('Service ID:', serviceId);
        console.log('Selected date:', date);
        const data = await appointmentService.getAvailableTimeSlots(businessId, serviceId, date);
        console.log('Available slots response:', data);
        setAvailableSlots(data.available_slots || []);
        setSelectedSlot(null);
        setSlotLoading(false);
      } catch (err) {
        console.error('Error fetching available slots:', err);
        console.error('Error response:', err.response?.data);
        setError('Failed to load available time slots. Please try again.');
        setAvailableSlots([]);
        setSlotLoading(false);
      }
    };
    
    fetchAvailableSlots();
  }, [date, businessId, serviceId]);
  
  const handleDateChange = (e) => {
    setDate(e.target.value);
  };

  const handleSlotSelect = (slot) => {
    setSelectedSlot(slot);
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedSlot) {
      setError('Please select a time slot');
      return;
    }
    try {
      setLoading(true);
      setError(null);
  
      const appointmentData = {
        business: parseInt(businessId),  
        service: parseInt(serviceId),    
        date: date,
        start_time: selectedSlot.start_time,
        notes: notes || ''  
      };
      console.log('Booking appointment with data:', appointmentData);
      await appointmentService.bookAppointment(appointmentData);
      setSuccess(true);
      setLoading(false);
      setTimeout(() => {
        navigate('/my-appointments');
      }, 2000);
    } catch (err) {
      console.error('Error booking appointment:', err);
      console.error('Error response:', err.response?.data);
      let errorMessage = 'Failed to book appointment. Please try again.';
      if (err.response?.data) {
        if (err.response.data.detail) {
          errorMessage = err.response.data.detail;
        } else if (err.response.data.non_field_errors) {
          errorMessage = err.response.data.non_field_errors[0];
        } else {
          const firstError = Object.values(err.response.data)[0];
          if (firstError && Array.isArray(firstError)) {
            errorMessage = firstError[0];
          }
        }
      }
      
      setError(errorMessage);
      setLoading(false);
    }
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
  
  if (success) {
    return (
      <Container className="py-5">
        <Alert variant="success">
          <Alert.Heading>Appointment Booked!</Alert.Heading>
          <p>
            Your appointment has been successfully booked. You will receive a confirmation email shortly.
            Redirecting to your appointments...
          </p>
        </Alert>
      </Container>
    );
  }
  
  return (
    <Container className="py-4">
      <h1 className="mb-4">Book Appointment</h1>
      
      {error && (
        <Alert variant="danger" onClose={() => setError(null)} dismissible>
          {error}
        </Alert>
      )}
      
      <Row>
        <Col md={4} className="mb-4">
          <Card className="shadow-sm">
            <Card.Body>
              <Card.Title>Business Details</Card.Title>
              <Card.Text>
                <strong>{business.name}</strong><br />
                {business.address && (
                  <span>{business.address}<br /></span>
                )}
                {business.phone && (
                  <span>Phone: {business.phone}<br /></span>
                )}
                {business.email && (
                  <span>Email: {business.email}</span>
                )}
              </Card.Text>
              
              <hr />
              
              <Card.Title>Service Details</Card.Title>
              <Card.Text>
                <strong>{service.name}</strong><br />
                {service.description && (
                  <span>{service.description}<br /></span>
                )}
                <span>Duration: {service.duration} minutes<br /></span>
                <span>Price: €{service.price}</span>
              </Card.Text>
            </Card.Body>
          </Card>
        </Col>
        
        <Col md={8}>
          <Card className="shadow-sm">
            <Card.Body>
              <Card.Title>Book Your Appointment</Card.Title>
              
              <Form onSubmit={handleSubmit}>
                <Form.Group className="mb-3">
                  <Form.Label>Select Date</Form.Label>
                  <Form.Control
                    type="date"
                    value={date}
                    onChange={handleDateChange}
                    min={today}
                    required
                  />
                </Form.Group>
                
                {date && (
                  <Form.Group className="mb-3">
                    <Form.Label>Available Time Slots</Form.Label>
                    
                    {slotLoading ? (
                      <div className="text-center py-3">
                        <Spinner animation="border" size="sm" role="status">
                          <span className="visually-hidden">Loading...</span>
                        </Spinner>
                        <span className="ms-2">Loading available slots...</span>
                      </div>
                    ) : availableSlots.length === 0 ? (
                      <Alert variant="info">
                        No available time slots for this date. Please select another date.
                      </Alert>
                    ) : (
                      <div className="d-flex flex-wrap gap-2 mb-3">
                        {availableSlots.map((slot, index) => (
                          <Button
                            key={index}
                            variant={selectedSlot === slot ? "primary" : "outline-primary"}
                            onClick={() => handleSlotSelect(slot)}
                            className="time-slot-btn"
                          >
                            {slot.start_time} - {slot.end_time}
                          </Button>
                        ))}
                      </div>
                    )}
                  </Form.Group>
                )}
                
                {selectedSlot && (
                  <Form.Group className="mb-3">
                    <Form.Label>Notes (Optional)</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={3}
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Any special requests or information for the business owner"
                    />
                  </Form.Group>
                )}
                
                <div className="d-grid gap-2">
                  <Button
                    variant="primary"
                    type="submit"
                    disabled={!selectedSlot || loading}
                  >
                    {loading ? 'Booking...' : 'Book Appointment'}
                  </Button>
                </div>
              </Form>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default BookAppointment;