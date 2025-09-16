import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, ListGroup, Badge, Spinner, Alert } from 'react-bootstrap';
import { useParams, Link } from 'react-router-dom';
import { FaMapMarkerAlt, FaPhone, FaEnvelope, FaClock } from 'react-icons/fa';
import businessService from '../../services/businesses';


const BusinessDetail = () => {
  const { id } = useParams();
  const [business, setBusiness] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  useEffect(() => {
    const fetchBusinessDetails = async () => {
      try {
        setLoading(true);
        const data = await businessService.getBusinessById(id);
        setBusiness(data);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching business details:', err);
        setError('Failed to load business details. Please try again later.');
        setLoading(false);
      }
    };

    fetchBusinessDetails();
  }, [id]);
  if (loading) {
    return (
      <Container className="py-5 text-center">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
      </Container>
    );
  }
  if (error) {
    return (
      <Container className="py-5">
        <Alert variant="danger">{error}</Alert>
      </Container>
    );
  }
  if (!business) {
    return (
      <Container className="py-5">
        <Alert variant="info">Business not found.</Alert>
      </Container>
    );
  }
  const sortedBusinessHours = business.business_hours ? 
    [...business.business_hours].sort((a, b) => a.day - b.day) : 
    [];

  const formatTimeDisplay = (dayHours) => {
    if (!dayHours || dayHours.is_closed) {
      return <Badge bg="secondary">Closed</Badge>;
    }
    if (!dayHours.time_periods || dayHours.time_periods.length === 0) {
      return <Badge bg="warning">No hours set</Badge>;
    }
    const formatTime = (timeStr) => {
      if (!timeStr) return '';
      return timeStr.substring(0, 5);
    };
    const shouldShowPeriodName = (period, allPeriods) => {
      // Don't show period name if:
      // 1. There's only one period 
      // 2. Period name is generic, i.e "Full Day", "Saturday Hours"
      if (allPeriods.length === 1) return false;
      const genericNames = ['full day', 'saturday hours', 'sunday hours', 'weekday', 'weekend'];
      if (!period.period_name) return false;
      const periodNameLower = period.period_name.toLowerCase();
      if (genericNames.some(generic => periodNameLower.includes(generic))) return false;
      return true;
    };
    return (
      <div className="text-end">
        {dayHours.time_periods.map((period, periodIndex) => (
          <div key={periodIndex} className="mb-1">
            {shouldShowPeriodName(period, dayHours.time_periods) && (
              <small className="text-muted me-1">
                {period.period_name}:
              </small>
            )}
            <span>{formatTime(period.start_time)} - {formatTime(period.end_time)}</span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <Container className="py-4">
      <Row>
        <Col lg={4} className="mb-4">
          <Card className="shadow-sm">
            {business.logo_url && (
              <div className="text-center p-3 bg-light">
                <img
                  src={business.logo_url}
                  alt={business.name}
                  className="img-fluid"
                  style={{ maxHeight: '200px' }}
                />
              </div>
            )}
            
            <Card.Body>
              <Card.Title className="mb-3">{business.name}</Card.Title>
              <Card.Text>{business.description}</Card.Text>
              
              <div className="mt-3">
                {business.address && (
                  <div className="d-flex mb-2">
                    <FaMapMarkerAlt className="me-2 mt-1 text-secondary" />
                    <span>{business.address}</span>
                  </div>
                )}
                
                {business.phone && (
                  <div className="d-flex mb-2">
                    <FaPhone className="me-2 mt-1 text-secondary" />
                    <span>{business.phone}</span>
                  </div>
                )}
                
                {business.email && (
                  <div className="d-flex mb-2">
                    <FaEnvelope className="me-2 mt-1 text-secondary" />
                    <span>{business.email}</span>
                  </div>
                )}
              </div>
            </Card.Body>
          </Card>
          
          <Card className="mt-4 shadow-sm">
            <Card.Body>
              <div className="d-flex align-items-center mb-3">
                <FaClock className="me-2 text-secondary" />
                <Card.Title className="mb-0">Business Hours</Card.Title>
              </div>
              
              <ListGroup variant="flush">
                {daysOfWeek.map((day, index) => {
                  const dayHours = sortedBusinessHours.find(hours => hours.day === index);
                  
                  return (
                    <ListGroup.Item key={day} className="d-flex justify-content-between align-items-start">
                      <span><strong>{day}</strong></span>
                      <div>
                        {formatTimeDisplay(dayHours)}
                      </div>
                    </ListGroup.Item>
                  );
                })}
              </ListGroup>
            </Card.Body>
          </Card>
        </Col>
        
        <Col lg={8}>
          <Card className="shadow-sm">
            <Card.Body>
              <Card.Title className="mb-4">Services</Card.Title>
              
              {business.services && business.services.length > 0 ? (
                <Row>
                  {business.services.map(service => (
                    <Col md={6} key={service.id} className="mb-3">
                      <Card className="h-100 service-card">
                        <Card.Body>
                          <Card.Title>{service.name}</Card.Title>
                          <Card.Text>
                            {service.description}
                          </Card.Text>
                          <div className="d-flex justify-content-between align-items-center mb-3">
                            <span>Duration: {service.duration} min</span>
                            <span className="text-primary fw-bold">€{service.price}</span>
                          </div>
                          <div className="d-grid">
                            <Link to={`/book/${business.id}/${service.id}`}>
                              <Button variant="primary">Book Now</Button>
                            </Link>
                          </div>
                        </Card.Body>
                      </Card>
                    </Col>
                  ))}
                </Row>
              ) : (
                <Alert variant="info">
                  No services available for this business.
                </Alert>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default BusinessDetail;