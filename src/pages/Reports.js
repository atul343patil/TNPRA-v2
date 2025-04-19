import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Card,
  CardContent,
  Grid,
  Tooltip,
  IconButton,
  Chip,
  CircularProgress,
  Alert,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Collapse,
  InputAdornment,
  Slider,
  Stack,
  Divider
} from '@mui/material';
import { motion } from 'framer-motion';
import InfoIcon from '@mui/icons-material/Info';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import PersonIcon from '@mui/icons-material/Person';
import FilterListIcon from '@mui/icons-material/FilterList';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';
import axios from 'axios';

const Reports = () => {
  const [recoveredLoans, setRecoveredLoans] = useState([]);
  const [filteredLoans, setFilteredLoans] = useState([]);
  const [recoveryStats, setRecoveryStats] = useState({
    totalRecovered: 0,
    totalPending: 0,
    recoveredCases: 0,
    pendingCases: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [branches, setBranches] = useState([]);
  const [banks, setBanks] = useState([]);
  
  // Filter states
  const [filters, setFilters] = useState({
    branchName: '',
    bankName: '',
    amountRange: [0, 10000000], // Default range (0 to 1 crore)
    startDate: '',
    endDate: '',
    searchTerm: ''
  });
  
  // Amount range state
  const [maxAmount, setMaxAmount] = useState(10000000); // 1 crore default

  // Fetch recovered loans and stats
  useEffect(() => {
    const fetchRecoveredLoans = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const token = localStorage.getItem('authToken');
        
        // Fetch recovered loans
        const response = await axios.get('http://localhost:5000/api/customers', {
          headers: {
            'Authorization': `Bearer ${token}`
          },
          params: {
            isRecovered: true,
            limit: 1000 // Get a large number of recovered loans
          }
        });
        
        if (response.status === 200) {
          const loans = response.data.customers;
          setRecoveredLoans(loans);
          setFilteredLoans(loans);
          
          // Extract unique branches and banks
          const uniqueBranches = [...new Set(loans.map(loan => loan.branchName))].filter(Boolean);
          const uniqueBanks = [...new Set(loans.map(loan => loan.bankName))].filter(Boolean);
          setBranches(uniqueBranches);
          setBanks(uniqueBanks);
          
          // Find max amount for slider
          const maxLoanAmount = Math.max(...loans.map(loan => parseFloat(loan.outstandingBalance || 0)));
          setMaxAmount(maxLoanAmount > 0 ? maxLoanAmount * 1.2 : 10000000); // 20% buffer
          setFilters(prev => ({
            ...prev,
            amountRange: [0, maxLoanAmount > 0 ? maxLoanAmount * 1.2 : 10000000]
          }));
          
          // Calculate recovery stats
          const totalRecovered = loans.reduce((sum, loan) => 
            sum + parseFloat(loan.outstandingBalance || 0), 0
          );
          
          // Fetch total stats
          const statsResponse = await axios.get('http://localhost:5000/api/customers/stats/summary', {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          
          if (statsResponse.status === 200) {
            const stats = statsResponse.data;
            setRecoveryStats({
              totalRecovered: totalRecovered,
              totalPending: stats.totalOutstanding - totalRecovered,
              recoveredCases: loans.length,
              pendingCases: stats.totalCustomers - loans.length
            });
          }
        }
      } catch (err) {
        console.error('Error fetching recovered loans:', err);
        setError('Failed to load recovery data. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchRecoveredLoans();
  }, []);

  // Apply filters when filters change
  useEffect(() => {
    if (recoveredLoans.length === 0) return;
    
    const filtered = recoveredLoans.filter(loan => {
      // Branch filter
      if (filters.branchName && loan.branchName !== filters.branchName) {
        return false;
      }
      
      // Bank filter
      if (filters.bankName && loan.bankName !== filters.bankName) {
        return false;
      }
      
      // Amount range filter
      const amount = parseFloat(loan.outstandingBalance || 0);
      if (amount < filters.amountRange[0] || amount > filters.amountRange[1]) {
        return false;
      }
      
      // Date range filter
      if (filters.startDate && loan.recoveryDate) {
        const recoveryDate = new Date(loan.recoveryDate);
        const startDate = new Date(filters.startDate);
        startDate.setHours(0, 0, 0, 0);
        
        if (recoveryDate < startDate) {
          return false;
        }
      }
      
      if (filters.endDate && loan.recoveryDate) {
        const recoveryDate = new Date(loan.recoveryDate);
        const endDate = new Date(filters.endDate);
        endDate.setHours(23, 59, 59, 999);
        
        if (recoveryDate > endDate) {
          return false;
        }
      }
      
      // Search term filter
      if (filters.searchTerm) {
        const searchLower = filters.searchTerm.toLowerCase();
        return (
          (loan.accountName && loan.accountName.toLowerCase().includes(searchLower)) ||
          (loan.accountNumber && loan.accountNumber.toLowerCase().includes(searchLower)) ||
          (loan.contactNo && loan.contactNo.toLowerCase().includes(searchLower)) ||
          (loan.recoveredBy && loan.recoveredBy.toLowerCase().includes(searchLower))
        );
      }
      
      return true;
    });
    
    setFilteredLoans(filtered);
    
    // Update filtered stats
    const filteredTotal = filtered.reduce((sum, loan) => 
      sum + parseFloat(loan.outstandingBalance || 0), 0
    );
    
    setRecoveryStats(prev => ({
      ...prev,
      totalRecovered: filteredTotal,
      recoveredCases: filtered.length
    }));
    
  }, [filters, recoveredLoans]);

  const handleFilterChange = (event) => {
    const { name, value } = event.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAmountRangeChange = (event, newValue) => {
    setFilters(prev => ({
      ...prev,
      amountRange: newValue
    }));
  };

  const handleSearchChange = (event) => {
    setFilters(prev => ({
      ...prev,
      searchTerm: event.target.value
    }));
  };

  const resetFilters = () => {
    setFilters({
      branchName: '',
      bankName: '',
      amountRange: [0, maxAmount],
      startDate: '',
      endDate: '',
      searchTerm: ''
    });
  };

  const formatCurrency = (amount) => {
    if (!amount) return '₹0';
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const formatTime = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <Box sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h5">
            Recovery Reports
          </Typography>
          <Button 
            variant="outlined" 
            startIcon={<FilterListIcon />}
            onClick={() => setShowFilters(!showFilters)}
          >
            {showFilters ? 'Hide Filters' : 'Show Filters'}
          </Button>
        </Box>

        {/* Filters */}
        <Collapse in={showFilters}>
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Filter Reports
              </Typography>
              
              <Grid container spacing={2}>
                {/* Search */}
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    placeholder="Search by name, account number, contact or recovery officer"
                    variant="outlined"
                    name="searchTerm"
                    value={filters.searchTerm}
                    onChange={handleSearchChange}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <SearchIcon />
                        </InputAdornment>
                      ),
                      endAdornment: filters.searchTerm ? (
                        <InputAdornment position="end">
                          <IconButton
                            onClick={() => setFilters(prev => ({ ...prev, searchTerm: '' }))}
                            edge="end"
                          >
                            <ClearIcon />
                          </IconButton>
                        </InputAdornment>
                      ) : null
                    }}
                  />
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth>
                    <InputLabel>Branch</InputLabel>
                    <Select
                      name="branchName"
                      value={filters.branchName}
                      onChange={handleFilterChange}
                      label="Branch"
                    >
                      <MenuItem value="">All Branches</MenuItem>
                      {branches.map(branch => (
                        <MenuItem key={branch} value={branch}>{branch}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth>
                    <InputLabel>Bank</InputLabel>
                    <Select
                      name="bankName"
                      value={filters.bankName}
                      onChange={handleFilterChange}
                      label="Bank"
                    >
                      <MenuItem value="">All Banks</MenuItem>
                      {banks.map(bank => (
                        <MenuItem key={bank} value={bank}>{bank}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                
                <Grid item xs={12}>
                  <Typography variant="subtitle2" gutterBottom>
                    Amount Range: {formatCurrency(filters.amountRange[0])} - {formatCurrency(filters.amountRange[1])}
                  </Typography>
                  <Slider
                    value={filters.amountRange}
                    onChange={handleAmountRangeChange}
                    valueLabelDisplay="auto"
                    valueLabelFormat={value => formatCurrency(value)}
                    min={0}
                    max={maxAmount}
                    sx={{ mt: 1 }}
                  />
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Recovery From"
                    type="date"
                    name="startDate"
                    value={filters.startDate}
                    onChange={handleFilterChange}
                    InputLabelProps={{
                      shrink: true,
                    }}
                    inputProps={{
                      max: filters.endDate || undefined
                    }}
                  />
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Recovery To"
                    type="date"
                    name="endDate"
                    value={filters.endDate}
                    onChange={handleFilterChange}
                    InputLabelProps={{
                      shrink: true,
                    }}
                    inputProps={{
                      min: filters.startDate || undefined
                    }}
                  />
                </Grid>
                
                <Grid item xs={12}>
                  <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
                    <Button 
                      variant="outlined" 
                      onClick={resetFilters} 
                      sx={{ mr: 1 }}
                    >
                      Reset Filters
                    </Button>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Collapse>

        {/* Summary Cards */}
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" color="primary" gutterBottom>
                  Total Recovered
                </Typography>
                <Typography variant="h4">
                  {formatCurrency(recoveryStats.totalRecovered)}
                </Typography>
                {filteredLoans.length !== recoveredLoans.length && (
                  <Typography variant="caption" color="text.secondary">
                    Filtered from {formatCurrency(recoveredLoans.reduce((sum, loan) => 
                      sum + parseFloat(loan.outstandingBalance || 0), 0))}
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" color="primary" gutterBottom>
                  Cases Recovered
                </Typography>
                <Typography variant="h4">
                  {recoveryStats.recoveredCases}
                </Typography>
                {filteredLoans.length !== recoveredLoans.length && (
                  <Typography variant="caption" color="text.secondary">
                    Filtered from {recoveredLoans.length} cases
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" color="primary" gutterBottom>
                  Recovery Rate
                </Typography>
                <Typography variant="h4">
                  {recoveryStats.recoveredCases + recoveryStats.pendingCases > 0 
                    ? ((recoveryStats.recoveredCases / (recoveryStats.recoveredCases + recoveryStats.pendingCases)) * 100).toFixed(1) + '%'
                    : '0%'
                  }
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Error Alert */}
        {error && (
          <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {/* Results summary */}
        {!loading && filteredLoans.length > 0 && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" color="text.secondary">
              Showing {filteredLoans.length} {filteredLoans.length === 1 ? 'result' : 'results'}
              {filteredLoans.length !== recoveredLoans.length && ` (filtered from ${recoveredLoans.length} total)`}
            </Typography>
          </Box>
        )}

        {/* Loading Indicator */}
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 5 }}>
            <CircularProgress />
          </Box>
        ) : (
          /* Recovered Loans Table */
          <Paper sx={{ width: '100%', overflow: 'hidden' }}>
            <TableContainer sx={{ maxHeight: 440 }}>
              <Table stickyHeader aria-label="recovered loans table">
                <TableHead>
                  <TableRow>
                    <TableCell>Customer Name</TableCell>
                    <TableCell>Account No.</TableCell>
                    <TableCell>Branch</TableCell>
                    <TableCell>Bank</TableCell>
                    <TableCell>Product Type</TableCell>
                    <TableCell>Recovered Amount</TableCell>
                    <TableCell>Recovery Date</TableCell>
                    <TableCell>Recovered By</TableCell>
                    <TableCell>Contact</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredLoans.map((loan) => (
                    <TableRow hover key={loan._id}>
                      <TableCell>{loan.accountName}</TableCell>
                      <TableCell>{loan.accountNumber}</TableCell>
                      <TableCell>{loan.branchName}</TableCell>
                      <TableCell>{loan.bankName}</TableCell>
                      <TableCell>{loan.productType}</TableCell>
                      <TableCell>{formatCurrency(loan.outstandingBalance)}</TableCell>
                      <TableCell>
                        {loan.recoveryDate ? (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <CalendarTodayIcon fontSize="small" color="primary" />
                            <Tooltip title={formatTime(loan.recoveryDate)} arrow>
                              <Typography variant="body2">
                                {formatDate(loan.recoveryDate)}
                              </Typography>
                            </Tooltip>
                          </Box>
                        ) : 'N/A'}
                      </TableCell>
                      <TableCell>
                        {loan.recoveredBy ? (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <PersonIcon fontSize="small" color="primary" />
                            <Typography variant="body2">
                              {loan.recoveredBy}
                            </Typography>
                          </Box>
                        ) : 'N/A'}
                      </TableCell>
                      <TableCell>{loan.contactNo}</TableCell>
                    </TableRow>
                  ))}
                  {filteredLoans.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={9} align="center">
                        <Typography variant="body1" sx={{ py: 2 }}>
                          {recoveredLoans.length > 0 
                            ? 'No results match your filters. Try adjusting your criteria.' 
                            : 'No recovered loans yet'}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        )}
      </Box>
    </motion.div>
  );
};

export default Reports;
