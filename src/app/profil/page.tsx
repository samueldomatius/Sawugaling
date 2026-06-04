'use client';

import React, { useState, useEffect } from 'react';
import Navigation from '@/components/Navigation';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import RegisterModal from '@/components/RegisterModal';
import { getStudentProfile, StudentProfile, getChapterProgress, getJavaneseRank } from '@/lib/db';
import { playSaronChime, playWelcomeGamelan, playSuccessChime } from '@/lib/audio';

function ProfileInner() {
  const searchParams = useSearchParams();
  const initialTab = searchParams.get('tab') as 'pohon' | 'peta' | 'misi' | 'liga' | null;
  
  const defaultProg = { materiDone: false, dhongengDone: false, lkpdScore: null, gameDone: false };
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [ch1Prog, setCh1Prog] = useState<any>(defaultProg);
  const [ch2Prog, setCh2Prog] = useState<any>(defaultProg);
  const [ch3Prog, setCh3Prog] = useState<any>(defaultProg);
  const [ch4Prog, setCh4Prog] = useState<any>(defaultProg);
  const [showRegister, setShowRegister] = useState(false);
  const [activeTab, setActiveTab] = useState<'pohon' | 'peta' | 'misi' | 'liga'>('pohon');

  useEffect(() => {
    if (initialTab && ['pohon', 'peta', 'misi', 'liga'].includes(initialTab)) {
      setActiveTab(initialTab);
    } else if (!initialTab) {
      // Default to 'misi' (Daily quests tab) if no parameter is provided
      setActiveTab('misi');
    }
  }, [initialTab]);
  
  const currentRank = getJavaneseRank(profile ? profile.xp : 0);

  // Helper helper functions replica to feed stats
  const getLeaderboardList = () => {
    const studentName = profile ? profile.name : 'Kamu (Tamu)';
    const studentXp = profile ? profile.xp : 0;
    
    const list = [
      { name: "Adipati Gatot", xp: 320, avatar: "🦁", isSelf: false },
      { name: "Senopati Siti", xp: 180, avatar: "🐯", isSelf: false },
      { name: "Cantrik Budi", xp: 80, avatar: "🐼", isSelf: false },
      { name: "Cantrik Kartini", xp: 30, avatar: "🦊", isSelf: false },
      { name: studentName, xp: studentXp, avatar: "👦", isSelf: true }
    ];

    return list.sort((a, b) => b.xp - a.xp);
  };

  const getDailyQuests = () => {
    if (!ch1Prog) return [];
    return [
      { id: 'q1', text: 'Maca Teks Dongeng Bab 1', done: ch1Prog.dhongengDone, xp: 10 },
      { id: 'q2', text: 'Entuk Biji LKPD Bab 1', done: ch1Prog.lkpdScore !== null, xp: 15 },
      { id: 'q3', text: 'Rampungna Game Aksara 1', done: ch1Prog.gameDone, xp: 20 }
    ];
  };
  
  // Selected Pusaka modal
  const [selectedPusaka, setSelectedPusaka] = useState<{ name: string; javanese: string; lore: string; icon: string } | null>(null);
  
  // Waringin interactive tooltip
  const [waringinTooltip, setWaringinTooltip] = useState<string | null>(null);

  const loadProfileData = async () => {
    const currentProfile = await getStudentProfile();
    setProfile(currentProfile);
    if (!currentProfile) {
      setShowRegister(true);
    }
    const [p1, p2, p3, p4] = await Promise.all([
      getChapterProgress(1),
      getChapterProgress(2),
      getChapterProgress(3),
      getChapterProgress(4)
    ]);
    setCh1Prog(p1);
    setCh2Prog(p2);
    setCh3Prog(p3);
    setCh4Prog(p4);
    window.dispatchEvent(new Event('stop-loading'));
  };

  useEffect(() => {
    loadProfileData();
    window.addEventListener('profileUpdated', loadProfileData);
    return () => {
      window.removeEventListener('profileUpdated', loadProfileData);
    };
  }, []);

  const totalPoints = profile ? profile.xp : 0;
  
  // Growth stage thresholds
  // 0-99: Stage 1 (trunk only)
  // 100-199: Stage 2 (branches + few leaves)
  // 200-299: Stage 3 (branches + dense leaves + roots)
  // 300-399: Stage 4 (full leaves + 1 rooster)
  // 400+: Stage 5 (lush canopy + 2 roosters + gold glow)
  const getWaringinStage = (): number => {
    if (totalPoints < 100) return 1;
    if (totalPoints < 200) return 2;
    if (totalPoints < 300) return 3;
    if (totalPoints < 400) return 4;
    return 5;
  };

  const stage = getWaringinStage();

  const handleWaringinClick = () => {
    playSaronChime(554);
    if (stage === 1) {
      setWaringinTooltip(`Tahap 1: Wit garing. Sampeyan butuh ${100 - totalPoints} XP maneh kagem thukul dahan! 🌱`);
    } else if (stage === 2) {
      setWaringinTooltip(`Tahap 2: Thukul dahan. Sampeyan butuh ${200 - totalPoints} XP maneh kagem nambahi rungkut godhong & oyot! 🌿`);
    } else if (stage === 3) {
      setWaringinTooltip(`Tahap 3: Oyot gantung thukul. Sampeyan butuh ${300 - totalPoints} XP maneh kagem nekakake Jago Sawung! 🐓`);
    } else if (stage === 4) {
      setWaringinTooltip(`Tahap 4: Jago Sawung mapan. Sampeyan butuh ${400 - totalPoints} XP maneh kagem thukul sempurna & aura emas! 👑`);
    } else {
      setWaringinTooltip("Tahap 5: Wit Waringin wis thukul rungkut lan sempurna banget! Sampeyan pancen luhur! 🌟");
    }
    
    setTimeout(() => {
      setWaringinTooltip(null);
    }, 4500);
  };

  // Chapter completeness checks for pusaka slots

  const ch1Completed = ch1Prog.materiDone && ch1Prog.dhongengDone && ch1Prog.lkpdScore !== null && ch1Prog.gameDone;
  const ch2Completed = ch2Prog.materiDone && ch2Prog.dhongengDone && ch2Prog.lkpdScore !== null && ch2Prog.gameDone;
  const ch3Completed = ch3Prog.materiDone && ch3Prog.dhongengDone && ch3Prog.lkpdScore !== null && ch3Prog.gameDone;
  const ch4Completed = ch4Prog.materiDone && ch4Prog.dhongengDone && ch4Prog.lkpdScore !== null && ch4Prog.gameDone;

  const allQuizzesHigh = 
    (ch1Prog.lkpdScore !== null && ch1Prog.lkpdScore >= 80) &&
    (ch2Prog.lkpdScore !== null && ch2Prog.lkpdScore >= 80) &&
    (ch3Prog.lkpdScore !== null && ch3Prog.lkpdScore >= 80);

  const allChaptersCompleted = ch1Completed && ch2Completed && ch3Completed && ch4Completed;

  const pusakaCollection = [
    {
      id: 1,
      name: "Ikat Kepala Sawunggaling",
      javanese: "Udheng Cinde",
      icon: "👳",
      unlocked: ch1Completed,
      lore: "Ikat kepala batik cinde abang khas Surabaya, paringan langsung saka Dewi Sangkrah kanggo Sawunggaling sadurunge budhal menyang krajan. Simbol tekad lan bekti marang wong tuwa."
    },
    {
      id: 2,
      name: "Keris Pusaka",
      javanese: "Dhuwung Wesi Aji",
      icon: "⚔️",
      unlocked: ch2Completed,
      lore: "Keris ligan titisan pusaka leluhur Surabaya. Landhepe wesi aji iki mujudake lambang kawicaksanan lan kuwajiban njaga kabudayan leluhur."
    },
    {
      id: 3,
      name: "Cemeti Pusaka",
      javanese: "Pecut Samandiman",
      icon: "🎗️",
      unlocked: ch3Completed,
      lore: "Cemeti utawa pecut sakti kanggo ngendhaleni alangan sajroning perjalanan. Mujudake lambang kuwasa ksatria kanggo nglawan kadurakan."
    },
    {
      id: 4,
      name: "Baju Zirah Jawa",
      javanese: "Rasukan Waja",
      icon: "🥋",
      unlocked: ch4Completed,
      lore: "Zirah wesi tipis kang dienggo Sawunggaling nalika sayembara ing Surabaya. Ngayomi ksatria saka samubarang godha lan serangan lawan."
    },
    {
      id: 5,
      name: "Jago Peliharaan (Sawung)",
      javanese: "Jago Wiring Kuning",
      icon: "🐓",
      unlocked: allQuizzesHigh,
      lore: "Jago wiring kuning andalan sing dikeloni Sawunggaling. Kondhang amarga banter kluruake lan kendel mungsuh liyane."
    },
    {
      id: 6,
      name: "Mahkota Adipati",
      javanese: "Kuluk Jayengrana",
      icon: "👑",
      unlocked: allChaptersCompleted,
      lore: "Mahkota kaluhuran adipati Surabaya kang disandhang Sawunggaling sawise kasil mbuktekake kasekten lan kajujurane. Simbol kepemimpinan luhur lan adil."
    }
  ];

  const handlePusakaClick = (item: typeof pusakaCollection[0]) => {
    if (!item.unlocked) {
      playSaronChime(330);
      alert(`🔒 Item iki isih terkunci! Rampungna syarat wulangan kagem mbukak ${item.name}.`);
      return;
    }
    playSaronChime(880);
    setSelectedPusaka(item);
  };

  // Map progress locations
  const locations = [
    { id: 1, name: "Hutan Kerto", sub: "Chapter 1", visited: ch1Completed, coords: { x: 50, y: 80 } },
    { id: 2, name: "Kampung Wonokromo", sub: "Chapter 2", visited: ch2Completed, coords: { x: 220, y: 50 } },
    { id: 3, name: "Alun-alun Surabaya", sub: "Chapter 3", visited: ch3Completed, coords: { x: 390, y: 110 } },
    { id: 4, name: "Kadipaten Jayengrono", sub: "Chapter 4", visited: ch4Completed, coords: { x: 560, y: 60 } },
    { id: 5, name: "Kedhaton Mataram", sub: "Selesai 100%", visited: allChaptersCompleted, coords: { x: 730, y: 90 } }
  ];

  return (
    <div className="app-layout">
      <Navigation profile={profile} onOpenLogin={() => setShowRegister(true)} onRefresh={loadProfileData} />

      <div className="main-wrapper" style={{ gridTemplateColumns: '1fr' }}>
        <main className="content-area" style={{ maxWidth: '980px', padding: '32px 24px' }}>
          
          {/* STATISTIK PROFIL CARD */}
          <div className={`duo-card ${initialTab === 'pohon' || initialTab === 'peta' ? 'hide-on-pohon-tab-mobile' : ''}`} style={{ display: 'flex', flexWrap: 'wrap', gap: '24px', alignItems: 'center', background: 'linear-gradient(135deg, rgba(255,255,255,0.7) 0%, rgba(255,239,219,0.5) 100%)' }}>
            <div className="avatar-circle" style={{ width: '80px', height: '80px', fontSize: '36px', background: 'var(--color-gold)', border: '4px solid #FFFFFF', boxShadow: '0 4px 10px rgba(0,0,0,0.1)' }}>
              {profile ? profile.name.slice(0,2).toUpperCase() : 'TA'}
            </div>
            
            <div style={{ flexGrow: 1 }}>
              <h2 style={{ fontSize: '26px', color: 'var(--text-dark)' }}>{profile ? profile.name : 'Tamu Sinau'}</h2>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center', marginTop: '4px' }}>
                <span className="rank-badge-hud" style={{ background: '#FEF3C7', color: '#92400E', borderColor: '#F59E0B', display: 'inline-flex', margin: 0 }}>
                  🎒 Kelas {profile ? profile.className : 'Umum'}
                </span>
                <span className="rank-badge-hud" style={{ color: currentRank.color, borderColor: currentRank.border, background: `${currentRank.border}15`, display: 'inline-flex', margin: 0 }}>
                  {currentRank.badge} {currentRank.title}
                </span>
              </div>
              <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                <span className="inventory-badge">🛡️ Ksatria Donowati</span>
                <span className="inventory-badge">⚔️ Prajurit Surabaya</span>
                {allChaptersCompleted && <span className="inventory-badge">👑 Adipati Pinunjul</span>}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <div style={{ textAlign: 'center', padding: '8px 16px', background: 'rgba(255,255,255,0.8)', borderRadius: '16px', border: '1px solid rgba(0,0,0,0.05)', minWidth: '100px' }}>
                <span style={{ display: 'block', fontSize: '11px', color: 'var(--text-muted)', fontWeight: '800' }}>TOTAL POIN</span>
                <span style={{ fontSize: '22px', fontWeight: '850', color: 'var(--color-orange-dark)' }}>⚡ {totalPoints} XP</span>
              </div>
              <div style={{ textAlign: 'center', padding: '8px 16px', background: 'rgba(255,255,255,0.8)', borderRadius: '16px', border: '1px solid rgba(0,0,0,0.05)', minWidth: '100px' }}>
                <span style={{ display: 'block', fontSize: '11px', color: 'var(--text-muted)', fontWeight: '800' }}>STREAK</span>
                <span style={{ fontSize: '22px', fontWeight: '850', color: '#EF4444' }}>🔥 {profile ? profile.streak : 0} Dino</span>
              </div>
              <div style={{ textAlign: 'center', padding: '8px 16px', background: 'rgba(255,255,255,0.8)', borderRadius: '16px', border: '1px solid rgba(0,0,0,0.05)', minWidth: '100px' }}>
                <span style={{ display: 'block', fontSize: '11px', color: 'var(--text-muted)', fontWeight: '800' }}>NYAWA</span>
                <span style={{ fontSize: '22px', fontWeight: '850', color: 'var(--color-red)' }}>❤️ {profile ? profile.hearts : 0}</span>
              </div>
              <div style={{ textAlign: 'center', padding: '8px 16px', background: 'rgba(255,255,255,0.8)', borderRadius: '16px', border: '1px solid rgba(0,0,0,0.05)', minWidth: '100px' }}>
                <span style={{ display: 'block', fontSize: '11px', color: 'var(--text-muted)', fontWeight: '800' }}>MAHKOTA</span>
                <span style={{ fontSize: '22px', fontWeight: '850', color: 'var(--color-gold-dark)' }}>👑 {profile ? profile.crowns : 0}</span>
              </div>
            </div>
          </div>

          {/* TAB BUTTONS */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', flexWrap: 'wrap' }}>
            {/* Show only Pohon & Peta if tab=pohon query or tab=peta query is present on mobile. Else show only Misi & Liga on mobile. Keep all on desktop. */}
            {/* We will do this by conditionally rendering buttons with style classes that match media queries or dynamic initialTab props */}
            {(!initialTab || initialTab === 'pohon' || initialTab === 'peta') && (
              <>
                <button 
                  className={`btn-duo ${activeTab === 'pohon' ? 'btn-duo-primary' : 'btn-duo-secondary'}`}
                  style={{ padding: '12px 20px', fontSize: '13px', borderBottomWidth: '4px', width: 'auto' }}
                  onClick={() => { playSaronChime(523); setActiveTab('pohon'); }}
                >
                  🌳 Wit Waringin & Pusaka
                </button>
                <button 
                  className={`btn-duo ${activeTab === 'peta' ? 'btn-duo-primary' : 'btn-duo-secondary'}`}
                  style={{ padding: '12px 20px', fontSize: '13px', borderBottomWidth: '4px', width: 'auto' }}
                  onClick={() => { playSaronChime(659); setActiveTab('peta'); }}
                >
                  👣 Perjalanan Sawunggaling
                </button>
              </>
            )}
            
            {/* Render the other tabs only on desktop, OR if we are in the main /profil flow (non-pohon/peta) */}
            {(!initialTab || initialTab === 'misi' || initialTab === 'liga') && (
              <>
                <button 
                  className={`btn-duo ${activeTab === 'misi' ? 'btn-duo-primary' : 'btn-duo-secondary'}`}
                  style={{ padding: '12px 20px', fontSize: '13px', borderBottomWidth: '4px', width: 'auto' }}
                  onClick={() => { playSaronChime(554); setActiveTab('misi'); }}
                >
                  🎯 Misi Saben Dina
                </button>
                <button 
                  className={`btn-duo ${activeTab === 'liga' ? 'btn-duo-primary' : 'btn-duo-secondary'}`}
                  style={{ padding: '12px 20px', fontSize: '13px', borderBottomWidth: '4px', width: 'auto' }}
                  onClick={() => { playSaronChime(880); setActiveTab('liga'); }}
                >
                  🏆 Liga Gamelan
                </button>
              </>
            )}
          </div>

          {/* SYSTEM 1 & 2: WIT WARINGIN & PUSAKA */}
          {activeTab === 'pohon' && (
            <div style={{ display: 'grid', gap: '24px', alignItems: 'start' }} className="pohon-layout-grid">
              
              {/* Waringin Tree Panel */}
              <div className="duo-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '32px', position: 'relative' }}>
                <h3 style={{ fontSize: '20px', color: '#1F2937', marginBottom: '4px', alignSelf: 'flex-start' }}>🌳 Pohon Waringin Pusaka</h3>
                <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '24px', alignSelf: 'flex-start' }}>Pohon waringin bakal thukul rungkut lan ngrembuyung manut karo kabeh poin XP sing sampeyan klumpukake!</p>

                {waringinTooltip && (
                  <div style={{ position: 'absolute', top: '90px', background: '#FFFBEB', border: '2px solid #F59E0B', borderRadius: '12px', padding: '10px 16px', fontSize: '13px', fontWeight: '750', color: '#B45309', zIndex: 10, maxWidth: '280px', textAlign: 'center', animation: 'scale-up 0.2s ease-out' }}>
                    {waringinTooltip}
                  </div>
                )}

                {/* SVG WARINGIN TREE */}
                <div 
                  onClick={handleWaringinClick}
                  style={{ width: '100%', height: '320px', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', position: 'relative' }}
                >
                  {/* Aura Gold Circle (Stage 5) */}
                  {stage >= 5 && (
                    <div style={{ position: 'absolute', width: '220px', height: '220px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(253,224,71,0.2) 0%, transparent 75%)', animation: 'pulse-aura 2.5s infinite ease-in-out' }}></div>
                  )}

                  <svg viewBox="0 0 400 320" width="100%" height="100%" style={{ overflow: 'visible' }}>
                    <defs>
                      <linearGradient id="trunkGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#8B4513" />
                        <stop offset="100%" stopColor="#5C3317" />
                      </linearGradient>
                      <linearGradient id="leavesGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#34D399" />
                        <stop offset="100%" stopColor="#2D5A1B" />
                      </linearGradient>
                    </defs>

                    {/* ROOT DESIGN (Stage 3+) */}
                    {stage >= 3 && (
                      <g stroke="#7A6A5A" strokeWidth="2.5" fill="none" opacity="0.8">
                        <path d="M170 120 Q150 170 140 240" />
                        <path d="M190 130 Q160 190 185 240" />
                        <path d="M210 130 Q240 180 215 240" />
                        <path d="M230 120 Q250 170 260 240" />
                      </g>
                    )}

                    {/* TRUNK & MAIN BRANCHES */}
                    <path d="M185 240 L185 140 Q150 100 110 110 Q145 125 185 145 L185 145 Q200 90 250 80 Q225 105 195 130 L195 130 Q215 110 280 110 Q235 125 200 145 L200 240 Z" fill="url(#trunkGrad)" stroke="#4A2711" strokeWidth="2" />
                    
                    {/* Dirt Base */}
                    <path d="M120 240 Q200 225 280 240 L260 260 H140 Z" fill="#4B5563" />

                    {/* STAGE 2 LEAVES: Thin Crown */}
                    {stage === 2 && (
                      <g fill="url(#leavesGrad)" stroke="#224A15" strokeWidth="1">
                        <circle cx="110" cy="100" r="24" />
                        <circle cx="250" cy="75" r="28" />
                        <circle cx="280" cy="105" r="22" />
                      </g>
                    )}

                    {/* STAGE 3 LEAVES: Thicker Crown */}
                    {stage === 3 && (
                      <g fill="url(#leavesGrad)" stroke="#224A15" strokeWidth="1">
                        <circle cx="110" cy="100" r="28" />
                        <circle cx="250" cy="75" r="34" />
                        <circle cx="280" cy="105" r="26" />
                        <circle cx="150" cy="85" r="25" />
                        <circle cx="200" cy="70" r="28" />
                      </g>
                    )}

                    {/* STAGE 4 LEAVES & ROOSTER 1 */}
                    {stage >= 4 && (
                      <g>
                        {/* Dense Leaves */}
                        <g fill="url(#leavesGrad)" stroke="#224A15" strokeWidth="1">
                          <circle cx="110" cy="100" r="32" />
                          <circle cx="250" cy="75" r="38" />
                          <circle cx="280" cy="105" r="30" />
                          <circle cx="150" cy="85" r="30" />
                          <circle cx="200" cy="65" r="36" />
                          <circle cx="170" cy="55" r="32" />
                          <circle cx="230" cy="55" r="30" />
                        </g>

                        {/* Rooster 1 Sitting on Branch */}
                        <g transform="translate(130, 80) scale(0.18)">
                          <circle cx="50" cy="50" r="25" fill="#FFC800" />
                          <polygon points="50,45 80,45 70,55" fill="#EF4444" />
                          <circle cx="45" cy="42" r="3" fill="#000" />
                          <path d="M40 70 C40 100, 70 100, 70 70 Z" fill="#FF4B4B" />
                          <polygon points="10,50 30,65 20,80" fill="#EF4444" />
                        </g>
                      </g>
                    )}

                    {/* STAGE 5 ROOSTER 2 */}
                    {stage >= 5 && (
                      <g transform="translate(230, 60) scale(0.18)">
                        <circle cx="50" cy="50" r="25" fill="#FFC800" />
                        <polygon points="50,45 80,45 70,55" fill="#EF4444" />
                        <circle cx="45" cy="42" r="3" fill="#000" />
                        <path d="M40 70 C40 100, 70 100, 70 70 Z" fill="#FF4B4B" />
                        <polygon points="10,50 30,65 20,80" fill="#EF4444" />
                      </g>
                    )}
                  </svg>
                </div>
              </div>

              {/* Koleksi Pusaka Panel */}
              <div className="duo-card" style={{ padding: '24px' }}>
                <h3 style={{ fontSize: '18px', color: '#1F2937', marginBottom: '6px' }}>💼 Peti Pusaka Sawunggaling</h3>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '16px' }}>Slot pusaka lan rasukan adat sing kabukak sawise ngrampungake pasinaon Bab.</p>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
                  {pusakaCollection.map(item => (
                    <div 
                      key={item.id} 
                      onClick={() => handlePusakaClick(item)}
                      style={{
                        padding: '16px 12px',
                        border: '2px solid',
                        borderColor: item.unlocked ? '#D2B48C' : '#E5E7EB',
                        borderRadius: '16px',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        background: item.unlocked ? '#FFFDF9' : '#F3F4F6',
                        opacity: item.unlocked ? 1 : 0.6,
                        transition: 'transform 0.2s ease',
                        textAlign: 'center'
                      }}
                      onMouseOver={(e) => { if (item.unlocked) e.currentTarget.style.transform = 'scale(1.04)'; }}
                      onMouseOut={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
                    >
                      <span style={{ fontSize: '36px', marginBottom: '8px', filter: item.unlocked ? 'none' : 'grayscale(100%)' }}>
                        {item.unlocked ? item.icon : '🔒'}
                      </span>
                      <span style={{ fontSize: '12px', fontWeight: '800', color: item.unlocked ? '#8B4513' : 'var(--text-muted)' }}>
                        {item.name}
                      </span>
                      <span style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '4px', fontStyle: 'italic' }}>
                        {item.unlocked ? item.javanese : 'Terkunci'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}

          {/* SYSTEM 3: PERJALANAN SAWUNGGALING (VOYAGE MAP) */}
          {activeTab === 'peta' && (
            <div className="duo-card" style={{ padding: '32px', overflowX: 'auto' }}>
              <h3 style={{ fontSize: '20px', color: '#1F2937', marginBottom: '4px' }}>👣 Peta Perjalanan Sawunggaling</h3>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '32px' }}>Lacak petualangan Sawunggaling saka dusun Donowati menyang Kedhaton agung!</p>

              <div style={{ minWidth: '820px', height: '240px', position: 'relative', background: 'radial-gradient(circle, #FDFBF7 40%, #F5EFEB 100%)', borderRadius: '20px', border: '2px solid #E6DFD5' }}>
                
                {/* Connection lines */}
                <svg style={{ position: 'absolute', width: '100%', height: '100%', pointerEvents: 'none' }}>
                  <path 
                    d="M 100 130 C 160 100, 160 100, 270 100 C 330 100, 330 160, 440 160 C 500 160, 500 110, 610 110 C 670 110, 670 140, 780 140"
                    stroke="#D2B48C"
                    strokeWidth="4"
                    strokeDasharray="6,8"
                    fill="none"
                  />
                </svg>

                {/* Locations Node pins */}
                {locations.map((loc, idx) => {
                  const nodeColor = loc.visited ? 'var(--color-orange)' : '#9CA3AF';
                  const shadowColor = loc.visited ? 'var(--color-orange-dark)' : '#6B7280';
                  
                  // Coordinate adjustments
                  const topOffset = [110, 80, 140, 90, 120][idx];
                  const leftOffset = [100, 270, 440, 610, 780][idx];

                  return (
                    <div 
                      key={loc.id}
                      style={{
                        position: 'absolute',
                        left: `${leftOffset}px`,
                        top: `${topOffset}px`,
                        transform: 'translate(-50%, -50%)',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        zIndex: 2
                      }}
                    >
                      <div 
                        style={{
                          width: '56px',
                          height: '56px',
                          borderRadius: '50%',
                          backgroundColor: nodeColor,
                          boxShadow: `0 6px 0 ${shadowColor}`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '22px',
                          color: '#FFFFFF',
                          border: '2px solid #FFFFFF',
                          cursor: 'pointer',
                          transition: 'transform 0.2s ease'
                        }}
                        onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
                        onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
                        onClick={() => { playSaronChime(660); alert(`${loc.name} (${loc.sub}) - ${loc.visited ? 'Wis dilakoni ✓' : 'Isih Terkunci 🔒'}`); }}
                      >
                        {loc.visited ? '⭐' : '🔒'}
                      </div>
                      
                      <div style={{ marginTop: '14px', textAlign: 'center', width: '130px' }}>
                        <span style={{ display: 'block', fontSize: '12px', fontWeight: '800', color: '#1F2937' }}>
                          {loc.name}
                        </span>
                        <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: '700' }}>
                          {loc.sub}
                        </span>
                      </div>
                    </div>
                  );
                })}

              </div>
            </div>
          )}

          {/* SYSTEM 4: MISI SABEN DINA (DAILY QUESTS) */}
          {activeTab === 'misi' && (
            <div className="duo-card" style={{ padding: '32px' }}>
              <h3 style={{ fontSize: '20px', color: '#1F2937', marginBottom: '8px' }}>🎯 Misi Saben Dina (Daily Quests)</h3>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '24px' }}>Rampungna misi ing ngisor iki saben dino kagem nggowo mulih bonus poin XP!</p>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {getDailyQuests().map(q => (
                  <div key={q.id} className="quest-item" style={{ padding: '16px 20px', borderColor: q.done ? '#A2E078' : 'var(--border-light)', background: q.done ? '#F0FDF4' : '#FFFFFF', display: 'flex', alignItems: 'center', gap: '16px', borderRadius: '16px', border: '2px solid' }}>
                    <input type="checkbox" checked={q.done} readOnly className="quest-checkbox" style={{ width: '22px', height: '22px' }} />
                    <span className="quest-text" style={{ fontSize: '15px', textDecoration: q.done ? 'line-through' : 'none', color: q.done ? 'var(--color-green-dark)' : '#374151', fontWeight: '700' }}>
                      {q.text}
                    </span>
                    <span className="quest-xp-badge" style={{ fontSize: '12px', padding: '4px 10px', borderRadius: '8px' }}>
                      +{q.xp} XP
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SYSTEM 5: LIGA GAMELAN (LEADERBOARD) */}
          {activeTab === 'liga' && (
            <div className="duo-card" style={{ padding: '32px' }}>
              <h3 style={{ fontSize: '20px', color: '#1F2937', marginBottom: '8px' }}>🏆 Liga Gamelan (Papan Peringkat)</h3>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '24px' }}>Liga mingguan siswa Sinau Basa Jawa. Dadi sing nomor siji ing Surabaya!</p>
              
              <div className="leaderboard-list" style={{ gap: '10px' }}>
                {getLeaderboardList().map((player, index) => {
                  const medalColors = ['rank-gold', 'rank-silver', 'rank-bronze'];
                  return (
                    <div key={index} className={`leaderboard-item ${player.isSelf ? 'item-self' : ''}`} style={{ padding: '16px 20px', borderRadius: '16px' }}>
                      <span className={`leaderboard-rank ${index < 3 ? medalColors[index] : ''}`} style={{ fontSize: '18px', width: '32px' }}>{index + 1}</span>
                      <span className="leaderboard-avatar" style={{ fontSize: '26px' }}>{player.avatar}</span>
                      <span className="leaderboard-name" style={{ fontSize: '15px', fontWeight: '800' }}>
                        {player.name} {player.isSelf && '(Kowe)'}
                      </span>
                      <span className="leaderboard-xp" style={{ fontSize: '16px' }}>{player.xp} XP</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

        </main>
      </div>

      {/* PUSAKA DETAIL MODAL DISPLAY */}
      {selectedPusaka && (
        <div className="modal-overlay" onClick={() => setSelectedPusaka(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '440px', border: '3px solid #D2B48C' }}>
            <span style={{ fontSize: '64px', display: 'block', marginBottom: '8px' }}>{selectedPusaka.icon}</span>
            <h2 className="modal-title" style={{ color: '#8B4513', fontSize: '22px', fontWeight: '800' }}>{selectedPusaka.name}</h2>
            <span style={{ display: 'inline-block', fontStyle: 'italic', fontSize: '13px', background: '#FEF3C7', color: '#92400E', padding: '4px 10px', borderRadius: '6px', fontWeight: '750', marginBottom: '16px' }}>
              Nama Jawa: {selectedPusaka.javanese}
            </span>
            <p className="modal-body-text" style={{ fontSize: '14px', lineHeight: '1.6', color: '#4B5563', textAlign: 'justify' }}>
              {selectedPusaka.lore}
            </p>
            <button 
              className="btn-duo btn-duo-orange"
              onClick={() => setSelectedPusaka(null)}
              style={{ marginTop: '20px' }}
            >
              Matur Nuwun! ✓
            </button>
          </div>
        </div>
      )}

      <RegisterModal 
        isOpen={showRegister} 
        onClose={() => setShowRegister(false)} 
        onSuccess={loadProfileData} 
      />
    </div>
  );
}

export default function StudentProfilePage() {
  return (
    <Suspense fallback={
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', fontFamily: 'var(--font-main)', fontWeight: '800' }}>
        Loading Profil Pasinaon...
      </div>
    }>
      <ProfileInner />
    </Suspense>
  );
}
