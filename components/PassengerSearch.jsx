"use client";

import { useState } from "react";

/**
 * PassengerSearch - Mobile number input and search form.
 *
 * Props:
 *  - onSearch(mobile): callback when user submits a mobile number
 *  - isLoading: boolean to show loading state on the button
 */
export default function PassengerSearch({ onSearch, isLoading = false }) {
  const [mobile, setMobile] = useState("");
  const [error, setError] = useState("");
  const [isPosterOpen, setIsPosterOpen] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");

    // Basic validation
    const cleaned = mobile.trim();
    if (!cleaned) {
      setError("Please enter your mobile number.");
      return;
    }
    if (!/^\d{10}$/.test(cleaned)) {
      setError("Please enter a valid 10-digit mobile number.");
      return;
    }

    onSearch({ mobile: cleaned });
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sm:p-8">
      <h2 className="text-xl sm:text-2xl font-bold text-slate-800 text-center">
        Find Your Trip Details
      </h2>
      <p className="text-slate-500 text-center mt-2 text-sm sm:text-base">
        Enter your registered mobile number
      </p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <div>
          <label htmlFor="mobile-input" className="sr-only">
            Mobile Number
          </label>
          <input
            id="mobile-input"
            type="tel"
            inputMode="numeric"
            maxLength={10}
            placeholder="9876543210"
            value={mobile}
            onChange={(e) => {
              // Allow only digits
              const val = e.target.value.replace(/\D/g, "");
              setMobile(val);
              if (error) setError("");
            }}
            className="w-full px-4 py-4 text-lg text-center tracking-widest rounded-xl
                       border-2 border-slate-200 bg-slate-50
                       focus:border-slate-400 focus:bg-white focus:outline-none
                       transition-colors duration-200
                       placeholder:text-slate-300 placeholder:tracking-widest
                       text-slate-800 font-mono disabled:opacity-50 disabled:bg-slate-100 disabled:cursor-not-allowed"
            autoComplete="tel"
          />
        </div>

          {error && (
            <p className="text-red-500 text-sm mt-2 text-center">{error}</p>
          )}

        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-4 px-6 bg-slate-900 text-white font-semibold text-base
                     rounded-xl hover:bg-slate-800 active:bg-slate-950
                     focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2
                     transition-colors duration-200
                     disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Searching...
            </span>
          ) : (
            "Find My Details"
          )}
        </button>
      </form>

      <p className="text-xs text-slate-400 text-center mt-4">
        Use your registered mobile number to find your seat and hotel details
      </p>

      {/* Tour Poster Section */}
      <div className="mt-8 pt-6 border-t border-slate-100 flex flex-col items-center">
        <p className="text-sm font-semibold text-slate-700 mb-3">
          Tour Itinerary & Details
        </p>
        <button
          type="button"
          onClick={() => setIsPosterOpen(true)}
          className="relative w-full rounded-xl overflow-hidden shadow-sm border border-slate-200 hover:shadow-md transition-shadow group cursor-zoom-in"
          aria-label="View Tour Poster"
        >
          <img 
            src="/images/tour-poster.png" 
            alt="Tour Itinerary Poster" 
            className="w-full h-auto object-cover block"
          />
          <div className="absolute inset-0 bg-slate-900/0 group-hover:bg-slate-900/10 transition-colors flex items-center justify-center">
             <div className="bg-white/95 backdrop-blur-sm text-slate-800 px-4 py-2 rounded-full font-medium text-sm shadow-sm opacity-0 group-hover:opacity-100 transition-opacity transform translate-y-2 group-hover:translate-y-0">
               Click to Zoom
             </div>
          </div>
        </button>
      </div>

      {/* Poster Zoom Modal */}
      {isPosterOpen && (
        <div 
          className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-md flex items-center justify-center p-2 sm:p-6 cursor-zoom-out"
          onClick={() => setIsPosterOpen(false)}
        >
          <button 
            type="button"
            className="absolute top-4 right-4 sm:top-6 sm:right-6 bg-white/10 hover:bg-white/20 text-white rounded-full p-2.5 backdrop-blur-md transition-colors z-[101]"
            onClick={(e) => { e.stopPropagation(); setIsPosterOpen(false); }}
            aria-label="Close Poster"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
          
          <div 
            className="relative w-full max-w-5xl max-h-full overflow-auto rounded-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <img 
              src="/images/tour-poster.png" 
              alt="Tour Itinerary Poster Zoomed" 
              className="w-full h-auto object-contain cursor-zoom-out"
              onClick={() => setIsPosterOpen(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
