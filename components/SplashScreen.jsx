'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';

export default function SplashScreen({ children }) {
  const [showSplash, setShowSplash] = useState(true);
  const [isFadingOut, setIsFadingOut] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    
    // Check if splash was already shown in this session
    // Removed sessionStorage to allow splash on hard reload
    
    

    // Prevent scrolling while splash is active
    document.body.style.overflow = 'hidden';

    // Start fade out after 2.5s
    const fadeTimer = setTimeout(() => {
      setIsFadingOut(true);
      document.body.style.overflow = '';
    }, 2500);

    // Remove splash completely after 3s
    const removeTimer = setTimeout(() => {
      setShowSplash(false);
      
    }, 3000);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(removeTimer);
      document.body.style.overflow = '';
    };
  }, []);

  // Avoid hydration mismatch by rendering normally on server, then determining splash on client
  if (!mounted) {
     return <>{children}</>;
  }

  return (
    <>
      {showSplash && (
        <div 
          className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-orange-50/95 backdrop-blur-sm transition-opacity duration-500 ease-in-out ${
            isFadingOut ? 'opacity-0 pointer-events-none' : 'opacity-100'
          }`}
          role="presentation"
        >
          <div className="flex flex-col items-center text-center px-4 max-w-lg mx-auto">
            {/* Logo */}
            <div className="mb-6 relative w-48 h-48 sm:w-56 sm:h-56 animate-splash-scale">
              <Image 
                src="/jaijaipur-logo.png" 
                alt="Jaijaipur Sewa Samiti Logo" 
                fill
                priority
                className="object-contain drop-shadow-xl"
              />
            </div>

            <p 
              className="text-lg sm:text-xl text-orange-800 font-medium tracking-wide animate-splash-fade-up opacity-0" 
              style={{ animationDelay: '200ms' }}
            >
              Welcome to
            </p>

            <h1 
              className="text-2xl sm:text-3xl md:text-4xl font-black text-red-700 my-3 animate-splash-fade-up opacity-0 drop-shadow-sm" 
              style={{ animationDelay: '400ms' }}
            >
              7 ज्योतिर्लिंग और 1 धाम यात्रा
            </h1>

            <p 
              className="text-sm sm:text-base text-orange-700 mt-4 mb-2 animate-splash-fade-up opacity-0" 
              style={{ animationDelay: '600ms' }}
            >
              by
            </p>

            <h2 
              className="text-xl sm:text-2xl font-bold text-orange-900 animate-splash-fade-up opacity-0" 
              style={{ animationDelay: '800ms' }}
            >
              Jaijaipur Sewa Samiti
            </h2>
          </div>
        </div>
      )}
      
      {/* Main app content renders underneath */}
      {children}
    </>
  );
}
