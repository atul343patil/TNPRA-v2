import React, { useState, useEffect } from 'react';
import { 
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
  Button, TextField, Checkbox, FormControl, InputLabel, Select, MenuItem,
  Typography, Box, Grid, Card, CardContent, Pagination, CircularProgress,
  Alert, Chip, IconButton, InputAdornment, Breadcrumbs, Link,
  Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle
} from '@mui/material';
import { 
  Search as SearchIcon, 
  FilterList as FilterListIcon,
  NavigateNext as NavigateNextIcon,
  ArrowBack as ArrowBackIcon,
  Visibility as VisibilityIcon
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { formatPhoneNumber } from '../utils/formatters';

const Customers = () => {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  
  // Get branch info from navigation state if available
  const branchInfo = location.state || {};
  
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalCustomers, setTotalCustomers] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [confirmDialog, setConfirmDialog] = useState({
    open: false,
    customerId: null,
    customer: null,
    action: '' // 'recover' or 'undo'
  });
  const [filters, setFilters] = useState({
    branchName: branchInfo.branchName || '',
    bankName: branchInfo.bankName || '',
    isRecovered: '',
    assignedTo: user?.role === 'ADMIN' ? '' : user?.username
  });
  const [showFilters, setShowFilters] = useState(false);
  const [officers, setOfficers] = useState([]);

  // Fetch customers based on current filters and pagination
  const fetchCustomers = async () => {
    try {
      setLoading(true);
      setError(null);

      // Build query parameters
      const params = new URLSearchParams({
        page: currentPage,
        limit: 10,
        ...filters
      });

      if (searchTerm) {
        params.append('search', searchTerm);
      }
      
      // Remove empty filters
      Array.from(params.entries()).forEach(([key, value]) => {
        if (!value) params.delete(key);
      });

      const token = localStorage.getItem('authToken');
      const response = await fetch(`http://localhost:5000/api/customers?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setCustomers(data.customers);
        setTotalPages(data.totalPages);
        setCurrentPage(data.currentPage);
        setTotalCustomers(data.totalCustomers);
      } else {
        throw new Error(`Failed to fetch customers: ${response.status}`);
      }
    } catch (err) {
      console.error('Error fetching customers:', err);
      setError('Failed to load customers. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Fetch officers for filter dropdown (admin only)
  const fetchOfficers = async () => {
    if (user?.role === 'ADMIN') {
      try {
        const token = localStorage.getItem('authToken');
        const response = await fetch('http://localhost:5000/api/auth/users', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          const officersList = data.filter(u => u.role === 'OFFICER');
          setOfficers(officersList);
        } else {
          console.error('Failed to fetch officers, response not OK:', response.status);
        }
      } catch (err) {
        console.error('Error fetching officers:', err);
      }
    }
  };

  // Initial data fetch
  useEffect(() => {
    fetchCustomers();
    fetchOfficers();
  }, [currentPage]);

  // Handle search
  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(1); // Reset to first page on new search
    fetchCustomers();
  };

  // Handle filter changes
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Apply filters
  const applyFilters = () => {
    setCurrentPage(1); // Reset to first page on filter change
    fetchCustomers();
  };

  // Reset filters
  const resetFilters = () => {
    setFilters({
      branchName: '',
      isRecovered: '',
      assignedTo: user.role === 'ADMIN' ? '' : user.username
    });
    setCurrentPage(1);
    fetchCustomers();
  };

  // Toggle recovery status
  const toggleRecoveryStatus = (customerId) => {
    // Find the customer
    const customer = customers.find(c => c._id === customerId);
    if (!customer) return;

    // Open confirmation dialog
    setConfirmDialog({
      open: true,
      customerId,
      customer,
      action: customer.isRecovered ? 'undo' : 'recover'
    });
  };

  // Handle confirmed recovery status change
  const handleConfirmRecovery = async () => {
    const { customerId, action } = confirmDialog;
    
    try {
      setLoading(true);
      const token = localStorage.getItem('authToken');
      const response = await axios.patch(
        `http://localhost:5000/api/customers/${customerId}/recovery`,
        { 
          isRecovered: action === 'recover',
          recoveryDate: action === 'recover' ? new Date().toISOString() : null,
          recoveredBy: action === 'recover' ? user?.username || 'Admin' : null
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      
      if (response.status === 200) {
        // Update local state
        setCustomers(customers.map(c => 
          c._id === customerId 
            ? { 
                ...c, 
                isRecovered: action === 'recover',
                recoveryDate: action === 'recover' ? new Date().toISOString() : null,
                recoveredBy: action === 'recover' ? user?.username || 'Admin' : null
              } 
            : c
        ));
      } else {
        throw new Error(`Failed to update recovery status: ${response.status}`);
      }
    } catch (err) {
      console.error('Error updating recovery status:', err);
      setError('Failed to update recovery status. Please try again.');
    } finally {
      setLoading(false);
      // Close the dialog
      setConfirmDialog({
        open: false,
        customerId: null,
        customer: null,
        action: ''
      });
    }
  };

  // Close dialog without action
  const handleCloseDialog = () => {
    setConfirmDialog({
      open: false,
      customerId: null,
      customer: null,
      action: ''
    });
  };

  // Pagination controls
  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  // Go back to branches list
  const goBackToBranches = () => {
    navigate('/branches');
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Breadcrumb navigation */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <Button 
          startIcon={<ArrowBackIcon />} 
          onClick={goBackToBranches}
          sx={{ mr: 2 }}
        >
          Back to Branches
        </Button>
        
        <Breadcrumbs separator={<NavigateNextIcon fontSize="small" />}>
          <Link color="inherit" onClick={goBackToBranches} sx={{ cursor: 'pointer' }}>
            Branches
          </Link>
          {branchInfo.bankName && (
            <Typography color="text.primary">{branchInfo.bankName}</Typography>
          )}
          {branchInfo.branchName && (
            <Typography color="text.primary">{branchInfo.branchName}</Typography>
          )}
        </Breadcrumbs>
      </Box>
      
      <Typography variant="h4" gutterBottom>
        {branchInfo.branchName ? `${branchInfo.branchName} Customers` : 'All Customers'}
      </Typography>
      
      {branchInfo.bankName && (
        <Typography variant="subtitle1" color="text.secondary" gutterBottom>
          {branchInfo.bankName}
        </Typography>
      )}
      
      {/* Search and Filter Controls */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
          <Box component="form" onSubmit={handleSearch} sx={{ display: 'flex', width: '60%' }}>
            <TextField
              fullWidth
              placeholder="Search by name, account number, or contact"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton type="submit">
                      <SearchIcon />
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
          </Box>
          
          <Button 
            variant="outlined" 
            startIcon={<FilterListIcon />}
            onClick={() => setShowFilters(!showFilters)}
          >
            {showFilters ? 'Hide Filters' : 'Show Filters'}
          </Button>
        </Box>
        
        {showFilters && (
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6} md={3}>
                  <TextField
                    fullWidth
                    label="Branch Name"
                    name="branchName"
                    value={filters.branchName}
                    onChange={handleFilterChange}
                    placeholder="Filter by branch"
                  />
                </Grid>
                
                <Grid item xs={12} sm={6} md={3}>
                  <FormControl fullWidth>
                    <InputLabel>Recovery Status</InputLabel>
                    <Select
                      name="isRecovered"
                      value={filters.isRecovered}
                      onChange={handleFilterChange}
                      label="Recovery Status"
                    >
                      <MenuItem value="">All</MenuItem>
                      <MenuItem value="true">Recovered</MenuItem>
                      <MenuItem value="false">Not Recovered</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                
                {user?.role === 'ADMIN' && (
                  <Grid item xs={12} sm={6} md={3}>
                    <FormControl fullWidth>
                      <InputLabel>Assigned Officer</InputLabel>
                      <Select
                        name="assignedTo"
                        value={filters.assignedTo}
                        onChange={handleFilterChange}
                        label="Assigned Officer"
                      >
                        <MenuItem value="">All Officers</MenuItem>
                        {officers.map(officer => (
                          <MenuItem key={officer._id} value={officer.username}>
                            {officer.username}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                )}
                
                <Grid item xs={12} sm={6} md={3} sx={{ display: 'flex', alignItems: 'center' }}>
                  <Button variant="contained" onClick={applyFilters} sx={{ mr: 1 }}>
                    Apply Filters
                  </Button>
                  <Button variant="outlined" onClick={resetFilters}>
                    Reset
                  </Button>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        )}
      </Box>
      
      {/* Error Alert */}
      {error && (
        <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      
      {/* Customer Table */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 5 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Recovered</TableCell>
                  <TableCell>Customer Name</TableCell>
                  <TableCell>Account No.</TableCell>
                  <TableCell>Branch</TableCell>
                  <TableCell>Product Type</TableCell>
                  <TableCell>Outstanding</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Contact</TableCell>
                  <TableCell>Address</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {customers.length > 0 ? (
                  // Sort customers so that recovered accounts appear at the end
                  [...customers]
                    .sort((a, b) => {
                      // If a is recovered and b is not, a should come after b
                      if (a.isRecovered && !b.isRecovered) return 1;
                      // If a is not recovered and b is, a should come before b
                      if (!a.isRecovered && b.isRecovered) return -1;
                      // Otherwise, keep original order
                      return 0;
                    })
                    .map(customer => (
                      <TableRow 
                        key={customer._id}
                        sx={{ 
                          bgcolor: customer.isRecovered ? 'action.hover' : 'inherit'
                        }}
                      >
                        <TableCell>
                          <Checkbox
                            checked={customer.isRecovered || false}
                            onChange={() => toggleRecoveryStatus(customer._id)}
                          />
                        </TableCell>
                        <TableCell>{customer.accountName}</TableCell>
                        <TableCell>{customer.accountNumber}</TableCell>
                        <TableCell>{customer.branchName}</TableCell>
                        <TableCell>{customer.productType}</TableCell>
                        <TableCell>{customer.outstandingBalance}</TableCell>
                        <TableCell>
                          <Chip 
                            label={customer.isRecovered ? 'Recovered' : 'Pending'}
                            color={customer.isRecovered ? 'success' : 'warning'}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>{formatPhoneNumber(customer.contactNo)}</TableCell>
                        <TableCell>{customer.communicationAddress}</TableCell>
                        <TableCell>
                          <Button
                            variant="contained"
                            size="small"
                            color="primary"
                            startIcon={<VisibilityIcon />}
                            onClick={() => navigate(`/customer/${customer._id}`, { 
                              state: { customerData: customer } 
                            })}
                          >
                            Details
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={10} align="center">
                      No customers found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
          
          {/* Pagination */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2 }}>
            <Typography variant="body2">
              Showing {customers.length} of {totalCustomers} customers
            </Typography>
            <Pagination 
              count={totalPages} 
              page={currentPage} 
              onChange={(e, page) => handlePageChange(page)}
              color="primary"
            />
          </Box>
        </>
      )}
      
      {/* Confirmation Dialog */}
      <Dialog
        open={confirmDialog.open}
        onClose={handleCloseDialog}
        aria-labelledby="recovery-confirmation-dialog"
      >
        <DialogTitle id="recovery-confirmation-dialog">
          {confirmDialog.action === 'recover' 
            ? 'Confirm Recovery' 
            : 'Undo Recovery'}
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            {confirmDialog.action === 'recover' 
              ? `Are you sure you want to mark ${confirmDialog.customer?.accountName}'s account (${confirmDialog.customer?.accountNumber}) as recovered? This will be recorded in the reports.` 
              : `Are you sure you want to undo the recovery status for ${confirmDialog.customer?.accountName}'s account (${confirmDialog.customer?.accountNumber})?`}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} color="primary">
            Cancel
          </Button>
          <Button onClick={handleConfirmRecovery} color="primary" variant="contained" autoFocus>
            {confirmDialog.action === 'recover' ? 'Yes, Mark as Recovered' : 'Yes, Undo Recovery'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Customers;
