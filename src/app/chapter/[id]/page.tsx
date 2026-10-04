'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getChaptersList, getChapterProgress, updateChapterProgress, logScore, getStudentProfile, StudentProfile, deductHeart, addXP, addCrown, refillHearts, getChapterInitData, submitLkpdBatch, completeStepBatch } from '@/lib/db';
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
  const [activeStep, setActiveStep] = useState<1 | 2 | 3 | 4 | 5>(1);
  
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
  const [lkpdUraianSubmitted, setLkpdUraianSubmitted] = useState(false);

  const loadProgress = useCallback(async () => {
    const { profile: currentProfile, progress: currentProg } = await getChapterInitData(chapterId);
    setProfile(currentProfile);
    if (!currentProfile) {
      setShowRegister(true);
    }

    if (currentProg) {
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
    }
  }, [chapterId]);

  useEffect(() => {
    const loadInit = async () => {
      const { chapter: found, profile: currentProfile, progress: currentProg } = await getChapterInitData(chapterId);
      if (!found) {
        router.push('/');
        return;
      }
      setChapter(found);
      setProfile(currentProfile);
      if (!currentProfile) {
        setShowRegister(true);
      }
      if (currentProg) {
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
      }
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
  }, [chapterId, router, searchParams]);

  // Listen to heart and progress updates
  useEffect(() => {
    const handleProfileChange = async () => {
      setProfile(await getStudentProfile());
    };
    const handleProgressChange = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail) {
        setProfile(customEvent.detail.profile);
        setProgress(customEvent.detail.progress);
      }
    };
    window.addEventListener('profileUpdated', handleProfileChange);
    window.addEventListener('chapterProgressUpdated', handleProgressChange);
    return () => {
      stopSpeech();
      window.removeEventListener('profileUpdated', handleProfileChange);
      window.removeEventListener('chapterProgressUpdated', handleProgressChange);
    };
  }, []);

  const hasGatedQuestion = Boolean(
    chapter?.dhongeng?.question &&
    chapter.dhongeng.question.trim().length > 0 &&
    chapter.dhongeng.options &&
    chapter.dhongeng.options.length > 0 &&
    chapter.dhongeng.correctAnswer
  );

  const getStoryQuestionConfig = useCallback((): { question: string; options: string[]; correctAnswer: string } => {
    return {
      question: chapter?.dhongeng?.question || '',
      options: chapter?.dhongeng?.options || [],
      correctAnswer: chapter?.dhongeng?.correctAnswer || ''
    };
  }, [chapter]);

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
    const result = await completeStepBatch(chapterId, "materiDone", 10);
    setProfile(result.profile);
    setProgress(result.progress);
    playSaronChime();
    setActiveStep(2);
  };



  const handleAnswerStoryQuestion = async () => {
    const qConfig = getStoryQuestionConfig();
    if (selectedStoryOption === qConfig.correctAnswer) {
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
      const result = await completeStepBatch(chapterId, "dhongengDone", 15);
      setProfile(result.profile);
      setProgress(result.progress);
    }
    playGongResonance();
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
        const result = await completeStepBatch(chapterId, "dhongengDone", 15);
        setProfile(result.profile);
        setProgress(result.progress);
      }
      playGongResonance();
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

  const config = chapter?.mapConfig || { materi: true, dhongeng: true, lkpdPilgan: true, lkpdUraian: false, game: true };

  const submitLKPDPilgan = async () => {
    if (lkpdSubmitted) return;

    let correctCount = 0;
    let wrongCount = 0;
    const questions = chapter.lkpd.questions.filter(q => q.type === 'multiple-choice');

    if (questions.length === 0) {
      setLkpdCalculatedScore(100);
      setLkpdSubmitted(true);
      setActiveStep(config.lkpdUraian ? 5 : 4);
      return;
    }

    questions.forEach((q, idx) => {
      const qId = q.id || `mc_${idx}`;
      if (answers[qId] === q.correctAnswer) {
        correctCount++;
      } else {
        wrongCount++;
      }
    });

    if (wrongCount > 0) {
      playErrorChime();
      setShakeHearts(true);
      setTimeout(() => setShakeHearts(false), 500);
    } else {
      playGongResonance();
    }

    const finalScore = Math.round((correctCount / questions.length) * 100);
    setLkpdCalculatedScore(finalScore);
    setLkpdSubmitted(true);

    try {
      const result = await submitLkpdBatch(chapterId, chapter.title, wrongCount, finalScore);
      setProfile(result.profile);
      setProgress(result.progress);
    } catch (err) {
      console.error("Failed to submit LKPD batch:", err);
      await loadProgress();
    }
    
    alert(`✅ LKPD Pilihan Ganda rampung! Biji Akademik: ${finalScore}/100 poin — dicatat dening Guru.`);
    
    // Move to next available step
    if (config.lkpdUraian) {
      setActiveStep(5);
    } else if (config.game) {
      setActiveStep(4);
    } else {
      handleCompleteChapter();
    }
  };

  const submitLKPDUraian = async () => {
    if (lkpdUraianSubmitted) return;
    
    // Gather answers
    const uraianAnswers = chapter.lkpd.questions
      .filter(q => q.type === 'text')
      .map(q => ({
        question: q.question,
        answer: answers[q.id] || ''
      }));

    // For now, we simulate saving the Uraian since DB schema isn't pushed yet
    console.log("Simpan Jawaban Uraian:", uraianAnswers);
    localStorage.setItem(`uraian_${profile?.uniqueCode}_${chapterId}`, JSON.stringify(uraianAnswers));
    
    playGongResonance();
    setLkpdUraianSubmitted(true);
    alert('Wangsulan Uraian wis kasubmit lan nunggu dikoreksi Guru!');

    if (config.game) {
      setActiveStep(4);
    } else {
      handleCompleteChapter();
    }
  };

  const handleCompleteChapter = async () => {
    playGongResonance();
    window.dispatchEvent(new Event('start-loading'));
    router.push('/');
  };

  const handleRefillAndRetry = async () => {
    await refillHearts();
    window.dispatchEvent(new Event('profileUpdated'));
    await loadProgress();
  };

  const overallProgressPercentage = 
    ((progress.materiDone ? 25 : 0) + 
    (progress.dhongengDone ? 25 : 0) + 
    (progress.lkpdScore !== null ? 25 : 0) + 
    (progress.gameDone ? 25 : 0));

  const stepsList = [];
  if (config.materi) stepsList.push({ step: 1, label: 'Kitab Kawruh 📜', locked: false });
  if (config.dhongeng) stepsList.push({ step: 2, label: 'Lelakon Wayang 🎭', locked: isDongengLocked });
  if (config.lkpdPilgan) stepsList.push({ step: 3, label: 'Pendadaran Pilgan ⚔️', locked: isLkpdLocked });
  if (config.lkpdUraian) stepsList.push({ step: 5, label: 'Pendadaran Uraian ✍️', locked: isLkpdLocked });
  if (config.game) stepsList.push({ step: 4, label: 'Kridha Dolanan 🎡', locked: isGameLocked });

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

                  {chapter.glosarium && chapter.glosarium.length > 0 && (
                    <div style={{ background: '#FFFBEB', border: '1.5px solid #FDE68A', borderRadius: '16px', padding: '20px', marginBottom: '24px' }}>
                      <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#B45309', marginBottom: '12px' }}>
                        📖 Glosarium Kamus Bahasa
                      </h3>
                      <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                          <thead>
                            <tr style={{ background: '#D97706', color: '#FFFFFF', textAlign: 'left' }}>
                              <th style={{ padding: '12px 14px', borderRadius: '8px 0 0 0' }}>Tembung</th>
                              <th style={{ padding: '12px 14px' }}>Ngoko</th>
                              <th style={{ padding: '12px 14px' }}>Krama</th>
                              <th style={{ padding: '12px 14px', borderRadius: '0 8px 0 0' }}>Tegese Indonesia</th>
                            </tr>
                          </thead>
                          <tbody>
                            {chapter.glosarium.map((entry, i) => (
                              <tr key={i} style={{ background: i % 2 === 0 ? '#FFF9EC' : '#FFFFFF', borderBottom: '1px solid #FDE68A' }}>
                                <td style={{ padding: '10px 14px', fontWeight: '700', color: '#1F2937' }}>{entry.tembung}</td>
                                <td style={{ padding: '10px 14px', color: '#4B5563' }}>{entry.ngoko}</td>
                                <td style={{ padding: '10px 14px', color: '#059669', fontWeight: '800' }}>{entry.krama}</td>
                                <td style={{ padding: '10px 14px', color: '#4B5563' }}>{entry.tegese}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

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

                  {/* Dynamic pages from chapter data */}
                  {chapter.dhongeng.pages.map((page, pageIdx) => {
                    // Pick a rotating background color palette
                    const bgPalettes = [
                      'linear-gradient(to bottom, #1E293B, #0F172A)',
                      'linear-gradient(to bottom, #7C2D12, #451A03)',
                      'linear-gradient(to bottom, #1E1B4B, #311042)',
                      'linear-gradient(to bottom, #065F46, #064E3B)',
                      'linear-gradient(to bottom, #991B1B, #7F1D1D)',
                    ];
                    const bg = bgPalettes[pageIdx % bgPalettes.length];

                    // Parse speaker from text. If text starts with "speaker: text" or just plain narration.
                    // We look for lines that indicate speaker (e.g. "Dialog 2 — ..." or speaker-tagged lines)
                    const textContent = page.text;
                    
                    // Extract speaker name: check if text has pattern "CharacterName\n" at start or "Dialog X — CharacterName"
                    let speakerName = 'Narasi';
                    let storyText = textContent;
                    
                    // Check for "📜 Dialog X — SpeakerName" or similar prefix
                    const dialogMatch = textContent.match(/^[📜🎭💬]?\s*Dialog\s+\d+\s*[—–-]+\s*(.+)\n/i);
                    if (dialogMatch) {
                      speakerName = dialogMatch[1].trim();
                      storyText = textContent.replace(dialogMatch[0], '').trim();
                    }

                    return (
                      <div key={pageIdx} className="story-card-panel">
                        <div className="wayang-art-container" style={{ background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '140px' }}>
                          <div style={{ fontSize: '64px', opacity: 0.4 }}>📖</div>
                        </div>
                        <div className="story-dialogue-box">
                          <span className="story-speaker-tag">{speakerName}</span>
                          <p style={{ fontSize: '15px', color: '#374151', lineHeight: '1.7', whiteSpace: 'pre-line' }}>
                            {storyText}
                          </p>

                          {/* TABEL ANALISIS DIALOG (OPSIONAL) */}
                          {page.analysisTable && page.analysisTable.length > 0 && (
                            <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1.5px dashed #CBD5E1' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                                <span style={{ fontSize: '18px' }}>🔍</span>
                                <h4 style={{ fontSize: '14px', fontWeight: '800', color: '#1E40AF', textTransform: 'uppercase', letterSpacing: '0.04em', margin: 0 }}>
                                  Analisis Unggah-Ungguh Basa
                                </h4>
                              </div>
                              <div style={{ overflowX: 'auto', borderRadius: '12px', border: '1.5px solid #DBEAFE', background: '#FFFFFF', boxShadow: '0 2px 8px rgba(30, 64, 175, 0.05)' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px', textAlign: 'left' }}>
                                  <thead>
                                    <tr style={{ background: 'linear-gradient(135deg, #1E40AF, #2563EB)', color: '#FFFFFF' }}>
                                      <th style={{ padding: '10px 14px', fontWeight: '800', width: '38%', borderRight: '1px solid rgba(255,255,255,0.2)' }}>
                                        Aspek / Pitakon
                                      </th>
                                      <th style={{ padding: '10px 14px', fontWeight: '800' }}>
                                        Penjelasan
                                      </th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {page.analysisTable.map((row, rowIdx) => (
                                      <tr 
                                        key={rowIdx} 
                                        style={{ 
                                          background: rowIdx % 2 === 0 ? '#F8FAFC' : '#FFFFFF',
                                          borderBottom: rowIdx === page.analysisTable!.length - 1 ? 'none' : '1px solid #E2E8F0'
                                        }}
                                      >
                                        <td style={{ padding: '12px 14px', fontWeight: '800', color: '#1E293B', verticalAlign: 'top', borderRight: '1px solid #E2E8F0', lineHeight: '1.5' }}>
                                          {row.aspect}
                                        </td>
                                        <td style={{ padding: '12px 14px', color: '#334155', verticalAlign: 'top', lineHeight: '1.6' }}>
                                          {row.explanation}
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}

                  {/* INTERRUPT MINI-GAME / GATED QUESTION (OPSIONAL) */}
                  {hasGatedQuestion && (
                    <div className="duo-card" style={{ padding: '24px', border: '3px solid var(--color-orange)', background: '#FFFDF9' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
                        <span style={{ fontSize: '28px' }}>⚔️</span>
                        <h3 style={{ fontSize: '18px', color: 'var(--color-orange-dark)' }}>Tantangan Tengah Cerita</h3>
                      </div>

                      {!storyAnswered ? (
                        <div>
                          <p style={{ fontSize: '14px', color: '#4B5563', marginBottom: '16px', fontWeight: '700' }}>
                            {getStoryQuestionConfig().question}
                          </p>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
                            {getStoryQuestionConfig().options.map(opt => {
                              const isSelected = selectedStoryOption === opt;
                              return (
                                <button
                                  key={opt}
                                  className="duo-card"
                                  type="button"
                                  onClick={() => setSelectedStoryOption(opt)}
                                  style={{
                                    padding: '12px 16px',
                                    cursor: 'pointer',
                                    margin: 0,
                                    background: isSelected ? '#FEF3C7' : undefined,
                                    borderColor: isSelected ? 'var(--color-orange)' : 'var(--border-light)',
                                    borderBottomWidth: '4px',
                                    width: '100%',
                                    textAlign: 'left',
                                    display: 'block',
                                    color: 'inherit',
                                    fontFamily: 'inherit',
                                    fontSize: 'inherit'
                                  }}
                                >
                                  <span style={{ fontWeight: '600' }}>{opt}</span>
                                </button>
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
                          🎉 Wangsulan bener! Cerita sabanjure wis kabukak! (+10 XP)
                        </div>
                      )}
                    </div>
                  )}

                  {/* Complete story button */}
                  {(!hasGatedQuestion || storyAnswered) && (
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




              {/* STEP 3: E-LKPD PILGAN */}
              {activeStep === 3 && (
                <div className="duo-card card-green" style={{ padding: '32px' }}>
                  <h2 style={{ fontSize: '24px', color: '#1F2937', fontWeight: '800', marginBottom: '6px' }}>{chapter.lkpd.title} (Pilihan Ganda)</h2>
                  <p style={{ color: 'var(--text-muted)', marginBottom: '24px', fontSize: '14px' }}>
                    Pilih wangsulan sing paling bener. Wangsulan salah kelong nyawa!
                  </p>

                  {chapter.lkpd.questions.filter(q => q.type === 'multiple-choice').map((q, idx) => {
                    // When questions come from DB JSON, options may need normalization
                    const qId = q.id || `mc_${idx}`;
                    const qOptions: string[] = Array.isArray(q.options)
                      ? q.options
                      : (q.options ? Object.values(q.options as any) : []);
                    return (
                      <div key={qId} style={{ marginBottom: '24px', paddingBottom: '20px', borderBottom: '2px solid var(--border-light)' }}>
                        <p style={{ fontSize: '16px', fontWeight: '700', marginBottom: '12px', color: '#1F2937' }}>
                          <strong>{idx + 1}.</strong> {q.question}
                        </p>

                        {qOptions.length > 0 && (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {qOptions.map((opt, optIdx) => {
                              const isSelected = answers[qId] === opt;
                              return (
                                <button 
                                  key={`${qId}_${optIdx}`}
                                  className="duo-card"
                                  type="button"
                                  onClick={() => {
                                    if (lkpdSubmitted) return;
                                    setAnswers(prev => ({ ...prev, [qId]: opt }));
                                  }}
                                  style={{ 
                                    padding: '14px 18px', 
                                    cursor: lkpdSubmitted ? 'not-allowed' : 'pointer', 
                                    margin: 0,
                                    background: isSelected ? '#F0FDF4' : undefined,
                                    borderColor: isSelected ? 'var(--color-green)' : 'var(--border-light)',
                                    borderBottomWidth: '4px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '12px',
                                    width: '100%',
                                    textAlign: 'left',
                                    color: 'inherit',
                                    fontFamily: 'inherit',
                                    fontSize: 'inherit'
                                  }}
                                >
                                  <input 
                                    type="radio" 
                                    name={qId} 
                                    checked={isSelected}
                                    readOnly
                                    disabled={lkpdSubmitted}
                                    style={{ transform: 'scale(1.25)', accentColor: 'var(--color-green)' }}
                                  />
                                  <span style={{ fontWeight: '600', color: isSelected ? 'var(--color-green-dark)' : '#374151' }}>{opt}</span>
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}

                  <div style={{ marginTop: '32px' }}>
                    <button 
                      className="btn-duo btn-duo-green" 
                      style={{ width: '100%', padding: '16px', fontSize: '18px' }}
                      onClick={submitLKPDPilgan}
                      disabled={lkpdSubmitted}
                    >
                      {lkpdSubmitted ? `🏅 Bijiku: ${lkpdCalculatedScore} poin — Lanjut ➔` : 'Kumpulake Wangsulan Pilgan'}
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 5: E-LKPD URAIAN */}
              {activeStep === 5 && (
                <div className="duo-card" style={{ padding: '32px', borderColor: '#F59E0B' }}>
                  <h2 style={{ fontSize: '24px', color: '#1F2937', fontWeight: '800', marginBottom: '6px' }}>{chapter.lkpd.title} (Uraian)</h2>
                  <p style={{ color: 'var(--text-muted)', marginBottom: '24px', fontSize: '14px' }}>
                    Isi wangsulanmu nganggo tembung-tembung kang trep. Wangsulan iki bakal dikoreksi karo Gurumu.
                  </p>

                  {chapter.lkpd.questions.filter(q => q.type === 'text').map((q, idx) => (
                    <div key={q.id} style={{ marginBottom: '24px', paddingBottom: '20px', borderBottom: '2px solid var(--border-light)' }}>
                      <p style={{ fontSize: '16px', fontWeight: '700', marginBottom: '12px', color: '#1F2937' }}>
                        <strong>{idx + 1}.</strong> {q.question}
                      </p>
                      <textarea 
                        placeholder="Tulis wangsulanmu ing kene..."
                        value={answers[q.id] || ''}
                        onChange={(e) => handleTextChange(q.id, e.target.value)}
                        disabled={lkpdUraianSubmitted}
                        style={{ 
                          width: '100%', 
                          padding: '14px', 
                          borderRadius: '12px', 
                          border: '2px solid var(--border-light)', 
                          outline: 'none', 
                          fontSize: '15px',
                          fontWeight: '600',
                          minHeight: '100px',
                          resize: 'vertical',
                          fontFamily: 'inherit'
                        }}
                      />
                    </div>
                  ))}

                  <div style={{ marginTop: '32px' }}>
                    <button 
                      className="btn-duo" 
                      style={{ 
                        width: '100%', 
                        padding: '16px', 
                        fontSize: '18px',
                        background: lkpdUraianSubmitted ? '#F3F4F6' : '#F59E0B',
                        color: lkpdUraianSubmitted ? '#9CA3AF' : '#FFF',
                        borderColor: lkpdUraianSubmitted ? '#E5E7EB' : '#D97706',
                        borderBottomWidth: '4px'
                      }}
                      onClick={submitLKPDUraian}
                      disabled={lkpdUraianSubmitted}
                    >
                      {lkpdUraianSubmitted ? 'Wis Dikumpulake! Lanjut ➔' : 'Kumpulake Wangsulan Uraian'}
                    </button>
                  </div>
                </div>
              )}
              {/* STEP 4: KUIS/GAME */}
              {activeStep === 4 && (
                <div className="duo-card card-purple" style={{ padding: '32px' }}>
                  <AksaraGame 
                    chapterId={chapterId} 
                    chapterTitle={chapter.title} 
                    gameType={chapter.game.type} 
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

          {/* ── REKAP POIN BAB ── */}
          <div className="duo-card" style={{ padding: '16px', borderColor: '#D97706', borderBottomWidth: '4px' }}>
            <h4 style={{ fontSize: '13px', fontWeight: '900', textTransform: 'uppercase', color: '#B45309', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              🏆 Rekap Poin Bab
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {/* Materi */}
              {config.materi && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 10px', borderRadius: '10px', background: progress.materiDone ? '#F0FDF4' : '#F9FAFB', border: `1.5px solid ${progress.materiDone ? '#BBF7D0' : '#E5E7EB'}` }}>
                  <span style={{ fontSize: '12px', fontWeight: '700', color: progress.materiDone ? '#065F46' : '#6B7280' }}>
                    {progress.materiDone ? '✓' : '○'} Kitab Kawruh
                  </span>
                  <span style={{ fontSize: '13px', fontWeight: '900', color: progress.materiDone ? '#059669' : '#9CA3AF' }}>
                    {progress.materiDone ? '+10' : '0'} <span style={{ fontSize: '10px', fontWeight: '700' }}>XP</span>
                  </span>
                </div>
              )}
              {/* Dongeng */}
              {config.dhongeng && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 10px', borderRadius: '10px', background: progress.dhongengDone ? '#F0FDF4' : '#F9FAFB', border: `1.5px solid ${progress.dhongengDone ? '#BBF7D0' : '#E5E7EB'}` }}>
                  <span style={{ fontSize: '12px', fontWeight: '700', color: progress.dhongengDone ? '#065F46' : '#6B7280' }}>
                    {progress.dhongengDone ? '✓' : '○'} Lelakon Wayang
                  </span>
                  <span style={{ fontSize: '13px', fontWeight: '900', color: progress.dhongengDone ? '#059669' : '#9CA3AF' }}>
                    {progress.dhongengDone ? '+15' : '0'} <span style={{ fontSize: '10px', fontWeight: '700' }}>XP</span>
                  </span>
                </div>
              )}
              {/* LKPD Pilgan */}
              {config.lkpdPilgan && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 10px', borderRadius: '10px', background: progress.lkpdScore !== null ? '#FFFBEB' : '#F9FAFB', border: `1.5px solid ${progress.lkpdScore !== null ? '#FDE68A' : '#E5E7EB'}` }}>
                  <span style={{ fontSize: '12px', fontWeight: '700', color: progress.lkpdScore !== null ? '#92400E' : '#6B7280' }}>
                    {progress.lkpdScore !== null ? '✓' : '○'} LKPD Pilgan
                  </span>
                  <span style={{ fontSize: '13px', fontWeight: '900', color: progress.lkpdScore !== null ? '#D97706' : '#9CA3AF' }}>
                    {progress.lkpdScore !== null ? progress.lkpdScore : '0'}<span style={{ fontSize: '10px', fontWeight: '700' }}>/100 poin</span>
                  </span>
                </div>
              )}
              {/* Game */}
              {config.game && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 10px', borderRadius: '10px', background: progress.gameDone ? '#F5F3FF' : '#F9FAFB', border: `1.5px solid ${progress.gameDone ? '#C4B5FD' : '#E5E7EB'}` }}>
                  <span style={{ fontSize: '12px', fontWeight: '700', color: progress.gameDone ? '#5B21B6' : '#6B7280' }}>
                    {progress.gameDone ? '✓' : '○'} Kridha Dolanan
                  </span>
                  <span style={{ fontSize: '13px', fontWeight: '900', color: progress.gameDone ? '#7C3AED' : '#9CA3AF' }}>
                    {progress.gameDone ? '+30' : '0'} <span style={{ fontSize: '10px', fontWeight: '700' }}>XP</span>
                  </span>
                </div>
              )}
            </div>

            {/* Total Poin */}
            <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '2px solid #FDE68A', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '13px', fontWeight: '900', color: '#92400E' }}>Total Poin Bab</span>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '20px', fontWeight: '900', color: '#B45309', lineHeight: '1' }}>
                  {(progress.lkpdScore !== null ? progress.lkpdScore : 0) +
                   (progress.gameDone ? 100 : 0) +
                   (progress.materiDone ? 10 : 0) +
                   (progress.dhongengDone ? 15 : 0)}
                </div>
                <div style={{ fontSize: '10px', fontWeight: '700', color: '#D97706' }}>POIN</div>
              </div>
            </div>
            <div style={{ marginTop: '8px', fontSize: '11px', color: '#9CA3AF', textAlign: 'center' }}>
              Nilai LKPD + XP dicatat oleh Guru
            </div>
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
