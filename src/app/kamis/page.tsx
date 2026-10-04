'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { isThursdayMode, getStudentProfile, StudentProfile, addXP, logScore, getCustomKamis } from '@/lib/db';
import { kamisMateri as defaultKamisMateri } from '@/lib/chaptersData';
import Navigation from '@/components/Navigation';
import RegisterModal from '@/components/RegisterModal';
import MascotVisual from '@/components/MascotVisual';
import { playSaronChime, playGongResonance, playErrorChime } from '@/lib/audio';

// ── QUIZ DATA DEFAULT ──
const defaultKamisQuiz = [
  {
    id: 'kq1',
    question: 'Endi ukara sing bener kanggo nyuwun izin marang Ibu Guru?',
    options: [
      'Bu, aku arep menyang jedhing.',
      'Nyuwun sewu Ibu Guru, kepareng kula badhe dhateng wingking sekedhap.',
      'Hei Bu, aku pergi ya.',
      'Pak, izin dong ke kamar mandi.'
    ],
    correct: 'Nyuwun sewu Ibu Guru, kepareng kula badhe dhateng wingking sekedhap.',
  },
  {
    id: 'kq2',
    question: 'Basa apa sing digunakake murid marang gurune?',
    options: ['Ngoko', 'Walikan', 'Krama Alus', 'Bahasa Indonesia'],
    correct: 'Krama Alus',
  },
  {
    id: 'kq3',
    question: 'Endi tembung Krama Alus kanggo tembung "mangan" (makan)?',
    options: ['Mangan', 'Nedha / Dhahar', 'Maem', 'Makan'],
    correct: 'Nedha / Dhahar',
  },
  {
    id: 'kq4',
    question: 'Kepiye sikap sing bener yen matur karo Bapak/Ibu Guru?',
    options: [
      'Tangane nggedhegake (melambai)',
      'Sirah noleh menyang kanca',
      'Madhep, tangan ngapurancang, swara lirih nanging cetha',
      'Mlayu karo ngomong'
    ],
    correct: 'Madhep, tangan ngapurancang, swara lirih nanging cetha',
  },
];

export default function KamisPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [showRegister, setShowRegister] = useState(false);
  const [isThursday, setIsThursday] = useState(false);
  const [activeDialogue, setActiveDialogue] = useState(0);

  // Kamis Custom Data
  const [kamisMateri, setKamisMateri] = useState(defaultKamisMateri);
  const [kamisQuiz, setKamisQuiz] = useState(defaultKamisQuiz);

  // Step: 'materi' | 'gladhen' | 'kuis'
  const [activeStep, setActiveStep] = useState<'materi' | 'gladhen' | 'kuis'>('materi');

  // Quiz states
  const [quizAnswers, setQuizAnswers] = useState<{ [id: string]: string }>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [quizScore, setQuizScore] = useState<number | null>(null);
  const [materiDone, setMateriDone] = useState(false);
  const [gladhenDone, setGladhenDone] = useState(false);

  const refreshState = useCallback(async () => {
    const currentProfile = await getStudentProfile();
    setProfile(currentProfile);
    setIsThursday(isThursdayMode());
    
    // Load custom kamis config
    const customConfig = await getCustomKamis();
    if (customConfig) {
      if (customConfig.materi) setKamisMateri(customConfig.materi);
      if (customConfig.quiz && customConfig.quiz.length > 0) setKamisQuiz(customConfig.quiz);
    }

    window.dispatchEvent(new Event('stop-loading'));
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

  const handleCompleteMateri = () => {
    playSaronChime();
    setMateriDone(true);
    setActiveStep('gladhen');
  };

  const handleCompleteGladhen = () => {
    playGongResonance();
    setGladhenDone(true);
    setActiveStep('kuis');
  };

  const handleSubmitKuis = async () => {
    if (quizSubmitted) return;
    let correct = 0;
    let wrong = 0;
    kamisQuiz.forEach(q => {
      if (quizAnswers[q.id] === q.correct) correct++;
      else wrong++;
    });
    const score = Math.round((correct / kamisQuiz.length) * 100);
    setQuizScore(score);
    setQuizSubmitted(true);

    if (wrong === 0) {
      playGongResonance();
    } else {
      playErrorChime();
    }

    // Award XP
    try {
      await addXP(Math.round(score / 5)); // Up to +20 XP from Kamis quiz
      await logScore(0, 'Kamis: Unggah-Ungguh Basa', 'LKPD', score, 100);
      const updated = await getStudentProfile();
      setProfile(updated);
      window.dispatchEvent(new Event('profileUpdated'));
    } catch (e) {
      console.error('Failed to log kamis score:', e);
    }

    alert(`✅ Kuis Kamis rampung! Bijiku: ${score}/100 poin. Matur nuwun wis sinau Unggah-Ungguh Basa!`);
  };

  const totalPoin = (materiDone ? 5 : 0) + (gladhenDone ? 10 : 0) + (quizScore !== null ? quizScore : 0);

  const stepConfig = [
    { key: 'materi', label: '📚 Materi', done: materiDone },
    { key: 'gladhen', label: '💬 Gladhen', done: gladhenDone },
    { key: 'kuis', label: '⚔️ Kuis Kamis', done: quizSubmitted },
  ];

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
                Nuwun sewu, wulangan khusus <strong>Unggah-Ungguh Basa</strong> iki mung mbukak ing dina Kamis kagem njaga tradisi lan budi pekerti warga sekolah.
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

              {/* Step Navigation */}
              <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
                {stepConfig.map(s => (
                  <button
                    key={s.key}
                    className={`btn-duo ${activeStep === s.key ? 'btn-duo-primary' : s.done ? 'btn-duo-green' : 'btn-duo-secondary'}`}
                    onClick={() => {
                      if (s.key === 'gladhen' && !materiDone) return;
                      if (s.key === 'kuis' && !gladhenDone) return;
                      setActiveStep(s.key as any);
                      playSaronChime();
                    }}
                    style={{ flexGrow: 1, fontSize: '13px', padding: '10px 14px', borderBottomWidth: '4px', opacity: (s.key === 'gladhen' && !materiDone) || (s.key === 'kuis' && !gladhenDone) ? 0.45 : 1 }}
                  >
                    {s.done ? '✓ ' : ''}{s.label}
                  </button>
                ))}
              </div>

              {/* ── STEP 1: MATERI ── */}
              {activeStep === 'materi' && (
                <div className="duo-card" style={{ padding: '24px' }}>
                  <h2 style={{ fontSize: '20px', fontWeight: '850', color: '#1F2937', marginBottom: '16px' }}>
                    📖 Tata Cara Unggah-Ungguh Basa
                  </h2>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
                    {kamisMateri.rules.map((rule, idx) => (
                      <div 
                        key={idx} 
                        style={{ border: '2px solid var(--border-light)', padding: '16px', borderRadius: '12px', background: '#F9FAFB' }}
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

                  {/* Vocabulary Table */}
                  <div style={{ background: '#FFFBEB', border: '1.5px solid #FDE68A', borderRadius: '16px', padding: '20px', marginBottom: '24px' }}>
                    <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#B45309', marginBottom: '12px' }}>
                      📋 Tabel Kosakata: Ngoko vs Krama Alus
                    </h3>
                    <div style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                        <thead>
                          <tr style={{ background: 'linear-gradient(135deg, #D97706, #B45309)', color: '#fff' }}>
                            <th style={{ padding: '10px 14px', fontWeight: '800', textAlign: 'left' }}>Ngoko (Kasual)</th>
                            <th style={{ padding: '10px 14px', fontWeight: '800', textAlign: 'left' }}>Krama Alus (Formal)</th>
                          </tr>
                        </thead>
                        <tbody>
                          {kamisMateri.vocab && kamisMateri.vocab.map((v: any, i: number) => (
                            <tr key={i} style={{ background: i % 2 === 0 ? '#FFF9EC' : '#FFFFFF', borderBottom: '1px solid #FDE68A' }}>
                              <td style={{ padding: '10px 14px', fontWeight: '700', color: '#1F2937' }}>{v.ngoko}</td>
                              <td style={{ padding: '10px 14px', color: '#059669', fontWeight: '800' }}>{v.krama}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <button className="btn-duo btn-duo-blue" style={{ width: '100%' }} onClick={handleCompleteMateri}>
                    Tandai Materi Rampung (+5 XP) ➔
                  </button>
                </div>
              )}

              {/* ── STEP 2: GLADHEN DIALOG ── */}
              {activeStep === 'gladhen' && (
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
                        onClick={() => { setActiveDialogue(idx); playSaronChime(); }}
                        style={{ fontSize: '12px', padding: '10px 16px', width: 'auto', borderBottomWidth: '3px' }}
                      >
                        Kahanan {idx + 1}
                      </button>
                    ))}
                  </div>

                  {/* Dialogue Visualizer */}
                  <div style={{ backgroundColor: '#F8FAFC', border: '2px solid #E2E8F0', borderRadius: '16px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
                    <div style={{ fontStyle: 'italic', fontSize: '13px', color: 'var(--color-purple-dark)', fontWeight: '700', borderBottom: '2px solid #E2E8F0', paddingBottom: '8px' }}>
                      Kahanan: {kamisMateri.dialogues[activeDialogue].context}
                    </div>

                    {kamisMateri.dialogues[activeDialogue].speakers.map((spk: any, sIdx: number) => {
                      const isSiswa = spk.name.includes("Siswa");
                      return (
                        <div 
                          key={sIdx}
                          style={{ display: 'flex', flexDirection: 'column', alignItems: isSiswa ? 'flex-start' : 'flex-end', width: '100%' }}
                        >
                          <span style={{ fontSize: '11px', fontWeight: '800', color: isSiswa ? 'var(--color-blue-dark)' : 'var(--color-green-dark)', marginBottom: '4px' }}>
                            {spk.name}
                          </span>
                          <div style={{ backgroundColor: isSiswa ? '#EFF6FF' : '#F0FDF4', border: `2px solid ${isSiswa ? '#BFDBFE' : '#BBF7D0'}`, padding: '12px 16px', borderRadius: isSiswa ? '16px 16px 16px 0px' : '16px 16px 0px 16px', maxWidth: '80%', color: '#1F2937', fontSize: '14px', lineHeight: '1.5', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                            <strong>{spk.text}</strong>
                            {spk.translation && (
                              <div style={{ fontSize: '11px', color: 'var(--text-muted)', borderTop: '1px solid #E2E8F0', marginTop: '6px', paddingTop: '4px', fontStyle: 'italic' }}>
                                Terjemahan: &quot;{spk.translation}&quot;
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <button className="btn-duo btn-duo-primary" style={{ width: '100%' }} onClick={handleCompleteGladhen}>
                    Rampung Gladhen, Lanjut Kuis! (+10 XP) ➔
                  </button>
                </div>
              )}

              {/* ── STEP 3: KUIS MCQ ── */}
              {activeStep === 'kuis' && (
                <div className="duo-card card-green" style={{ padding: '24px' }}>
                  <h2 style={{ fontSize: '20px', fontWeight: '850', color: '#1F2937', marginBottom: '6px' }}>
                    ⚔️ Kuis Unggah-Ungguh Basa
                  </h2>
                  <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '20px' }}>
                    Pilih wangsulan sing paling bener. Bijine dadi poinmu dina iki!
                  </p>

                  {kamisQuiz.map((q, idx) => (
                    <div key={q.id} style={{ marginBottom: '24px', paddingBottom: '20px', borderBottom: idx < kamisQuiz.length - 1 ? '2px solid var(--border-light)' : 'none' }}>
                      <p style={{ fontSize: '15px', fontWeight: '700', marginBottom: '12px', color: '#1F2937' }}>
                        <strong>{idx + 1}.</strong> {q.question}
                      </p>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {q.options.map(opt => {
                          const isSelected = quizAnswers[q.id] === opt;
                          const isCorrect = quizSubmitted && opt === q.correct;
                          const isWrong = quizSubmitted && isSelected && opt !== q.correct;
                          return (
                            <button
                              key={opt}
                              className="duo-card"
                              type="button"
                              onClick={() => {
                                if (quizSubmitted) return;
                                playSaronChime();
                                setQuizAnswers(prev => ({ ...prev, [q.id]: opt }));
                              }}
                              style={{
                                padding: '12px 16px',
                                cursor: quizSubmitted ? 'default' : 'pointer',
                                margin: 0,
                                background: isCorrect ? '#F0FDF4' : isWrong ? '#FEF2F2' : isSelected ? '#FEF3C7' : '#FFFFFF',
                                borderColor: isCorrect ? '#10B981' : isWrong ? '#EF4444' : isSelected ? '#F59E0B' : 'var(--border-light)',
                                borderBottomWidth: '4px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '12px',
                                width: '100%',
                                textAlign: 'left',
                                color: 'inherit',
                                fontFamily: 'inherit',
                                fontSize: 'inherit',
                                transition: 'all 0.15s'
                              }}
                            >
                              <input
                                type="radio"
                                name={q.id}
                                checked={isSelected}
                                onChange={() => {}}
                                disabled={quizSubmitted}
                                style={{ transform: 'scale(1.25)', accentColor: isCorrect ? '#10B981' : isWrong ? '#EF4444' : '#F59E0B' }}
                              />
                              <span style={{ fontWeight: '600', color: isCorrect ? '#065F46' : isWrong ? '#991B1B' : isSelected ? '#92400E' : '#374151' }}>
                                {isCorrect && '✓ '}{isWrong && '✗ '}{opt}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}

                  {/* Submit / Result */}
                  <div style={{ marginTop: '16px' }}>
                    {quizSubmitted ? (
                      <div style={{ textAlign: 'center', padding: '20px', background: quizScore! >= 70 ? '#F0FDF4' : '#FFF7ED', borderRadius: '16px', border: `2px solid ${quizScore! >= 70 ? '#BBF7D0' : '#FDE68A'}` }}>
                        <div style={{ fontSize: '40px', marginBottom: '8px' }}>{quizScore! === 100 ? '🏆' : quizScore! >= 70 ? '🎉' : '📝'}</div>
                        <div style={{ fontSize: '28px', fontWeight: '900', color: quizScore! >= 70 ? '#059669' : '#D97706' }}>{quizScore}<span style={{ fontSize: '16px', fontWeight: '700', color: '#6B7280' }}>/100 poin</span></div>
                        <div style={{ fontSize: '14px', color: '#374151', marginTop: '8px' }}>
                          {quizScore! === 100 ? 'Sampurna! Sampeyan ahli Unggah-Ungguh Basa!' : quizScore! >= 70 ? 'Apik tenan! Terus sinau basa Jawa krama ya!' : 'Semangat! Baleni materi terus dicoba maneh ya!'}
                        </div>
                      </div>
                    ) : (
                      <button
                        className="btn-duo btn-duo-green"
                        style={{ width: '100%', padding: '16px', fontSize: '18px' }}
                        onClick={handleSubmitKuis}
                        disabled={Object.keys(quizAnswers).length < kamisQuiz.length}
                      >
                        {Object.keys(quizAnswers).length < kamisQuiz.length
                          ? `Pilih wangsulan kabeh dhisik (${Object.keys(quizAnswers).length}/${kamisQuiz.length})`
                          : 'Kumpulake Wangsulan Kuis ✓'}
                      </button>
                    )}
                  </div>
                </div>
              )}

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
              mood={quizSubmitted ? 'celebrating' : gladhenDone ? 'happy' : 'talking'} 
              speechBubbleText={
                quizSubmitted
                  ? `Apik tenan! Poinmu dina iki: ${totalPoin} poin! Matur nuwun wis sinau!`
                  : gladhenDone
                  ? 'Gladhen rampung! Saiki waktune kuis! Ayo tes kawruhmu!'
                  : 'Dina iki dina Kamis Budaya Jawa, ayo sinau basa Krama Alus kagem budi pekerti sing luhur!'
              } 
              width="160px" 
              height="160px" 
            />
          </div>

          {/* ── REKAP POIN KAMIS ── */}
          {isThursday && (
            <div className="duo-card" style={{ padding: '16px', borderColor: '#10B981', borderBottomWidth: '4px' }}>
              <h4 style={{ fontSize: '13px', fontWeight: '900', textTransform: 'uppercase', color: '#065F46', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                🏆 Rekap Poin Kamis
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 10px', borderRadius: '10px', background: materiDone ? '#F0FDF4' : '#F9FAFB', border: `1.5px solid ${materiDone ? '#BBF7D0' : '#E5E7EB'}` }}>
                  <span style={{ fontSize: '12px', fontWeight: '700', color: materiDone ? '#065F46' : '#6B7280' }}>
                    {materiDone ? '✓' : '○'} Sinau Materi
                  </span>
                  <span style={{ fontSize: '13px', fontWeight: '900', color: materiDone ? '#059669' : '#9CA3AF' }}>
                    {materiDone ? '+5' : '0'} <span style={{ fontSize: '10px' }}>XP</span>
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 10px', borderRadius: '10px', background: gladhenDone ? '#F0FDF4' : '#F9FAFB', border: `1.5px solid ${gladhenDone ? '#BBF7D0' : '#E5E7EB'}` }}>
                  <span style={{ fontSize: '12px', fontWeight: '700', color: gladhenDone ? '#065F46' : '#6B7280' }}>
                    {gladhenDone ? '✓' : '○'} Gladhen Dialog
                  </span>
                  <span style={{ fontSize: '13px', fontWeight: '900', color: gladhenDone ? '#059669' : '#9CA3AF' }}>
                    {gladhenDone ? '+10' : '0'} <span style={{ fontSize: '10px' }}>XP</span>
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 10px', borderRadius: '10px', background: quizSubmitted ? '#FFFBEB' : '#F9FAFB', border: `1.5px solid ${quizSubmitted ? '#FDE68A' : '#E5E7EB'}` }}>
                  <span style={{ fontSize: '12px', fontWeight: '700', color: quizSubmitted ? '#92400E' : '#6B7280' }}>
                    {quizSubmitted ? '✓' : '○'} Kuis Kamis
                  </span>
                  <span style={{ fontSize: '13px', fontWeight: '900', color: quizSubmitted ? '#D97706' : '#9CA3AF' }}>
                    {quizSubmitted ? quizScore : '0'}<span style={{ fontSize: '10px', fontWeight: '700' }}>/100 poin</span>
                  </span>
                </div>
              </div>

              {/* Total */}
              <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '2px solid #BBF7D0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '13px', fontWeight: '900', color: '#065F46' }}>Total Poin Kamis</span>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '20px', fontWeight: '900', color: '#059669', lineHeight: '1' }}>{totalPoin}</div>
                  <div style={{ fontSize: '10px', fontWeight: '700', color: '#10B981' }}>POIN</div>
                </div>
              </div>
            </div>
          )}

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

