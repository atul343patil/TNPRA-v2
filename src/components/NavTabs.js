import * as React from "react";
import PropTypes from "prop-types";
import Box from "@mui/material/Box";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import { useNavigate, useLocation } from "react-router-dom";

function samePageLinkNavigation(event) {
  if (
    event.defaultPrevented ||
    event.button !== 0 || // Ignore everything but left-click
    event.metaKey ||
    event.ctrlKey ||
    event.altKey ||
    event.shiftKey
  ) {
    return false;
  }
  return true;
}

function LinkTab(props) {
  return (
    <Tab
      component="a"
      onClick={(event) => {
        // Always prevent default to avoid page reload
        event.preventDefault();
        if (samePageLinkNavigation(event) && props.onClick) {
          props.onClick();
        }
      }}
      aria-current={props.selected && "page"}
      {...props}
    />
  );
}

LinkTab.propTypes = {
  selected: PropTypes.bool,
  onClick: PropTypes.func,
};

export default function NavTabs() {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Determine active tab based on current path
  const getActiveTab = () => {
    const path = location.pathname;
    if (path === '/') return 0;
    if (path === '/about') return 1;
    if (path === '/login') return 2;
    return false; // No tab selected for other paths
  };

  const handleNavigation = (path) => {
    navigate(path);
  };

  return (
    <Box className="font-poppins">
      <Tabs
        value={getActiveTab()}
        aria-label="navigation tabs"
        role="navigation"
        className="space-x-6"
        sx={{
          "& .MuiTabs-indicator": {
            display: "none", // Remove the underline indicator
          },
        }}
      >
        <LinkTab
          label="Home"
          href="#"
          onClick={() => handleNavigation('/')}
          sx={{
            color: getActiveTab() === 0 ? "white" : "#B0B0B0", // Selected is white, unselected is gray
            textTransform: "none",
            fontWeight: getActiveTab() === 0 ? "bold" : "normal",
            fontSize: "16px",
            "&:hover": { color: "white" }, // Hover effect
          }}
        />
        <LinkTab
          label="About Us"
          href="#"
          onClick={() => handleNavigation('/about')}
          sx={{
            color: getActiveTab() === 1 ? "white" : "#B0B0B0",
            textTransform: "none",
            fontWeight: getActiveTab() === 1 ? "bold" : "normal",
            fontSize: "16px",
            "&:hover": { color: "white" },
          }}
        />
        <LinkTab
          label="Login"
          href="#"
          onClick={() => handleNavigation('/login')}
          sx={{
            color: getActiveTab() === 2 ? "white" : "#B0B0B0",
            textTransform: "none",
            fontWeight: getActiveTab() === 2 ? "bold" : "normal",
            fontSize: "16px",
            "&:hover": { color: "white" },
          }}
        />
      </Tabs>
    </Box>
  );
}
