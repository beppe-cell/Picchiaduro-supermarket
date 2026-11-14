/* ============================================================
   PIXEL FURY — animations.js
   Dati di animazione: pose scheletriche frame-by-frame.
   Ogni pose è parametrica rispetto all'ancora dell'anca (hip).
   Coordinate: x avanti (facing destro), y positivo verso il basso.
   Le mani della guardia stanno a altezza mento/petto (posa 3/4
   da picchiaduro classico); `face` guida l'espressione del viso.
   ============================================================ */

window.PF = window.PF || {};

(function () {
  'use strict';

  // Helper: clona una pose e applica override
  function P(base, over) {
    const p = Object.assign({}, base);
    if (over) {
      for (const k in over) {
        if (Array.isArray(over[k])) p[k] = over[k].slice();
        else p[k] = over[k];
      }
    }
    return p;
  }

  // Guardia da boxe: pugni a mento (F) e petto (B), gomiti piegati
  const GUARD_F = [8, -4];
  const GUARD_B = [3, -1];

  // ---------------- Pose base ----------------

  const IDLE_BASE = {
    hipY: 34, lean: 1, headX: 0, headY: 0,
    handF: GUARD_F.slice(), elbowF: 2,
    handB: GUARD_B.slice(), elbowB: -2,
    footF: [6, 22], kneeF: 1,
    footB: [-6, 22], kneeB: -1,
    flat: false, extra: null, face: 'calm'
  };

  const POSES = {};

  // --- IDLE (respiro, 4 frame) ---
  POSES.idle = [
    P(IDLE_BASE),
    P(IDLE_BASE, { hipY: 35, handF: [8, -3], handB: [2, 0] }),
    P(IDLE_BASE, { hipY: 35, headY: -1, handF: [8, -3], handB: [2, 0] }),
    P(IDLE_BASE, { headY: -1 })
  ];

  // --- WALK (6 frame) ---
  POSES.walk = [
    P(IDLE_BASE, { footF: [8, 20], footB: [-8, 22], handF: [7, -9], handB: [1, -4] }),
    P(IDLE_BASE, { footF: [5, 22], footB: [-5, 22], handF: [8, -10], handB: [3, -5] }),
    P(IDLE_BASE, { footF: [1, 24], footB: [-1, 21], handF: [9, -10], handB: [5, -6] }),
    P(IDLE_BASE, { footF: [-6, 22], footB: [7, 20], handF: [10, -10], handB: [7, -5] }),
    P(IDLE_BASE, { footF: [-4, 22], footB: [5, 22], handF: [9, -9], handB: [5, -4] }),
    P(IDLE_BASE, { footF: [0, 21], footB: [1, 24], handF: [9, -9], handB: [4, -5] })
  ];

  // --- RUN (6 frame) ---
  POSES.run = [
    P(IDLE_BASE, { lean: 4, footF: [12, 16], footB: [-12, 24], handF: [12, -14], handB: [-8, 0] }),
    P(IDLE_BASE, { lean: 4, footF: [10, 22], footB: [-8, 20], handF: [11, -12], handB: [-5, -2] }),
    P(IDLE_BASE, { lean: 5, footF: [2, 24], footB: [-2, 18], handF: [10, -10], handB: [-2, -4] }),
    P(IDLE_BASE, { lean: 4, footF: [-10, 24], footB: [12, 16], handF: [8, -6], handB: [6, -12] }),
    P(IDLE_BASE, { lean: 4, footF: [-7, 20], footB: [9, 22], handF: [9, -8], handB: [3, -10] }),
    P(IDLE_BASE, { lean: 5, footF: [-1, 18], footB: [2, 24], handF: [10, -10], handB: [0, -5] })
  ];

  // --- JUMP (3 frame: salita, apice, discesa) ---
  POSES.jump = [
    P(IDLE_BASE, { footF: [5, 12], kneeF: 1, footB: [-4, 10], kneeB: -1, handF: [8, -16], handB: [-2, -10] }),
    P(IDLE_BASE, { footF: [4, 14], footB: [-3, 12], handF: [10, -12], handB: [0, -8] }),
    P(IDLE_BASE, { footF: [6, 18], footB: [-4, 16], handF: [10, -6], handB: [2, -2] })
  ];

  // --- CROUCH (2 frame) ---
  POSES.crouch = [
    P(IDLE_BASE, { hipY: 44, headY: 2, handF: [8, -8], handB: [3, -5], footF: [6, 12], footB: [-6, 12], kneeF: 2, kneeB: -2 }),
    P(IDLE_BASE, { hipY: 45, headY: 2, handF: [8, -8], handB: [3, -5], footF: [6, 11], footB: [-6, 11], kneeF: 2, kneeB: -2 })
  ];

  // --- PUNCH leggero (3 frame) ---
  POSES.punch = [
    P(IDLE_BASE, { lean: -1, handF: [2, -7], handB: [-2, -4] }),
    P(IDLE_BASE, { lean: 4, handF: [19, -7], elbowF: 0, handB: [0, -4], face: 'strain' }),
    P(IDLE_BASE, { lean: 1, handF: [12, -8], handB: [2, -4] })
  ];

  // --- PUNCH chain (secondo pugno, braccio dietro) ---
  POSES.punch2 = [
    P(IDLE_BASE, { lean: -1, handF: [6, -8], handB: [-4, -5] }),
    P(IDLE_BASE, { lean: 5, handF: [10, -7], handB: [18, -6], elbowB: 0, face: 'strain' }),
    P(IDLE_BASE, { lean: 1, handF: [8, -8], handB: [8, -5] })
  ];

  // --- HEAVY (4 frame, caricamento ampio) ---
  POSES.heavy = [
    P(IDLE_BASE, { lean: -4, handB: [-9, -2], elbowB: -1, handF: [3, -6] }),
    P(IDLE_BASE, { lean: -6, handB: [-12, 2], handF: [2, -4], face: 'strain' }),
    P(IDLE_BASE, { lean: 7, handB: [20, -5], elbowB: 0, handF: [8, -9], face: 'strain' }),
    P(IDLE_BASE, { lean: 3, handB: [14, -4], handF: [8, -8] })
  ];

  // --- KICK (4 frame, calcio a mezzo giro) ---
  POSES.kick = [
    P(IDLE_BASE, { lean: -2, footF: [2, 20], handF: [8, -9], handB: [0, -4] }),
    P(IDLE_BASE, { lean: -4, footF: [16, -14], kneeF: 0, footB: [-3, 22], handF: [4, -11], handB: [-6, 1], face: 'strain' }),
    P(IDLE_BASE, { lean: -5, footF: [18, -16], kneeF: 0, footB: [-3, 22], handF: [3, -11], handB: [-7, 1], face: 'strain' }),
    P(IDLE_BASE, { lean: -1, footF: [6, 20], handF: [8, -9], handB: [2, -4] })
  ];

  // --- LOW KICK (3 frame, in crouch) ---
  POSES.lowkick = [
    P(IDLE_BASE, { hipY: 44, headY: 2, footF: [4, 12], footB: [-6, 12], handF: [8, -8], handB: [3, -5], kneeF: 2, kneeB: -2 }),
    P(IDLE_BASE, { hipY: 43, headY: 2, lean: 3, footF: [20, 14], kneeF: 0, footB: [-6, 12], handF: [4, -6], handB: [-2, -4], kneeB: -2, face: 'strain' }),
    P(IDLE_BASE, { hipY: 44, headY: 2, footF: [8, 12], footB: [-6, 12], handF: [8, -8], handB: [3, -5], kneeF: 2, kneeB: -2 })
  ];

  // --- JUMP KICK (2 frame) ---
  POSES.jumpkick = [
    P(IDLE_BASE, { footF: [10, 8], kneeF: 0, footB: [-6, 14], handF: [6, -10], handB: [-4, -2] }),
    P(IDLE_BASE, { footF: [16, 12], kneeF: 0, footB: [-8, 12], handF: [3, -11], handB: [-6, 1], face: 'strain' })
  ];

  // --- HIT reaction (2 frame) ---
  POSES.hit = [
    P(IDLE_BASE, { lean: -4, headX: -3, headY: 1, handF: [4, -6], handB: [-6, -2], footF: [6, 21], footB: [-6, 22], face: 'ouch' }),
    P(IDLE_BASE, { lean: -2, headX: -2, handF: [6, -7], handB: [-3, -3], face: 'ouch' })
  ];

  // --- BLOCK (1 frame) + crouch block ---
  POSES.block = [
    P(IDLE_BASE, { lean: -2, handF: [10, -5], elbowF: 2, handB: [8, -1], elbowB: 2, face: 'strain' })
  ];
  POSES.crouchblock = [
    P(IDLE_BASE, { hipY: 44, headY: 2, lean: -2, handF: [10, -6], handB: [9, -3], footF: [6, 12], footB: [-6, 12], kneeF: 2, kneeB: -2, face: 'strain' })
  ];

  // --- KNOCKDOWN (3 frame) + DEFEAT ---
  POSES.knockdown = [
    P(IDLE_BASE, { lean: -8, headX: -4, handF: [2, -2], handB: [-10, 4], footF: [10, 22], footB: [2, 24], face: 'ouch' }),
    P(IDLE_BASE, { lean: -14, headX: -6, hipY: 44, handF: [0, 4], handB: [-12, 8], footF: [14, 20], footB: [6, 24], face: 'ouch' }),
    { flat: true } // a terra
  ];

  POSES.defeat = [
    { flat: true },
    { flat: true },
    { flat: true }
  ];

  // --- GETUP (2 frame) ---
  POSES.getup = [
    P(IDLE_BASE, { hipY: 48, headY: 4, lean: -6, handF: [6, 3], handB: [-4, 7], footF: [8, 10], footB: [-8, 10], kneeF: 2, kneeB: -2 }),
    P(IDLE_BASE, { hipY: 42, headY: 2, lean: -2, handF: [8, -4], handB: [2, 0], footF: [6, 14], footB: [-6, 14] })
  ];

  // --- VICTORY (4 frame, pugno al cielo) ---
  POSES.victory = [
    P(IDLE_BASE, { handF: [7, -18], elbowF: 0, handB: [-2, -4], face: 'smile' }),
    P(IDLE_BASE, { handF: [9, -16], elbowF: 0, handB: [-2, -4], face: 'smile' }),
    P(IDLE_BASE, { handF: [9, -16], elbowF: 0, handB: [-2, -4], headY: -1, face: 'smile' }),
    P(IDLE_BASE, { handF: [7, -18], elbowF: 0, handB: [-2, -4], headY: -1, face: 'smile' })
  ];

  // --- SPECIAL: pose dedicate per personaggio (5 frame) ---

  // BLAZE: due palmi in avanti, fiamma
  POSES.special_blaze = [
    P(IDLE_BASE, { lean: -5, hipY: 36, handF: [-4, -6], handB: [-8, -4] }),
    P(IDLE_BASE, { lean: -7, hipY: 37, handF: [-8, -5], handB: [-11, -3], face: 'roar' }),
    P(IDLE_BASE, { lean: 6, handF: [16, -7], elbowF: 0, handB: [15, -6], elbowB: 0, face: 'roar' }),
    P(IDLE_BASE, { lean: 6, handF: [17, -7], elbowF: 0, handB: [16, -6], elbowB: 0, face: 'roar' }),
    P(IDLE_BASE, { lean: 2, handF: [12, -7], handB: [10, -5] })
  ];

  // SHADOW: dash affondo
  POSES.special_shadow = [
    P(IDLE_BASE, { lean: -4, hipY: 36, handF: [-2, -4], handB: [-8, 0] }),
    P(IDLE_BASE, { lean: 2, hipY: 35, handF: [6, -6], handB: [-10, 2] }),
    P(IDLE_BASE, { lean: 9, hipY: 33, handF: [22, -3], elbowF: 0, handB: [-12, 4], footF: [14, 18], footB: [-14, 24], face: 'roar' }),
    P(IDLE_BASE, { lean: 9, hipY: 33, handF: [23, -3], elbowF: 0, handB: [-13, 4], footF: [15, 18], footB: [-15, 24], face: 'roar' }),
    P(IDLE_BASE, { lean: 3, handF: [12, -6], handB: [-4, 0] })
  ];

  // TITAN: slam a terra (braccia al cielo nel windup, poi a terra)
  POSES.special_titan = [
    P(IDLE_BASE, { handF: [4, -19], elbowF: 0, handB: [-6, -17], elbowB: 0, headY: -2, face: 'roar' }),
    P(IDLE_BASE, { handF: [6, -20], elbowF: 0, handB: [-8, -18], elbowB: 0, headY: -3, hipY: 33, face: 'roar' }),
    P(IDLE_BASE, { lean: 8, hipY: 42, headY: 4, handF: [12, 4], elbowF: 0, handB: [10, 6], elbowB: 0, footF: [8, 14], footB: [-8, 14], kneeF: 2, kneeB: -2, face: 'roar' }),
    P(IDLE_BASE, { lean: 8, hipY: 43, headY: 4, handF: [13, 6], elbowF: 0, handB: [11, 8], elbowB: 0, footF: [8, 14], footB: [-8, 14], kneeF: 2, kneeB: -2, face: 'roar' }),
    P(IDLE_BASE, { lean: 3, hipY: 38, handF: [10, -2], handB: [6, 1], footF: [7, 16], footB: [-7, 16] })
  ];

  // VOLT: braccio alzato, scarica
  POSES.special_volt = [
    P(IDLE_BASE, { lean: -3, handF: [2, -12], handB: [-4, -8] }),
    P(IDLE_BASE, { lean: -5, handF: [0, -17], elbowF: 0, handB: [-8, -12], elbowB: 0, headY: -2, face: 'roar' }),
    P(IDLE_BASE, { lean: 5, handF: [18, -12], elbowF: 0, handB: [-6, -10], footF: [10, 20], footB: [-10, 22], face: 'roar' }),
    P(IDLE_BASE, { lean: 5, handF: [19, -12], elbowF: 0, handB: [-7, -10], footF: [11, 20], footB: [-11, 22], face: 'roar' }),
    P(IDLE_BASE, { lean: 1, handF: [12, -10], handB: [-2, -6] })
  ];

  // --- INTRO (1 frame, pugni serrati) ---
  POSES.intro = [
    P(IDLE_BASE, { handF: [7, -6], handB: [2, -3], headY: -1, face: 'strain' })
  ];

  PF.ANIM_DATA = {
    idle:       { frames: POSES.idle,       loop: true,  fps: 7 },
    walk:       { frames: POSES.walk,       loop: true,  fps: 11 },
    run:        { frames: POSES.run,        loop: true,  fps: 15 },
    jump:       { frames: POSES.jump,       loop: false, fps: 10 },
    crouch:     { frames: POSES.crouch,     loop: true,  fps: 5 },
    punch:      { frames: POSES.punch,      loop: false, fps: 12 },
    punch2:     { frames: POSES.punch2,     loop: false, fps: 12 },
    heavy:      { frames: POSES.heavy,      loop: false, fps: 11 },
    kick:       { frames: POSES.kick,       loop: false, fps: 12 },
    lowkick:    { frames: POSES.lowkick,    loop: false, fps: 12 },
    jumpkick:   { frames: POSES.jumpkick,   loop: false, fps: 12 },
    hit:        { frames: POSES.hit,        loop: false, fps: 10 },
    block:      { frames: POSES.block,      loop: false, fps: 8 },
    crouchblock:{ frames: POSES.crouchblock,loop: false, fps: 8 },
    knockdown:  { frames: POSES.knockdown,  loop: false, fps: 9 },
    defeat:     { frames: POSES.defeat,     loop: false, fps: 6 },
    getup:      { frames: POSES.getup,      loop: false, fps: 8 },
    victory:    { frames: POSES.victory,    loop: true,  fps: 6 },
    special_blaze:  { frames: POSES.special_blaze,  loop: false, fps: 10 },
    special_shadow: { frames: POSES.special_shadow, loop: false, fps: 12 },
    special_titan:  { frames: POSES.special_titan,  loop: false, fps: 9 },
    special_volt:   { frames: POSES.special_volt,   loop: false, fps: 10 },
    intro:      { frames: POSES.intro,      loop: false, fps: 8 }
  };

  PF.ANIMS = Object.keys(PF.ANIM_DATA);
})();
