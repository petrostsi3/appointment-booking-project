import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, ListGroup, Badge, Spinner, Alert } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import appointmentService from '../../services/appointments';
import { FaUsers, FaBuilding, FaCalendarAlt } from 'react-icons/fa';
import apiClient from '../../services/api';


const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalAppointments: 0,
    pendingAppointments: 0,
    confirmedAppointments: 0,
    cancelledAppointments: 0,
    totalUsers: 0,
    totalBusinesses: 0
  });
  const [recentAppointments, setRecentAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);

        const analyticsResponse = await apiClient.get('/api/appointments/analytics/');
        const analyticsData = analyticsResponse.data;
             
        setStats({
          totalAppointments: analyticsData.total_appointments,
          pendingAppointments: analyticsData.pending_appointments,
          confirmedAppointments: analyticsData.confirmed_appointments,
          cancelledAppointments: analyticsData.cancelled_appointments,
          totalUsers: analyticsData.total_users,
          totalBusinesses: analyticsData.total_businesses
        });
        
        setRecentAppointments(analyticsData.recent_appointments);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError('Failed to load dashboard data. Please try again later.');
        setLoading(false);
      }
    };
    
    fetchDashboardData();
  }, []);
  
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
  
  return (
    <Container className="py-4">
      <h1 className="mb-4">Admin Dashboard</h1>
      
      <Row className="mb-4">
        <Col md={4} className="mb-3">
          <Card className="shadow-sm h-100">
            <Card.Body className="d-flex flex-column">
              <div className="d-flex align-items-center mb-3">
                <div className="rounded-circle bg-primary p-3 me-3">
                  <FaCalendarAlt className="text-white" />
                </div>
                <div>
                  <h6 className="mb-0">Total Appointments</h6>
                  <h2>{stats.totalAppointments}</h2>
                </div>
              </div>
              <div className="mt-auto">
                <ListGroup variant="flush">
                  <ListGroup.Item className="d-flex justify-content-between align-items-center">
                    Pending
                    <Badge bg="warning" pill>{stats.pendingAppointments}</Badge>
                  </ListGroup.Item>
                  <ListGroup.Item className="d-flex justify-content-between align-items-center">
                    Confirmed
                    <Badge bg="success" pill>{stats.confirmedAppointments}</Badge>
                  </ListGroup.Item>
                  <ListGroup.Item className="d-flex justify-content-between align-items-center">
                    Cancelled
                    <Badge bg="danger" pill>{stats.cancelledAppointments}</Badge>
                  </ListGroup.Item>
                </ListGroup>
              </div>
            </Card.Body>
          </Card>
        </Col>
        
        <Col md={4} className="mb-3">
          <Card className="shadow-sm h-100">
            <Card.Body className="d-flex flex-column">
              <div className="d-flex align-items-center mb-3">
                <div className="rounded-circle bg-success p-3 me-3">
                  <FaUsers className="text-white" />
                </div>
                <div>
                  <h6 className="mb-0">Total Users</h6>
                  <h2>{stats.totalUsers}</h2>
                </div>
              </div>
              <div className="mt-3">
                <Link to="/admin/users" className="btn btn-outline-primary w-100">
                  Manage Users
                </Link>
              </div>
            </Card.Body>
          </Card>
        </Col>
        
        <Col md={4} className="mb-3">
          <Card className="shadow-sm h-100">
            <Card.Body className="d-flex flex-column">
              <div className="d-flex align-items-center mb-3">
                <div className="rounded-circle bg-info p-3 me-3">
                  <FaBuilding className="text-white" />
                </div>
                <div>
                  <h6 className="mb-0">Total Businesses</h6>
                  <h2>{stats.totalBusinesses}</h2>
                </div>
              </div>
              <div className="mt-3">
                <Link to="/admin/businesses" className="btn btn-outline-primary w-100">
                  Manage Businesses
                </Link>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
      
      <Row>
        <Col>
          <Card className="shadow-sm">
            <Card.Header>
              <h5 className="mb-0">Recent Appointments</h5>
            </Card.Header>
            <Card.Body>
              {recentAppointments.length === 0 ? (
                <Alert variant="info">No appointments found.</Alert>
              ) : (
                <ListGroup variant="flush">
                  {recentAppointments.map(appointment => {
                    const formattedDate = new Date(appointment.date).toLocaleDateString();
                    const statusVariant = 
                      appointment.status === 'confirmed' ? 'success' :
                      appointment.status === 'pending' ? 'warning' :
                      appointment.status === 'cancelled' ? 'danger' : 'info';
                    
                    return (
                      <ListGroup.Item key={appointment.id} className="d-flex justify-content-between align-items-center">
                        <div>
                          <strong>
                            {appointment.client_details?.first_name} {appointment.client_details?.last_name}
                          </strong>
                          <span className="mx-2">•</span>
                          <span>{appointment.business_details?.name}</span>
                          <span className="mx-2">•</span>
                          <span>{formattedDate} {appointment.start_time}</span>
                        </div>
                        <Badge bg={statusVariant}>{appointment.status_display || appointment.status}</Badge>
                      </ListGroup.Item>
                    );
                  })}
                </ListGroup>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default AdminDashboard;