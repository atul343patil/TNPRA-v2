import React, { useState } from 'react';
import {
  Box,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  Typography,
  Button,
  IconButton,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  AccountBalance as BranchIcon,
  People as CustomersIcon,
  Description as ReportsIcon,
  ManageAccounts as UserManagementIcon,
  Logout as LogoutIcon,
  Menu as MenuIcon,
  ChevronLeft as ChevronLeftIcon,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { HEADER_HEIGHT } from './AuthHeader';

const drawerWidth = 240;

const Sidebar = ({ open, toggleDrawer }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const menuItems = [
    { text: 'Dashboard', icon: <DashboardIcon />, path: '/dashboard' },
    { text: 'Customers', icon: <CustomersIcon />, path: '/customers' },
    { text: 'Branches', icon: <BranchIcon />, path: '/branches' },
    { text: 'Reports', icon: <ReportsIcon />, path: '/reports' },
  ];

  // Add User Management for admin users
  if (user?.role === 'ADMIN') {
    menuItems.push({
      text: 'Officer Management',
      icon: <UserManagementIcon />,
      path: '/users'
    });
  }

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <>
      {/* Mobile menu toggle button removed as it's now in the header */}
      
      <Drawer
        variant="persistent"
        anchor="left"
        open={open}
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: drawerWidth,
            boxSizing: 'border-box',
            backgroundColor: '#1E2229', // Match header color
            borderRight: 'none', // Remove border
            overflowX: 'hidden',
            position: 'fixed',
            top: `${HEADER_HEIGHT}px`, // Position exactly below header
            height: `calc(100% - ${HEADER_HEIGHT}px)`, // Adjust height to account for header
            zIndex: 1000, // Ensure it's above content but below header
          },
        }}
      >
      <Box sx={{ overflow: 'auto' }}>
        {/* Removed sidebar header with toggle button */}
        <Divider />
        <List>
          {menuItems.map((item) => (
            <ListItem key={item.text} disablePadding>
              <ListItemButton
                selected={location.pathname === item.path}
                onClick={() => navigate(item.path)}
                sx={{
                  minHeight: 48,
                  justifyContent: 'initial',
                  px: 2.5,
                  color: 'white',
                  '&.Mui-selected': {
                    backgroundColor: 'rgba(255, 255, 255, 0.08)',
                  },
                  '&:hover': {
                    backgroundColor: 'rgba(255, 255, 255, 0.12)',
                  }
                }}
              >
                <ListItemIcon sx={{ minWidth: 0, mr: 3, color: 'white' }}>
                  {item.icon}
                </ListItemIcon>
                <ListItemText primary={item.text} />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
        <Divider />
        <Box sx={{ p: 2 }}>
          <Typography variant="body2" sx={{ mb: 1, color: 'rgba(255, 255, 255, 0.7)' }}>
            Logged in as: {user?.username}
          </Typography>
          <Typography variant="body2" sx={{ mb: 2, color: 'rgba(255, 255, 255, 0.7)' }}>
            Role: {user?.role}
          </Typography>
          <Button
            fullWidth
            variant="outlined"
            color="error"
            startIcon={<LogoutIcon />}
            onClick={handleLogout}
            sx={{ 
              justifyContent: 'flex-start',
              borderColor: '#f50057',
              color: '#f50057',
              '&:hover': {
                borderColor: '#ff4081',
                backgroundColor: 'rgba(245, 0, 87, 0.08)'
              }
            }}
          >
            Logout
          </Button>
        </Box>
      </Box>
    </Drawer>
    </>
  );
};

export default Sidebar;
