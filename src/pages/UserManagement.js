import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  IconButton,
  Alert,
  Card,
  CardContent,
  Grid,
} from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import ExcelUpload from '../components/ExcelUpload';
import { useRecovery } from '../context/RecoveryContext';

const UserManagement = () => {
  const { user: currentUser, register } = useAuth();
  const [users, setUsers] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const { recoveryStats } = useRecovery();

  const [formData, setFormData] = useState({
    username: '',
    password: '',
    role: 'OFFICER',
    branch: 'HEAD_OFFICE' // Adding default branch
  });

  // State for Excel data processing
  const [dashboardData, setDashboardData] = useState({
    totalOutstanding: 0,
    totalPrincipleOverdue: 0,
    totalInterestOverdue: 0,
    pendingCases: 0,
    highRiskAccounts: 0,
    monthlyNPA: [],
    productTypeDistribution: [],
    branchPerformance: [],
    assetClassification: [],
    anomaliesDistribution: []
  });

  const roles = ['OFFICER', 'ADMIN'];
  const branches = ['HEAD_OFFICE', 'BRANCH_1', 'BRANCH_2', 'BRANCH_3']; // Add your branches here

  useEffect(() => {
    fetchUsers();
    // Load Excel data from localStorage if available
    const savedData = localStorage.getItem('excelData');
    if (savedData) {
      processExcelData(JSON.parse(savedData));
    }
  }, []);

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch('http://localhost:5000/api/auth/users', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      }
    } catch (err) {
      setError('Failed to fetch users');
    }
  };

  const handleOpenDialog = (user = null) => {
    if (user) {
      setFormData({
        username: user.username,
        role: user.role,
        password: '',
        branch: user.branch || 'HEAD_OFFICE'
      });
      setSelectedUser(user);
    } else {
      setFormData({
        username: '',
        password: '',
        role: 'OFFICER',
        branch: 'HEAD_OFFICE'
      });
      setSelectedUser(null);
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setError('');
    setSuccess('');
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (selectedUser) {
        // Update existing user
        const token = localStorage.getItem('authToken');
        const response = await fetch(`http://localhost:5000/api/auth/users/${selectedUser._id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(formData)
        });

        if (!response.ok) {
          throw new Error('Failed to update user');
        }
      } else {
        // Create new user
        await register(formData);
      }

      setSuccess(selectedUser ? 'User updated successfully' : 'User created successfully');
      fetchUsers();
      setTimeout(() => {
        handleCloseDialog();
        setSuccess('');
      }, 1500);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;

    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`http://localhost:5000/api/auth/users/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to delete user');
      }

      setSuccess('User deleted successfully');
      fetchUsers();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Failed to delete user');
      setTimeout(() => setError(''), 3000);
    }
  };

  const processExcelData = (data) => {
    localStorage.setItem('excelData', JSON.stringify(data));

    // Calculate total amounts
    const totalOutstanding = data.reduce((sum, row) => sum + (parseFloat(row.OUTSTANDING_BALANCE) || 0), 0);
    const totalPrincipleOverdue = data.reduce((sum, row) => sum + (parseFloat(row.PRINCIPLE_OVERDUE) || 0), 0);
    const totalInterestOverdue = data.reduce((sum, row) => sum + (parseFloat(row.INTEREST_OVERDUE) || 0), 0);
    
    // Count cases
    const pendingCases = data.length;
    
    // Count high risk accounts (based on Asset Classification)
    const highRiskAccounts = data.filter(row => 
      row.ASSET_CLASSIFICATION?.toLowerCase().includes('npa')
    ).length;
    
    // Process monthly NPA data
    const monthlyData = {};
    data.forEach(row => {
      if (row.DATE_OF_NPA) {
        const date = new Date(row.DATE_OF_NPA);
        const month = date.toLocaleString('default', { month: 'short', year: '2-digit' });
        monthlyData[month] = (monthlyData[month] || 0) + (parseFloat(row.NET_BALANCE) || 0);
      }
    });

    // Product type distribution
    const productTypes = {};
    data.forEach(row => {
      const type = row.PRODUCT_TYPE || 'Unknown';
      productTypes[type] = (productTypes[type] || 0) + (parseFloat(row.NET_BALANCE) || 0);
    });

    // Branch performance
    const branches = {};
    data.forEach(row => {
      const branch = row.BRANCH || 'Unknown';
      branches[branch] = (branches[branch] || 0) + (parseFloat(row.NET_BALANCE) || 0);
    });

    // Asset Classification distribution
    const assetClasses = {};
    data.forEach(row => {
      const classification = row.ASSET_CLASSIFICATION || 'Unclassified';
      assetClasses[classification] = (assetClasses[classification] || 0) + (parseFloat(row.NET_BALANCE) || 0);
    });

    // Anomalies distribution
    const anomalies = {};
    data.forEach(row => {
      const anomaly = row.ANOMALIES || 'None';
      if (!anomalies[anomaly]) {
        anomalies[anomaly] = { count: 0, amount: 0 };
      }
      anomalies[anomaly].count += 1;
      anomalies[anomaly].amount += parseFloat(row.NET_BALANCE) || 0;
    });

    setDashboardData({
      totalOutstanding,
      totalPrincipleOverdue,
      totalInterestOverdue,
      pendingCases,
      highRiskAccounts,
      monthlyNPA: Object.entries(monthlyData).map(([name, amount]) => ({
        name,
        amount,
      })),
      productTypeDistribution: Object.entries(productTypes).map(([name, value]) => ({
        name,
        value,
      })),
      branchPerformance: Object.entries(branches)
        .map(([name, amount]) => ({
          name,
          amount,
        }))
        .sort((a, b) => b.amount - a.amount),
      assetClassification: Object.entries(assetClasses).map(([name, value]) => ({
        name,
        value,
      })),
      anomaliesDistribution: Object.entries(anomalies).map(([name, data]) => ({
        name,
        count: data.count,
        amount: data.amount,
      }))
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  if (!currentUser?.isAdmin) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h5" color="error">
          Access Denied: Admin privileges required
        </Typography>
      </Box>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <Box sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
          <Typography variant="h5">Officer Management</Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
          >
            Add Officer
          </Button>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {success}
          </Alert>
        )}

        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Username</TableCell>
                <TableCell>Role</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user._id}>
                  <TableCell>{user.username}</TableCell>
                  <TableCell>{user.role}</TableCell>
                  <TableCell>
                    <IconButton
                      color="primary"
                      onClick={() => handleOpenDialog(user)}
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      color="error"
                      onClick={() => handleDeleteUser(user._id)}
                      disabled={user._id === currentUser?._id}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        <Dialog open={openDialog} onClose={handleCloseDialog}>
          <DialogTitle>
            {selectedUser ? 'Edit Officer' : 'Create New Officer'}
          </DialogTitle>
          <DialogContent>
            <Box component="form" sx={{ mt: 2 }}>
              <TextField
                fullWidth
                label="Username"
                name="username"
                value={formData.username}
                onChange={handleInputChange}
                margin="normal"
                required
              />
              {!selectedUser && (
                <TextField
                  fullWidth
                  label="Password"
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  margin="normal"
                  required
                />
              )}
              <TextField
                fullWidth
                select
                label="Role"
                name="role"
                value={formData.role}
                onChange={handleInputChange}
                margin="normal"
                required
              >
                {roles.map((role) => (
                  <MenuItem key={role} value={role}>
                    {role.charAt(0).toUpperCase() + role.slice(1)}
                  </MenuItem>
                ))}
              </TextField>

            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>Cancel</Button>
            <Button onClick={handleSubmit} variant="contained">
              {selectedUser ? 'Update' : 'Create'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Data Management Section */}
        <Box sx={{ mt: 4 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Data Management
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <ExcelUpload onDataUpload={processExcelData} />
              </Box>
            </CardContent>
          </Card>
        </Box>
      </Box>
    </motion.div>
  );
};

export default UserManagement;
