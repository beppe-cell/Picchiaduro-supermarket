/* ============================================================
   PIXEL FURY — stages.js
   3 arene con parallasse: NEON CITY, DOJO, WASTELAND.
   Layer statici pre-renderizzati su canvas offscreen,
   elementi animati (insegne neon, lanterne, fumo) disegnati live.
   ============================================================ */

window.PF = window.PF || {};

(function () {
  'use strict';

  const VIEW_W = 512, VIEW_H = 288;
  const STAGE_W = 960;          // larghezza arena
  const GROUND_Y = 248;

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

  function vGradient(ctx, x, y, w, h, colors) {
    const bandH = Math.max(1, Math.floor(h / colors.length));
    colors.forEach((c, i) => px(ctx, x, y + i * bandH, w, bandH, c));
  }

  // ============================================================
  // NEON CITY
  // ============================================================

  function buildNeonCity() {
    const layers = [];

    // --- cielo + stelle (parallasse 0) ---
    const sky = makeCanvas(VIEW_W, VIEW_H);
    vGradient(sky.ctx, 0, 0, VIEW_W, GROUND_Y, ['#0a0a1e', '#12123a', '#1a1440', '#241450', '#2c1854']);
    for (let i = 0; i < 60; i++) {
      const s = Math.random();
      px(sky.ctx, Math.random() * VIEW_W, Math.random() * 150, 1, 1, s > 0.8 ? '#ffffff' : '#8888cc');
    }
    // luna
    px(sky.ctx, 400, 34, 26, 26, '#e8e8ff');
    px(sky.ctx, 396, 38, 8, 18, '#2c1854');
    px(sky.ctx, 404, 30, 18, 6, '#2c1854');
    layers.push({ img: sky.c, parallax: 0, y: 0 });

    // --- skyline lontana (0.2) ---
    const far = makeCanvas(STAGE_W * 0.2 + VIEW_W, VIEW_H);
    let x = 0;
    while (x < far.c.width) {
      const bw = 30 + Math.floor(Math.random() * 40);
      const bh = 60 + Math.floor(Math.random() * 70);
      px(far.ctx, x, GROUND_Y - bh - 40, bw, bh + 40, '#141432');
      // finestre spente quasi tutte
      for (let wy = GROUND_Y - bh - 34; wy < GROUND_Y - 46; wy += 7) {
        for (let wx = x + 3; wx < x + bw - 4; wx += 6) {
          if (Math.random() < 0.12) px(far.ctx, wx, wy, 2, 3, Math.random() < 0.5 ? '#4455aa' : '#334480');
        }
      }
      x += bw + 4;
    }
    layers.push({ img: far.c, parallax: 0.2, y: 0 });

    // --- edifici medi con insegne neon (0.5) ---
    const mid = makeCanvas(STAGE_W * 0.5 + VIEW_W, VIEW_H);
    const neonSigns = []; // {x,y,w,h,color,text,flicker}
    x = 0;
    const signs = [
      { text: 'PIXEL', color: '#4ae8ff' },
      { text: 'BAR', color: '#ff4a9a' },
      { text: '24H', color: '#ffe94a' },
      { text: 'FURY', color: '#ff8c1a' },
      { text: 'HOTEL', color: '#58e05a' }
    ];
    let si = 0;
    while (x < mid.c.width - 40) {
      const bw = 60 + Math.floor(Math.random() * 50);
      const bh = 90 + Math.floor(Math.random() * 60);
      const top = GROUND_Y - bh - 30;
      px(mid.ctx, x, top, bw, bh + 30, '#1c1c44');
      px(mid.ctx, x, top, bw, 4, '#28285a');
      for (let wy = top + 10; wy < GROUND_Y - 40; wy += 9) {
        for (let wx = x + 5; wx < x + bw - 6; wx += 8) {
          if (Math.random() < 0.3) px(mid.ctx, wx, wy, 3, 4, Math.random() < 0.7 ? '#3a3a80' : '#5a5ac0');
        }
      }
      if (Math.random() < 0.75 && si < signs.length) {
        const s = signs[si++];
        const sw = s.text.length * 7 + 6;
        const sx = x + Math.floor((bw - sw) / 2);
        const sy = top + 14 + Math.floor(Math.random() * 20);
        neonSigns.push({ x: sx, y: sy, w: sw, h: 14, color: s.color, text: s.text, flicker: Math.random() });
        si = si % signs.length;
      }
      x += bw + 10;
    }
    layers.push({ img: mid.c, parallax: 0.5, y: 0 });

    // --- strada (1.0) ---
    const road = makeCanvas(STAGE_W, VIEW_H);
    px(road.ctx, 0, GROUND_Y, STAGE_W, VIEW_H - GROUND_Y, '#2a2a34');
    px(road.ctx, 0, GROUND_Y, STAGE_W, 3, '#3a3a48');
    px(road.ctx, 0, GROUND_Y + 3, STAGE_W, 2, '#181820');
    // strisce corsia
    for (let rx = 20; rx < STAGE_W; rx += 64) px(road.ctx, rx, GROUND_Y + 22, 30, 3, '#c8c840');
    // tombino
    px(road.ctx, 300, GROUND_Y + 12, 18, 8, '#1a1a22');
    px(road.ctx, 302, GROUND_Y + 14, 14, 1, '#3a3a48');
    px(road.ctx, 302, GROUND_Y + 17, 14, 1, '#3a3a48');
    // fogne/grate luminose riflesse
    for (let rx = 100; rx < STAGE_W; rx += 180) {
      px(road.ctx, rx, GROUND_Y + 8, 40, 2, 'rgba(74,232,255,0.25)');
    }
    layers.push({ img: road.c, parallax: 1, y: 0 });

    // --- primo piano: recinzione (1.25) ---
    const fg = makeCanvas(STAGE_W * 1.25 + VIEW_W, VIEW_H);
    for (let fx = 0; fx < fg.c.width; fx += 26) {
      px(fg.ctx, fx, GROUND_Y + 26, 4, 14, '#0c0c18');
    }
    px(fg.ctx, 0, GROUND_Y + 27, fg.c.width, 3, '#0c0c18');
    layers.push({ img: fg.c, parallax: 1.25, y: 0, foreground: true });

    return {
      id: 'neon', name: 'NEON CITY', layers, neonSigns, groundY: GROUND_Y, width: STAGE_W,
      ambient: { type: 'steam', rate: 0.06 },
      drawAnimated(ctx, camX, t) {
        // insegne neon con flicker
        for (const s of this.neonSigns) {
          const sx = s.x - camX * 0.5;
          if (sx < -80 || sx > VIEW_W + 20) continue;
          const on = Math.sin(t * 0.02 + s.flicker * 20) > -0.85;
          if (!on) {
            px(ctx, sx, s.y, s.w, s.h, '#1a1a30');
            continue;
          }
          px(ctx, sx, s.y, s.w, s.h, '#0a0a16');
          ctx.fillStyle = s.color;
          ctx.font = '8px monospace';
          ctx.fillText(s.text, sx + 3, s.y + 10);
          px(ctx, sx, s.y, s.w, 1, s.color);
          px(ctx, sx, s.y + s.h - 1, s.w, 1, s.color);
          // alone
          ctx.fillStyle = s.color + '22';
          ctx.fillRect(sx - 2, s.y - 2, s.w + 4, s.h + 4);
        }
      }
    };
  }

  // ============================================================
  // DOJO
  // ============================================================

  function buildDojo() {
    const layers = [];
    const lanterns = [];

    // --- cielo tramonto ---
    const sky = makeCanvas(VIEW_W, VIEW_H);
    vGradient(sky.ctx, 0, 0, VIEW_W, GROUND_Y, ['#3a1440', '#6a2050', '#a04038', '#d06a2c', '#e89a4a']);
    px(sky.ctx, 210, 60, 40, 40, '#ffd98a');
    px(sky.ctx, 202, 68, 12, 24, '#d06a2c');
    px(sky.ctx, 224, 54, 20, 8, '#d06a2c');
    // nuvole
    for (let i = 0; i < 6; i++) {
      const cy = 30 + i * 22;
      px(sky.ctx, 40 + i * 80, cy, 60 + i * 6, 4, 'rgba(255,180,120,0.4)');
    }
    layers.push({ img: sky.c, parallax: 0, y: 0 });

    // --- montagne (0.15) ---
    const far = makeCanvas(STAGE_W * 0.15 + VIEW_W, VIEW_H);
    let x = 0;
    while (x < far.c.width) {
      const mw = 120 + Math.floor(Math.random() * 100);
      const mh = 70 + Math.floor(Math.random() * 50);
      for (let i = 0; i < mh; i++) {
        const w = mw * (1 - i / mh);
        px(far.ctx, x + (mw - w) / 2, GROUND_Y - 40 - i, w, 1, i > mh * 0.7 ? '#4a2848' : '#3a2040');
      }
      // neve in vetta
      px(far.ctx, x + mw / 2 - 8, GROUND_Y - 40 - mh, 16, 5, '#e8c8d8');
      x += mw * 0.6;
    }
    layers.push({ img: far.c, parallax: 0.15, y: 0 });

    // --- alberi (0.4) ---
    const mid = makeCanvas(STAGE_W * 0.4 + VIEW_W, VIEW_H);
    for (let tx = 20; tx < mid.c.width; tx += 90 + Math.random() * 60) {
      px(mid.ctx, tx, GROUND_Y - 90, 8, 50, '#3a2020');
      // chioma sakura
      for (let i = 0; i < 26; i++) {
        const bx = tx - 14 + Math.random() * 36;
        const by = GROUND_Y - 120 + Math.random() * 34;
        px(mid.ctx, bx, by, 5 + Math.random() * 5, 4, Math.random() < 0.7 ? '#d88aa8' : '#b86888');
      }
    }
    layers.push({ img: mid.c, parallax: 0.4, y: 0 });

    // --- tempio: muro, pilastri, cancello (0.8) ---
    const near = makeCanvas(STAGE_W * 0.8 + VIEW_W, VIEW_H);
    px(near.ctx, 0, GROUND_Y - 110, near.c.width, 110, '#5a3428');
    px(near.ctx, 0, GROUND_Y - 110, near.c.width, 4, '#7a4a34');
    // travi orizzontali
    for (let by = GROUND_Y - 100; by < GROUND_Y; by += 24) {
      px(near.ctx, 0, by, near.c.width, 3, '#4a2a20');
    }
    // pilastri rossi
    for (let cx = 60; cx < near.c.width; cx += 150) {
      px(near.ctx, cx, GROUND_Y - 130, 14, 130, '#a03028');
      px(near.ctx, cx, GROUND_Y - 130, 4, 130, '#c04838');
      px(near.ctx, cx - 4, GROUND_Y - 136, 22, 8, '#3a2020');
      px(near.ctx, cx - 4, GROUND_Y - 8, 22, 8, '#3a2020');
    }
    // lanterne appese
    for (let lx = 110; lx < near.c.width; lx += 150) {
      lanterns.push({ x: lx, y: GROUND_Y - 108, phase: Math.random() * 6 });
    }
    layers.push({ img: near.c, parallax: 0.8, y: 0 });

    // --- pavimento in legno (1.0) ---
    const floor = makeCanvas(STAGE_W, VIEW_H);
    px(floor.ctx, 0, GROUND_Y, STAGE_W, VIEW_H - GROUND_Y, '#8a5a34');
    for (let py = GROUND_Y; py < VIEW_H; py += 10) {
      px(floor.ctx, 0, py, STAGE_W, 1, '#6a4024');
      const off = (py % 20 === 0) ? 0 : 40;
      for (let fx = off; fx < STAGE_W; fx += 80) px(floor.ctx, fx, py, 2, 10, '#5c3820');
    }
    px(floor.ctx, 0, GROUND_Y, STAGE_W, 2, '#a8703f');
    layers.push({ img: floor.c, parallax: 1, y: 0 });

    return {
      id: 'dojo', name: 'DOJO', layers, lanterns, groundY: GROUND_Y, width: STAGE_W,
      ambient: { type: 'petal', rate: 0.05 },
      drawAnimated(ctx, camX, t) {
        for (const l of this.lanterns) {
          const lx = l.x - camX * 0.8;
          if (lx < -30 || lx > VIEW_W + 30) continue;
          const sway = Math.sin(t * 0.03 + l.phase) * 3;
          px(ctx, lx + 5, l.y, 2, 6, '#3a2020');
          const ly = l.y + 6;
          px(ctx, lx + sway, ly, 12, 14, '#e04838');
          px(ctx, lx + sway + 2, ly + 2, 8, 10, '#ff6a50');
          px(ctx, lx + sway, ly + 14, 12, 2, '#a03028');
          px(ctx, lx + sway + 5, ly + 16, 2, 3, '#3a2020');
          // bagliore caldo
          ctx.fillStyle = 'rgba(255,120,60,0.12)';
          ctx.fillRect(lx + sway - 4, ly - 2, 20, 22);
        }
      }
    };
  }

  // ============================================================
  // WASTELAND
  // ============================================================

  function buildWasteland() {
    const layers = [];
    const smokes = [];

    // --- cielo polveroso ---
    const sky = makeCanvas(VIEW_W, VIEW_H);
    vGradient(sky.ctx, 0, 0, VIEW_W, GROUND_Y, ['#4a2418', '#6a3420', '#8a4a24', '#a86030', '#c07840']);
    px(sky.ctx, 160, 40, 48, 48, '#e8a05a');
    px(sky.ctx, 152, 52, 10, 26, '#c07840');
    px(sky.ctx, 176, 34, 22, 8, '#c07840');
    // bande di foschia
    for (let i = 0; i < 4; i++) {
      px(sky.ctx, 0, 100 + i * 24, VIEW_W, 6, 'rgba(220,160,100,0.25)');
    }
    layers.push({ img: sky.c, parallax: 0, y: 0 });

    // --- rovine lontane (0.2) ---
    const far = makeCanvas(STAGE_W * 0.2 + VIEW_W, VIEW_H);
    let x = 0;
    while (x < far.c.width) {
      const bw = 40 + Math.floor(Math.random() * 50);
      const bh = 50 + Math.floor(Math.random() * 60);
      const top = GROUND_Y - bh - 50;
      px(far.ctx, x, top, bw, bh + 50, '#3a2420');
      // cima spezzata
      px(far.ctx, x + bw - 12 - Math.random() * 10, top, 12 + Math.random() * 10, 6, '#8a4a24');
      x += bw + 8;
    }
    layers.push({ img: far.c, parallax: 0.2, y: 0 });

    // --- autostrada crollata (0.5) ---
    const mid = makeCanvas(STAGE_W * 0.5 + VIEW_W, VIEW_H);
    const my = GROUND_Y - 80;
    px(mid.ctx, 0, my, mid.c.width, 10, '#4a3a34');
    px(mid.ctx, 0, my, mid.c.width, 3, '#5c4a42');
    for (let px2 = 10; px2 < mid.c.width; px2 += 50) px(mid.ctx, px2, my + 5, 20, 2, '#c8b040');
    // pilastri spezzati
    for (let cx = 80; cx < mid.c.width; cx += 160) {
      px(mid.ctx, cx, my + 10, 12, 70, '#3a2c28');
      if (Math.random() < 0.4) px(mid.ctx, cx + 3, my + 40, 6, 40, '#8a4a24'); // ferritura
    }
    // tratto crollato
    px(mid.ctx, 240, my, 60, 10, '#6a3420');
    layers.push({ img: mid.c, parallax: 0.5, y: 0 });

    // --- terreno sabbioso + detriti (1.0) ---
    const ground = makeCanvas(STAGE_W, VIEW_H);
    px(ground.ctx, 0, GROUND_Y, STAGE_W, VIEW_H - GROUND_Y, '#7a5230');
    px(ground.ctx, 0, GROUND_Y, STAGE_W, 3, '#96683c');
    for (let i = 0; i < 130; i++) {
      const gx = Math.random() * STAGE_W, gy = GROUND_Y + 4 + Math.random() * 30;
      px(ground.ctx, gx, gy, 2 + Math.random() * 4, 2, Math.random() < 0.5 ? '#5c3a20' : '#8a6038');
    }
    // barili
    for (let bx = 120; bx < STAGE_W - 60; bx += 260) {
      px(ground.ctx, bx, GROUND_Y - 14, 14, 14, '#6a3a18');
      px(ground.ctx, bx + 2, GROUND_Y - 13, 10, 3, '#8a5028');
      px(ground.ctx, bx, GROUND_Y - 8, 14, 2, '#4a2810');
      smokes.push({ x: bx + 7, y: GROUND_Y - 14, rate: 0.12 });
    }
    // auto distrutta
    px(ground.ctx, 520, GROUND_Y - 12, 40, 10, '#4a3a3a');
    px(ground.ctx, 528, GROUND_Y - 18, 22, 7, '#5a4848');
    px(ground.ctx, 524, GROUND_Y - 3, 8, 4, '#2a2222');
    px(ground.ctx, 548, GROUND_Y - 3, 8, 4, '#2a2222');
    layers.push({ img: ground.c, parallax: 1, y: 0 });

    return {
      id: 'wasteland', name: 'WASTELAND', layers, smokes, groundY: GROUND_Y, width: STAGE_W,
      ambient: { type: 'dust', rate: 0.12 },
      drawAnimated(ctx, camX, t) {
        // colonne di fumo dai barili
        for (const s of this.smokes) {
          const sx = s.x - camX;
          if (sx < -20 || sx > VIEW_W + 20) continue;
          for (let i = 0; i < 4; i++) {
            const ph = (t * 0.008 + i * 0.25) % 1;
            const sy = s.y - ph * 46;
            const size = 3 + ph * 6;
            ctx.fillStyle = `rgba(120,110,100,${0.35 * (1 - ph)})`;
            ctx.fillRect(Math.round(sx - size / 2 + Math.sin(ph * 8) * 3), Math.round(sy), Math.round(size), Math.round(size));
          }
        }
      }
    };
  }

  // ============================================================

  let built = null;

  function buildAll() {
    if (built) return built;
    built = [buildNeonCity(), buildDojo(), buildWasteland()];
    return built;
  }

  PF.STAGES = {
    buildAll,
    get all() { return buildAll(); },
    byId(id) { return buildAll().find(s => s.id === id); }
  };
})();
