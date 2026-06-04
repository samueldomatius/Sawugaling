'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getChaptersList, getChapterProgress, updateChapterProgress, logScore, getStudentProfile, StudentProfile, deductHeart, addXP, addCrown } from '@/lib/db';
import { playSaronChime, playGongResonance, playErrorChime, speakJavaneseText, stopSpeech, playSuccessChime } from '@/lib/audio';
import { Suspense } from 'react';
import dynamic from 'next/dynamic';
import Navigation from '@/components/Navigation';
import { MascotMood } from '@/components/MascotVisual';

const RegisterModal = dynamic(() => import('@/components/RegisterModal'), { ssr: false });
const MascotVisual = dynamic(() => import('@/components/MascotVisual'), { ssr: false });
const AksaraGame = dynamic(() => import('@/components/AksaraGame'), { 
  ssr: false,
  loading: () => <p style={{ textAlign: 'center', padding: '20px' }}>⏳ Memuat Permainan...</p> 
});
import { Chapter } from '@/lib/chaptersData';

interface PageProps {
  params: {
    id: string;
  };
}

function ChapterDetailInner({ params }: PageProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const chapterId = parseInt(params.id);

  const [chapter, setChapter] = useState<Chapter | null>(null);
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [showRegister, setShowRegister] = useState(false);
  const [progress, setProgress] = useState({ materiDone: false, dhongengDone: false, lkpdScore: null as number | null, gameDone: false });
  const [activeStep, setActiveStep] = useState<1 | 2 | 3 | 4>(1);
  
  // Animation states
  const [shakeHearts, setShakeHearts] = useState(false);

  // Chapter Materi state
  const [expandedSection, setExpandedSection] = useState<number | null>(0);

  // Dhongeng state
  const [dongengPage, setDongengPage] = useState(0);
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Javanese Story Mode states
  const [storyAnswered, setStoryAnswered] = useState(false);
  const [selectedStoryOption, setSelectedStoryOption] = useState<string | null>(null);
  const [stars, setStars] = useState<{ id: number; left: number; top: number }[]>([]);

  // LKPD Form State
  const [answers, setAnswers] = useState<{ [qId: string]: string }>({});
  const [matchingSelections, setMatchingSelections] = useState<{ left: string | null; right: string | null }>({ left: null, right: null });
  const [currentMatches, setCurrentMatches] = useState<{ [left: string]: string }>({}); 
  const [lkpdSubmitted, setLkpdSubmitted] = useState(false);
  const [lkpdCalculatedScore, setLkpdCalculatedScore] = useState<number | null>(null);

  const loadProgress = useCallback(async () => {
    const currentProfile = await getStudentProfile();
    setProfile(currentProfile);
    if (!currentProfile) {
      setShowRegister(true);
    }

    const currentProg = await getChapterProgress(chapterId);
    setProgress({
      materiDone: currentProg.materiDone,
      dhongengDone: currentProg.dhongengDone,
      lkpdScore: currentProg.lkpdScore,
      gameDone: currentProg.gameDone
    });

    if (currentProg.lkpdScore !== null) {
      setLkpdCalculatedScore(currentProg.lkpdScore);
      setLkpdSubmitted(true);
    }
    if (currentProg.dhongengDone) {
      setStoryAnswered(true);
    }
  }, [chapterId]);

  useEffect(() => {
    const loadInit = async () => {
      const list = await getChaptersList();
      const found = list.find(c => c.id === chapterId);
      if (!found) {
        router.push('/');
        return;
      }
      setChapter(found);
      await loadProgress();
      window.dispatchEvent(new Event('stop-loading'));
    };
    loadInit();

    // Check query param step if provided
    const stepParam = searchParams.get('step');
    if (stepParam) {
      const stepVal = parseInt(stepParam);
      if (stepVal >= 1 && stepVal <= 4) {
        setActiveStep(stepVal as 1 | 2 | 3 | 4);
      }
    }
  }, [chapterId, loadProgress, router, searchParams]);

  // Listen to heart updates
  useEffect(() => {
    const handleProfileChange = async () => {
      setProfile(await getStudentProfile());
    };
    window.addEventListener('profileUpdated', handleProfileChange);
    return () => {
      stopSpeech();
      window.removeEventListener('profileUpdated', handleProfileChange);
    };
  }, []);

  if (!chapter) return null;

  // Determine Locking states
  const isDongengLocked = !progress.materiDone;
  const isLkpdLocked = !progress.dhongengDone;
  const isGameLocked = progress.lkpdScore === null;

  // Mascot visual mapping
  const getMascotMoodAndText = (): { mood: MascotMood; text: string } => {
    if (profile && profile.hearts === 0) {
      return { mood: 'thinking', text: 'Wah nyawamu entek le! Ayo isi nyawa maneh gratis supaya bisa lanjut sinau.' };
    }
    if (activeStep === 1) {
      return { mood: 'talking', text: 'Wacanen materi babagan Javanese klasik iki kanthi premati yo le! (+10 XP)' };
    }
    if (activeStep === 2) {
      return { mood: 'reading', text: 'Waca dongeng Sawunggaling. Klik speaker yen kepengin dirungokake! (+15 XP)' };
    }
    if (activeStep === 3) {
      if (lkpdSubmitted) {
        return {
          mood: 'happy',
          text: `Mantep! LKPD entuk biji ${lkpdCalculatedScore}. Ayo lanjut dolanan game! (+30 XP)`
        };
      }
      return { mood: 'thinking', text: 'Semangat nggarap LKPD! Awas, yen salah siji wangsulan nyawamu bakal kelong 1.' };
    }
    if (activeStep === 4) {
      if (progress.gameDone) {
        return { mood: 'celebrating', text: 'Matur nuwun! Wulangan Bab iki rampung. Kowe entuk 1 Mahkota 👑!' };
      }
      return { mood: 'thinking', text: 'Tarik aksara Jawa menyang kothak swara latin sing leres! (+30 XP)' };
    }
    return { mood: 'normal', text: 'Ayo semangat belajare!' };
  };

  const { mood: mascotMood, text: currentMascotText } = getMascotMoodAndText();

  // Complete Materi
  const handleCompleteMateri = async () => {
    if (progress.materiDone) {
      setActiveStep(2);
      return;
    }
    await updateChapterProgress(chapterId, "materiDone", true);
    await addXP(10);
    playSaronChime();
    await loadProgress();
    setActiveStep(2);
  };

  const handleAnswerStoryQuestion = async () => {
    if (selectedStoryOption === "Adipati Jayengrono") {
      setStoryAnswered(true);
      playSuccessChime();
      await addXP(10);
      
      // Star particles animation trigger
      const newStars = Array.from({ length: 15 }).map((_, i) => ({
        id: Math.random(),
        left: Math.random() * 80 + 10,
        top: Math.random() * 40 + 40
      }));
      setStars(newStars);
      setTimeout(() => setStars([]), 1500);
    } else {
      playErrorChime();
      await deductHeart();
      alert("❌ Waduh, salah! Coba waca naskah panel nduwur maneh.");
    }
  };

  const handleFinishStoryMode = async () => {
    if (!progress.dhongengDone) {
      await updateChapterProgress(chapterId, "dhongengDone", true);
      await addXP(15);
    }
    playGongResonance();
    await loadProgress();
    setActiveStep(3);
  };

  // Dongeng page flips
  const handleNextDongengPage = async () => {
    stopSpeech();
    setIsSpeaking(false);
    if (dongengPage < chapter.dhongeng.pages.length - 1) {
      setDongengPage(prev => prev + 1);
    } else {
      if (!progress.dhongengDone) {
        await updateChapterProgress(chapterId, "dhongengDone", true);
        await addXP(15);
      }
      playGongResonance();
      await loadProgress();
      setActiveStep(3);
    }
  };

  const handlePrevDongengPage = () => {
    stopSpeech();
    setIsSpeaking(false);
    if (dongengPage > 0) {
      setDongengPage(prev => prev - 1);
    }
  };

  const toggleSpeech = () => {
    if (isSpeaking) {
      stopSpeech();
      setIsSpeaking(false);
    } else {
      const pageText = chapter.dhongeng.pages[dongengPage].text;
      speakJavaneseText(pageText);
      setIsSpeaking(true);
    }
  };

  // LKPD controls
  const handleMultipleChoiceSelect = (qId: string, value: string) => {
    if (lkpdSubmitted) return;
    setAnswers(prev => ({ ...prev, [qId]: value }));
  };

  const handleTextChange = (qId: string, value: string) => {
    if (lkpdSubmitted) return;
    setAnswers(prev => ({ ...prev, [qId]: value }));
  };

  const handleMatchingClickLeft = (leftVal: string) => {
    if (lkpdSubmitted) return;
    if (currentMatches[leftVal]) {
      const updated = { ...currentMatches };
      delete updated[leftVal];
      setCurrentMatches(updated);
      playErrorChime();
      return;
    }
    setMatchingSelections(prev => ({ ...prev, left: leftVal }));
  };

  const handleMatchingClickRight = (rightVal: string) => {
    if (lkpdSubmitted) return;
    const isMatched = Object.values(currentMatches).includes(rightVal);
    if (isMatched) return;

    if (matchingSelections.left) {
      setCurrentMatches(prev => ({
        ...prev,
        [matchingSelections.left!]: rightVal
      }));
      setMatchingSelections({ left: null, right: null });
      playSaronChime();
    }
  };

  const submitLKPD = async () => {
    if (lkpdSubmitted) return;

    let correctCount = 0;
    let wrongCount = 0;
    const questions = chapter.lkpd.questions;

    questions.forEach(q => {
      if (q.type === 'multiple-choice') {
        if (answers[q.id] === q.correctAnswer) {
          correctCount++;
        } else {
          wrongCount++;
        }
      } else if (q.type === 'text') {
        const studentAns = (answers[q.id] || '').trim().toLowerCase();
        const correctAns = (q.correctAnswer as string).trim().toLowerCase();
        if (studentAns === correctAns || (correctAns.includes(studentAns) && studentAns.length > 3)) {
          correctCount++;
        } else {
          wrongCount++;
        }
      } else if (q.type === 'matching') {
        const requiredPairs = q.correctAnswer as string[];
        let matchCorrect = true;
        requiredPairs.forEach(pairStr => {
          const [left, right] = pairStr.split(':');
          if (currentMatches[left] !== right) {
            matchCorrect = false;
          }
        });
        if (matchCorrect) {
          correctCount++;
        } else {
          wrongCount++;
        }
      }
    });

    // Heart deduction mapping
    if (wrongCount > 0) {
      playErrorChime();
      setShakeHearts(true);
      setTimeout(() => setShakeHearts(false), 500);

      // Deduct hearts
      for (let i = 0; i < wrongCount; i++) {
        await deductHeart();
      }
    }

    const finalScore = Math.round((correctCount / questions.length) * 100);
    setLkpdCalculatedScore(finalScore);
    setLkpdSubmitted(true);

    await logScore(chapterId, chapter.title, 'LKPD', finalScore, 100);
    await updateChapterProgress(chapterId, "lkpdScore", finalScore);
    await addXP(30);
    await loadProgress();
    
    if (wrongCount === 0) {
      playGongResonance();
    }
    
    alert(`E-LKPD kasubmit! Bener: ${correctCount}, Salah: ${wrongCount}, Biji: ${finalScore}`);
    setActiveStep(4);
  };

  const handleCompleteChapter = async () => {
    if (!progress.gameDone) {
      await addCrown();
      await addXP(30);
    }
    playGongResonance();
    window.dispatchEvent(new Event('start-loading'));
    router.push('/');
  };

  const handleRefillAndRetry = () => {
    if (typeof window !== 'undefined') {
      const profile = getStudentProfile();
      if (profile) {
        const updated = { ...profile, hearts: 5 };
        localStorage.setItem('sinau_jawa_student_profile', JSON.stringify(updated));
        window.dispatchEvent(new Event('profileUpdated'));
      }
    }
    loadProgress();
  };

  const overallProgressPercentage = 
    ((progress.materiDone ? 25 : 0) + 
    (progress.dhongengDone ? 25 : 0) + 
    (progress.lkpdScore !== null ? 25 : 0) + 
    (progress.gameDone ? 25 : 0));

  const stepsList = [
    { step: 1, label: 'Kitab Kawruh 📜', locked: false },
    { step: 2, label: 'Lelakon Wayang 🎭', locked: isDongengLocked },
    { step: 3, label: 'Pendadaran Basa ⚔️', locked: isLkpdLocked },
    { step: 4, label: 'Kridha Dolanan 🎡', locked: isGameLocked }
  ];

  return (
    <div className="app-layout">
      <Navigation profile={profile} onOpenLogin={() => setShowRegister(true)} onRefresh={loadProgress} />

      <div className="main-wrapper">
        
        {/* CENTER CONTENT */}
        <main className="content-area chapter-main-area" style={{ maxWidth: '800px' }}>
          
          {/* Top Progress bar and lives header (Duolingo Style) */}
          <div style={{ display: 'flex', width: '100%', alignItems: 'center', gap: '16px', marginBottom: '32px' }}>
            <span 
              onClick={() => { stopSpeech(); window.dispatchEvent(new Event('start-loading')); router.push('/'); }}
              style={{ fontSize: '20px', color: '#9CA3AF', cursor: 'pointer', fontWeight: '800', padding: '4px' }}
              title="Kembali ke Beranda"
            >
              ✕
            </span>
            <div style={{ flexGrow: 1, height: '16px', background: '#E5E7EB', borderRadius: '8px', overflow: 'hidden' }}>
              <div 
                style={{ 
                  height: '100%', 
                  width: `${overallProgressPercentage}%`, 
                  background: 'var(--color-green)', 
                  transition: 'width 0.3s ease-out' 
                }}
              ></div>
            </div>
            <div 
              className={shakeHearts ? 'shake-anim' : ''} 
              style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '16px', fontWeight: '800', color: 'var(--color-red)' }}
            >
              ❤️ <span>{profile ? profile.hearts : 5}</span>
            </div>
          </div>

          {/* Locked Hearts View */}
          {profile && profile.hearts === 0 ? (
            <div className="duo-card" style={{ textAlign: 'center', padding: '48px 24px', borderColor: 'var(--color-red)' }}>
              <span style={{ fontSize: '64px', display: 'block', marginBottom: '16px' }}>💔</span>
              <h2 style={{ color: 'var(--color-red-dark)', fontSize: '24px', fontWeight: '800', marginBottom: '8px' }}>Nyawamu Entek!</h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '15px', lineHeight: '1.5', marginBottom: '24px' }}>
                Waduh, nyawamu wis entek amarga wangsulanmu ana sing kurang trep. Ayo isi nyawamu maneh dadi kebak gratis!
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxWidth: '280px', margin: '0 auto' }}>
                <button className="btn-duo btn-duo-primary" onClick={handleRefillAndRetry}>
                  ❤️ Isi Nyawa Kebak (Gratis)
                </button>
                <button className="btn-duo btn-duo-secondary" onClick={() => { window.dispatchEvent(new Event('start-loading')); router.push('/'); }}>
                  Bali menyang Beranda
                </button>
              </div>
            </div>
          ) : (
            <div>
              {/* Step Navigation Wizard Bar */}
              <div style={{ display: 'flex', width: '100%', gap: '8px', marginBottom: '24px', overflowX: 'auto', paddingBottom: '8px' }}>
                {stepsList.map(item => (
                  <button
                    key={item.step}
                    disabled={item.locked}
                    onClick={() => { playSaronChime(); setActiveStep(item.step as 1 | 2 | 3 | 4); }}
                    className={`btn-duo ${activeStep === item.step ? 'btn-duo-primary' : 'btn-duo-secondary'}`}
                    style={{ 
                      flexGrow: 1, 
                      padding: '10px 14px', 
                      fontSize: '13px', 
                      opacity: item.locked ? 0.45 : 1, 
                      cursor: item.locked ? 'not-allowed' : 'pointer',
                      borderBottomWidth: '4px'
                    }}
                  >
                    {item.step}. {item.label} {item.locked && '🔒'}
                  </button>
                ))}
              </div>

              {/* STEP 1: MATERI */}
              {activeStep === 1 && (
                <div className="duo-card card-blue" style={{ padding: '32px' }}>
                  <h2 style={{ fontSize: '24px', color: '#1F2937', fontWeight: '800', marginBottom: '6px' }}>
                    {chapter.materi.title}
                  </h2>
                  <p style={{ color: 'var(--text-muted)', marginBottom: '24px', fontSize: '14px' }}>
                    Sinau materi ing ngisor iki dhisik sadurunge lanjut waca dongeng.
                  </p>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
                    {chapter.materi.sections.map((section, idx) => (
                      <div 
                        key={idx} 
                        style={{ 
                          border: '2px solid var(--border-light)', 
                          borderRadius: '12px', 
                          overflow: 'hidden', 
                          background: '#FFFFFF' 
                        }}
                      >
                        <div 
                          onClick={() => { playSaronChime(); setExpandedSection(expandedSection === idx ? null : idx); }}
                          style={{ 
                            padding: '16px', 
                            fontWeight: '700', 
                            display: 'flex', 
                            justifyContent: 'space-between', 
                            cursor: 'pointer',
                            background: expandedSection === idx ? '#F3F4F6' : '#FFFFFF',
                            userSelect: 'none'
                          }}
                        >
                          <span>{section.title}</span>
                          <span>{expandedSection === idx ? '▲' : '▼'}</span>
                        </div>
                        {expandedSection === idx && (
                          <div style={{ padding: '16px', fontSize: '15px', color: '#4B5563', borderTop: '2px solid var(--border-light)', whiteSpace: 'pre-line', lineHeight: '1.6' }}>
                            {section.content}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <button className="btn-duo btn-duo-blue" style={{ width: 'auto' }} onClick={handleCompleteMateri}>
                      Tandai Rampung (+10 XP) ➔
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 2: DHONGENG (STORY MODE WEBTOON WAYANG) */}
              {activeStep === 2 && (
                <div className="story-panel-scroll">
                  {/* Floating Stars Layer */}
                  {stars.map(star => (
                    <span 
                      key={star.id} 
                      className="star-particle" 
                      style={{ left: `${star.left}%`, top: `${star.top}%` }}
                    >
                      ⭐
                    </span>
                  ))}

                  {/* Panel 1 */}
                  <div className="story-card-panel">
                    <div className="wayang-art-container" style={{ background: 'linear-gradient(to bottom, #1E293B, #0F172A)' }}>
                      <svg viewBox="0 0 400 200" width="100%" height="100%">
                        <path d="M-20 200 Q20 80 40 200 Z" fill="#090d16" />
                        <path d="M30 200 Q70 60 110 200 Z" fill="#0c1322" />
                        <path d="M290 200 Q330 50 370 200 Z" fill="#090d16" />
                        <path d="M340 200 Q380 90 420 200 Z" fill="#070a10" />
                        <path d="M50 0 C80 40, 120 40, 160 0 C180 30, 240 30, 260 0 Z" fill="#05070a" opacity="0.8" />
                        <g transform="translate(180, 110) scale(0.4)">
                          <path d="M60 200 C60 140, 80 80, 100 80 C120 80, 140 140, 140 200 Z" fill="#D97706" />
                          <path d="M10 200 C10 160, 25 120, 40 120 C55 120, 70 160, 70 200 Z" fill="#FBBF24" />
                        </g>
                      </svg>
                    </div>
                    <div className="story-dialogue-box">
                      <span className="story-speaker-tag">Narasi</span>
                      <p style={{ fontSize: '15px', color: '#374151', lineHeight: '1.6' }}>
                        &quot;Di tepi hutan Surabaya kuno, Joko Berek kecil belum tahu nasibnya...&quot;
                      </p>
                    </div>
                  </div>

                  {/* Panel 2 */}
                  <div className="story-card-panel">
                    <div className="wayang-art-container" style={{ background: 'linear-gradient(to bottom, #7C2D12, #451A03)' }}>
                      <svg viewBox="0 0 400 200" width="100%" height="100%">
                        <circle cx="200" cy="100" r="80" fill="#EA580C" opacity="0.3" />
                        <path d="M150 200 C150 140, 170 100, 200 100 C230 100, 250 140, 250 200 Z" fill="#1e0a00" />
                        <path d="M200 100 C185 85, 170 85, 170 70 C170 50, 200 40, 200 20 Z" fill="#F59E0B" />
                        <circle cx="185" cy="100" r="3.5" fill="#FFF" />
                      </svg>
                    </div>
                    <div className="story-dialogue-box">
                      <span className="story-speaker-tag">Joko Berek</span>
                      <p style={{ fontSize: '15px', color: '#374151', lineHeight: '1.6', fontWeight: '700', fontStyle: 'italic' }}>
                        &quot;Ibu, sapa bapakku? Kenapa aku ora duwe bapak?&quot;
                      </p>
                    </div>
                  </div>

                  {/* Panel 3 */}
                  <div className="story-card-panel">
                    <div className="wayang-art-container" style={{ background: 'linear-gradient(to bottom, #1E1B4B, #311042)' }}>
                      <div className="wayang-sun-aura" style={{ left: '140px', top: '40px' }}></div>
                      <svg viewBox="0 0 400 200" width="100%" height="100%">
                        <g transform="translate(130, 40) scale(0.6)">
                          <path d="M100 20 C60 90, 50 160, 50 200 L150 200 C150 160, 140 90, 100 20 Z" fill="#D97706" opacity="0.2" />
                          <path d="M100 50 C110 30, 130 35, 130 50 C130 70, 90 90, 100 120 C80 140, 80 180, 100 220 Z" fill="#FFD700" />
                        </g>
                      </svg>
                    </div>
                    <div className="story-dialogue-box">
                      <span className="story-speaker-tag">Nyi Bungkus</span>
                      <p style={{ fontSize: '15px', color: '#374151', lineHeight: '1.6', fontWeight: '700', fontStyle: 'italic' }}>
                        &quot;Bapakmu iku Adipati Jayengrono, anakku...&quot;
                      </p>
                    </div>
                  </div>

                  {/* INTERRUPT MINI-GAME / GATED QUESTION */}
                  <div className="duo-card" style={{ padding: '24px', border: '3px solid var(--color-orange)', background: '#FFFDF9' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
                      <span style={{ fontSize: '28px' }}>⚔️</span>
                      <h3 style={{ fontSize: '18px', color: 'var(--color-orange-dark)' }}>Tantangan Tengah Cerita</h3>
                    </div>

                    {!storyAnswered ? (
                      <div>
                        <p style={{ fontSize: '14px', color: '#4B5563', marginBottom: '16px', fontWeight: '700' }}>
                          Sapa sejatine asmane ramane (bapake) Joko Berek adhedhasar naskah ing nduwur?
                        </p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
                          {[
                            "Adipati Jayengrono",
                            "Adipati Gatot",
                            "Cantrik Budi",
                            "Senopati Siti"
                          ].map(opt => {
                            const isSelected = selectedStoryOption === opt;
                            return (
                              <div
                                key={opt}
                                className="duo-card"
                                onClick={() => setSelectedStoryOption(opt)}
                                style={{
                                  padding: '12px 16px',
                                  cursor: 'pointer',
                                  margin: 0,
                                  background: isSelected ? '#FEF3C7' : undefined,
                                  borderColor: isSelected ? 'var(--color-orange)' : 'var(--border-light)',
                                  borderBottomWidth: '4px'
                                }}
                              >
                                <span style={{ fontWeight: '600' }}>{opt}</span>
                              </div>
                            );
                          })}
                        </div>
                        <button 
                          className="btn-duo btn-duo-orange"
                          style={{ width: '100%' }}
                          onClick={handleAnswerStoryQuestion}
                          disabled={!selectedStoryOption}
                        >
                          Kirim Wangsulan ✓
                        </button>
                      </div>
                    ) : (
                      <div style={{ padding: '12px', background: '#F0FDF4', border: '2px solid #BBF7D0', borderRadius: '12px', color: 'var(--color-green-dark)', fontWeight: '800', textAlign: 'center' }}>
                        🎉 Wangsulan bener! Bapakne Joko Berek yaiku Adipati Jayengrono. Cerita sabanjure wis kabukak! (+10 XP)
                      </div>
                    )}
                  </div>

                  {/* Panel 4 (Gated) */}
                  <div className={`story-card-panel ${!storyAnswered ? 'story-card-locked' : ''}`}>
                    <div className="wayang-art-container" style={{ background: 'linear-gradient(to bottom, #065F46, #064E3B)' }}>
                      <svg viewBox="0 0 400 200" width="100%" height="100%">
                        <circle cx="200" cy="100" r="70" fill="#34D399" opacity="0.25" />
                        <g transform="translate(170, 30) scale(0.7)">
                          <line x1="30" y1="0" x2="30" y2="240" stroke="#FBBF24" strokeWidth="4" />
                          <path d="M25 0 L30 -20 L35 0 Z" fill="#FBBF24" />
                          <path d="M60 70 C70 40, 90 40, 90 70 C90 100, 70 120, 80 180 L50 240 L35 240 Z" fill="#FCD34D" />
                        </g>
                      </svg>
                    </div>
                    <div className="story-dialogue-box">
                      <span className="story-speaker-tag">Narasi</span>
                      <p style={{ fontSize: '15px', color: '#374151', lineHeight: '1.6' }}>
                        &quot;Tahun berlalu, Joko Berek tumbuh menjadi pemuda gagah...&quot;
                      </p>
                    </div>
                  </div>

                  {/* Panel 5 (Gated) */}
                  <div className={`story-card-panel ${!storyAnswered ? 'story-card-locked' : ''}`}>
                    <div className="wayang-art-container" style={{ background: 'linear-gradient(to bottom, #991B1B, #7F1D1D)' }}>
                      <div className="wayang-sun-aura" style={{ left: '130px', top: '30px' }}></div>
                      <svg viewBox="0 0 400 200" width="100%" height="100%">
                        <path d="M120 200 L120 120 L180 80 L220 80 L280 120 L280 200 Z" fill="#3F0D0D" />
                        <g transform="translate(170, 20) scale(0.75)">
                          <path d="M80 80 C90 50, 110 50, 110 80 C110 110, 90 130, 100 200 L70 240 Z" fill="#FDE047" />
                          <path d="M40 70 L20 10 L45 20 Z" fill="#FDE047" />
                        </g>
                      </svg>
                    </div>
                    <div className="story-dialogue-box">
                      <span className="story-speaker-tag">Sawunggaling</span>
                      <p style={{ fontSize: '15px', color: '#374151', lineHeight: '1.6', fontWeight: '800', fontStyle: 'italic' }}>
                        &quot;Aku bakal mbuktekaken yen aku layak dadi putra Adipati!&quot;
                      </p>
                    </div>
                  </div>

                  {/* Complete story button */}
                  {storyAnswered && (
                    <button 
                      className="btn-duo btn-duo-orange"
                      style={{ width: '100%', padding: '14px', fontSize: '16px', marginTop: '16px' }}
                      onClick={handleFinishStoryMode}
                    >
                      Rampungake Cerita (+15 XP) ➔
                    </button>
                  )}
                </div>
              )}

              {/* STEP 3: E-LKPD */}
              {activeStep === 3 && (
                <div className="duo-card card-green" style={{ padding: '32px' }}>
                  <h2 style={{ fontSize: '24px', color: '#1F2937', fontWeight: '800', marginBottom: '6px' }}>{chapter.lkpd.title}</h2>
                  <p style={{ color: 'var(--text-muted)', marginBottom: '24px', fontSize: '14px' }}>
                    Pilih utawa isi wangsulan sing paling bener. Wangsulan salah kelong nyawa!
                  </p>

                  {chapter.lkpd.questions.map((q, idx) => (
                    <div key={q.id} style={{ marginBottom: '24px', paddingBottom: '20px', borderBottom: '2px solid var(--border-light)' }}>
                      <p style={{ fontSize: '16px', fontWeight: '700', marginBottom: '12px', color: '#1F2937' }}>
                        <strong>{idx + 1}.</strong> {q.question}
                      </p>

                      {q.type === 'multiple-choice' && q.options && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          {q.options.map(opt => {
                            const isSelected = answers[q.id] === opt;
                            return (
                              <div 
                                key={opt} 
                                className="duo-card"
                                onClick={() => handleMultipleChoiceSelect(q.id, opt)}
                                style={{ 
                                  padding: '14px 18px', 
                                  cursor: 'pointer', 
                                  margin: 0,
                                  background: isSelected ? '#F0FDF4' : undefined,
                                  borderColor: isSelected ? 'var(--color-green)' : 'var(--border-light)',
                                  borderBottomWidth: '4px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '12px'
                                }}
                              >
                                <input 
                                  type="radio" 
                                  name={q.id} 
                                  checked={isSelected}
                                  onChange={() => handleMultipleChoiceSelect(q.id, opt)}
                                  disabled={lkpdSubmitted}
                                  style={{ transform: 'scale(1.25)', accentColor: 'var(--color-green)' }}
                                />
                                <span style={{ fontWeight: '600', color: isSelected ? 'var(--color-green-dark)' : '#374151' }}>{opt}</span>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {q.type === 'text' && (
                        <input 
                          type="text" 
                          placeholder="Tulis wangsulanmu ing kene..."
                          value={answers[q.id] || ''}
                          onChange={(e) => handleTextChange(q.id, e.target.value)}
                          disabled={lkpdSubmitted}
                          style={{ 
                            width: '100%', 
                            padding: '14px', 
                            borderRadius: '12px', 
                            border: '2px solid var(--border-light)', 
                            outline: 'none', 
                            fontSize: '15px',
                            fontWeight: '600'
                          }}
                        />
                      )}

                      {q.type === 'matching' && q.matchingPairs && (
                        <div style={{ marginTop: '12px' }}>
                          <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '8px', fontWeight: '700' }}>
                            Hubungake tembung ing ngisor iki:
                          </p>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                              {q.matchingPairs.map(pair => {
                                const isSelected = matchingSelections.left === pair.left;
                                const matchedRight = currentMatches[pair.left];
                                return (
                                  <div 
                                    key={pair.left} 
                                    onClick={() => handleMatchingClickLeft(pair.left)}
                                    style={{ 
                                      padding: '12px', 
                                      borderRadius: '12px', 
                                      border: '2px solid',
                                      borderColor: isSelected ? 'var(--color-purple)' : matchedRight ? '#E5E7EB' : '#CBD5E1',
                                      background: isSelected ? '#FAF5FF' : matchedRight ? '#F3F4F6' : '#FFFFFF',
                                      color: matchedRight ? '#9CA3AF' : '#1F2937',
                                      fontWeight: '700',
                                      cursor: 'pointer',
                                      textAlign: 'center'
                                    }}
                                  >
                                    {pair.left} {matchedRight && `➔ ${matchedRight}`}
                                  </div>
                                );
                              })}
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                              {q.matchingPairs.map(pair => {
                                const isMatched = Object.values(currentMatches).includes(pair.right);
                                return (
                                  <button 
                                    key={pair.right} 
                                    onClick={() => handleMatchingClickRight(pair.right)}
                                    disabled={isMatched || lkpdSubmitted}
                                    className="btn-duo btn-duo-secondary"
                                    style={{ 
                                      padding: '12px', 
                                      fontSize: '14px', 
                                      borderBottomWidth: '3px',
                                      opacity: isMatched ? 0.5 : 1,
                                      background: isMatched ? '#F3F4F6' : '#FFFFFF'
                                    }}
                                  >
                                    {pair.right}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '16px', marginTop: '20px' }}>
                    {lkpdSubmitted ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <span style={{ color: 'var(--color-green-dark)', fontWeight: '800', fontSize: '18px' }}>
                          Biji LKPD: {lkpdCalculatedScore}/100
                        </span>
                        <button className="btn-duo btn-duo-primary" style={{ width: 'auto' }} onClick={() => setActiveStep(4)}>
                          Mulai Game Aksara ➔
                        </button>
                      </div>
                    ) : (
                      <button className="btn-duo btn-duo-primary" style={{ width: 'auto' }} onClick={submitLKPD}>
                        Kirim Wangsulan ✓
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* STEP 4: KUIS/GAME */}
              {activeStep === 4 && (
                <div className="duo-card card-purple" style={{ padding: '32px' }}>
                  <AksaraGame 
                    chapterId={chapterId} 
                    chapterTitle={chapter.title} 
                    config={chapter.game.config} 
                    onComplete={handleCompleteChapter} 
                  />
                </div>
              )}
            </div>
          )}

        </main>

        {/* RIGHT SIDEBAR */}
        <aside className="right-sidebar">
          
          <div className="duo-card" style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '20px', borderBottomWidth: '4px' }}>
            <h4 style={{ fontSize: '12px', fontWeight: '800', textTransform: 'uppercase', color: 'var(--text-muted)', textAlign: 'center' }}>
              {chapter.title}
            </h4>
            <MascotVisual 
              mood={mascotMood} 
              speechBubbleText={currentMascotText} 
              width="160px" 
              height="160px" 
            />
          </div>

          <div className="duo-card" style={{ padding: '16px' }}>
            <h4 style={{ fontSize: '13px', fontWeight: '800', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '12px' }}>Tips Belajar</h4>
            <p style={{ fontSize: '13px', lineHeight: '1.5', color: '#4B5563' }}>
              Rungokake swara dongeng saka karakter wayang ing kaca 2. Iki bakal mbantu mangerteni tata basa lan cara ngucapake tembung Javanese kanthi leres!
            </p>
          </div>

        </aside>

      </div>

      <RegisterModal 
        isOpen={showRegister} 
        onClose={() => setShowRegister(false)} 
        onSuccess={loadProgress} 
      />
    </div>
  );
}

export default function ChapterDetail(props: PageProps) {
  return (
    <Suspense fallback={
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', fontFamily: 'var(--font-main)', fontWeight: '800' }}>
        Loading Bab Pasinaon...
      </div>
    }>
      <ChapterDetailInner {...props} />
    </Suspense>
  );
}
