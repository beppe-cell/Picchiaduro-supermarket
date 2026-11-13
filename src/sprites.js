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
      desc: 'Il campione del supermercato, equilibrato.<br>Mossa: <b>INFERNO WAVE</b> (palla di fuoco)',
      specialName: 'INFERNO WAVE',
      maxHealth: 100, walkSpeed: 1.55, runSpeed: 3.0, power: 1.0, defense: 1.0,
      jumpPower: 7.6, weight: 1.0,
      body: { torsoW: 10, armW: 4, legW: 5, headW: 9 },
      palette: {
        skin: '#e8a06c', skinDark: '#c07a4a',
        main: '#d8402f', mainDark: '#a02418',
        pants: '#23252e', pantsDark: '#14151c',
        boots: '#6b4a2a', hair: '#2a2a2a', hairDark: '#151515',
        accent: '#ffe66d', eye: '#1a1a1a', glove: '#f0b080'
      },
      hairStyle: 'messy'
    },
    shadow: {
      id: 'shadow', name: 'SHADOW',
      desc: 'Ninja del magazzino, specialista di combo.<br>Mossa: <b>PHANTOM RUSH</b> (affondo spettrale)',
      specialName: 'PHANTOM RUSH',
      maxHealth: 90, walkSpeed: 2.0, runSpeed: 3.8, power: 0.9, defense: 1.1,
      jumpPower: 8.2, weight: 0.85,
      body: { torsoW: 9, armW: 3, legW: 4, headW: 9 },
      palette: {
        skin: '#c8956c', skinDark: '#a07048',
        main: '#2c3358', mainDark: '#181c34',
        pants: '#1c2038', pantsDark: '#12141f',
        boots: '#3a2e22', hair: '#181c34', hairDark: '#10121e',
        accent: '#e04848', eye: '#dfe8ff', glove: '#181c34'
      },
      hairStyle: 'ninja'
    },
    titan: {
      id: 'titan', name: 'TITAN',
      desc: 'Il macellaio: lento ma devastante.<br>Mossa: <b>SEISMIC SLAM</b> (onda sismica)',
      specialName: 'SEISMIC SLAM',
      maxHealth: 120, walkSpeed: 1.15, runSpeed: 2.2, power: 1.35, defense: 0.78,
      jumpPower: 6.6, weight: 1.3,
      body: { torsoW: 14, armW: 6, legW: 6, headW: 10 },
      palette: {
        skin: '#d99a66', skinDark: '#b0763f',
        main: '#ece8de', mainDark: '#c2bcb0',
        pants: '#3a4a5c', pantsDark: '#28364a',
        boots: '#4a3b2f', hair: '#3d2f23', hairDark: '#2a1f16',
        accent: '#c8342a', eye: '#1a1a1a', glove: '#d99a66'
      },
      hairStyle: 'bald'
    },
    volt: {
      id: 'volt', name: 'VOLT',
      desc: 'Cassiere fulmineo, colpi elettrici.<br>Mossa: <b>THUNDER FANG</b> (tripla scarica)',
      specialName: 'THUNDER FANG',
      maxHealth: 95, walkSpeed: 1.85, runSpeed: 3.4, power: 0.95, defense: 1.0,
      jumpPower: 8.0, weight: 0.9,
      body: { torsoW: 9, armW: 3, legW: 4, headW: 9 },
      palette: {
        skin: '#e8b28a', skinDark: '#c08a5c',
        main: '#f2b418', mainDark: '#c08410',
        pants: '#23252e', pantsDark: '#14151c',
        boots: '#2a2e3a', hair: '#3a2c1e', hairDark: '#241a10',
        accent: '#3fae6a', eye: '#111111', glove: '#2a2e3a',
        cap: '#c8342a', capDark: '#9c2418'
      },
      hairStyle: 'cap'
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

  // Segmento rastremato: largo alla radice, stretto in punta (niente rettangoli)
  function taperedLimb(ctx, x1, y1, x2, y2, w1, w2, color) {
    const dx = x2 - x1, dy = y2 - y1;
    const steps = Math.max(Math.abs(dx), Math.abs(dy), 1);
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const w = Math.max(1, Math.round(w1 + (w2 - w1) * t));
      px(ctx, x1 + dx * t - w / 2, y1 + dy * t - w / 2, w, w, color);
    }
  }

  // Rigonfiamento muscolare lungo un segmento (bicipite / polpaccio)
  function bulge(ctx, x1, y1, x2, y2, t, extra, color) {
    const x = x1 + (x2 - x1) * t, y = y1 + (y2 - y1) * t;
    const w = 2 + extra;
    px(ctx, x - w / 2, y - w / 2, w, w, color);
  }

  // Torso a V: vita stretta, petto ampio, spalle larghe (proporzioni da lottatore)
  function drawTorso(ctx, ch, hip, neck) {
    const p = ch.palette, b = ch.body;
    const dx = neck.x - hip.x, dy = neck.y - hip.y;
    const steps = Math.max(Math.abs(dy), 1);
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      let w;
      if (t < 0.2) w = b.torsoW - 3;                        // vita
      else if (t < 0.7) w = b.torsoW - 3 + (t - 0.2) * 6.6; // petto
      else w = b.torsoW + 1;                                 // spalle
      w = Math.round(Math.max(4, w));
      px(ctx, hip.x + dx * t - w / 2, Math.round(hip.y + dy * t), w, 1, p.main);
    }
    // massa pettorale e ombra sotto le clavicole
    px(ctx, neck.x - (b.torsoW + 1) / 2, neck.y - 1, b.torsoW + 1, 3, p.main);
    px(ctx, neck.x - (b.torsoW + 1) / 2, neck.y + 1, b.torsoW + 1, 1, p.mainDark);
    px(ctx, hip.x + dx * 0.72, hip.y + dy * 0.72, 1, 2, p.mainDark);
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

    // testa: cranio + mandibola rastremata (non un rettangolo)
    px(ctx, x, y, hw, hh - 2, p.skin);
    px(ctx, x + 1, y + hh - 2, hw - 3, 2, p.skin);
    px(ctx, x + 1, y + hh - 1, hw - 4, 1, p.skinDark);
    px(ctx, x + hw - 1, y + 3, 1, 2, p.skinDark); // naso (profilo 3/4)
    px(ctx, x, y + 2, 1, 3, p.skinDark);          // orecchio

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
      case 'messy': {
        // capelli neri corti e spettinati
        px(ctx, x - 1, y - 2, hw + 2, 3, p.hair);
        const w = Math.sin(tick * 0.15) > 0 ? 0 : 1;
        px(ctx, x - 2, y - 1 + w, 2, 2, p.hairDark);
        px(ctx, x + 2, y - 4, 2, 3, p.hair);
        px(ctx, x + 5, y - 3 - w, 2, 2, p.hairDark);
        px(ctx, x + hw - 1, y, 2, 2, p.hair);
        px(ctx, x - 1, y + 1, 2, 3, p.hairDark); // basette
        break;
      }
      case 'bald': {
        // cranio lucido + barba folta
        px(ctx, x + 1, y + 1, 2, 1, '#f0c8a0');
        px(ctx, x, y - 1, hw, 1, p.skinDark);
        px(ctx, x + 1, y + hh - 3, hw - 2, 3, p.hair);
        px(ctx, x + hw - 3, y + 4, 3, 4, p.hair);
        break;
      }
      case 'cap': {
        px(ctx, x - 1, y - 1, hw + 2, 2, p.hair); // capelli sotto il cappellino
        px(ctx, x - 1, y - 3, hw + 2, 3, p.cap);
        px(ctx, x - 1, y - 3, hw + 2, 1, p.capDark);
        px(ctx, x + hw - 2, y - 1, 4, 2, p.cap);  // visiera avanti
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

    // braccio dietro: bicipite rastremato + avambraccio
    taperedLimb(ctx, shoulderB.x, shoulderB.y, elbowB.x, elbowB.y, b.armW + 1, b.armW, p.mainDark);
    taperedLimb(ctx, elbowB.x, elbowB.y, handB.x, handB.y, b.armW, b.armW - 1, p.mainDark);
    bulge(ctx, shoulderB.x, shoulderB.y, elbowB.x, elbowB.y, 0.45, 1, p.mainDark);
    px(ctx, handB.x - 1, handB.y - 1, 3, 3, p.glove);
    px(ctx, handB.x, handB.y - 2, 2, 1, p.glove);

    // gamba dietro: coscia, polpaccio, piede con punta
    taperedLimb(ctx, hipB.x, hipB.y, kneeB.x, kneeB.y, b.legW + 2, b.legW, p.pantsDark);
    taperedLimb(ctx, kneeB.x, kneeB.y, footB.x, footB.y, b.legW, b.legW - 1, p.pantsDark);
    bulge(ctx, kneeB.x, kneeB.y, footB.x, footB.y, 0.35, 1, p.pantsDark);
    px(ctx, footB.x - 2, footB.y - 1, 6, 3, p.boots);
    px(ctx, footB.x + 3, footB.y, 2, 2, p.boots);

    // torso a V con dettagli
    drawTorso(ctx, ch, hip, neck);
    px(ctx, hip.x - (b.torsoW - 3) / 2, hip.y - 2, b.torsoW - 3, 3, p.accent); // cintura sulla vita
    drawTorsoDetails(ctx, ch, hip, neck);

    // gamba fronte
    taperedLimb(ctx, hipF.x, hipF.y, kneeF.x, kneeF.y, b.legW + 2, b.legW, p.pants);
    taperedLimb(ctx, kneeF.x, kneeF.y, footF.x, footF.y, b.legW, b.legW - 1, p.pants);
    bulge(ctx, kneeF.x, kneeF.y, footF.x, footF.y, 0.35, 1, p.pants);
    px(ctx, footF.x - 2, footF.y - 1, 6, 3, p.boots);
    px(ctx, footF.x + 3, footF.y, 2, 2, p.boots);

    // testa
    drawHead(ctx, ch, head.x, head.y, pose, tick);

    // braccio fronte
    taperedLimb(ctx, shoulderF.x, shoulderF.y, elbowF.x, elbowF.y, b.armW + 1, b.armW, p.main);
    taperedLimb(ctx, elbowF.x, elbowF.y, handF.x, handF.y, b.armW, b.armW - 1, p.main);
    bulge(ctx, shoulderF.x, shoulderF.y, elbowF.x, elbowF.y, 0.45, 1, p.main);
    px(ctx, handF.x - 1, handF.y - 1, 3, 3, p.glove);
    px(ctx, handF.x, handF.y - 2, 2, 1, p.glove);

    // effetti per-personaggio su pose speciali
    drawCharFx(ctx, ch, pose, handF, handB, tick);
  }

  // Dettagli torso per l'identità da supermercato
  function drawTorsoDetails(ctx, ch, hip, neck) {
    const p = ch.palette;
    if (ch.id === 'blaze') {
      // logo "S" giallo sulla maglia rossa
      const lx = Math.round(neck.x - 2), ly = Math.round(neck.y + 3);
      px(ctx, lx, ly, 5, 1, p.accent);
      px(ctx, lx, ly + 1, 1, 1, p.accent);
      px(ctx, lx, ly + 2, 5, 1, p.accent);
      px(ctx, lx + 4, ly + 3, 1, 1, p.accent);
      px(ctx, lx, ly + 4, 5, 1, p.accent);
    }
    if (ch.id === 'shadow') {
      // grembiule da magazzino (segue la rastrematura del torso)
      px(ctx, hip.x - 3, neck.y + 4, 6, hip.y - neck.y - 5, '#2e5c46');
      px(ctx, neck.x + 1, neck.y + 1, 2, 3, '#2e5c46');
    }
    if (ch.id === 'titan') {
      // grembiule da macellaio: bretella + rifinitura sulla vita
      px(ctx, neck.x - 1, neck.y, 3, 4, p.mainDark);
      px(ctx, hip.x - 5, hip.y - 5, 11, 2, p.accent);
    }
    if (ch.id === 'volt') {
      // colletto bianco + fiocchetto da cassiere
      px(ctx, neck.x - 2, neck.y + 1, 5, 2, '#f4f4f4');
      px(ctx, neck.x - 1, neck.y + 3, 3, 2, p.accent);
    }
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
  let scratch = null;  // canvas riusabile per il flash dei colpi

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
      case 'messy':
        px(ctx, 8, 3, 16, 4, p.hair);
        px(ctx, 10, 1, 3, 3, p.hairDark); px(ctx, 15, 0, 3, 4, p.hair); px(ctx, 20, 1, 3, 3, p.hairDark);
        px(ctx, 8, 7, 2, 6, p.hairDark);
        break;
      case 'ninja':
        px(ctx, 8, 2, 16, 8, p.main);
        px(ctx, 8, 2, 16, 2, p.mainDark);
        px(ctx, 8, 10, 2, 8, p.main);
        px(ctx, 6, 18, 5, 2, p.accent); px(ctx, 3, 20, 4, 1, p.accent);
        break;
      case 'bald':
        px(ctx, 10, 6, 3, 1, '#f0c8a0');
        px(ctx, 10, 17, 12, 4, p.hair);
        px(ctx, 20, 17, 3, 4, p.hairDark);
        break;
      case 'cap':
        px(ctx, 8, 2, 16, 5, p.cap);
        px(ctx, 8, 2, 16, 1, p.capDark);
        px(ctx, 20, 5, 6, 2, p.cap);
        break;
    }
    // dettagli torso sul busto
    if (ch.id === 'blaze') {
      px(ctx, 13, 25, 5, 1, p.accent);
      px(ctx, 13, 26, 1, 1, p.accent);
      px(ctx, 13, 27, 5, 1, p.accent);
      px(ctx, 17, 28, 1, 1, p.accent);
      px(ctx, 13, 29, 5, 1, p.accent);
    }
    if (ch.id === 'shadow') {
      px(ctx, 10, 26, 12, 6, '#2e5c46');
    }
    if (ch.id === 'titan') {
      px(ctx, 6, 29, 20, 2, p.accent);
    }
    if (ch.id === 'volt') {
      px(ctx, 13, 23, 6, 2, '#f4f4f4');
      px(ctx, 14, 25, 4, 2, p.accent);
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
        if (!scratch) scratch = makeCanvas(FRAME_W, FRAME_H);
        scratch.ctx.globalCompositeOperation = 'source-over';
        scratch.ctx.clearRect(0, 0, FRAME_W, FRAME_H);
        scratch.ctx.drawImage(img, 0, 0);
        scratch.ctx.globalCompositeOperation = 'source-in';
        scratch.ctx.fillStyle = opts.flashColor || '#ffffff';
        scratch.ctx.fillRect(0, 0, FRAME_W, FRAME_H);
        src = scratch.c;
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
