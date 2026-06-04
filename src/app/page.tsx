'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { getChapterProgress, ChapterProgress, isThursdayMode, StudentProfile, getStudentProfile, clearStudentProfile, getChaptersList, getJavaneseRank, purchaseItem, claimSpinReward } from '@/lib/db';
import { playSaronChime, playWelcomeGamelan, startAmbientGamelan, playSpinTick, playSuccessChime } from '@/lib/audio';
import Navigation from '@/components/Navigation';
import RegisterModal from '@/components/RegisterModal';
import MascotVisual from '@/components/MascotVisual';
import { Chapter } from '@/lib/chaptersData';

export default function Home() {
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [showRegister, setShowRegister] = useState(false);
  const [chapterProgresses, setChapterProgresses] = useState<{ [id: number]: ChapterProgress }>({});
  const [isThursday, setIsThursday] = useState(false);
  const [stats, setStats] = useState({ totalUnlocked: 1, totalDone: 0, overallProgress: 0 });
  const [chapters, setChapters] = useState<Chapter[]>([]);

  // Curtain Splash Screen States
  const [showIntro, setShowIntro] = useState(true);
  const [isCurtainOpen, setIsCurtainOpen] = useState(false);

  // Chest popup state
  const [showChestModal, setShowChestModal] = useState(false);
  const [claimedChestChapter, setClaimedChestChapter] = useState<number | null>(null);

  // Daily Spin States
  const [showSpinModal, setShowSpinModal] = useState(false);
  const [isSpinning, setIsSpinning] = useState(false);
  const [spinRotation, setSpinRotation] = useState(0);
  const [spinRewardMessage, setSpinRewardMessage] = useState<string | null>(null);

  // Mascot popup state
  const [showMascotPopup, setShowMascotPopup] = useState(false);

  // Onboarding Tutorial State
  const [tutorialStep, setTutorialStep] = useState<number | null>(null);

  const refreshState = useCallback(async () => {
    const currentProfile = await getStudentProfile();
    setProfile(currentProfile);
    if (!currentProfile) {
      setShowRegister(true);
    }

    setIsThursday(isThursdayMode());

    const list = await getChaptersList();
    setChapters(list);

    const progresses: { [id: number]: ChapterProgress } = {};
    let unlockedCount = 1;
    let completedActivities = 0;
    const totalActivities = list.length * 4; 

    for (const ch of list) {
      const prog = await getChapterProgress(ch.id);
      progresses[ch.id] = prog;
      
      if (prog.materiDone) completedActivities++;
      if (prog.dhongengDone) completedActivities++;
      if (prog.lkpdScore !== null) completedActivities++;
      if (prog.gameDone) completedActivities++;
    }

    const ch1 = progresses[1];
    const ch1Completed = ch1 && ch1.materiDone && ch1.dhongengDone && (ch1.lkpdScore !== null) && ch1.gameDone;
    if (ch1Completed) {
      unlockedCount = 2;
    }

    const ch2 = progresses[2];
    const ch2Completed = ch2 && ch2.materiDone && ch2.dhongengDone && (ch2.lkpdScore !== null) && ch2.gameDone;
    if (ch1Completed && ch2Completed) {
      unlockedCount = 3;
    }

    // Dynamic custom chapters unlocking
    for (let cId = 3; cId < list.length; cId++) {
      const prevCh = progresses[cId];
      const prevChCompleted = prevCh && prevCh.materiDone && prevCh.dhongengDone && (prevCh.lkpdScore !== null) && prevCh.gameDone;
      if (prevChCompleted && unlockedCount === cId) {
        unlockedCount = cId + 1;
      }
    }

    setChapterProgresses(progresses);
    
    const progressPercent = totalActivities > 0 
      ? Math.round((completedActivities / totalActivities) * 100) 
      : 0;

    let doneChapters = 0;
    list.forEach(c => {
      const p = progresses[c.id];
      if (p && p.materiDone && p.dhongengDone && p.lkpdScore !== null && p.gameDone) {
        doneChapters++;
      }
    });

    setStats({
      totalUnlocked: unlockedCount,
      totalDone: doneChapters,
      overallProgress: progressPercent
    });
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

    if (typeof window !== 'undefined') {
      const opened = sessionStorage.getItem('sinau_jawa_curtain_opened');
      if (opened === 'true') {
        setShowIntro(false);
        setIsCurtainOpen(true);
        startAmbientGamelan();
        if (!localStorage.getItem('sinau_jawa_tutorial_completed')) {
          setTutorialStep(0);
        }
      }
    }

    return () => {
      window.removeEventListener('thursdayModeChanged', handleThursdayChange);
      window.removeEventListener('profileUpdated', handleProfileChange);
    };
  }, [refreshState]);

  useEffect(() => {
    if (tutorialStep !== null && typeof window !== 'undefined') {
      const step = tutorialSteps[tutorialStep];
      if (step.highlightId) {
        const el = document.getElementById(step.highlightId);
        if (el) {
          el.classList.add('tutorial-spotlight-highlight');
          return () => {
            el.classList.remove('tutorial-spotlight-highlight');
          };
        }
      }
    }
  }, [tutorialStep]);

  const handleRegisterSuccess = () => {
    refreshState();
  };

  const handleNodeClick = (chId: number, stepIndex: number, isUnlocked: boolean) => {
    if (!isUnlocked) {
      alert("🔒 Bagian iki isih terkunci! Rampungna urutan bagian sadurunge dhisik.");
      return;
    }
    playSaronChime();
  };

  const handleReset = () => {
    playSaronChime(330);
    if (confirm("Reset kabeh progress sinau sampeyan?")) {
      clearStudentProfile();
      refreshState();
      window.dispatchEvent(new Event('profileUpdated'));
    }
  };

  const handleStartAdventure = () => {
    playWelcomeGamelan();
    setIsCurtainOpen(true);
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('sinau_jawa_curtain_opened', 'true');
    }
    setTimeout(() => {
      setShowIntro(false);
      startAmbientGamelan(); 
      if (typeof window !== 'undefined' && !localStorage.getItem('sinau_jawa_tutorial_completed')) {
        setTutorialStep(0);
      }
    }, 1500); 
  };

  const handleChestClick = (chId: number, isClaimable: boolean) => {
    playSaronChime(554);
    if (!isClaimable) {
      alert("🔒 Peti Emas isih terkunci! Rampungna kabeh bagian wulangan Bab iki kagem mbukak peti.");
      return;
    }
    setClaimedChestChapter(chId);
    setShowChestModal(true);
  };

  const tutorialSteps = [
    {
      text: "Sugeng rawuh! Aku kanca petualanganmu ing Sinau Jawa. Ayo tak duduhi cara dolanan game iki supaya luwih asik! 👦",
      mood: 'happy' as const,
      highlightId: ''
    },
    {
      text: "Iki peta petualanganmu! Klik bunderan bagian Bab kagem miwiti sinau materi, dongeng wayang, nggarap LKPD, lan game kuis aksara. 🗺️",
      mood: 'talking' as const,
      highlightId: 'chapters'
    },
    {
      text: "Nalika kabeh bagian Bab rampung, sampeyan bisa mbukak Peti Emas pusaka iki kagem angsal hadiah kado kuno! 🎁",
      mood: 'celebrating' as const,
      highlightId: 'chapters'
    },
    {
      text: "Pantau Nyawa ❤️ kagem wangsulan, XP ⚡ kagem level munggah, lan barang-barang pusaka tradisional Jawa ing kene! 👑",
      mood: 'reading' as const,
      highlightId: 'profile-hud-element'
    },
    {
      text: "Puter Roda Kabegjan saben dina kagem angsal bonus Nyawa lan hadiah pusaka ekstra! 🎡",
      mood: 'talking' as const,
      highlightId: 'spin-wheel-btn'
    }
  ];

  const handleNextTutorial = () => {
    playSaronChime(660);
    if (tutorialStep !== null && tutorialStep < tutorialSteps.length - 1) {
      setTutorialStep(prev => prev! + 1);
    } else {
      if (typeof window !== 'undefined') {
        localStorage.setItem('sinau_jawa_tutorial_completed', 'true');
      }
      setTutorialStep(null);
      playSuccessChime();
    }
  };

  const handleSkipTutorial = () => {
    playSaronChime(330);
    if (typeof window !== 'undefined') {
      localStorage.setItem('sinau_jawa_tutorial_completed', 'true');
    }
    setTutorialStep(null);
  };

  const spinSegments: { label: string; color: string; type: 'XP' | 'HEART' | 'ZONK'; value: number }[] = [
    { label: "+10 XP", color: "#58CC02", type: 'XP', value: 10 },
    { label: "+1 Nyawa", color: "#FF4B4B", type: 'HEART', value: 1 },
    { label: "+25 XP", color: "#1CB0F6", type: 'XP', value: 25 },
    { label: "Mutiara Jawa", color: "#8B5CF6", type: 'ZONK', value: 0 },
    { label: "+50 XP", color: "#FF9600", type: 'XP', value: 50 },
    { label: "+5 XP", color: "#64748B", type: 'XP', value: 5 }
  ];

  const handleSpinWheel = () => {
    if (isSpinning) return;
    
    if (profile?.lastSpinTime) {
      const lastSpin = new Date(profile.lastSpinTime);
      const now = new Date();
      if (lastSpin.toDateString() === now.toDateString()) {
        alert("⚠️ Sampeyan wis muter roda dina iki! Balik maneh sesuk ya.");
        return;
      }
    }

    setIsSpinning(true);
    setSpinRewardMessage(null);

    const randomIndex = Math.floor(Math.random() * spinSegments.length);
    const reward = spinSegments[randomIndex];

    const extraDegrees = 360 - (randomIndex * 60) - 30;
    const finalRotation = spinRotation + 1800 + extraDegrees;
    
    setSpinRotation(finalRotation);

    let tickCount = 0;
    const tickInterval = setInterval(() => {
      if (tickCount < 25) {
        playSpinTick();
        tickCount++;
      } else {
        clearInterval(tickInterval);
      }
    }, 120);

    setTimeout(async () => {
      setIsSpinning(false);
      playSuccessChime();
      
      await claimSpinReward({ type: reward.type as any, value: reward.value });
      await refreshState();
      
      let rewardText = "";
      if (reward.type === 'XP') {
        rewardText = `Sugeng! Sampeyan entuk tambahan ${reward.value} XP!`;
      } else if (reward.type === 'HEART') {
        rewardText = `Mantep! Nyawamu tambah ${reward.value}!`;
      } else {
        rewardText = `Luar biasa! Sampeyan nemokake pusaka kuno!`;
      }
      setSpinRewardMessage(rewardText);
      refreshState();
    }, 3500);
  };

  const handleBuyItem = async (itemName: string, cost: number) => {
    playSaronChime(523);
    const success = await purchaseItem(itemName, cost);
    if (success) {
      playSuccessChime();
      alert(`🎉 Pusaka kasil dituku!`);
      refreshState();
    } else {
      alert(`❌ XP ora cukup utawa ana kesalahan.`);
    }
  };

  const getStepIcon = (stepType: 'materi' | 'dhongeng' | 'lkpd' | 'game') => {
    switch (stepType) {
      case 'materi':
        return (
          <svg viewBox="0 0 24 24" className="node-icon-svg">
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" stroke="white" strokeWidth="2.5" strokeLinecap="round" fill="none" />
            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" stroke="white" strokeWidth="2.5" fill="none" />
            <line x1="9" y1="7" x2="15" y2="7" stroke="white" strokeWidth="2" strokeLinecap="round" />
            <line x1="9" y1="11" x2="15" y2="11" stroke="white" strokeWidth="2" strokeLinecap="round" />
          </svg>
        );
      case 'dhongeng':
        return (
          <svg viewBox="0 0 24 24" className="node-icon-svg">
            <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" stroke="white" strokeWidth="2.5" fill="none" />
            <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" stroke="white" strokeWidth="2.5" fill="none" />
          </svg>
        );
      case 'lkpd':
        return (
          <svg viewBox="0 0 24 24" className="node-icon-svg">
            <path d="M12 20h9" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
            <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" stroke="white" strokeWidth="2.5" fill="none" />
          </svg>
        );
      case 'game':
        return (
          <svg viewBox="0 0 24 24" className="node-icon-svg">
            <rect x="2" y="6" width="20" height="12" rx="2" stroke="white" strokeWidth="2.5" fill="none" />
            <line x1="6" y1="12" x2="10" y2="12" stroke="white" strokeWidth="2" strokeLinecap="round" />
            <line x1="8" y1="10" x2="8" y2="14" stroke="white" strokeWidth="2" strokeLinecap="round" />
            <circle cx="15" cy="12" r="1.5" fill="white" />
            <circle cx="18" cy="12" r="1.5" fill="white" />
          </svg>
        );
    }
  };

  // Generate dynamic Weekly Leaderboard ranking based on Student Profile XP
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

  // Check interactive state of daily quests based on local storage
  const getDailyQuests = () => {
    const ch1Prog = chapterProgresses[1] || { materiDone: false, dhongengDone: false, lkpdScore: null, gameDone: false };
    return [
      { id: 'q1', text: 'Maca Teks Dongeng Bab 1', done: ch1Prog.dhongengDone, xp: 10 },
      { id: 'q2', text: 'Entuk Biji LKPD Bab 1', done: ch1Prog.lkpdScore !== null, xp: 15 },
      { id: 'q3', text: 'Rampungna Game Aksara 1', done: ch1Prog.gameDone, xp: 20 }
    ];
  };

  const getMascotGreetingText = () => {
    if (stats.overallProgress === 100) {
      return "Sugeng! Sampeyan pancen hebat, kabeh tantangan wis rampung! 🎉";
    }
    if (stats.overallProgress > 0) {
      return "Apik banget! Terusna petualanganmu, sithik mbaka sithik bakal dadi bukit! 💪";
    }
    return "Sugeng rawuh! Ayo miwiti petualangan sinau basa Jawa bareng aku! 👦";
  };

  const currentRank = getJavaneseRank(profile ? profile.xp : 0);

  const nodeCoords = [
    { x: 110, y: 55 }, 
    { x: 240, y: 165 }, 
    { x: 370, y: 275 }, 
    { x: 240, y: 395 } 
  ];

  const fullPathD = "M 110 55 C 110 120, 240 100, 240 165 C 240 230, 370 210, 370 275 C 370 340, 240 330, 240 395";

  const getActivePinInfo = (): { chId: number; stepIdx: number; x: number; y: number } | null => {
    if (stats.totalUnlocked > chapters.length) return null; 
    const activeChId = stats.totalUnlocked;
    const prog = chapterProgresses[activeChId] || { materiDone: false, dhongengDone: false, lkpdScore: null, gameDone: false };
    
    let stepIdx = 1;
    if (prog.materiDone) stepIdx = 2;
    if (prog.dhongengDone) stepIdx = 3;
    if (prog.lkpdScore !== null) stepIdx = 4;
    if (prog.gameDone) stepIdx = 5; 
    
    if (stepIdx > 4) return null;
    
    const coord = nodeCoords[stepIdx - 1];
    return { chId: activeChId, stepIdx, x: coord.x, y: coord.y };
  };

  const activePin = getActivePinInfo();

  return (
    <>
      {/* TRADITIONAL CURTAIN / GAMELAN INTRO OVERLAY */}
      {showIntro && (
        <div className={`curtain-screen ${isCurtainOpen ? 'curtains-open' : ''}`}>
          <div className="curtain-side curtain-left"></div>
          
          <div className="curtain-center-box" style={{ opacity: isCurtainOpen ? 0 : 1 }}>
            <svg viewBox="0 0 100 130" width="120" height="150" fill="none" stroke="#F5D061" strokeWidth="2.5">
              <path d="M50 10 C20 60, 10 100, 10 120 C10 130, 20 130, 50 130 C80 130, 90 130, 90 120 C90 100, 80 60, 50 10 Z" />
              <line x1="50" y1="130" x2="50" y2="40" />
              <circle cx="50" cy="130" r="10" />
              <path d="M50 80 Q30 70, 25 85 M50 80 Q70 70, 75 85" strokeWidth="2" />
            </svg>
            <h1 className="curtain-title">SINAU JAWA</h1>
            <p className="curtain-subtitle">Game Petualangan Basa & Aksara Jawa Klasik</p>
            <button 
              className="btn-duo btn-duo-primary"
              onClick={handleStartAdventure}
              style={{ 
                width: 'auto', 
                padding: '14px 36px', 
                fontSize: '16px', 
                backgroundColor: 'var(--color-gold)', 
                borderColor: 'var(--color-gold)',
                borderBottomColor: 'var(--color-gold-dark)',
                color: '#1F2937'
              }}
            >
              Mulai Petualangan ➔
            </button>
          </div>

          <div className="curtain-side curtain-right"></div>
        </div>
      )}

      {/* CLAIM CHEST MODAL WINDOW */}
      {showChestModal && (
        <div className="modal-overlay" onClick={() => setShowChestModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <span style={{ fontSize: '72px' }}>🎁</span>
            <h2 className="modal-title">Peti Pusaka Kebuka!</h2>
            <p className="modal-body-text">
              Sugeng! Sampeyan kasil ngrampungake kabeh tantangan ing **Bab {claimedChestChapter}**. Pusaka keris emas lan kawruh luhur kasil ditambahkan menyang inventaris sampeyan!
            </p>
            <button 
              className="btn-duo btn-duo-primary" 
              onClick={() => { playSaronChime(660); setShowChestModal(false); }}
            >
              Matur Nuwun! ✓
            </button>
          </div>
        </div>
      )}

      {/* RODA KABEGJAN (DAILY SPIN WHEEL) MODAL */}
      {showSpinModal && (
        <div className="modal-overlay" onClick={() => !isSpinning && setShowSpinModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '400px' }}>
            <h2 className="modal-title" style={{ fontSize: '24px', color: 'var(--color-orange-dark)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
              🎡 Roda Kabegjan Jawa
            </h2>
            <p className="modal-body-text" style={{ fontSize: '13px', marginBottom: '16px' }}>
              Puter roda saben dina kagem angsal hadiah ekstra kayata Nyawa lan XP!
            </p>

            <div className="wheel-outer-wrapper">
              <div className="wheel-pointer"></div>
              <div 
                className="wheel-container"
                style={{ 
                  transform: `rotate(${spinRotation}deg)`,
                }}
              >
                {/* Visual Segments */}
                {spinSegments.map((seg, idx) => {
                  const rotation = idx * 60;
                  return (
                    <div 
                      key={idx} 
                      className="wheel-segment"
                      style={{
                        transform: `rotate(${rotation}deg)`,
                        position: 'absolute',
                        width: '100%',
                        height: '100%',
                      }}
                    >
                      {/* Segment colored wedge */}
                      <div
                        style={{
                          position: 'absolute',
                          width: '50%',
                          height: '100%',
                          background: seg.color,
                          transformOrigin: '100% 50%',
                          transform: 'skewX(30deg)',
                          borderLeft: '1px solid rgba(0,0,0,0.1)'
                        }}
                      ></div>
                      {/* Text label */}
                      <div
                        style={{
                          position: 'absolute',
                          left: '50%',
                          top: '12%',
                          transform: 'translateX(-50%) rotate(30deg)',
                          transformOrigin: '50% 100%',
                          color: '#FFFFFF',
                          fontWeight: '800',
                          fontSize: '11px',
                          textShadow: '1px 1px 2px rgba(0,0,0,0.6)',
                          whiteSpace: 'nowrap',
                          zIndex: 2
                        }}
                      >
                        {seg.label}
                      </div>
                    </div>
                  );
                })}
                <div className="wheel-center-cap">🎡</div>
              </div>

              <button 
                className="btn-duo btn-duo-orange"
                onClick={handleSpinWheel}
                disabled={isSpinning}
                style={{ width: '100%', padding: '14px 24px', fontSize: '16px' }}
              >
                {isSpinning ? 'Muter...' : 'Puter Roda! ➔'}
              </button>
            </div>

            {spinRewardMessage && (
              <div style={{ marginTop: '20px', padding: '12px', background: '#F0FDF4', border: '2px solid #BBF7D0', borderRadius: '12px', color: 'var(--color-green-dark)', fontWeight: '800', fontSize: '14px', animation: 'scale-up 0.2s ease-out' }}>
                {spinRewardMessage}
              </div>
            )}

            <button 
              className="btn-duo btn-duo-secondary" 
              onClick={() => !isSpinning && setShowSpinModal(false)}
              disabled={isSpinning}
              style={{ marginTop: '16px', padding: '8px' }}
            >
              Tutup
            </button>
          </div>
        </div>
      )}

      <div className="app-layout">
        <Navigation profile={profile} onOpenLogin={() => setShowRegister(true)} onRefresh={refreshState} />

        <div className="main-wrapper">
          
          {/* CENTER CONTENT */}
          <main className="content-area">
            
            {/* Welcome Banner Card with Joglo Roof & Batik pattern */}
            <div style={{ position: 'relative', width: '100%', marginBottom: '32px' }}>
              <div className="joglo-roof-style">
                <svg viewBox="0 0 400 48" width="100%" height="48" fill="none" stroke="#5C2E0B" strokeWidth="3.5" strokeLinecap="round">
                  <path d="M30 48 L70 18 L330 18 L370 48" />
                  <path d="M110 18 L150 2 L250 2 L290 18" fill="rgba(139, 69, 19, 0.08)" />
                  <line x1="70" y1="18" x2="330" y2="18" strokeWidth="2" />
                  <line x1="110" y1="12" x2="290" y2="12" strokeWidth="1.5" stroke="#D97706" />
                </svg>
              </div>
              <div className="pendopo-header" style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '24px 32px' }}>
                {/* Gunungan Background Watermark */}
                <div className="wayang-decoration-hud" style={{ right: '20px', bottom: '-20px', width: '120px', height: '160px' }}>
                  <svg viewBox="0 0 100 140" fill="none" stroke="#D97706" strokeWidth="1.5">
                    <path d="M50 10 C20 60, 10 100, 10 120 C10 130, 20 130, 50 130 C80 130, 90 130, 90 120 C90 100, 80 60, 50 10 Z" fill="rgba(253, 224, 71, 0.05)" />
                    <line x1="50" y1="130" x2="50" y2="40" />
                    <path d="M50 80 Q30 70, 25 85 M50 80 Q70 70, 75 85" />
                    <circle cx="50" cy="130" r="8" fill="rgba(139, 69, 19, 0.1)" />
                  </svg>
                </div>
                
                <span className="media-tag" style={{ background: 'rgba(200, 136, 26, 0.2)', color: '#FFF8E0', border: '1px solid rgba(200, 136, 26, 0.5)', padding: '4px 10px', fontSize: '11px', fontWeight: '800', borderRadius: '8px', alignSelf: 'flex-start', zIndex: 1 }}>
                  🏯 Pendopo Ageng Pasinaon
                </span>
                <h1 className="javanese-title" style={{ fontSize: '28px', fontWeight: '900', lineHeight: '1.2', zIndex: 1 }}>
                  Sinau Basa Jawa Kanthi Seneng
                </h1>
                <p style={{ color: 'rgba(255, 248, 224, 0.85)', fontSize: '15px', lineHeight: '1.6', fontWeight: '600', maxWidth: '80%', zIndex: 1 }}>
                  Materi interaktif, dongeng rakyat Jawa, E-LKPD mandiri, lan game aksara Jawa ing siji dashboard.
                </p>
              </div>
            </div>

            <div id="chapters">
              {chapters.map((ch, idx) => {
                const chUnlocked = ch.id <= stats.totalUnlocked;
                const chProg = chapterProgresses[ch.id] || { materiDone: false, dhongengDone: false, lkpdScore: null, gameDone: false };
                
                const bannerColors = [
                  { bg: 'var(--color-blue)', dark: 'var(--color-blue-dark)' },
                  { bg: 'var(--color-orange)', dark: 'var(--color-orange-dark)' },
                  { bg: 'var(--color-purple)', dark: 'var(--color-purple-dark)' }
                ][idx % 3];

                const step1Unlocked = chUnlocked;
                const step2Unlocked = chUnlocked && chProg.materiDone;
                const step3Unlocked = chUnlocked && chProg.dhongengDone;
                const step4Unlocked = chUnlocked && chProg.lkpdScore !== null;
                const chCompleted = chProg.materiDone && chProg.dhongengDone && chProg.lkpdScore !== null && chProg.gameDone;

                let completedNodes = 0;
                if (chProg.materiDone) completedNodes = 1;
                if (chProg.dhongengDone) completedNodes = 2;
                if (chProg.lkpdScore !== null) completedNodes = 3;
                if (chProg.gameDone) completedNodes = 4;

                return (
                  <div key={ch.id} style={{ marginBottom: '40px' }}>
                    
                    {/* Chapter Header Banner */}
                    <div className="chapter-banner-sawunggaling" style={{ marginBottom: '0px' }}>
                      <div className="chapter-header-num" style={{ color: 'rgba(255, 248, 224, 0.7)', fontSize: '12px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '4px' }}>Bab {ch.id} — Lakon Sawunggaling</div>
                      <div className="chapter-header-title" style={{ color: '#FFF8E0', fontSize: '22px', fontWeight: '900', lineHeight: '1.2' }}>{ch.title}</div>
                      {!chUnlocked && (
                        <span style={{ fontSize: '12px', background: 'rgba(0,0,0,0.3)', padding: '4px 8px', borderRadius: '6px', marginTop: '6px', display: 'inline-block', fontWeight: '800', color: '#FFF8E0' }}>
                          🔒 Terkunci (Rampungna bab sadurunge)
                        </span>
                      )}
                    </div>

                    {/* WINDING PATHWAY CONTAINER MAP */}
                    <div className="journey-map-wrapper">
                      
                      <svg className="journey-path-svg" viewBox="0 0 480 520">
                        {/* Shadow main path */}
                        <path 
                          d={fullPathD} 
                          stroke="#E2E8F0" 
                          strokeWidth="16" 
                          fill="none" 
                          strokeLinecap="round" 
                        />
                        {/* Walking path dots */}
                        <path 
                          d={fullPathD} 
                          stroke="#FFFFFF" 
                          strokeWidth="10" 
                          fill="none" 
                          strokeLinecap="round" 
                          strokeDasharray="4,6"
                        />
                        {/* Highlighted active path color */}
                        {chUnlocked && completedNodes > 0 && (
                          <path 
                            d={fullPathD} 
                            stroke={bannerColors.bg} 
                            strokeWidth="10" 
                            fill="none" 
                            strokeLinecap="round" 
                            strokeDasharray={completedNodes === 1 ? "100,500" : completedNodes === 2 ? "220,500" : completedNodes === 3 ? "360,500" : "none"}
                            style={{ transition: 'stroke-dasharray 0.5s ease' }}
                          />
                        )}
                      </svg>

                      {/* JAVANESE MAP DECORATIONS - DISEBAR BERDASARKAN CHAPTER (idx) */}
                      
                      {/* --- DEKORASI UNTUK CHAPTER 1 (idx % 3 === 0) --- */}
                      {idx % 3 === 0 && (
                        <>
                          {/* Mascot Boy (Dalang Cilik) - Kiri Atas */}
                          <div style={{ position: 'absolute', left: '10px', top: '10px', zIndex: 5, animation: 'map-float 4s ease-in-out infinite' }}>
                            <MascotVisual width="90px" height="90px" mood="happy" />
                          </div>

                          {/* Pohon Beringin - Kiri Tengah */}
                          <div style={{ position: 'absolute', left: '15px', top: '180px', width: '100px', height: '100px', zIndex: 1, opacity: 0.85, transformOrigin: 'bottom center', animation: 'map-sway 7s ease-in-out infinite' }}>
                            <svg viewBox="0 0 100 100" fill="none">
                              <path d="M45 90 C45 70, 40 50, 40 50 C40 50, 60 50, 60 50 C60 50, 55 70, 55 90 Z" fill="#5C2E0B" />
                              <path d="M35 70 Q40 85, 45 90" stroke="#5C2E0B" strokeWidth="3" fill="none" />
                              <path d="M65 70 Q60 85, 55 90" stroke="#5C2E0B" strokeWidth="3" fill="none" />
                              <line x1="30" y1="60" x2="30" y2="85" stroke="#8B4513" strokeWidth="1.5" />
                              <line x1="70" y1="55" x2="70" y2="80" stroke="#8B4513" strokeWidth="1.5" />
                              <circle cx="50" cy="35" r="25" fill="#2E8B57" />
                              <circle cx="30" cy="45" r="20" fill="#228B22" />
                              <circle cx="70" cy="45" r="20" fill="#228B22" />
                              <circle cx="35" cy="25" r="18" fill="#3CB371" />
                              <circle cx="65" cy="25" r="18" fill="#3CB371" />
                            </svg>
                          </div>
                          
                          {/* Rumah Joglo - Kanan Bawah */}
                          <div style={{ position: 'absolute', right: '15px', top: '350px', width: '90px', height: '70px', zIndex: 1, opacity: 0.9, animation: 'map-float 6s ease-in-out infinite' }}>
                            <svg viewBox="0 0 100 80" fill="none">
                              <path d="M30 30 L50 10 L70 30 Z" fill="#8B4513" stroke="#5C2E0B" strokeWidth="2" strokeLinejoin="round" />
                              <path d="M10 45 L30 30 L70 30 L90 45 Z" fill="#A0522D" stroke="#5C2E0B" strokeWidth="2" strokeLinejoin="round" />
                              <rect x="25" y="45" width="50" height="25" fill="#DEB887" stroke="#8B4513" strokeWidth="2" />
                              <line x1="35" y1="45" x2="35" y2="70" stroke="#8B4513" strokeWidth="2" />
                              <line x1="65" y1="45" x2="65" y2="70" stroke="#8B4513" strokeWidth="2" />
                              <rect x="15" y="70" width="70" height="5" fill="#A9A9A9" stroke="#696969" strokeWidth="1" />
                              <rect x="42" y="52" width="16" height="18" fill="#5C2E0B" rx="2" />
                            </svg>
                          </div>
                        </>
                      )}

                      {/* --- DEKORASI UNTUK CHAPTER 2 (idx % 3 === 1) --- */}
                      {idx % 3 === 1 && (
                        <>
                          {/* Mascot Gadis Jawa (Roro) - Kanan Atas */}
                          <div style={{ position: 'absolute', right: '15px', top: '40px', zIndex: 5, animation: 'map-float 5s ease-in-out infinite alternate' }}>
                            <div style={{ position: 'relative', width: '80px', height: '80px' }}>
                              <div style={{ position: 'absolute', top: '-25px', right: '50px', background: 'white', padding: '6px 10px', borderRadius: '10px 10px 0 10px', fontSize: '11px', fontWeight: 'bold', border: '2px solid #E5E7EB', whiteSpace: 'nowrap', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', color: '#D44C20' }}>
                                {chCompleted ? "Pinter Tenan!" : "Ayo Sinau!"}
                              </div>
                              <svg viewBox="0 0 100 100">
                                <circle cx="50" cy="50" r="30" fill="#FFD1B3" />
                                <circle cx="25" cy="45" r="15" fill="#2C1500" />
                                <path d="M20 50 Q50 10 80 50 Z" fill="#2C1500" />
                                <line x1="10" y1="40" x2="30" y2="50" stroke="#E8A830" strokeWidth="2" />
                                <circle cx="10" cy="40" r="3" fill="#E8A830" />
                                <circle cx="40" cy="55" r="3" fill="#000" />
                                <circle cx="60" cy="55" r="3" fill="#000" />
                                <path d="M45 65 Q50 70 55 65" fill="none" stroke="#D44C20" strokeWidth="2" strokeLinecap="round" />
                                <circle cx="35" cy="60" r="4" fill="#FF8080" opacity="0.5" />
                                <circle cx="65" cy="60" r="4" fill="#FF8080" opacity="0.5" />
                              </svg>
                            </div>
                          </div>

                          {/* Candi Kecil - Kiri Bawah */}
                          <div style={{ position: 'absolute', left: '25px', top: '330px', width: '70px', height: '90px', zIndex: 1, animation: 'pulse-glow 5s ease-in-out infinite' }}>
                            <svg viewBox="0 0 80 100" fill="none">
                              <rect x="10" y="80" width="60" height="10" fill="#808080" stroke="#4F4F4F" strokeWidth="2" />
                              <rect x="15" y="70" width="50" height="10" fill="#A9A9A9" stroke="#4F4F4F" strokeWidth="2" />
                              <rect x="25" y="40" width="30" height="30" fill="#808080" stroke="#4F4F4F" strokeWidth="2" />
                              <path d="M35 70 L35 55 A 5 5 0 0 1 45 55 L45 70" fill="#4F4F4F" />
                              <polygon points="20,40 40,15 60,40" fill="#A9A9A9" stroke="#4F4F4F" strokeWidth="2" strokeLinejoin="round" />
                              <polygon points="30,15 40,0 50,15" fill="#808080" stroke="#4F4F4F" strokeWidth="2" strokeLinejoin="round" />
                            </svg>
                          </div>
                        </>
                      )}

                      {/* --- DEKORASI UNTUK CHAPTER 3 (idx % 3 === 2) --- */}
                      {idx % 3 === 2 && (
                        <>
                          {/* Mascot Ayam Jago - Kanan Atas */}
                          <div style={{ position: 'absolute', right: '40px', top: '80px', zIndex: 5, animation: 'map-float 4.5s ease-in-out infinite', transform: 'scaleX(-1)' }}>
                            <div style={{ position: 'relative', width: '80px', height: '80px' }}>
                              <svg viewBox="0 0 100 100">
                                <path d="M30 60 Q50 90 70 60 Q80 40 60 30 Q40 40 30 60 Z" fill="#D44C20" />
                                <path d="M30 60 Q10 40 20 20 Q30 30 40 40 Z" fill="#1A56A8" />
                                <path d="M25 65 Q5 50 10 30 Q25 40 35 50 Z" fill="#1E8C3A" />
                                <path d="M60 30 Q70 10 80 25 Q70 35 60 30 Z" fill="#B01818" />
                                <path d="M65 35 Q75 20 85 30 Q75 40 65 35 Z" fill="#B01818" />
                                <circle cx="70" cy="40" r="3" fill="#000" />
                                <polygon points="80,45 95,45 80,55" fill="#E8A830" />
                                <path d="M40 55 Q55 75 65 55" fill="none" stroke="#A83808" strokeWidth="4" strokeLinecap="round" />
                              </svg>
                            </div>
                          </div>

                          {/* Keris Pusaka Tancap - Center */}
                          <div style={{ position: 'absolute', left: '150px', top: '240px', zIndex: 1, animation: 'pulse-glow 4s ease-in-out infinite' }}>
                            <svg viewBox="0 0 60 100" width="45" height="75">
                              <path d="M10 80 Q30 60 50 80 Q60 100 30 100 Q0 100 10 80 Z" fill="#696969" />
                              <path d="M28 70 Q25 60 30 50 Q35 40 30 30 Q25 20 30 10 L30 5 L32 5 L32 10 Q37 20 32 30 Q27 40 32 50 Q37 60 32 70 Z" fill="#D3D3D3" stroke="#E8A830" strokeWidth="1" />
                              <rect x="26" y="70" width="8" height="15" fill="#5A2800" rx="2" />
                              <circle cx="30" cy="85" r="5" fill="#D4900A" />
                            </svg>
                          </div>
                        </>
                      )}

                      {/* AWAN & KUNANG-KUNANG (Ada di semua chapter, tapi posisinya diacak sedikit menggunakan idx) */}
                      <div style={{ position: 'absolute', left: idx % 2 === 0 ? '20px' : '300px', top: '10px', width: '90px', height: '35px', opacity: 0.5, animation: 'cloud-drift 12s ease-in-out infinite' }}>
                        <svg viewBox="0 0 100 40" fill="#FFE87A">
                          <path d="M20 30 A10 10 0 0 1 20 10 A15 15 0 0 1 45 5 A15 15 0 0 1 75 10 A12 12 0 0 1 75 30 Z" />
                        </svg>
                      </div>
                      <div style={{ position: 'absolute', right: '10px', top: idx % 2 === 0 ? '220px' : '300px', width: '70px', height: '25px', opacity: 0.4, animation: 'cloud-drift 15s ease-in-out infinite alternate-reverse' }}>
                        <svg viewBox="0 0 100 40" fill="#FFE87A">
                          <path d="M20 30 A10 10 0 0 1 20 10 A15 15 0 0 1 45 5 A15 15 0 0 1 75 10 A12 12 0 0 1 75 30 Z" />
                        </svg>
                      </div>

                      <span className="floating-aksara-particle" style={{ left: '45px', top: '140px', fontSize: '20px', color: '#F5D87A' }}>✨</span>
                      <span className="floating-aksara-particle" style={{ right: '40px', top: '280px', fontSize: '16px', color: '#F5D87A', animationDelay: '2s' }}>✨</span>
                      <span className="floating-aksara-particle" style={{ left: '150px', top: '380px', fontSize: '24px', color: '#F5D87A', animationDelay: '1.5s' }}>✨</span>

                      {/* BOUNCING MASCOT AVATAR POSITION MARKER */}
                      {activePin && activePin.chId === ch.id && (
                        <div 
                          className="avatar-pin-container"
                          style={{ left: `${activePin.x}px`, top: `${activePin.y}px` }}
                        >
                          <div className="avatar-pin-bubble">Kamu neng kene!</div>
                          <div className="avatar-pin-circle">👦</div>
                        </div>
                      )}

                      {/* Node 1: Materi */}
                      <div 
                        className="journey-node-abs"
                        style={{ left: `${nodeCoords[0].x}px`, top: `${nodeCoords[0].y}px` }}
                      >
                        <Link 
                          href={step1Unlocked ? `/chapter/${ch.id}?step=1` : '#'} 
                          onClick={() => handleNodeClick(ch.id, 1, step1Unlocked)}
                        >
                          <div className={`chapter-node ${step1Unlocked ? 'node-unlocked node-materi' : 'node-locked'}`} style={{ backgroundColor: step1Unlocked ? 'var(--color-blue)' : '#E5E7EB', boxShadow: step1Unlocked ? '0 8px 0 var(--color-blue-dark)' : '0 8px 0 #C3C6CC' }}>
                            {getStepIcon('materi')}
                          </div>
                        </Link>
                        <div className="node-label" style={{ fontSize: '13px', marginTop: '6px' }}>Materi</div>
                        <div className="node-status-text" style={{ fontSize: '10px' }}>
                          {chProg.materiDone ? '✓ Rampung' : step1Unlocked ? '● Mulai' : '🔒 Terkunci'}
                        </div>
                      </div>

                      {/* Node 2: Dongeng */}
                      <div 
                        className="journey-node-abs"
                        style={{ left: `${nodeCoords[1].x}px`, top: `${nodeCoords[1].y}px` }}
                      >
                        <Link 
                          href={step2Unlocked ? `/chapter/${ch.id}?step=2` : '#'} 
                          onClick={() => handleNodeClick(ch.id, 2, step2Unlocked)}
                        >
                          <div className={`chapter-node ${step2Unlocked ? 'node-unlocked node-dhongeng' : 'node-locked'}`} style={{ backgroundColor: step2Unlocked ? 'var(--color-orange)' : '#E5E7EB', boxShadow: step2Unlocked ? '0 8px 0 var(--color-orange-dark)' : '0 8px 0 #C3C6CC' }}>
                            {getStepIcon('dhongeng')}
                          </div>
                        </Link>
                        <div className="node-label" style={{ fontSize: '13px', marginTop: '6px' }}>Dongeng</div>
                        <div className="node-status-text" style={{ fontSize: '10px' }}>
                          {chProg.dhongengDone ? '✓ Rampung' : step2Unlocked ? '● Mulai' : '🔒 Terkunci'}
                        </div>
                      </div>

                      {/* Node 3: LKPD */}
                      <div 
                        className="journey-node-abs"
                        style={{ left: `${nodeCoords[2].x}px`, top: `${nodeCoords[2].y}px` }}
                      >
                        <Link 
                          href={step3Unlocked ? `/chapter/${ch.id}?step=3` : '#'} 
                          onClick={() => handleNodeClick(ch.id, 3, step3Unlocked)}
                        >
                          <div className={`chapter-node ${step3Unlocked ? 'node-unlocked node-lkpd' : 'node-locked'}`} style={{ backgroundColor: step3Unlocked ? 'var(--color-green)' : '#E5E7EB', boxShadow: step3Unlocked ? '0 8px 0 var(--color-green-dark)' : '0 8px 0 #C3C6CC' }}>
                            {getStepIcon('lkpd')}
                          </div>
                        </Link>
                        <div className="node-label" style={{ fontSize: '13px', marginTop: '6px' }}>LKPD</div>
                        <div className="node-status-text" style={{ fontSize: '10px' }}>
                          {chProg.lkpdScore !== null ? `✓ Skor: ${chProg.lkpdScore}` : step3Unlocked ? '● Mulai' : '🔒 Terkunci'}
                        </div>
                      </div>

                      {/* Node 4: Game */}
                      <div 
                        className="journey-node-abs"
                        style={{ left: `${nodeCoords[3].x}px`, top: `${nodeCoords[3].y}px` }}
                      >
                        <Link 
                          href={step4Unlocked ? `/chapter/${ch.id}?step=4` : '#'} 
                          onClick={() => handleNodeClick(ch.id, 4, step4Unlocked)}
                        >
                          <div className={`chapter-node ${step4Unlocked ? 'node-unlocked node-game' : 'node-locked'}`} style={{ backgroundColor: step4Unlocked ? 'var(--color-purple)' : '#E5E7EB', boxShadow: step4Unlocked ? '0 8px 0 var(--color-purple-dark)' : '0 8px 0 #C3C6CC' }}>
                            {getStepIcon('game')}
                          </div>
                        </Link>
                        <div className="node-label" style={{ fontSize: '13px', marginTop: '6px' }}>Game</div>
                        <div className="node-status-text" style={{ fontSize: '10px' }}>
                          {chProg.gameDone ? '✓ Rampung' : step4Unlocked ? '● Mulai' : '🔒 Terkunci'}
                        </div>
                      </div>

                      {/* END OF CHAPTER: TREASURE GOLD CHEST */}
                      <div 
                        className="chest-node-container" 
                        style={{ left: '240px', top: '460px' }}
                      >
                        <div 
                          className="chest-element"
                          onClick={() => handleChestClick(ch.id, chCompleted)}
                        >
                          {chCompleted ? '🎁' : '🔒'}
                        </div>
                        <span style={{ fontSize: '10px', fontWeight: '800', textTransform: 'uppercase', color: chCompleted ? 'var(--color-gold-dark)' : 'var(--text-muted)', marginTop: '4px' }}>
                          {chCompleted ? 'Buka Kado' : 'Terkunci'}
                        </span>
                      </div>

                    </div>
                  </div>
                );
              })}
            </div>

            {/* KIOS PUSAKA TELAH DIPINDAH KE HALAMAN /shop */}
          </main>

          {/* RIGHT SIDEBAR */}
          <aside className="right-sidebar">
            
            {/* User Session Profile Stats */}
            <div id="profile-hud-element" className="profile-hud" style={{ boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
              <div className="profile-hud-header">
                <div className="avatar-circle">👦</div>
                <div className="profile-info">
                  <span className="profile-name">{profile ? profile.name : 'Tamu (Guest)'}</span>
                  <span className="profile-class">{profile ? `Kelas ${profile.className}` : 'Pilih Masuk'}</span>
                </div>
              </div>
              
              {/* Javanese rank title badge */}
              <div className="rank-badge-hud" style={{ color: currentRank.color, borderColor: currentRank.border, background: `${currentRank.border}15` }}>
                {currentRank.badge} {currentRank.title}
              </div>
              
              <div className="hud-stats-grid" style={{ marginTop: '12px' }}>
                <div className="hud-stat-item stat-heart" title="Nyawa" onClick={() => playSaronChime(660)}>
                  <div className="profile-name">{profile?.name || 'Dalang Cilik'}</div>
                  <div className="profile-class">Kelas {profile?.className || '-'}</div>
                </div>
              </div>

              <div className="hud-stats-grid">
                <div className="stat-item">
                  <span className="stat-icon">❤️</span>
                  <span className="stat-value">{profile?.hearts || 0}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-icon">⚡</span>
                  <span className="stat-value">{profile?.xp || 0}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-icon">👑</span>
                </div>
              </div>
              
              <div style={{ background: 'rgba(255, 255, 255, 0.6)', padding: '6px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: '800', color: '#8A5506', display: 'flex', alignItems: 'center', gap: '8px', border: '1px solid rgba(201, 146, 58, 0.4)' }}>
                <span style={{ fontSize: '16px' }}>{currentRank.icon}</span>
                <span>{currentRank.name}</span>
              </div>
 
              {profile && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%', marginTop: '8px' }}>
                  <button 
                    id="spin-wheel-btn"
                    className="btn-plakat-jati"
                    style={{ padding: '10px 12px', fontSize: '11px', width: '100%' }}
                    onClick={() => { playSaronChime(554); setShowSpinModal(true); }}
                  >
                    🎡 Roda Kabegjan (Muter)
                  </button>

                  <button 
                    className="btn-plakat-lontar" 
                    style={{ padding: '8px 12px', fontSize: '11px', width: '100%' }}
                    onClick={handleReset}
                  >
                    Reset Progress
                  </button>

                  <button 
                    className="btn-plakat-lontar" 
                    style={{ padding: '8px 12px', fontSize: '11px', width: '100%', background: 'linear-gradient(180deg, #FFFFFF 0%, #F0F9FF 100%)', borderColor: '#3B82F6', color: '#1D4ED8', boxShadow: 'inset 0 2px 0 rgba(255,255,255,0.4), 0 6px 0 #2563EB' }}
                    onClick={() => { playSaronChime(523); setTutorialStep(0); }}
                  >
                    📖 Panduan Tutorial
                  </button>
                </div>
              )}
            </div>

            {/* Daily Quests Checklists panel */}
            <div className="card-keraton" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <h4 className="card-keraton-title">🎯 Misi Saben Dina</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {getDailyQuests().map(q => (
                  <div key={q.id} className={`quest-item quest-item-keraton ${q.done ? 'done' : ''}`}>
                    <input type="checkbox" checked={q.done} readOnly className="quest-checkbox" />
                    <span className="quest-text" style={{ textDecoration: q.done ? 'line-through' : 'none', color: q.done ? 'var(--color-green-dark)' : '#6B3010', fontWeight: '700' }}>{q.text}</span>
                    <span className="quest-xp-badge" style={{ background: q.done ? '#A2E078' : '#F2E6CC', color: q.done ? '#FFF' : '#D4A040', border: q.done ? 'none' : '1px solid #D4A040' }}>+{q.xp} XP</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Weekly Gamelan Leaderboard panel */}
            <div className="card-keraton" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <h4 className="card-keraton-title">🏆 Liga Gamelan</h4>
              <div className="leaderboard-list">
                {getLeaderboardList().map((player, index) => {
                  const medalColors = ['rank-gold', 'rank-silver', 'rank-bronze'];
                  return (
                    <div key={index} className={`leaderboard-item ${player.isSelf ? 'item-self' : ''}`} style={{ background: player.isSelf ? 'rgba(232, 168, 48, 0.15)' : 'transparent', border: player.isSelf ? '2px solid #C9923A' : '2px solid transparent', borderRadius: '12px' }}>
                      <span className={`leaderboard-rank ${index < 3 ? medalColors[index] : ''}`}>{index + 1}</span>
                      <span className="leaderboard-avatar">{player.avatar}</span>
                      <span className="leaderboard-name" style={{ color: '#6B3010', fontWeight: '800' }}>{player.name} {player.isSelf && '(Kowe)'}</span>
                      <span className="leaderboard-xp" style={{ color: '#D4A040' }}>{player.xp} XP</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Thursday Banner Card */}
            {isThursday && (
              <div className="thursday-banner-card">
                <span className="thursday-tag">Aktif Kamis</span>
                <span className="thursday-text">
                  Dina iki dina Kamis! Ayo sinau tata krama basa Jawa / Unggah-Ungguh ing kaca khusus.
                </span>
                <Link href="/kamis">
                  <button className="btn-duo btn-duo-orange" style={{ padding: '10px 16px', fontSize: '13px' }} onClick={() => playSaronChime()}>
                    Sinau Unggah-Ungguh ➔
                  </button>
                </Link>
              </div>
            )}

            {/* Interactive Mascot replaced by floating helper pop-up button below or in mobile view */}

          </aside>

        </div>

        <RegisterModal 
          isOpen={showRegister} 
          onClose={() => setShowRegister(false)} 
          onSuccess={handleRegisterSuccess} 
        />
      </div>

      {/* ONBOARDING MASCOT TUTORIAL OVERLAY */}
      {tutorialStep !== null && (
        <div className="tutorial-overlay-backdrop" onClick={handleSkipTutorial}>
          <div className="tutorial-mascot-container" onClick={e => e.stopPropagation()}>
            <div style={{ width: '120px', height: '120px' }}>
              <MascotVisual 
                mood={tutorialSteps[tutorialStep].mood} 
                width="120px" 
                height="120px" 
              />
            </div>
            
            <div className="tutorial-speech-card">
              <p style={{ fontSize: '14px', fontWeight: '700', color: '#1F2937', lineHeight: '1.5' }}>
                {tutorialSteps[tutorialStep].text}
              </p>
              
              <div className="tutorial-step-dots">
                {tutorialSteps.map((_, i) => (
                  <div key={i} className={`tutorial-dot ${tutorialStep === i ? 'active' : ''}`}></div>
                ))}
              </div>

              <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
                <button 
                  className="btn-duo btn-duo-secondary" 
                  style={{ padding: '6px 12px', fontSize: '12px', borderBottomWidth: '3px', width: 'auto' }}
                  onClick={handleSkipTutorial}
                >
                  Lewati
                </button>
                <button 
                  className="btn-duo btn-duo-primary" 
                  style={{ padding: '6px 12px', fontSize: '12px', borderBottomWidth: '3px', flexGrow: 1 }}
                  onClick={handleNextTutorial}
                >
                  {tutorialStep === tutorialSteps.length - 1 ? 'Rampung! ✓' : 'Lanjut ➔'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* FLOATING MASCOT POP-UP BUTTON */}
      <button
        onClick={() => { playSaronChime(554); setShowMascotPopup(true); }}
        style={{
          position: 'fixed',
          bottom: '80px',
          right: '24px',
          width: '64px',
          height: '64px',
          borderRadius: '50%',
          backgroundColor: '#FFFFFF',
          border: '3px solid var(--color-green)',
          boxShadow: '0 8px 16px rgba(0,0,0,0.15)',
          zIndex: 900,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'transform 0.2s ease',
        }}
        onMouseOver={e => e.currentTarget.style.transform = 'scale(1.1)'}
        onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'}
      >
        <span style={{ fontSize: '32px' }}>🦉</span>
      </button>

      {/* MASCOT DIALOGUE POP-UP MODAL OVERLAY */}
      {showMascotPopup && (
        <div className="modal-overlay" onClick={() => setShowMascotPopup(false)} style={{ zIndex: 2000 }}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '400px', padding: '24px', border: '3px solid var(--color-green)' }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '12px' }}>
              <MascotVisual 
                mood={stats.overallProgress === 100 ? 'celebrating' : 'talking'}
                width="140px"
                height="140px"
              />
            </div>
            <h3 style={{ fontSize: '20px', fontWeight: '800', color: 'var(--color-green-dark)' }}>Sinau Jawa Helper</h3>
            <p className="modal-body-text" style={{ fontSize: '15px', color: 'var(--text-dark)', lineHeight: '1.6', background: '#F9FAFB', padding: '14px', borderRadius: '12px', border: '1.5px solid var(--border-light)', margin: '12px 0' }}>
              &ldquo;{getMascotGreetingText()}&rdquo;
            </p>
            <button 
              className="btn-duo btn-duo-primary"
              onClick={() => setShowMascotPopup(false)}
            >
              Matur Nuwun! ✓
            </button>
          </div>
        </div>
      )}
    </>
  );
}
