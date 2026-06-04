'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { StudentProfile } from '@/lib/db';

interface NavigationProps {
  profile: StudentProfile | null;
  onOpenLogin: () => void;
  onRefresh?: () => void;
}

export default function Navigation({ profile, onOpenLogin }: NavigationProps) {
  const pathname = usePathname();

  const handleStopSpeech = () => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
  };

  const menuItems = [
    {
      name: 'Chapter',
      path: '/',
      icon: (
        <svg className="menu-icon" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
        </svg>
      )
    },
    {
      name: 'Hari Kamis',
      path: '/kamis',
      icon: (
        <svg className="menu-icon" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M12 2L2 7l10 5 10-5-10-5z" />
          <path d="M2 17l10 5 10-5" />
          <path d="M2 12l10 5 10-5" />
        </svg>
      )
    },
    {
      name: 'Profil',
      path: '/profil',
      icon: (
        <svg className="menu-icon" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
      )
    },
    {
      name: 'Pasar Pusaka',
      path: '/shop',
      icon: (
        <svg className="menu-icon" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20.5 8H3.5A1.5 1.5 0 0 0 2 9.5v.5A2.5 2.5 0 0 0 4.5 12.5v7A1.5 1.5 0 0 0 6 21h12a1.5 1.5 0 0 0 1.5-1.5v-7A2.5 2.5 0 0 0 22 10v-.5A1.5 1.5 0 0 0 20.5 8z" />
          <path d="M4.5 12.5V21" />
          <path d="M19.5 12.5V21" />
          <path d="M12 21v-8.5" />
          <path d="M8 8V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v3" />
        </svg>
      )
    }
  ];

  return (
    <>
      {/* DESKTOP SIDEBAR */}
      <aside className="sidebar-nav" style={{ paddingBottom: '16px' }}>
        <Link href="/" className="logo-section" onClick={handleStopSpeech} style={{ gap: '12px' }}>
          <svg className="javanese-logo-glow" viewBox="0 0 100 130" width="32" height="38" fill="none" stroke="#D97706" strokeWidth="3">
            <path d="M50 10 C20 60, 10 100, 10 120 C10 130, 20 130, 50 130 C80 130, 90 130, 90 120 C90 100, 80 60, 50 10 Z" fill="#FFFBEB" />
            <line x1="50" y1="130" x2="50" y2="40" />
            <circle cx="50" cy="130" r="10" fill="#D97706" />
            <path d="M50 80 Q30 70, 25 85 M50 80 Q70 70, 75 85" strokeWidth="2.5" />
          </svg>
          <span className="logo-text">Sinau Jawa</span>
        </Link>

        <nav className="nav-links">
          {menuItems.map((item) => {
            const isActive = pathname === item.path;
            return (
              <Link 
                key={item.name} 
                href={item.path} 
                className={`nav-link ${isActive ? 'active' : ''}`}
                onClick={handleStopSpeech}
                style={{ '--icon-color': isActive ? '#F5D87A' : 'rgba(245, 232, 200, 0.6)' } as React.CSSProperties}
              >
                <span style={{ color: isActive ? '#F5D87A' : 'rgba(245, 232, 200, 0.5)' }}>{item.icon}</span>
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '12px', padding: '8px' }}>
          {profile ? (
            <div className="profile-hud" style={{ padding: '12px' }}>
              <div className="profile-hud-header">
                <div className="avatar-circle" style={{ width: '36px', height: '36px', fontSize: '16px' }}>👦</div>
                <div className="profile-info">
                  <span className="profile-name">{profile.name}</span>
                  <span className="profile-class">Kelas {profile.className}</span>
                </div>
              </div>
            </div>
          ) : (
            <button className="btn-duo btn-duo-secondary" onClick={onOpenLogin} style={{ padding: '10px 16px', fontSize: '13px', background: 'rgba(201, 146, 58, 0.2)', color: '#F5D87A', border: '1.5px solid rgba(201, 146, 58, 0.4)' }}>
              Daftar / Masuk
            </button>
          )}

        </div>
      </aside>

      {/* MOBILE HEADER */}
      <header className="mobile-header-top" style={{
        display: 'none',
        position: 'sticky',
        top: 0,
        left: 0,
        right: 0,
        height: 60,
        background: 'linear-gradient(135deg, rgba(255, 248, 228, 0.97) 0%, rgba(255, 240, 200, 0.95) 100%)',
        borderBottom: '2.5px solid rgba(200, 136, 26, 0.45)',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 16px',
        zIndex: 100,
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        boxShadow: '0 4px 16px rgba(92, 46, 11, 0.08)'
      }}>
        <Link href="/" className="logo-section" onClick={handleStopSpeech} style={{ padding: 0, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
          <svg className="javanese-logo-glow" viewBox="0 0 100 130" width="24" height="30" fill="none" stroke="#D97706" strokeWidth="3">
            <path d="M50 10 C20 60, 10 100, 10 120 C10 130, 20 130, 50 130 C80 130, 90 130, 90 120 C90 100, 80 60, 50 10 Z" fill="#FFFBEB" />
            <line x1="50" y1="130" x2="50" y2="40" />
            <circle cx="50" cy="130" r="10" fill="#D97706" />
            <path d="M50 80 Q30 70, 25 85 M50 80 Q70 70, 75 85" strokeWidth="2.5" />
          </svg>
          <span className="logo-text" style={{ fontSize: '18px' }}>Sinau Jawa</span>
        </Link>
        <div>
          {profile ? (
            <span style={{ fontSize: '13px', fontWeight: '800', background: 'linear-gradient(135deg, rgba(255, 248, 220, 0.9), rgba(255, 235, 170, 0.85))', border: '1.5px solid rgba(200, 136, 26, 0.4)', padding: '6px 12px', borderRadius: '10px', color: 'var(--color-batik-brown)' }}>
              👦 {profile.name}
            </span>
          ) : (
            <button className="btn-duo btn-duo-secondary" style={{ padding: '6px 12px', fontSize: '12px' }} onClick={onOpenLogin}>
              Masuk
            </button>
          )}
        </div>
      </header>

      {/* MOBILE BOTTOM NAVIGATION BAR */}
      <nav className="mobile-bottom-nav">
        {[
          menuItems[0], // Chapter
          menuItems[1], // Hari Kamis
          {
            name: 'Wit Kawruh',
            path: '/profil?tab=pohon',
            isHighlight: true,
            icon: (
              <svg className="menu-icon" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22V15" />
                <path d="M12 15C8 15 5 12 5 8a7 7 0 0 1 14 0c0 4-3 7-7 7z" />
              </svg>
            )
          },
          menuItems[3], // Pasar Pusaka (Shop)
          menuItems[2], // Profil
        ].map((item) => {
          // Fix matching logic specifically for dynamic tab redirection on profile page
          const isActive = (item.path.startsWith('/profil') && pathname === '/profil') || pathname === item.path;
          return (
            <Link 
              key={item.name} 
              href={item.path} 
              className={`mobile-nav-item ${(item as any).isHighlight ? 'mobile-nav-highlight' : ''} ${isActive ? 'active' : ''}`}
              onClick={handleStopSpeech}
            >
              {item.icon}
              <span style={{ fontSize: '9px', marginTop: '2px' }}>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* Inject custom mobile display rules via CSS hack if needed */}
      <style jsx global>{`
        @media (max-width: 1300px) {
          .mobile-header-top {
            display: flex !important;
          }
        }
      `}</style>
    </>
  );
}
