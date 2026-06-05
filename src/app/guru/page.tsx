'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  getScoreLogs, getVisitorLogs, ScoreLog, VisitorLog, downloadCSV,
  getChaptersList, addCustomChapter, updateCustomChapter, deleteCustomChapter,
  upsertBuiltinOverride
} from '@/lib/db';
import { loginTeacher, logoutTeacher, isTeacherLoggedIn } from '@/lib/teacher-auth';
import { Chapter, Question, DhongengPage, AccordionSection } from '@/lib/chaptersData';

// ──────────────────────────────────────────────
// TYPES
// ──────────────────────────────────────────────
type GameType = 'aksara-drag' | 'word-guess' | 'picture-quiz' | 'memory-match' | 'bubble-pop' | 'speed-run';

interface GameConfig {
  type: GameType;
  title: string;
  description: string;
  config: any;
}

interface LkpdMcQuestion { question: string; optA: string; optB: string; optC: string; correct: string; }
interface LkpdTextQuestion { question: string; correct: string; }
interface MateriSection { title: string; content: string; }
interface DongengPage { text: string; prompt: string; }
interface AksaraPair { aksara: string; latin: string; }
interface WordPair { word: string; hint: string; }

const GAME_TYPES: { type: GameType; label: string; icon: string; desc: string }[] = [
  { type: 'aksara-drag',  label: 'Drag Aksara',   icon: '✍️', desc: 'Cocokkan aksara Jawa dengan latinnya' },
  { type: 'word-guess',   label: 'Tebak Kata',    icon: '🔤', desc: 'Susun huruf menjadi kata Jawa' },
  { type: 'picture-quiz', label: 'Kuis Gambar',   icon: '🖼️', desc: 'Jawab pertanyaan dari gambar' },
  { type: 'memory-match', label: 'Memory Match',  icon: '🧠', desc: 'Pasangkan kartu yang sama' },
  { type: 'bubble-pop',   label: 'Bubble Pop',    icon: '🫧', desc: 'Pecahkan gelembung kata yang benar' },
  { type: 'speed-run',    label: 'Adu Cepat',     icon: '⚡', desc: 'Jawab secepat mungkin sebelum waktu habis' },
];

// ──────────────────────────────────────────────
// LOGIN SCREEN
// ──────────────────────────────────────────────
function TeacherLogin({ onLogin }: { onLogin: () => void }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    await new Promise(r => setTimeout(r, 600));
    const ok = loginTeacher(password);
    if (ok) {
      onLogin();
    } else {
      setError('Sandi salah! Hubungi administrator sekolah.');
    }
    setLoading(false);
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #1a0a00 0%, #3d1a00 40%, #2d0f00 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
      fontFamily: "'Nunito', 'Inter', sans-serif",
    }}>
      {/* Batik pattern overlay */}
      <div style={{
        position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0,
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 5 L55 30 L30 55 L5 30 Z' fill='none' stroke='%23C9923A' stroke-width='0.5' stroke-opacity='0.12'/%3E%3C/svg%3E")`,
      }} />

      <div style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: '420px' }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <svg viewBox="0 0 100 130" width="64" height="80" fill="none" stroke="#F5D061" strokeWidth="2.5" style={{ filter: 'drop-shadow(0 0 20px rgba(245,208,97,0.4))' }}>
            <path d="M50 10 C20 60, 10 100, 10 120 C10 130, 20 130, 50 130 C80 130, 90 130, 90 120 C90 100, 80 60, 50 10 Z" fill="rgba(245,208,97,0.1)" />
            <line x1="50" y1="130" x2="50" y2="40" />
            <circle cx="50" cy="130" r="10" fill="#F5D061" />
            <path d="M50 80 Q30 70, 25 85 M50 80 Q70 70, 75 85" strokeWidth="2" />
          </svg>
          <h1 style={{ color: '#F5D061', fontSize: '28px', fontWeight: '900', margin: '16px 0 4px', letterSpacing: '-0.02em' }}>
            Portal Guru
          </h1>
          <p style={{ color: 'rgba(245,208,97,0.6)', fontSize: '14px' }}>Sinau Jawa — Dashboard Pendidik</p>
        </div>

        {/* Card */}
        <div style={{
          background: 'rgba(255, 248, 228, 0.97)',
          borderRadius: '24px',
          border: '2px solid rgba(201,146,58,0.5)',
          borderBottom: '8px solid rgba(138,85,6,0.4)',
          padding: '36px',
          boxShadow: '0 32px 80px rgba(0,0,0,0.5), 0 8px 24px rgba(74,30,8,0.2)',
        }}>
          <h2 style={{ fontSize: '20px', fontWeight: '800', color: '#1F1107', marginBottom: '8px' }}>
            🔐 Masuk Sebagai Guru
          </h2>
          <p style={{ fontSize: '14px', color: '#6B5A3E', marginBottom: '24px', lineHeight: '1.5' }}>
            Masukkan sandi guru untuk mengakses dashboard manajemen pembelajaran.
          </p>

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '800', color: '#4A2C0A', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Sandi Guru
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPwd ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Masukkan sandi guru..."
                  required
                  autoFocus
                  style={{
                    width: '100%',
                    padding: '14px 48px 14px 16px',
                    borderRadius: '14px',
                    border: `2px solid ${error ? '#EF4444' : 'rgba(201,146,58,0.3)'}`,
                    fontSize: '16px',
                    fontFamily: 'inherit',
                    outline: 'none',
                    background: '#FFFBEF',
                    boxSizing: 'border-box',
                    transition: 'border-color 0.2s',
                  }}
                  onFocus={e => e.target.style.borderColor = '#D97706'}
                  onBlur={e => e.target.style.borderColor = error ? '#EF4444' : 'rgba(201,146,58,0.3)'}
                />
                <button
                  type="button"
                  onClick={() => setShowPwd(!showPwd)}
                  style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px', color: '#9CA3AF' }}
                >
                  {showPwd ? '🙈' : '👁️'}
                </button>
              </div>
              {error && (
                <p style={{ color: '#DC2626', fontSize: '13px', marginTop: '8px', fontWeight: '600' }}>
                  ⚠️ {error}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading || !password}
              style={{
                width: '100%',
                padding: '16px',
                borderRadius: '14px',
                border: 'none',
                borderBottom: '4px solid rgba(120,60,0,0.4)',
                background: loading ? '#9CA3AF' : 'linear-gradient(135deg, #D97706 0%, #B45309 100%)',
                color: '#fff',
                fontSize: '16px',
                fontWeight: '900',
                fontFamily: 'inherit',
                cursor: loading || !password ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s',
                letterSpacing: '0.02em',
              }}
            >
              {loading ? '⏳ Mlebet...' : '🏫 Mlebet Dasbor Guru'}
            </button>
          </form>

          <p style={{ textAlign: 'center', marginTop: '20px', fontSize: '12px', color: '#9CA3AF' }}>
            Sandi default: <code style={{ background: '#F3F4F6', padding: '2px 6px', borderRadius: '4px' }}>guru123</code>
          </p>
        </div>

        <p style={{ textAlign: 'center', marginTop: '20px', fontSize: '12px', color: 'rgba(245,208,97,0.4)' }}>
          🎓 Hanya untuk pendidik yang berwenang
        </p>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────
// CHAPTER FORM (Create / Edit)
// ──────────────────────────────────────────────
function ChapterForm({
  initial,
  onSave,
  onCancel,
}: {
  initial?: Chapter | null;
  onSave: (data: any) => Promise<void>;
  onCancel: () => void;
}) {
  const [title, setTitle] = useState(initial?.title || '');
  const [desc, setDesc] = useState(initial?.description || '');
  const [icon, setIcon] = useState(initial?.icon || '📖');
  const [materiTitle, setMateriTitle] = useState(initial?.materi?.title || '');
  const [materiSections, setMateriSections] = useState<MateriSection[]>(
    initial?.materi?.sections || [{ title: '', content: '' }]
  );
  const [dongengTitle, setDongengTitle] = useState(initial?.dhongeng?.title || '');
  const [dongengPages, setDongengPages] = useState<DongengPage[]>(
    initial?.dhongeng?.pages?.map((p: any) => ({ text: p.text, prompt: p.illustrationPrompt || '' })) ||
    [{ text: '', prompt: '' }]
  );
  const [lkpdTitle, setLkpdTitle] = useState(initial?.lkpd?.title || '');
  const [mcQuestions, setMcQuestions] = useState<LkpdMcQuestion[]>(() => {
    if (initial?.lkpd?.questions) {
      const mc = initial.lkpd.questions.filter(q => q.type === 'multiple-choice');
      if (mc.length > 0) {
        return mc.map(q => ({
          question: q.question,
          optA: q.options?.[0] || '',
          optB: q.options?.[1] || '',
          optC: q.options?.[2] || '',
          correct: q.correctAnswer as string,
        }));
      }
    }
    return [{ question: '', optA: '', optB: '', optC: '', correct: '' }];
  });

  const [textQuestions, setTextQuestions] = useState<LkpdTextQuestion[]>(() => {
    if (initial?.lkpd?.questions) {
      const txt = initial.lkpd.questions.filter(q => q.type === 'text');
      if (txt.length > 0) {
        return txt.map(q => ({
          question: q.question,
          correct: q.correctAnswer as string,
        }));
      }
    }
    return [{ question: '', correct: '' }];
  });

  // Game selection - allow multiple
  const [selectedGames, setSelectedGames] = useState<GameType[]>(
    initial?.game ? [initial.game.type] : ['aksara-drag']
  );
  const [aksaraPairs, setAksaraPairs] = useState<AksaraPair[]>(() => {
    const type = initial?.game?.type;
    if ((type === 'aksara-drag' || type === 'memory-match') && initial?.game?.config?.pairs) {
      return initial.game.config.pairs;
    }
    if (type === 'speed-run' && initial?.game?.config?.pool) {
      return initial.game.config.pool;
    }
    if (type === 'bubble-pop' && initial?.game?.config?.sequence) {
      return initial.game.config.sequence;
    }
    return [{ aksara: '', latin: '' }];
  });
  const [wordPairs, setWordPairs] = useState<WordPair[]>(() => {
    if (initial?.game?.type === 'word-guess') {
      if (initial.game.config?.words) {
        return initial.game.config.words;
      }
      if (initial.game.config?.correctWord) {
        return [{ word: initial.game.config.correctWord, hint: initial.game.config.clue || '' }];
      }
    }
    return [{ word: '', hint: '' }];
  });

  // Gated story questions states
  const [gatedQuestion, setGatedQuestion] = useState(initial?.dhongeng?.question || '');
  const [gatedOptA, setGatedOptA] = useState(initial?.dhongeng?.options?.[0] || '');
  const [gatedOptB, setGatedOptB] = useState(initial?.dhongeng?.options?.[1] || '');
  const [gatedOptC, setGatedOptC] = useState(initial?.dhongeng?.options?.[2] || '');
  const [gatedOptD, setGatedOptD] = useState(initial?.dhongeng?.options?.[3] || '');
  const [gatedCorrectAnswer, setGatedCorrectAnswer] = useState(initial?.dhongeng?.correctAnswer || '');

  // Picture Quiz config states
  const [pqImagePrompt, setPqImagePrompt] = useState(initial?.game?.config?.imagePrompt || 'Traditional Javanese wayang, golden warm tones');
  const [pqImageLabel, setPqImageLabel] = useState(initial?.game?.config?.imageLabel || 'Wayang Gunungan');
  const [pqOptA, setPqOptA] = useState(initial?.game?.config?.options?.[0] || '');
  const [pqOptB, setPqOptB] = useState(initial?.game?.config?.options?.[1] || '');
  const [pqOptC, setPqOptC] = useState(initial?.game?.config?.options?.[2] || '');
  const [pqOptD, setPqOptD] = useState(initial?.game?.config?.options?.[3] || '');
  const [pqCorrect, setPqCorrect] = useState(initial?.game?.config?.correctAnswer || '');

  // Bubble Pop config states
  const [bpDistractors, setBpDistractors] = useState(initial?.game?.config?.distractors?.join(', ') || 'ꦲ, ꦤ, ꦕ, ꦫ, ꦱ');

  const [saving, setSaving] = useState(false);
  const [activeSection, setActiveSection] = useState<'info' | 'materi' | 'dongeng' | 'lkpd' | 'game'>('info');

  const toggleGame = (type: GameType) => {
    setSelectedGames(prev =>
      prev.includes(type) ? prev.filter(g => g !== type) : [...prev, type]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !desc || !materiTitle || !dongengTitle || !lkpdTitle) {
      alert('⚠️ Lengkapi semua field wajib (judul, deskripsi, materi, dongeng, LKPD)!');
      return;
    }
    if (selectedGames.length === 0) {
      alert('⚠️ Pilih minimal satu jenis gamifikasi!');
      return;
    }

    setSaving(true);
    try {
      const questions: Question[] = [];
      mcQuestions.forEach((q, i) => {
        if (q.question && q.correct) {
          questions.push({
            id: `mc_${i}`, type: 'multiple-choice',
            question: q.question,
            options: [q.optA, q.optB, q.optC].filter(Boolean),
            correctAnswer: q.correct,
          });
        }
      });
      textQuestions.forEach((q, i) => {
        if (q.question && q.correct) {
          questions.push({ id: `txt_${i}`, type: 'text', question: q.question, correctAnswer: q.correct });
        }
      });

      const pages: DhongengPage[] = dongengPages
        .filter(p => p.text)
        .map((p, i) => ({ pageIndex: i + 1, text: p.text, illustrationPrompt: p.prompt || 'Traditional Javanese illustration' }));

      // Primary game (first selected) — for backward compat
      const primaryGame = selectedGames[0];
      const gameConfig: any = {
        type: primaryGame,
        title: `Game ${GAME_TYPES.find(g => g.type === primaryGame)?.label}`,
        description: GAME_TYPES.find(g => g.type === primaryGame)?.desc || '',
        config: {},
        // Store all selected games for future use
        allGames: selectedGames,
      };

      if (primaryGame === 'aksara-drag') {
        gameConfig.config.pairs = aksaraPairs.filter(p => p.aksara && p.latin);
        if (gameConfig.config.pairs.length === 0) {
          gameConfig.config.pairs = [{ aksara: 'ꦱ', latin: 'sa' }];
        }
      } else if (primaryGame === 'word-guess') {
        const filteredWords = wordPairs.filter(w => w.word);
        const finalWords = filteredWords.length > 0 ? filteredWords : [{ word: 'JAWA', hint: 'Salah sijine suku ing Indonesia' }];
        gameConfig.config.words = finalWords;
        gameConfig.config.correctWord = finalWords[0].word.toUpperCase();
        gameConfig.config.clue = finalWords[0].hint;
        // Generate letters pool
        const correctLetters = Array.from(new Set(finalWords[0].word.toUpperCase().split('')));
        const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        const set = new Set(correctLetters);
        while (set.size < 10) {
          set.add(alphabet[Math.floor(Math.random() * alphabet.length)]);
        }
        gameConfig.config.letters = Array.from(set).sort(() => Math.random() - 0.5);
      } else if (primaryGame === 'memory-match') {
        gameConfig.config.pairs = aksaraPairs.filter(p => p.aksara && p.latin);
        if (gameConfig.config.pairs.length === 0) {
          gameConfig.config.pairs = [
            { aksara: "ꦱ", latin: "sa" },
            { aksara: "ꦮ", latin: "wa" },
            { aksara: "ꦒ", latin: "ga" }
          ];
        }
      } else if (primaryGame === 'bubble-pop') {
        const seq = aksaraPairs.filter(p => p.aksara && p.latin);
        const target = seq.map(s => s.latin).join('').toUpperCase();
        gameConfig.config = {
          targetWord: target || "JAYA",
          sequence: seq.length > 0 ? seq : [
            { aksara: "ꦗ", latin: "JA" },
            { aksara: "ꦪ", latin: "YA" }
          ],
          distractors: bpDistractors.split(',').map((s: string) => s.trim()).filter(Boolean)
        };
      } else if (primaryGame === 'speed-run') {
        gameConfig.config.pool = aksaraPairs.filter(p => p.aksara && p.latin);
        if (gameConfig.config.pool.length === 0) {
          gameConfig.config.pool = [
            { aksara: "ꦄ", latin: "A" },
            { aksara: "ꦆ", latin: "I" },
            { aksara: "ꦈ", latin: "U" }
          ];
        }
      } else if (primaryGame === 'picture-quiz') {
        gameConfig.config = {
          imagePrompt: pqImagePrompt,
          imageLabel: pqImageLabel,
          options: [pqOptA, pqOptB, pqOptC, pqOptD].filter(Boolean),
          correctAnswer: pqCorrect
        };
      }

      const chapterData = {
        title, description: desc, icon,
        materi: { title: materiTitle, sections: materiSections.filter(s => s.title || s.content) },
        dhongeng: {
          title: dongengTitle,
          pages: pages.length > 0 ? pages : [{ pageIndex: 1, text: 'Critane isih kosong', illustrationPrompt: 'Blank' }],
          question: gatedQuestion || undefined,
          options: (gatedOptA || gatedOptB || gatedOptC || gatedOptD) ? [gatedOptA, gatedOptB, gatedOptC, gatedOptD].filter(Boolean) : undefined,
          correctAnswer: gatedCorrectAnswer || undefined
        },
        lkpd: { title: lkpdTitle, questions: questions.length > 0 ? questions : [{ id: 'q1', type: 'text', question: 'Kesan sampeyan?', correctAnswer: 'apik' }] },
        game: gameConfig,
      };

      await onSave(chapterData);
    } finally {
      setSaving(false);
    }
  };

  const sectionBtnStyle = (s: string) => ({
    padding: '10px 18px',
    borderRadius: '12px',
    border: 'none',
    fontFamily: 'inherit',
    fontWeight: '700',
    fontSize: '13px',
    cursor: 'pointer',
    transition: 'all 0.15s',
    background: activeSection === s ? '#B45309' : '#F3F4F6',
    color: activeSection === s ? '#fff' : '#374151',
  } as React.CSSProperties);

  return (
    <div>
      {/* Section Nav */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '24px' }}>
        {(['info','materi','dongeng','lkpd','game'] as const).map(s => (
          <button key={s} style={sectionBtnStyle(s)} onClick={() => setActiveSection(s)} type="button">
            { s === 'info' ? '📝 Info Dasar' : s === 'materi' ? '📚 Materi' : s === 'dongeng' ? '📖 Dongeng' : s === 'lkpd' ? '📋 LKPD' : '🎮 Gamifikasi' }
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit}>

        {/* ── INFO DASAR ── */}
        {activeSection === 'info' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#1F2937', marginBottom: '4px' }}>📝 Informasi Dasar Bab</h3>
            <div>
              <label style={labelStyle}>Ikon Bab</label>
              <input style={inputStyle} value={icon} onChange={e => setIcon(e.target.value)} placeholder="Emoji, cth: 📜 🌿 🎭" />
            </div>
            <div>
              <label style={labelStyle}>Judul Bab *</label>
              <input style={inputStyle} value={title} onChange={e => setTitle(e.target.value)} placeholder="Cth: Cerita Rakyat: Roro Jonggrang" required />
            </div>
            <div>
              <label style={labelStyle}>Deskripsi Singkat *</label>
              <textarea style={{ ...inputStyle, minHeight: '80px', resize: 'vertical' }} value={desc} onChange={e => setDesc(e.target.value)} placeholder="Deskripsi singkat tentang isi bab ini..." required />
            </div>
          </div>
        )}

        {/* ── MATERI ── */}
        {activeSection === 'materi' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#1F2937' }}>📚 Konten Materi</h3>
            <div>
              <label style={labelStyle}>Judul Materi *</label>
              <input style={inputStyle} value={materiTitle} onChange={e => setMateriTitle(e.target.value)} placeholder="Cth: Materi Aksara Jawa Dasar" required />
            </div>
            {materiSections.map((sec, i) => (
              <div key={i} style={{ background: '#F8FAFC', borderRadius: '12px', padding: '16px', border: '1.5px solid #E2E8F0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                  <span style={{ fontWeight: '800', color: '#374151', fontSize: '14px' }}>Sub-Materi {i + 1}</span>
                  {materiSections.length > 1 && (
                    <button type="button" onClick={() => setMateriSections(prev => prev.filter((_, j) => j !== i))}
                      style={{ background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer', fontSize: '18px' }}>✕</button>
                  )}
                </div>
                <input style={{ ...inputStyle, marginBottom: '8px' }} value={sec.title} onChange={e => setMateriSections(prev => prev.map((s, j) => j === i ? { ...s, title: e.target.value } : s))} placeholder={`Judul Sub-Materi ${i + 1}`} />
                <textarea style={{ ...inputStyle, minHeight: '100px', resize: 'vertical' }} value={sec.content} onChange={e => setMateriSections(prev => prev.map((s, j) => j === i ? { ...s, content: e.target.value } : s))} placeholder={`Isi konten Sub-Materi ${i + 1}...`} />
              </div>
            ))}
            <button type="button" onClick={() => setMateriSections(prev => [...prev, { title: '', content: '' }])}
              style={addBtnStyle}>➕ Tambah Sub-Materi</button>
          </div>
        )}

        {/* ── DONGENG ── */}
        {activeSection === 'dongeng' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#1F2937' }}>📖 Cerita / Dongeng</h3>
            <div>
              <label style={labelStyle}>Judul Cerita *</label>
              <input style={inputStyle} value={dongengTitle} onChange={e => setDongengTitle(e.target.value)} placeholder="Cth: Kisah Roro Jonggrang" required />
            </div>
            {dongengPages.map((page, i) => (
              <div key={i} style={{ background: '#F8FAFC', borderRadius: '12px', padding: '16px', border: '1.5px solid #E2E8F0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                  <span style={{ fontWeight: '800', color: '#374151', fontSize: '14px' }}>Halaman {i + 1}</span>
                  {dongengPages.length > 1 && (
                    <button type="button" onClick={() => setDongengPages(prev => prev.filter((_, j) => j !== i))}
                      style={{ background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer', fontSize: '18px' }}>✕</button>
                  )}
                </div>
                <textarea style={{ ...inputStyle, minHeight: '100px', resize: 'vertical', marginBottom: '8px' }} value={page.text} onChange={e => setDongengPages(prev => prev.map((p, j) => j === i ? { ...p, text: e.target.value } : p))} placeholder={`Teks halaman ${i + 1} cerita...`} />
                <input style={inputStyle} value={page.prompt} onChange={e => setDongengPages(prev => prev.map((p, j) => j === i ? { ...p, prompt: e.target.value } : p))} placeholder="Deskripsi ilustrasi (opsional)" />
              </div>
            ))}
            <button type="button" onClick={() => setDongengPages(prev => [...prev, { text: '', prompt: '' }])}
              style={addBtnStyle}>➕ Tambah Halaman Cerita</button>

            {/* Gated Challenge / Tantangan Tengah Cerita */}
            <div style={{ marginTop: '32px', padding: '20px', background: '#FFFDF9', borderRadius: '16px', border: '2px solid #FCD34D' }}>
              <h4 style={{ fontWeight: '800', color: '#B45309', marginBottom: '8px', fontSize: '15px' }}>⚔️ Tantangan Tengah Cerita (Gated Question)</h4>
              <p style={{ fontSize: '13px', color: '#6B7280', marginBottom: '16px', lineHeight: '1.4' }}>
                Pertanyaan pilihan ganda yang muncul di tengah-tengah dongeng untuk menguji pemahaman membaca siswa sebelum melanjutkan cerita.
              </p>
              <div style={{ marginBottom: '12px' }}>
                <label style={labelStyle}>Pertanyaan Cerita</label>
                <input style={inputStyle} value={gatedQuestion} onChange={e => setGatedQuestion(e.target.value)} placeholder="Cth: Sapa sejatine asmane ramane Joko Berek?" />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                <div>
                  <label style={{ ...labelStyle, fontSize: '11px' }}>Pilihan A</label>
                  <input style={inputStyle} value={gatedOptA} onChange={e => setGatedOptA(e.target.value)} placeholder="Opsi A" />
                </div>
                <div>
                  <label style={{ ...labelStyle, fontSize: '11px' }}>Pilihan B</label>
                  <input style={inputStyle} value={gatedOptB} onChange={e => setGatedOptB(e.target.value)} placeholder="Opsi B" />
                </div>
                <div>
                  <label style={{ ...labelStyle, fontSize: '11px' }}>Pilihan C</label>
                  <input style={inputStyle} value={gatedOptC} onChange={e => setGatedOptC(e.target.value)} placeholder="Opsi C" />
                </div>
                <div>
                  <label style={{ ...labelStyle, fontSize: '11px' }}>Pilihan D</label>
                  <input style={inputStyle} value={gatedOptD} onChange={e => setGatedOptD(e.target.value)} placeholder="Opsi D" />
                </div>
              </div>
              <div>
                <label style={labelStyle}>Jawaban Benar</label>
                <input style={{ ...inputStyle, borderColor: '#D97706' }} value={gatedCorrectAnswer} onChange={e => setGatedCorrectAnswer(e.target.value)} placeholder="✅ Jawaban benar (harus sama persis dengan opsi di atas)" />
              </div>
            </div>
          </div>
        )}

        {/* ── LKPD ── */}
        {activeSection === 'lkpd' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#1F2937' }}>📋 E-LKPD (Lembar Kerja)</h3>
            <div>
              <label style={labelStyle}>Judul LKPD *</label>
              <input style={inputStyle} value={lkpdTitle} onChange={e => setLkpdTitle(e.target.value)} placeholder="Cth: Latihan Aksara Jawa Bab 3" required />
            </div>

            <div>
              <h4 style={{ fontWeight: '800', color: '#374151', fontSize: '15px', marginBottom: '12px' }}>Soal Pilihan Ganda</h4>
              {mcQuestions.map((q, i) => (
                <div key={i} style={{ background: '#F0FFF4', borderRadius: '12px', padding: '16px', border: '1.5px solid #BBF7D0', marginBottom: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                    <span style={{ fontWeight: '800', fontSize: '14px', color: '#065F46' }}>Soal {i + 1}</span>
                    {mcQuestions.length > 1 && (
                      <button type="button" onClick={() => setMcQuestions(prev => prev.filter((_, j) => j !== i))}
                        style={{ background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer', fontSize: '18px' }}>✕</button>
                    )}
                  </div>
                  <input style={{ ...inputStyle, marginBottom: '8px' }} value={q.question} onChange={e => setMcQuestions(prev => prev.map((s, j) => j === i ? { ...s, question: e.target.value } : s))} placeholder="Pertanyaan..." />
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', marginBottom: '8px' }}>
                    <input style={inputStyle} value={q.optA} onChange={e => setMcQuestions(prev => prev.map((s, j) => j === i ? { ...s, optA: e.target.value } : s))} placeholder="Pilihan A" />
                    <input style={inputStyle} value={q.optB} onChange={e => setMcQuestions(prev => prev.map((s, j) => j === i ? { ...s, optB: e.target.value } : s))} placeholder="Pilihan B" />
                    <input style={inputStyle} value={q.optC} onChange={e => setMcQuestions(prev => prev.map((s, j) => j === i ? { ...s, optC: e.target.value } : s))} placeholder="Pilihan C" />
                  </div>
                  <input style={{ ...inputStyle, borderColor: '#10B981' }} value={q.correct} onChange={e => setMcQuestions(prev => prev.map((s, j) => j === i ? { ...s, correct: e.target.value } : s))} placeholder="✅ Jawaban benar (harus sama persis dengan salah satu pilihan)" />
                </div>
              ))}
              <button type="button" onClick={() => setMcQuestions(prev => [...prev, { question: '', optA: '', optB: '', optC: '', correct: '' }])}
                style={{ ...addBtnStyle, background: '#F0FFF4', color: '#065F46', border: '1.5px dashed #10B981' }}>➕ Tambah Soal Pilihan Ganda</button>
            </div>

            <div>
              <h4 style={{ fontWeight: '800', color: '#374151', fontSize: '15px', marginBottom: '12px' }}>Soal Esai / Isian</h4>
              {textQuestions.map((q, i) => (
                <div key={i} style={{ background: '#FFF7ED', borderRadius: '12px', padding: '16px', border: '1.5px solid #FED7AA', marginBottom: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                    <span style={{ fontWeight: '800', fontSize: '14px', color: '#92400E' }}>Soal Esai {i + 1}</span>
                    {textQuestions.length > 1 && (
                      <button type="button" onClick={() => setTextQuestions(prev => prev.filter((_, j) => j !== i))}
                        style={{ background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer', fontSize: '18px' }}>✕</button>
                  )}
                  </div>
                  <input style={{ ...inputStyle, marginBottom: '8px' }} value={q.question} onChange={e => setTextQuestions(prev => prev.map((s, j) => j === i ? { ...s, question: e.target.value } : s))} placeholder="Pertanyaan esai..." />
                  <input style={{ ...inputStyle, borderColor: '#F59E0B' }} value={q.correct} onChange={e => setTextQuestions(prev => prev.map((s, j) => j === i ? { ...s, correct: e.target.value } : s))} placeholder="✅ Kunci jawaban yang diterima" />
                </div>
              ))}
              <button type="button" onClick={() => setTextQuestions(prev => [...prev, { question: '', correct: '' }])}
                style={{ ...addBtnStyle, background: '#FFF7ED', color: '#92400E', border: '1.5px dashed #F59E0B' }}>➕ Tambah Soal Esai</button>
            </div>
          </div>
        )}

        {/* ── GAMIFIKASI ── */}
        {activeSection === 'game' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#1F2937', marginBottom: '4px' }}>🎮 Pilih Jenis Gamifikasi</h3>
              <p style={{ color: '#6B7280', fontSize: '14px', marginBottom: '16px' }}>Pilih jenis game utama untuk bab ini.</p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '12px' }}>
                {GAME_TYPES.map(g => (
                  <div key={g.type}
                    onClick={() => toggleGame(g.type)}
                    style={{
                      padding: '16px',
                      borderRadius: '16px',
                      border: `2.5px solid ${selectedGames.includes(g.type) ? '#D97706' : '#E5E7EB'}`,
                      background: selectedGames.includes(g.type) ? '#FFF7ED' : '#FAFAFA',
                      cursor: 'pointer',
                      transition: 'all 0.15s',
                      transform: selectedGames.includes(g.type) ? 'scale(1.02)' : 'scale(1)',
                    }}>
                    <div style={{ fontSize: '28px', marginBottom: '8px' }}>{g.icon}</div>
                    <div style={{ fontWeight: '800', fontSize: '14px', color: '#1F2937', marginBottom: '4px' }}>{g.label}</div>
                    <div style={{ fontSize: '12px', color: '#6B7280', lineHeight: '1.4' }}>{g.desc}</div>
                    {selectedGames.includes(g.type) && (
                      <div style={{ marginTop: '8px', fontSize: '12px', fontWeight: '800', color: '#D97706' }}>✓ Dipilih {selectedGames.indexOf(g.type) === 0 ? '(Utama)' : ''}</div>
                    )}
                  </div>
                ))}
              </div>
              {selectedGames.length > 0 && (
                <p style={{ marginTop: '12px', fontSize: '13px', color: '#6B7280' }}>
                  Terpilih: <strong>{selectedGames.map(g => GAME_TYPES.find(t => t.type === g)?.label).join(', ')}</strong>
                </p>
              )}
            </div>

            {/* Aksara Pairs Configuration (Aksara Drag, Memory Match, Speed Run, Bubble Pop) */}
            {(selectedGames[0] === 'aksara-drag' || selectedGames[0] === 'memory-match' || selectedGames[0] === 'speed-run' || selectedGames[0] === 'bubble-pop') && (
              <div style={{ background: '#FFFBEF', borderRadius: '12px', padding: '16px', border: '1.5px solid #FDE68A', marginBottom: '16px' }}>
                <h4 style={{ fontWeight: '800', color: '#92400E', marginBottom: '8px' }}>
                  ✍️ Konfigurasi Pasangan Aksara
                </h4>
                <p style={{ fontSize: '12px', color: '#6B7280', marginBottom: '16px', lineHeight: '1.4' }}>
                  {selectedGames[0] === 'bubble-pop' 
                    ? "Masukkan pasangan aksara secara berurutan untuk membentuk kata target (misal: pasangan 1: ꦗ-JA, pasangan 2: ꦪ-YA akan membentuk kata target JAYA)."
                    : selectedGames[0] === 'speed-run'
                    ? "Masukkan seluruh daftar pasangan aksara yang akan muncul sebagai soal acak adu cepat."
                    : "Masukkan pasangan aksara Jawa dan transliterasi latinnya yang digunakan dalam permainan."
                  }
                </p>
                {aksaraPairs.map((pair, i) => (
                  <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '8px', marginBottom: '8px', alignItems: 'center' }}>
                    <input style={inputStyle} value={pair.aksara} onChange={e => setAksaraPairs(prev => prev.map((p, j) => j === i ? { ...p, aksara: e.target.value } : p))} placeholder="Aksara Jawa (cth: ꦱ)" />
                    <input style={inputStyle} value={pair.latin} onChange={e => setAksaraPairs(prev => prev.map((p, j) => j === i ? { ...p, latin: e.target.value } : p))} placeholder="Transliterasi latin (cth: sa)" />
                    {aksaraPairs.length > 1 && <button type="button" onClick={() => setAksaraPairs(prev => prev.filter((_, j) => j !== i))} style={{ background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer', fontSize: '20px' }}>✕</button>}
                  </div>
                ))}
                <button type="button" onClick={() => setAksaraPairs(prev => [...prev, { aksara: '', latin: '' }])} style={addBtnStyle}>➕ Tambah Pasangan Aksara</button>

                {/* Additional field for Bubble Pop distractors */}
                {selectedGames[0] === 'bubble-pop' && (
                  <div style={{ marginTop: '16px', borderTop: '1px solid #FDE68A', paddingTop: '16px' }}>
                    <label style={labelStyle}>Karakter Pengganggu (Distractors) - Pisahkan dengan koma</label>
                    <input style={inputStyle} value={bpDistractors} onChange={e => setBpDistractors(e.target.value)} placeholder="Cth: ꦲ, ꦤ, ꦕ, ꦫ, ꦱ" />
                  </div>
                )}
              </div>
            )}

            {/* Word Guess Config */}
            {selectedGames[0] === 'word-guess' && (
              <div style={{ background: '#EFF6FF', borderRadius: '12px', padding: '16px', border: '1.5px solid #BFDBFE', marginBottom: '16px' }}>
                <h4 style={{ fontWeight: '800', color: '#1E40AF', marginBottom: '12px' }}>🔤 Konfigurasi Tebak Kata</h4>
                {wordPairs.map((pair, i) => (
                  <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '8px', marginBottom: '8px', alignItems: 'center' }}>
                    <input style={inputStyle} value={pair.word} onChange={e => setWordPairs(prev => prev.map((p, j) => j === i ? { ...p, word: e.target.value } : p))} placeholder="Kata (huruf kapital, cth: JAWA)" />
                    <input style={inputStyle} value={pair.hint} onChange={e => setWordPairs(prev => prev.map((p, j) => j === i ? { ...p, hint: e.target.value } : p))} placeholder="Petunjuk/clue" />
                    {wordPairs.length > 1 && <button type="button" onClick={() => setWordPairs(prev => prev.filter((_, j) => j !== i))} style={{ background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer', fontSize: '20px' }}>✕</button>}
                  </div>
                ))}
                <button type="button" onClick={() => setWordPairs(prev => [...prev, { word: '', hint: '' }])} style={{ ...addBtnStyle, background: '#EFF6FF', color: '#1E40AF', border: '1.5px dashed #3B82F6' }}>➕ Tambah Kata</button>
              </div>
            )}

            {/* Picture Quiz Config */}
            {selectedGames[0] === 'picture-quiz' && (
              <div style={{ background: '#FFF1F2', borderRadius: '12px', padding: '16px', border: '1.5px solid #FECDD3', marginBottom: '16px' }}>
                <h4 style={{ fontWeight: '800', color: '#9F1239', marginBottom: '12px' }}>🖼️ Konfigurasi Kuis Gambar</h4>
                <div style={{ marginBottom: '12px' }}>
                  <label style={labelStyle}>Label Gambar (Muncul di pojok gambar)</label>
                  <input style={inputStyle} value={pqImageLabel} onChange={e => setPqImageLabel(e.target.value)} placeholder="Cth: Wayang Gunungan" />
                </div>
                <div style={{ marginBottom: '12px' }}>
                  <label style={labelStyle}>Deskripsi/Prompt Ilustrasi</label>
                  <input style={inputStyle} value={pqImagePrompt} onChange={e => setPqImagePrompt(e.target.value)} placeholder="Cth: Wayang gunungan golden batik standing proud..." />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                  <div>
                    <label style={{ ...labelStyle, fontSize: '11px' }}>Pilihan A</label>
                    <input style={inputStyle} value={pqOptA} onChange={e => setPqOptA(e.target.value)} placeholder="Opsi A" />
                  </div>
                  <div>
                    <label style={{ ...labelStyle, fontSize: '11px' }}>Pilihan B</label>
                    <input style={inputStyle} value={pqOptB} onChange={e => setPqOptB(e.target.value)} placeholder="Opsi B" />
                  </div>
                  <div>
                    <label style={{ ...labelStyle, fontSize: '11px' }}>Pilihan C</label>
                    <input style={inputStyle} value={pqOptC} onChange={e => setPqOptC(e.target.value)} placeholder="Opsi C" />
                  </div>
                  <div>
                    <label style={{ ...labelStyle, fontSize: '11px' }}>Pilihan D</label>
                    <input style={inputStyle} value={pqOptD} onChange={e => setPqOptD(e.target.value)} placeholder="Opsi D" />
                  </div>
                </div>
                <div>
                  <label style={labelStyle}>Jawaban Benar</label>
                  <input style={{ ...inputStyle, borderColor: '#BE123C' }} value={pqCorrect} onChange={e => setPqCorrect(e.target.value)} placeholder="✅ Jawaban benar (harus sama persis dengan opsi di atas)" />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Footer buttons */}
        <div style={{ display: 'flex', gap: '12px', marginTop: '32px', paddingTop: '24px', borderTop: '2px solid #E5E7EB' }}>
          <button type="button" onClick={onCancel}
            style={{ ...addBtnStyle, flex: 1, padding: '14px' }}>
            ✕ Batal
          </button>
          <button type="submit" disabled={saving}
            style={{
              flex: 2, padding: '14px', borderRadius: '14px', border: 'none',
              borderBottom: '4px solid rgba(120,60,0,0.3)',
              background: saving ? '#9CA3AF' : 'linear-gradient(135deg, #D97706, #B45309)',
              color: '#fff', fontSize: '16px', fontWeight: '900',
              fontFamily: 'inherit', cursor: saving ? 'not-allowed' : 'pointer',
            }}>
            {saving ? '⏳ Nyimpen...' : (initial ? '💾 Simpan Perubahan' : '✅ Buat Bab Anyar')}
          </button>
        </div>
      </form>
    </div>
  );
}

// ──────────────────────────────────────────────
// Shared Styles
// ──────────────────────────────────────────────
const inputStyle: React.CSSProperties = {
  width: '100%', padding: '12px 14px', borderRadius: '10px',
  border: '2px solid #E5E7EB', fontSize: '14px', fontFamily: 'inherit',
  outline: 'none', background: '#FFFFFF', boxSizing: 'border-box',
  transition: 'border-color 0.2s',
};

const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: '13px', fontWeight: '800',
  color: '#374151', marginBottom: '6px', textTransform: 'uppercase',
  letterSpacing: '0.04em',
};

const addBtnStyle: React.CSSProperties = {
  padding: '10px 18px', borderRadius: '10px',
  border: '1.5px dashed #D1D5DB', background: '#F9FAFB',
  color: '#6B7280', fontSize: '13px', fontWeight: '700',
  fontFamily: 'inherit', cursor: 'pointer', width: '100%',
  textAlign: 'center',
};

// ──────────────────────────────────────────────
// MAIN DASHBOARD
// ──────────────────────────────────────────────
export default function GuruDashboard() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [activeTab, setActiveTab] = useState<'stats' | 'chapters' | 'editor'>('stats');
  const [scoreLogs, setScoreLogs] = useState<ScoreLog[]>([]);
  const [visitorLogs, setVisitorLogs] = useState<VisitorLog[]>([]);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [editingChapter, setEditingChapter] = useState<Chapter | null | undefined>(undefined); // undefined = hidden, null = new
  const [chapterFilter, setChapterFilter] = useState('all');
  const [activityFilter, setActivityFilter] = useState('all');

  useEffect(() => {
    setIsLoggedIn(isTeacherLoggedIn());
  }, []);

  const loadData = useCallback(async () => {
    try {
      const [scores, visitors, chaps] = await Promise.all([
        getScoreLogs(), getVisitorLogs(), getChaptersList()
      ]);
      setScoreLogs(scores);
      setVisitorLogs(visitors);
      setChapters(chaps);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    }
  }, []);

  useEffect(() => {
    if (isLoggedIn) loadData();
  }, [isLoggedIn, loadData]);

  const handleLogin = () => {
    setIsLoggedIn(true);
  };

  const handleLogout = () => {
    logoutTeacher();
    setIsLoggedIn(false);
  };

  const handleSaveChapter = async (data: any) => {
    if (editingChapter && editingChapter.id < 1000) {
      // Built-in chapter — upsert override (stores with builtinId)
      await upsertBuiltinOverride(editingChapter.id, data);
      alert(`✅ Bab "${data.title}" berhasil diubah! Perubahan akan langsung tampil ke siswa.`);
    } else if (editingChapter && editingChapter.id >= 1000) {
      // Custom chapter — check if it's an override via _customId
      const customId = (editingChapter as any)._customId || (editingChapter.id - 1000);
      await updateCustomChapter(customId, data);
      alert(`✅ Bab "${data.title}" berhasil diperbarui!`);
    } else if (editingChapter === null) {
      // New chapter
      await addCustomChapter(data);
      alert(`🎉 Bab anyar "${data.title}" kasil ditambahake!`);
    }
    setEditingChapter(undefined);
    await loadData();
    setActiveTab('chapters');
  };

  const handleDeleteChapter = async (chapter: Chapter) => {
    if (chapter.id < 1000 && !(chapter as any)._isOverride) {
      if (!confirm(`Hapus bab bawaan akan mengembalikan ke versi asli. Lanjutkan?`)) return;
      // We can't really delete a built-in, but we can remove its override if it has one
      alert('⚠️ Bab bawaan tidak memiliki override untuk dihapus, atau sudah kembali ke versi asli.');
      return;
    }
    if (!confirm(`Yakin hapus bab "${chapter.title}"? Data ini tidak bisa dikembalikan.`)) return;
    
    // For built-in overrides, delete by builtinId lookup (handled via customId stored in _customId)
    const customId = (chapter as any)._customId ?? (chapter.id >= 1000 ? chapter.id - 1000 : null);
    if (customId === null) {
      alert('Tidak bisa menemukan ID custom chapter untuk dihapus.');
      return;
    }
    await deleteCustomChapter(customId);
    alert('🗑️ Bab berhasil dihapus / dikembalikan ke versi asli.');
    await loadData();
  };

  if (!isLoggedIn) return <TeacherLogin onLogin={handleLogin} />;

  // Stats
  const avgLkpd = scoreLogs.filter(s => s.activityType === 'LKPD').length > 0
    ? Math.round(scoreLogs.filter(s => s.activityType === 'LKPD').reduce((a, c) => a + c.score, 0) / scoreLogs.filter(s => s.activityType === 'LKPD').length)
    : 0;
  const totalGames = scoreLogs.filter(s => s.activityType === 'GAME').length;
  const uniqueStudents = Array.from(new Set(visitorLogs.map(v => `${v.name}-${v.className}`))).length;
  const filteredScores = scoreLogs.filter(log => {
    const matchCh = chapterFilter === 'all' || log.chapterId.toString() === chapterFilter;
    const matchAct = activityFilter === 'all' || log.activityType === activityFilter;
    return matchCh && matchAct;
  });

  const tabStyle = (tab: string): React.CSSProperties => ({
    padding: '12px 22px', borderRadius: '12px', border: 'none',
    fontFamily: 'inherit', fontWeight: '800', fontSize: '14px', cursor: 'pointer',
    transition: 'all 0.15s',
    background: activeTab === tab ? '#B45309' : 'rgba(255,255,255,0.6)',
    color: activeTab === tab ? '#fff' : '#4A2C0A',
    borderBottom: activeTab === tab ? '4px solid rgba(74,30,8,0.3)' : '4px solid transparent',
  });

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(160deg, #FFFBEF 0%, #FEF3C7 50%, #FDE68A20 100%)', fontFamily: "'Nunito', 'Inter', sans-serif" }}>

      {/* Header */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 50,
        background: 'linear-gradient(135deg, rgba(74,30,8,0.97) 0%, rgba(138,68,10,0.95) 100%)',
        borderBottom: '3px solid rgba(201,146,58,0.5)',
        boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
        backdropFilter: 'blur(20px)',
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px', height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '24px' }}>🏫</span>
            <div>
              <div style={{ color: '#F5D061', fontWeight: '900', fontSize: '18px', lineHeight: '1' }}>Portal Guru</div>
              <div style={{ color: 'rgba(245,208,97,0.6)', fontSize: '12px' }}>Sinau Jawa — Dashboard Pendidik</div>
            </div>
          </div>
          <button onClick={handleLogout} style={{
            padding: '8px 18px', borderRadius: '10px',
            border: '1.5px solid rgba(245,208,97,0.3)', background: 'rgba(255,255,255,0.1)',
            color: '#F5D061', fontSize: '13px', fontWeight: '700', fontFamily: 'inherit', cursor: 'pointer',
          }}>
            🚪 Keluar
          </button>
        </div>
      </header>

      <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '32px 24px' }}>

        {/* Tab Nav */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '32px', background: 'rgba(255,255,255,0.5)', padding: '8px', borderRadius: '16px', border: '1.5px solid rgba(201,146,58,0.2)', flexWrap: 'wrap' }}>
          <button style={tabStyle('stats')} onClick={() => setActiveTab('stats')}>📊 Statistik & Nilai</button>
          <button style={tabStyle('chapters')} onClick={() => { setActiveTab('chapters'); setEditingChapter(undefined); }}>📚 Kelola Bab</button>
          <button style={{ ...tabStyle('editor'), background: '#D97706', color: '#fff', borderBottom: '4px solid rgba(74,30,8,0.3)' }}
            onClick={() => { setEditingChapter(null); setActiveTab('editor'); }}>
            ➕ Buat Bab Anyar
          </button>
        </div>

        {/* ── STATS TAB ── */}
        {activeTab === 'stats' && (
          <div>
            {/* Quick Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '16px', marginBottom: '32px' }}>
              {[
                { label: 'Siswa Mlebu', value: uniqueStudents, icon: '👥', color: '#1D4ED8', bg: '#EFF6FF' },
                { label: 'Rata-rata LKPD', value: `${avgLkpd}/100`, icon: '📝', color: '#065F46', bg: '#ECFDF5' },
                { label: 'Game Dimainkan', value: totalGames, icon: '🎮', color: '#92400E', bg: '#FFF7ED' },
                { label: 'Total Bab', value: chapters.length, icon: '📚', color: '#6D28D9', bg: '#F5F3FF' },
              ].map(stat => (
                <div key={stat.label} style={{ background: stat.bg, borderRadius: '16px', padding: '20px', border: `1.5px solid ${stat.color}20` }}>
                  <div style={{ fontSize: '28px', marginBottom: '6px' }}>{stat.icon}</div>
                  <div style={{ fontSize: '28px', fontWeight: '900', color: stat.color, lineHeight: '1' }}>{stat.value}</div>
                  <div style={{ fontSize: '12px', fontWeight: '800', color: '#6B7280', marginTop: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{stat.label}</div>
                </div>
              ))}
            </div>

            {/* Score table */}
            <div style={{ background: '#fff', borderRadius: '20px', border: '1.5px solid #E5E7EB', padding: '24px', marginBottom: '24px', boxShadow: '0 4px 16px rgba(0,0,0,0.05)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
                <h2 style={{ fontSize: '18px', fontWeight: '800', color: '#1F2937' }}>📝 Rekap Nilai Siswa</h2>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <select value={chapterFilter} onChange={e => setChapterFilter(e.target.value)} style={{ padding: '8px 12px', borderRadius: '8px', border: '1.5px solid #E5E7EB', fontSize: '13px', fontFamily: 'inherit' }}>
                    <option value="all">Semua Bab</option>
                    {chapters.map(c => <option key={c.id} value={c.id.toString()}>{c.title}</option>)}
                  </select>
                  <select value={activityFilter} onChange={e => setActivityFilter(e.target.value)} style={{ padding: '8px 12px', borderRadius: '8px', border: '1.5px solid #E5E7EB', fontSize: '13px', fontFamily: 'inherit' }}>
                    <option value="all">Semua Aktivitas</option>
                    <option value="LKPD">E-LKPD</option>
                    <option value="GAME">Game</option>
                  </select>
                  <button onClick={() => {
                    downloadCSV(`Nilai_${new Date().toISOString().slice(0,10)}.csv`,
                      ['Nama','Kelas','Bab','Aktivitas','Nilai','Maks','Waktu'],
                      filteredScores.map(l => [l.studentName, l.studentClass, `Bab ${l.chapterId}`, l.activityType, l.score.toString(), l.maxScore.toString(), new Date(l.timestamp).toLocaleString('id-ID')]));
                  }} style={{ padding: '8px 14px', borderRadius: '8px', border: 'none', background: '#1D4ED8', color: '#fff', fontWeight: '700', fontSize: '13px', fontFamily: 'inherit', cursor: 'pointer' }}>
                    📥 Export CSV
                  </button>
                </div>
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                  <thead>
                    <tr style={{ background: '#F8FAFC' }}>
                      {['Nama Siswa','Kelas','Bab','Aktivitas','Nilai','Waktu'].map(h => (
                        <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '800', color: '#374151', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '2px solid #E5E7EB' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredScores.length === 0 ? (
                      <tr><td colSpan={6} style={{ textAlign: 'center', padding: '32px', color: '#9CA3AF', fontSize: '15px' }}>Belum ada data nilai siswa.</td></tr>
                    ) : filteredScores.map((log, i) => (
                      <tr key={i} style={{ borderBottom: '1px solid #F1F5F9', background: i % 2 === 0 ? '#fff' : '#FAFAFA' }}>
                        <td style={{ padding: '12px 16px', fontWeight: '700', color: '#1F2937' }}>{log.studentName}</td>
                        <td style={{ padding: '12px 16px', color: '#374151' }}>{log.studentClass}</td>
                        <td style={{ padding: '12px 16px', color: '#374151' }}>Bab {log.chapterId}</td>
                        <td style={{ padding: '12px 16px' }}>
                          <span style={{ padding: '3px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '800', background: log.activityType === 'LKPD' ? '#ECFDF5' : '#FFF7ED', color: log.activityType === 'LKPD' ? '#065F46' : '#92400E' }}>
                            {log.activityType}
                          </span>
                        </td>
                        <td style={{ padding: '12px 16px', fontWeight: '800', color: log.score >= 70 ? '#065F46' : '#991B1B' }}>{log.score}/{log.maxScore}</td>
                        <td style={{ padding: '12px 16px', color: '#6B7280', fontSize: '13px' }}>{new Date(log.timestamp).toLocaleString('id-ID')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Visitor log */}
            <div style={{ background: '#fff', borderRadius: '20px', border: '1.5px solid #E5E7EB', padding: '24px', boxShadow: '0 4px 16px rgba(0,0,0,0.05)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h2 style={{ fontSize: '18px', fontWeight: '800', color: '#1F2937' }}>👥 Daftar Pengunjung</h2>
                <button onClick={() => {
                  downloadCSV(`Pengunjung_${new Date().toISOString().slice(0,10)}.csv`,
                    ['Nama','Kelas','Waktu'],
                    visitorLogs.map(v => [v.name, v.className, new Date(v.timestamp).toLocaleString('id-ID')]));
                }} style={{ padding: '8px 14px', borderRadius: '8px', border: 'none', background: '#6D28D9', color: '#fff', fontWeight: '700', fontSize: '13px', fontFamily: 'inherit', cursor: 'pointer' }}>
                  📥 Export CSV
                </button>
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                  <thead>
                    <tr style={{ background: '#F8FAFC' }}>
                      {['Nama Siswa','Kelas','Waktu Akses'].map(h => (
                        <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '800', color: '#374151', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '2px solid #E5E7EB' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {visitorLogs.length === 0 ? (
                      <tr><td colSpan={3} style={{ textAlign: 'center', padding: '32px', color: '#9CA3AF', fontSize: '15px' }}>Belum ada pengunjung.</td></tr>
                    ) : visitorLogs.map((v, i) => (
                      <tr key={i} style={{ borderBottom: '1px solid #F1F5F9', background: i % 2 === 0 ? '#fff' : '#FAFAFA' }}>
                        <td style={{ padding: '12px 16px', fontWeight: '700' }}>{v.name}</td>
                        <td style={{ padding: '12px 16px', color: '#374151' }}>{v.className}</td>
                        <td style={{ padding: '12px 16px', color: '#6B7280', fontSize: '13px' }}>{new Date(v.timestamp).toLocaleString('id-ID')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ── CHAPTERS TAB ── */}
        {activeTab === 'chapters' && editingChapter === undefined && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ fontSize: '22px', fontWeight: '900', color: '#1F2937' }}>📚 Kelola Bab Pembelajaran</h2>
              <button onClick={() => { setEditingChapter(null); setActiveTab('editor'); }}
                style={{ padding: '12px 22px', borderRadius: '12px', border: 'none', background: '#D97706', color: '#fff', fontWeight: '800', fontSize: '14px', fontFamily: 'inherit', cursor: 'pointer', borderBottom: '4px solid rgba(74,30,8,0.3)' }}>
                ➕ Buat Bab Anyar
              </button>
            </div>
            <div style={{ display: 'grid', gap: '12px' }}>
              {chapters.map(ch => {
                const isOverride = !!(ch as any)._isOverride;
                const isBuiltin = ch.id < 1000;
                const isCustom = ch.id >= 1000;
                const canDelete = isOverride || isCustom;

                return (
                <div key={ch.id} style={{ background: '#fff', borderRadius: '16px', border: `1.5px solid ${isOverride ? '#FDE68A' : '#E5E7EB'}`, padding: '20px', display: 'flex', alignItems: 'center', gap: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                  <div style={{ fontSize: '36px', width: '52px', height: '52px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: isOverride ? '#FEF9C3' : '#FFF7ED', borderRadius: '12px', flexShrink: 0 }}>{ch.icon}</div>
                  <div style={{ flexGrow: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: '800', fontSize: '16px', color: '#1F2937' }}>Bab {ch.id}: {ch.title}</div>
                    <div style={{ fontSize: '13px', color: '#6B7280', marginTop: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ch.description}</div>
                    <div style={{ display: 'flex', gap: '6px', marginTop: '8px', flexWrap: 'wrap' }}>
                      <span style={{ padding: '2px 8px', borderRadius: '20px', background: '#ECFDF5', color: '#065F46', fontSize: '11px', fontWeight: '800' }}>📚 {(ch.materi?.sections?.length || 0)} Sub-materi</span>
                      <span style={{ padding: '2px 8px', borderRadius: '20px', background: '#EFF6FF', color: '#1D4ED8', fontSize: '11px', fontWeight: '800' }}>📋 {ch.lkpd?.questions?.length || 0} Soal</span>
                      <span style={{ padding: '2px 8px', borderRadius: '20px', background: '#FFF7ED', color: '#92400E', fontSize: '11px', fontWeight: '800' }}>🎮 {ch.game?.type}</span>
                      {isOverride && <span style={{ padding: '2px 8px', borderRadius: '20px', background: '#FEF9C3', color: '#92400E', fontSize: '11px', fontWeight: '800' }}>✏️ Telah Diubah</span>}
                      {isCustom && <span style={{ padding: '2px 8px', borderRadius: '20px', background: '#F5F3FF', color: '#6D28D9', fontSize: '11px', fontWeight: '800' }}>✨ Bab Baru</span>}
                      {isBuiltin && !isOverride && <span style={{ padding: '2px 8px', borderRadius: '20px', background: '#F1F5F9', color: '#475569', fontSize: '11px', fontWeight: '800' }}>📦 Bawaan</span>}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                    <button onClick={() => { setEditingChapter(ch); setActiveTab('editor'); }}
                      style={{ padding: '8px 14px', borderRadius: '10px', border: '1.5px solid #D97706', background: '#FFF7ED', color: '#B45309', fontWeight: '700', fontSize: '13px', fontFamily: 'inherit', cursor: 'pointer' }}>
                      ✏️ Edit
                    </button>
                    {canDelete && (
                      <button onClick={() => handleDeleteChapter(ch)}
                        style={{ padding: '8px 14px', borderRadius: '10px', border: '1.5px solid #FCA5A5', background: '#FEF2F2', color: '#DC2626', fontWeight: '700', fontSize: '13px', fontFamily: 'inherit', cursor: 'pointer' }}>
                        {isOverride ? '↩️ Reset' : '🗑️ Hapus'}
                      </button>
                    )}
                  </div>
                </div>
              );
              })}
            </div>
          </div>
        )}

        {/* ── EDITOR TAB ── */}
        {activeTab === 'editor' && (
          <div style={{ background: '#fff', borderRadius: '20px', border: '1.5px solid #E5E7EB', padding: '32px', boxShadow: '0 4px 20px rgba(0,0,0,0.06)' }}>
            <div style={{ marginBottom: '24px' }}>
              <h2 style={{ fontSize: '22px', fontWeight: '900', color: '#1F2937', marginBottom: '4px' }}>
                {editingChapter ? `✏️ Edit Bab: ${editingChapter.title}` : '➕ Buat Bab Anyar'}
              </h2>
              <p style={{ color: '#6B7280', fontSize: '14px' }}>
                {editingChapter ? 'Ubah konten bab yang sudah ada.' : 'Isi formulir di bawah untuk membuat bab pembelajaran baru.'}
              </p>
            </div>
            <ChapterForm
              initial={editingChapter}
              onSave={handleSaveChapter}
              onCancel={() => { setEditingChapter(undefined); setActiveTab('chapters'); }}
            />
          </div>
        )}
      </main>
    </div>
  );
}
