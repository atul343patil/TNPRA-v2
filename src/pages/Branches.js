import React, { useState, useEffect } from 'react';
import { 
  Typography, Box, Card, CardContent, Grid, Button, 
  CircularProgress, Alert, TextField, InputAdornment, IconButton,
  Chip, Divider, Stack, Avatar, Tooltip, Paper
} from '@mui/material';
import { Search as SearchIcon, AccountBalance as BankIcon, Person as PersonIcon, SupervisorAccount as OfficerIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Branches = () => {
  const { user } = useAuth();
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  // Fetch all unique branches
  useEffect(() => {
    const fetchBranches = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const token = localStorage.getItem('authToken');
        const response = await fetch('http://localhost:5000/api/customers/branches', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          setBranches(data);
        } else {
          throw new Error(`Failed to fetch branches: ${response.status}`);
        }
      } catch (err) {
        console.error('Error fetching branches:', err);
        setError('Failed to load branches. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchBranches();
  }, []);

  // Handle search
  const handleSearch = (e) => {
    e.preventDefault();
    // Just filter the branches client-side since it's a small dataset
  };

  // Filter branches based on officer assignment
  const branchesForUser = user?.isOfficer
    ? branches.filter(branch => branch.officers.includes(user.username))
    : branches;
  
  // Filter branches based on search term
  const filteredBranches = branchesForUser.filter(branch => 
    branch.branchName?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    branch.bankName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Navigate to customers of selected branch
  const viewBranchCustomers = (branchName, bankName) => {
    navigate('/customers', { 
      state: { 
        branchName, 
        bankName 
      } 
    });
  };

  // Group branches by bank name
  const groupedBranches = filteredBranches.reduce((acc, branch) => {
    const bankName = branch.bankName || 'Unknown Bank';
    if (!acc[bankName]) {
      acc[bankName] = [];
    }
    acc[bankName].push(branch);
    return acc;
  }, {});

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>Branch Management</Typography>
      
      {/* Search */}
      <Box sx={{ mb: 4 }}>
        <Box component="form" onSubmit={handleSearch} sx={{ display: 'flex', width: '60%', mb: 2 }}>
          <TextField
            fullWidth
            placeholder="Search by branch or bank name"
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
      </Box>
      
      {/* Error Alert */}
      {error && (
        <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      
      {/* Branches List */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 5 }}>
          <CircularProgress />
        </Box>
      ) : filteredBranches.length === 0 ? (
        <Alert severity="info">
          No branches found. Please upload customer data with branch information.
        </Alert>
      ) : (
        Object.entries(groupedBranches).map(([bankName, bankBranches]) => (
          <Box key={bankName} sx={{ mb: 4 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <BankIcon sx={{ mr: 1 }} />
              <Typography variant="h5">{bankName}</Typography>
            </Box>
            
            <Grid container spacing={2}>
              {bankBranches.map((branch, index) => (
                <Grid item xs={12} sm={6} md={6} lg={6} key={index}>
                  <Card 
                    sx={{ 
                      height: '100%', 
                      display: 'flex', 
                      flexDirection: 'column',
                      borderRadius: 2,
                      overflow: 'hidden',
                      transition: 'all 0.3s ease',
                      border: '1px solid',
                      borderColor: 'divider',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                      maxWidth: '100%',
                      '&:hover': {
                        transform: 'translateY(-5px)',
                        boxShadow: '0 8px 16px rgba(0,0,0,0.1)'
                      }
                    }}
                  >
                    <Box 
                      sx={{ 
                        bgcolor: theme => theme.palette.mode === 'dark' 
                          ? 'primary.dark' 
                          : 'rgba(66, 133, 244, 0.85)', 
                        py: 1.2, 
                        px: 2,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1
                      }}
                    >
                      <BankIcon sx={{ color: 'white', fontSize: '1.4rem' }} />
                      <Typography 
                        variant="h6" 
                        sx={{ 
                          color: 'white',
                          fontWeight: 600,
                          fontSize: '1.1rem',
                          textShadow: '0 1px 2px rgba(0,0,0,0.1)',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        {branch.branchName || 'Unnamed Branch'}
                      </Typography>
                    </Box>
                    
                    <CardContent 
                      sx={{ 
                        flexGrow: 1, 
                        display: 'flex', 
                        flexDirection: 'column', 
                        gap: 1.5,
                        p: { xs: 1.5, sm: 2 },
                        bgcolor: theme => theme.palette.mode === 'dark' 
                          ? 'rgba(30, 30, 30, 0.9)' 
                          : 'rgba(255, 255, 255, 0.95)'
                      }}
                    >
                      <Box 
                        sx={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'space-between',
                          bgcolor: theme => theme.palette.mode === 'dark' 
                            ? 'rgba(45, 45, 45, 0.8)' 
                            : 'rgba(240, 245, 255, 0.8)',
                          py: 0.8,
                          px: 1.5,
                          borderRadius: 1.5
                        }}
                      >
                        <Typography 
                          variant="body2" 
                          sx={{ 
                            fontWeight: 500,
                            fontSize: '0.95rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 0.8
                          }}
                        >
                          <PersonIcon fontSize="small" color="primary" />
                          Customers
                        </Typography>
                        <Chip 
                          label={branch.customerCount} 
                          color="primary" 
                          size="small"
                          sx={{ 
                            fontWeight: 'bold',
                            fontSize: '0.85rem',
                            height: '24px'
                          }}
                        />
                      </Box>
                      
                      {/* Officer information - Improved UI */}
                      {branch.officers && branch.officers.length > 0 && (
                        <Box
                          sx={{ 
                            p: 1.5, 
                            bgcolor: theme => theme.palette.mode === 'dark' 
                              ? 'rgba(45, 45, 45, 0.8)' 
                              : 'rgba(240, 245, 255, 0.8)',
                            borderRadius: 1.5,
                            border: '1px solid',
                            borderColor: 'divider'
                          }}
                        >
                          <Box sx={{ 
                            display: 'flex', 
                            alignItems: 'center',
                            mb: branch.officers.length > 1 ? 1.2 : 0
                          }}>
                            <OfficerIcon 
                              fontSize="small" 
                              sx={{ 
                                mr: 0.8,
                                color: theme => theme.palette.mode === 'dark' 
                                  ? 'primary.light' 
                                  : 'primary.main'
                              }} 
                            />
                            <Typography 
                              variant="subtitle2" 
                              sx={{ 
                                fontWeight: 'bold',
                                fontSize: '0.95rem',
                                color: theme => theme.palette.mode === 'dark' 
                                  ? 'primary.light' 
                                  : 'primary.main'
                              }}
                            >
                              Assigned Officers:
                            </Typography>
                            
                            {branch.officers.length === 1 && (
                              <Typography 
                                variant="body2"
                                sx={{ 
                                  ml: 0.8,
                                  fontWeight: 500,
                                  fontSize: '0.9rem'
                                }}
                              >
                                {branch.officers[0]}
                              </Typography>
                            )}
                          </Box>
                          
                          {branch.officers.length > 1 && (
                            <Stack 
                              direction="row" 
                              spacing={0.8} 
                              flexWrap="wrap"
                            >
                              {branch.officers.map((officer, idx) => {
                                // Get initials for avatar
                                const initials = officer
                                  .split(' ')
                                  .map(word => word[0])
                                  .join('')
                                  .toUpperCase()
                                  .substring(0, 2);
                                  
                                return (
                                  <Tooltip key={idx} title={officer} arrow placement="top">
                                    <Chip 
                                      avatar={
                                        <Avatar 
                                          sx={{ 
                                            bgcolor: `hsl(${idx * 37 % 360}, 70%, 80%)`,
                                            color: `hsl(${idx * 37 % 360}, 80%, 30%)`,
                                            width: 24,
                                            height: 24,
                                            fontSize: '0.75rem'
                                          }}
                                        >
                                          {initials}
                                        </Avatar>
                                      }
                                      label={officer}
                                      size="small"
                                      sx={{ 
                                        mb: 0.8,
                                        fontWeight: 500,
                                        fontSize: '0.85rem',
                                        height: '24px',
                                        '& .MuiChip-avatar': {
                                          width: 24,
                                          height: 24
                                        },
                                        boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
                                        '&:hover': {
                                          boxShadow: '0 2px 3px rgba(0,0,0,0.15)',
                                        }
                                      }}
                                    />
                                  </Tooltip>
                                );
                              })}
                            </Stack>
                          )}
                        </Box>
                      )}
                      
                      <Box sx={{ flexGrow: 1, minHeight: '5px' }} />
                      
                      <Button 
                        variant="contained" 
                        color="primary"
                        onClick={() => viewBranchCustomers(branch.branchName, branch.bankName)}
                        sx={{ 
                          mt: 'auto',
                          py: 0.8,
                          borderRadius: 1.5,
                          fontWeight: 'bold',
                          fontSize: '0.9rem',
                          textTransform: 'none',
                          boxShadow: 1,
                          background: 'linear-gradient(45deg, #4285F4 30%, #5C9CFF 90%)',
                          '&:hover': {
                            boxShadow: 2,
                            background: 'linear-gradient(45deg, #3367D6 30%, #4285F4 90%)'
                          }
                        }}
                        fullWidth
                      >
                        View Customers
                      </Button>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Box>
        ))
      )}
    </Box>
  );
};

export default Branches;
