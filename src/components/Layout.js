import React, { useState } from 'react';
import { Box } from '@mui/material';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import AuthHeader, { HEADER_HEIGHT } from './AuthHeader';

const Layout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  
  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };
  
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {/* AuthHeader at the top */}
      <AuthHeader 
        isSidebarOpen={sidebarOpen} 
        toggleSidebar={toggleSidebar} 
      />
      
      {/* Main content area with sidebar */}
      <Box sx={{ display: 'flex', flexGrow: 1 }}>
        {/* Pass the open state to Sidebar */}
        <Sidebar open={sidebarOpen} toggleDrawer={toggleSidebar} />
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            bgcolor: 'background.default',
            minHeight: `calc(100vh - ${HEADER_HEIGHT}px)`, // Adjust for header height
            pt: 2, // Add some padding at the top
            pl: 3, // Left padding
            pr: 3, // Right padding
            mt: `${HEADER_HEIGHT}px`, // Add top margin to account for fixed header
            ml: sidebarOpen ? '240px' : 0, // Margin left when sidebar is open
            width: sidebarOpen ? 'calc(100% - 240px)' : '100%',
            position: 'absolute', // Use absolute positioning to eliminate blank space
            left: 0, // Start from the left edge
            transition: theme => theme.transitions.create(['margin-left', 'width'], {
              easing: theme.transitions.easing.easeOut,
              duration: theme.transitions.duration.enteringScreen,
            }),
          }}
        >
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
};

export default Layout;
