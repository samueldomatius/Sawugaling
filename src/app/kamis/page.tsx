'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { isThursdayMode, getStudentProfile, StudentProfile } from '@/lib/db';
import { kamisMateri } from '@/lib/chaptersData';
import Navigation from '@/components/Navigation';
import RegisterModal from '@/components/RegisterModal';
import MascotVisual from '@/components/MascotVisual';

export default function KamisPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [showRegister, setShowRegister] = useState(false);
  const [isThursday, setIsThursday] = useState(false);
  const [activeDialogue, setActiveDialogue] = useState(0);

  const refreshState = useCallback(async () => {
    const currentProfile = await getStudentProfile();
    setProfile(currentProfile);
    setIsThursday(isThursdayMode());
  }, []);

  useEffect(() => {
    refreshState();

    const handleThursdayChange = () => {
      setIsThursday(isThursdayMode());
    };
    const handleProfileChange = async () => {
      setProfile(await getStudentProfile());
    };

    window.addEventListener('thursdayModeChanged', handleThursdayChange);
    window.addEventListener('profileUpdated', handleProfileChange);

    return () => {
      window.removeEventListener('thursdayModeChanged', handleThursdayChange);
      window.removeEventListener('profileUpdated', handleProfileChange);
    };
  }, [refreshState]);

  return (
    <div className="app-layout">
      <Navigation profile={profile} onOpenLogin={() => setShowRegister(true)} onRefresh={refreshState} />

      <div className="main-wrapper">
        
        {/* CENTER CONTENT */}
        <main className="content-area" style={{ maxWidth: '800px', padding: '32px 24px' }}>
          
          <div style={{ marginBottom: '24px' }}>
            <span 
              onClick={() => router.push('/')} 
              style={{ color: 'var(--color-green-dark)', cursor: 'pointer', fontWeight: '800', fontSize: '14px' }}
            >
              ← Bali menyang Beranda
            </span>
          </div>

          {!isThursday ? (
            <div className="duo-card" style={{ textAlign: 'center', padding: '48px 24px', borderColor: 'var(--color-orange)' }}>
              <span style={{ fontSize: '64px', display: 'block', marginBottom: '16px' }}>🔒</span>
              <h2 style={{ color: 'var(--color-orange-dark)', fontSize: '24px', fontWeight: '800', marginBottom: '8px' }}>
                Akses Khusus Dina Kamis
              </h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '15px', lineHeight: '1.5', marginBottom: '24px' }}>
                Nuwun sewu, wulangan khusus **Unggah-Ungguh Basa** iki mung mbukak ing dina Kamis kagem njaga tradisi lan budi pekerti warga sekolah.
              </p>
              <div style={{ padding: '16px', backgroundColor: '#FEF3C7', border: '2px solid #FDE68A', borderRadius: '12px', fontSize: '13px', color: '#92400E', fontWeight: '700' }}>
                💡 Tips Kanggo Penguji: Aktifake tombol &quot;Simulasi Dina Kamis&quot; ing Panel Penguji ing ndhuwur kanggo mbukak akses wulangan iki!
              </div>
            </div>
          ) : (
            <div className="animate-fade" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              
              {/* Header Box */}
              <div className="duo-card card-green" style={{ padding: '24px' }}>
                <span className="media-tag" style={{ background: '#ECFDF5', color: '#065F46', border: '1px solid #A7F3D0', padding: '4px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: '800' }}>
                  Hari Kamis Budaya Jawa
                </span>
                <h1 style={{ fontSize: '28px', color: '#1F2937', fontWeight: '800', marginTop: '12px', marginBottom: '8px' }}>
                  {kamisMateri.title}
                </h1>
                <p style={{ color: '#4B5563', fontSize: '15px', lineHeight: '1.5' }}>
                  {kamisMateri.intro}
                </p>
              </div>

              {/* Rules Cards Grid */}
              <div className="duo-card" style={{ padding: '24px' }}>
                <h2 style={{ fontSize: '20px', fontWeight: '850', color: '#1F2937', marginBottom: '16px' }}>
                  📖 Tata Cara Unggah-Ungguh Basa
                </h2>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  {kamisMateri.rules.map((rule, idx) => (
                    <div 
                      key={idx} 
                      style={{ 
                        border: '2px solid var(--border-light)', 
                        padding: '16px', 
                        borderRadius: '12px', 
                        background: '#F9FAFB' 
                      }}
                    >
                      <h3 style={{ color: 'var(--color-blue-dark)', fontSize: '15px', fontWeight: '800', marginBottom: '6px' }}>
                        {rule.title}
                      </h3>
                      <p style={{ fontSize: '13px', lineHeight: '1.5', color: '#4B5563' }}>
                        {rule.content}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Dialogue Box */}
              <div className="duo-card card-purple" style={{ padding: '24px' }}>
                <h2 style={{ fontSize: '20px', fontWeight: '850', color: '#1F2937', marginBottom: '6px' }}>
                  💬 Gladhen Micara (Latihan Percakapan)
                </h2>
                <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '20px' }}>
                  Pilih kahanan ing ngisor iki lan deleng carane matur migunakake basa Krama Alus sing bener marang guru:
                </p>

                {/* Tabs */}
                <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
                  {kamisMateri.dialogues.map((dlg, idx) => (
                    <button 
                      key={idx}
                      className={`btn-duo ${activeDialogue === idx ? 'btn-duo-primary' : 'btn-duo-secondary'}`}
                      onClick={() => setActiveDialogue(idx)}
                      style={{ 
                        fontSize: '12px', 
                        padding: '10px 16px',
                        width: 'auto',
                        borderBottomWidth: '3px'
                      }}
                    >
                      Kahanan {idx + 1}
                    </button>
                  ))}
                </div>

                {/* Dialogue Visualizer Grid */}
                <div 
                  style={{ 
                    backgroundColor: '#F8FAFC', 
                    border: '2px solid #E2E8F0', 
                    borderRadius: '16px',
                    padding: '20px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '16px'
                  }}
                >
                  <div style={{ fontStyle: 'italic', fontSize: '13px', color: 'var(--color-purple-dark)', fontWeight: '700', borderBottom: '2px solid #E2E8F0', paddingBottom: '8px' }}>
                    Kahanan: {kamisMateri.dialogues[activeDialogue].context}
                  </div>

                  {kamisMateri.dialogues[activeDialogue].speakers.map((spk, sIdx) => {
                    const isSiswa = spk.name.includes("Siswa");
                    return (
                      <div 
                        key={sIdx}
                        style={{ 
                          display: 'flex', 
                          flexDirection: 'column',
                          alignItems: isSiswa ? 'flex-start' : 'flex-end',
                          width: '100%'
                        }}
                      >
                        <span 
                          style={{ 
                            fontSize: '11px', 
                            fontWeight: '800', 
                            color: isSiswa ? 'var(--color-blue-dark)' : 'var(--color-green-dark)',
                            marginBottom: '4px'
                          }}
                        >
                          {spk.name}
                        </span>
                        <div 
                          style={{ 
                            backgroundColor: isSiswa ? '#EFF6FF' : '#F0FDF4',
                            border: `2px solid ${isSiswa ? '#BFDBFE' : '#BBF7D0'}`,
                            padding: '12px 16px',
                            borderRadius: isSiswa ? '16px 16px 16px 0px' : '16px 16px 0px 16px',
                            maxWidth: '80%',
                            color: '#1F2937',
                            fontSize: '14px',
                            lineHeight: '1.5',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
                          }}
                        >
                          <strong>{spk.text}</strong>
                          <div 
                            style={{ 
                              fontSize: '11px', 
                              color: 'var(--text-muted)', 
                              borderTop: '1px solid #E2E8F0', 
                              marginTop: '6px', 
                              paddingTop: '4px',
                              fontStyle: 'italic'
                            }}
                          >
                            Terjemahan: &quot;{isSiswa 
                              ? (activeDialogue === 0 ? "Permisi Bu Guru, izin saya mau ke belakang sebentar." : "Selamat siang Pak Guru. Ini saya mau menyerahkan buku tugas bahasa Jawa.")
                              : (activeDialogue === 0 ? "Oh iya, le. Jangan lama-lama ya." : "Terima kasih, le. Letakkan saja di sini, nanti bapak nilai.")
                            }&quot;
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

              </div>
            </div>
          )}

        </main>

        {/* RIGHT SIDEBAR */}
        <aside className="right-sidebar">
          
          <div className="duo-card" style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '20px', borderBottomWidth: '4px' }}>
            <h4 style={{ fontSize: '12px', fontWeight: '800', textTransform: 'uppercase', color: 'var(--text-muted)', textAlign: 'center' }}>
              Kamis Budaya Jawa
            </h4>
            <MascotVisual 
              mood="talking" 
              speechBubbleText="Dina iki dina Kamis Budaya Jawa, ayo sinau basa Krama Alus kagem budi pekerti sing luhur!" 
              width="160px" 
              height="160px" 
            />
          </div>

        </aside>

      </div>

      <RegisterModal 
        isOpen={showRegister} 
        onClose={() => setShowRegister(false)} 
        onSuccess={refreshState} 
      />
    </div>
  );
}
