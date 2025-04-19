import React from "react";
import NavTabs from "./NavTabs";

export default function Header() {
  return (
    <div className="bg-[#1E2229] w-full py-4 px-10 flex justify-between items-center shadow-md font-poppins">
      {/* Left Side - Agency Name & Address */}
      <div className="max-w-3xl">
        <h1 className="text-white text-4xl font-bold leading-tight">
          The Nashik Peoples Recovery Agency
        </h1>
        <h4 className="text-gray-300 text-sm mt-1">
          Shop No.5, Kakad Palace, Opp. Yashwant Mangal Karyalaya, Near SBI Meri
          Branch, Dindori Road, Nashik-422004
        </h4>
      </div>

      {/* Right Side - Navigation Tabs */}
      <NavTabs />
    </div>
  );
}
