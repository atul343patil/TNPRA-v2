import React from "react";
import Header from "../components/Header";
import HeroSection from "../components/HeroSection";
import ContactInfo from "../components/ContactInfo";
import BackgroundImage from "../assets/BackgroundImage.jpg";

function Home() {
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
        <div className="mt-10"> 
          <ContactInfo />
        </div>
      </div>
    </div>
  );
}

export default Home;
