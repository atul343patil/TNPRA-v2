import * as React from "react";
import PropTypes from "prop-types";
import Box from "@mui/material/Box";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";

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
        if (samePageLinkNavigation(event)) {
          event.preventDefault();
        }
      }}
      aria-current={props.selected && "page"}
      {...props}
    />
  );
}

LinkTab.propTypes = {
  selected: PropTypes.bool,
};

export default function NavTabs() {
  const [value, setValue] = React.useState(0);

  const handleChange = (event, newValue) => {
    if (
      event.type !== "click" ||
      (event.type === "click" && samePageLinkNavigation(event))
    ) {
      setValue(newValue);
    }
  };

  return (
    <Box className="font-poppins">
      <Tabs
        value={value}
        onChange={handleChange}
        aria-label="nav tabs example"
        role="navigation"
        className="space-x-6"
        sx={{
          "& .MuiTabs-indicator": {
            backgroundColor: "white", // White underline
            height: "3px",
            borderRadius: "4px",
          },
        }}
      >
        <LinkTab
          label="Home"
          href="/home"
          sx={{
            color: value === 0 ? "white" : "#B0B0B0", // Selected is white, unselected is gray
            textTransform: "none",
            fontWeight: value === 0 ? "bold" : "normal",
            fontSize: "16px",
            "&:hover": { color: "white" }, // Hover effect
          }}
        />
        <LinkTab
          label="About Us"
          href="/about"
          sx={{
            color: value === 1 ? "white" : "#B0B0B0",
            textTransform: "none",
            fontWeight: value === 1 ? "bold" : "normal",
            fontSize: "16px",
            "&:hover": { color: "white" },
          }}
        />
        <LinkTab
          label="Login"
          href="/login"
          sx={{
            color: value === 2 ? "white" : "#B0B0B0",
            textTransform: "none",
            fontWeight: value === 2 ? "bold" : "normal",
            fontSize: "16px",
            "&:hover": { color: "white" },
          }}
        />
      </Tabs>
    </Box>
  );
}
