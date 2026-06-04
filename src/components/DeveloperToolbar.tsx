'use client';

import React, { useState, useEffect } from 'react';
import { isThursdayMode, setSimulatedThursday, clearStudentProfile, seedMockDataIfEmpty } from '@/lib/db';

interface DeveloperToolbarProps {
  onRefresh: () => void;
}

export default function DeveloperToolbar({ onRefresh }: DeveloperToolbarProps) {
  const [isThursday, setIsThursday] = useState(false);

  useEffect(() => {
    setIsThursday(isThursdayMode());
  }, []);

  const handleThursdayToggle = (e: React.ChangeEvent<HTMLInputElement>) => {
    const checked = e.target.checked;
    setSimulatedThursday(checked);
    setIsThursday(checked);
    onRefresh();
    // Dispatch a custom event to notify all components about date mode changes
    window.dispatchEvent(new Event('thursdayModeChanged'));
  };

  const handleResetProfile = () => {
    if (confirm('Buset! Yakin kepengin ngreset kabeh data lan progress siswa?')) {
      clearStudentProfile();
      onRefresh();
      window.location.reload();
    }
  };

  const handleSeedData = () => {
    seedMockDataIfEmpty();
    alert('Mock data guru sukses diseed!');
    onRefresh();
  };

  return (
    <div className="dev-toolbar">
      <div className="container dev-toolbar-container">
        <div className="dev-mode-badge">
          🛠️ <strong>Panel Penguji (Demo)</strong>
        </div>
        <div className="dev-toggle-container">
          <button 
            onClick={handleSeedData} 
            className="thursday-link-btn" 
            style={{ backgroundColor: 'var(--emas-batik)', color: 'var(--hitam-latar)', padding: '3px 10px', fontSize: '11px' }}
          >
            🔋 Seed Nilai Guru
          </button>
          
          <button 
            onClick={handleResetProfile} 
            className="thursday-link-btn" 
            style={{ backgroundColor: 'var(--merah-bata)', padding: '3px 10px', fontSize: '11px' }}
          >
            🗑️ Reset Progress & Log
          </button>
          
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '12px' }}>
            <span>Simulasi Dina Kamis (Unggah-Ungguh):</span>
            <div className="switch">
              <input 
                type="checkbox" 
                checked={isThursday} 
                onChange={handleThursdayToggle} 
              />
              <span className="slider"></span>
            </div>
          </label>
        </div>
      </div>
    </div>
  );
}
