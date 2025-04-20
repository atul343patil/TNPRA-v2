import React from "react";
import NavTabs from "./NavTabs";

export default function Header() {
  return (
    <div className="bg-[#1E2229] w-full py-[10px] px-10 flex justify-between items-center shadow-md font-poppins">
      {/* Left Side - Agency Name & Address stacked vertically */}
      <div className="max-w-4xl flex flex-col justify-center">
        <h1 className="text-white text-5xl font-bold leading-tight whitespace-nowrap mb-[3px] mt-0">
          The Nashik Peoples Recovery Agency
        </h1>
        <span className="text-gray-300 text-base font-normal whitespace-nowrap mt-1">
          Shop No.5, Kakad Palace, Opp. Yashwant Mangal Karyalaya, Near SBI Meri Branch, Dindori Road, Nashik-422004
        </span>
      </div>

      {/* Right Side - Navigation Tabs */}
      <div className="mt-0">
        <NavTabs />
      </div>
    </div>
  );
}
