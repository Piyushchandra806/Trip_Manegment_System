"use client";

import { useState, useEffect } from "react";
import PassengerSearch from "@/components/PassengerSearch";
import PassengerCard from "@/components/PassengerCard";
import TrainDetails from "@/components/TrainDetails";
import FamilyMembers from "@/components/FamilyMembers";
import HotelDetails from "@/components/HotelDetails";
import { Share2, Copy, CheckCircle2 } from 'lucide-react';
import SharePreviewModal from "@/components/SharePreviewModal";

/**
 * Passenger search page.
 */
export default function PassengerPage() {
  const [searchState, setSearchState] = useState("idle"); // idle | loading | found | not-found | error
  const [passenger, setPassenger] = useState(null);
  const [familyMembers, setFamilyMembers] = useState([]);
  const [errorMessage, setErrorMessage] = useState("");
  
  const [copySuccess, setCopySuccess] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  useEffect(() => {
    if (searchState === "found" && passenger) {
      window.dispatchEvent(new CustomEvent('passengerFound', { detail: passenger }));
    } else {
      window.dispatchEvent(new CustomEvent('passengerFound', { detail: null }));
    }
  }, [searchState, passenger]);


  const handleSearch = async (mobile) => {
    setSearchState("loading");
    setErrorMessage("");
    setCopySuccess(false);

    try {
      const response = await fetch(`/api/passenger?mobile=${mobile}`);
      
      if (response.status === 404) {
        setPassenger(null);
        setFamilyMembers([]);
        setSearchState("not-found");
        return;
      }
      
      if (!response.ok) {
        throw new Error("API error");
      }

      const data = await response.json();
      
      setPassenger({
        ...data.passenger,
        train: data.train,
        hotels: data.hotels
      });
      setFamilyMembers(data.family || []);
      setSearchState("found");
      
    } catch (err) {
      
      setErrorMessage("We couldn't load your trip information. Please try again.");
      setSearchState("error");
    }
  };

  const handleReset = () => {
    setSearchState("idle");
    setPassenger(null);
    setFamilyMembers([]);
    setErrorMessage("");
  };

  const generateShareText = () => {
    let text = `${passenger.name}\n\n`;
    
    if (passenger.train) {
      text += `Train:\nCoach: ${passenger.train.coach}\nBerth: ${passenger.train.berth} ${passenger.train.berthType !== 'Unknown' ? passenger.train.berthType : ''}\n\n`;
    }
    
    if (familyMembers.length > 0) {
      text += `Family Members:\n`;
      familyMembers.forEach(m => {
        if (m.mobile !== passenger.mobile) text += `- ${m.name}\n`;
      });
      text += `\n`;
    }
    
    if (passenger.hotels && passenger.hotels.length > 0) {
      passenger.hotels.forEach(h => {
        text += `Hotel Day ${h.day}:\n${h.hotelName}\nFloor: ${h.floor}\nRoom: ${h.roomNumber}\n\n`;
      });
    }
    
    return text.trim();
  };

  const handleShare = () => {
    setIsShareModalOpen(true);
  };

  const handleCopy = (textToCopy = generateShareText()) => {
    navigator.clipboard.writeText(textToCopy).then(() => {
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 3000);
    });
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12 print:py-0">
      {/* Search state */}
      {(searchState === "idle" || searchState === "error") && (
        <div className="max-w-lg mx-auto animate-fade-in">
          <PassengerSearch
            onSearch={handleSearch}
            isLoading={searchState === "loading"}
          />
          {searchState === "error" && (
             <div className="mt-4 p-4 bg-red-50 text-red-700 rounded-xl text-center text-sm font-medium border border-red-100">
               {errorMessage}
             </div>
          )}
        </div>
      )}

      {/* Loading state */}
      {searchState === "loading" && (
        <div className="max-w-lg mx-auto animate-fade-in flex flex-col items-center justify-center py-12">
           <div className="w-8 h-8 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin mb-4"></div>
           <p className="text-slate-600 font-medium">Finding your trip details...</p>
        </div>
      )}

      {/* Passenger found */}
      {searchState === "found" && passenger && (
        <div className="animate-fade-in">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
            <div>
              <div className="flex items-center gap-2 text-green-600 font-bold text-lg mb-2 print:hidden">
                <CheckCircle2 className="w-6 h-6" /> ✓ Your trip details are ready
              </div>
              <button
                onClick={handleReset}
                className="text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors bg-blue-50 px-3 py-1.5 rounded-lg print:hidden"
              >
                ← Search Another Number
              </button>
            </div>
            
            <div className="flex gap-2 w-full md:w-auto print:hidden">
              <button
                onClick={() => handleCopy()}
                className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-white border border-slate-200 text-slate-700 px-4 py-2 rounded-lg font-medium hover:bg-slate-50 transition-colors"
              >
                {copySuccess ? <CheckCircle2 className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                {copySuccess ? 'Copied!' : 'Copy Details'}
              </button>
              <button
                  onClick={handleShare}
                  className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                >
                  <Share2 className="w-4 h-4" /> Share My Details
                </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6">
            {/* Left column */}
            <div className="lg:col-span-5 space-y-4 lg:space-y-6">
              <PassengerCard passenger={passenger} />
              <TrainDetails train={passenger.train} />
            </div>

            {/* Right column */}
            <div className="lg:col-span-7 space-y-4 lg:space-y-6">
              <FamilyMembers
                members={familyMembers}
                currentPassengerName={passenger.name}
              />
              <HotelDetails hotels={passenger.hotels} familyMembers={familyMembers} />
            </div>
          </div>
        </div>
      )}

      {/* Not found */}
      {searchState === "not-found" && (
        <div className="max-w-lg mx-auto animate-fade-in text-center py-12 bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
          <div className="w-16 h-16 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">
            😕
          </div>
          <h2 className="text-xl font-bold text-slate-800 mb-2">We couldn't find your details.</h2>
          <p className="text-slate-500 mb-6">Please check your mobile number and try again.</p>
          <button
            onClick={handleReset}
            className="bg-slate-900 text-white px-6 py-3 rounded-xl font-bold hover:bg-slate-800 transition-colors"
          >
            Try Again
          </button>
        </div>
      )}
      <SharePreviewModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        passenger={passenger}
        familyMembers={familyMembers}
      />

    </div>
  );
}
