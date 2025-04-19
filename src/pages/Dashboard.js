import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Divider,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { motion } from 'framer-motion';
import ExcelUpload from '../components/ExcelUpload';
import { useRecovery } from '../context/RecoveryContext';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

const Dashboard = () => {
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const { recoveryStats } = useRecovery();
  const { user } = useAuth();

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const token = localStorage.getItem('authToken');
        
        // Fetch customers based on user role
        const response = await axios.get('http://localhost:5000/api/customers', {
          headers: {
            'Authorization': `Bearer ${token}`
          },
          params: {
            // If officer, only fetch their assigned customers
            ...(user?.role === 'OFFICER' && { assignedTo: user.username }),
            // Get all customers (no pagination)
            limit: 1000
          }
        });
        
        if (response.status === 200) {
          const customers = response.data.customers;
          processCustomerData(customers);
        } else {
          throw new Error('Failed to fetch customer data');
        }
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError('Failed to load dashboard data. Please try again.');
        
        // Fallback to local data if API fails
        const savedData = localStorage.getItem('excelData');
        if (savedData) {
          const parsedData = JSON.parse(savedData);
          // For officers, filter the data to only show their customers
          if (user?.role === 'OFFICER') {
            const filteredData = parsedData.filter(item => 
              item.assignedTo === user.username
            );
            processExcelData(filteredData);
          } else {
            processExcelData(parsedData);
          }
        }
      } finally {
        setLoading(false);
      }
    };
    
    fetchDashboardData();
  }, [user]);

  const processCustomerData = (customers) => {
    // Calculate total amounts
    const totalOutstanding = customers.reduce((sum, customer) => 
      sum + (parseFloat(customer.outstandingBalance) || 0), 0);
    
    const totalPrincipleOverdue = customers.reduce((sum, customer) => 
      sum + (parseFloat(customer.principleOverdue) || 0), 0);
    
    const totalInterestOverdue = customers.reduce((sum, customer) => 
      sum + (parseFloat(customer.interestOverdue) || 0), 0);
    
    // Count cases
    const pendingCases = customers.length;
    
    // Count high risk accounts (based on Asset Classification)
    const highRiskAccounts = customers.filter(customer => 
      customer.assetClassification?.toLowerCase().includes('npa')
    ).length;
    
    // Process monthly NPA data
    const monthlyData = {};
    customers.forEach(customer => {
      if (customer.dateOfNPA) {
        const date = new Date(customer.dateOfNPA);
        const month = date.toLocaleString('default', { month: 'short', year: '2-digit' });
        monthlyData[month] = (monthlyData[month] || 0) + (parseFloat(customer.outstandingBalance) || 0);
      }
    });

    // Product type distribution
    const productTypes = {};
    customers.forEach(customer => {
      const type = customer.productType || 'Unknown';
      productTypes[type] = (productTypes[type] || 0) + (parseFloat(customer.outstandingBalance) || 0);
    });

    // Branch performance
    const branches = {};
    customers.forEach(customer => {
      const branch = customer.branchName || 'Unknown';
      branches[branch] = (branches[branch] || 0) + (parseFloat(customer.outstandingBalance) || 0);
    });

    // Asset Classification distribution
    const assetClasses = {};
    customers.forEach(customer => {
      const classification = customer.assetClassification || 'Unclassified';
      assetClasses[classification] = (assetClasses[classification] || 0) + (parseFloat(customer.outstandingBalance) || 0);
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
    });
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
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <Box sx={{ p: 3 }}>
        <Typography variant="h5" gutterBottom>
          Dashboard {user?.role === 'OFFICER' ? '- My Customers' : '- All Customers'}
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 5 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            {/* Summary Cards */}
            <Grid container spacing={3} sx={{ mb: 3 }}>
              <Grid item xs={12} sm={6} md={3}>
                <Card>
                  <CardContent>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      Total Outstanding
                    </Typography>
                    <Typography variant="h5" component="div">
                      {formatCurrency(dashboardData.totalOutstanding)}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Card>
                  <CardContent>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      Principle Overdue
                    </Typography>
                    <Typography variant="h5" component="div">
                      {formatCurrency(dashboardData.totalPrincipleOverdue)}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              {/* <Grid item xs={12} sm={6} md={3}>
                <Card>
                  <CardContent>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      Interest Overdue
                    </Typography>
                    <Typography variant="h5" component="div">
                      {formatCurrency(dashboardData.totalInterestOverdue)}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid> */}
              {/* <Grid item xs={12} sm={6} md={3}>
                <Card>
                  <CardContent>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      High Risk Accounts
                    </Typography>
                    <Typography variant="h5" component="div">
                      {dashboardData.highRiskAccounts} / {dashboardData.pendingCases}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid> */}
            </Grid>

            {/* Charts */}
            <Grid container spacing={3}>
              <Grid item xs={12} md={7}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Monthly NPA Trends
                    </Typography>
                    {dashboardData.monthlyNPA.length > 0 ? (
                      <Box sx={{ height: 300, width: '95%', margin: '0 auto' }}>
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={dashboardData.monthlyNPA}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis />
                            <RechartsTooltip formatter={(value) => formatCurrency(value)} />
                            <Bar dataKey="amount" fill="#2196f3" />
                          </BarChart>
                        </ResponsiveContainer>
                      </Box>
                    ) : (
                      <Box sx={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Typography variant="body1" color="text.secondary">
                          No monthly NPA data available
                        </Typography>
                      </Box>
                    )}
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} md={5}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Product Distribution
                    </Typography>
                    {dashboardData.productTypeDistribution.length > 0 ? (
                      <Box sx={{ height: 300 }}>
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={dashboardData.productTypeDistribution}
                              dataKey="value"
                              nameKey="name"
                              cx="50%"
                              cy="50%"
                              outerRadius={80}
                              label={(entry) => {
                                // Calculate percentage
                                const percent = (entry.value / dashboardData.totalOutstanding) * 100;
                                // Truncate long names
                                const displayName = entry.name.length > 10 ? `${entry.name.substring(0, 8)}...` : entry.name;
                                return `${displayName}: ${percent.toFixed(1)}%`;
                              }}
                            >
                              {dashboardData.productTypeDistribution.map((entry, index) => (
                                <Cell key={index} fill={COLORS[index % COLORS.length]} />
                              ))}
                            </Pie>
                            <RechartsTooltip formatter={(value) => formatCurrency(value)} />
                          </PieChart>
                        </ResponsiveContainer>
                      </Box>
                    ) : (
                      <Box sx={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Typography variant="body1" color="text.secondary">
                          No product distribution data available
                        </Typography>
                      </Box>
                    )}
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Branch Performance
                    </Typography>
                    {dashboardData.branchPerformance.length > 0 ? (
                      <Box sx={{ height: 300 }}>
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={dashboardData.branchPerformance} layout="vertical">
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis type="number" />
                            <YAxis dataKey="name" type="category" width={100} />
                            <RechartsTooltip formatter={(value) => formatCurrency(value)} />
                            <Bar dataKey="amount" fill="#8884d8" />
                          </BarChart>
                        </ResponsiveContainer>
                      </Box>
                    ) : (
                      <Box sx={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Typography variant="body1" color="text.secondary">
                          No branch performance data available
                        </Typography>
                      </Box>
                    )}
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Asset Classification
                    </Typography>
                    {dashboardData.assetClassification.length > 0 ? (
                      <Box sx={{ height: 300 }}>
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={dashboardData.assetClassification}
                              dataKey="value"
                              nameKey="name"
                              cx="50%"
                              cy="50%"
                              outerRadius={80}
                              label={(entry) => `${entry.name}: ${((entry.value / dashboardData.totalOutstanding) * 100).toFixed(1)}%`}
                            >
                              {dashboardData.assetClassification.map((entry, index) => (
                                <Cell key={index} fill={COLORS[index % COLORS.length]} />
                              ))}
                            </Pie>
                            <RechartsTooltip formatter={(value) => formatCurrency(value)} />
                          </PieChart>
                        </ResponsiveContainer>
                      </Box>
                    ) : (
                      <Box sx={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Typography variant="body1" color="text.secondary">
                          No asset classification data available
                        </Typography>
                      </Box>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </>
        )}
      </Box>
    </motion.div>
  );
};

export default Dashboard;
