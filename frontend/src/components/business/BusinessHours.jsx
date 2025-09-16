import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert, Spinner, Table, Modal, Badge } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { FaPlus, FaTrash, FaEdit, FaClock } from 'react-icons/fa';
import businessService from '../../services/businesses';


const BusinessHours = () => {
  const [businesses, setBusinesses] = useState([]);
  const [selectedBusiness, setSelectedBusiness] = useState(null);
  const [businessHours, setBusinessHours] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [showTimePeriodModal, setShowTimePeriodModal] = useState(false);
  const [editingDay, setEditingDay] = useState(null);
  const [newTimePeriod, setNewTimePeriod] = useState({
    start_time: '',
    end_time: '',
    period_name: ''});
  const navigate = useNavigate();
  const daysOfWeek = [
    { value: 0, label: 'Monday' },
    { value: 1, label: 'Tuesday' },
    { value: 2, label: 'Wednesday' },
    { value: 3, label: 'Thursday' },
    { value: 4, label: 'Friday' },
    { value: 5, label: 'Saturday' },
    { value: 6, label: 'Sunday' },
  ];
  const initializeBusinessHours = () => {
    return daysOfWeek.map(day => ({
      day: day.value,
      day_name: day.label,
      is_closed: false,
      time_periods: [],
      id: null
    }));
  };
  
  useEffect(() => {
    const fetchBusinesses = async () => {
      try {
        setLoading(true);
        const data = await businessService.getAllBusinesses();
        let allBusinesses = [];
        if (Array.isArray(data)) {
          allBusinesses = data;
        } else if (data && Array.isArray(data.results)) {
          allBusinesses = data.results;
        }
        const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
        const userBusinesses = allBusinesses.filter(business => {
          return business.owner === currentUser.id || 
                 String(business.owner) === String(currentUser.id);
        });
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
  
  useEffect(() => {
    if (!selectedBusiness) return;
    const fetchBusinessHours = async () => {
      try {
        setLoading(true);
        const hours = await businessService.getBusinessHours(selectedBusiness.id);
        if (hours && hours.length > 0) {
          const initialHours = initializeBusinessHours();
          const mergedHours = initialHours.map(dayStructure => {
            const existingDay = hours.find(h => h.day === dayStructure.day);
            if (existingDay) {
              return {
                ...dayStructure,
                id: existingDay.id,
                is_closed: existingDay.is_closed,
                time_periods: existingDay.time_periods || []
              };
            }
            return dayStructure;
          });
          setBusinessHours(mergedHours);
        } else {
          setBusinessHours(initializeBusinessHours());
        }
        setLoading(false);
      } catch (err) {
        console.error('Error fetching business hours:', err);
        setBusinessHours(initializeBusinessHours());
        setLoading(false);
      }
    };
    
    fetchBusinessHours();
  }, [selectedBusiness]);
  
  const handleSelectBusiness = (business) => {
    setSelectedBusiness(business);
    setError(null);
    setSuccess(null);
  };
  
  const toggleDayClosed = (dayIndex) => {
    const updatedHours = [...businessHours];
    updatedHours[dayIndex].is_closed = !updatedHours[dayIndex].is_closed;
    if (updatedHours[dayIndex].is_closed) {
      updatedHours[dayIndex].time_periods = [];
    }
    
    setBusinessHours(updatedHours);
  };
  
  const openAddTimePeriodModal = (dayIndex) => {
    setEditingDay(dayIndex);
    setNewTimePeriod({
      start_time: '',
      end_time: '',
      period_name: ''
    });
    setShowTimePeriodModal(true);
  };
  
  const addTimePeriod = () => {
    if (!newTimePeriod.start_time || !newTimePeriod.end_time) {
      setError('Please enter both start and end time.');
      return;
    }
    if (newTimePeriod.start_time >= newTimePeriod.end_time) {
      setError('Start time must be before end time.');
      return;
    }
    const updatedHours = [...businessHours];
    const dayHours = updatedHours[editingDay];
    
    const hasOverlap = dayHours.time_periods.some(period => {
      return (newTimePeriod.start_time < period.end_time && 
              newTimePeriod.end_time > period.start_time);
    });
    if (hasOverlap) {
      setError('Time periods cannot overlap.');
      return;
    }
    dayHours.time_periods.push({
      ...newTimePeriod,
      id: null 
    });
    dayHours.time_periods.sort((a, b) => a.start_time.localeCompare(b.start_time));
    setBusinessHours(updatedHours);
    setShowTimePeriodModal(false);
    setError(null);
  };

  const removeTimePeriod = (dayIndex, periodIndex) => {
    const updatedHours = [...businessHours];
    updatedHours[dayIndex].time_periods.splice(periodIndex, 1);
    setBusinessHours(updatedHours);
  };
  
  const applyTemplate = (template) => {
    let updatedHours = [...businessHours];
    switch (template) {
      case 'weekdays_9_5':
        updatedHours = updatedHours.map((day, index) => ({
          ...day,
          is_closed: index >= 5, 
          time_periods: index < 5 ? [{
            start_time: '09:00',
            end_time: '17:00',
            period_name: 'Full Day',
            id: null
          }] : []
        }));
        break;
      case 'split_schedule':
        updatedHours = updatedHours.map((day, index) => ({
          ...day,
          is_closed: index === 6, 
          time_periods: index < 5 ? [
            {
              start_time: '09:00',
              end_time: '14:00',
              period_name: 'Morning',
              id: null
            },
            {
              start_time: '17:00',
              end_time: '21:00',
              period_name: 'Evening',
              id: null
            }
          ] : index === 5 ? [
            {
              start_time: '10:00',
              end_time: '17:00',
              period_name: 'Saturday Hours',
              id: null
            }
          ] : []
        }));
        break; 
      case 'clear_all':
        updatedHours = initializeBusinessHours();
        break;
    }
    setBusinessHours(updatedHours);
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedBusiness) {
      setError('No business selected');
      return;
    }
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);
      const hoursData = businessHours.map(dayHours => ({
        day: dayHours.day,
        is_closed: dayHours.is_closed,
        time_periods: dayHours.is_closed ? [] : dayHours.time_periods.map(period => ({
          start_time: period.start_time,
          end_time: period.end_time,
          period_name: period.period_name || ''
        }))
      }));
      console.log('Saving business hours:', hoursData);
      await businessService.bulkUpdateBusinessHours(selectedBusiness.id, hoursData);
      const updatedHours = await businessService.getBusinessHours(selectedBusiness.id);
      if (updatedHours && updatedHours.length > 0) {
        const initialHours = initializeBusinessHours();
        const mergedHours = initialHours.map(dayStructure => {
          const existingDay = updatedHours.find(h => h.day === dayStructure.day);
          if (existingDay) {
            return {
              ...dayStructure,
              id: existingDay.id,
              is_closed: existingDay.is_closed,
              time_periods: existingDay.time_periods || []
            };
          }
          return dayStructure;
        });
        setBusinessHours(mergedHours);
      }
      setSuccess('Business hours saved successfully!');
      setSaving(false); 
    } catch (err) {
      console.error('Error saving business hours:', err);
      setError('Failed to save business hours. Please try again.');
      setSaving(false);
    }
  };
  
  const renderTimePeriod = (period, dayIndex, periodIndex) => (
    <Badge 
      key={periodIndex} 
      bg="primary" 
      className="me-2 mb-1 d-inline-flex align-items-center"
      style={{ fontSize: '0.9rem', padding: '0.5rem 0.75rem' }}
    >
      <span className="me-2">
        {period.period_name && `${period.period_name}: `}
        {period.start_time} - {period.end_time}
      </span>
      <Button
        variant="link"
        size="sm"
        className="p-0 text-white"
        onClick={() => removeTimePeriod(dayIndex, periodIndex)}
        style={{ fontSize: '0.8rem' }}
      >
        <FaTrash />
      </Button>
    </Badge>
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
          <p>You need to create a business first before setting business hours.</p>
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
        <h1>
          <FaClock className="me-2" />
          Business Hours Management
        </h1>
        <Button variant="outline-secondary" onClick={() => navigate('/business/dashboard')}>
          Back to Dashboard
        </Button>
      </div>
      
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
      
      {/* Business Selection */}
      {businesses.length > 1 && (
        <Card className="mb-4">
          <Card.Body>
            <h5>Select Business:</h5>
            <div className="d-flex flex-wrap gap-2">
              {businesses.map(business => (
                <Button
                  key={business.id}
                  variant={selectedBusiness?.id === business.id ? "primary" : "outline-primary"}
                  onClick={() => handleSelectBusiness(business)}
                >
                  {business.name}
                </Button>
              ))}
            </div>
          </Card.Body>
        </Card>
      )}
      
      {selectedBusiness && (
        <Card className="shadow-sm">
          <Card.Header>
            <div className="d-flex justify-content-between align-items-center">
              <h5 className="mb-0">Business Hours for {selectedBusiness.name}</h5>
              <div className="d-flex gap-2">
                <Button variant="outline-secondary" size="sm" onClick={() => applyTemplate('weekdays_9_5')}>
                  Weekdays 9-5
                </Button>
                <Button variant="outline-secondary" size="sm" onClick={() => applyTemplate('split_schedule')}>
                  Split Schedule (9AM-2PM, 5PM-9PM)
                </Button>
                <Button variant="outline-danger" size="sm" onClick={() => applyTemplate('clear_all')}>
                  Clear All
                </Button>
              </div>
            </div>
          </Card.Header>
          <Card.Body>
            <Alert variant="info" className="mb-4">
              You can now set multiple time periods per day! 
              For example: Monday 9AM-2PM & 5PM-9PM.
            </Alert>
            
            <Form onSubmit={handleSubmit}>
              <Table responsive className="business-hours-table">
                <thead>
                  <tr>
                    <th style={{ width: '150px' }}>Day</th>
                    <th>Time Periods</th>
                    <th style={{ width: '100px' }}>Closed</th>
                    <th style={{ width: '120px' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {businessHours.map((dayHours, dayIndex) => (
                    <tr key={dayHours.day}>
                      <td>
                        <strong>{dayHours.day_name}</strong>
                      </td>
                      <td>
                        {dayHours.is_closed ? (
                          <Badge bg="secondary">Closed</Badge>
                        ) : dayHours.time_periods.length === 0 ? (
                          <span className="text-muted">No time periods set</span>
                        ) : (
                          <div>
                            {dayHours.time_periods.map((period, periodIndex) => 
                              renderTimePeriod(period, dayIndex, periodIndex)
                            )}
                          </div>
                        )}
                      </td>
                      <td className="text-center">
                        <Form.Check
                          type="switch"
                          checked={dayHours.is_closed}
                          onChange={() => toggleDayClosed(dayIndex)}
                        />
                      </td>
                      <td>
                        {!dayHours.is_closed && (
                          <Button
                            variant="outline-primary"
                            size="sm"
                            onClick={() => openAddTimePeriodModal(dayIndex)}
                          >
                            <FaPlus className="me-1" />
                            Add Period
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
              
              <div className="d-flex justify-content-end gap-2 mt-4">
                <Button
                  variant="secondary"
                  onClick={() => navigate('/business/dashboard')}
                  disabled={saving}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  type="submit"
                  disabled={saving}
                >
                  {saving ? 'Saving...' : 'Save Business Hours'}
                </Button>
              </div>
            </Form>
          </Card.Body>
        </Card>
      )}
      
      {/* Add Time Period Modal */}
      <Modal show={showTimePeriodModal} onHide={() => setShowTimePeriodModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Add Time Period</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p className="text-muted mb-3">
            Add a time period for <strong>{editingDay !== null ? businessHours[editingDay]?.day_name : ''}</strong>
          </p>
          
          <Form>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Start Time *</Form.Label>
                  <Form.Control
                    type="time"
                    value={newTimePeriod.start_time}
                    onChange={(e) => setNewTimePeriod(prev => ({ ...prev, start_time: e.target.value }))}
                    required
                    lang="en-US"
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>End Time *</Form.Label>
                  <Form.Control
                    type="time"
                    value={newTimePeriod.end_time}
                    onChange={(e) => setNewTimePeriod(prev => ({ ...prev, end_time: e.target.value }))}
                    required
                    lang="en-US"
                  />
                </Form.Group>
              </Col>
            </Row>
            
            <Form.Group className="mb-3">
              <Form.Label>Period Name (Optional)</Form.Label>
              <Form.Control
                type="text"
                placeholder="e.g., Morning, Afternoon, Evening"
                value={newTimePeriod.period_name}
                onChange={(e) => setNewTimePeriod(prev => ({ ...prev, period_name: e.target.value }))}
              />
              <Form.Text className="text-muted">
                Give this time period a name to help identify it
              </Form.Text>
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowTimePeriodModal(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={addTimePeriod}>
            Add Time Period
          </Button>
        </Modal.Footer>
      </Modal>
      
      {/* Custom Styles */}
      <style jsx>{`
        .business-hours-table th {
          background-color: #f8f9fa;
          border-top: none;
          font-weight: 600;
        }
        
        .business-hours-table td {
          vertical-align: middle;
          padding: 1rem 0.75rem;
        }
        
        .badge-time-period {
          font-size: 0.85rem !important;
          padding: 0.5rem 0.75rem !important;
        }
        
        .time-period-remove {
          background: none !important;
          border: none !important;
          color: white !important;
          padding: 0 !important;
          margin-left: 0.5rem !important;
        }
        
        .time-period-remove:hover {
          color: #ffcccc !important;
        }
      `}</style>
    </Container>
  );
};

export default BusinessHours;