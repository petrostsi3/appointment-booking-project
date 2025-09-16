import React, { useState, useEffect } from 'react';
import { Container, Card, Table, Button, Badge, Modal, Form, Alert } from 'react-bootstrap';
import { FaEye, FaCheck, FaTimes, FaMerge } from 'react-icons/fa';


const AdminCategoryRequests = () => {
  const [requests, setRequests] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [reviewForm, setReviewForm] = useState({
    action: '',
    admin_notes: '',
    new_category_name: '',
    new_category_description: '',
    new_category_icon: 'fas fa-store',
    new_category_color: '#007bff',
    merge_with_category: ''});

  const statusColors = {
    'pending': 'warning',
    'approved': 'success', 
    'rejected': 'danger',
    'merged': 'info'
  };

  const handleReviewRequest = (request) => {
    setSelectedRequest(request);
    setReviewForm({
      action: '',
      admin_notes: '',
      new_category_name: request.requested_category_name,
      new_category_description: request.requested_description,
      new_category_icon: 'fas fa-store',
      new_category_color: '#007bff',
      merge_with_category: ''
    });
    setShowReviewModal(true);
  };

  const handleSubmitReview = async () => {
    console.log('Submitting review:', reviewForm);
    setShowReviewModal(false);
  };

  return (
    <Container className="py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>Category Requests</h1>
        <Badge bg="primary">{requests.filter(r => r.status === 'pending').length} pending</Badge>
      </div>

      <Card>
        <Card.Body>
          <Table responsive hover>
            <thead>
              <tr>
                <th>Business</th>
                <th>Requested Category</th>
                <th>Requested By</th>
                <th>Date</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {requests.map(request => (
                <tr key={request.id}>
                  <td>{request.business_name}</td>
                  <td>
                    <strong>{request.requested_category_name}</strong>
                    <br />
                    <small className="text-muted">{request.requested_description}</small>
                  </td>
                  <td>{request.requested_by.first_name} {request.requested_by.last_name}</td>
                  <td>{new Date(request.created_at).toLocaleDateString()}</td>
                  <td>
                    <Badge bg={statusColors[request.status]}>
                      {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                    </Badge>
                  </td>
                  <td>
                    {request.status === 'pending' && (
                      <Button
                        variant="outline-primary"
                        size="sm"
                        onClick={() => handleReviewRequest(request)}
                      >
                        <FaEye className="me-1" />
                        Review
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Card.Body>
      </Card>

      {/* Review Modal */}
      <Modal show={showReviewModal} onHide={() => setShowReviewModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Review Category Request</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedRequest && (
            <div>
              <Alert variant="info">
                <h6>Request Details:</h6>
                <p><strong>Business:</strong> {selectedRequest.business_name}</p>
                <p><strong>Category:</strong> {selectedRequest.requested_category_name}</p>
                <p><strong>Description:</strong> {selectedRequest.requested_description}</p>
                <p><strong>Services:</strong> {selectedRequest.service_examples}</p>
              </Alert>

              <Form>
                <Form.Group className="mb-3">
                  <Form.Label>Action</Form.Label>
                  <Form.Select
                    value={reviewForm.action}
                    onChange={(e) => setReviewForm(prev => ({ ...prev, action: e.target.value }))}
                  >
                    <option value="">Select action...</option>
                    <option value="approve">Approve - Create New Category</option>
                    <option value="merge">Merge with Existing Category</option>
                    <option value="reject">Reject Request</option>
                  </Form.Select>
                </Form.Group>

                {reviewForm.action === 'approve' && (
                  <>
                    <Form.Group className="mb-3">
                      <Form.Label>Category Name</Form.Label>
                      <Form.Control
                        type="text"
                        value={reviewForm.new_category_name}
                        onChange={(e) => setReviewForm(prev => ({ ...prev, new_category_name: e.target.value }))}
                      />
                    </Form.Group>
                    <Form.Group className="mb-3">
                      <Form.Label>Icon Class</Form.Label>
                      <Form.Control
                        type="text"
                        value={reviewForm.new_category_icon}
                        onChange={(e) => setReviewForm(prev => ({ ...prev, new_category_icon: e.target.value }))}
                        placeholder="e.g., fas fa-store"
                      />
                    </Form.Group>
                    <Form.Group className="mb-3">
                      <Form.Label>Color</Form.Label>
                      <Form.Control
                        type="color"
                        value={reviewForm.new_category_color}
                        onChange={(e) => setReviewForm(prev => ({ ...prev, new_category_color: e.target.value }))}
                      />
                    </Form.Group>
                  </>
                )}

                {reviewForm.action === 'merge' && (
                  <Form.Group className="mb-3">
                    <Form.Label>Merge with Category</Form.Label>
                    <Form.Select
                      value={reviewForm.merge_with_category}
                      onChange={(e) => setReviewForm(prev => ({ ...prev, merge_with_category: e.target.value }))}
                    >
                      <option value="">Select existing category...</option>
                      {categories.map(cat => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                )}

                <Form.Group className="mb-3">
                  <Form.Label>Admin Notes</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    value={reviewForm.admin_notes}
                    onChange={(e) => setReviewForm(prev => ({ ...prev, admin_notes: e.target.value }))}
                    placeholder="Internal notes about this decision..."
                  />
                </Form.Group>
              </Form>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowReviewModal(false)}>
            Cancel
          </Button>
          <Button 
            variant="primary" 
            onClick={handleSubmitReview}
            disabled={!reviewForm.action}
          >
            Submit Review
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default AdminCategoryRequests;