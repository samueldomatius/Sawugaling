'use client';

import React, { useEffect, useState } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

export default function WayangLoader() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  
  // This state controls whether the DOM element is actually rendered
  // We keep it rendered for a bit after isLoading becomes false to let animation finish
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    let safetyTimer: NodeJS.Timeout;

    const handleStart = () => {
      setIsLoading(true);
      setIsMounted(true);
      // Safety timeout in case a page forgets to call stop-loading
      clearTimeout(safetyTimer);
      safetyTimer = setTimeout(() => {
        setIsLoading(false);
      }, 12000); // Increased from 3s to 12s to cover Vercel DB cold starts
    };

    const handleStop = () => {
      // Small delay before stopping to ensure React has painted the DOM
      setTimeout(() => {
        setIsLoading(false);
      }, 150);
    };

    window.addEventListener('start-loading', handleStart);
    window.addEventListener('stop-loading', handleStop);
    
    return () => {
      window.removeEventListener('start-loading', handleStart);
      window.removeEventListener('stop-loading', handleStop);
      clearTimeout(safetyTimer);
    };
  }, []);

  useEffect(() => {
    if (!isLoading && isMounted) {
      // Wait for the CSS transition (opening animation) to finish before unmounting
      const timer = setTimeout(() => {
        setIsMounted(false);
      }, 800); // 800ms matches the CSS transition duration
      
      return () => clearTimeout(timer);
    }
  }, [isLoading, isMounted]);

  if (!isMounted) return null;

  return (
    <div className={`wayang-loader-overlay ${!isLoading ? 'wayang-loader-hide' : ''}`}>
      <div className="wayang-loader-half wayang-loader-left">
        <div className="wayang-gunungan-left"></div>
      </div>
      <div className="wayang-loader-half wayang-loader-right">
        <div className="wayang-gunungan-right"></div>
      </div>
      
      {isLoading && (
        <div className="wayang-loader-spinner">
          <svg className="javanese-logo-glow" viewBox="0 0 100 130" width="60" height="70" fill="none" stroke="#D97706" strokeWidth="3">
            <path d="M50 10 C20 60, 10 100, 10 120 C10 130, 20 130, 50 130 C80 130, 90 130, 90 120 C90 100, 80 60, 50 10 Z" fill="#FFFBEB" />
            <line x1="50" y1="130" x2="50" y2="40" />
            <circle cx="50" cy="130" r="10" fill="#D97706" />
            <path d="M50 80 Q30 70, 25 85 M50 80 Q70 70, 75 85" strokeWidth="2.5" />
          </svg>
          <p className="wayang-loader-text">Ngrantos Sekedhap...</p>
        </div>
      )}
    </div>
  );
}
