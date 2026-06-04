let audioCtx: AudioContext | null = null;
let ambientInterval: any = null;

const getAudioContext = (): AudioContext => {
  if (typeof window === 'undefined') {
    throw new Error('AudioContext can only be initialized in browser environment');
  }
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
};

// Play a bright metallic Javanese Gamelan "Saron" bell chime
export const playSaronChime = (freqOverride?: number, timeOffset: number = 0, duration: number = 0.4): void => {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime + timeOffset;
    
    // Fundamental frequency
    const fundFreq = freqOverride || 880; 
    
    // Triangle oscillator for soft metallic bell timbre
    const osc1 = ctx.createOscillator();
    osc1.type = 'triangle';
    osc1.frequency.setValueAtTime(fundFreq, now);
    
    // Sine oscillator for metallic overtones
    const osc2 = ctx.createOscillator();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(fundFreq * 2.5, now);

    const gainNode = ctx.createGain();
    gainNode.gain.setValueAtTime(0.4, now);
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + duration);

    const overtoneGain = ctx.createGain();
    overtoneGain.gain.setValueAtTime(0.15, now);
    overtoneGain.gain.exponentialRampToValueAtTime(0.001, now + duration * 0.75);

    osc1.connect(gainNode);
    osc2.connect(overtoneGain);
    
    gainNode.connect(ctx.destination);
    overtoneGain.connect(ctx.destination);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + duration + 0.1);
    osc2.stop(now + duration);
  } catch (err) {
    console.warn('Audio play blocked or failed:', err);
  }
};

// Play a deep, resonant traditional Gamelan "Gong" sound
export const playGongResonance = (timeOffset: number = 0): void => {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime + timeOffset;
    
    // Deep fundamental tone of Javanese Gong (110Hz - A2)
    const oscBase = ctx.createOscillator();
    oscBase.type = 'sine';
    oscBase.frequency.setValueAtTime(110, now);
    
    // Ombak (Characteristic Javanese Gong beating frequency)
    const oscOmbak = ctx.createOscillator();
    oscOmbak.type = 'sine';
    oscOmbak.frequency.setValueAtTime(111.5, now); // 1.5Hz beat effect
    
    // Harmonics for rich brass quality
    const oscHarmonic1 = ctx.createOscillator();
    oscHarmonic1.type = 'triangle';
    oscHarmonic1.frequency.setValueAtTime(220, now);

    const oscHarmonic2 = ctx.createOscillator();
    oscHarmonic2.type = 'sine';
    oscHarmonic2.frequency.setValueAtTime(330, now);

    // Gain nodes
    const gainBase = ctx.createGain();
    gainBase.gain.setValueAtTime(0.6, now);
    gainBase.gain.exponentialRampToValueAtTime(0.001, now + 3.5); // Long resonance

    const gainHarmonic = ctx.createGain();
    gainHarmonic.gain.setValueAtTime(0.15, now);
    gainHarmonic.gain.exponentialRampToValueAtTime(0.001, now + 2.0);

    // Connections
    oscBase.connect(gainBase);
    oscOmbak.connect(gainBase);
    oscHarmonic1.connect(gainHarmonic);
    oscHarmonic2.connect(gainHarmonic);
    
    gainBase.connect(ctx.destination);
    gainHarmonic.connect(ctx.destination);

    // Play
    oscBase.start(now);
    oscOmbak.start(now);
    oscHarmonic1.start(now);
    oscHarmonic2.start(now);
    
    oscBase.stop(now + 4.0);
    oscOmbak.stop(now + 4.0);
    oscHarmonic1.stop(now + 2.2);
    oscHarmonic2.stop(now + 2.2);
  } catch (err) {
    console.warn('Gong sound error:', err);
  }
};

// Sequences a Javanese pentatonic melody (Slendro) welcome tune
export const playWelcomeGamelan = (): void => {
  try {
    // Demung/Saron Melody (Balungan)
    playSaronChime(550, 0.0, 0.6);
    playSaronChime(660, 0.3, 0.6);
    playSaronChime(740, 0.6, 0.6);
    playSaronChime(660, 0.9, 0.6);
    playSaronChime(550, 1.2, 0.6);
    playSaronChime(490, 1.5, 0.6);
    playSaronChime(440, 1.8, 1.2);
    
    // Bonang Interlocking (Faster higher octave)
    playSaronChime(1100, 0.15, 0.3);
    playSaronChime(1320, 0.45, 0.3);
    playSaronChime(1480, 0.75, 0.3);
    playSaronChime(1320, 1.05, 0.3);
    playSaronChime(1100, 1.35, 0.3);
    
    // Kenong (Punctuation on beats)
    playSaronChime(275, 0.6, 1.5);
    playSaronChime(220, 1.8, 1.5);

    // Final Grand Gong
    playGongResonance(1.8);
  } catch (err) {
    console.warn('Welcome gamelan sequence error:', err);
  }
};

// Play soft ambient looping gamelan (offline, Web Audio synthesized)
export const startAmbientGamelan = (): void => {
  if (typeof window === 'undefined') return;
  if (ambientInterval) return;
  
  try {
    const ctx = getAudioContext();
    // Slendro scales for ensemble
    const balungan = [440, 490, 550, 660, 740, 660, 550, 490]; 
    const peking = [880, 980, 1100, 1320, 1480]; 
    let tick = 0;
    
    ambientInterval = setInterval(() => {
      try {
        const now = ctx.currentTime;
        
        // Balungan (Main melody) plays every 2 ticks
        if (tick % 2 === 0) {
          const bFreq = balungan[(tick / 2) % balungan.length];
          const osc1 = ctx.createOscillator();
          osc1.type = 'triangle';
          osc1.frequency.setValueAtTime(bFreq / 2, now); // Demung register
          const gain1 = ctx.createGain();
          gain1.gain.setValueAtTime(0.05, now); // Ambient volume
          gain1.gain.exponentialRampToValueAtTime(0.0001, now + 2.5);
          osc1.connect(gain1); gain1.connect(ctx.destination);
          osc1.start(now); osc1.stop(now + 2.6);
        }
        
        // Peking/Bonang (Fast interlocking) plays every tick
        const pFreq = peking[tick % peking.length];
        const osc2 = ctx.createOscillator();
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(pFreq, now);
        const gain2 = ctx.createGain();
        gain2.gain.setValueAtTime(0.015, now);
        gain2.gain.exponentialRampToValueAtTime(0.0001, now + 0.8);
        osc2.connect(gain2); gain2.connect(ctx.destination);
        osc2.start(now); osc2.stop(now + 1.0);
        
        // Distant Gong every 16 ticks
        if (tick > 0 && tick % 16 === 0) {
           const oscGong = ctx.createOscillator();
           oscGong.type = 'sine';
           oscGong.frequency.setValueAtTime(55, now); // Very low sub-gong
           const gainGong = ctx.createGain();
           gainGong.gain.setValueAtTime(0.25, now);
           gainGong.gain.exponentialRampToValueAtTime(0.0001, now + 4.0);
           oscGong.connect(gainGong); gainGong.connect(ctx.destination);
           oscGong.start(now); oscGong.stop(now + 4.2);
        }

        tick++;
      } catch (e) {}
    }, 750); // Faster tempo for ensemble feel (750ms per tick)
  } catch (err) {
    console.warn('Ambient Gamelan error:', err);
  }
};

export const stopAmbientGamelan = (): void => {
  if (ambientInterval) {
    clearInterval(ambientInterval);
    ambientInterval = null;
  }
};

// Play a low flat buzz sound for errors
export const playErrorChime = (): void => {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;
    
    const osc = ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(150, now);
    
    const gainNode = ctx.createGain();
    gainNode.gain.setValueAtTime(0.3, now);
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
    
    osc.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    osc.start(now);
    osc.stop(now + 0.3);
  } catch (err) {
    console.warn('Error audio failed:', err);
  }
};

// Play a Javanese saron tick sound for wheel rotations
export const playSpinTick = (): void => {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, now);
    const gainNode = ctx.createGain();
    gainNode.gain.setValueAtTime(0.08, now);
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
    osc.connect(gainNode);
    gainNode.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.06);
  } catch (e) {}
};

// Play a bright gamelan success level up fanfare
export const playSuccessChime = (): void => {
  try {
    playSaronChime(523, 0, 0.3); // C5
    playSaronChime(659, 0.15, 0.3); // E5
    playSaronChime(784, 0.3, 0.3); // G5
    playSaronChime(1046, 0.45, 0.5); // C6
    playGongResonance(0.5);
  } catch (e) {}
};

// Narrate text using Web Speech synthesis with Indonesian/Javanese settings
export const speakJavaneseText = (text: string): void => {
  if (typeof window === 'undefined' || !window.speechSynthesis) {
    console.warn('Speech synthesis not supported in this browser.');
    return;
  }
  
  window.speechSynthesis.cancel();
  
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'id-ID';
  utterance.rate = 0.85; 
  utterance.pitch = 0.95; 
  
  const voices = window.speechSynthesis.getVoices();
  const idVoice = voices.find(v => v.lang.includes('ID') || v.lang.includes('id'));
  if (idVoice) {
    utterance.voice = idVoice;
  }
  
  window.speechSynthesis.speak(utterance);
};

export const stopSpeech = (): void => {
  if (typeof window !== 'undefined' && window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }
};
