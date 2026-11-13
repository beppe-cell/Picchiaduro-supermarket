/* ============================================================
   PIXEL FURY — animations.js
   Dati di animazione: pose scheletriche frame-by-frame.
   Ogni pose è parametrica rispetto all'ancora dell'anca (hip).
   Coordinate: x avanti (facing destro), y positivo verso il basso.
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

  const GUARD_F = [9, -18];   // mano fronte (guardia alta)
  const GUARD_B = [4, -13];   // mano dietro

  // ---------------- Pose base ----------------

  const IDLE_BASE = {
    hipY: 34, lean: 0, headX: 0, headY: 0,
    handF: GUARD_F.slice(), elbowF: 1,
    handB: GUARD_B.slice(), elbowB: -1,
    footF: [4, 22], kneeF: 1,
    footB: [-4, 22], kneeB: -1,
    flat: false, extra: null
  };

  const POSES = {};

  // --- IDLE (respiro, 4 frame) ---
  POSES.idle = [
    P(IDLE_BASE),
    P(IDLE_BASE, { hipY: 35, handF: [9, -17], handB: [4, -12] }),
    P(IDLE_BASE, { hipY: 35, headY: -1, handF: [9, -17], handB: [4, -12] }),
    P(IDLE_BASE, { headY: -1 })
  ];

  // --- WALK (6 frame) ---
  POSES.walk = [
    P(IDLE_BASE, { footF: [8, 20], footB: [-8, 22], handF: [7, -17], handB: [1, -12] }),
    P(IDLE_BASE, { footF: [5, 22], footB: [-5, 22], handF: [8, -18], handB: [3, -13] }),
    P(IDLE_BASE, { footF: [1, 24], footB: [-1, 21], handF: [9, -18], handB: [5, -14] }),
    P(IDLE_BASE, { footF: [-6, 22], footB: [7, 20], handF: [10, -18], handB: [7, -13] }),
    P(IDLE_BASE, { footF: [-4, 22], footB: [5, 22], handF: [9, -17], handB: [5, -12] }),
    P(IDLE_BASE, { footF: [0, 21], footB: [1, 24], handF: [9, -17], handB: [4, -13] })
  ];

  // --- RUN (6 frame) ---
  POSES.run = [
    P(IDLE_BASE, { lean: 4, footF: [12, 16], footB: [-12, 24], handF: [12, -22], handB: [-8, -8] }),
    P(IDLE_BASE, { lean: 4, footF: [10, 22], footB: [-8, 20], handF: [11, -20], handB: [-5, -10] }),
    P(IDLE_BASE, { lean: 5, footF: [2, 24], footB: [-2, 18], handF: [10, -18], handB: [-2, -12] }),
    P(IDLE_BASE, { lean: 4, footF: [-10, 24], footB: [12, 16], handF: [8, -14], handB: [6, -20] }),
    P(IDLE_BASE, { lean: 4, footF: [-7, 20], footB: [9, 22], handF: [9, -16], handB: [3, -18] }),
    P(IDLE_BASE, { lean: 5, footF: [-1, 18], footB: [2, 24], handF: [10, -18], handB: [0, -13] })
  ];

  // --- JUMP (3 frame: salita, apice, discesa) ---
  POSES.jump = [
    P(IDLE_BASE, { footF: [5, 12], kneeF: 1, footB: [-4, 10], kneeB: -1, handF: [8, -24], handB: [-2, -18] }),
    P(IDLE_BASE, { footF: [4, 14], footB: [-3, 12], handF: [10, -20], handB: [0, -16] }),
    P(IDLE_BASE, { footF: [6, 18], footB: [-4, 16], handF: [10, -14], handB: [2, -10] })
  ];

  // --- CROUCH (2 frame) ---
  POSES.crouch = [
    P(IDLE_BASE, { hipY: 44, headY: 2, handF: [8, -8], handB: [3, -5], footF: [6, 12], footB: [-6, 12], kneeF: 2, kneeB: -2 }),
    P(IDLE_BASE, { hipY: 45, headY: 2, handF: [8, -8], handB: [3, -5], footF: [6, 11], footB: [-6, 11], kneeF: 2, kneeB: -2 })
  ];

  // --- PUNCH leggero (3 frame) ---
  POSES.punch = [
    P(IDLE_BASE, { lean: -1, handF: [2, -16], handB: [-2, -12] }),
    P(IDLE_BASE, { lean: 4, handF: [19, -17], elbowF: 0, handB: [0, -12] }),
    P(IDLE_BASE, { lean: 1, handF: [12, -17], handB: [2, -12] })
  ];

  // --- PUNCH chain (secondo pugno, braccio dietro) ---
  POSES.punch2 = [
    P(IDLE_BASE, { lean: -1, handF: [6, -17], handB: [-4, -13] }),
    P(IDLE_BASE, { lean: 5, handF: [10, -16], handB: [18, -15], elbowB: 0 }),
    P(IDLE_BASE, { lean: 1, handF: [8, -17], handB: [8, -13] })
  ];

  // --- HEAVY (4 frame, caricamento ampio) ---
  POSES.heavy = [
    P(IDLE_BASE, { lean: -4, handB: [-9, -10], elbowB: -1, handF: [3, -14] }),
    P(IDLE_BASE, { lean: -6, handB: [-12, -6], handF: [2, -12] }),
    P(IDLE_BASE, { lean: 7, handB: [20, -14], elbowB: 0, handF: [8, -18] }),
    P(IDLE_BASE, { lean: 3, handB: [14, -13], handF: [8, -17] })
  ];

  // --- KICK (4 frame, calcio a mezzo giro) ---
  POSES.kick = [
    P(IDLE_BASE, { lean: -2, footF: [2, 20], handF: [8, -18], handB: [0, -12] }),
    P(IDLE_BASE, { lean: -4, footF: [16, -14], kneeF: 0, footB: [-3, 22], handF: [4, -20], handB: [-6, -8] }),
    P(IDLE_BASE, { lean: -5, footF: [18, -16], kneeF: 0, footB: [-3, 22], handF: [3, -20], handB: [-7, -8] }),
    P(IDLE_BASE, { lean: -1, footF: [6, 20], handF: [8, -18], handB: [2, -12] })
  ];

  // --- LOW KICK (3 frame, in crouch) ---
  POSES.lowkick = [
    P(IDLE_BASE, { hipY: 44, headY: 2, footF: [4, 12], footB: [-6, 12], handF: [8, -8], handB: [3, -5], kneeF: 2, kneeB: -2 }),
    P(IDLE_BASE, { hipY: 43, headY: 2, lean: 3, footF: [20, 14], kneeF: 0, footB: [-6, 12], handF: [4, -6], handB: [-2, -4], kneeB: -2 }),
    P(IDLE_BASE, { hipY: 44, headY: 2, footF: [8, 12], footB: [-6, 12], handF: [8, -8], handB: [3, -5], kneeF: 2, kneeB: -2 })
  ];

  // --- JUMP KICK (2 frame) ---
  POSES.jumpkick = [
    P(IDLE_BASE, { footF: [10, 8], kneeF: 0, footB: [-6, 14], handF: [6, -18], handB: [-4, -10] }),
    P(IDLE_BASE, { footF: [16, 12], kneeF: 0, footB: [-8, 12], handF: [3, -20], handB: [-6, -8] })
  ];

  // --- HIT reaction (2 frame) ---
  POSES.hit = [
    P(IDLE_BASE, { lean: -4, headX: -3, headY: 1, handF: [4, -14], handB: [-6, -10], footF: [6, 21], footB: [-6, 22] }),
    P(IDLE_BASE, { lean: -2, headX: -2, handF: [6, -15], handB: [-3, -11] })
  ];

  // --- BLOCK (1 frame) + crouch block ---
  POSES.block = [
    P(IDLE_BASE, { lean: -2, handF: [10, -20], elbowF: 1, handB: [9, -15], elbowB: 1 })
  ];
  POSES.crouchblock = [
    P(IDLE_BASE, { hipY: 44, headY: 2, lean: -2, handF: [10, -10], handB: [9, -6], footF: [6, 12], footB: [-6, 12], kneeF: 2, kneeB: -2 })
  ];

  // --- KNOCKDOWN (3 frame) + DEFEAT ---
  POSES.knockdown = [
    P(IDLE_BASE, { lean: -8, headX: -4, handF: [2, -10], handB: [-10, -4], footF: [10, 22], footB: [2, 24] }),
    P(IDLE_BASE, { lean: -14, headX: -6, hipY: 44, handF: [0, -4], handB: [-12, 0], footF: [14, 20], footB: [6, 24] }),
    { flat: true } // a terra
  ];

  POSES.defeat = [
    { flat: true },
    { flat: true },
    { flat: true }
  ];

  // --- GETUP (2 frame) ---
  POSES.getup = [
    P(IDLE_BASE, { hipY: 48, headY: 4, lean: -6, handF: [6, -4], handB: [-4, 0], footF: [8, 10], footB: [-8, 10], kneeF: 2, kneeB: -2 }),
    P(IDLE_BASE, { hipY: 42, headY: 2, lean: -2, handF: [8, -8], handB: [2, -4], footF: [6, 14], footB: [-6, 14] })
  ];

  // --- VICTORY (4 frame) ---
  POSES.victory = [
    P(IDLE_BASE, { handF: [7, -32], elbowF: 0, handB: [-2, -12] }),
    P(IDLE_BASE, { handF: [9, -36], elbowF: 0, handB: [-2, -12] }),
    P(IDLE_BASE, { handF: [9, -36], elbowF: 0, handB: [-2, -12], headY: -1 }),
    P(IDLE_BASE, { handF: [7, -32], elbowF: 0, handB: [-2, -12], headY: -1 })
  ];

  // --- SPECIAL: pose dedicate per personaggio (5 frame) ---

  // BLAZE: due palmi in avanti, fiamma
  POSES.special_blaze = [
    P(IDLE_BASE, { lean: -5, hipY: 36, handF: [-4, -14], handB: [-8, -12], handF: [-4, -14] }),
    P(IDLE_BASE, { lean: -7, hipY: 37, handF: [-8, -13], handB: [-11, -11] }),
    P(IDLE_BASE, { lean: 6, handF: [16, -16], elbowF: 0, handB: [15, -14], elbowB: 0 }),
    P(IDLE_BASE, { lean: 6, handF: [17, -16], elbowF: 0, handB: [16, -14], elbowB: 0 }),
    P(IDLE_BASE, { lean: 2, handF: [12, -16], handB: [10, -13] })
  ];

  // SHADOW: dash affondo
  POSES.special_shadow = [
    P(IDLE_BASE, { lean: -4, hipY: 36, handF: [-2, -12], handB: [-8, -8] }),
    P(IDLE_BASE, { lean: 2, hipY: 35, handF: [6, -14], handB: [-10, -6] }),
    P(IDLE_BASE, { lean: 9, hipY: 33, handF: [22, -10], elbowF: 0, handB: [-12, -4], footF: [14, 18], footB: [-14, 24] }),
    P(IDLE_BASE, { lean: 9, hipY: 33, handF: [23, -10], elbowF: 0, handB: [-13, -4], footF: [15, 18], footB: [-15, 24] }),
    P(IDLE_BASE, { lean: 3, handF: [12, -14], handB: [-4, -8] })
  ];

  // TITAN: slam a terra
  POSES.special_titan = [
    P(IDLE_BASE, { handF: [4, -34], elbowF: 0, handB: [-6, -32], elbowB: 0, headY: -2 }),
    P(IDLE_BASE, { handF: [6, -38], elbowF: 0, handB: [-8, -36], elbowB: 0, headY: -3, hipY: 33 }),
    P(IDLE_BASE, { lean: 8, hipY: 42, headY: 4, handF: [12, 4], elbowF: 0, handB: [10, 6], elbowB: 0, footF: [8, 14], footB: [-8, 14], kneeF: 2, kneeB: -2 }),
    P(IDLE_BASE, { lean: 8, hipY: 43, headY: 4, handF: [13, 6], elbowF: 0, handB: [11, 8], elbowB: 0, footF: [8, 14], footB: [-8, 14], kneeF: 2, kneeB: -2 }),
    P(IDLE_BASE, { lean: 3, hipY: 38, handF: [10, -6], handB: [6, -4], footF: [7, 16], footB: [-7, 16] })
  ];

  // VOLT: braccio alzato, scarica
  POSES.special_volt = [
    P(IDLE_BASE, { lean: -3, handF: [2, -20], handB: [-4, -16] }),
    P(IDLE_BASE, { lean: -5, handF: [0, -34], elbowF: 0, handB: [-8, -24], elbowB: 0, headY: -2 }),
    P(IDLE_BASE, { lean: 5, handF: [18, -22], elbowF: 0, handB: [-6, -18], footF: [10, 20], footB: [-10, 22] }),
    P(IDLE_BASE, { lean: 5, handF: [19, -22], elbowF: 0, handB: [-7, -18], footF: [11, 20], footB: [-11, 22] }),
    P(IDLE_BASE, { lean: 1, handF: [12, -18], handB: [-2, -14] })
  ];

  // --- INTRO (1 frame, pugni serrati) ---
  POSES.intro = [
    P(IDLE_BASE, { handF: [7, -20], handB: [2, -18], headY: -1 })
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
