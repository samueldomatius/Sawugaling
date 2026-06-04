'use client';

import * as actions from '@/app/actions';
import { Chapter } from '@/lib/chaptersData';

export interface StudentProfile {
  uniqueCode: string;
  name: string;
  className: string;
  xp: number;
  hearts: number;
  streak: number;
  crowns: number;
  inventory: string[];
  lastSpinTime?: string | Date | null;
}

export interface ChapterProgress {
  chapterId: number;
  materiDone: boolean;
  dhongengDone: boolean;
  lkpdScore: number | null;
  gameDone: boolean;
}

export interface ScoreLog {
  studentName: string;
  studentClass: string;
  chapterId: number;
  chapterTitle: string;
  activityType: string;
  score: number;
  maxScore: number;
  timestamp: string | Date;
}

export interface VisitorLog {
  name: string;
  className: string;
  timestamp: string | Date;
}

// Thursday Mode (Simulated Client-Side)
const DEV_THURSDAY_KEY = 'sinau_jawa_dev_thursday';

export const isThursdayMode = (): boolean => {
  if (typeof window === 'undefined') return false;
  const isSimulated = localStorage.getItem(DEV_THURSDAY_KEY) === 'true';
  const today = new Date();
  return isSimulated || today.getDay() === 4;
};

export const setSimulatedThursday = (value: boolean): void => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(DEV_THURSDAY_KEY, value ? 'true' : 'false');
  window.dispatchEvent(new Event('storage'));
};

// Authentication Methods (Client-Side wrappers)
export const getUniqueCode = () => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('unique_code');
};

export const setUniqueCode = (code: string) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem('unique_code', code);
};

export const clearStudentProfile = () => {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('unique_code');
};

// Async Wrappers mapped to Server Actions

export const getStudentProfile = async () => {
  const code = getUniqueCode();
  if (!code) return null;
  return await actions.getProfile(code);
};

export const registerStudent = async (code: string, name: string, className: string) => {
  const res = await actions.registerUser(code, name, className);
  if (res && 'error' in res && res.error) throw new Error(res.error as string);
  setUniqueCode(code);
};

export const loginStudent = async (code: string) => {
  const res = await actions.loginUser(code);
  if (res && 'error' in res && res.error) throw new Error(res.error as string);
  setUniqueCode(code);
};

export const getChapterProgress = async (chapterId: number) => {
  const code = getUniqueCode();
  if (!code) return { chapterId, materiDone: false, dhongengDone: false, lkpdScore: null, gameDone: false };
  return await actions.getChapterProgress(code, chapterId);
};

export const getAllChapterProgresses = async () => {
  const code = getUniqueCode();
  if (!code) return [];
  return await actions.getAllChapterProgress(code);
};

export const updateChapterProgress = async (chapterId: number, field: string, value: any) => {
  const code = getUniqueCode();
  if (!code) return;
  await actions.updateChapterProgress(code, chapterId, field, value);
};

export const logScore = async (chapterId: number, chapterTitle: string, activityType: 'LKPD' | 'GAME', score: number, maxScore: number) => {
  const code = getUniqueCode();
  if (!code) return;
  await actions.logScore(code, chapterId, chapterTitle, activityType, score, maxScore);
};

export const deductHeart = async () => {
  const code = getUniqueCode();
  if (code) await actions.deductHeart(code);
};

export const addXP = async (amount: number) => {
  const code = getUniqueCode();
  if (code) await actions.addXP(code, amount);
};

export const addCrown = async () => {
  const code = getUniqueCode();
  if (code) await actions.addCrown(code);
};

export const purchaseItem = async (itemName: string, price: number) => {
  const code = getUniqueCode();
  if (!code) return false;
  try {
    await actions.purchaseItem(code, itemName, price);
    return true;
  } catch (e) {
    return false;
  }
};

export const claimSpinReward = async (result: { type: 'XP' | 'HEART' | 'ZONK', value: number }) => {
  const code = getUniqueCode();
  if (code) await actions.claimSpinReward(code, result);
};

export const getChaptersList = async () => {
  return await actions.getAllChapters();
};

export interface RankInfo {
  name: string;
  title: string;
  badge: string;
  icon: string;
  color: string;
  border: string;
}

export const JAVANESE_RANKS: RankInfo[] = [
  { name: 'Murid Anyar',     title: 'Murid Anyar',     badge: '🌱', icon: '🌱', color: '#6B7280', border: '#9CA3AF' },
  { name: 'Cah Angon',       title: 'Cah Angon',       badge: '🐂', icon: '🐂', color: '#D97706', border: '#F59E0B' },
  { name: 'Siswa Teladan',   title: 'Siswa Teladan',   badge: '📚', icon: '📚', color: '#059669', border: '#10B981' },
  { name: 'Pujangga Cilik',  title: 'Pujangga Cilik',  badge: '✍️', icon: '✍️', color: '#2563EB', border: '#3B82F6' },
  { name: 'Pendekar Sastra', title: 'Pendekar Sastra', badge: '⚔️', icon: '⚔️', color: '#7C3AED', border: '#8B5CF6' },
  { name: 'Empu Jawi',       title: 'Empu Jawi',       badge: '👑', icon: '👑', color: '#B45309', border: '#D97706' },
];

export const getJavaneseRank = (xp: number): RankInfo => {
  if (xp < 100) return JAVANESE_RANKS[0];
  if (xp < 300) return JAVANESE_RANKS[1];
  if (xp < 600) return JAVANESE_RANKS[2];
  if (xp < 1000) return JAVANESE_RANKS[3];
  if (xp < 2000) return JAVANESE_RANKS[4];
  return JAVANESE_RANKS[5];
};

// Utilities

export const downloadCSV = (filename: string, headers: string[], rows: string[][]) => {
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
  ].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const playSuccessChime = () => {
  if (typeof Audio !== 'undefined') {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1760, ctx.currentTime + 0.1);
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.5);
  }
};

export const playSaronChime = (freq?: number) => {
  if (typeof Audio !== 'undefined') {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const baseFreq = freq || 523.25;
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(baseFreq, ctx.currentTime);
    osc.frequency.setValueAtTime(baseFreq * 1.25, ctx.currentTime + 0.15);
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.8);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.8);
  }
};

export const seedMockDataIfEmpty = () => {};
export const getScoreLogs = actions.getScoreLogs;
export const getVisitorLogs = actions.getVisitorLogs;
export const addCustomChapter = actions.addCustomChapter;
export const updateCustomChapter = actions.updateCustomChapter;
export const deleteCustomChapter = actions.deleteCustomChapter;
export const upsertBuiltinOverride = actions.upsertBuiltinOverride;
export const getLeaderboard = actions.getLeaderboard;
