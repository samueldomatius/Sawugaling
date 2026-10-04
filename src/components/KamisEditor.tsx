import React, { useState, useEffect } from 'react';
import { getCustomKamis, setCustomKamis } from '@/lib/db';
import { kamisMateri as defaultKamisMateri } from '@/lib/chaptersData';

const defaultKamisQuiz = [
  {
    id: 'kq1',
    question: 'Endi ukara sing bener kanggo nyuwun izin marang Ibu Guru?',
    options: ['Bu, aku arep menyang jedhing.', 'Nyuwun sewu Ibu Guru, kepareng kula badhe dhateng wingking sekedhap.', 'Hei Bu, aku pergi ya.', 'Pak, izin dong ke kamar mandi.'],
    correct: 'Nyuwun sewu Ibu Guru, kepareng kula badhe dhateng wingking sekedhap.',
  },
  {
    id: 'kq2',
    question: 'Basa apa sing digunakake murid marang gurune?',
    options: ['Ngoko', 'Walikan', 'Krama Alus', 'Bahasa Indonesia'],
    correct: 'Krama Alus',
  }
];

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '10px 14px', borderRadius: '8px',
  border: '1.5px solid #E5E7EB', fontSize: '14px', fontFamily: 'inherit', boxSizing: 'border-box',
};
const labelStyle: React.CSSProperties = {
  display: 'block', fontWeight: '700', marginBottom: '6px', fontSize: '13px', color: '#374151',
};
const sectionCard: React.CSSProperties = {
  background: '#F8FAFC', border: '1.5px solid #E2E8F0', borderRadius: '12px', padding: '16px',
  display: 'flex', flexDirection: 'column', gap: '10px',
};

export default function KamisEditor() {
  const [materi, setMateri] = useState<any>(defaultKamisMateri);
  const [quiz, setQuiz] = useState<any[]>(defaultKamisQuiz);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'materi' | 'gladhen' | 'kuis'>('materi');

  useEffect(() => {
    const load = async () => {
      const customConfig = await getCustomKamis();
      if (customConfig) {
        if (customConfig.materi) setMateri(customConfig.materi);
        if (customConfig.quiz) setQuiz(customConfig.quiz);
      }
    };
    load();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    await setCustomKamis({ materi, quiz });
    setSaving(false);
    alert('Konfigurasi Hari Kamis berhasil disimpan!');
  };

  // ── RULE handlers ──
  const handleRuleChange = (idx: number, field: 'title' | 'content', value: string) => {
    const newRules = [...materi.rules];
    newRules[idx] = { ...newRules[idx], [field]: value };
    setMateri({ ...materi, rules: newRules });
  };

  // ── VOCAB handlers ──
  const handleVocabChange = (idx: number, field: 'ngoko' | 'krama', value: string) => {
    const newVocab = materi.vocab ? [...materi.vocab] : [];
    newVocab[idx] = { ...newVocab[idx], [field]: value };
    setMateri({ ...materi, vocab: newVocab });
  };
  const addVocab = () => {
    const newVocab = materi.vocab ? [...materi.vocab] : [];
    newVocab.push({ ngoko: '', krama: '' });
    setMateri({ ...materi, vocab: newVocab });
  };

  // ── DIALOGUE handlers ──
  const getDialogues = (): any[] => materi.dialogues || [];

  const handleDialogueContextChange = (dIdx: number, value: string) => {
    const newDialogues = [...getDialogues()];
    newDialogues[dIdx] = { ...newDialogues[dIdx], context: value };
    setMateri({ ...materi, dialogues: newDialogues });
  };

  const handleSpeakerChange = (dIdx: number, sIdx: number, field: 'name' | 'text' | 'translation', value: string) => {
    const newDialogues = [...getDialogues()];
    const newSpeakers = [...(newDialogues[dIdx].speakers || [])];
    newSpeakers[sIdx] = { ...newSpeakers[sIdx], [field]: value };
    newDialogues[dIdx] = { ...newDialogues[dIdx], speakers: newSpeakers };
    setMateri({ ...materi, dialogues: newDialogues });
  };

  const addSpeaker = (dIdx: number) => {
    const newDialogues = [...getDialogues()];
    const newSpeakers = [...(newDialogues[dIdx].speakers || [])];
    newSpeakers.push({ name: '', text: '', translation: '' });
    newDialogues[dIdx] = { ...newDialogues[dIdx], speakers: newSpeakers };
    setMateri({ ...materi, dialogues: newDialogues });
  };

  const removeSpeaker = (dIdx: number, sIdx: number) => {
    const newDialogues = [...getDialogues()];
    const newSpeakers = [...(newDialogues[dIdx].speakers || [])];
    newSpeakers.splice(sIdx, 1);
    newDialogues[dIdx] = { ...newDialogues[dIdx], speakers: newSpeakers };
    setMateri({ ...materi, dialogues: newDialogues });
  };

  const addDialogue = () => {
    const newDialogues = [...getDialogues()];
    newDialogues.push({ context: '', speakers: [{ name: 'Siswa (Krama Alus)', text: '', translation: '' }] });
    setMateri({ ...materi, dialogues: newDialogues });
  };

  const removeDialogue = (dIdx: number) => {
    const newDialogues = [...getDialogues()];
    newDialogues.splice(dIdx, 1);
    setMateri({ ...materi, dialogues: newDialogues });
  };

  // ── QUIZ handlers ──
  const handleQuizChange = (idx: number, field: string, value: any) => {
    const newQuiz = [...quiz];
    newQuiz[idx] = { ...newQuiz[idx], [field]: value };
    setQuiz(newQuiz);
  };

  const tabStyle = (t: string): React.CSSProperties => ({
    padding: '10px 18px', borderRadius: '10px', border: 'none', fontFamily: 'inherit',
    fontWeight: '700', fontSize: '13px', cursor: 'pointer',
    background: activeTab === t ? '#D97706' : '#F3F4F6',
    color: activeTab === t ? '#fff' : '#374151',
  });

  return (
    <div style={{ background: '#fff', borderRadius: '24px', padding: '32px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', border: '2px solid #E5E7EB' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <h2 style={{ fontSize: '24px', fontWeight: '900', color: '#1F2937' }}>📅 Kelola Hari Kamis</h2>
        <button onClick={handleSave} disabled={saving}
          style={{ padding: '12px 24px', borderRadius: '12px', background: saving ? '#9CA3AF' : '#D97706', color: '#fff', fontWeight: '800', border: 'none', cursor: saving ? 'not-allowed' : 'pointer' }}>
          {saving ? '⏳ Menyimpan...' : '💾 Simpan Perubahan'}
        </button>
      </div>

      {/* Tab navigation */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', flexWrap: 'wrap' }}>
        <button style={tabStyle('materi')} onClick={() => setActiveTab('materi')}>📚 Materi &amp; Kosakata</button>
        <button style={tabStyle('gladhen')} onClick={() => setActiveTab('gladhen')}>💬 Gladhen Dialog</button>
        <button style={tabStyle('kuis')} onClick={() => setActiveTab('kuis')}>⚔️ Kuis MCQ</button>
      </div>

      {/* ── TAB: MATERI ── */}
      {activeTab === 'materi' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <label style={labelStyle}>Judul Halaman</label>
            <input style={inputStyle} value={materi.title} onChange={e => setMateri({ ...materi, title: e.target.value })} />
          </div>
          <div>
            <label style={labelStyle}>Deskripsi Pembuka</label>
            <textarea style={{ ...inputStyle, minHeight: '80px', resize: 'vertical' }} value={materi.intro} onChange={e => setMateri({ ...materi, intro: e.target.value })} />
          </div>

          <div>
            <h4 style={{ fontSize: '15px', fontWeight: '800', color: '#4B5563', marginBottom: '12px' }}>📋 Aturan / Tata Cara</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {materi.rules.map((rule: any, idx: number) => (
                <div key={idx} style={sectionCard}>
                  <input style={inputStyle} value={rule.title} onChange={e => handleRuleChange(idx, 'title', e.target.value)} placeholder="Judul Aturan" />
                  <textarea style={{ ...inputStyle, minHeight: '60px', resize: 'vertical' }} value={rule.content} onChange={e => handleRuleChange(idx, 'content', e.target.value)} placeholder="Isi Aturan" />
                </div>
              ))}
            </div>
          </div>

          <div>
            <h4 style={{ fontSize: '15px', fontWeight: '800', color: '#B45309', marginBottom: '12px' }}>📖 Tabel Kosakata Ngoko vs Krama</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {materi.vocab && materi.vocab.map((v: any, idx: number) => (
                <div key={idx} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '8px', alignItems: 'center', padding: '12px', border: '1px solid #FDE68A', borderRadius: '12px', background: '#FFFBEB' }}>
                  <input style={inputStyle} value={v.ngoko} onChange={e => handleVocabChange(idx, 'ngoko', e.target.value)} placeholder="Ngoko (Kasual)" />
                  <input style={inputStyle} value={v.krama} onChange={e => handleVocabChange(idx, 'krama', e.target.value)} placeholder="Krama Alus (Formal)" />
                  <button onClick={() => { const nv = [...materi.vocab]; nv.splice(idx, 1); setMateri({ ...materi, vocab: nv }); }}
                    style={{ background: '#EF4444', color: '#fff', border: 'none', borderRadius: '8px', padding: '8px 12px', cursor: 'pointer', fontWeight: 'bold' }}>✕</button>
                </div>
              ))}
              <button onClick={addVocab}
                style={{ padding: '12px', borderRadius: '12px', background: '#FEF3C7', border: '1.5px dashed #F59E0B', color: '#D97706', fontWeight: '800', cursor: 'pointer' }}>
                ➕ Tambah Kosakata
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB: GLADHEN DIALOG ── */}
      {activeTab === 'gladhen' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <p style={{ color: '#6B7280', fontSize: '14px' }}>
            Kelola kahanan (percakapan) yang tampil di bagian <strong>Gladhen Micara</strong>. Setiap kahanan memiliki konteks dan daftar giliran bicara (speaker).
          </p>

          {getDialogues().map((dlg: any, dIdx: number) => (
            <div key={dIdx} style={{ border: '2px solid #C4B5FD', borderRadius: '16px', padding: '20px', background: '#FAF5FF', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: '900', fontSize: '15px', color: '#7C3AED' }}>💬 Kahanan {dIdx + 1}</span>
                {getDialogues().length > 1 && (
                  <button onClick={() => removeDialogue(dIdx)}
                    style={{ background: '#EF4444', color: '#fff', border: 'none', borderRadius: '8px', padding: '6px 12px', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px' }}>
                    Hapus Kahanan
                  </button>
                )}
              </div>

              <div>
                <label style={labelStyle}>Konteks / Situasi</label>
                <input style={inputStyle} value={dlg.context} onChange={e => handleDialogueContextChange(dIdx, e.target.value)}
                  placeholder="Cth: Siswa nyuwun izin menyang jedhing..." />
              </div>

              <div>
                <label style={{ ...labelStyle, marginBottom: '10px' }}>🗣️ Giliran Bicara (Speaker)</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {(dlg.speakers || []).map((spk: any, sIdx: number) => (
                    <div key={sIdx} style={{ display: 'grid', gridTemplateColumns: '1fr 2fr 2fr auto', gap: '8px', alignItems: 'start', padding: '12px', background: '#fff', borderRadius: '10px', border: '1px solid #DDD6FE' }}>
                      <div>
                        <label style={{ ...labelStyle, fontSize: '11px' }}>Nama Pembicara</label>
                        <input style={inputStyle} value={spk.name} onChange={e => handleSpeakerChange(dIdx, sIdx, 'name', e.target.value)}
                          placeholder="Cth: Siswa (Krama Alus)" />
                      </div>
                      <div>
                        <label style={{ ...labelStyle, fontSize: '11px' }}>Teks Jawa</label>
                        <textarea style={{ ...inputStyle, minHeight: '64px', resize: 'vertical' }} value={spk.text} onChange={e => handleSpeakerChange(dIdx, sIdx, 'text', e.target.value)}
                          placeholder="Teks percakapan Bahasa Jawa..." />
                      </div>
                      <div>
                        <label style={{ ...labelStyle, fontSize: '11px' }}>Terjemahan Indonesia</label>
                        <textarea style={{ ...inputStyle, minHeight: '64px', resize: 'vertical' }} value={spk.translation || ''} onChange={e => handleSpeakerChange(dIdx, sIdx, 'translation', e.target.value)}
                          placeholder="Terjemahan ke Bahasa Indonesia..." />
                      </div>
                      <div style={{ paddingTop: '22px' }}>
                        {(dlg.speakers || []).length > 1 && (
                          <button onClick={() => removeSpeaker(dIdx, sIdx)}
                            style={{ background: '#FEE2E2', color: '#DC2626', border: 'none', borderRadius: '8px', padding: '8px', cursor: 'pointer', fontWeight: 'bold' }}>✕</button>
                        )}
                      </div>
                    </div>
                  ))}
                  <button onClick={() => addSpeaker(dIdx)}
                    style={{ padding: '10px', borderRadius: '10px', background: '#EDE9FE', border: '1.5px dashed #A78BFA', color: '#7C3AED', fontWeight: '700', cursor: 'pointer', fontSize: '13px' }}>
                    ➕ Tambah Giliran Bicara
                  </button>
                </div>
              </div>
            </div>
          ))}

          <button onClick={addDialogue}
            style={{ padding: '14px', borderRadius: '14px', background: '#EDE9FE', border: '2px dashed #A78BFA', color: '#7C3AED', fontWeight: '800', cursor: 'pointer', fontSize: '14px' }}>
            ➕ Tambah Kahanan Baru
          </button>
        </div>
      )}

      {/* ── TAB: KUIS MCQ ── */}
      {activeTab === 'kuis' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {quiz.map((q, idx) => (
            <div key={idx} style={{ padding: '16px', border: '1.5px solid #BBF7D0', borderRadius: '12px', background: '#F0FDF4', position: 'relative' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <label style={{ ...labelStyle, color: '#065F46' }}>Pertanyaan {idx + 1}</label>
                {quiz.length > 1 && (
                  <button onClick={() => { const nq = [...quiz]; nq.splice(idx, 1); setQuiz(nq); }}
                    style={{ background: '#EF4444', color: '#fff', border: 'none', borderRadius: '8px', padding: '6px 10px', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px' }}>Hapus</button>
                )}
              </div>
              <input style={{ ...inputStyle, marginBottom: '12px' }} value={q.question} onChange={e => handleQuizChange(idx, 'question', e.target.value)} placeholder="Tulis pertanyaan..." />

              <label style={{ ...labelStyle, color: '#065F46' }}>Pilihan Jawaban</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '12px' }}>
                {q.options.map((opt: string, optIdx: number) => (
                  <input key={optIdx} style={inputStyle} value={opt} placeholder={`Opsi ${optIdx + 1}`}
                    onChange={e => { const nOpts = [...q.options]; nOpts[optIdx] = e.target.value; handleQuizChange(idx, 'options', nOpts); }} />
                ))}
              </div>

              <label style={{ ...labelStyle, color: '#065F46' }}>✅ Jawaban Benar</label>
              <select style={{ ...inputStyle, borderColor: '#10B981', color: '#065F46', fontWeight: '700', background: '#fff' }}
                value={q.correct} onChange={e => handleQuizChange(idx, 'correct', e.target.value)}>
                <option value="" disabled>-- Pilih Jawaban Benar --</option>
                {q.options.map((opt: string, optIdx: number) => (
                  <option key={optIdx} value={opt}>{opt || `Opsi ${optIdx + 1}`}</option>
                ))}
              </select>
            </div>
          ))}
          <button onClick={() => setQuiz([...quiz, { id: `kq${Date.now()}`, question: '', options: ['', '', '', ''], correct: '' }])}
            style={{ padding: '12px', borderRadius: '12px', background: '#E5E7EB', border: 'none', fontWeight: '700', cursor: 'pointer' }}>
            ➕ Tambah Pertanyaan Kuis
          </button>
        </div>
      )}
    </div>
  );
}
