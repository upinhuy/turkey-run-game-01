// audio.js — all sound is synthesized live with the Web Audio API; no audio
// files are loaded. Every effect is a small oscillator/noise recipe so the
// game stays a handful of static files with zero network requests.
export function createAudio() {
  let ctx = null;
  let muted = false;
  let master = null;

  function ensure() {
    if (!ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return null;
      ctx = new AudioCtx();
      master = ctx.createGain();
      master.gain.value = 0.35;
      master.connect(ctx.destination);
    }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }

  function tone(freq, duration, type, volume, slideTo) {
    if (muted) return;
    const c = ensure();
    if (!c) return;
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.type = type || 'sine';
    osc.frequency.setValueAtTime(freq, c.currentTime);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, c.currentTime + duration);
    gain.gain.setValueAtTime(volume || 0.5, c.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + duration);
    osc.connect(gain);
    gain.connect(master);
    osc.start();
    osc.stop(c.currentTime + duration);
  }

  function noiseBurst(duration, volume, lowpass) {
    if (muted) return;
    const c = ensure();
    if (!c) return;
    const len = Math.floor(c.sampleRate * duration);
    const buffer = c.createBuffer(1, len, c.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = c.createBufferSource();
    src.buffer = buffer;
    const filter = c.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = lowpass || 1200;
    const gain = c.createGain();
    gain.gain.value = volume || 0.4;
    src.connect(filter);
    filter.connect(gain);
    gain.connect(master);
    src.start();
  }

  return {
    unlock() {
      ensure();
    },
    toggleMute() {
      muted = !muted;
      return muted;
    },
    isMuted() {
      return muted;
    },
    // The turkey's gobble: two quick descending clucks.
    gobble() {
      tone(520, 0.09, 'square', 0.25, 300);
      setTimeout(() => tone(460, 0.1, 'square', 0.25, 260), 90);
    },
    jump() {
      tone(280, 0.16, 'sine', 0.35, 620);
    },
    pickup() {
      tone(880, 0.08, 'triangle', 0.4);
      setTimeout(() => tone(1320, 0.12, 'triangle', 0.4), 70);
    },
    drumstick() {
      [523, 659, 784, 1047].forEach((f, i) => setTimeout(() => tone(f, 0.14, 'triangle', 0.4), i * 80));
    },
    hurt() {
      noiseBurst(0.25, 0.5, 900);
      tone(180, 0.3, 'sawtooth', 0.35, 90);
    },
    // A rising two-note alarm when the farmer gets dangerously close.
    alarm() {
      tone(740, 0.12, 'square', 0.22);
      setTimeout(() => tone(988, 0.14, 'square', 0.22), 120);
    },
    caught() {
      [392, 330, 262, 196].forEach((f, i) => setTimeout(() => tone(f, 0.25, 'sawtooth', 0.35), i * 160));
    },
    escaped() {
      [523, 659, 784, 1047, 1319].forEach((f, i) => setTimeout(() => tone(f, 0.22, 'triangle', 0.4), i * 110));
    },
    click() {
      tone(660, 0.06, 'triangle', 0.3);
    },
  };
}
