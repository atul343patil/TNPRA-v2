import React from "react";
import { Mail, Phone, LocationOn } from "@mui/icons-material";

export default function ContactInfo() {
  const handleContactClick = () => {
    window.open(
      "https://mail.google.com/mail/?view=cm&fs=1&to=nashikpeoplesrecoveryagency@gmail.com&su=Inquiry%20for%20The%20Nashik%20Peoples%20Recovery%20Agency",
      "_blank"
    );
  };

  return (
    <div className="flex flex-row mt-10">
      <div className="basis-1/3">
        <button 
          onClick={handleContactClick}
          className="mt-6 ml-10 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-full shadow-lg text-lg"
        >
          Contact Now
        </button>
      </div>  

      <div className="basis-2/3 space-y-4 text-gray-300 text-lg text-center">
        <div className="flex items-center justify-left space-x-2">
          <Phone className="text-blue-500" />
          <span>+91 9423965730</span>
        </div>
        <div className="flex items-center justify-left space-x-2">
          <Mail className="text-blue-500" />
          <span>nashikpeoplesrecoveryagency@gmail.com</span>
        </div>
        <div className="flex items-center justify-left space-x-2">
          <LocationOn className="text-blue-500" />
          <span>
            Shop No.5, Kakad Palace, Opp. Yashwant Mangal Karyalaya, Near SBI
            Meri Branch, Dindori Road, Nashik-422004
          </span>
        </div>
      </div>
    </div>
  );
}
