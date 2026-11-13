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

  // Luce: velatura chiara per spigoli esposti (shading 16-bit)
  function hi(ctx, x, y, w, h) {
    px(ctx, x, y, w, h, 'rgba(255,255,255,0.22)');
  }

  // Ombra: velatura scura per volumi
  function sh(ctx, x, y, w, h) {
    px(ctx, x, y, w, h, 'rgba(0,0,0,0.30)');
  }

  // Outline 16-bit: contorno scuro attorno alla silhouette (post-process)
  function addOutline(ctx, w, h) {
    if (typeof ctx.getImageData !== 'function' || typeof ctx.putImageData !== 'function') return;
    let img;
    try { img = ctx.getImageData(0, 0, w, h); } catch (e) { return; }
    if (!img || !img.data) return;
    const d = img.data;
    const solid = new Uint8Array(w * h);
    for (let i = 0; i < w * h; i++) solid[i] = d[i * 4 + 3] > 40 ? 1 : 0;
    const need = new Uint8Array(w * h);
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const i = y * w + x;
        if (solid[i]) continue;
        if ((x > 0 && solid[i - 1]) || (x < w - 1 && solid[i + 1]) ||
            (y > 0 && solid[i - w]) || (y < h - 1 && solid[i + w])) need[i] = 1;
      }
    }
    for (let i = 0; i < w * h; i++) {
      if (!need[i]) continue;
      d[i * 4] = 24; d[i * 4 + 1] = 18; d[i * 4 + 2] = 30; d[i * 4 + 3] = 255;
    }
    ctx.putImageData(img, 0, 0);
  }

  // Torso a V con muscoli: vita stretta, pettorali, addominali, shading laterale
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
      const cx = hip.x + dx * t, cy = Math.round(hip.y + dy * t);
      px(ctx, cx - w / 2, cy, w, 1, p.main);
      px(ctx, cx - w / 2, cy, 1, 1, p.mainDark);                    // lato schiena in ombra
      if (i % 3 === 1) hi(ctx, cx + w / 2 - 1, cy, 1, 1);           // luce sul petto
    }
    // clavicole
    px(ctx, neck.x - (b.torsoW + 1) / 2, neck.y - 1, b.torsoW + 1, 3, p.main);
    px(ctx, neck.x - (b.torsoW + 1) / 2, neck.y + 1, b.torsoW + 1, 1, p.mainDark);
    // pettorali: solco centrale + arco inferiore
    const pecX = hip.x + dx * 0.62, pecY = Math.round(hip.y + dy * 0.62);
    const pecW = Math.max(5, b.torsoW - 1);
    px(ctx, Math.round(pecX), pecY, 1, 2, p.mainDark);
    px(ctx, Math.round(pecX - pecW / 2) + 1, pecY + 1, pecW - 2, 1, p.mainDark);
    // addominali
    const abX = Math.round(hip.x + dx * 0.3), abY = Math.round(hip.y + dy * 0.3);
    px(ctx, abX, abY, 1, 1, p.mainDark);
    px(ctx, abX, abY + 3, 1, 1, p.mainDark);
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
    const face = pose.face || 'calm';

    // collo (trapezio con luce)
    px(ctx, hx - 1, y + hh - 2, 3, 3, p.skinDark);
    px(ctx, hx, y + hh - 2, 1, 3, p.skin);

    // cranio + mandibola rastremata
    px(ctx, x, y, hw, hh - 2, p.skin);
    px(ctx, x + 1, y + hh - 2, hw - 3, 2, p.skin);
    px(ctx, x + 1, y + hh - 1, hw - 4, 1, p.skinDark);
    px(ctx, x, y + 2, 1, 3, p.skinDark);            // orecchio
    px(ctx, x + hw - 1, y + 3, 1, 2, p.skinDark);   // naso (profilo 3/4)
    px(ctx, x + hw - 2, y + 5, 1, 1, p.skinDark);    // ombra sotto il naso
    px(ctx, x + 1, y + hh - 2, 1, 1, p.skinDark);    // linea mandibola
    hi(ctx, x + 1, y, hw - 3, 1);                    // luce sul fronte
    hi(ctx, x + hw - 4, y + 5, 1, 1);                // luce sulla guancia

    // occhi ed espressioni
    const ex = x + hw - 3;
    if (ch.hairStyle === 'ninja') {
      // maschera: fessura occhi
      px(ctx, x + 1, y + 3, hw - 2, 3, p.mainDark);
      px(ctx, ex, y + 4, 2, 1, face === 'roar' ? p.accent : p.eye);
    } else if (face === 'ouch' || face === 'ko') {
      // occhi chiusi
      px(ctx, ex, y + 4, 2, 1, p.eye);
      px(ctx, ex - 3, y + 4, 1, 1, p.eye);
    } else {
      // occhi: bianco + pupilla avanti
      px(ctx, ex, y + 3, 2, 2, '#ffffff');
      px(ctx, ex + 1, y + 3, 1, 2, p.eye);
      px(ctx, ex - 3, y + 3, 1, 2, '#ffffff');
      px(ctx, ex - 3, y + 3, 1, 1, p.eye);
    }
    // sopracciglia (aggrottate sotto sforzo)
    if (ch.hairStyle !== 'ninja') {
      px(ctx, ex - 1, y + 2, 3, 1, p.hairDark);
      if (face === 'strain' || face === 'roar') px(ctx, ex - 2, y + 3, 1, 1, p.hairDark);
    }
    // bocca secondo espressione
    const my = y + hh - 2;
    if (face === 'roar') {
      px(ctx, x + hw - 5, my - 1, 3, 2, '#5a2020');  // grido
    } else if (face === 'strain' || face === 'ouch') {
      px(ctx, x + hw - 5, my, 2, 1, '#5a2020');
    } else if (face === 'smile') {
      px(ctx, x + hw - 5, my, 2, 1, '#8a4a3a');
      px(ctx, x + hw - 6, my - 1, 1, 1, '#8a4a3a');
    } else if (face === 'ko') {
      px(ctx, x + hw - 5, my, 2, 1, '#5a2020');
    } else {
      px(ctx, x + hw - 5, my, 1, 1, p.skinDark);
    }

    // capelli (due tonalità + ciocche)
    switch (ch.hairStyle) {
      case 'messy': {
        px(ctx, x - 1, y - 2, hw + 2, 3, p.hair);
        px(ctx, x - 1, y - 2, hw + 2, 1, p.hairDark);
        const w = Math.sin(tick * 0.15) > 0 ? 0 : 1;
        px(ctx, x - 2, y - 1 + w, 2, 2, p.hairDark);
        px(ctx, x + 2, y - 4, 2, 3, p.hair);
        px(ctx, x + 2, y - 4, 1, 2, p.hairDark);
        px(ctx, x + 5, y - 3 - w, 2, 2, p.hairDark);
        px(ctx, x + hw - 1, y, 2, 2, p.hair);
        px(ctx, x - 1, y + 1, 2, 3, p.hairDark); // basette
        break;
      }
      case 'bald': {
        px(ctx, x + 1, y + 1, 2, 1, '#f0c8a0');
        hi(ctx, x + 1, y, 3, 1);
        px(ctx, x, y - 1, hw, 1, p.skinDark);
        px(ctx, x + 1, y + hh - 3, hw - 2, 3, p.hair);
        px(ctx, x + 1, y + hh - 3, hw - 2, 1, p.hairDark);
        px(ctx, x + hw - 3, y + 4, 3, 4, p.hair);
        px(ctx, x + hw - 3, y + 6, 3, 2, p.hairDark);
        break;
      }
      case 'cap': {
        px(ctx, x - 1, y - 1, hw + 2, 2, p.hair); // capelli sotto il cappellino
        px(ctx, x - 1, y - 3, hw + 2, 3, p.cap);
        px(ctx, x - 1, y - 3, hw + 2, 1, p.capDark);
        px(ctx, x + 1, y - 2, 2, 1, 'rgba(255,255,255,0.30)'); // riflesso
        px(ctx, x + hw - 2, y - 1, 4, 2, p.cap);  // visiera avanti
        px(ctx, x + hw - 2, y, 4, 1, p.capDark);
        px(ctx, x + 1, y - 3, 1, 1, p.capDark);   // bottone
        break;
      }
      case 'ninja': {
        px(ctx, x - 1, y - 2, hw + 2, 5, p.main);
        px(ctx, x - 1, y - 2, hw + 2, 2, p.mainDark);
        px(ctx, x - 1, y + 2, 2, hh - 2, p.main);
        hi(ctx, x + 1, y - 2, hw - 3, 1);
        // mascherina sul basso viso
        px(ctx, x + 1, y + hh - 3, hw - 2, 2, p.mainDark);
        // sciarpa (mossa dal vento)
        const t = Math.round(Math.sin(tick * 0.18) * 2);
        px(ctx, x - 4, y + hh - 2 + t, 4, 2, p.accent);
        px(ctx, x - 7, y + hh - 1 + t, 3, 1, p.accent);
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

    // braccio dietro: deltoide, bicipite rastremato, avambraccio, pugno
    px(ctx, shoulderB.x - 2, shoulderB.y - 2, 4, 3, p.mainDark);
    taperedLimb(ctx, shoulderB.x, shoulderB.y, elbowB.x, elbowB.y, b.armW + 1, b.armW, p.mainDark);
    taperedLimb(ctx, elbowB.x, elbowB.y, handB.x, handB.y, b.armW, b.armW - 1, p.mainDark);
    bulge(ctx, shoulderB.x, shoulderB.y, elbowB.x, elbowB.y, 0.45, 1, p.mainDark);
    sh(ctx, elbowB.x - 1, elbowB.y, 2, 1);
    px(ctx, handB.x - 1, handB.y - 1, 3, 3, p.glove);
    px(ctx, handB.x, handB.y - 2, 2, 1, p.glove);
    sh(ctx, handB.x - 1, handB.y + 1, 3, 1);

    // gamba dietro: coscia, polpaccio, stivale con suola
    taperedLimb(ctx, hipB.x, hipB.y, kneeB.x, kneeB.y, b.legW + 2, b.legW, p.pantsDark);
    taperedLimb(ctx, kneeB.x, kneeB.y, footB.x, footB.y, b.legW, b.legW - 1, p.pantsDark);
    bulge(ctx, kneeB.x, kneeB.y, footB.x, footB.y, 0.35, 1, p.pantsDark);
    px(ctx, footB.x - 2, footB.y - 1, 6, 3, p.boots);
    px(ctx, footB.x + 3, footB.y, 2, 2, p.boots);
    sh(ctx, footB.x - 2, footB.y + 1, 8, 1);

    // torso a V con dettagli
    drawTorso(ctx, ch, hip, neck);
    px(ctx, hip.x - (b.torsoW - 3) / 2, hip.y - 2, b.torsoW - 3, 3, p.accent); // cintura sulla vita
    drawTorsoDetails(ctx, ch, hip, neck);

    // gamba fronte: coscia, ginocchio, polpaccio, stivale con suola e laccio
    taperedLimb(ctx, hipF.x, hipF.y, kneeF.x, kneeF.y, b.legW + 2, b.legW, p.pants);
    taperedLimb(ctx, kneeF.x, kneeF.y, footF.x, footF.y, b.legW, b.legW - 1, p.pants);
    bulge(ctx, kneeF.x, kneeF.y, footF.x, footF.y, 0.35, 1, p.pants);
    hi(ctx, hipF.x + (kneeF.x - hipF.x) * 0.3 - 1, hipF.y + (kneeF.y - hipF.y) * 0.3, 1, 2);
    px(ctx, footF.x - 2, footF.y - 1, 6, 3, p.boots);
    px(ctx, footF.x + 3, footF.y, 2, 2, p.boots);
    px(ctx, footF.x, footF.y - 1, 1, 1, p.pantsDark); // laccio
    px(ctx, footF.x - 2, footF.y - 2, 6, 1, p.boots);   // risvolto
    sh(ctx, footF.x - 2, footF.y + 1, 8, 1);          // suola

    // testa
    drawHead(ctx, ch, head.x, head.y, pose, tick);

    // braccio fronte: deltoide, bicipite, avambraccio, pugno
    px(ctx, shoulderF.x - 1, shoulderF.y - 2, 4, 3, p.main);
    sh(ctx, shoulderF.x - 1, shoulderF.y, 4, 1);
    taperedLimb(ctx, shoulderF.x, shoulderF.y, elbowF.x, elbowF.y, b.armW + 1, b.armW, p.main);
    taperedLimb(ctx, elbowF.x, elbowF.y, handF.x, handF.y, b.armW, b.armW - 1, p.main);
    bulge(ctx, shoulderF.x, shoulderF.y, elbowF.x, elbowF.y, 0.45, 1, p.main);
    hi(ctx, shoulderF.x + (elbowF.x - shoulderF.x) * 0.3, shoulderF.y + (elbowF.y - shoulderF.y) * 0.3 - 1, 2, 1);
    sh(ctx, elbowF.x - 1, elbowF.y, 2, 1);
    px(ctx, handF.x - 1, handF.y - 1, 3, 3, p.glove);
    px(ctx, handF.x, handF.y - 2, 2, 1, p.glove);
    px(ctx, handF.x - 2, handF.y - 1, 1, 2, p.accent);   // polsino
    sh(ctx, handF.x - 1, handF.y + 1, 3, 1);

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
      // colletto + pieghe del tessuto + fibbia della cintura
      px(ctx, neck.x - 3, neck.y + 1, 2, 2, p.mainDark);
      px(ctx, hip.x - 4, neck.y + 7, 1, 3, p.mainDark);
      px(ctx, hip.x + 3, neck.y + 9, 1, 3, p.mainDark);
      px(ctx, hip.x, hip.y - 2, 1, 3, '#e8c840');
    }
    if (ch.id === 'shadow') {
      // grembiule da magazzino (segue la rastrematura del torso)
      px(ctx, hip.x - 3, neck.y + 4, 6, hip.y - neck.y - 5, '#2e5c46');
      px(ctx, neck.x + 1, neck.y + 1, 2, 3, '#2e5c46');
      // bretella incrociata, tasca e pieghe
      px(ctx, hip.x - 3, neck.y + 4, 6, 1, '#24503c');
      px(ctx, hip.x - 2, hip.y - 7, 4, 3, '#24503c');
      px(ctx, hip.x + 2, neck.y + 6, 1, 4, '#24503c');
      px(ctx, hip.x - 3, hip.y - 3, 1, 2, '#24503c');
    }
    if (ch.id === 'titan') {
      // grembiule da macellaio: bretelle + tasca + nodo sul fianco
      px(ctx, neck.x - 1, neck.y, 3, 4, p.mainDark);
      px(ctx, hip.x - 5, hip.y - 5, 11, 2, p.accent);
      px(ctx, hip.x - 4, hip.y - 9, 4, 3, '#e8e8e0');
      px(ctx, hip.x + 4, neck.y + 4, 2, 2, p.mainDark);
      px(ctx, hip.x - 5, hip.y - 4, 1, 1, p.mainDark);
    }
    if (ch.id === 'volt') {
      // colletto bianco + fiocchetto da cassiere
      px(ctx, neck.x - 2, neck.y + 1, 5, 2, '#f4f4f4');
      px(ctx, neck.x - 1, neck.y + 3, 3, 2, p.accent);
      // zip e bottoni del gilet + taschino
      px(ctx, neck.x, neck.y + 5, 1, hip.y - neck.y - 7, p.mainDark);
      px(ctx, hip.x - 4, neck.y + 7, 1, 1, p.mainDark);
      px(ctx, hip.x + 2, neck.y + 8, 3, 2, p.mainDark);
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
    drawHead(ctx, ch, 17, y - 1, { hipY: y, face: 'ko' }, 0);
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
        addOutline(ctx, FRAME_W, FRAME_H);
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
    // busto: vestiti con ombre
    px(ctx, 5, 24, 22, 8, p.main);
    px(ctx, 5, 24, 22, 2, p.mainDark);
    px(ctx, 5, 24, 2, 8, p.mainDark);
    hi(ctx, 22, 25, 4, 6);
    px(ctx, 14, 21, 4, 4, p.skinDark);
    px(ctx, 15, 21, 2, 4, p.skin);
    // testa grande
    px(ctx, 9, 5, 14, 14, p.skin);
    px(ctx, 10, 19, 12, 2, p.skin);
    px(ctx, 10, 20, 11, 1, p.skinDark);
    px(ctx, 9, 5, 1, 12, p.skinDark);
    px(ctx, 22, 10, 1, 3, p.skinDark);   // naso
    px(ctx, 9, 8, 1, 3, p.skinDark);     // orecchio
    hi(ctx, 10, 5, 11, 1);
    // occhi dettagliati con sopracciglia
    if (ch.hairStyle === 'ninja') {
      px(ctx, 10, 11, 12, 3, p.mainDark);
      px(ctx, 18, 12, 2, 1, p.eye);
      px(ctx, 13, 12, 2, 1, p.eye);
    } else {
      px(ctx, 18, 11, 2, 3, '#ffffff'); px(ctx, 19, 11, 1, 3, p.eye);
      px(ctx, 12, 11, 2, 3, '#ffffff'); px(ctx, 12, 11, 1, 3, p.eye);
      px(ctx, 17, 9, 4, 1, p.hairDark);
      px(ctx, 11, 9, 3, 1, p.hairDark);
    }
    // bocca
    px(ctx, 17, 17, 3, 1, '#8a4a3a');
    // capelli
    switch (ch.hairStyle) {
      case 'messy':
        px(ctx, 8, 2, 16, 4, p.hair);
        px(ctx, 8, 2, 16, 1, p.hairDark);
        px(ctx, 10, 0, 3, 3, p.hairDark); px(ctx, 15, 0, 3, 3, p.hair); px(ctx, 20, 1, 3, 2, p.hairDark);
        px(ctx, 8, 6, 2, 6, p.hairDark);
        px(ctx, 22, 5, 2, 3, p.hair);
        break;
      case 'ninja':
        px(ctx, 8, 1, 16, 8, p.main);
        px(ctx, 8, 1, 16, 2, p.mainDark);
        px(ctx, 8, 9, 2, 9, p.main);
        hi(ctx, 10, 2, 12, 1);
        px(ctx, 6, 18, 5, 2, p.accent); px(ctx, 3, 20, 4, 1, p.accent);
        px(ctx, 10, 18, 12, 2, p.mainDark);
        break;
      case 'bald':
        px(ctx, 10, 5, 3, 1, '#f0c8a0');
        hi(ctx, 10, 6, 2, 2);
        px(ctx, 10, 16, 12, 5, p.hair);
        px(ctx, 10, 19, 12, 2, p.hairDark);
        px(ctx, 21, 16, 3, 5, p.hairDark);
        break;
      case 'cap':
        px(ctx, 8, 1, 16, 5, p.cap);
        px(ctx, 8, 1, 16, 1, p.capDark);
        px(ctx, 10, 2, 3, 1, 'rgba(255,255,255,0.35)');
        px(ctx, 20, 4, 7, 2, p.cap);
        px(ctx, 20, 5, 7, 1, p.capDark);
        px(ctx, 15, 1, 1, 1, p.capDark);
        break;
    }
    // dettagli vestito per personaggio
    if (ch.id === 'blaze') {
      px(ctx, 13, 25, 5, 1, p.accent);
      px(ctx, 13, 26, 1, 1, p.accent);
      px(ctx, 13, 27, 5, 1, p.accent);
      px(ctx, 17, 28, 1, 1, p.accent);
      px(ctx, 13, 29, 5, 1, p.accent);
    }
    if (ch.id === 'shadow') {
      px(ctx, 10, 26, 12, 6, '#2e5c46');
      px(ctx, 10, 26, 12, 1, '#1f4634');
    }
    if (ch.id === 'titan') {
      px(ctx, 6, 29, 20, 2, p.accent);
      px(ctx, 15, 21, 2, 4, p.mainDark); // bretella
    }
    if (ch.id === 'volt') {
      px(ctx, 13, 22, 6, 2, '#f4f4f4');
      px(ctx, 14, 24, 4, 2, p.accent);
    }
    // outline + cornice
    addOutline(ctx, 32, 32);
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
