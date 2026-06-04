'use client';

import React from 'react';

export type MascotMood = 'normal' | 'talking' | 'reading' | 'thinking' | 'happy' | 'celebrating';

interface MascotVisualProps {
  mood?: MascotMood;
  speechBubbleText?: string;
  width?: string;
  height?: string;
}

export default function MascotVisual({ mood = 'normal', speechBubbleText, width = '200px', height = '200px' }: MascotVisualProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative', width: '100%' }}>
      
      {/* Dynamic Javanese Mascot Speech Bubble */}
      {speechBubbleText && (
        <div 
          style={{ 
            backgroundColor: '#FFFFFF', 
            border: '2px solid #E5E7EB', 
            color: '#1F2937', 
            padding: '12px 16px', 
            borderRadius: '18px 18px 18px 0px',
            fontSize: '14px',
            fontWeight: '600',
            maxWidth: '260px',
            lineHeight: '1.4',
            marginBottom: '16px',
            boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
            position: 'relative',
            animation: 'scale-up 0.2s ease-out'
          }}
        >
          {speechBubbleText}
          <div 
            style={{ 
              position: 'absolute', 
              bottom: '-10px', 
              left: '12px', 
              width: '0', 
              height: '0', 
              borderLeft: '10px solid transparent', 
              borderRight: '10px solid transparent', 
              borderTop: '10px solid #E5E7EB' 
            }}
          ></div>
          <div 
            style={{ 
              position: 'absolute', 
              bottom: '-8px', 
              left: '13px', 
              width: '0', 
              height: '0', 
              borderLeft: '9px solid transparent', 
              borderRight: '9px solid transparent', 
              borderTop: '9px solid #FFFFFF' 
            }}
          ></div>
        </div>
      )}

      {/* Mascot Graphic container */}
      <div style={{ width, height, position: 'relative' }}>
        <svg 
          viewBox="0 0 200 200" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
          style={{ width: '100%', height: '100%', filter: 'drop-shadow(0 6px 16px rgba(0,0,0,0.08))' }}
        >
          {/* Sparkles for Celebrating mood */}
          {(mood === 'celebrating' || mood === 'happy') && (
            <g className="sparkles-anim">
              <circle cx="45" cy="45" r="5" fill="#FFD700" />
              <circle cx="155" cy="45" r="5" fill="#FFD700" />
              <circle cx="35" cy="110" r="4" fill="#FFD700" />
              <circle cx="165" cy="110" r="4" fill="#FFD700" />
              <circle cx="100" cy="30" r="6" fill="#FFD700" />
            </g>
          )}

          {/* Background aura glow */}
          <circle cx="100" cy="100" r="75" fill="url(#goldAura)" opacity={(mood === 'celebrating' || mood === 'happy') ? "0.8" : "0.4"} />
          
          {/* Javanese Blangkon Hat */}
          <path d="M50 85 C50 45, 150 45, 150 85 Z" fill="#8B4513" stroke="#D2691E" strokeWidth="3" />
          <path d="M100 45 C110 35, 130 35, 135 45 Z" fill="#4A2711" />
          <path d="M50 85 L150 85 C130 95, 70 95, 50 85 Z" fill="#FFC800" />
          {/* Blangkon Knot (Mondhokan) at back */}
          <circle cx="150" cy="85" r="12" fill="#8B4513" stroke="#FFC800" strokeWidth="2.5" />
          
          {/* Face */}
          <circle cx="100" cy="105" r="45" fill="#FFDFB0" stroke="#8B4513" strokeWidth="3" />
          
          {/* Eyebrows */}
          {mood === 'thinking' ? (
            <>
              {/* Thinking eyebrows: tilted */}
              <path d="M78 92 Q85 88 92 95" stroke="#4A2711" strokeWidth="3" fill="none" />
              <path d="M108 95 Q115 88 122 92" stroke="#4A2711" strokeWidth="3" fill="none" />
            </>
          ) : (
            <>
              {/* Normal eyebrows */}
              <path d="M78 94 Q85 91 92 94" stroke="#4A2711" strokeWidth="3" fill="none" />
              <path d="M108 94 Q115 91 122 94" stroke="#4A2711" strokeWidth="3" fill="none" />
            </>
          )}
          
          {/* Eyes based on mood */}
          {mood === 'thinking' ? (
            <>
              {/* Looking up */}
              <circle cx="85" cy="98" r="8" fill="#1F2937" />
              <circle cx="83" cy="95" r="3" fill="#FFF" />
              <circle cx="115" cy="98" r="8" fill="#1F2937" />
              <circle cx="113" cy="95" r="3" fill="#FFF" />
            </>
          ) : mood === 'reading' ? (
            <>
              {/* Closed / looking down eyes */}
              <path d="M78 100 Q85 107 92 100" stroke="#1F2937" strokeWidth="3.5" strokeLinecap="round" fill="none" />
              <path d="M108 100 Q115 107 122 100" stroke="#1F2937" strokeWidth="3.5" strokeLinecap="round" fill="none" />
            </>
          ) : (mood === 'celebrating' || mood === 'happy') ? (
            <>
              {/* Smiling happy curve eyes */}
              <path d="M78 102 Q85 95 92 102" stroke="#1F2937" strokeWidth="4" strokeLinecap="round" fill="none" />
              <path d="M108 102 Q115 95 122 102" stroke="#1F2937" strokeWidth="4" strokeLinecap="round" fill="none" />
            </>
          ) : (
            <>
              {/* Normal eyes */}
              <circle cx="85" cy="101" r="8" fill="#1F2937" />
              <circle cx="85" cy="101" r="2.5" fill="#FFF" />
              <circle cx="115" cy="101" r="8" fill="#1F2937" />
              <circle cx="115" cy="101" r="2.5" fill="#FFF" />
            </>
          )}
          
          {/* Mouth based on mood */}
          {mood === 'talking' ? (
            /* Open mouth animating */
            <ellipse cx="100" cy="122" rx="7" ry="11" fill="#EF4444" stroke="#8B4513" strokeWidth="2.5" />
          ) : (mood === 'celebrating' || mood === 'happy') ? (
            /* Wide open smile */
            <path d="M84 118 C84 136, 116 136, 116 118 Z" fill="#EF4444" stroke="#8B4513" strokeWidth="3" />
          ) : mood === 'thinking' ? (
            /* Small flat mouth line */
            <path d="M92 122 L108 122" stroke="#8B4513" strokeWidth="3.5" strokeLinecap="round" />
          ) : (
            /* Normal smile */
            <path d="M87 117 Q100 128 113 117" stroke="#EF4444" strokeWidth="4" strokeLinecap="round" fill="none" />
          )}
          
          {/* Cheeks */}
          <circle cx="71" cy="110" r="6" fill="#EF4444" opacity="0.45" />
          <circle cx="129" cy="110" r="6" fill="#EF4444" opacity="0.45" />
          
          {/* Javanese Costume Collar */}
          <path d="M75 145 L100 165 L125 145 L115 190 L85 190 Z" fill="#4A2711" stroke="#FFC800" strokeWidth="2" />
          <path d="M100 105 L100 145" stroke="#8B4513" strokeWidth="3.5" />
          <circle cx="100" cy="155" r="4.5" fill="#FFC800" />

          {/* Hands holding scroll during Reading mood */}
          {mood === 'reading' && (
            <g className="scroll-visual">
              {/* Paper Scroll */}
              <rect x="68" y="142" width="64" height="24" rx="5" fill="#FFFDF6" stroke="#FFC800" strokeWidth="2" />
              {/* Scroll handles */}
              <circle cx="68" cy="154" r="6" fill="#8B4513" />
              <circle cx="132" cy="154" r="6" fill="#8B4513" />
              {/* Hands */}
              <circle cx="75" cy="154" r="5" fill="#FFDFB0" stroke="#8B4513" strokeWidth="1.5" />
              <circle cx="125" cy="154" r="5" fill="#FFDFB0" stroke="#8B4513" strokeWidth="1.5" />
            </g>
          )}

          {/* Hand to chin during Thinking mood */}
          {mood === 'thinking' && (
            <circle cx="88" cy="138" r="6.5" fill="#FFDFB0" stroke="#8B4513" strokeWidth="2" />
          )}

          {/* Arms raised during Celebrating mood */}
          {mood === 'celebrating' && (
            <g className="arms-raised">
              {/* Left Arm raised */}
              <path d="M50 142 Q30 110 32 95" stroke="#FFDFB0" strokeWidth="8.5" strokeLinecap="round" />
              <circle cx="32" cy="95" r="6.5" fill="#FFDFB0" stroke="#8B4513" strokeWidth="2" />
              {/* Right Arm raised */}
              <path d="M150 142 Q170 110 168 95" stroke="#FFDFB0" strokeWidth="8.5" strokeLinecap="round" />
              <circle cx="168" cy="95" r="6.5" fill="#FFDFB0" stroke="#8B4513" strokeWidth="2" />
            </g>
          )}
          
          <defs>
            <radialGradient id="goldAura" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#FFF2B2" />
              <stop offset="100%" stopColor="#FAF9F4" stopOpacity="0" />
            </radialGradient>
          </defs>
        </svg>
      </div>
    </div>
  );
}
