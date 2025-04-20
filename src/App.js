import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { AnimatePresence } from 'framer-motion';
import theme from './styles/theme';
import { RecoveryProvider } from './context/RecoveryContext';
import { AuthProvider, useAuth } from './context/AuthContext';

// Import pages
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Home from './pages/Home';
import Branches from './pages/Branches';
import Customers from './pages/Customers';
import CustomerDetails from './pages/CustomerDetails';
import Reports from './pages/Reports';
import UserManagement from './pages/UserManagement';
import AboutUs from './pages/AboutUs';

// Import components
import Layout from './components/Layout';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  return children;
};

function AppContent() {
  const { user } = useAuth();

  return (
    <AnimatePresence mode='wait'>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<Home />} />
        <Route path="/login" element={!user ? <Login /> : <Navigate to="/dashboard" />} />
        <Route path="/about" element={<AboutUs />} />
        
        {/* Protected routes */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="branches" element={<Branches />} />
          <Route path="customers" element={<Customers />} />
          <Route path="customer/:id" element={<CustomerDetails />} />
          <Route path="reports" element={<Reports />} />
          <Route path="users" element={<UserManagement />} />
        </Route>
      </Routes>
    </AnimatePresence>
  );
}

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <RecoveryProvider>
          <Router>
            <AppContent />
          </Router>
        </RecoveryProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
