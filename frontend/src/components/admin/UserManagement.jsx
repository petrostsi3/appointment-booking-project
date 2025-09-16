import React, { useState, useEffect } from 'react';
import { Container, Table, Button, Form, Modal, Spinner, Alert, Badge } from 'react-bootstrap';
import { FaEdit, FaTrash } from 'react-icons/fa';


const mockUserService = {
  getUsers: async () => {
    return [
      { id: 1, username: 'admin', first_name: 'Admin', last_name: 'User', email: 'admin@example.com', user_type: 'admin', is_active: true },
      { id: 2, username: 'business1', first_name: 'Business', last_name: 'Owner', email: 'business@example.com', user_type: 'business', is_active: true },
      { id: 3, username: 'client1', first_name: 'Client', last_name: 'User', email: 'client@example.com', user_type: 'client', is_active: true },
      { id: 4, username: 'business2', first_name: 'Another', last_name: 'Business', email: 'another@example.com', user_type: 'business', is_active: false },
    ];
  },
  updateUser: async (userData) => {
    console.log('Updating user:', userData);
    return userData;
  },
  deleteUser: async (userId) => {
    console.log('Deleting user:', userId);
    return true;
  }
};

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [userForm, setUserForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    user_type: 'client',
    is_active: true
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        const data = await mockUserService.getUsers();
        setUsers(data);
        setFilteredUsers(data);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching users:', err);
        setError('Failed to load users. Please try again later.');
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  useEffect(() => {
    let filtered = [...users];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(user => 
        user.username.toLowerCase().includes(term) ||
        user.first_name.toLowerCase().includes(term) ||
        user.last_name.toLowerCase().includes(term) ||
        user.email.toLowerCase().includes(term)
      );
    }
    
    if (filterType !== 'all') {
      filtered = filtered.filter(user => user.user_type === filterType);
    }
    
    setFilteredUsers(filtered);
  }, [users, searchTerm, filterType]);

  const handleEditUser = (user) => {
    setEditingUser(user);
    setUserForm({
      first_name: user.first_name,
      last_name: user.last_name,
      email: user.email,
      user_type: user.user_type,
      is_active: user.is_active
    });
    setShowEditModal(true);
  };

  const handleFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setUserForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmitEdit = async () => {
    if (!editingUser) return;
    try {
      setLoading(true);
      const updatedUser = {
        ...editingUser,
        ...userForm
      };
      await mockUserService.updateUser(updatedUser);
      setUsers(prev => 
        prev.map(user => 
          user.id === editingUser.id ? updatedUser : user
        )
      );
      
      setShowEditModal(false);
      setLoading(false);
    } catch (err) {
      console.error('Error updating user:', err);
      setError('Failed to update user. Please try again.');
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user?')) {
      return;
    }
    try {
      setLoading(true);
      await mockUserService.deleteUser(userId);
      setUsers(prev => prev.filter(user => user.id !== userId));
      setLoading(false);
    } catch (err) {
      console.error('Error deleting user:', err);
      setError('Failed to delete user. Please try again.');
      setLoading(false);
    }
  };

  if (loading && users.length === 0) {
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
      <h1 className="mb-4">User Management</h1>
      {error && (
        <Alert variant="danger" onClose={() => setError(null)} dismissible>
          {error}
        </Alert>
      )}
      
      <div className="mb-4 d-flex flex-column flex-md-row gap-3 justify-content-between">
        <div className="d-flex gap-2">
          <Form.Control
            type="text"
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ width: '250px' }}
          />
          
          <Form.Select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            style={{ width: '150px' }}
          >
            <option value="all">All Users</option>
            <option value="admin">Admins</option>
            <option value="business">Business Owners</option>
            <option value="client">Clients</option>
          </Form.Select>
        </div>
      </div>
      
      <Table responsive striped hover>
        <thead>
          <tr>
            <th>Username</th>
            <th>Name</th>
            <th>Email</th>
            <th>User Type</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredUsers.map(user => (
            <tr key={user.id}>
              <td>{user.username}</td>
              <td>{user.first_name} {user.last_name}</td>
              <td>{user.email}</td>
              <td>
                <Badge bg={
                  user.user_type === 'admin' ? 'danger' :
                  user.user_type === 'business' ? 'primary' : 'success'
                }>
                  {user.user_type === 'admin' ? 'Admin' : 
                   user.user_type === 'business' ? 'Business Owner' : 'Client'}
                </Badge>
              </td>
              <td>
                <Badge bg={user.is_active ? 'success' : 'secondary'}>
                  {user.is_active ? 'Active' : 'Inactive'}
                </Badge>
              </td>
              <td>
                <Button
                  variant="outline-primary"
                  size="sm"
                  className="me-2"
                  onClick={() => handleEditUser(user)}
                >
                  <FaEdit />
                </Button>
                <Button
                  variant="outline-danger"
                  size="sm"
                  onClick={() => handleDeleteUser(user.id)}
                >
                  <FaTrash />
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>
      
      {filteredUsers.length === 0 && (
        <Alert variant="info">No users found matching your search criteria.</Alert>
      )}
      
      {/* Edit User Modal */}
      <Modal show={showEditModal} onHide={() => setShowEditModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Edit User</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3" controlId="firstName">
              <Form.Label>First Name</Form.Label>
              <Form.Control
                type="text"
                name="first_name"
                value={userForm.first_name}
                onChange={handleFormChange}
                required
              />
            </Form.Group>
            
            <Form.Group className="mb-3" controlId="lastName">
              <Form.Label>Last Name</Form.Label>
              <Form.Control
                type="text"
                name="last_name"
                value={userForm.last_name}
                onChange={handleFormChange}
                required
              />
            </Form.Group>
            
            <Form.Group className="mb-3" controlId="email">
              <Form.Label>Email</Form.Label>
              <Form.Control
                type="email"
                name="email"
                value={userForm.email}
                onChange={handleFormChange}
                required
              />
            </Form.Group>
            
            <Form.Group className="mb-3" controlId="userType">
              <Form.Label>User Type</Form.Label>
              <Form.Select
                name="user_type"
                value={userForm.user_type}
                onChange={handleFormChange}
                required
              >
                <option value="admin">Administrator</option>
                <option value="business">Business Owner</option>
                <option value="client">Client</option>
              </Form.Select>
            </Form.Group>
            
            <Form.Group className="mb-3" controlId="isActive">
              <Form.Check
                type="checkbox"
                label="Active"
                name="is_active"
                checked={userForm.is_active}
                onChange={handleFormChange}
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowEditModal(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSubmitEdit}>
            Save Changes
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default UserManagement;