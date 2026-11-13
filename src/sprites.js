/* ============================================================
   PIXEL FURY — sprites.js
   Pixel Artist procedurale: genera sprite sheet, ritratti e
   proiettili a runtime su canvas offscreen (64x64 per frame).
   Nessun asset esterno: tutto disegnato pixel per pixel.
   ============================================================ */

window.PF = window.PF || {};

(function () {
  'use strict';

  const FRAME_W = 64, FRAME_H = 64;
  const ANCHOR_X = 30;          // centro orizzontale del corpo nel frame
  const FEET_BASE = 56;         // riga delle piante dei piedi in idle

  // ---------------- Definizione personaggi ----------------

  PF.CHARS = {
    blaze: {
      id: 'blaze', name: 'BLAZE',
      desc: 'Combattente equilibrato.<br>Mossa: <b>INFERNO WAVE</b> (palla di fuoco)',
      specialName: 'INFERNO WAVE',
      maxHealth: 100, walkSpeed: 1.55, runSpeed: 3.0, power: 1.0, defense: 1.0,
      jumpPower: 7.6, weight: 1.0,
      body: { torsoW: 9, armW: 3, legW: 4, headW: 9 },
      palette: {
        skin: '#e8a06c', skinDark: '#c07a4a',
        main: '#d8402f', mainDark: '#8e2014',
        pants: '#3a3540', pantsDark: '#26232e',
        boots: '#5a4a3a', hair: '#ffb02e', hairDark: '#e07018',
        accent: '#ffe66d', eye: '#1a1a1a', glove: '#8e2014'
      },
      hairStyle: 'flame'
    },
    shadow: {
      id: 'shadow', name: 'SHADOW',
      desc: 'Ninja velocissimo, specialista di combo.<br>Mossa: <b>PHANTOM RUSH</b> (affondo spettrale)',
      specialName: 'PHANTOM RUSH',
      maxHealth: 90, walkSpeed: 2.0, runSpeed: 3.8, power: 0.9, defense: 1.1,
      jumpPower: 8.2, weight: 0.85,
      body: { torsoW: 8, armW: 3, legW: 4, headW: 9 },
      palette: {
        skin: '#c8956c', skinDark: '#a07048',
        main: '#2c3358', mainDark: '#181c34',
        pants: '#1c2038', pantsDark: '#12141f',
        boots: '#10121e', hair: '#181c34', hairDark: '#10121e',
        accent: '#e04848', eye: '#dfe8ff', glove: '#181c34'
      },
      hairStyle: 'ninja'
    },
    titan: {
      id: 'titan', name: 'TITAN',
      desc: 'Lento ma devastante, rocce da lancio.<br>Mossa: <b>SEISMIC SLAM</b> (onda sismica)',
      specialName: 'SEISMIC SLAM',
      maxHealth: 120, walkSpeed: 1.15, runSpeed: 2.2, power: 1.35, defense: 0.78,
      jumpPower: 6.6, weight: 1.3,
      body: { torsoW: 12, armW: 5, legW: 5, headW: 9 },
      palette: {
        skin: '#d99a66', skinDark: '#b0763f',
        main: '#c9a227', mainDark: '#8a6d14',
        pants: '#6b7f3a', pantsDark: '#48561f',
        boots: '#4a3b2f', hair: '#3d2f23', hairDark: '#2a1f16',
        accent: '#8a6d14', eye: '#1a1a1a', glove: '#4a3b2f'
      },
      hairStyle: 'mohawk'
    },
    volt: {
      id: 'volt', name: 'VOLT',
      desc: 'Agile e letale, colpi elettrici.<br>Mossa: <b>THUNDER FANG</b> (tripla scarica)',
      specialName: 'THUNDER FANG',
      maxHealth: 95, walkSpeed: 1.85, runSpeed: 3.4, power: 0.95, defense: 1.0,
      jumpPower: 8.0, weight: 0.9,
      body: { torsoW: 8, armW: 3, legW: 4, headW: 9 },
      palette: {
        skin: '#e8b28a', skinDark: '#c08a5c',
        main: '#1f8a9c', mainDark: '#0f5563',
        pants: '#20242e', pantsDark: '#14161d',
        boots: '#2a2e3a', hair: '#6ef0ff', hairDark: '#2ab8d0',
        accent: '#ffe94a', eye: '#111111', glove: '#ffe94a'
      },
      hairStyle: 'spiky'
    }
  };

  PF.CHAR_IDS = Object.keys(PF.CHARS);

  // ---------------- Helper disegno ----------------

  function makeCanvas(w, h) {
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    const ctx = c.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    return { c, ctx };
  }

  function px(ctx, x, y, w, h, color) {
    ctx.fillStyle = color;
    ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
  }

  // Segmento spesso (Bresenham con spessore) — resta sulla griglia pixel
  function limb(ctx, x1, y1, x2, y2, w, color) {
    const dx = x2 - x1, dy = y2 - y1;
    const steps = Math.max(Math.abs(dx), Math.abs(dy), 1);
    for (let i = 0; i <= steps; i++) {
      const x = x1 + dx * i / steps;
      const y = y1 + dy * i / steps;
      px(ctx, x - w / 2, y - w / 2, w, w, color);
    }
  }

  // Punto medio con piega perpendicolare (gomito / ginocchio)
  function joint(ax, ay, bx, by, bend, amount) {
    const mx = (ax + bx) / 2, my = (ay + by) / 2;
    const dx = bx - ax, dy = by - ay;
    const len = Math.max(Math.hypot(dx, dy), 0.001);
    const pxn = -dy / len, pyn = dx / len;
    return { x: mx + pxn * bend * amount, y: my + pyn * bend * amount };
  }

  // ---------------- Testa e capelli ----------------

  function drawHead(ctx, ch, hx, hy, pose, tick) {
    const p = ch.palette, b = ch.body;
    const hw = b.headW, hh = 8;
    const x = Math.round(hx - hw / 2), y = Math.round(hy - hh / 2);

    // collo
    px(ctx, hx - 1, y + hh - 2, 3, 3, p.skinDark);

    // testa
    px(ctx, x, y, hw, hh, p.skin);
    px(ctx, x, y + hh - 2, hw, 2, p.skinDark); // ombra mandibola

    // occhi (guarda avanti)
    const ex = x + hw - 3;
    if (ch.hairStyle === 'ninja') {
      // fessura occhi da ninja
      px(ctx, x + 1, y + 3, hw - 2, 3, p.mainDark);
      px(ctx, ex, y + 4, 2, 1, p.eye);
    } else {
      px(ctx, ex, y + 3, 2, 2, p.eye);
      px(ctx, ex - 3, y + 3, 1, 2, p.eye);
    }

    // capelli
    switch (ch.hairStyle) {
      case 'flame': {
        px(ctx, x - 1, y - 2, hw + 2, 3, p.hair);
        // fiammelle spettinate
        const w = Math.sin(tick * 0.15) > 0 ? 1 : 0;
        px(ctx, x - 2, y - 4 + w, 2, 3, p.hairDark);
        px(ctx, x + 2, y - 5, 2, 4, p.hair);
        px(ctx, x + 5, y - 4 - w, 2, 3, p.hairDark);
        px(ctx, x - 1, y + 1, 2, 4, p.hairDark); // basette
        // fascia frontale
        px(ctx, x, y + 1, hw, 1, p.accent);
        // codina della fascia
        const t = Math.round(Math.sin(tick * 0.2) * 1.5);
        px(ctx, x - 3, y + 2 + t, 3, 1, p.accent);
        px(ctx, x - 5, y + 3 + t, 2, 1, p.accent);
        break;
      }
      case 'ninja': {
        // cappuccio
        px(ctx, x - 1, y - 2, hw + 2, 5, p.main);
        px(ctx, x - 1, y - 2, hw + 2, 2, p.mainDark);
        px(ctx, x - 1, y + 2, 2, hh - 2, p.main);
        // sciarpa (mossa dal vento)
        const t = Math.round(Math.sin(tick * 0.18) * 2);
        px(ctx, x - 4, y + hh - 2 + t, 4, 2, p.accent);
        px(ctx, x - 7, y + hh - 1 + t, 3, 1, p.accent);
        break;
      }
      case 'mohawk': {
        px(ctx, x + 2, y - 4, 4, 4, p.hair);
        px(ctx, x + 3, y - 5, 2, 1, p.hairDark);
        px(ctx, x, y - 1, hw, 2, p.hairDark); // rasato
        px(ctx, x + hw - 3, y + 5, 3, 2, p.hairDark); // barba
        break;
      }
      case 'spiky': {
        px(ctx, x, y - 2, hw, 3, p.hair);
        px(ctx, x + 1, y - 4, 2, 2, p.hair);
        px(ctx, x + 4, y - 5, 2, 3, p.hairDark);
        px(ctx, x + 7, y - 3, 2, 2, p.hair);
        px(ctx, x - 1, y + 1, 2, 3, p.hairDark);
        break;
      }
    }
  }

  // ---------------- Frame completo ----------------

  function drawFrame(ctx, ch, pose, tick) {
    const p = ch.palette, b = ch.body;
    const hip = { x: ANCHOR_X, y: pose.hipY };
    const neck = { x: hip.x + pose.lean, y: hip.y - 14 };
    const head = { x: neck.x + (pose.headX || 0), y: neck.y - 5 + (pose.headY || 0) };

    if (pose.flat) { drawFlat(ctx, ch); return; }

    const shoulderF = { x: neck.x + 2, y: neck.y + 2 };
    const shoulderB = { x: neck.x - 2, y: neck.y + 2 };
    const handF = { x: neck.x + pose.handF[0], y: neck.y + pose.handF[1] };
    const handB = { x: neck.x + pose.handB[0], y: neck.y + pose.handB[1] };
    const elbowF = joint(shoulderF.x, shoulderF.y, handF.x, handF.y, pose.elbowF, 2.5);
    const elbowB = joint(shoulderB.x, shoulderB.y, handB.x, handB.y, pose.elbowB, 2.5);
    const hipF = { x: hip.x + 2, y: hip.y };
    const hipB = { x: hip.x - 2, y: hip.y };
    const footF = { x: hip.x + pose.footF[0], y: hip.y + pose.footF[1] };
    const footB = { x: hip.x + pose.footB[0], y: hip.y + pose.footB[1] };
    const kneeF = joint(hipF.x, hipF.y, footF.x, footF.y, pose.kneeF, 3);
    const kneeB = joint(hipB.x, hipB.y, footB.x, footB.y, pose.kneeB, 3);

    // braccio dietro
    limb(ctx, shoulderB.x, shoulderB.y, elbowB.x, elbowB.y, b.armW, p.mainDark);
    limb(ctx, elbowB.x, elbowB.y, handB.x, handB.y, b.armW, p.mainDark);
    px(ctx, handB.x - 1, handB.y - 1, 3, 3, p.glove);

    // gamba dietro
    limb(ctx, hipB.x, hipB.y, kneeB.x, kneeB.y, b.legW, p.pantsDark);
    limb(ctx, kneeB.x, kneeB.y, footB.x, footB.y, b.legW, p.pantsDark);
    px(ctx, footB.x - 2, footB.y - 1, 5, 3, p.boots);

    // torso
    limb(ctx, hip.x, hip.y, neck.x, neck.y, b.torsoW, p.main);
    px(ctx, neck.x - b.torsoW / 2 + 1, neck.y - 1, b.torsoW - 2, 3, p.mainDark); // clavicola/ombra
    px(ctx, hip.x - b.torsoW / 2, hip.y - 2, b.torsoW, 3, p.accent);           // cintura
    if (ch.id === 'titan') { // spallacci
      px(ctx, shoulderF.x - 2, shoulderF.y - 3, 5, 3, p.accent);
      px(ctx, shoulderB.x - 3, shoulderB.y - 3, 5, 3, p.mainDark);
    }

    // gamba fronte
    limb(ctx, hipF.x, hipF.y, kneeF.x, kneeF.y, b.legW, p.pants);
    limb(ctx, kneeF.x, kneeF.y, footF.x, footF.y, b.legW, p.pants);
    px(ctx, footF.x - 2, footF.y - 1, 5, 3, p.boots);

    // testa
    drawHead(ctx, ch, head.x, head.y, pose, tick);

    // braccio fronte
    limb(ctx, shoulderF.x, shoulderF.y, elbowF.x, elbowF.y, b.armW, p.main);
    limb(ctx, elbowF.x, elbowF.y, handF.x, handF.y, b.armW, p.main);
    px(ctx, handF.x - 1, handF.y - 1, 3, 3, p.glove);

    // effetti per-personaggio su pose speciali
    drawCharFx(ctx, ch, pose, handF, handB, tick);
  }

  function drawCharFx(ctx, ch, pose, handF, handB, tick) {
    const p = ch.palette;
    const isSpecial = typeof pose.extra === 'string' ? pose.extra : '';
    if (ch.id === 'blaze' && (isSpecial === 'blaze' || isSpecial === 'punchfire')) {
      const f = 2 + Math.round(Math.random());
      px(ctx, handF.x - f / 2, handF.y - f - 2, f, f, p.accent);
      px(ctx, handF.x - 1, handF.y - f - 4, 1, 2, '#ff8c1a');
    }
    if (ch.id === 'volt' && isSpecial === 'volt') {
      for (let i = 0; i < 4; i++) {
        const a = Math.random() * Math.PI * 2, r = 5 + Math.random() * 5;
        px(ctx, handF.x + Math.cos(a) * r, handF.y + Math.sin(a) * r, 1, 1, i % 2 ? '#ffffff' : p.accent);
      }
    }
    if (ch.id === 'shadow' && isSpecial === 'shadow') {
      // scie spettrali
      for (let i = 0; i < 3; i++) {
        px(ctx, ANCHOR_X - 6 - i * 4 + Math.random() * 2, hipYOf(pose) - 20 + Math.random() * 18, 2, 2, 'rgba(120,140,255,0.5)');
      }
    }
  }

  function hipYOf(pose) { return pose.hipY || 34; }

  // Posa a terra (knockdown finale / defeat)
  function drawFlat(ctx, ch) {
    const p = ch.palette, b = ch.body;
    const y = 52;
    // gambe
    limb(ctx, 36, y + 1, 46, y - 1, b.legW, p.pants);
    limb(ctx, 36, y + 2, 47, y + 2, b.legW, p.pantsDark);
    px(ctx, 46, y - 2, 4, 3, p.boots);
    px(ctx, 47, y + 1, 4, 3, p.boots);
    // torso orizzontale
    px(ctx, 22, y - 1, 15, 6, p.main);
    px(ctx, 22, y + 3, 15, 2, p.mainDark);
    px(ctx, 34, y - 2, 4, 3, p.accent);
    // braccio
    limb(ctx, 28, y - 1, 22, y - 5, b.armW, p.main);
    px(ctx, 21, y - 6, 3, 3, p.glove);
    // testa
    drawHead(ctx, ch, 17, y - 1, { hipY: y }, 0);
  }

  // ---------------- Generazione sheet ----------------

  const FRAMES = {};   // FRAMES[charId][anim] = [canvas]
  const PORTRAITS = {};

  function buildCharacter(ch) {
    FRAMES[ch.id] = {};
    for (const anim in PF.ANIM_DATA) {
      const data = PF.ANIM_DATA[anim];
      const frames = [];
      for (let i = 0; i < data.frames.length; i++) {
        const { c, ctx } = makeCanvas(FRAME_W, FRAME_H);
        const pose = Object.assign({}, data.frames[i]);
        // tag pose per effetti personaggio
        if (anim.startsWith('special_')) pose.extra = anim.slice(8);
        if (anim === 'punch' && ch.id === 'blaze') pose.extra = 'punchfire';
        if (anim === 'punch2' && ch.id === 'blaze') pose.extra = 'punchfire';
        drawFrame(ctx, ch, pose, i * 7);
        frames.push(c);
      }
      FRAMES[ch.id][anim] = frames;
    }

    // ritratto 32x32 (busto)
    const pr = makeCanvas(32, 32);
    drawPortrait(pr.ctx, ch);
    PORTRAITS[ch.id] = pr.c;
  }

  function drawPortrait(ctx, ch) {
    const p = ch.palette;
    px(ctx, 0, 0, 32, 32, '#0c0c1e');
    px(ctx, 0, 0, 32, 2, p.main);
    // spalle
    px(ctx, 6, 24, 20, 8, p.main);
    px(ctx, 6, 24, 20, 2, p.mainDark);
    px(ctx, 14, 22, 4, 3, p.skinDark);
    // testa grande
    px(ctx, 9, 6, 14, 15, p.skin);
    px(ctx, 9, 18, 14, 3, p.skinDark);
    px(ctx, 9, 6, 14, 1, p.mainDark);
    // occhi
    if (ch.hairStyle === 'ninja') {
      px(ctx, 10, 12, 12, 3, p.mainDark);
      px(ctx, 18, 13, 2, 1, p.eye);
      px(ctx, 13, 13, 2, 1, p.eye);
    } else {
      px(ctx, 17, 12, 2, 3, p.eye);
      px(ctx, 12, 12, 2, 3, p.eye);
    }
    // capelli
    switch (ch.hairStyle) {
      case 'flame':
        px(ctx, 8, 3, 16, 4, p.hair);
        px(ctx, 10, 1, 3, 3, p.hairDark); px(ctx, 15, 0, 3, 4, p.hair); px(ctx, 20, 1, 3, 3, p.hairDark);
        px(ctx, 8, 7, 2, 6, p.hairDark);
        px(ctx, 9, 9, 14, 1, p.accent);
        break;
      case 'ninja':
        px(ctx, 8, 2, 16, 8, p.main);
        px(ctx, 8, 2, 16, 2, p.mainDark);
        px(ctx, 8, 10, 2, 8, p.main);
        px(ctx, 6, 18, 5, 2, p.accent); px(ctx, 3, 20, 4, 1, p.accent);
        break;
      case 'mohawk':
        px(ctx, 13, 0, 5, 7, p.hair);
        px(ctx, 14, 0, 2, 2, p.hairDark);
        px(ctx, 9, 6, 14, 2, p.hairDark);
        px(ctx, 18, 18, 5, 3, p.hairDark);
        break;
      case 'spiky':
        px(ctx, 8, 3, 16, 4, p.hair);
        px(ctx, 10, 1, 2, 3, p.hair); px(ctx, 14, 0, 2, 4, p.hairDark); px(ctx, 19, 1, 3, 3, p.hair);
        px(ctx, 8, 7, 2, 4, p.hairDark);
        break;
    }
    // cornice
    ctx.strokeStyle = p.accent;
    ctx.strokeRect(0.5, 0.5, 31, 31);
  }

  // ---------------- Proiettili ----------------

  const PROJECTILES = {};

  function buildProjectiles() {
    // Fireball Blaze — 3 frame
    PROJECTILES.fireball = [];
    for (let f = 0; f < 3; f++) {
      const { c, ctx } = makeCanvas(18, 14);
      const wob = f - 1;
      px(ctx, 2, 4 + wob, 12, 7, '#ff5a1a');
      px(ctx, 4, 3 + wob, 9, 9, '#ff8c1a');
      px(ctx, 6, 5 + wob, 6, 5, '#ffe66d');
      px(ctx, 8, 6 + wob, 3, 3, '#ffffff');
      px(ctx, 14, 5 + wob, 2, 4, '#ff8c1a');
      px(ctx, 0, 6, 3, 2, '#c03010');
      PROJECTILES.fireball.push(c);
    }
    // Onda sismica Titan — 2 frame
    PROJECTILES.wave = [];
    for (let f = 0; f < 2; f++) {
      const { c, ctx } = makeCanvas(20, 16);
      const o = f * 2;
      px(ctx, 2, 8, 16, 6, '#8a6d14');
      px(ctx, 4, 5 + o % 2, 12, 5, '#c9a227');
      px(ctx, 6, 3 - o % 2, 8, 4, '#e8c84a');
      px(ctx, 8, 2, 4, 3, '#fff2b0');
      px(ctx, 0, 11, 20, 3, '#5c4a10');
      PROJECTILES.wave.push(c);
    }
  }

  // ---------------- API ----------------

  PF.SPRITES = {
    FRAME_W, FRAME_H, ANCHOR_X, FEET_BASE,

    buildAll() {
      PF.CHAR_IDS.forEach(id => buildCharacter(PF.CHARS[id]));
      buildProjectiles();
    },

    get(charId, anim, frame) {
      const set = FRAMES[charId] && FRAMES[charId][anim];
      if (!set) return null;
      return set[frame % set.length];
    },

    frameCount(charId, anim) {
      const set = FRAMES[charId] && FRAMES[charId][anim];
      return set ? set.length : 1;
    },

    portrait(charId) { return PORTRAITS[charId]; },

    projectile(kind, frame) {
      const set = PROJECTILES[kind];
      return set ? set[frame % set.length] : null;
    },

    // Disegna un frame nel mondo (flip gestito qui)
    drawFrame(ctx, charId, anim, frame, x, y, scale, facing, opts) {
      const img = this.get(charId, anim, frame);
      if (!img) return;
      opts = opts || {};
      const w = FRAME_W * scale, h = FRAME_H * scale;

      let src = img;
      if (opts.flash > 0) {
        const s = makeCanvas(FRAME_W, FRAME_H);
        s.ctx.drawImage(img, 0, 0);
        s.ctx.globalCompositeOperation = 'source-in';
        s.ctx.fillStyle = opts.flashColor || '#ffffff';
        s.ctx.fillRect(0, 0, FRAME_W, FRAME_H);
        src = s.c;
      }

      ctx.save();
      if (opts.alpha !== undefined) ctx.globalAlpha = opts.alpha;
      ctx.translate(Math.round(x), Math.round(y));
      if (facing < 0) ctx.scale(-1, 1);
      ctx.drawImage(src, -w / 2, -FEET_BASE * scale, w, h);
      ctx.restore();
    }
  };
})();
