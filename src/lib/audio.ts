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
    
    // Harmonics for rich brass quality
    const oscHarmonic1 = ctx.createOscillator();
    oscHarmonic1.type = 'triangle';
    oscHarmonic1.frequency.setValueAtTime(220, now);

    const oscHarmonic2 = ctx.createOscillator();
    oscHarmonic2.type = 'sine';
    oscHarmonic2.frequency.setValueAtTime(330, now);

    // Gain nodes
    const gainBase = ctx.createGain();
    gainBase.gain.setValueAtTime(0.7, now);
    gainBase.gain.exponentialRampToValueAtTime(0.001, now + 2.5); // Resonates for 2.5s

    const gainHarmonic = ctx.createGain();
    gainHarmonic.gain.setValueAtTime(0.2, now);
    gainHarmonic.gain.exponentialRampToValueAtTime(0.001, now + 1.8);

    // Connections
    oscBase.connect(gainBase);
    oscHarmonic1.connect(gainHarmonic);
    oscHarmonic2.connect(gainHarmonic);
    
    gainBase.connect(ctx.destination);
    gainHarmonic.connect(ctx.destination);

    // Play
    oscBase.start(now);
    oscHarmonic1.start(now);
    oscHarmonic2.start(now);
    
    oscBase.stop(now + 3.0);
    oscHarmonic1.stop(now + 2.0);
    oscHarmonic2.stop(now + 2.0);
  } catch (err) {
    console.warn('Gong sound error:', err);
  }
};

// Sequences a Javanese pentatonic melody (Slendro) welcome tune
export const playWelcomeGamelan = (): void => {
  try {
    playSaronChime(440, 0, 0.5);
    playSaronChime(490, 0.25, 0.5);
    playSaronChime(550, 0.5, 0.5);
    playSaronChime(660, 0.75, 0.5);
    playSaronChime(740, 1.0, 0.6);
    playSaronChime(550, 1.25, 0.7);
    playGongResonance(1.5);
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
    const notes = [440, 490, 550, 660, 740, 660, 550, 490]; // Slendro pattern
    let index = 0;
    
    ambientInterval = setInterval(() => {
      try {
        const now = ctx.currentTime;
        const freq = notes[index];
        index = (index + 1) % notes.length;
        
        // Low warm octave
        const osc = ctx.createOscillator();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq / 2, now);
        
        const gainNode = ctx.createGain();
        gainNode.gain.setValueAtTime(0.04, now); // Quiet ambient volume
        gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 2.2);
        
        osc.connect(gainNode);
        gainNode.connect(ctx.destination);
        
        osc.start(now);
        osc.stop(now + 2.4);
      } catch (e) {}
    }, 1500); // Trigger tone every 1.5s
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
