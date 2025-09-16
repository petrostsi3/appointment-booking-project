import React, { useState, useEffect, useMemo } from 'react';
import { Container, Row, Col, Card, Button, Form, InputGroup, Dropdown, Badge, Collapse } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { FaSearch, FaMapMarkerAlt, FaSort, FaTimes, FaFilter, FaChevronDown, FaChevronUp } from 'react-icons/fa';
import businessService from '../../services/businesses';
import categoryService from '../../services/categories'; 


const BusinessList = () => {
  const [businesses, setBusinesses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [showFilters, setShowFilters] = useState(true);
  const filteredBusinesses = useMemo(() => {
    let filtered = [...businesses];
    if (selectedCategories.length > 0) {
      filtered = filtered.filter(business => {
        if (!business.category_details && !business.category) return false;
        return selectedCategories.some(categoryId => 
          (business.category_details && business.category_details.id === categoryId) ||
          business.category === categoryId
        );
      });
    }
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(business => 
        business.name?.toLowerCase().includes(term) ||
        business.description?.toLowerCase().includes(term) ||
        business.address?.toLowerCase().includes(term) ||
        business.category_details?.name?.toLowerCase().includes(term) ||
        business.services?.some(service => 
          service.name?.toLowerCase().includes(term)
        )
      );
    }
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return (a.name || '').localeCompare(b.name || '');
        case 'category':
          return (a.category_details?.name || '').localeCompare(
            b.category_details?.name || ''
          );
        case 'newest':
          return new Date(b.created_at || 0) - new Date(a.created_at || 0);
        default:
          return 0;
      }
    });
    return filtered;
  }, [businesses, selectedCategories, searchTerm, sortBy]);

  // FIXED 13/08/2025: Better category fetching with multiple fallbacks
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        console.log('BusinessList: Fetching categories...');
        let categoriesData = [];
        // Category service
        try {
          console.log('Trying categoryService.getAllCategories()...');
          categoriesData = await categoryService.getAllCategories();
          console.log('CategoryService succeeded:', categoriesData);
        } catch (categoryServiceError) {
          console.log('CategoryService failed, trying businessService fallback:', categoryServiceError);
          //  Business service fallback
          try {
            console.log('Trying businessService.getAllCategories()...');
            categoriesData = await businessService.getAllCategories();
            console.log('BusinessService fallback succeeded:', categoriesData);
          } catch (businessServiceError) {
            console.log('BusinessService fallback failed, trying direct API call:', businessServiceError);
            // Direct API call 
            try {
              console.log('Trying direct API call...');
              const response = await fetch('/api/businesses/categories/');
              if (response.ok) {
                categoriesData = await response.json();
                console.log('Direct API call succeeded:', categoriesData);
              } else {
                throw new Error(`HTTP ${response.status}`);
              }
            } catch (directApiError) {
              console.error('All category fetch methods failed:', directApiError);
              categoriesData = [];
            }
          }
        }
        let categoriesArray = [];
        if (Array.isArray(categoriesData)) {
          categoriesArray = categoriesData;
        } else if (categoriesData && Array.isArray(categoriesData.results)) {
          categoriesArray = categoriesData.results;
        } else if (categoriesData && typeof categoriesData === 'object') {
          categoriesArray = [categoriesData];
        }
        console.log('BusinessList: Final categories array:', categoriesArray);
        setCategories(categoriesArray);
      } catch (err) {
        console.error('BusinessList: Critical error in category fetching:', err);
        setCategories([]);
        setError('Unable to load business categories. Filtering by category will be unavailable.');
      }
    };
    
    fetchCategories();
  }, []);

  useEffect(() => {
    const fetchBusinesses = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await businessService.getAllBusinesses();
        let businessesArray = [];
        if (Array.isArray(data)) {
          businessesArray = data;
        } else if (data && Array.isArray(data.results)) {
          businessesArray = data.results;
        } else if (data && typeof data === 'object') {
          businessesArray = [data];
        }
        setBusinesses(businessesArray);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching businesses:', err);
        setBusinesses([]);
        setError('Failed to load businesses. Please try again later.');
        setLoading(false);
      }
    };

    fetchBusinesses();
  }, []);

  const handleCategoryToggle = (categoryId) => {
    setSelectedCategories(prev => {
      if (prev.includes(categoryId)) {
        return prev.filter(id => id !== categoryId);
      } else {
        return [...prev, categoryId];
      }
    });
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedCategories([]);
    setSortBy('name');
  };

  const getCategoryCount = (categoryId) => {
    return businesses.filter(business => 
      (business.category_details && business.category_details.id === categoryId) || 
      business.category === categoryId
    ).length;
  };

  const getSelectedCategoryNames = () => {
    return categories
      .filter(cat => selectedCategories.includes(cat.id))
      .map(cat => cat.name);
  };

  const renderCategoryFilter = (category) => {
    const count = getCategoryCount(category.id);
    const isSelected = selectedCategories.includes(category.id);
    
    if (category.slug === 'other-services') {
      return (
        <div
          key={category.id}
          className={`filter-option special-category ${isSelected ? 'selected' : ''}`}
          onClick={() => handleCategoryToggle(category.id)}
        >
          <div className="filter-checkbox-container">
            <Form.Check
              type="checkbox"
              id={`category-${category.id}`}
              checked={isSelected}
              onChange={() => {}}
              className="filter-checkbox"
            />
          </div>
          
          <div className="filter-option-content">
            <div className="filter-option-main">
              <i 
                className={`${category.icon_class || 'fas fa-store'} category-icon`}
                style={{ color: category.color || '#9e9e9e' }}
              ></i>
              <div className="category-info">
                <span className="category-name">{category.name}</span>
                <small className="category-subtitle">Custom categories & unique services</small>
              </div>
            </div>
            <Badge 
              bg="light" 
              text="dark" 
              className="count-badge"
            >
              {count}
            </Badge>
          </div>
        </div>
      );
    }
    
    return (
      <div
        key={category.id}
        className={`filter-option ${isSelected ? 'selected' : ''}`}
        onClick={() => handleCategoryToggle(category.id)}
      >
        <div className="filter-checkbox-container">
          <Form.Check
            type="checkbox"
            id={`category-${category.id}`}
            checked={isSelected}
            onChange={() => {}}
            className="filter-checkbox"
          />
        </div>
        
        <div className="filter-option-content">
          <div className="filter-option-main">
            <i 
              className={`${category.icon_class || 'fas fa-store'} category-icon`}
              style={{ color: category.color || '#007bff' }}
            ></i>
            <span className="category-name">{category.name}</span>
          </div>
          <Badge 
            bg="light" 
            text="dark" 
            className="count-badge"
          >
            {count}
          </Badge>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <Container fluid className="py-4">
        <Row>
          <Col lg={3}>
            <div className="sidebar-skeleton"></div>
          </Col>
          <Col lg={9}>
            <h1 className="mb-4">Find Businesses</h1>
            <Row>
              {[...Array(6)].map((_, i) => (
                <Col md={6} xl={4} className="mb-4" key={i}>
                  <Card className="h-100">
                    <div className="skeleton-image"></div>
                    <Card.Body>
                      <div className="skeleton-title mb-2"></div>
                      <div className="skeleton-text mb-2"></div>
                      <div className="skeleton-text mb-3" style={{ width: '70%' }}></div>
                      <div className="skeleton-button"></div>
                    </Card.Body>
                  </Card>
                </Col>
              ))}
            </Row>
          </Col>
        </Row>
      </Container>
    );
  }

  if (error && businesses.length === 0) {
    return (
      <Container className="py-5">
        <div className="alert alert-danger">
          {error}
          <div className="mt-3">
            <Button variant="primary" onClick={() => window.location.reload()}>
              Retry
            </Button>
          </div>
        </div>
      </Container>
    );
  }

  return (
    <Container fluid className="py-4">
      <Row>
        {/* LEFT SIDEBAR - Categories Filter */}
        <Col lg={3} className="mb-4">
          <div className="sticky-top" style={{ top: '20px' }}>
            {/* Mobile Filter Toggle */}
            <div className="d-lg-none mb-3">
              <Button
                variant="outline-primary"
                onClick={() => setShowFilters(!showFilters)}
                className="w-100 d-flex align-items-center justify-content-between"
              >
                <span>
                  <FaFilter className="me-2" />
                  Filters {selectedCategories.length > 0 && `(${selectedCategories.length})`}
                </span>
                {showFilters ? <FaChevronUp /> : <FaChevronDown />}
              </Button>
            </div>

            <Collapse in={showFilters}>
              <div>
                <Card className="filter-sidebar">
                  <Card.Header className="bg-primary text-white">
                    <div className="d-flex align-items-center justify-content-between">
                      <h6 className="mb-0">
                        <FaFilter className="me-2" />
                        Filters
                      </h6>
                      {(selectedCategories.length > 0 || searchTerm) && (
                        <Button
                          variant="link"
                          size="sm"
                          className="text-white p-0"
                          onClick={clearFilters}
                          style={{ textDecoration: 'none' }}
                        >
                          Clear All
                        </Button>
                      )}
                    </div>
                  </Card.Header>
                  
                  <Card.Body className="p-0">
                    {/* Categories Section */}
                    <div className="filter-section">
                      <div className="filter-section-header">
                        <h6 className="mb-0">Categories</h6>
                        {selectedCategories.length > 0 && (
                          <Badge bg="primary">{selectedCategories.length}</Badge>
                        )}
                      </div>
                      
                      <div className="filter-options">
                        {Array.isArray(categories) && categories.length > 0 ? (
                          categories.map(category => renderCategoryFilter(category))
                        ) : (
                          <div className="text-muted p-3">
                            {error ? 'Categories unavailable' : 'Loading categories...'}
                          </div>
                        )}
                      </div>
                    </div>
                  </Card.Body>
                </Card>
              </div>
            </Collapse>
          </div>
        </Col>

        {/* RIGHT CONTENT AREA */}
        <Col lg={9}>
          {/* Header with Search and Sort */}
          <div className="d-flex justify-content-between align-items-center mb-4">
            <div>
              <h1>Find Businesses</h1>
              {selectedCategories.length > 0 && (
                <p className="text-muted mb-0">
                  Showing: {getSelectedCategoryNames().join(', ')}
                </p>
              )}
            </div>
            <Badge bg="secondary" className="result-count">
              {filteredBusinesses.length} found
            </Badge>
          </div>

          {/* Error Alert for Categories */}
          {error && categories.length === 0 && (
            <div className="alert alert-warning mb-4" role="alert">
              <strong>Note:</strong> {error}
            </div>
          )}

          {/* Search and Sort Bar */}
          <Card className="mb-4 shadow-sm">
            <Card.Body>
              <Row className="align-items-center">
                <Col md={8}>
                  <InputGroup>
                    <InputGroup.Text>
                      <FaSearch />
                    </InputGroup.Text>
                    <Form.Control
                      type="text"
                      placeholder="Search businesses, services, or locations..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    {searchTerm && (
                      <Button
                        variant="outline-secondary"
                        onClick={() => setSearchTerm('')}
                      >
                        <FaTimes />
                      </Button>
                    )}
                  </InputGroup>
                </Col>
                
                <Col md={4} className="mt-3 mt-md-0">
                  {/* FIX 13/08/2025: Sort Dropdown with proper z-index and positioning */}
                  <Dropdown className="sort-dropdown w-100">
                    <Dropdown.Toggle 
                      variant="outline-secondary" 
                      className="w-100 d-flex align-items-center justify-content-between"
                      style={{ 
                        position: 'relative',
                        zIndex: 1000
                      }}
                    >
                      <span>
                        <FaSort className="me-2" />
                        Sort: {
                          sortBy === 'name' ? 'Name' : 
                          sortBy === 'category' ? 'Category' :
                          'Newest'
                        }
                      </span>
                    </Dropdown.Toggle>
                    <Dropdown.Menu 
                      className="w-100"
                      style={{
                        position: 'absolute',
                        zIndex: 9999,
                        top: '100%',
                        left: 0,
                        right: 0,
                        minWidth: '100%'
                      }}
                    >
                      <Dropdown.Item 
                        onClick={() => setSortBy('name')} 
                        active={sortBy === 'name'}
                      >
                        Name (A-Z)
                      </Dropdown.Item>
                      <Dropdown.Item 
                        onClick={() => setSortBy('category')} 
                        active={sortBy === 'category'}
                      >
                        Category
                      </Dropdown.Item>
                      <Dropdown.Item 
                        onClick={() => setSortBy('newest')} 
                        active={sortBy === 'newest'}
                      >
                        Newest First
                      </Dropdown.Item>
                    </Dropdown.Menu>
                  </Dropdown>
                </Col>
              </Row>
            </Card.Body>
          </Card>

          {/* Active Filters Display */}
          {(selectedCategories.length > 0 || searchTerm) && (
            <div className="mb-4">
              <div className="d-flex align-items-center gap-2 flex-wrap">
                <span className="text-muted">Active filters:</span>
                {selectedCategories.map(categoryId => {
                  const category = categories.find(cat => cat.id === categoryId);
                  if (!category) return null;
                  return (
                    <Badge 
                      key={categoryId}
                      bg="primary" 
                      className="active-filter-badge"
                    >
                      {category.icon_class && (
                        <i className={`${category.icon_class} me-1`}></i>
                      )}
                      {category.name}
                      <Button 
                        variant="link" 
                        size="sm" 
                        className="p-0 ms-2 text-white"
                        onClick={() => handleCategoryToggle(categoryId)}
                        style={{ fontSize: '0.8rem' }}
                      >
                        <FaTimes />
                      </Button>
                    </Badge>
                  );
                })}
                {searchTerm && (
                  <Badge bg="info" className="active-filter-badge">
                    Search: "{searchTerm}"
                    <Button 
                      variant="link" 
                      size="sm" 
                      className="p-0 ms-2 text-white"
                      onClick={() => setSearchTerm('')}
                      style={{ fontSize: '0.8rem' }}
                    >
                      <FaTimes />
                    </Button>
                  </Badge>
                )}
              </div>
            </div>
          )}

          {/* Results */}
          {filteredBusinesses.length === 0 ? (
            <Card className="text-center py-5">
              <Card.Body>
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔍</div>
                <h4>No businesses found</h4>
                <p className="text-muted">
                  {selectedCategories.length > 0 || searchTerm ? (
                    <>Try adjusting your filters or search terms</>
                  ) : (
                    <>No businesses available at the moment</>
                  )}
                </p>
                <div className="d-flex gap-2 justify-content-center">
                  {(selectedCategories.length > 0 || searchTerm) && (
                    <Button variant="primary" onClick={clearFilters}>
                      Clear All Filters
                    </Button>
                  )}
                  <Button variant="outline-secondary" onClick={() => window.location.reload()}>
                    Refresh
                  </Button>
                </div>
              </Card.Body>
            </Card>
          ) : (
            <Row>
              {filteredBusinesses.map(business => (
                <Col md={6} xl={4} className="mb-4" key={business.id}>
                  <Card className="h-100 shadow-sm business-card">
                    {business.logo_url && (
                      <div className="business-logo-container">
                        <img 
                          src={business.logo_url} 
                          alt={business.name} 
                          className="img-fluid" 
                          style={{ maxHeight: '150px' }}
                        />
                      </div>
                    )}
                    
                    <Card.Body className="d-flex flex-column">
                      <div className="d-flex justify-content-between align-items-start mb-2">
                        <Card.Title className="mb-0">{business.name || 'Unnamed Business'}</Card.Title>
                        {business.category_details && (
                          <Badge 
                            style={{ 
                              backgroundColor: business.category_details.color || '#007bff',
                              fontSize: '0.75rem'
                            }}
                            className="ms-2 category-badge"
                          >
                            {business.category_details.icon_class && (
                              <i className={`${business.category_details.icon_class} me-1`}></i>
                            )}
                            {business.category_details.name}
                          </Badge>
                        )}
                      </div>
                      
                      <Card.Text className="flex-grow-1">
                        {business.description ? (
                          business.description.length > 100 ? 
                            `${business.description.substring(0, 100)}...` : 
                            business.description
                        ) : (
                          'No description available.'
                        )}
                      </Card.Text>
                      
                      <div className="mb-3">
                        {business.address && (
                          <div className="d-flex align-items-center mb-1">
                            <FaMapMarkerAlt className="me-2 text-secondary" size={12} />
                            <small>{business.address}</small>
                          </div>
                        )}
                        
                        {business.services && business.services.length > 0 && (
                          <div className="mt-2">
                            <small className="text-muted">Services:</small>
                            <div className="d-flex flex-wrap gap-1 mt-1">
                              {business.services.slice(0, 2).map(service => (
                                <Badge key={service.id} bg="light" text="dark" className="small">
                                  {service.name}
                                </Badge>
                              ))}
                              {business.services.length > 2 && (
                                <Badge bg="secondary" className="small">
                                  +{business.services.length - 2} more
                                </Badge>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                      
                      <div className="mt-auto">
                        <Link to={`/businesses/${business.id}`}>
                          <Button variant="primary" className="w-100">View Details</Button>
                        </Link>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
              ))}
            </Row>
          )}
        </Col>
      </Row>

      {/* FIX: Dropdwn styling*/}
      <style jsx>{`
        /* Ensure all containers allow dropdown overflow */
        .container,
        .container-fluid,
        .row,
        .col,
        .col-lg-9,
        .col-md-4 {
          overflow: visible !important;
        }

        .filter-sidebar {
          border: none;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          overflow: visible !important;
        }

        .filter-section {
          border-bottom: 1px solid #eee;
          overflow: visible !important;
        }

        .filter-section:last-child {
          border-bottom: none;
        }

        .filter-section-header {
          padding: 16px 20px 12px;
          border-bottom: 1px solid #f0f0f0;
          display: flex;
          align-items: center;
          justify-content: space-between;
          background-color: #fafafa;
        }

        .filter-options {
          padding: 8px 0;
          overflow: visible !important;
        }

        .filter-option {
          display: flex;
          align-items: center;
          padding: 12px 20px;
          cursor: pointer;
          transition: all 0.2s ease;
          border-left: 3px solid transparent;
        }

        .filter-option:hover {
          background-color: #f8f9fa;
        }

        .filter-option.selected {
          background-color: #e3f2fd;
          border-left-color: #2196f3;
        }

        .special-category {
          background: linear-gradient(135deg, #f5f5f5 0%, #e8e8e8 100%);
          border-left: 3px solid #9e9e9e !important;
        }
        
        .special-category:hover {
          background: linear-gradient(135deg, #eeeeee 0%, #e0e0e0 100%);
        }
        
        .special-category.selected {
          background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%);
          border-left-color: #2196f3 !important;
        }
        
        .category-info {
          display: flex;
          flex-direction: column;
        }
        
        .category-subtitle {
          color: #666;
          font-size: 11px;
          margin-top: 2px;
        }

        .filter-checkbox-container {
          margin-right: 12px;
          flex-shrink: 0;
        }

        .filter-checkbox input[type="checkbox"] {
          width: 18px;
          height: 18px;
          cursor: pointer;
        }

        .filter-option-content {
          display: flex;
          align-items: center;
          justify-content: space-between;
          width: 100%;
        }

        .filter-option-main {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .category-icon {
          font-size: 16px;
          width: 20px;
          text-align: center;
        }

        .category-name {
          font-size: 14px;
          font-weight: 500;
        }

        .count-badge {
          font-size: 11px;
          padding: 2px 6px;
        }

        .result-count {
          font-size: 14px;
          padding: 8px 12px;
        }

        .active-filter-badge {
          display: flex;
          align-items: center;
          padding: 8px 12px;
          font-size: 0.9rem;
          margin: 2px;
        }

        .business-card {
          transition: transform 0.2s, box-shadow 0.2s;
          overflow: visible !important;
        }
        
        .business-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
        }
        
        .business-logo-container {
          height: 150px;
          display: flex;
          align-items: center;
          justify-content: center;
          background-color: #f8f9fa;
          overflow: hidden;
        }

        .category-badge {
          display: flex;
          align-items: center;
        }

        .sidebar-skeleton {
          height: 400px;
          background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
          background-size: 200% 100%;
          animation: skeleton-loading 1.5s infinite;
          border-radius: 8px;
        }

        .skeleton-image {
          height: 150px;
          background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
          background-size: 200% 100%;
          animation: skeleton-loading 1.5s infinite;
          border-radius: 4px;
        }

        .skeleton-title {
          height: 24px;
          background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
          background-size: 200% 100%;
          animation: skeleton-loading 1.5s infinite;
          border-radius: 4px;
        }

        .skeleton-text {
          height: 16px;
          background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
          background-size: 200% 100%;
          animation: skeleton-loading 1.5s infinite;
          border-radius: 4px;
        }

        .skeleton-button {
          height: 38px;
          background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
          background-size: 200% 100%;
          animation: skeleton-loading 1.5s infinite;
          border-radius: 6px;
        }

        @keyframes skeleton-loading {
          0% {
            background-position: -200% 0;
          }
          100% {
            background-position: 200% 0;
          }
        }

        /* FIX */
        .sort-dropdown {
          position: relative !important;
          z-index: 1000 !important;
        }

        .sort-dropdown .dropdown-menu {
          z-index: 9999 !important;
          position: absolute !important;
          top: 100% !important;
          left: 0 !important;
          right: 0 !important;
          transform: none !important;
          box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15) !important;
          border: 1px solid rgba(0, 0, 0, 0.1) !important;
          border-radius: 8px !important;
          overflow: visible !important;
        }

        /* Ensure parent containers don't clip */
        .card-body {
          overflow: visible !important;
        }

        .row {
          overflow: visible !important;
        }

        @media (max-width: 991px) {
          .sticky-top {
            position: static !important;
          }
          
          .sort-dropdown .dropdown-menu {
            position: absolute !important;
            z-index: 9999 !important;
          }
        }
      `}</style>
    </Container>
  );
};

export default BusinessList;