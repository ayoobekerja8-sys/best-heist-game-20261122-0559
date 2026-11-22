const AudioCtor = typeof window !== 'undefined' ? window.AudioContext || window.webkitAudioContext : null;

let ctx = null;
let master = null;
let ready = false;
let failed = false;
let muted = false;

function ensure() {
  if (ready || failed) return ready;
  if (!AudioCtor) {
    failed = true;
    return false;
  }
  try {
    ctx = new AudioCtor();
    master = ctx.createGain();
    master.gain.value = 0.32;
    master.connect(ctx.destination);
    ready = true;
    return true;
  } catch (err) {
    failed = true;
    return false;
  }
}

export function initAudio() {
  if (!ensure()) return false;
  try {
    if (ctx.state === 'suspended') ctx.resume();
  } catch (err) {
    /* ignored: audio is optional */
  }
  return true;
}

export function isAudioReady() {
  return ready && !muted;
}

export function toggleMute() {
  muted = !muted;
  if (master) {
    try {
      master.gain.value = muted ? 0 : 0.32;
    } catch (err) {
      /* ignored */
    }
  }
  return muted;
}

export function isMuted() {
  return muted;
}

function tone(opts) {
  if (!ensure() || muted) return;
  const { freq = 440, type = 'sine', dur = 0.2, gain = 0.2, attack = 0.008, decay = 0.12, slide = 0, delay = 0, detune = 0 } = opts || {};
  try {
    const t0 = ctx.currentTime + delay;
    const osc = ctx.createOscillator();
    const env = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(Math.max(20, freq), t0);
    if (slide !== 0) osc.frequency.exponentialRampToValueAtTime(Math.max(20, freq + slide), t0 + dur);
    if (detune) osc.detune.setValueAtTime(detune, t0);
    env.gain.setValueAtTime(0.0001, t0);
    env.gain.exponentialRampToValueAtTime(Math.max(0.0002, gain), t0 + attack);
    env.gain.exponentialRampToValueAtTime(0.0001, t0 + Math.max(attack + 0.01, dur + decay));
    osc.connect(env);
    env.connect(master);
    osc.start(t0);
    osc.stop(t0 + dur + decay + 0.05);
  } catch (err) {
    /* ignored */
  }
}

function noiseBurst(opts) {
  if (!ensure() || muted) return;
  const { dur = 0.12, gain = 0.14, delay = 0, freq = 900, q = 1.2, type = 'bandpass' } = opts || {};
  try {
    const t0 = ctx.currentTime + delay;
    const frames = Math.max(1, Math.floor(ctx.sampleRate * dur));
    const buffer = ctx.createBuffer(1, frames, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < frames; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / frames);
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    const filter = ctx.createBiquadFilter();
    filter.type = type;
    filter.frequency.value = freq;
    filter.Q.value = q;
    const env = ctx.createGain();
    env.gain.setValueAtTime(gain, t0);
    env.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    src.connect(filter);
    filter.connect(env);
    env.connect(master);
    src.start(t0);
  } catch (err) {
    /* ignored */
  }
}

export function playPickup(value = 1) {
  const base = value >= 4000 ? 660 : 520;
  tone({ freq: base, type: 'triangle', dur: 0.1, gain: 0.16 });
  tone({ freq: base * 1.5, type: 'triangle', dur: 0.12, gain: 0.13, delay: 0.07 });
  tone({ freq: base * 2, type: 'sine', dur: 0.2, gain: 0.1, delay: 0.14 });
  if (value >= 4000) tone({ freq: base * 2.5, type: 'sine', dur: 0.35, gain: 0.09, delay: 0.24 });
}

export function playFootstep(intensity = 1) {
  noiseBurst({ dur: 0.06, gain: 0.06 * intensity, freq: 420, q: 0.8, type: 'lowpass' });
  tone({ freq: 88, type: 'sine', dur: 0.04, gain: 0.05 * intensity });
}

export function playAlarm() {
  tone({ freq: 740, type: 'square', dur: 0.16, gain: 0.07 });
  tone({ freq: 560, type: 'square', dur: 0.16, gain: 0.07, delay: 0.18 });
}

export function playHeartbeat() {
  tone({ freq: 62, type: 'sine', dur: 0.09, gain: 0.2 });
  tone({ freq: 54, type: 'sine', dur: 0.11, gain: 0.15, delay: 0.16 });
}

export function playWin() {
  const notes = [523.25, 659.25, 783.99, 1046.5];
  notes.forEach((f, i) => tone({ freq: f, type: 'triangle', dur: 0.18, gain: 0.13, delay: i * 0.13 }));
  tone({ freq: 1567.98, type: 'sine', dur: 0.5, gain: 0.08, delay: 0.55 });
}

export function playLose() {
  tone({ freq: 320, type: 'sawtooth', dur: 0.28, gain: 0.12, slide: -170 });
  tone({ freq: 200, type: 'sawtooth', dur: 0.5, gain: 0.1, delay: 0.22, slide: -110 });
  noiseBurst({ dur: 0.4, gain: 0.07, freq: 220, type: 'lowpass' });
}

export function playClick() {
  tone({ freq: 880, type: 'square', dur: 0.04, gain: 0.06 });
}

export function playCoin() {
  tone({ freq: 1180, type: 'triangle', dur: 0.06, gain: 0.1 });
  tone({ freq: 1560, type: 'triangle', dur: 0.09, gain: 0.08, delay: 0.05 });
  noiseBurst({ dur: 0.05, gain: 0.03, freq: 3200, q: 3 });
}

export function playLockpick() {
  noiseBurst({ dur: 0.05, gain: 0.06, freq: 2400, q: 4 });
  tone({ freq: 1400, type: 'square', dur: 0.03, gain: 0.03 });
}

export function playEmp() {
  tone({ freq: 1200, type: 'sawtooth', dur: 0.4, gain: 0.1, slide: -1000 });
  noiseBurst({ dur: 0.3, gain: 0.08, freq: 1600, q: 0.6 });
}

export function playDistract() {
  tone({ freq: 1320, type: 'sine', dur: 0.08, gain: 0.07 });
  tone({ freq: 990, type: 'sine', dur: 0.1, gain: 0.06, delay: 0.09 });
}

export function playAlertSting() {
  tone({ freq: 880, type: 'square', dur: 0.1, gain: 0.09 });
  tone({ freq: 660, type: 'square', dur: 0.14, gain: 0.08, delay: 0.12 });
}
