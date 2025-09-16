import React, { useState, useEffect } from 'react';
import { Container, Table, Button, Form, Modal, Spinner, Alert, Badge, Card } from 'react-bootstrap';
import { FaEdit, FaTrash, FaEye } from 'react-icons/fa';
import businessService from '../../services/businesses';


const BusinessManagement = () => {
  const [businesses, setBusinesses] = useState([]);
  const [filteredBusinesses, setFilteredBusinesses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedBusiness, setSelectedBusiness] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchBusinesses = async () => {
      try {
        setLoading(true);
        const data = await businessService.getAllBusinesses();
        setBusinesses(data);
        setFilteredBusinesses(data);
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
    if (!searchTerm) {
      setFilteredBusinesses(businesses);
      return;
    }
    
    const term = searchTerm.toLowerCase();
    const filtered = businesses.filter(business => 
      business.name.toLowerCase().includes(term) ||
      (business.description && business.description.toLowerCase().includes(term)) ||
      (business.address && business.address.toLowerCase().includes(term)) ||
      (business.owner_details && 
        (business.owner_details.username.toLowerCase().includes(term) ||
         business.owner_details.email.toLowerCase().includes(term)))
    );
    
    setFilteredBusinesses(filtered);
  }, [businesses, searchTerm]);

  const handleViewBusiness = (business) => {
    setSelectedBusiness(business);
    setShowViewModal(true);
  };

  const handleDeleteBusiness = async (businessId) => {
    if (!window.confirm('Are you sure you want to delete this business?')) {
      return;
    }
    
    try {
      setLoading(true);
      
      await businessService.deleteBusiness(businessId);
      
      setBusinesses(prev => prev.filter(business => business.id !== businessId));
      
      setLoading(false);
    } catch (err) {
      console.error('Error deleting business:', err);
      setError('Failed to delete business. Please try again.');
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

  return (
    <Container className="py-4">
      <h1 className="mb-4">Business Management</h1>
      
      {error && (
        <Alert variant="danger" onClose={() => setError(null)} dismissible>
          {error}
        </Alert>
      )}
      
      <div className="mb-4">
        <Form.Control
          type="text"
          placeholder="Search businesses..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ maxWidth: '400px' }}
        />
      </div>
      
      <Table responsive striped hover>
        <thead>
          <tr>
            <th>Name</th>
            <th>Owner</th>
            <th>Contact</th>
            <th>Services</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredBusinesses.map(business => (
            <tr key={business.id}>
              <td>{business.name}</td>
              <td>
                {business.owner_details ? 
                  `${business.owner_details.first_name} ${business.owner_details.last_name}` : 
                  'Unknown'}
              </td>
              <td>
                {business.email || business.phone ? (
                  <>
                    {business.email && <div>{business.email}</div>}
                    {business.phone && <div>{business.phone}</div>}
                  </>
                ) : (
                  <span className="text-muted">No contact info</span>
                )}
              </td>
              <td>
                <Badge bg="info">{business.services?.length || 0} services</Badge>
              </td>
              <td>
                <Button
                  variant="outline-info"
                  size="sm"
                  className="me-2"
                  onClick={() => handleViewBusiness(business)}
                >
                  <FaEye />
                </Button>
                <Button
                  variant="outline-danger"
                  size="sm"
                  onClick={() => handleDeleteBusiness(business.id)}
                >
                  <FaTrash />
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>
      
      {filteredBusinesses.length === 0 && (
        <Alert variant="info">No businesses found matching your search criteria.</Alert>
      )}
      
      {/* View Business Modal */}
      <Modal 
        show={showViewModal} 
        onHide={() => setShowViewModal(false)}
        size="lg"
      >
        <Modal.Header closeButton>
          <Modal.Title>Business Details</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedBusiness && (
            <div>
              <div className="d-flex mb-4">
                {selectedBusiness.logo_url && (
                  <div className="me-3">
                    <img 
                      src={selectedBusiness.logo_url} 
                      alt={selectedBusiness.name} 
                      className="img-thumbnail" 
                      style={{ maxWidth: '150px' }} 
                    />
                  </div>
                )}
                <div>
                  <h4>{selectedBusiness.name}</h4>
                  <p className="text-muted">
                    Owner: {selectedBusiness.owner_details ? 
                     `${selectedBusiness.owner_details.first_name} ${selectedBusiness.owner_details.last_name}` : 
                     'Unknown'}
                  </p>
                  <p>{selectedBusiness.description}</p>
                </div>
              </div>
              
              <h5>Contact Information</h5>
              <p>
                {selectedBusiness.address && (
                  <div>Address: {selectedBusiness.address}</div>
                )}
                {selectedBusiness.phone && (
                  <div>Phone: {selectedBusiness.phone}</div>
                )}
                {selectedBusiness.email && (
                  <div>Email: {selectedBusiness.email}</div>
                )}
              </p>
              
              <h5>Services</h5>
              {selectedBusiness.services?.length > 0 ? (
                <div className="row">
                  {selectedBusiness.services.map(service => (
                    <div key={service.id} className="col-md-6 mb-3">
                      <Card>
                        <Card.Body>
                          <Card.Title>{service.name}</Card.Title>
                          <Card.Text>{service.description}</Card.Text>
                          <div className="d-flex justify-content-between">
                            <span>Duration: {service.duration} min</span>
                            <span className="fw-bold">€{service.price}</span>
                          </div>
                        </Card.Body>
                      </Card>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted">No services listed.</p>
              )}
              
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowViewModal(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default BusinessManagement;