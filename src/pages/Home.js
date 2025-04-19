import React from "react";
import Header from "../components/Header";
import HeroSection from "../components/HeroSection";
import ContactInfo from "../components/ContactInfo";
import BackgroundImage from "../assets/BackgroundImage.jpg";

function Home() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[#242424]">
      {/* Header on top */}
      <div className="relative z-20 w-full bg-[#1E2229]">
        <Header />
      </div>

      {/* Background Image with lower opacity gradient */}
      <div 
        className="absolute inset-0 z-0 bg-cover bg-center opacity-40" 
        style={{ backgroundImage: `url(${BackgroundImage})` }} 
      />

      {/* Content Layer (Ensuring it's above the background) */}
      <div className="relative z-10 flex flex-col h-full w-full text-white px-4 overflow-hidden">
        <HeroSection />
        <ContactInfo />
      </div>
    </div>
  );
}

export default Home;
