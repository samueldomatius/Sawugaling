'use client';

const TEACHER_SESSION_KEY = 'sinau_jawa_guru_session';
// Simple password - in a real app this would be server-side
// Teachers can change this in their school's config
const TEACHER_PASSWORD = 'guru123';

export const loginTeacher = (password: string): boolean => {
  if (password === TEACHER_PASSWORD) {
    sessionStorage.setItem(TEACHER_SESSION_KEY, 'true');
    return true;
  }
  return false;
};

export const logoutTeacher = (): void => {
  sessionStorage.removeItem(TEACHER_SESSION_KEY);
};

export const isTeacherLoggedIn = (): boolean => {
  if (typeof window === 'undefined') return false;
  return sessionStorage.getItem(TEACHER_SESSION_KEY) === 'true';
};
