'use client';

import React, { useState } from 'react';
import { registerStudent, loginStudent } from '@/lib/db';

interface RegisterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function RegisterModal({ isOpen, onClose, onSuccess }: RegisterModalProps) {
  const [mode, setMode] = useState<'login' | 'register'>('register');
  const [name, setName] = useState('');
  const [className, setClassName] = useState('4A');
  const [uniqueCode, setUniqueCode] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uniqueCode.trim()) {
      alert('Sandi Rahasia kudu diisi!');
      return;
    }

    setLoading(true);
    try {
      if (mode === 'register') {
        if (!name.trim()) {
          alert('Nuwun sewu, asma panjenengan kudu diisi!');
          setLoading(false);
          return;
        }
        await registerStudent(uniqueCode.trim(), name.trim(), className);
      } else {
        await loginStudent(uniqueCode.trim());
      }
      onSuccess();
      onClose();
    } catch (error: any) {
      alert(error.message || 'Ana kesalahan, coba maneh.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
          <button 
            type="button" 
            className={`btn-duo ${mode === 'register' ? 'btn-duo-primary' : 'btn-duo-secondary'}`}
            onClick={() => setMode('register')}
            style={{ flex: 1, padding: '8px', fontSize: '13px' }}
          >Daftar Anyar</button>
          <button 
            type="button" 
            className={`btn-duo ${mode === 'login' ? 'btn-duo-primary' : 'btn-duo-secondary'}`}
            onClick={() => setMode('login')}
            style={{ flex: 1, padding: '8px', fontSize: '13px' }}
          >Masuk (Login)</button>
        </div>

        <h2 className="modal-title">{mode === 'register' ? 'Daftar Murid Anyar' : 'Sugeng Rawuh Maneh'}</h2>
        <p className="modal-desc" style={{ marginBottom: '16px' }}>
          {mode === 'register' 
            ? 'Gawe Sandi Rahasia (password) supaya data profilmu aman lan bisa dibuka ing HP liya.' 
            : 'Lebokna Sandi Rahasia (password) sing wis mbok gawe sadurunge.'}
        </p>
        
        <form onSubmit={handleSubmit}>
          {mode === 'register' && (
            <>
              <div className="form-group">
                <label className="form-label" htmlFor="student-name">Asma Lengkap (Nama)</label>
                <input
                  id="student-name"
                  type="text"
                  className="form-control"
                  placeholder="Tuladhane: Rudi Hermawan"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required={mode === 'register'}
                />
              </div>
              
              <div className="form-group">
                <label className="form-label" htmlFor="student-class">Kelas</label>
                <select
                  id="student-class"
                  className="form-control"
                  value={className}
                  onChange={(e) => setClassName(e.target.value)}
                  required={mode === 'register'}
                >
                  <option value="4A">Kelas 4A</option>
                  <option value="4B">Kelas 4B</option>
                  <option value="5A">Kelas 5A</option>
                  <option value="5B">Kelas 5B</option>
                </select>
              </div>
            </>
          )}

          <div className="form-group">
            <label className="form-label" htmlFor="unique-code">Sandi Rahasia (Password)</label>
            <input
              id="unique-code"
              type="text"
              className="form-control"
              placeholder="Tuladhane: KUCINGLUCU123"
              value={uniqueCode}
              onChange={(e) => setUniqueCode(e.target.value)}
              required
              style={{ textTransform: 'uppercase', fontWeight: 'bold' }}
            />
          </div>
          
          <button 
            type="submit" 
            className="btn-duo btn-duo-primary" 
            style={{ width: '100%', marginTop: '16px', justifyContent: 'center' }}
            disabled={loading}
          >
            {loading ? 'Sabar...' : (mode === 'register' ? 'Gawe Akun ➔' : 'Mlebu ➔')}
          </button>
        </form>
      </div>
    </div>
  );
}
