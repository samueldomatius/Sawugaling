'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { getStudentProfile, purchaseItem, StudentProfile, playSaronChime, playSuccessChime } from '@/lib/db';
import Navigation from '@/components/Navigation';

export default function ShopPage() {
  const [profile, setProfile] = useState<StudentProfile | null>(null);

  useEffect(() => {
    const loadInit = async () => {
      setProfile(await getStudentProfile());
      window.dispatchEvent(new Event('stop-loading'));
    };
    loadInit();
    const handleProfileChange = async () => setProfile(await getStudentProfile());
    window.addEventListener('profileUpdated', handleProfileChange);
    return () => window.removeEventListener('profileUpdated', handleProfileChange);
  }, []);

  const handleBuyItem = async (itemName: string, cost: number) => {
    playSaronChime(523);
    const success = await purchaseItem(itemName, cost);
    if (success) {
      playSuccessChime();
      alert(`🎉 Pusaka berhasil dituku!`);
      setProfile(await getStudentProfile());
      window.dispatchEvent(new Event('profileUpdated'));
    } else {
      alert(`❌ XP ora cukup utawa ana kesalahan.`);
    }
  };

  const shopItems = [
    { name: 'Blangkon Emas', cost: 50, icon: '👑', desc: 'Aura luhur ing sirah kagem murid prigel. Menambah kesan bangsawan.' },
    { name: 'Keris Ligan', cost: 100, icon: '⚔️', desc: 'Keris wesi aji pusaka panjaga kasugengan. Simbol ksatria Jawa.' },
    { name: 'Surjan Gagah', cost: 150, icon: '🥋', desc: 'Rasukan lurik tradisional khas ksatria Jawa. Bikin awet muda.' },
    { name: 'Gamelan Saron', cost: 200, icon: '🎵', desc: 'Gamelan saron pribadi kagem ngiringi sinau. Suaranya merdu.' },
    { name: 'Selendang Sutra', cost: 250, icon: '👘', desc: 'Selendang sutra halus yang indah dari pedagang Tiongkok.' },
    { name: 'Kereta Kencana', cost: 500, icon: '🐎', desc: 'Kendaraan magis keraton kagem ngelilingi nagari Nusantara.' }
  ];

  return (
    <div className="layout-container">
      <Navigation profile={profile} onOpenLogin={() => {}} />
      <div className="content-area" style={{ padding: '32px' }}>
        
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <h1 className="card-keraton-title" style={{ fontSize: '36px', justifyContent: 'center', borderBottom: 'none' }}>
            Pasar Pusaka Nusantara
          </h1>
          <p style={{ fontSize: '16px', color: '#6B3010', opacity: 0.8, maxWidth: '600px', margin: '0 auto' }}>
            Ijolake poin XP sampeyan kagem angsal busana & pusaka tradisional Jawa ing pasar iki!
          </p>
          
          <div style={{ display: 'inline-block', background: 'linear-gradient(135deg, #FFFFAF 0%, #FFD060 100%)', border: '2px solid #D4A040', padding: '10px 20px', borderRadius: '20px', marginTop: '16px', fontWeight: 'bold', color: '#6B3010', boxShadow: '0 4px 10px rgba(212, 160, 64, 0.3)' }}>
            ⚡ Poin Kowe: {profile?.xp || 0} XP
          </div>
        </div>

        <div className="shop-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px' }}>
          {shopItems.map(item => {
            const isOwned = profile?.inventory?.includes(item.name);
            return (
              <div key={item.name} className={`card-keraton ${isOwned ? 'owned' : ''}`} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', filter: isOwned ? 'grayscale(20%)' : 'none', opacity: isOwned ? 0.9 : 1 }}>
                
                {/* Visual Icon with Magic Aura */}
                <div style={{ position: 'relative', width: '100px', height: '100px', background: 'radial-gradient(circle, rgba(212,160,64,0.3) 0%, transparent 70%)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '50px', marginBottom: '16px', animation: 'map-float 6s ease-in-out infinite alternate' }}>
                  {item.icon}
                </div>

                <h3 style={{ fontSize: '20px', fontWeight: 'bold', color: '#6B3010', marginBottom: '8px', fontFamily: 'var(--font-decorative)' }}>
                  {item.name}
                </h3>
                
                <p style={{ fontSize: '14px', color: '#8A5506', marginBottom: '24px', lineHeight: '1.5' }}>
                  {item.desc}
                </p>

                {isOwned ? (
                  <div style={{ marginTop: 'auto', background: '#A2E078', color: '#fff', padding: '10px 20px', borderRadius: '12px', fontWeight: 'bold', width: '100%', border: '2px solid #7CBA53' }}>
                    ✓ Pusaka Diduweni
                  </div>
                ) : (
                  <button
                    className="btn-plakat-jati"
                    style={{ padding: '12px 20px', fontSize: '14px', width: '100%', marginTop: 'auto', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}
                    onClick={() => handleBuyItem(item.name, item.cost)}
                  >
                    Tuku <span style={{ background: 'rgba(255,255,255,0.2)', padding: '2px 8px', borderRadius: '6px' }}>⚡ {item.cost} XP</span>
                  </button>
                )}
              </div>
            );
          })}
        </div>

      </div>
    </div>
  );
}
