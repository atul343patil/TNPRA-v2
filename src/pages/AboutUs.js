import React from "react";
import Header from "../components/Header";
import BackgroundImage from "../assets/BackgroundImage.jpg";

function AboutUs() {
  const sinceYear = 2010;
  const currentYear = new Date().getFullYear();
  const yearsOfExperience = currentYear - sinceYear;
  
  const yearData = [
    {
      year: 2015,
      branches: [
        { bankName: 'ABC Bank', branchName: 'Main Branch', recoveryPercentage: 82, totalCases: 120, recoveredCases: 98 },
        { bankName: 'XYZ Bank', branchName: 'Downtown Branch', recoveryPercentage: 76, totalCases: 150, recoveredCases: 114 }
      ]
    },
    {
      year: 2018,
      branches: [
        { bankName: 'Sample Bank', branchName: 'North Branch', recoveryPercentage: 88, totalCases: 110, recoveredCases: 97 },
        { bankName: 'City Bank', branchName: 'Central Branch', recoveryPercentage: 91, totalCases: 85, recoveredCases: 77 }
      ]
    },
    {
      year: 2021,
      branches: [
        { bankName: 'Metro Bank', branchName: 'East Branch', recoveryPercentage: 94, totalCases: 130, recoveredCases: 122 },
        { bankName: 'Global Bank', branchName: 'West Branch', recoveryPercentage: 89, totalCases: 95, recoveredCases: 85 },
        { bankName: 'National Bank', branchName: 'South Branch', recoveryPercentage: 92, totalCases: 105, recoveredCases: 97 }
      ]
    }
  ];

  return (
    <div className="relative min-h-screen bg-[#242424]">
      {/* Header on top */}
      <div className="relative z-20 w-full bg-[#242424]/90">
        <Header />
      </div>

      {/* Background Image & Gradient */}
      <div className="absolute inset-0 z-0 bg-cover bg-center opacity-25" 
        style={{ backgroundImage: `url(${BackgroundImage})` }} 
      >
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black"></div>
      </div>

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 py-12 text-white font-poppins">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold mb-6">About Us</h1>
          
          <div className="bg-[#1E2229]/80 p-6 rounded-lg shadow-lg mb-10">
            <h2 className="text-2xl font-semibold mb-4">Our Journey</h2>
            <p className="text-lg mb-4">
              The Nashik Peoples Recovery Agency has been a trusted partner in debt recovery since {sinceYear}, 
              with over {yearsOfExperience} years of experience in the field.
            </p>
            <p className="text-lg">
              We specialize in helping financial institutions recover outstanding debts while maintaining 
              professional relationships with customers. Our proven track record demonstrates our commitment 
              to excellence and our ability to deliver results.
            </p>
          </div>

          <h2 className="text-2xl font-semibold mb-6">Our Success Timeline</h2>
          
          {yearData.map(({ year, branches }) => (
            <div key={year} className="mb-12">
              <div className="flex items-center mb-6">
                <div className="flex-grow border-t border-blue-500"></div>
                <span className="mx-4 px-6 py-2 bg-blue-600 text-white text-xl font-semibold rounded-full">{year}</span>
                <div className="flex-grow border-t border-blue-500"></div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {branches.map((branch, idx) => (
                  <div key={idx} className="bg-[#1E2229] rounded-lg shadow-md overflow-hidden transition-transform duration-300 hover:transform hover:scale-105">
                    <div className="bg-blue-600 py-3 px-4">
                      <h3 className="text-xl font-semibold text-white">{branch.bankName}</h3>
                    </div>
                    <div className="p-5">
                      <p className="text-gray-300 mb-3">{branch.branchName}</p>
                      
                      <div className="mb-4">
                        <div className="flex justify-between mb-1">
                          <span>Recovery Rate</span>
                          <span className="font-semibold">{branch.recoveryPercentage}%</span>
                        </div>
                        <div className="w-full bg-gray-700 rounded-full h-2.5">
                          <div 
                            className="bg-blue-500 h-2.5 rounded-full" 
                            style={{ width: `${branch.recoveryPercentage}%` }}
                          ></div>
                        </div>
                      </div>
                      
                      <div className="flex justify-between text-sm">
                        <div>
                          <p className="text-gray-400">Total Cases</p>
                          <p className="font-semibold text-lg">{branch.totalCases}</p>
                        </div>
                        <div>
                          <p className="text-gray-400">Recovered</p>
                          <p className="font-semibold text-lg">{branch.recoveredCases}</p>
                        </div>
                        <div>
                          <p className="text-gray-400">Success</p>
                          <p className="font-semibold text-lg text-green-500">{Math.round(branch.recoveredCases / branch.totalCases * 100)}%</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
          
          <div className="bg-[#1E2229]/80 p-6 rounded-lg shadow-lg mt-10">
            <h2 className="text-2xl font-semibold mb-4">Our Approach</h2>
            <p className="text-lg mb-4">
              We believe in a professional and ethical approach to debt recovery. Our team works closely with 
              clients to understand their specific needs and develop tailored strategies for maximum recovery.
            </p>
            <p className="text-lg">
              With our extensive experience and dedicated team, we continue to maintain high recovery rates 
              across various financial institutions in Nashik and surrounding areas.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AboutUs;
