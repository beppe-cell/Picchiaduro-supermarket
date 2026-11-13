/* ============================================================
   PIXEL FURY — audio.js
   Web Audio API: SFX sintetizzati + musiche chiptune sequenziate.
   Nessun file audio esterno. Volume musica/SFX salvati in localStorage.
   ============================================================ */

window.PF = window.PF || {};

(function () {
  'use strict';

  let actx = null;
  let masterGain = null, musicGain = null, sfxGain = null;
  let noiseBuffer = null;

  // Stato volumi (0..1)
  const settings = {
    music: 0.7,
    sfx: 0.8,
    touch: 'auto',
    vibra: true
  };

  function loadSettings() {
    try {
      const raw = localStorage.getItem('pixelfury.settings');
      if (raw) Object.assign(settings, JSON.parse(raw));
    } catch (e) { /* storage non disponibile */ }
  }

  function saveSettings() {
    try { localStorage.setItem('pixelfury.settings', JSON.stringify(settings)); } catch (e) {}
  }

  function init() {
    if (actx) return;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    actx = new AC();
    masterGain = actx.createGain();
    masterGain.connect(actx.destination);
    musicGain = actx.createGain();
    sfxGain = actx.createGain();
    musicGain.connect(masterGain);
    sfxGain.connect(masterGain);
    applyVolumes();

    // buffer di rumore bianco riutilizzabile
    const len = actx.sampleRate * 0.5;
    noiseBuffer = actx.createBuffer(1, len, actx.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
  }

  function resume() {
    init();
    if (actx && actx.state === 'suspended') actx.resume();
  }

  function applyVolumes() {
    if (!actx) return;
    musicGain.gain.value = settings.music * 0.5;
    sfxGain.gain.value = settings.sfx * 0.9;
  }

  // ---------------- Primitive di sintesi ----------------

  function tone(freq, dur, type, vol, slideTo, when) {
    if (!actx) return;
    const t = (when || actx.currentTime);
    const o = actx.createOscillator();
    const g = actx.createGain();
    o.type = type || 'square';
    o.frequency.setValueAtTime(freq, t);
    if (slideTo) o.frequency.exponentialRampToValueAtTime(Math.max(slideTo, 1), t + dur);
    g.gain.setValueAtTime(vol || 0.3, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    o.connect(g); g.connect(sfxGain);
    o.start(t); o.stop(t + dur + 0.02);
  }

  function noise(dur, vol, filterFreq, when, q) {
    if (!actx) return;
    const t = (when || actx.currentTime);
    const src = actx.createBufferSource();
    src.buffer = noiseBuffer;
    const f = actx.createBiquadFilter();
    f.type = 'lowpass';
    f.frequency.value = filterFreq || 1200;
    if (q) f.Q.value = q;
    const g = actx.createGain();
    g.gain.setValueAtTime(vol || 0.3, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    src.connect(f); f.connect(g); g.connect(sfxGain);
    src.start(t); src.stop(t + dur + 0.02);
  }

  // ---------------- SFX ----------------

  const SFX = {
    punch()      { noise(0.09, 0.5, 2400); tone(180, 0.08, 'square', 0.25, 60); },
    heavy()      { noise(0.16, 0.65, 1400); tone(120, 0.16, 'square', 0.4, 40); tone(60, 0.2, 'sine', 0.5, 30); },
    kick()       { noise(0.12, 0.55, 1800); tone(150, 0.1, 'square', 0.3, 50); },
    hit()        { noise(0.1, 0.6, 900); tone(90, 0.12, 'sawtooth', 0.35, 35); },
    block()      { noise(0.06, 0.3, 5000); tone(700, 0.05, 'square', 0.15, 500); },
    whoosh()     { noise(0.12, 0.2, 3000); },
    jump()       { tone(220, 0.12, 'square', 0.15, 440); },
    land()       { noise(0.06, 0.2, 600); },
    specialFire(){ noise(0.4, 0.5, 900); tone(300, 0.35, 'sawtooth', 0.3, 80); },
    specialDash(){ noise(0.25, 0.4, 4500); tone(900, 0.2, 'square', 0.2, 200); },
    specialSlam(){ tone(70, 0.4, 'sine', 0.7, 25); noise(0.4, 0.6, 500); },
    specialVolt(){ for (let i = 0; i < 5; i++) tone(1200 + Math.random() * 900, 0.05, 'square', 0.18, 400, actx.currentTime + i * 0.04); noise(0.25, 0.3, 6000); },
    ko()         { tone(160, 0.6, 'sawtooth', 0.5, 30); noise(0.5, 0.7, 700); },
    menuMove()   { tone(500, 0.05, 'square', 0.15); },
    menuSelect() { tone(660, 0.08, 'square', 0.2); tone(990, 0.1, 'square', 0.15, 990, actx.currentTime + 0.07); },
    roundStart() { tone(440, 0.12, 'square', 0.25); tone(660, 0.18, 'square', 0.25, 660, actx.currentTime + 0.12); },
    fight()      { tone(330, 0.1, 'square', 0.3); tone(494, 0.1, 'square', 0.3, 494, actx.currentTime + 0.1); tone(660, 0.25, 'square', 0.35, 660, actx.currentTime + 0.2); },
    win()        { [523, 659, 784, 1046].forEach((f, i) => tone(f, 0.18, 'square', 0.25, f, actx.currentTime + i * 0.13)); },
    lose()       { [392, 330, 262, 196].forEach((f, i) => tone(f, 0.24, 'sawtooth', 0.22, f, actx.currentTime + i * 0.16)); },
    countTick()  { tone(880, 0.05, 'square', 0.2); }
  };

  function sfx(name) {
    if (!actx || !SFX[name]) return;
    try { SFX[name](); } catch (e) { /* audio non disponibile */ }
  }

  // ---------------- Musica (sequencer chiptune) ----------------

  // note in semitoni da A2 (110Hz); null = pausa
  const N = s => (s === null ? null : 110 * Math.pow(2, s / 12));

  const SONGS = {
    menu: {
      bpm: 112, steps: 32,
      bass:  [0, null, null, null, 0, null, 3, null, 5, null, null, null, 3, null, null, null,
              -2, null, null, null, -2, null, 1, null, 3, null, null, null, null, null, null, null],
      lead:  [12, null, 15, null, 19, null, 15, null, 17, null, 15, null, 12, null, null, null,
              10, null, 13, null, 17, null, 13, null, 15, null, null, null, null, null, null, null],
      hat:   [1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 1]
    },
    battle: {
      bpm: 150, steps: 32,
      bass:  [0, 0, null, 0, 3, null, 0, null, 5, 5, null, 5, 3, null, 2, null,
              0, 0, null, 0, 3, null, 0, null, 8, null, 7, null, 5, null, 3, null],
      lead:  [12, null, 15, 12, 17, null, 15, null, 19, null, 17, 15, 17, null, 15, null,
              12, null, 15, 12, 19, null, 20, null, 22, null, 20, 19, 17, null, 15, null],
      hat:   [1, 0, 1, 1, 1, 0, 1, 1, 1, 0, 1, 1, 1, 0, 1, 1, 1, 0, 1, 1, 1, 0, 1, 1, 1, 0, 1, 1, 1, 1, 1, 1]
    }
  };

  let currentSong = null;
  let schedulerTimer = null;
  let nextStepTime = 0;
  let step = 0;

  function noteFreq(semi) { return 110 * Math.pow(2, semi / 12); }

  function playStep(song, s, t) {
    const stepDur = 60 / song.bpm / 4;

    const b = song.bass[s % song.bass.length];
    if (b !== null) {
      const o = actx.createOscillator(), g = actx.createGain();
      o.type = 'triangle';
      o.frequency.value = noteFreq(b);
      g.gain.setValueAtTime(0.35, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + stepDur * 1.8);
      o.connect(g); g.connect(musicGain);
      o.start(t); o.stop(t + stepDur * 2);
    }

    const l = song.lead[s % song.lead.length];
    if (l !== null) {
      const o = actx.createOscillator(), g = actx.createGain();
      o.type = 'square';
      o.frequency.value = noteFreq(l);
      g.gain.setValueAtTime(0.12, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + stepDur * 1.4);
      o.connect(g); g.connect(musicGain);
      o.start(t); o.stop(t + stepDur * 1.6);
    }

    if (song.hat[s % song.hat.length]) {
      const src = actx.createBufferSource();
      src.buffer = noiseBuffer;
      const f = actx.createBiquadFilter();
      f.type = 'highpass';
      f.frequency.value = 7000;
      const g = actx.createGain();
      g.gain.setValueAtTime(0.08, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.04);
      src.connect(f); f.connect(g); g.connect(musicGain);
      src.start(t); src.stop(t + 0.06);
    }
  }

  function scheduler() {
    if (!actx || !currentSong) return;
    const stepDur = 60 / currentSong.bpm / 4;
    while (nextStepTime < actx.currentTime + 0.15) {
      playStep(currentSong, step, nextStepTime);
      nextStepTime += stepDur;
      step = (step + 1) % currentSong.steps;
    }
  }

  function music(name) {
    init();
    if (!actx) return;
    if (currentSong === SONGS[name]) return;
    currentSong = SONGS[name] || null;
    step = 0;
    nextStepTime = actx.currentTime + 0.05;
    if (schedulerTimer) clearInterval(schedulerTimer);
    if (currentSong) schedulerTimer = setInterval(scheduler, 40);
  }

  function stopMusic() {
    currentSong = null;
    if (schedulerTimer) { clearInterval(schedulerTimer); schedulerTimer = null; }
  }

  // ---------------- API ----------------

  PF.AUDIO = {
    init, resume, sfx, music, stopMusic,
    get settings() { return settings; },
    setVolume(kind, v) {
      settings[kind] = v;
      applyVolumes();
      saveSettings();
    },
    setTouchMode(mode) { settings.touch = mode; saveSettings(); },
    setVibra(v) { settings.vibra = !!v; saveSettings(); },
    loadSettings
  };
})();
