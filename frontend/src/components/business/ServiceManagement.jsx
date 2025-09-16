import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert, Spinner, Table, Modal } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { FaEdit, FaTrash, FaPlus, FaEye } from 'react-icons/fa';
import businessService from '../../services/businesses';


const ServiceManagement = () => {
  const [businesses, setBusinesses] = useState([]);
  const [selectedBusiness, setSelectedBusiness] = useState(null);
  const [services, setServices] = useState([]);
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const [serviceForm, setServiceForm] = useState({
    name: '',
    description: '',
    duration: 60,
    price: 0,
    is_active: true});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null); 
  const navigate = useNavigate();
  useEffect(() => {
    const fetchBusinesses = async () => {
      try {
        setLoading(true);
        console.log('=== SERVICE MANAGEMENT: FETCHING BUSINESSES ===');
        const userBusinesses = await businessService.getMyBusinesses();
        console.log('ServiceManagement: User businesses:', userBusinesses);
        setBusinesses(Array.isArray(userBusinesses) ? userBusinesses : []);
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
    const fetchServices = async () => {
      try {
        setLoading(true);
        setError(null);
        console.log('--- FETCHING SERVICES FOR BUSINESS ---');
        console.log('Selected business:', selectedBusiness);
        if (selectedBusiness.services && Array.isArray(selectedBusiness.services)) {
          console.log('ServiceManagement: Using services from business object:', selectedBusiness.services);
          setServices(selectedBusiness.services);
          setLoading(false);
          return;
        }
        
        // Fetch services via API
        try {
          const servicesData = await businessService.getBusinessServices(selectedBusiness.id);
          console.log('ServiceManagement: Services from API:', servicesData);
          setServices(Array.isArray(servicesData) ? servicesData : []);
        } catch (serviceError) {
          console.log('ServiceManagement: Error fetching services via API:', serviceError);
          
          // Fallback - get fresh business data with services
          try {
            const businessDetails = await businessService.getBusinessById(selectedBusiness.id);
            console.log('ServiceManagement: Fresh business details:', businessDetails); 
            if (businessDetails.services && Array.isArray(businessDetails.services)) {
              setServices(businessDetails.services);
            } else {
              setServices([]);
            }
          } catch (businessError) {
            console.log('ServiceManagement: Error fetching business details:', businessError);
            setServices([]);
          }
        }
        setLoading(false);
      } catch (err) {
        console.error('Error in fetchServices:', err);
        setServices([]);
        setLoading(false);
      }
    };
    
    fetchServices();
  }, [selectedBusiness]);
  
  const handleSelectBusiness = (business) => {
    console.log('=== SELECTING BUSINESS FOR SERVICES ===');
    console.log('Selected business:', business);
    setSelectedBusiness(business);
    setError(null);
    setSuccess(null);
  };
  
  const handleAddService = () => {
    setEditingService(null);
    setServiceForm({
      name: '',
      description: '',
      duration: 60,
      price: 0,
      is_active: true
    });
    setShowServiceModal(true);
  };
  
  const handleEditService = (service) => {
    console.log('=== EDITING SERVICE ===');
    console.log('Service to edit:', service);
    setEditingService(service);
    setServiceForm({
      name: service.name,
      description: service.description || '',
      duration: service.duration,
      price: service.price,
      is_active: service.is_active
    });
    setShowServiceModal(true);
  };
  
  const handleServiceFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setServiceForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };
  
  const handleServiceSubmit = async (e) => {
    e.preventDefault();
    if (!serviceForm.name.trim()) {
      setError('Service name is required');
      return;
    }
    if (serviceForm.duration <= 0) {
      setError('Duration must be greater than 0');
      return;
    }
    if (serviceForm.price < 0) {
      setError('Price cannot be negative');
      return;
    }
    try {
      setLoading(true);
      setError(null);
      console.log('=== SAVING SERVICE ===');
      console.log('Service form data:', serviceForm);
      console.log('Editing service:', editingService);
      console.log('Selected business:', selectedBusiness);
      let result;
      if (editingService) {
        console.log('Updating service with ID:', editingService.id);
        result = await businessService.updateService(
          selectedBusiness.id,
          editingService.id,
          serviceForm
        );
        setSuccess('Service updated successfully!');
        setServices(prev => 
          prev.map(service => 
            service.id === editingService.id ? result : service
          )
        );
      } else {
        console.log('Creating new service...');
        result = await businessService.createService(
          selectedBusiness.id,
          serviceForm
        );
        setSuccess('Service created successfully!');
        
        setServices(prev => [...prev, result]);
      }
      console.log('Service operation result:', result);
      setShowServiceModal(false);
      setLoading(false);
    } catch (err) {
      console.error('Error saving service:', err);
      console.error('Error response:', err.response?.data);
      setError('Failed to save service. Please try again.');
      setLoading(false);
    }
  };
  
  const handleDeleteService = async (serviceId) => {
    if (!window.confirm('Are you sure you want to delete this service?')) {
      return;
    }
    try {
      setLoading(true);
      console.log('=== DELETING SERVICE ===');
      console.log('Service ID:', serviceId);
      console.log('Business ID:', selectedBusiness.id);
      await businessService.deleteService(selectedBusiness.id, serviceId);
      setServices(prev => prev.filter(service => service.id !== serviceId));
      setSuccess('Service deleted successfully!');
      setLoading(false);
    } catch (err) {
      console.error('Error deleting service:', err);
      setError('Failed to delete service. Please try again.');
      setLoading(false);
    }
  };

  const handleRefreshServices = async () => {
    if (!selectedBusiness) return;
    try {
      setLoading(true);
      const businessDetails = await businessService.getBusinessById(selectedBusiness.id);
      if (businessDetails.services && Array.isArray(businessDetails.services)) {
        setServices(businessDetails.services);
        setSuccess('Services refreshed successfully!');
      }
      setLoading(false);
    } catch (err) {
      console.error('Error refreshing services:', err);
      setError('Failed to refresh services.');
      setLoading(false);
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
            You don't have any business registered yet. Create your first business to manage services.
          </p>
          <Button variant="primary" onClick={() => navigate('/business/profile')}>
            Create Business
          </Button>
        </Alert>
      </Container>
    );
  }
  
  return (
    <Container className="py-4">
      <h1 className="mb-4">Service Management</h1>
      
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
        <div className="mb-4">
          <h5>Select Business:</h5>
          <div className="d-flex flex-wrap gap-2">
            {businesses.map(business => (
              <Button
                key={business.id}
                variant={selectedBusiness?.id === business.id ? "primary" : "outline-primary"}
                onClick={() => handleSelectBusiness(business)}
                className="mb-2"
              >
                {business.name}
              </Button>
            ))}
          </div>
        </div>
      )}
      
      {selectedBusiness && (
        <Card className="shadow-sm">
          <Card.Header>
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <h5 className="mb-0">Services for {selectedBusiness.name}</h5>
                <small className="text-muted">
                  {services.length} service{services.length !== 1 ? 's' : ''} found
                </small>
              </div>
              <div className="d-flex gap-2">
                <Button 
                  variant="outline-secondary" 
                  size="sm"
                  onClick={handleRefreshServices}
                  disabled={loading}
                >
                  Refresh
                </Button>
                <Button variant="primary" onClick={handleAddService}>
                  <FaPlus className="me-2" />
                  Add Service
                </Button>
              </div>
            </div>
          </Card.Header>
          <Card.Body>
            {loading ? (
              <div className="text-center py-3">
                <Spinner animation="border" role="status">
                  <span className="visually-hidden">Loading...</span>
                </Spinner>
              </div>
            ) : services.length === 0 ? (
              <Alert variant="info">
                <h6>No services found</h6>
                <p className="mb-3">
                  This business doesn't have any services yet. Add your first service to start accepting appointments.
                </p>
                <Button variant="primary" onClick={handleAddService}>
                  <FaPlus className="me-2" />
                  Add Your First Service
                </Button>
              </Alert>
            ) : (
              <Table responsive hover>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Description</th>
                    <th>Duration</th>
                    <th>Price</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {services.map(service => (
                    <tr key={service.id}>
                      <td>
                        <strong>{service.name}</strong>
                      </td>
                      <td>
                        {service.description ? (
                          service.description.length > 50 ? 
                            `${service.description.substring(0, 50)}...` : 
                            service.description
                        ) : (
                          <span className="text-muted">No description</span>
                        )}
                      </td>
                      <td>{service.duration} min</td>
                      <td>€{parseFloat(service.price).toFixed(2)}</td>
                      <td>
                        <span className={`badge bg-${service.is_active ? 'success' : 'secondary'}`}>
                          {service.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td>
                        <div className="d-flex gap-1">
                          <Button 
                            variant="outline-primary" 
                            size="sm"
                            onClick={() => handleEditService(service)}
                            title="Edit Service"
                          >
                            <FaEdit />
                          </Button>
                          <Button 
                            variant="outline-danger" 
                            size="sm"
                            onClick={() => handleDeleteService(service.id)}
                            title="Delete Service"
                          >
                            <FaTrash />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            )}
          </Card.Body>
        </Card>
      )}
      
      {/* Service Modal */}
      <Modal show={showServiceModal} onHide={() => setShowServiceModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>{editingService ? 'Edit Service' : 'Add New Service'}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleServiceSubmit}>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3" controlId="serviceName">
                  <Form.Label>Service Name*</Form.Label>
                  <Form.Control
                    type="text"
                    name="name"
                    value={serviceForm.name}
                    onChange={handleServiceFormChange}
                    required
                    placeholder="Enter service name"
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3" controlId="servicePrice">
                  <Form.Label>Price (€)*</Form.Label>
                  <Form.Control
                    type="number"
                    name="price"
                    value={serviceForm.price}
                    onChange={handleServiceFormChange}
                    min="0"
                    step="0.01"
                    required
                    placeholder="0.00"
                  />
                </Form.Group>
              </Col>
            </Row>
            
            <Form.Group className="mb-3" controlId="serviceDescription">
              <Form.Label>Description</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                name="description"
                value={serviceForm.description}
                onChange={handleServiceFormChange}
                placeholder="Describe the service"
              />
            </Form.Group>
            
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3" controlId="serviceDuration">
                  <Form.Label>Duration (minutes)*</Form.Label>
                  <Form.Control
                    type="number"
                    name="duration"
                    value={serviceForm.duration}
                    onChange={handleServiceFormChange}
                    min="1"
                    required
                    placeholder="60"
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3" controlId="serviceIsActive">
                  <Form.Label>&nbsp;</Form.Label>
                  <div>
                    <Form.Check
                      type="checkbox"
                      label="Active (Available for booking)"
                      name="is_active"
                      checked={serviceForm.is_active}
                      onChange={handleServiceFormChange}
                    />
                  </div>
                </Form.Group>
              </Col>
            </Row>
            
            <div className="d-flex justify-content-end gap-2">
              <Button 
                variant="secondary" 
                onClick={() => setShowServiceModal(false)}
              >
                Cancel
              </Button>
              <Button 
                variant="primary" 
                type="submit" 
                disabled={loading}
              >
                {loading ? 'Saving...' : editingService ? 'Update Service' : 'Create Service'}
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>
    </Container>
  );
};

export default ServiceManagement;