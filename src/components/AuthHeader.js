import React from "react";
import { useAuth } from "../context/AuthContext";
import { Avatar, Box, Typography, IconButton } from "@mui/material";
import { AccountCircle as AccountCircleIcon, Menu as MenuIcon } from "@mui/icons-material";

// Define a constant for header height to use consistently across components
export const HEADER_HEIGHT = 90; // in pixels

export default function AuthHeader({ isSidebarOpen, toggleSidebar }) {
  const { user } = useAuth();
  
  return (
    <div className="bg-[#1E2229] w-full h-[90px] px-4 md:px-6 flex justify-between items-center shadow-md font-poppins z-50 fixed top-0 left-0 right-0">
      {/* Left Side with Menu Icon and Agency Info */}
      <div className="flex items-center">
        {/* Menu Toggle Button */}
        <IconButton 
          onClick={toggleSidebar} 
          sx={{ 
            color: 'white', 
            mr: 2,
            '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' } 
          }}
        >
          <MenuIcon />
        </IconButton>

        {/* Agency Name & Address stacked vertically */}
        <div className="max-w-4xl flex flex-col justify-center">
          <h1 className="text-white text-3xl md:text-5xl font-bold leading-tight whitespace-nowrap mb-[3px] mt-0">
            The Nashik Peoples Recovery Agency
          </h1>
          <span className="text-gray-300 text-xs md:text-base font-normal whitespace-nowrap mt-1">
            Shop No.5, Kakad Palace, Opp. Yashwant Mangal Karyalaya, Near SBI Meri Branch, Dindori Road, Nashik-422004
          </span>
        </div>
      </div>

      {/* Right Side - User Profile */}
      <div className="flex items-center gap-3">
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
          <Typography variant="subtitle1" sx={{ color: 'white', fontWeight: 'medium' }}>
            {user?.username || 'User'}
          </Typography>
          <Typography variant="body2" sx={{ color: '#B0B0B0' }}>
            {user?.role || 'Guest'}
          </Typography>
        </Box>
        <Avatar sx={{ bgcolor: '#2196f3' }}>
          <AccountCircleIcon />
        </Avatar>
      </div>
    </div>
  );
}
