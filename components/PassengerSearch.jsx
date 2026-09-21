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

    onSearch(cleaned);
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
                       text-slate-800 font-mono"
            autoComplete="tel"
          />
          {error && (
            <p className="text-red-500 text-sm mt-2 text-center">{error}</p>
          )}
        </div>

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
    </div>
  );
}
