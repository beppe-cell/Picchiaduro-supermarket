/* ============================================================
   PIXEL FURY — effects.js
   Sistema di particelle, hit-spark, testi flottanti (COMBO HIT),
   afterimage, screen shake e flash. Pool riutilizzabile per 60 FPS.
   ============================================================ */

window.PF = window.PF || {};

(function () {
  'use strict';

  const MAX_PARTICLES = 220;

  const particles = [];
  const texts = [];
  const afterimages = [];

  let shake = 0;        // intensità shake (px)
  let flashAlpha = 0;   // flash bianco full-screen 0..1
  let flashColor = '#ffffff';

  function spawn(x, y, opts) {
    if (particles.length >= MAX_PARTICLES) particles.shift();
    particles.push(Object.assign({
      x, y,
      vx: 0, vy: 0,
      life: 20, age: 0,
      size: 2,
      color: '#ffffff',
      gravity: 0,
      drag: 1,
      glow: false,
      square: true
    }, opts));
  }

  // ---------------- Preset effetti ----------------

  const FX = {
    hitSpark(x, y, power) {
      const n = 6 + Math.round(power * 4);
      for (let i = 0; i < n; i++) {
        const a = Math.random() * Math.PI * 2;
        const sp = 1.5 + Math.random() * 3.5 * power;
        spawn(x, y, {
          vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 1,
          life: 12 + Math.random() * 8,
          size: Math.random() < 0.4 ? 3 : 2,
          color: Math.random() < 0.5 ? '#ffffff' : (Math.random() < 0.5 ? '#ffe94a' : '#ff8c1a'),
          gravity: 0.12, drag: 0.92, glow: true
        });
      }
      // anello d'impatto
      spawn(x, y, { life: 10, size: 4, color: '#ffffff', glow: true, ring: true, vx: 0, vy: 0, ringSpeed: 3 + power * 1.5 });
    },

    blockSpark(x, y) {
      for (let i = 0; i < 5; i++) {
        const a = -Math.PI / 2 + (Math.random() - 0.5) * 2;
        spawn(x, y, {
          vx: Math.cos(a) * 2, vy: Math.sin(a) * 2,
          life: 10, size: 2, color: '#4ae8ff', gravity: 0.1, drag: 0.9, glow: true
        });
      }
    },

    dust(x, y, n) {
      for (let i = 0; i < (n || 4); i++) {
        spawn(x + (Math.random() - 0.5) * 14, y, {
          vx: (Math.random() - 0.5) * 2, vy: -Math.random() * 1.2,
          life: 14 + Math.random() * 8, size: 2,
          color: 'rgba(200,190,170,0.7)', gravity: -0.01, drag: 0.94
        });
      }
    },

    embers(x, y, n) {
      for (let i = 0; i < (n || 5); i++) {
        spawn(x + (Math.random() - 0.5) * 10, y + (Math.random() - 0.5) * 8, {
          vx: (Math.random() - 0.5) * 1.5, vy: -1 - Math.random() * 2,
          life: 16 + Math.random() * 10, size: Math.random() < 0.5 ? 2 : 1,
          color: Math.random() < 0.5 ? '#ff8c1a' : '#ffe66d', gravity: -0.02, drag: 0.97, glow: true
        });
      }
    },

    sparks(x, y, n) {
      for (let i = 0; i < (n || 6); i++) {
        const a = Math.random() * Math.PI * 2;
        const sp = 2 + Math.random() * 4;
        spawn(x, y, {
          vx: Math.cos(a) * sp, vy: Math.sin(a) * sp,
          life: 8 + Math.random() * 6, size: 1,
          color: Math.random() < 0.5 ? '#ffe94a' : '#ffffff',
          drag: 0.9, glow: true, jitter: true
        });
      }
    },

    rocks(x, y, n) {
      for (let i = 0; i < (n || 6); i++) {
        spawn(x + (Math.random() - 0.5) * 20, y, {
          vx: (Math.random() - 0.5) * 4, vy: -2 - Math.random() * 2.5,
          life: 20 + Math.random() * 10, size: 2 + Math.round(Math.random() * 2),
          color: Math.random() < 0.5 ? '#8a6038' : '#5c3a20', gravity: 0.25, drag: 0.99
        });
      }
    },

    koBurst(x, y) {
      for (let i = 0; i < 24; i++) {
        const a = Math.random() * Math.PI * 2;
        const sp = 2 + Math.random() * 5;
        spawn(x, y, {
          vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 1.5,
          life: 22 + Math.random() * 14,
          size: Math.random() < 0.3 ? 3 : 2,
          color: ['#ffffff', '#ffe94a', '#ff8c1a', '#e8402f'][Math.floor(Math.random() * 4)],
          gravity: 0.12, drag: 0.93, glow: true
        });
      }
      spawn(x, y, { life: 16, size: 6, color: '#ffffff', glow: true, ring: true, ringSpeed: 6 });
    }
  };

  // ---------------- Testi flottanti ----------------

  function addText(x, y, str, color, opts) {
    texts.push(Object.assign({
      x, y, str, color: color || '#ffe94a',
      life: 50, age: 0, vy: -0.5, size: 8, big: false
    }, opts));
  }

  // ---------------- Afterimage (scie dash) ----------------

  function pushAfterimage(img, x, y, facing, scale) {
    afterimages.push({ img, x, y, facing, scale, life: 14, age: 0 });
    if (afterimages.length > 12) afterimages.shift();
  }

  // ---------------- Update & draw ----------------

  function update() {
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.age++;
      p.x += p.vx;
      p.y += p.vy;
      p.vy += p.gravity;
      p.vx *= p.drag;
      p.vy *= p.drag;
      if (p.age >= p.life) particles.splice(i, 1);
    }
    for (let i = texts.length - 1; i >= 0; i--) {
      const t = texts[i];
      t.age++;
      t.y += t.vy;
      if (t.age >= t.life) texts.splice(i, 1);
    }
    for (let i = afterimages.length - 1; i >= 0; i--) {
      const a = afterimages[i];
      a.age++;
      if (a.age >= a.life) afterimages.splice(i, 1);
    }
    if (shake > 0) shake *= 0.85;
    if (shake < 0.3) shake = 0;
    if (flashAlpha > 0) flashAlpha -= 0.08;
  }

  function draw(ctx, camX, camY) {
    // afterimages
    for (const a of afterimages) {
      ctx.globalAlpha = 0.35 * (1 - a.age / a.life);
      ctx.save();
      ctx.translate(Math.round(a.x - camX), Math.round(a.y - camY));
      if (a.facing < 0) ctx.scale(-1, 1);
      ctx.drawImage(a.img, -a.img.width * a.scale / 2, -a.img.height * a.scale, a.img.width * a.scale, a.img.height * a.scale);
      ctx.restore();
      ctx.globalAlpha = 1;
    }

    // particelle
    for (const p of particles) {
      const sx = p.x - camX, sy = p.y - camY;
      if (p.ring) {
        const r = (p.age / p.life) * (p.ringSpeed || 3) * 6 + p.size;
        ctx.strokeStyle = p.color;
        ctx.globalAlpha = 1 - p.age / p.life;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(sx, sy, r, 0, Math.PI * 2);
        ctx.stroke();
        ctx.globalAlpha = 1;
        continue;
      }
      ctx.globalAlpha = Math.min(1, 2.5 * (1 - p.age / p.life));
      if (p.glow) {
        ctx.fillStyle = p.color;
        ctx.fillRect(Math.round(sx) - 1, Math.round(sy) - 1, p.size + 2, p.size + 2);
      }
      ctx.fillStyle = p.color;
      ctx.fillRect(Math.round(sx), Math.round(sy), p.size, p.size);
      ctx.globalAlpha = 1;
    }

    // testi (screen-space: non subiscono la camera)
    for (const t of texts) {
      const sx = t.x, sy = t.y;
      const pop = t.age < 6 ? 1.4 : 1;
      ctx.save();
      ctx.globalAlpha = t.age > t.life - 10 ? (t.life - t.age) / 10 : 1;
      ctx.font = `${Math.round(t.size * pop)}px "Press Start 2P", monospace`;
      ctx.textAlign = 'center';
      ctx.fillStyle = '#000';
      ctx.fillText(t.str, sx + 2, sy + 2);
      ctx.fillStyle = t.color;
      ctx.fillText(t.str, sx, sy);
      ctx.restore();
    }
  }

  function addShake(v) { shake = Math.max(shake, v); }
  function addFlash(a, color) { flashAlpha = a; flashColor = color || '#ffffff'; }

  function drawOverlays(ctx, viewW, viewH) {
    if (flashAlpha > 0) {
      ctx.globalAlpha = Math.min(1, flashAlpha);
      ctx.fillStyle = flashColor;
      ctx.fillRect(0, 0, viewW, viewH);
      ctx.globalAlpha = 1;
    }
  }

  function getShake() { return shake; }

  function clear() {
    particles.length = 0;
    texts.length = 0;
    afterimages.length = 0;
    shake = 0;
    flashAlpha = 0;
  }

  PF.FX = FX;
  PF.EFFECTS = Object.assign({ spawn, addText, pushAfterimage, update, draw, addShake, addFlash, drawOverlays, getShake, clear }, FX);
})();
