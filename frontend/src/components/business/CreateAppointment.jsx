import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert, Spinner } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import businessService from '../../services/businesses';
import appointmentService from '../../services/appointments';
import moment from 'moment';


const CreateAppointment = () => {
  const [businesses, setBusinesses] = useState([]);
  const [selectedBusiness, setSelectedBusiness] = useState(null);
  const [services, setServices] = useState([]);
  const [selectedService, setSelectedService] = useState(null);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [clientInfo, setClientInfo] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone_number: ''});
  const [appointmentForm, setAppointmentForm] = useState({
    date: '',
    notes: ''});
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const navigate = useNavigate();
  const today = moment().format('YYYY-MM-DD');

  useEffect(() => {
    const fetchBusinesses = async () => {
      try {
        setLoading(true);
        const userBusinesses = await businessService.getMyBusinesses();
        setBusinesses(userBusinesses);
        
        if (userBusinesses.length > 0) {
          setSelectedBusiness(userBusinesses[0]);
        }
        setLoading(false);
      } catch (err) {
        console.error('Error fetching businesses:', err);
        setError('Failed to load your businesses.');
        setLoading(false);
      }
    };
    
    fetchBusinesses();
  }, []);
  
  // Fetch services when business is selected
  useEffect(() => {
    if (!selectedBusiness) return;
    const fetchServices = async () => {
      try {
        const businessDetails = await businessService.getBusinessById(selectedBusiness.id);
        setServices(businessDetails.services || []);
      } catch (err) {
        console.error('Error fetching services:', err);
        setServices([]);
      }
    };
    
    fetchServices();
  }, [selectedBusiness]);
  
  useEffect(() => {
    if (!selectedBusiness || !selectedService || !appointmentForm.date) {
      setAvailableSlots([]);
      return;
    }
    
    const fetchAvailableSlots = async () => {
      try {
        const data = await appointmentService.getAvailableTimeSlots(
          selectedBusiness.id,
          selectedService.id,
          appointmentForm.date
        );
        setAvailableSlots(data.available_slots || []);
        setSelectedSlot(null);
      } catch (err) {
        console.error('Error fetching available slots:', err);
        setAvailableSlots([]);
      }
    };
    
    fetchAvailableSlots();
  }, [selectedBusiness, selectedService, appointmentForm.date]);

  const handleBusinessChange = (e) => {
    const businessId = parseInt(e.target.value);
    const business = businesses.find(b => b.id === businessId);
    setSelectedBusiness(business);
    setSelectedService(null);
    setSelectedSlot(null);
    setAvailableSlots([]);
  };

  const handleServiceChange = (e) => {
    const serviceId = parseInt(e.target.value);
    const service = services.find(s => s.id === serviceId);
    setSelectedService(service);
    setSelectedSlot(null);
  };

  const handleDateChange = (e) => {
    setAppointmentForm(prev => ({
      ...prev,
      date: e.target.value
    }));
    setSelectedSlot(null);
  };
  
  const handleSlotSelect = (slot) => {
    setSelectedSlot(slot);
  };

  const handleClientInfoChange = (e) => {
    const { name, value } = e.target;
    setClientInfo(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedBusiness || !selectedService || !selectedSlot || !appointmentForm.date) {
      setError('Please select business, service, date and time slot.');
      return;
    }
    if (!clientInfo.first_name || !clientInfo.last_name) {
      setError('Please enter at least the client\'s first and last name.');
      return;
    }
    try {
      setCreating(true);
      setError(null);
      console.log('--- CREATING WALK-IN APPOINTMENT ---');
      console.log('Client info:', clientInfo);

      // FIX: Send client_info to backend for walk-in appointment processing
      const appointmentData = {
        business: selectedBusiness.id,
        service: selectedService.id,
        date: appointmentForm.date,
        start_time: selectedSlot.start_time,
        notes: appointmentForm.notes || '',
        status: 'confirmed', 
        client_info: {
          first_name: clientInfo.first_name,
          last_name: clientInfo.last_name,
          email: clientInfo.email || '',
          phone_number: clientInfo.phone_number || ''
        }
      };
      console.log('Sending appointment data:', appointmentData);
      const appointment = await appointmentService.bookAppointment(appointmentData);
      console.log('Appointment created:', appointment);
      setSuccess(`Walk-in appointment created successfully for ${clientInfo.first_name} ${clientInfo.last_name}!`);
      setSelectedSlot(null);
      setAppointmentForm({ date: '', notes: '' });
      setClientInfo({
        first_name: '',
        last_name: '',
        email: '',
        phone_number: ''
      });
      setCreating(false);
      
    } catch (err) {
      console.error('Error creating appointment:', err);
      console.error('Error details:', err.response?.data);
      let errorMessage = 'Failed to create appointment. ';
      if (err.response?.data) {
        const errorData = err.response.data;
        if (typeof errorData === 'object') {
          Object.keys(errorData).forEach(key => {
            if (Array.isArray(errorData[key])) {
              errorMessage += `${key}: ${errorData[key].join(', ')} `;
            } else {
              errorMessage += `${key}: ${errorData[key]} `;
            }
          });
        } else {
          errorMessage += errorData;
        }
      } else {
        errorMessage += err.message || 'Please try again.';
      }
      
      setError(errorMessage);
      setCreating(false);
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
  
  if (businesses.length === 0) {
    return (
      <Container className="py-5">
        <Alert variant="info">
          <Alert.Heading>No Business Found</Alert.Heading>
          <p>You need to create a business first before you can create appointments.</p>
          <Button variant="primary" onClick={() => navigate('/business/profile')}>
            Create Business
          </Button>
        </Alert>
      </Container>
    );
  }
  
  return (
    <Container className="py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>Create Walk-In Appointment</h1>
        <Button variant="outline-secondary" onClick={() => navigate('/business/dashboard')}>
          Back to Dashboard
        </Button>
      </div>
      
      <Alert variant="info" className="mb-4">
        <strong>Walk-In Appointments:</strong> Use this to create appointments for clients who visit or call your business. Client information will be saved in the appointment notes.
      </Alert>
      
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
      
      <Form onSubmit={handleSubmit}>
        <Row>
          <Col lg={8}>
            {/* Business Selection */}
            {businesses.length > 1 && (
              <Card className="mb-4">
                <Card.Body>
                  <Card.Title>Select Business</Card.Title>
                  <Form.Select value={selectedBusiness?.id || ''} onChange={handleBusinessChange}>
                    {businesses.map(business => (
                      <option key={business.id} value={business.id}>
                        {business.name}
                      </option>
                    ))}
                  </Form.Select>
                </Card.Body>
              </Card>
            )}
            
            {/* Client Information */}
            <Card className="mb-4">
              <Card.Body>
                <Card.Title>Client Information</Card.Title>
                <p className="text-muted">Enter the walk-in client's details (for your records).</p>
                
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>First Name *</Form.Label>
                      <Form.Control
                        type="text"
                        name="first_name"
                        value={clientInfo.first_name}
                        onChange={handleClientInfoChange}
                        required
                        placeholder="Enter first name"
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Last Name *</Form.Label>
                      <Form.Control
                        type="text"
                        name="last_name"
                        value={clientInfo.last_name}
                        onChange={handleClientInfoChange}
                        required
                        placeholder="Enter last name"
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Email (Optional)</Form.Label>
                      <Form.Control
                        type="email"
                        name="email"
                        value={clientInfo.email}
                        onChange={handleClientInfoChange}
                        placeholder="Enter email address"
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Phone Number (Optional)</Form.Label>
                      <Form.Control
                        type="tel"
                        name="phone_number"
                        value={clientInfo.phone_number}
                        onChange={handleClientInfoChange}
                        placeholder="Enter phone number"
                      />
                    </Form.Group>
                  </Col>
                </Row>
              </Card.Body>
            </Card>
            
            {/* Service Selection */}
            <Card className="mb-4">
              <Card.Body>
                <Card.Title>Appointment Details</Card.Title>
                
                <Form.Group className="mb-3">
                  <Form.Label>Service *</Form.Label>
                  <Form.Select value={selectedService?.id || ''} onChange={handleServiceChange} required>
                    <option value="">Select a service...</option>
                    {services.filter(s => s.is_active).map(service => (
                      <option key={service.id} value={service.id}>
                        {service.name} - €{service.price} ({service.duration} min)
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
                
                <Form.Group className="mb-3">
                  <Form.Label>Date *</Form.Label>
                  <Form.Control
                    type="date"
                    value={appointmentForm.date}
                    onChange={handleDateChange}
                    min={today}
                    required
                  />
                </Form.Group>
                
                {availableSlots.length > 0 && (
                  <Form.Group className="mb-3">
                    <Form.Label>Available Time Slots *</Form.Label>
                    <div className="d-flex flex-wrap gap-2">
                      {availableSlots.map((slot, index) => (
                        <Button
                          key={index}
                          variant={selectedSlot === slot ? "primary" : "outline-primary"}
                          onClick={() => handleSlotSelect(slot)}
                          size="sm"
                        >
                          {slot.start_time} - {slot.end_time}
                        </Button>
                      ))}
                    </div>
                  </Form.Group>
                )}
                
                {appointmentForm.date && availableSlots.length === 0 && selectedService && (
                  <Alert variant="warning">
                    No available time slots for this date. Please select another date.
                  </Alert>
                )}
                
                <Form.Group className="mb-3">
                  <Form.Label>Additional Notes</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    value={appointmentForm.notes}
                    onChange={(e) => setAppointmentForm(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="Any special notes for this appointment..."
                  />
                </Form.Group>
              </Card.Body>
            </Card>
          </Col>
          
          <Col lg={4}>
            {/* Appointment Summary */}
            <Card className="mb-4 sticky-top" style={{ top: '20px' }}>
              <Card.Header>
                <Card.Title className="mb-0">Appointment Summary</Card.Title>
              </Card.Header>
              <Card.Body>
                <div className="mb-3">
                  <strong>Business:</strong><br />
                  {selectedBusiness?.name || 'Not selected'}
                </div>
                
                <div className="mb-3">
                  <strong>Walk-In Client:</strong><br />
                  {clientInfo.first_name && clientInfo.last_name ? 
                    `${clientInfo.first_name} ${clientInfo.last_name}` : 
                    'Not entered'}
                  {clientInfo.email && (
                    <><br /><small className="text-muted">{clientInfo.email}</small></>
                  )}
                  {clientInfo.phone_number && (
                    <><br /><small className="text-muted">{clientInfo.phone_number}</small></>
                  )}
                </div>
                
                <div className="mb-3">
                  <strong>Service:</strong><br />
                  {selectedService ? (
                    <>
                      {selectedService.name}<br />
                      <small className="text-muted">
                        €{selectedService.price} • {selectedService.duration} min
                      </small>
                    </>
                  ) : 'Not selected'}
                </div>
                
                <div className="mb-3">
                  <strong>Date & Time:</strong><br />
                  {appointmentForm.date && selectedSlot ? (
                    <>
                      {moment(appointmentForm.date).format('dddd, MMMM D, YYYY')}<br />
                      <small className="text-muted">
                        {selectedSlot.start_time} - {selectedSlot.end_time}
                      </small>
                    </>
                  ) : 'Not selected'}
                </div>
                
                <div className="d-grid">
                  <Button
                    variant="primary"
                    type="submit"
                    disabled={creating || !selectedBusiness || !selectedService || !selectedSlot || 
                             !clientInfo.first_name || !clientInfo.last_name}
                  >
                    {creating ? 'Creating...' : 'Create Walk-In Appointment'}
                  </Button>
                </div>
                
                <div className="mt-3 p-2 bg-light rounded">
                  <small className="text-muted">
                    <strong>Note:</strong> This appointment will be automatically confirmed and the client information will be saved in the appointment notes.
                  </small>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Form>
    </Container>
  );
};

export default CreateAppointment;