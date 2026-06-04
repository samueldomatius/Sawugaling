'use client';

import React, { useState, useEffect } from 'react';
import { logScore, updateChapterProgress, deductHeart } from '@/lib/db';
import { playSaronChime, playGongResonance, playErrorChime } from '@/lib/audio';

interface AksaraGameProps {
  chapterId: number;
  chapterTitle: string;
  gameType?: 'aksara-drag' | 'word-guess' | 'picture-quiz' | 'memory-match' | 'bubble-pop' | 'speed-run'; 
  config: any;
  onComplete: () => void;
}

interface MemoryCard {
  id: number;
  value: string;
  type: 'aksara' | 'latin';
  matchKey: string;
  isFlipped: boolean;
  isMatched: boolean;
}

interface Bubble {
  id: number;
  aksara: string;
  latin: string;
  top: number;
  left: number;
  speed: number;
}

interface SpeedQuestion {
  aksara: string;
  latin: string;
}

export default function AksaraGame({ chapterId, chapterTitle, gameType, config, onComplete }: AksaraGameProps) {
  const activeType = gameType || (chapterId === 2 ? 'word-guess' : chapterId === 3 ? 'picture-quiz' : 'aksara-drag');

  const [success, setSuccess] = useState(false);
  const [scoreLogged, setScoreLogged] = useState(false);

  // 1. DRAG AND DROP GAME MODE STATES
  const [draggedItem, setDraggedItem] = useState<any | null>(null);
  const [dragMatches, setDragMatches] = useState<{ [latin: string]: string }>({});
  const [availableItems, setAvailableItems] = useState<any[]>([]);

  // 2. WORD GUESS GAME MODE STATES
  const [guessedWord, setGuessedWord] = useState<string[]>([]);
  const [currentGuessIndex, setCurrentGuessIndex] = useState(0);

  // 3. PICTURE QUIZ GAME MODE STATES
  const [selectedPictureOption, setSelectedPictureOption] = useState<string | null>(null);

  // 4. MEMORY MATCH STATES
  const [memoryCards, setMemoryCards] = useState<MemoryCard[]>([]);
  const [selectedCardIds, setSelectedCardIds] = useState<number[]>([]);

  // 5. BUBBLE POP STATES
  const [bubbles, setBubbles] = useState<Bubble[]>([]);
  const [currentPopIndex, setCurrentPopIndex] = useState(0);

  // 6. SPEED RUN STATES
  const [speedQuestion, setSpeedQuestion] = useState<SpeedQuestion | null>(null);
  const [speedOptions, setSpeedOptions] = useState<string[]>([]);
  const [speedStreak, setSpeedStreak] = useState(0);
  const [speedTimer, setSpeedTimer] = useState(100);

  const loadNextSpeedQuestion = (poolArray?: any[]) => {
    const pool = poolArray || config?.pool;
    if (!pool || pool.length === 0) return;
    const correct = pool[Math.floor(Math.random() * pool.length)];
    const wrongOptions = pool.filter((p: any) => p.latin !== correct.latin);
    const shuffledWrong = [...wrongOptions].sort(() => Math.random() - 0.5);
    const options = [correct.latin, ...shuffledWrong.slice(0, 3).map((w: any) => w.latin)];
    setSpeedQuestion(correct);
    setSpeedOptions(options.sort(() => Math.random() - 0.5));
    setSpeedTimer(100);
  };

  // Initializing game states
  useEffect(() => {
    setSuccess(false);
    setScoreLogged(false);
    
    if (activeType === 'aksara-drag' && config?.pairs) {
      const shuffled = [...config.pairs].sort(() => Math.random() - 0.5);
      setAvailableItems(shuffled);
      setDragMatches({});
    } else if (activeType === 'word-guess' && config?.correctWord) {
      setGuessedWord(Array(config.correctWord.length).fill(''));
      setCurrentGuessIndex(0);
    } else if (activeType === 'picture-quiz') {
      setSelectedPictureOption(null);
    } else if (activeType === 'memory-match' && config?.pairs) {
      const cards: MemoryCard[] = [];
      config.pairs.forEach((p: any, idx: number) => {
        cards.push({
          id: idx * 2,
          value: p.aksara,
          type: 'aksara',
          matchKey: p.latin,
          isFlipped: false,
          isMatched: false
        });
        cards.push({
          id: idx * 2 + 1,
          value: p.latin,
          type: 'latin',
          matchKey: p.latin,
          isFlipped: false,
          isMatched: false
        });
      });
      setMemoryCards(cards.sort(() => Math.random() - 0.5));
      setSelectedCardIds([]);
    } else if (activeType === 'bubble-pop' && config?.sequence) {
      setCurrentPopIndex(0);
      const allItems = [
        ...config.sequence.map((s: any) => ({ ...s, isTarget: true })),
        ...(config.distractors || []).map((d: string) => ({ aksara: d, latin: '', isTarget: false }))
      ];
      const generated: Bubble[] = allItems.map((item, idx) => ({
        id: idx,
        aksara: item.aksara,
        latin: item.latin,
        top: Math.floor(Math.random() * 55) + 15,
        left: Math.floor(Math.random() * 75) + 10,
        speed: Math.random() * 3 + 4
      }));
      setBubbles(generated.sort(() => Math.random() - 0.5));
    } else if (activeType === 'speed-run' && config?.pool) {
      setSpeedStreak(0);
      loadNextSpeedQuestion(config.pool);
    }
  }, [config, chapterId, activeType]);

  // Speed run timer effect
  useEffect(() => {
    if (activeType !== 'speed-run' || success || !speedQuestion) return;

    const interval = setInterval(() => {
      setSpeedTimer((prev) => {
        if (prev <= 0) {
          playErrorChime();
          deductHeart().then(() => window.dispatchEvent(new Event('profileUpdated')));
          alert("Waduh, wektune entek! Nyawamu kelong 1.");
          setSpeedStreak(0);
          loadNextSpeedQuestion();
          return 100;
        }
        return prev - 2.5; // ~4 seconds duration
      });
    }, 100);

    return () => clearInterval(interval);
  }, [activeType, success, speedQuestion]);

  // Log score helper
  const handleSuccessTrigger = async () => {
    setSuccess(true);
    if (!scoreLogged) {
      playGongResonance();
      await logScore(chapterId, chapterTitle, 'GAME', 100, 100);
      await updateChapterProgress(chapterId, "gameDone", true);
      setScoreLogged(true);
    }
  };

  // ----------------------------------------------------
  // MODE 1: DRAG & DROP HANDLERS
  // ----------------------------------------------------
  const handleDragStart = (pair: any) => {
    setDraggedItem(pair);
  };

  const handleDrop = (latinTarget: string) => {
    if (!draggedItem) return;
    if (draggedItem.latin === latinTarget) {
      playSaronChime();
      const updatedMatches = { ...dragMatches, [latinTarget]: draggedItem.aksara };
      setDragMatches(updatedMatches);
      setAvailableItems(prev => prev.filter(item => item.latin !== draggedItem.latin));

      if (Object.keys(updatedMatches).length === config.pairs.length) {
        handleSuccessTrigger();
      }
    } else {
      playErrorChime();
      deductHeart().then(() => window.dispatchEvent(new Event('profileUpdated')));
      alert(`Waduh! Aksara "${draggedItem.aksara}" kurang cocok karo swara "${latinTarget}". Nyawamu kelong 1!`);
    }
    setDraggedItem(null);
  };

  // ----------------------------------------------------
  // MODE 2: WORD GUESS HANDLERS
  // ----------------------------------------------------
  const handleLetterClick = (letter: string) => {
    if (success) return;
    const correctStr = config.correctWord;
    
    if (correctStr[currentGuessIndex] === letter) {
      playSaronChime();
      const updated = [...guessedWord];
      updated[currentGuessIndex] = letter;
      setGuessedWord(updated);

      const nextIndex = currentGuessIndex + 1;
      setCurrentGuessIndex(nextIndex);

      if (nextIndex === correctStr.length) {
        handleSuccessTrigger();
      }
    } else {
      playErrorChime();
      deductHeart().then(() => window.dispatchEvent(new Event('profileUpdated')));
      alert(`Waduh, aksara "${letter}" salah! Waca maneh clue-ne. Nyawamu kelong 1!`);
    }
  };

  // ----------------------------------------------------
  // MODE 3: PICTURE QUIZ HANDLERS
  // ----------------------------------------------------
  const handlePictureAnswer = (option: string) => {
    if (success) return;
    setSelectedPictureOption(option);
    if (option === config.correctAnswer) {
      playSaronChime();
      handleSuccessTrigger();
    } else {
      playErrorChime();
      deductHeart().then(() => window.dispatchEvent(new Event('profileUpdated')));
      alert("Waduh, jawabanmu kurang cocok karo kearifan wayang ing gambar. Nyawamu kelong 1!");
    }
  };

  // ----------------------------------------------------
  // MODE 4: MEMORY MATCH HANDLERS
  // ----------------------------------------------------
  const handleCardClick = (idx: number) => {
    if (success) return;
    if (selectedCardIds.length >= 2 || memoryCards[idx].isMatched || memoryCards[idx].isFlipped) return;

    // Flip card
    const updated = [...memoryCards];
    updated[idx] = { ...updated[idx], isFlipped: true };
    setMemoryCards(updated);

    const newSelection = [...selectedCardIds, idx];
    setSelectedCardIds(newSelection);

    if (newSelection.length === 2) {
      const first = memoryCards[newSelection[0]];
      const second = updated[newSelection[1]];

      if (first.matchKey === second.matchKey && first.type !== second.type) {
        // MATCH!
        setTimeout(() => {
          playSaronChime();
          setMemoryCards(prev => {
            const temp = [...prev];
            temp[newSelection[0]] = { ...temp[newSelection[0]], isMatched: true };
            temp[newSelection[1]] = { ...temp[newSelection[1]], isMatched: true };
            
            // Check success
            const allDone = temp.every(c => c.isMatched);
            if (allDone) {
              handleSuccessTrigger();
            }
            return temp;
          });
          setSelectedCardIds([]);
        }, 400);
      } else {
        // NO MATCH
        setTimeout(() => {
          playErrorChime();
          deductHeart().then(() => window.dispatchEvent(new Event('profileUpdated')));
          alert("Waduh! Kertu iki ora cocok pasangane. Nyawamu kelong 1!");
          setMemoryCards(prev => {
            const temp = [...prev];
            temp[newSelection[0]] = { ...temp[newSelection[0]], isFlipped: false };
            temp[newSelection[1]] = { ...temp[newSelection[1]], isFlipped: false };
            return temp;
          });
          setSelectedCardIds([]);
        }, 1000);
      }
    }
  };

  // ----------------------------------------------------
  // MODE 5: BUBBLE POP HANDLERS
  // ----------------------------------------------------
  const handleBubbleClick = (bubble: Bubble) => {
    if (success) return;
    const target = config.sequence[currentPopIndex];
    if (bubble.aksara === target.aksara) {
      playSaronChime();
      setBubbles(prev => prev.filter(b => b.id !== bubble.id));
      const nextIndex = currentPopIndex + 1;
      setCurrentPopIndex(nextIndex);
      if (nextIndex === config.sequence.length) {
        handleSuccessTrigger();
      }
    } else {
      playErrorChime();
      deductHeart().then(() => window.dispatchEvent(new Event('profileUpdated')));
      alert(`Salah pop le! Balon sing kudu di-pop kudu muni "${target.latin}". Nyawamu kelong 1!`);
    }
  };

  // ----------------------------------------------------
  // MODE 6: SPEED RUN HANDLERS
  // ----------------------------------------------------
  const handleSpeedAnswer = (option: string) => {
    if (success || !speedQuestion) return;
    if (option === speedQuestion.latin) {
      playSaronChime();
      const nextStreak = speedStreak + 1;
      setSpeedStreak(nextStreak);
      if (nextStreak >= 5) {
        handleSuccessTrigger();
      } else {
        loadNextSpeedQuestion();
      }
    } else {
      playErrorChime();
      deductHeart().then(() => window.dispatchEvent(new Event('profileUpdated')));
      alert(`Waduh! Jawaban sing bener yaiku "${speedQuestion.latin}". Streak bali dadi 0 lan nyawamu kelong 1!`);
      setSpeedStreak(0);
      loadNextSpeedQuestion();
    }
  };

  // Restart Handler
  const handleRestart = () => {
    setSuccess(false);
    setScoreLogged(false);
    if (activeType === 'aksara-drag' && config?.pairs) {
      const shuffled = [...config.pairs].sort(() => Math.random() - 0.5);
      setAvailableItems(shuffled);
      setDragMatches({});
    } else if (activeType === 'word-guess' && config?.correctWord) {
      setGuessedWord(Array(config.correctWord.length).fill(''));
      setCurrentGuessIndex(0);
    } else if (activeType === 'picture-quiz') {
      setSelectedPictureOption(null);
    } else if (activeType === 'memory-match' && config?.pairs) {
      const cards: MemoryCard[] = [];
      config.pairs.forEach((p: any, idx: number) => {
        cards.push({
          id: idx * 2,
          value: p.aksara,
          type: 'aksara',
          matchKey: p.latin,
          isFlipped: false,
          isMatched: false
        });
        cards.push({
          id: idx * 2 + 1,
          value: p.latin,
          type: 'latin',
          matchKey: p.latin,
          isFlipped: false,
          isMatched: false
        });
      });
      setMemoryCards(cards.sort(() => Math.random() - 0.5));
      setSelectedCardIds([]);
    } else if (activeType === 'bubble-pop' && config?.sequence) {
      setCurrentPopIndex(0);
      const allItems = [
        ...config.sequence.map((s: any) => ({ ...s, isTarget: true })),
        ...(config.distractors || []).map((d: string) => ({ aksara: d, latin: '', isTarget: false }))
      ];
      const generated: Bubble[] = allItems.map((item, idx) => ({
        id: idx,
        aksara: item.aksara,
        latin: item.latin,
        top: Math.floor(Math.random() * 55) + 15,
        left: Math.floor(Math.random() * 75) + 10,
        speed: Math.random() * 3 + 4
      }));
      setBubbles(generated.sort(() => Math.random() - 0.5));
    } else if (activeType === 'speed-run' && config?.pool) {
      setSpeedStreak(0);
      loadNextSpeedQuestion(config.pool);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <h3 style={{ fontSize: '20px', fontWeight: '850', color: '#1F2937' }}>
        🎯 {config?.title || 'Game Pasinaon'}
      </h3>
      <p style={{ fontSize: '14px', color: 'var(--text-muted)', lineHeight: '1.5' }}>
        {config?.description || 'Rampungna tantangan game ing ngisor iki kanggo entuk poin ekstra!'}
      </p>

      {success ? (
        <div style={{ textAlign: 'center', padding: '32px 16px', background: '#F0FDF4', borderRadius: '16px', border: '2px solid #BBF7D0' }}>
          <h4 style={{ color: 'var(--color-green-dark)', fontSize: '22px', fontWeight: '800', marginBottom: '8px' }}>
            🎉 Sugeng! Game Bener Kabeh!
          </h4>
          <p style={{ color: '#374151', marginBottom: '20px', fontSize: '14px' }}>
            Panjenengan wis pinter lan prigel ngrampungake tantangan dolanan iki! Nilai 100 kasimpen ing rekap guru.
          </p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
            <button className="btn-duo btn-duo-primary" style={{ width: 'auto' }} onClick={onComplete}>
              Lanjutake Bab ➔
            </button>
            <button className="btn-duo btn-duo-secondary" style={{ width: 'auto' }} onClick={handleRestart}>
              Baleni Game 🔄
            </button>
          </div>
        </div>
      ) : (
        <div style={{ marginTop: '16px' }}>
          
          {/* ==================================================== */}
          {/* MODE 1: DRAG & DROP COMPONENT */}
          {/* ==================================================== */}
          {activeType === 'aksara-drag' && config?.pairs && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
              <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
                {config.pairs.map((pair: any) => {
                  const matched = dragMatches[pair.latin];
                  return (
                    <div
                      key={pair.latin}
                      onDragOver={e => e.preventDefault()}
                      onDrop={() => handleDrop(pair.latin)}
                      style={{
                        width: '110px',
                        height: '110px',
                        backgroundColor: matched ? '#F0FDF4' : '#FFFFFF',
                        border: matched ? '2px solid var(--color-green)' : '2px dashed #CBD5E1',
                        borderRadius: '16px',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: matched ? '0 4px 0 var(--color-green-dark)' : 'none'
                      }}
                    >
                      {matched ? (
                        <>
                          <div className="aksara-script" style={{ color: 'var(--color-green-dark)', fontSize: '28px', fontWeight: 'bold' }}>
                            {matched}
                          </div>
                          <div style={{ color: 'var(--color-green-dark)', fontSize: '12px', fontWeight: '800', marginTop: '4px' }}>
                            {pair.latin}
                          </div>
                        </>
                      ) : (
                        <>
                          <span style={{ fontSize: '18px', fontWeight: '800', color: '#64748B' }}>{pair.latin}</span>
                          <span style={{ fontSize: '11px', color: '#94A3B8', marginTop: '4px' }}>Tumpakake</span>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>

              {availableItems.length > 0 && (
                <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap', padding: '20px', background: '#F8FAFC', borderRadius: '16px', border: '2px solid #E2E8F0' }}>
                  {availableItems.map((pair: any) => (
                    <div
                      key={pair.latin}
                      draggable
                      onDragStart={() => handleDragStart(pair)}
                      className="aksara-card-draggable"
                      style={{
                        width: '80px',
                        height: '80px',
                        background: '#FFFFFF',
                        border: '2px solid #E2E8F0',
                        borderBottom: '5px solid #C084FC',
                        borderRadius: '16px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'grab'
                      }}
                    >
                      <span className="aksara-script" style={{ fontSize: '28px', color: 'var(--color-purple-dark)', fontWeight: 'bold' }}>
                        {pair.aksara}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ==================================================== */}
          {/* MODE 2: TEBAK KATA (WORD GUESS) */}
          {/* ==================================================== */}
          {activeType === 'word-guess' && config?.correctWord && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', alignItems: 'center' }}>
              <div style={{ padding: '16px', background: '#FFFBEB', borderRadius: '12px', border: '2px solid #FDE68A', width: '100%', textAlign: 'center' }}>
                <span style={{ fontSize: '14px', fontWeight: '800', color: '#B45309', display: 'block', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Petunjuk (Clue)</span>
                <span style={{ fontSize: '16px', fontWeight: '750', color: '#1F2937', marginTop: '4px', display: 'block' }}>{config.clue}</span>
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                {guessedWord.map((letter, idx) => (
                  <div
                    key={idx}
                    style={{
                      width: '48px',
                      height: '54px',
                      borderRadius: '12px',
                      border: '2px solid',
                      borderColor: letter ? 'var(--color-green)' : '#CBD5E1',
                      borderBottomWidth: '5px',
                      background: '#FFFFFF',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '22px',
                      fontWeight: '850',
                      color: 'var(--color-green-dark)'
                    }}
                  >
                    {letter}
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'center', maxWidth: '440px', background: '#F8FAFC', padding: '16px', borderRadius: '16px', border: '2px solid #E2E8F0' }}>
                {config.letters.map((letter: string) => {
                  const alreadyUsed = guessedWord.includes(letter);
                  return (
                    <button
                      key={letter}
                      onClick={() => handleLetterClick(letter)}
                      disabled={alreadyUsed}
                      className="btn-duo btn-duo-secondary"
                      style={{
                        width: '48px',
                        height: '48px',
                        fontSize: '16px',
                        padding: 0,
                        borderBottomWidth: '3px',
                        opacity: alreadyUsed ? 0.4 : 1
                      }}
                    >
                      {letter}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* ==================================================== */}
          {/* MODE 3: TEBAK GAMBAR (PICTURE QUIZ) */}
          {/* ==================================================== */}
          {activeType === 'picture-quiz' && config?.options && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', alignItems: 'center' }}>
              <div style={{ width: '100%', height: '200px', borderRadius: '16px', border: '2px solid #8B4513', background: 'linear-gradient(135deg, #FFEBCD 0%, #D2B48C 100%)', position: 'relative', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg viewBox="0 0 100 140" fill="none" stroke="#8B4513" strokeWidth="1.5" style={{ height: '90%' }}>
                  <path d="M50 10 C20 60, 10 100, 10 120 C10 130, 20 130, 50 130 C80 130, 90 130, 90 120 C90 100, 80 60, 50 10 Z" fill="rgba(253, 224, 71, 0.25)" />
                  <line x1="50" y1="130" x2="50" y2="50" />
                  <path d="M50 90 Q30 80, 25 95 M50 90 Q70 80, 75 95" />
                  <path d="M50 70 Q35 60, 30 75 M50 70 Q65 60, 70 75" />
                  <circle cx="50" cy="130" r="8" fill="#8B4513" />
                </svg>
                <div style={{ position: 'absolute', top: '12px', left: '12px', background: 'rgba(255,255,255,0.85)', padding: '4px 10px', borderRadius: '8px', fontSize: '11px', fontWeight: '800', border: '1px solid rgba(0,0,0,0.05)' }}>Wayang Gunungan</div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', width: '100%' }}>
                {config.options.map((opt: string) => {
                  const isSelected = selectedPictureOption === opt;
                  return (
                    <div
                      key={opt}
                      onClick={() => handlePictureAnswer(opt)}
                      className="duo-card"
                      style={{
                        padding: '16px',
                        cursor: 'pointer',
                        margin: 0,
                        backgroundColor: isSelected ? '#F0FDF4' : '#FFFFFF',
                        borderColor: isSelected ? 'var(--color-green)' : 'var(--border-light)',
                        borderBottomWidth: '4px',
                        textAlign: 'center'
                      }}
                    >
                      <span style={{ fontWeight: '800', color: isSelected ? 'var(--color-green-dark)' : '#374151', fontSize: '14px' }}>
                        {opt}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ==================================================== */}
          {/* MODE 4: KARTU MEMORI (MEMORY MATCH) */}
          {/* ==================================================== */}
          {activeType === 'memory-match' && memoryCards.length > 0 && (
            <div className="memory-grid">
              {memoryCards.map((card, idx) => {
                const isFlipped = card.isFlipped || card.isMatched;
                return (
                  <div
                    key={card.id}
                    onClick={() => handleCardClick(idx)}
                    className={`memory-card-outer ${isFlipped ? 'flipped' : ''}`}
                  >
                    <div className="memory-card-inner">
                      <div className="memory-card-face memory-card-back">
                        ꦯꦮ
                      </div>
                      <div className={`memory-card-face memory-card-front ${card.isMatched ? 'matched' : ''}`}>
                        <span className={card.type === 'aksara' ? 'aksara-script' : ''} style={{ fontSize: card.type === 'aksara' ? '28px' : '15px', fontWeight: 'bold' }}>
                          {card.value}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* ==================================================== */}
          {/* MODE 5: LETUSKAN BALON (BUBBLE POP) */}
          {/* ==================================================== */}
          {activeType === 'bubble-pop' && config?.sequence && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 18px', background: '#F0FDF4', border: '2px solid #BBF7D0', borderRadius: '12px' }}>
                <span style={{ fontSize: '14px', fontWeight: '800', color: '#166534' }}>
                  Target Kata: <strong style={{ letterSpacing: '2px', color: 'var(--color-green-dark)' }}>{config.targetWord}</strong>
                </span>
                <span style={{ fontSize: '14px', fontWeight: '800', color: '#166534' }}>
                  Berikutnya: <strong style={{ color: 'var(--color-purple-dark)', fontSize: '16px' }}>{config.sequence[currentPopIndex]?.latin}</strong>
                </span>
              </div>

              <div className="bubble-game-area">
                {bubbles.map((b) => (
                  <div
                    key={b.id}
                    onClick={() => handleBubbleClick(b)}
                    className="bubble-pop-item"
                    style={{
                      top: `${b.top}%`,
                      left: `${b.left}%`,
                      animationDuration: `${b.speed}s`
                    }}
                  >
                    <span className="aksara-script" style={{ fontSize: '24px' }}>{b.aksara}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ==================================================== */}
          {/* MODE 6: AKSARA KEBUT (SPEED RUN) */}
          {/* ==================================================== */}
          {activeType === 'speed-run' && speedQuestion && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', alignItems: 'center' }}>
              <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '14px', fontWeight: '800', color: '#1E2937' }}>
                  Beruntun: <strong style={{ color: 'var(--color-green-dark)', fontSize: '16px' }}>{speedStreak} / 5 🔥</strong>
                </span>
                <span style={{ fontSize: '12px', fontWeight: '800', color: 'var(--text-muted)' }}>
                  Ayo cepet sebelum entek!
                </span>
              </div>

              <div className="speed-run-timer-bar">
                <div className="speed-run-timer-fill" style={{ width: `${speedTimer}%` }}></div>
              </div>

              <div style={{
                width: '140px',
                height: '140px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #FAF5FF 0%, #F3E8FF 100%)',
                border: '4px solid var(--color-purple)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 8px 16px rgba(147, 51, 234, 0.1)'
              }}>
                <span className="aksara-script" style={{ fontSize: '54px', color: 'var(--color-purple-dark)', fontWeight: 'bold' }}>
                  {speedQuestion.aksara}
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', width: '100%', maxWidth: '400px' }}>
                {speedOptions.map((opt) => (
                  <button
                    key={opt}
                    onClick={() => handleSpeedAnswer(opt)}
                    className="btn-duo btn-duo-secondary"
                    style={{
                      padding: '16px',
                      fontSize: '18px',
                      fontWeight: '800',
                      borderBottomWidth: '4px'
                    }}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>
          )}

        </div>
      )}
    </div>
  );
}
