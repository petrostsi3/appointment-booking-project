import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert, Spinner, Modal, Badge } from 'react-bootstrap';
import { useNavigate, useSearchParams } from 'react-router-dom';
import businessService from '../../services/businesses';
import categoryService from '../../services/categories'; 
import apiClient from '../../services/api';


const CategoryRequestModal = ({ show, onHide, onSuccess }) => {
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
      // API call to request category
      await apiClient.post('/api/businesses/request_category/', formData);
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

const BusinessProfile = () => {
  const [businesses, setBusinesses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedBusiness, setSelectedBusiness] = useState(null);
  const [mode, setMode] = useState('list'); 
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    address: '',
    phone: '',
    email: '',
    category: ''});
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [businessToDelete, setBusinessToDelete] = useState(null);
  const [showCategoryRequestModal, setShowCategoryRequestModal] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editBusinessId = searchParams.get('edit');
  
  // FIX 12/08/2025: Fetch categories on component mount
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        console.log('Fetching categories...');
        // FIX 12/08/2025: Use category service instead of business service
        const categoriesData = await categoryService.getAllCategories();
        console.log('Categories received:', categoriesData);
        // FIX 12/08/2025: Handle different response formats more robustly
        let categoriesArray = [];
        if (Array.isArray(categoriesData)) {
          categoriesArray = categoriesData;
        } else if (categoriesData && Array.isArray(categoriesData.results)) {
          categoriesArray = categoriesData.results;
        } else if (categoriesData && typeof categoriesData === 'object') {
          categoriesArray = [categoriesData];
        } else {
          console.warn('Unexpected categories format, trying business service fallback...');
          // FALLBACK: Try business service as backup
          try {
            const fallbackCategories = await businessService.getAllCategories();
            categoriesArray = Array.isArray(fallbackCategories) ? fallbackCategories : 
                             fallbackCategories?.results || [];
          } catch (fallbackError) {
            console.error('Fallback category fetch also failed:', fallbackError);
            categoriesArray = [];
          }
        }
        console.log('Final categories array:', categoriesArray);
        setCategories(categoriesArray);
      } catch (err) {
        console.error('Error fetching categories:', err);
        console.error('Error details:', err.response?.data);
        
        // FIX 12/08/2025: Set empty array on error and show user-friendly message
        setCategories([]);
        if (!error) { // Don't override existing errors
          setError('Unable to load business categories. You can still create your business, but category selection may be limited.');
        }
      }
    };
    
    fetchCategories();
  }, []);

  useEffect(() => {
    const fetchBusinesses = async () => {
      try {
        setLoading(true);
        console.log('=== BUSINESS PROFILE: LOADING ===');
        console.log('Edit business ID from URL:', editBusinessId);
        const userBusinesses = await businessService.getMyBusinesses();
        console.log('User businesses:', userBusinesses);
        setBusinesses(userBusinesses);
        if (editBusinessId && userBusinesses.length > 0) {
          const businessToEdit = userBusinesses.find(b => b.id === parseInt(editBusinessId));
          if (businessToEdit) {
            console.log('Found business to edit:', businessToEdit);
            setSelectedBusiness(businessToEdit);
            setFormData({
              name: businessToEdit.name || '',
              description: businessToEdit.description || '',
              address: businessToEdit.address || '',
              phone: businessToEdit.phone || '',
              email: businessToEdit.email || '',
              category: businessToEdit.category || ''
            });
            setLogoPreview(businessToEdit.logo_url);
            setMode('edit');
          } else {
            setError('Business not found or you do not have permission to edit it.');
            setMode('list');
          }
        } else if (userBusinesses.length === 0) {
          setMode('create');
          resetForm();
        } else {
          setMode('list');
        }
        
        setLoading(false);
      } catch (err) {
        console.error('Error fetching businesses:', err);
        setError('Failed to load businesses. Please try again.');
        setLoading(false);
        setMode('list');
      }
    };
    
    fetchBusinesses();
  }, [editBusinessId]);
  
  const resetForm = () => {
    setSelectedBusiness(null);
    setFormData({
      name: '',
      description: '',
      address: '',
      phone: '',
      email: '',
      category: ''
    });
    setLogoFile(null);
    setLogoPreview(null);
  };
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // FIX: Handle category selection with "Other Services" logic
  const handleCategorySelection = (categoryId) => {
    const selectedCategory = getCategoryById(parseInt(categoryId));
    if (selectedCategory && selectedCategory.slug === 'other-services') {
      if (formData.name) {
        setShowCategoryRequestModal(true);
      } else {
        setError('Please enter your business name first before requesting a new category.');
        return;
      }
      return;
    }
    setFormData(prev => ({
      ...prev,
      category: categoryId
    }));
  };

  // FIX 12/08/2025: Handle successful category request
  const handleCategoryRequestSuccess = () => {
    const otherServicesCategory = categories.find(cat => cat.slug === 'other-services');
    if (otherServicesCategory) {
      setFormData(prev => ({
        ...prev,
        category: otherServicesCategory.id
      }));
    }
    setSuccess('Category request submitted! Your business will be listed under "Other Services" while we review your request. You\'ll receive an email notification within 2-3 business days.');
  };
  
  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setLogoFile(file);
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveLogo = () => {
    setLogoFile(null);
    setLogoPreview(null);
  };

  const handleCreateNew = () => {
    navigate('/business/profile');
    setMode('create');
    resetForm();
    setError(null);
    setSuccess(null);
  };
  
  const handleEditBusiness = (business) => {
    navigate(`/business/profile?edit=${business.id}`);
  };
  
  const handleBackToList = () => {
    navigate('/business/profile');
    setMode('list');
    resetForm();
    setError(null);
    setSuccess(null);
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      setError('Business name is required');
      return;
    }
    
    if (!formData.category) {
      setError('Please select a business category');
      return;
    }
    
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);
      console.log('=== SAVING BUSINESS ===');
      console.log('Mode:', mode);
      console.log('Form data:', formData);
      console.log('Logo file:', logoFile);
      let submitData; 
      if (logoFile) {
        submitData = new FormData();
        submitData.append('name', formData.name.trim());
        submitData.append('description', formData.description.trim());
        submitData.append('address', formData.address.trim());
        submitData.append('phone', formData.phone.trim());
        submitData.append('email', formData.email.trim());
        submitData.append('category', formData.category);
        submitData.append('logo', logoFile);
      } else {
        submitData = {
          name: formData.name.trim(),
          description: formData.description.trim(),
          address: formData.address.trim(),
          phone: formData.phone.trim(),
          email: formData.email.trim(),
          category: formData.category
        };
      }
      let result;
      if (mode === 'edit' && selectedBusiness) {
        console.log('Updating business ID:', selectedBusiness.id);
        result = await businessService.updateBusiness(selectedBusiness.id, submitData);
        setSuccess(`Business "${result.name}" updated successfully!`);
        setBusinesses(prev => 
          prev.map(business => 
            business.id === selectedBusiness.id ? result : business
          )
        );
        setSelectedBusiness(result);
        setLogoPreview(result.logo_url); 
      } else {
        console.log('Creating new business...');
        result = await businessService.createBusiness(submitData);
        setSuccess(`Business "${result.name}" created successfully!`);
        setBusinesses(prev => [...prev, result]);
        setSelectedBusiness(result);
        setMode('edit');
        setLogoPreview(result.logo_url);
        // Update URL to edit mode
        //navigate(`/business/profile?edit=${result.id}`, { replace: true });
      }
      setLogoFile(null);
      setSaving(false);
    } catch (err) {
      console.error('Error saving business:', err);
      let errorMessage = 'Failed to save business. ';
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
        errorMessage += err.message || 'Unknown error occurred.';
      }
      setError(errorMessage);
      setSaving(false);
    }
  };
  const handleDeleteBusiness = (business) => {
    setBusinessToDelete(business);
    setShowDeleteModal(true);
  };
  
  const confirmDeleteBusiness = async () => {
    if (!businessToDelete) return;
    
    try {
      setSaving(true);
      await businessService.deleteBusiness(businessToDelete.id);
      setBusinesses(prev => prev.filter(b => b.id !== businessToDelete.id));
      setSuccess(`Business "${businessToDelete.name}" deleted successfully!`);
      setShowDeleteModal(false);
      setBusinessToDelete(null);
      if (selectedBusiness && selectedBusiness.id === businessToDelete.id) {
        handleBackToList();
      }
      setSaving(false);
    } catch (err) {
      console.error('Error deleting business:', err);
      setError('Failed to delete business. Please try again.');
      setSaving(false);
    }
  };
  
  // FIX 12/08/2025: Get category details by ID with better error handling
  const getCategoryById = (categoryId) => {
    if (!Array.isArray(categories) || categories.length === 0) {
      console.warn('Categories not loaded or empty array');
      return null;
    }
    
    const category = categories.find(cat => cat && cat.id === categoryId);
    if (!category) {
      console.warn('Category not found for ID:', categoryId);
    }
    return category;
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
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>
          {mode === 'create' ? 'Create New Business' : 
           mode === 'edit' ? `Edit Business: ${selectedBusiness?.name}` : 
           'My Businesses'}
        </h1>
        <div className="d-flex gap-2">
          {mode !== 'list' && (
            <Button variant="outline-secondary" onClick={handleBackToList}>
              Back to List
            </Button>
          )}
          <Button variant="outline-secondary" onClick={() => navigate('/business/dashboard')}>
            Back to Dashboard
          </Button>
        </div>
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
      
      {/* FIX: Categories loading status */}
      {categories.length === 0 && !loading && (
        <Alert variant="warning" className="mb-4">
          <strong>Category Loading Issue:</strong> Business categories are not available right now. 
          You can still create your business, but you'll need to set the category later. 
          <Button 
            variant="link" 
            className="p-0 ms-2" 
            onClick={() => window.location.reload()}
          >
            Try Refreshing
          </Button>
        </Alert>
      )}
      
      {/* Business List Mode */}
      {mode === 'list' && (
        <Card className="mb-4">
          <Card.Header>
            <div className="d-flex justify-content-between align-items-center">
              <h5 className="mb-0">Your Businesses ({businesses.length})</h5>
              <Button variant="primary" onClick={handleCreateNew}>
                Create New Business
              </Button>
            </div>
          </Card.Header>
          <Card.Body>
            {businesses.length === 0 ? (
              <div className="text-center py-4">
                <p className="text-muted mb-3">You don't have any businesses yet.</p>
                <Button variant="primary" onClick={handleCreateNew}>
                  Create Your First Business
                </Button>
              </div>
            ) : (
              <Row>
                {businesses.map(business => (
                  <Col md={6} lg={4} key={business.id} className="mb-3">
                    <Card className="h-100">
                      {business.logo_url && (
                        <div className="text-center p-3 bg-light">
                          <img
                            src={business.logo_url}
                            alt={business.name}
                            className="img-fluid"
                            style={{ maxHeight: '120px', objectFit: 'contain' }}
                          />
                        </div>
                      )}
                      <Card.Body className="d-flex flex-column">
                        <Card.Title>{business.name}</Card.Title>
                        
                        {/* Display category with icon */}
                        {business.category_details && (
                          <div className="mb-2">
                            <Badge 
                              style={{ 
                                backgroundColor: business.category_details.color || '#007bff',
                                color: 'white'
                              }}
                              className="d-flex align-items-center gap-1"
                            >
                              <i className={business.category_details.icon_class || 'fas fa-store'}></i>
                              {business.category_details.name}
                            </Badge>
                          </div>
                        )}
                        
                        <Card.Text className="flex-grow-1">
                          {business.description ? (
                            business.description.length > 100 ? 
                              `${business.description.substring(0, 100)}...` : 
                              business.description
                          ) : (
                            <span className="text-muted">No description</span>
                          )}
                        </Card.Text>
                        <div className="mt-auto">
                          <div className="d-flex gap-2">
                            <Button 
                              variant="primary" 
                              size="sm"
                              onClick={() => handleEditBusiness(business)}
                              className="flex-grow-1"
                            >
                              Edit
                            </Button>
                            <Button 
                              variant="outline-danger" 
                              size="sm"
                              onClick={() => handleDeleteBusiness(business)}
                            >
                              Delete
                            </Button>
                          </div>
                        </div>
                      </Card.Body>
                    </Card>
                  </Col>
                ))}
              </Row>
            )}
          </Card.Body>
        </Card>
      )}
      
      {/* Create/Edit Form */}
      {(mode === 'create' || mode === 'edit') && (
        <Card className="shadow-sm">
          <Card.Header>
            <h5 className="mb-0">
              {mode === 'create' ? 'Create New Business' : 'Edit Business Details'}
            </h5>
          </Card.Header>
          <Card.Body>
            <Form onSubmit={handleSubmit}>
              <Row>
                <Col md={8}>
                  <Form.Group className="mb-3">
                    <Form.Label>Business Name *</Form.Label>
                    <Form.Control
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      placeholder="Enter business name"
                    />
                  </Form.Group>
                  
                  {/* FIX 12/08/2025: Category Selection with better error handling */}
                  <Form.Group className="mb-3">
                    <Form.Label>Business Category *</Form.Label>
                    {categories.length > 0 ? (
                      <>
                        <Form.Select
                          name="category"
                          value={formData.category}
                          onChange={(e) => handleCategorySelection(e.target.value)}
                          required
                        >
                          <option value="">Select a category...</option>
                          {categories.map(category => (
                            <option key={category.id} value={category.id}>
                              {category.slug === 'other-services' ? 
                                `${category.name} - Request New Category` : 
                                `${category.name} - ${category.description || 'No description'}`
                              }
                            </option>
                          ))}
                        </Form.Select>
                        <Form.Text className="text-muted">
                          Choose the category that best describes your business. Can't find one? Select "Other Services" to request a new category!
                        </Form.Text>
                      </>
                    ) : (
                      <>
                        <Form.Control
                          type="text"
                          value="Loading categories..."
                          disabled
                          className="bg-light"
                        />
                        <Form.Text className="text-danger">
                          Categories are not loading. Please refresh the page or contact support if this persists.
                        </Form.Text>
                      </>
                    )}
                  </Form.Group>
                  
                  {/* FIX 12/08/2025: Show selected category preview with better error handling */}
                  {formData.category && categories.length > 0 && (
                    <div className="mb-3">
                      {(() => {
                        const selectedCategory = getCategoryById(parseInt(formData.category));
                        if (selectedCategory) {
                          return (
                            <div className="p-3 rounded" style={{ 
                              backgroundColor: `${selectedCategory.color || '#007bff'}10`, 
                              border: `1px solid ${selectedCategory.color || '#007bff'}30` 
                            }}>
                              <div className="d-flex align-items-center gap-2">
                                <i className={selectedCategory.icon_class || 'fas fa-store'} style={{ 
                                  color: selectedCategory.color || '#007bff', 
                                  fontSize: '1.2rem' 
                                }}></i>
                                <div>
                                  <strong style={{ color: selectedCategory.color || '#007bff' }}>
                                    {selectedCategory.name}
                                  </strong>
                                  <div className="small text-muted">
                                    {selectedCategory.description || 'No description available'}
                                  </div>
                                  {selectedCategory.slug === 'other-services' && (
                                    <div className="small text-warning mt-1">
                                      <i className="fas fa-info-circle me-1"></i>
                                      Your business will be temporarily listed here while we review your category request.
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        } else {
                          return (
                            <div className="p-3 rounded bg-warning-subtle border border-warning">
                              <div className="d-flex align-items-center gap-2">
                                <i className="fas fa-exclamation-triangle text-warning"></i>
                                <div>
                                  <strong>Category Not Found</strong>
                                  <div className="small text-muted">
                                    The selected category could not be loaded. Please select a different category.
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        }
                      })()}
                    </div>
                  )}
                  
                  <Form.Group className="mb-3">
                    <Form.Label>Description</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={3}
                      name="description"
                      value={formData.description}
                      onChange={handleChange}
                      placeholder="Describe your business"
                    />
                  </Form.Group>
                  
                  <Form.Group className="mb-3">
                    <Form.Label>Address</Form.Label>
                    <Form.Control
                      type="text"
                      name="address"
                      value={formData.address}
                      onChange={handleChange}
                      placeholder="Enter business address"
                    />
                  </Form.Group>
                  
                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Phone</Form.Label>
                        <Form.Control
                          type="tel"
                          name="phone"
                          value={formData.phone}
                          onChange={handleChange}
                          placeholder="Enter phone number"
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Email</Form.Label>
                        <Form.Control
                          type="email"
                          name="email"
                          value={formData.email}
                          onChange={handleChange}
                          placeholder="Enter business email"
                        />
                      </Form.Group>
                    </Col>
                  </Row>
                </Col>
                
                <Col md={4}>
                  <Form.Group className="mb-3">
                    <Form.Label>Business Logo</Form.Label>
                    
                    {/* Logo Preview */}
                    {logoPreview && (
                      <div className="mb-3 text-center">
                        <img
                          src={logoPreview}
                          alt="Logo Preview"
                          className="img-thumbnail"
                          style={{ maxHeight: '200px', maxWidth: '100%' }}
                        />
                        <div className="mt-2">
                          <Button
                            variant="outline-danger"
                            size="sm"
                            onClick={handleRemoveLogo}
                          >
                            Remove Logo
                          </Button>
                        </div>
                      </div>
                    )}
                    
                    {/* File Input */}
                    <Form.Control
                      type="file"
                      accept="image/*"
                      onChange={handleLogoChange}
                    />
                    <Form.Text className="text-muted">
                      Upload a logo for your business (JPG, PNG, GIF - Max 5MB)
                    </Form.Text>
                  </Form.Group>
                </Col>
              </Row>
              
              <div className="d-flex justify-content-end gap-2 mt-4">
                <Button
                  variant="secondary"
                  onClick={handleBackToList}
                  disabled={saving}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  type="submit"
                  disabled={saving || (!formData.category && categories.length > 0)}
                >
                  {saving ? 'Saving...' : mode === 'create' ? 'Create Business' : 'Update Business'}
                </Button>
              </div>
            </Form>
          </Card.Body>
        </Card>
      )}
      
      {/* Delete Confirmation Modal */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Delete Business</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>Are you sure you want to delete <strong>{businessToDelete?.name}</strong>?</p>
          <p className="text-danger">
            <small>This action cannot be undone and will also delete all associated appointments and services.</small>
          </p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
            Cancel
          </Button>
          <Button 
            variant="danger" 
            onClick={confirmDeleteBusiness}
            disabled={saving}
          >
            {saving ? 'Deleting...' : 'Delete Business'}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Category Request Modal */}
      <CategoryRequestModal
        show={showCategoryRequestModal}
        onHide={() => setShowCategoryRequestModal(false)}
        onSuccess={handleCategoryRequestSuccess}
      />
    </Container>
  );
};

export default BusinessProfile;