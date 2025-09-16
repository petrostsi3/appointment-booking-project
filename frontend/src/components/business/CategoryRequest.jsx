import React, { useState } from 'react';
import { Modal, Form, Button, Alert, Row, Col } from 'react-bootstrap';
import businessService from '../../services/businesses';


const CategoryRequest = ({ show, onHide, onSuccess }) => {
  const [formData, setFormData] = useState({
    business_name: '',
    requested_category_name: '',
    requested_description: '', 
    service_examples: ''});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const handleChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.business_name.trim() || !formData.requested_category_name.trim()) {
      setError('Please fill in all required fields');
      return;
    }
    try {
      setLoading(true);
      setError('');
      await businessService.requestCategory(formData);
      onSuccess();
      onHide();
    } catch (err) {
      setError('Failed to submit category request. Please try again.');
      setLoading(false);
    }
  };
  const resetForm = () => {
    setFormData({
      business_name: '',
      requested_category_name: '',
      requested_description: '',
      service_examples: ''
    });
    setError('');
  };
  return (
    <Modal show={show} onHide={onHide} size="lg" onExited={resetForm}>
      <Modal.Header closeButton>
        <Modal.Title>
          <i className="fas fa-plus-circle me-2 text-primary"></i>
          Request New Business Category
        </Modal.Title>
      </Modal.Header>
      
      <Modal.Body>
        <Alert variant="info" className="mb-4">
          <h6>📝 Help us expand our categories!</h6>
          <p className="mb-0">
            Can't find a category that fits your business? Request a new one! 
            Our team will review your request and may add it for all users.
          </p>
        </Alert>

        {error && (
          <Alert variant="danger" onClose={() => setError('')} dismissible>
            {error}
          </Alert>
        )}

        <Form onSubmit={handleSubmit}>
          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Your Business Name *</Form.Label>
                <Form.Control
                  type="text"
                  name="business_name"
                  value={formData.business_name}
                  onChange={handleChange}
                  placeholder="e.g., Mike's Mobile Car Wash"
                  required
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Requested Category Name *</Form.Label>
                <Form.Control
                  type="text"
                  name="requested_category_name"
                  value={formData.requested_category_name}
                  onChange={handleChange}
                  placeholder="e.g., Mobile Car Wash"
                  required
                />
              </Form.Group>
            </Col>
          </Row>

          <Form.Group className="mb-3">
            <Form.Label>Category Description *</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              name="requested_description"
              value={formData.requested_description}
              onChange={handleChange}
              placeholder="Describe what types of businesses would fit in this category..."
              required
            />
          </Form.Group>

          <Form.Group className="mb-4">
            <Form.Label>Examples of Services You Provide *</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              name="service_examples"
              value={formData.service_examples}
              onChange={handleChange}
              placeholder="e.g., Car washing, interior cleaning, waxing, detailing..."
              required
            />
            <Form.Text className="text-muted">
              Help us understand what services this category would include
            </Form.Text>
          </Form.Group>

          <Alert variant="warning" className="mb-4">
            <h6>⏱️ What happens next?</h6>
            <ul className="mb-0">
              <li>Your business will be temporarily listed under "Other Services"</li>
              <li>Our team will review your category request within 2-3 business days</li>
              <li>If approved, the new category will be available for all businesses</li>
              <li>You'll receive an email notification about the decision</li>
            </ul>
          </Alert>

          <div className="d-flex justify-content-end gap-2">
            <Button variant="secondary" onClick={onHide} disabled={loading}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={loading}>
              {loading ? 'Submitting...' : 'Submit Request'}
            </Button>
          </div>
        </Form>
      </Modal.Body>
    </Modal>
  );
};

export default CategoryRequest;