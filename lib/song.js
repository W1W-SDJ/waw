const STORAGE_KEY = 'waw-sound';

let ctx = null;
let muted = null;

export function isMuted() {
  if (muted === null) {
    try {
      muted = localStorage.getItem(STORAGE_KEY) === 'off';
    } catch {
      muted = false;
    }
  }
  return muted;
}

export function setMuted(next) {
  muted = Boolean(next);
  try {
    localStorage.setItem(STORAGE_KEY, muted ? 'off' : 'on');
  } catch {

  }
  if (muted) stopAll();
}

export function audioSupported() {
  return typeof window !== 'undefined' && Boolean(window.AudioContext || window.webkitAudioContext);
}

function getCtx() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  }
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

const live = new Set();

function stopAll() {
  for (const node of live) {
    try {
      node.stop(0);
    } catch {

    }
  }
  live.clear();
}

const MELODY = [
  [72, 0.5], [76, 0.5], [79, 0.5], [76, 0.5],
  [81, 0.5], [79, 0.5], [76, 0.5], [74, 0.5],
  [72, 0.5], [76, 0.5], [79, 0.5], [81, 0.5],
  [79, 1.0], [76, 0.5], [72, 1.5],
];

const BEAT = 0.42;          // seconds per beat → the whole tune lands near 3.8s
const MASTER = 0.32;

const midiToFreq = (midi) => 440 * 2 ** ((midi - 69) / 12);

export function playSong() {
  if (isMuted()) return 0;
  const ac = getCtx();
  if (!ac) return null;

  const master = ac.createGain();
  master.gain.value = MASTER;
  master.connect(ac.destination);

  const tone = ac.createBiquadFilter();
  tone.type = 'lowpass';
  tone.frequency.value = 3200;
  tone.connect(master);

  const start = ac.currentTime + 0.04;
  let t = start;

  for (const [midi, len] of MELODY) {
    const dur = len * BEAT;
    voice(ac, tone, midiToFreq(midi), t, dur * 0.92, 0.5, 'triangle');
    voice(ac, tone, midiToFreq(midi + 12), t + 0.012, dur * 0.55, 0.13, 'sine');
    t += dur;
  }

  return t - ac.currentTime;
}

function voice(ac, dest, freq, when, dur, peak, type) {
  const osc = ac.createOscillator();
  const gain = ac.createGain();

  osc.type = type;
  osc.frequency.value = freq;

  gain.gain.setValueAtTime(0.0001, when);
  gain.gain.exponentialRampToValueAtTime(Math.max(peak, 0.0002), when + 0.012);
  gain.gain.exponentialRampToValueAtTime(0.0001, when + Math.max(dur, 0.05));

  osc.connect(gain);
  gain.connect(dest);

  live.add(osc);
  osc.onended = () => {
    live.delete(osc);
    gain.disconnect();
  };

  osc.start(when);
  osc.stop(when + dur + 0.03);
}