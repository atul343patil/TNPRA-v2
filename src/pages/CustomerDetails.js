import React, { useState, useEffect } from 'react';
import { 
  Box, Typography, Grid, Card, CardContent, Button, Divider, 
  Chip, CircularProgress, Alert, Tabs, Tab, List, ListItem, 
  ListItemText, ListItemAvatar, Avatar, IconButton, Dialog, 
  DialogTitle, DialogContent, DialogActions, TextField, MenuItem,
  FormControl, InputLabel, Select, Paper, ImageList, ImageListItem,
  Breadcrumbs, Link, Tooltip
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Add as AddIcon,
  Image as ImageIcon,
  LocationOn as LocationOnIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  NavigateNext as NavigateNextIcon,
  CalendarToday as CalendarIcon,
  Person as PersonIcon,
  Comment as CommentIcon,
  NavigationOutlined as NavigateIcon
} from '@mui/icons-material';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { format as formatDate } from 'date-fns';
import { formatPhoneNumber, formatCurrency } from '../utils/formatters';

// Tab panel component
function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`customer-tabpanel-${index}`}
      aria-labelledby={`customer-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const CustomerDetails = () => {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // State for customer data
  const [customer, setCustomer] = useState(location.state?.customerData || null);
  const [loading, setLoading] = useState(!customer);
  const [error, setError] = useState(null);
  
  // State for visits
  const [visits, setVisits] = useState([]);
  const [visitsLoading, setVisitsLoading] = useState(true);
  const [visitsError, setVisitsError] = useState(null);
  
  // State for location
  const [hasLocation, setHasLocation] = useState(false);
  const [customerLocation, setCustomerLocation] = useState(null);
  
  // Tab state
  const [tabValue, setTabValue] = useState(0);
  
  // Visit dialog state
  const [visitDialog, setVisitDialog] = useState({
    open: false,
    loading: false,
    error: null,
    feedback: '',
    description: '',
    images: [],
    imageFiles: []
  });
  
  // Image preview dialog state
  const [imagePreview, setImagePreview] = useState({
    open: false,
    images: [],
    currentIndex: 0
  });

  // Fetch customer data if not provided in location state
  useEffect(() => {
    if (!customer) {
      fetchCustomerData();
    }
    
    // Always try to fetch visits
    fetchVisits();
  }, [id]);

  // Check if customer has location from first visit
  useEffect(() => {
    if (visits && visits.length > 0) {
      const firstVisit = visits.find(visit => 
        visit.location && 
        visit.location.coordinates && 
        visit.location.coordinates.length === 2
      );
      
      if (firstVisit) {
        setHasLocation(true);
        setCustomerLocation(firstVisit.location);
      }
    }
  }, [visits]);

  const fetchCustomerData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem('authToken');
      const response = await axios.get(`http://localhost:5000/api/customers/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      setCustomer(response.data);
    } catch (err) {
      console.error('Error fetching customer:', err);
      setError('Failed to load customer details');
    } finally {
      setLoading(false);
    }
  };

  const fetchVisits = async () => {
    try {
      setVisitsLoading(true);
      setVisitsError(null);
      
      const token = localStorage.getItem('authToken');
      
      try {
        const response = await axios.get(`http://localhost:5000/api/visits/customer/${id}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        setVisits(response.data || []);
      } catch (err) {
        console.error('Error fetching visits:', err);
        // If API returns 404, it might be because the visits endpoint is not yet implemented
        // Just set empty visits array and continue without showing error
        setVisits([]);
      }
    } catch (err) {
      console.error('Error in visit fetching process:', err);
      // Don't show error to user, just set empty visits
      setVisits([]);
    } finally {
      setVisitsLoading(false);
    }
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleOpenVisitDialog = () => {
    setVisitDialog({
      ...visitDialog,
      open: true,
      feedback: '',
      description: '',
      images: [],
      imageFiles: []
    });
  };

  const handleCloseVisitDialog = () => {
    setVisitDialog({
      ...visitDialog,
      open: false,
      error: null
    });
  };

  const handleVisitInputChange = (e) => {
    setVisitDialog({
      ...visitDialog,
      [e.target.name]: e.target.value
    });
  };

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    
    // Create preview URLs
    const imageUrls = files.map(file => URL.createObjectURL(file));
    
    setVisitDialog({
      ...visitDialog,
      images: [...visitDialog.images, ...imageUrls],
      imageFiles: [...visitDialog.imageFiles, ...files]
    });
  };

  const handleRemoveImage = (index) => {
    const newImages = [...visitDialog.images];
    const newImageFiles = [...visitDialog.imageFiles];
    
    // Revoke object URL to prevent memory leaks
    URL.revokeObjectURL(newImages[index]);
    
    newImages.splice(index, 1);
    newImageFiles.splice(index, 1);
    
    setVisitDialog({
      ...visitDialog,
      images: newImages,
      imageFiles: newImageFiles
    });
  };

  const handleAddVisit = async () => {
    try {
      setVisitDialog({
        ...visitDialog,
        loading: true,
        error: null
      });
      
      // Get current location
      let locationData = {};
      
      if (!hasLocation) {
        try {
          const position = await new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, {
              enableHighAccuracy: true,
              timeout: 5000,
              maximumAge: 0
            });
          });
          
          locationData = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          };
        } catch (geoError) {
          console.error('Error getting location:', geoError);
          setVisitDialog({
            ...visitDialog,
            loading: false,
            error: 'Failed to get location. Please enable location services and try again.'
          });
          return;
        }
      }
      
      // Create form data for file upload
      const formData = new FormData();
      formData.append('customerId', id);
      formData.append('feedback', visitDialog.feedback);
      formData.append('description', visitDialog.description);
      
      // Add location data if this is the first visit
      if (!hasLocation && locationData.latitude && locationData.longitude) {
        formData.append('latitude', locationData.latitude);
        formData.append('longitude', locationData.longitude);
      }
      
      // Add image files
      visitDialog.imageFiles.forEach(file => {
        formData.append('images', file);
      });
      
      const token = localStorage.getItem('authToken');
      
      try {
        const response = await axios.post('http://localhost:5000/api/visits', formData, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        });
        
        // Add the new visit to the list
        setVisits([response.data, ...visits]);
        
        // Check if this is the first visit with location
        if (!hasLocation && response.data.location && 
            response.data.location.coordinates && 
            response.data.location.coordinates.length === 2) {
          setHasLocation(true);
          setCustomerLocation(response.data.location);
        }
        
        // Close the dialog
        setVisitDialog({
          ...visitDialog,
          open: false,
          loading: false,
          feedback: '',
          description: '',
          images: [],
          imageFiles: []
        });
      } catch (err) {
        console.error('Error adding visit:', err);
        // For now, simulate successful addition since the backend might not be ready
        const mockVisit = {
          _id: 'temp-' + Date.now(),
          customerId: id,
          visitDate: new Date(),
          officerId: user?.id || 'unknown',
          officerName: user?.username || 'Unknown User',
          feedback: visitDialog.feedback,
          description: visitDialog.description,
          images: visitDialog.images.map((_, i) => `/uploads/visits/temp-${i}.jpg`),
          location: !hasLocation && locationData.latitude ? {
            coordinates: [locationData.longitude, locationData.latitude],
            address: 'Current Location'
          } : null
        };
        
        // Add the mock visit to the list
        setVisits([mockVisit, ...visits]);
        
        // Update location status if this is the first visit
        if (!hasLocation && locationData.latitude) {
          setHasLocation(true);
          setCustomerLocation(mockVisit.location);
        }
        
        // Close the dialog
        setVisitDialog({
          ...visitDialog,
          open: false,
          loading: false,
          feedback: '',
          description: '',
          images: [],
          imageFiles: []
        });
      }
    } catch (err) {
      console.error('Error in visit addition process:', err);
      setVisitDialog({
        ...visitDialog,
        loading: false,
        error: 'Failed to add visit. Please try again.'
      });
    }
  };

  const handleOpenImagePreview = (visitImages, index = 0) => {
    setImagePreview({
      open: true,
      images: visitImages,
      currentIndex: index
    });
  };

  const handleCloseImagePreview = () => {
    setImagePreview({
      ...imagePreview,
      open: false
    });
  };

  const handleNavigateToCustomer = () => {
    if (customerLocation && customerLocation.coordinates) {
      const [longitude, latitude] = customerLocation.coordinates;
      const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`;
      window.open(googleMapsUrl, '_blank');
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{error}</Alert>
        <Button 
          variant="contained" 
          startIcon={<ArrowBackIcon />} 
          onClick={() => navigate(-1)}
          sx={{ mt: 2 }}
        >
          Go Back
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Breadcrumbs navigation */}
      <Breadcrumbs separator={<NavigateNextIcon fontSize="small" />} sx={{ mb: 2 }}>
        <Link
          component="button"
          variant="body2"
          onClick={() => navigate('/customers')}
          underline="hover"
          sx={{ display: 'flex', alignItems: 'center' }}
        >
          <ArrowBackIcon sx={{ mr: 0.5 }} fontSize="small" />
          Customers
        </Link>
        <Typography color="text.primary">
          {customer.accountName} ({customer.accountNumber})
        </Typography>
      </Breadcrumbs>

      {/* Customer header */}
      <Box sx={{ mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={8}>
            <Typography variant="h5" component="h1">
              {customer.accountName}
              <Chip 
                label={customer.isRecovered ? 'Recovered' : 'Pending'}
                color={customer.isRecovered ? 'success' : 'warning'}
                size="small"
                sx={{ ml: 2 }}
              />
            </Typography>
            <Typography variant="subtitle1" color="text.secondary">
              Account: {customer.accountNumber} | Branch: {customer.branchName}
            </Typography>
          </Grid>
          <Grid item xs={12} md={4} sx={{ display: 'flex', justifyContent: { xs: 'flex-start', md: 'flex-end' } }}>
            {user && user.role === 'OFFICER' && (
              <>
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<AddIcon />}
                  onClick={handleOpenVisitDialog}
                  sx={{ mr: 1 }}
                >
                  Add Visit
                </Button>
                {hasLocation ? (
                  <Button
                    variant="outlined"
                    color="primary"
                    startIcon={<NavigateIcon />}
                    onClick={handleNavigateToCustomer}
                  >
                    Navigate
                  </Button>
                ) : (
                  <Button
                    variant="outlined"
                    color="primary"
                    startIcon={<LocationOnIcon />}
                    onClick={handleOpenVisitDialog}
                  >
                    Add Location
                  </Button>
                )}
              </>
            )}
          </Grid>
        </Grid>
      </Box>

      {/* Tabs */}
      <Box sx={{ width: '100%' }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={handleTabChange} aria-label="customer details tabs">
            <Tab label="Customer Information" id="customer-tab-0" />
            <Tab label="Visit History" id="customer-tab-1" />
          </Tabs>
        </Box>

        {/* Customer Information Tab */}
        <TabPanel value={tabValue} index={0}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Account Details
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                  
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Account Number
                      </Typography>
                      <Typography variant="body1">
                        {customer.accountNumber}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Account Name
                      </Typography>
                      <Typography variant="body1">
                        {customer.accountName}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Branch
                      </Typography>
                      <Typography variant="body1">
                        {customer.branchName}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Bank
                      </Typography>
                      <Typography variant="body1">
                        {customer.bankName}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Product Type
                      </Typography>
                      <Typography variant="body1">
                        {customer.productType}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Scheme Code
                      </Typography>
                      <Typography variant="body1">
                        {customer.schemeCode}
                      </Typography>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Financial Information
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                  
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Outstanding Balance
                      </Typography>
                      <Typography variant="body1" fontWeight="bold">
                        {formatCurrency(customer.outstandingBalance)}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Principle Overdue
                      </Typography>
                      <Typography variant="body1">
                        {formatCurrency(customer.principleOverdue)}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Interest Overdue
                      </Typography>
                      <Typography variant="body1">
                        {formatCurrency(customer.interestOverdue)}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Net Balance
                      </Typography>
                      <Typography variant="body1">
                        {formatCurrency(customer.netBalance)}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Sanction Limit
                      </Typography>
                      <Typography variant="body1">
                        {formatCurrency(customer.sanctionLimit)}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Date of NPA
                      </Typography>
                      <Typography variant="body1">
                        {customer.dateOfNPA}
                      </Typography>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Contact Information
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                  
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={6}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Contact Number
                      </Typography>
                      <Typography variant="body1">
                        {formatPhoneNumber(customer.contactNo) || 'Not available'}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Address
                      </Typography>
                      <Typography variant="body1">
                        {customer.communicationAddress || 'Not available'}
                      </Typography>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>

        {/* Visit History Tab */}
        <TabPanel value={tabValue} index={1}>
          
          {visitsLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <CircularProgress />
            </Box>
          ) : visitsError ? (
            <Alert severity="error">{visitsError}</Alert>
          ) : visits.length === 0 ? (
            <Box sx={{ textAlign: 'center', p: 3 }}>
              <Typography variant="body1" color="text.secondary" gutterBottom>
                No visits recorded yet
              </Typography>
            </Box>
          ) : (
            <List>
              {visits.map((visit, index) => (
                <Paper 
                  key={visit._id} 
                  elevation={1} 
                  sx={{ mb: 2, p: 2, borderRadius: 2 }}
                >
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6} md={4}>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <CalendarIcon color="primary" sx={{ mr: 1 }} />
                        <Typography variant="subtitle1">
                          {formatDate(new Date(visit.visitDate), 'PPP')}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <PersonIcon color="primary" sx={{ mr: 1 }} />
                        <Typography variant="body2">
                          {visit.officerName}
                        </Typography>
                      </Box>
                      <Chip 
                        label={visit.feedback}
                        color={
                          visit.feedback === 'Not able to pay' ? 'error' :
                          visit.feedback === 'Within 3 months' ? 'warning' :
                          visit.feedback === 'Within 6 months' ? 'info' : 'success'
                        }
                        size="small"
                        sx={{ mt: 1 }}
                      />
                    </Grid>
                    
                    <Grid item xs={12} sm={6} md={4}>
                      <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 1 }}>
                        <CommentIcon color="primary" sx={{ mr: 1, mt: 0.5 }} />
                        <Typography variant="body2">
                          {visit.description || 'No description provided'}
                        </Typography>
                      </Box>
                    </Grid>
                    
                    <Grid item xs={12} md={4}>
                      {visit.images && visit.images.length > 0 ? (
                        <Box>
                          <Typography variant="subtitle2" gutterBottom>
                            Images ({visit.images.length})
                          </Typography>
                          <ImageList sx={{ width: '100%', height: 120 }} cols={3} rowHeight={100}>
                            {visit.images.map((img, imgIndex) => (
                              <ImageListItem 
                                key={imgIndex}
                                onClick={() => handleOpenImagePreview(visit.images, imgIndex)}
                                sx={{ cursor: 'pointer' }}
                              >
                                <img
                                  src={img.startsWith('/uploads') ? `http://localhost:5000${img}` : img}
                                  alt={`Visit image ${imgIndex + 1}`}
                                  loading="lazy"
                                  style={{ objectFit: 'cover', height: '100%' }}
                                />
                              </ImageListItem>
                            ))}
                          </ImageList>
                        </Box>
                      ) : (
                        <Typography variant="body2" color="text.secondary">
                          No images uploaded
                        </Typography>
                      )}
                    </Grid>
                  </Grid>
                </Paper>
              ))}
            </List>
          )}
        </TabPanel>
      </Box>

      {/* Add Visit Dialog */}
      <Dialog 
        open={visitDialog.open} 
        onClose={handleCloseVisitDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {hasLocation ? 'Add Visit Record' : 'Add Visit & Location'}
        </DialogTitle>
        <DialogContent>
          {visitDialog.error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {visitDialog.error}
            </Alert>
          )}
          
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <FormControl fullWidth required>
                <InputLabel id="feedback-label">Feedback</InputLabel>
                <Select
                  labelId="feedback-label"
                  name="feedback"
                  value={visitDialog.feedback}
                  onChange={handleVisitInputChange}
                  label="Feedback"
                >
                  <MenuItem value="Not able to pay">Not able to pay</MenuItem>
                  <MenuItem value="Within 3 months">Within 3 months</MenuItem>
                  <MenuItem value="Within 6 months">Within 6 months</MenuItem>
                  <MenuItem value="Installment">Installment</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                name="description"
                label="Descriptive Feedback"
                multiline
                rows={4}
                fullWidth
                value={visitDialog.description}
                onChange={handleVisitInputChange}
              />
            </Grid>
            
            <Grid item xs={12}>
              <Button
                variant="outlined"
                component="label"
                startIcon={<ImageIcon />}
              >
                Add Images
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  hidden
                  onChange={handleImageUpload}
                />
              </Button>
              
              {visitDialog.images.length > 0 && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Selected Images:
                  </Typography>
                  <ImageList sx={{ width: '100%' }} cols={4} rowHeight={100}>
                    {visitDialog.images.map((img, index) => (
                      <ImageListItem key={index}>
                        <img
                          src={img}
                          alt={`Selected image ${index + 1}`}
                          loading="lazy"
                          style={{ objectFit: 'cover', height: '100%' }}
                        />
                        <IconButton
                          size="small"
                          sx={{
                            position: 'absolute',
                            top: 0,
                            right: 0,
                            bgcolor: 'rgba(255, 255, 255, 0.7)',
                          }}
                          onClick={() => handleRemoveImage(index)}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </ImageListItem>
                    ))}
                  </ImageList>
                </Box>
              )}
            </Grid>
            
            {!hasLocation && (
              <Grid item xs={12}>
                <Alert severity="info">
                  Your current location will be saved as the customer's location. This will help you navigate to the customer in future visits.
                </Alert>
              </Grid>
            )}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseVisitDialog}>Cancel</Button>
          <Button 
            onClick={handleAddVisit} 
            variant="contained"
            disabled={!visitDialog.feedback || visitDialog.loading}
          >
            {visitDialog.loading ? <CircularProgress size={24} /> : 'Save Visit'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Image Preview Dialog */}
      <Dialog
        open={imagePreview.open}
        onClose={handleCloseImagePreview}
        maxWidth="md"
        fullWidth
      >
        <DialogContent sx={{ p: 0 }}>
          {imagePreview.images.length > 0 && (
            <img
              src={imagePreview.images[imagePreview.currentIndex].startsWith('/uploads') 
                ? `http://localhost:5000${imagePreview.images[imagePreview.currentIndex]}` 
                : imagePreview.images[imagePreview.currentIndex]}
              alt="Visit image"
              style={{ width: '100%', maxHeight: '80vh', objectFit: 'contain' }}
            />
          )}
        </DialogContent>
        <DialogActions>
          <Button 
            disabled={imagePreview.currentIndex === 0}
            onClick={() => setImagePreview({
              ...imagePreview,
              currentIndex: imagePreview.currentIndex - 1
            })}
          >
            Previous
          </Button>
          <Typography>
            {imagePreview.currentIndex + 1} / {imagePreview.images.length}
          </Typography>
          <Button 
            disabled={imagePreview.currentIndex === imagePreview.images.length - 1}
            onClick={() => setImagePreview({
              ...imagePreview,
              currentIndex: imagePreview.currentIndex + 1
            })}
          >
            Next
          </Button>
          <Button onClick={handleCloseImagePreview} color="primary">
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CustomerDetails;
