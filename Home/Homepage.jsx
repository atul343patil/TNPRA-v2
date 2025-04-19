import React from "react";
import Header from "../components/Header";
import HeroSection from "../components/HeroSection";
import ContactInfo from "../components/ContactInfo";
import BackgroundImage from "../assets/Backgroundimage.jpg"; // Correct import

function Page1() {
  return (
    <div className="relative h-screen overflow-hidden bg-[#242424]">
      {/* ✅ Keep Header on top */}
      <div className="relative z-20 w-full bg-[#242424]/90">
        <Header />
      </div>

      {/* Background Image & Gradient */}
      <div className="absolute inset-0 z-0 bg-cover bg-center opacity-25" 
        style={{ backgroundImage: `url(${BackgroundImage})` }} 
      >
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black"></div> {/* Overlay */}
      </div>

      {/* Content Layer (Ensuring it's above the background) */}
      <div className="relative z-10 flex flex-col  h-full w-full text-white px-4 overflow-hidden">
        <HeroSection  />
        <ContactInfo />
      </div>
    </div>
  );
}

export default Page1;
