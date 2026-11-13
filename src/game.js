/* ============================================================
   PIXEL FURY — game.js
   Motore di gioco: loop a timestep fisso (60 Hz), camera,
   proiettili, gestione round/KO/timer, HUD su canvas,
   modalità Arcade / Versus / Training.
   ============================================================ */

window.PF = window.PF || {};

(function () {
  'use strict';

  const VIEW_W = 512, VIEW_H = 288;
  const ROUND_TIME = 60;         // secondi
  const ROUNDS_TO_WIN = 2;
  const SPRITE_SCALE = 2;

  const G = {
    VIEW_W, VIEW_H,
    canvas: null, ctx: null,
    state: 'boot',               // boot | menu | battle | paused
    inBattle: false,
    world: null,
    battle: null,
    lastTime: 0,
    accumulator: 0,
    tick: 0
  };

  // ============================================================
  // World / battle
  // ============================================================

  function createWorld(stage) {
    return {
      stage,
      groundY: stage.groundY,
      projectiles: [],
      hitstop: 0,
      roundActive: false,
      slowmo: 0
    };
  }

  function makeController(kind, difficulty) {
    if (kind === 'cpu') return new PF.AIController(difficulty || 'normal');
    if (kind === 'static') return new PF.AIController('static');
    return null; // umano
  }

  function startBattle(config) {
    const stages = PF.STAGES.all;
    let stage;
    if (config.stageId && config.stageId !== 'random') {
      stage = PF.STAGES.byId(config.stageId);
    } else if (config.mode === 'arcade') {
      stage = stages[config.arcadeIndex % stages.length];
    } else {
      stage = stages[Math.floor(Math.random() * stages.length)];
    }

    const world = createWorld(stage);
    G.world = world;

    const p1Buffer = (config.mode === 'versus') ? PF.Controls.buffers.p1 : mergeP1Buffers();
    const p2Buffer = (config.mode === 'versus') ? PF.Controls.buffers.p2 : new PF.InputBuffer();

    const p1 = new PF.Fighter(config.p1Char, stage.width * 0.32, 1, p1Buffer, { comboColor: '#4ae8ff' });
    const p2 = new PF.Fighter(config.p2Char, stage.width * 0.68, -1, p2Buffer, {
      isCpu: config.p2Controller !== 'human', comboColor: '#ff9a2e'
    });

    p1.world = world; p2.world = world;
    p1.opponent = p2; p2.opponent = p1;
    p1.y = world.groundY; p2.y = world.groundY;

    world.p1 = p1;
    world.p2 = p2;

    // controller CPU / manichino per P2
    world.p2Controller = makeController(config.p2Controller, config.difficulty);
    if (world.p2Controller) p2.buffer = world.p2Controller.buffer;

    G.battle = {
      mode: config.mode,
      config,
      phase: 'intro',
      phaseTimer: 0,
      round: 1,
      timer: ROUND_TIME * 60,
      score: 0,
      totalTime: 0,
      message: '',
      messageTimer: 0,
      winner: null,
      matchOver: false,
      trainingRegen: 0
    };

    G.state = 'battle';
    G.inBattle = true;
    PF.EFFECTS.clear();
    PF.AUDIO.music('battle');
    PF.Controls.releaseAll();
    PF.Controls.updateTouchVisibility(true);
    PF.UI.hideAll();
    PF.UI.updateDummyLabel(config.dummyMode || 'static');
    document.getElementById('training-hud').classList.toggle('hidden', config.mode !== 'training');
    document.getElementById('btn-pause').classList.remove('hidden');
    startRound(1);
  }

  // P1 umano: unisce tastiera + touch
  let mergedP1 = null;
  function mergeP1Buffers() {
    if (!mergedP1) {
      mergedP1 = new Proxy({}, {
        get(target, prop) {
          const kb = PF.Controls.buffers.p1;
          const tc = PF.Controls.touchBuffer;
          if (prop === 'tick') return () => {};
          if (prop === 'releaseAll') return () => { kb.releaseAll(); tc.releaseAll(); };
          if (prop === 'isHeld') return a => kb.isHeld(a) || tc.isHeld(a);
          if (prop === 'check') return a => kb.check(a) || tc.check(a);
          if (prop === 'consume') return a => (kb.consume(a) || tc.consume(a));
          if (prop === 'press') return a => kb.press(a);
          if (prop === 'setHeld') return (a, v) => { kb.setHeld(a, v); tc.setHeld(a, v); };
          return undefined;
        }
      });
    }
    return mergedP1;
  }

  function startRound(round) {
    const w = G.world, b = G.battle;
    b.round = round;
    b.timer = ROUND_TIME * 60;
    b.phase = 'intro';
    b.phaseTimer = 0;
    b.winner = null;
    w.roundActive = false;
    w.projectiles.length = 0;
    PF.EFFECTS.clear();
    w.p1.resetForRound(w.stage.width * 0.32, 1);
    w.p2.resetForRound(w.stage.width * 0.68, -1);
    PF.AUDIO.sfx('roundStart');
  }

  // ============================================================
  // Update battaglia
  // ============================================================

  function updateBattle() {
    const w = G.world, b = G.battle;
    G.tick++;

    // AI
    if (w.p2Controller && b.phase !== 'matchend') {
      w.p2Controller.update(w.p2, w.p1, w);
    }

    // fasi
    b.phaseTimer++;

    if (b.phase === 'intro') {
      if (b.phaseTimer === 1) { b.message = `ROUND ${b.round}`; b.messageTimer = 70; }
      if (b.phaseTimer === 75) {
        b.message = 'FIGHT!';
        b.messageTimer = 45;
        PF.AUDIO.sfx('fight');
      }
      if (b.phaseTimer >= 100) {
        b.phase = 'fight';
        b.message = '';
        w.roundActive = true;
      }
    } else if (b.phase === 'fight') {
      if (b.mode !== 'training') {
        b.timer--;
        b.totalTime++;
        if (b.timer === 600) PF.AUDIO.sfx('countTick');
        if (b.timer <= 0) {
          b.timer = 0;
          timeUp();
        }
      } else {
        b.totalTime++;
        updateTraining();
      }
      checkKO();
    } else if (b.phase === 'ko') {
      b.totalTime++;
      if (b.phaseTimer === 1) {
        PF.AUDIO.sfx('ko');
        PF.EFFECTS.addShake(7);
        PF.EFFECTS.addFlash(0.3, '#ffffff');
      }
      if (b.phaseTimer > 130) endRound();
    } else if (b.phase === 'roundend') {
      b.totalTime++;
      if (b.phaseTimer > 90) {
        if (w.p1.roundsWon >= ROUNDS_TO_WIN || w.p2.roundsWon >= ROUNDS_TO_WIN) {
          endMatch();
        } else {
          startRound(b.round + 1);
        }
      }
    } else if (b.phase === 'matchend') {
      b.totalTime++;
      if (b.phaseTimer === 80) showMatchResults();
    }

    if (b.messageTimer > 0) b.messageTimer--;

    // hitstop: congela lottatori e proiettili
    const slow = b.phase === 'ko' && b.phaseTimer < 90 && (G.tick % 2 === 0);
    if (w.hitstop > 0) {
      w.hitstop--;
    } else if (!slow) {
      w.p1.update();
      w.p2.update();
      updateProjectiles();
      separateBodies();
    }

    PF.EFFECTS.update();
    spawnAmbient();
    updateCamera();
  }

  function checkKO() {
    const w = G.world, b = G.battle;
    if (b.phase !== 'fight') return;
    if (!w.p1.alive || !w.p2.alive) {
      b.phase = 'ko';
      b.phaseTimer = 0;
      w.roundActive = false;
      b.message = 'K.O.';
      b.messageTimer = 110;
      b.winner = w.p1.alive ? w.p1 : w.p2;
      b.score += 300;
      const loser = w.p1.alive ? w.p2 : w.p1;
      if (loser.airborne === false && loser.state !== 'knockdown') {
        loser.state = 'knockdown';
        loser.knockdownTimer = 0;
        loser.airborne = true;
        loser.vy = -3.5;
        loser.vx = -loser.facing * 3;
      }
      PF.EFFECTS.koBurst(loser.x, loser.y - 30);
    }
  }

  function timeUp() {
    const w = G.world, b = G.battle;
    b.phase = 'ko';
    b.phaseTimer = 0;
    w.roundActive = false;
    b.message = 'TIME UP';
    b.messageTimer = 110;
    if (w.p1.health === w.p2.health) {
      b.winner = null; // pareggio: round da rigiocare
    } else {
      b.winner = w.p1.health > w.p2.health ? w.p1 : w.p2;
    }
  }

  function endRound() {
    const w = G.world, b = G.battle;
    if (b.winner) {
      b.winner.roundsWon++;
      b.winner.setState('victory');
      b.score += 500;
      if (b.winner === w.p1) b.score += Math.round(w.p1.health * 2);
    } else {
      w.p1.setState('idle');
      w.p2.setState('idle');
    }
    b.phase = 'roundend';
    b.phaseTimer = 0;
    b.message = '';
    w.roundActive = false;
  }

  function endMatch() {
    const b = G.battle;
    b.phase = 'matchend';
    b.phaseTimer = 0;
    b.matchOver = true;
    const w = G.world;
    const p1Won = w.p1.roundsWon >= ROUNDS_TO_WIN;
    // bonus tempo
    b.score += Math.max(0, Math.round((3600 - Math.min(3600, b.totalTime)) / 6));
    if (p1Won) PF.AUDIO.sfx('win'); else PF.AUDIO.sfx('lose');
    PF.AUDIO.music(null);
    w.roundActive = false;
  }

  function showMatchResults() {
    const w = G.world, b = G.battle;
    const p1Won = w.p1.roundsWon >= ROUNDS_TO_WIN;
    let arcadeNext = null, arcadeComplete = false;

    if (b.mode === 'arcade' && p1Won) {
      if (b.config.arcadeIndex + 1 < b.config.arcadeLadder.length) {
        arcadeNext = PF.CHARS[b.config.arcadeLadder[b.config.arcadeIndex + 1]].name;
      } else {
        arcadeComplete = true;
      }
    }

    PF.UI.showResults({
      win: p1Won,
      score: b.score,
      time: b.totalTime,
      maxCombo: w.p1.stats.maxCombo,
      damage: w.p1.stats.damage,
      rounds: `${w.p1.roundsWon} - ${w.p2.roundsWon}`,
      arcadeNext,
      arcadeComplete
    });
  }

  // ============================================================
  // Proiettili
  // ============================================================

  function updateProjectiles() {
    const w = G.world;
    for (let i = w.projectiles.length - 1; i >= 0; i--) {
      const p = w.projectiles[i];
      p.age++;
      p.x += p.vx;
      p.frame = Math.floor(p.age / 4);

      // scia
      if (p.kind === 'fireball' && p.age % 3 === 0) {
        PF.EFFECTS.embers(p.x - Math.sign(p.vx) * 8, p.y, 1);
      }

      // collisione con l'avversario del proprietario
      const target = p.owner === w.p1 ? w.p2 : w.p1;
      const hurt = PF.COMBAT.hurtbox(target);
      const rect = { x: p.x - p.w / 2, y: p.y - p.h / 2, w: p.w, h: p.h };
      if (PF.COMBAT.overlap(rect, hurt) && target.alive && target.state !== 'knockdown' && target.state !== 'getup') {
        projectileHit(p, target);
        w.projectiles.splice(i, 1);
        continue;
      }

      // fuori scena
      if (p.x < -40 || p.x > w.stage.width + 40 || p.age > 240) {
        w.projectiles.splice(i, 1);
      }
    }
  }

  function projectileHit(p, target) {
    const atk = p.def;
    const owner = p.owner;
    const facingEachOther = (owner.x - target.x) * target.facing > 0;
    const canBlock = target.blocking && facingEachOther && !(atk.low && !target.crouching);
    const contactX = p.x, contactY = p.y;

    if (canBlock) {
      target.health = Math.max(0, target.health - Math.max(1, Math.round(atk.dmg * 0.1)));
      target.blockstun = atk.blockstun;
      target.vx = Math.sign(p.vx) * atk.kb * 0.4;
      PF.EFFECTS.blockSpark(contactX, contactY);
      PF.AUDIO.sfx('block');
      G.world.hitstop = Math.max(G.world.hitstop, 4);
      return;
    }

    const comboCount = (target.hitstun > 0 ? owner.comboCount + 1 : 1);
    owner.comboCount = comboCount;
    owner.comboTimer = 60;
    const scaling = Math.max(0.35, 1 - (comboCount - 1) * 0.11);
    const dmg = Math.max(1, Math.round(atk.dmg * scaling * target.defense));

    target.health = Math.max(0, target.health - dmg);
    target.hitstun = atk.hitstun;
    target.hitFlash = 6;
    target.state = 'hit';
    target.blocking = false;
    target.vx = Math.sign(p.vx) * atk.kb / target.weight;
    if (atk.knockdown || target.health <= 0) {
      target.state = 'knockdown';
      target.knockdownTimer = 0;
      target.airborne = true;
      target.vy = -3.5;
      target.vx = Math.sign(p.vx) * 4;
    }
    target.meter = Math.min(100, target.meter + atk.meterTaken);

    owner.stats.damage += dmg;
    if (comboCount > owner.stats.maxCombo) owner.stats.maxCombo = comboCount;

    PF.EFFECTS.hitSpark(contactX, contactY, 1.2);
    PF.EFFECTS.addShake(3);
    if (p.kind === 'fireball') PF.EFFECTS.embers(contactX, contactY, 8);
    PF.AUDIO.sfx('hit');
    G.world.hitstop = Math.max(G.world.hitstop, 7);

    if (comboCount >= 2) {
      const side = owner === G.world.p1 ? 90 : PF.GAME.VIEW_W - 90;
      PF.EFFECTS.addText(side, 120, `COMBO HIT x${comboCount}`, owner.comboColor, { size: 10, life: 46 });
    }
  }

  // ============================================================
  // Separazione corpi / camera / ambiente
  // ============================================================

  function separateBodies() {
    const w = G.world;
    const a = w.p1, b2 = w.p2;
    if (a.airborne || b2.airborne) return;
    if (a.state === 'knockdown' || b2.state === 'knockdown') return;
    if (a.state === 'defeat' || b2.state === 'defeat') return;
    const dx = b2.x - a.x;
    const minDist = 22;
    if (Math.abs(dx) < minDist) {
      const push = (minDist - Math.abs(dx)) / 2 * (dx >= 0 ? 1 : -1);
      a.x -= push;
      b2.x += push;
      a.x = Math.max(24, Math.min(w.stage.width - 24, a.x));
      b2.x = Math.max(24, Math.min(w.stage.width - 24, b2.x));
    }
  }

  let camX = 0;
  function updateCamera() {
    const w = G.world;
    const mid = (w.p1.x + w.p2.x) / 2;
    const target = Math.max(0, Math.min(w.stage.width - VIEW_W, mid - VIEW_W / 2));
    camX += (target - camX) * 0.12;
    if (Math.abs(target - camX) < 0.3) camX = target;
  }

  function spawnAmbient() {
    const w = G.world;
    const amb = w.stage.ambient;
    if (!amb || Math.random() > amb.rate) return;
    const x = camX + Math.random() * VIEW_W;
    if (amb.type === 'petal') {
      PF.EFFECTS.spawn(x, camY0() - 10, {
        vx: -0.4 - Math.random() * 0.6, vy: 0.5 + Math.random() * 0.5,
        life: 200, size: 2, color: Math.random() < 0.5 ? '#d88aa8' : '#e8b0c8',
        gravity: 0, drag: 1
      });
    } else if (amb.type === 'dust') {
      PF.EFFECTS.spawn(x, w.groundY - Math.random() * 60, {
        vx: 1.2 + Math.random() * 1.5, vy: -0.2 + Math.random() * 0.2,
        life: 90, size: 1, color: 'rgba(220,180,120,0.5)', drag: 1
      });
    } else if (amb.type === 'steam') {
      PF.EFFECTS.spawn(x, w.groundY, {
        vx: (Math.random() - 0.5) * 0.4, vy: -0.6 - Math.random() * 0.6,
        life: 60, size: 2, color: 'rgba(180,180,220,0.35)', drag: 0.99
      });
    }
  }

  function camY0() { return 0; }

  // ============================================================
  // Training
  // ============================================================

  function updateTraining() {
    const w = G.world, b = G.battle;
    // rigenerazione salute dopo 2s senza colpi
    if (w.hitstop === 0) {
      b.trainingRegen++;
      if (b.trainingRegen > 120) {
        if (w.p1.health < w.p1.maxHealth) w.p1.health = Math.min(w.p1.maxHealth, w.p1.health + 0.25);
        if (w.p2.health < w.p2.maxHealth) w.p2.health = Math.min(w.p2.maxHealth, w.p2.health + 0.25);
        w.p1.meter = Math.min(100, w.p1.meter + 0.1);
      }
    } else {
      b.trainingRegen = 0;
    }
  }

  function toggleDummyMode() {
    const b = G.battle;
    if (!b || b.mode !== 'training') return;
    const newMode = b.config.dummyMode === 'static' ? 'cpu' : 'static';
    b.config.dummyMode = newMode;
    G.world.p2Controller = makeController(newMode === 'cpu' ? 'cpu' : 'static', 'easy');
    G.world.p2.buffer = G.world.p2Controller.buffer;
    G.world.p2.buffer.releaseAll();
    PF.UI.updateDummyLabel(newMode);
    PF.AUDIO.sfx('menuSelect');
  }

  function resetTraining() {
    const b = G.battle;
    if (!b || b.mode !== 'training') return;
    startRound(b.round);
  }

  // ============================================================
  // HUD (canvas)
  // ============================================================

  function drawBar(ctx, x, y, w, h, pct, delayedPct, mirror) {
    // sfondo
    ctx.fillStyle = '#0a0a14';
    ctx.fillRect(x - 2, y - 2, w + 4, h + 4);
    ctx.fillStyle = '#2a2a3e';
    ctx.fillRect(x, y, w, h);
    // danno recente (bianco/rosso)
    ctx.fillStyle = '#e8402f';
    const dw = Math.round(w * Math.max(0, delayedPct));
    ctx.fillRect(mirror ? x + w - dw : x, y, dw, h);
    // salute
    const hw = Math.round(w * Math.max(0, pct));
    if (pct > 0.3) ctx.fillStyle = pct > 0.6 ? '#58e05a' : '#ffe94a';
    else ctx.fillStyle = '#e8402f';
    ctx.fillRect(mirror ? x + w - hw : x, y, hw, h);
    // lucchetto
    ctx.fillStyle = '#0a0a14';
    ctx.fillRect(x, y, w, 1);
  }

  function fontPx(size) {
    return `${size}px "Press Start 2P", monospace`;
  }

  function drawHUD(ctx) {
    const w = G.world, b = G.battle;
    if (!w) return;
    const p1 = w.p1, p2 = w.p2;

    // memorizza salute ritardata per l'effetto "danno recente"
    if (p1.dispHealth === undefined) { p1.dispHealth = p1.health; p2.dispHealth = p2.health; }
    p1.dispHealth += (p1.health - p1.dispHealth) * 0.06;
    p2.dispHealth += (p2.health - p2.dispHealth) * 0.06;

    const barW = 190, barH = 12;
    drawBar(ctx, 16, 18, barW, barH, p1.health / p1.maxHealth, p1.dispHealth / p1.maxHealth, false);
    drawBar(ctx, VIEW_W - 16 - barW, 18, barW, barH, p2.health / p2.maxHealth, p2.dispHealth / p2.maxHealth, true);

    // nomi
    ctx.font = fontPx(8);
    ctx.textAlign = 'left';
    ctx.fillStyle = '#000';
    ctx.fillText(p1.char.name, 18, 42);
    ctx.fillStyle = '#4ae8ff';
    ctx.fillText(p1.char.name, 16, 40);
    ctx.textAlign = 'right';
    ctx.fillStyle = '#000';
    ctx.fillText(p2.char.name, VIEW_W - 14, 42);
    ctx.fillStyle = '#ff9a2e';
    ctx.fillText(p2.char.name, VIEW_W - 16, 40);

    // barre speciali
    const meterW = 120, meterH = 5;
    ctx.fillStyle = '#0a0a14';
    ctx.fillRect(15, 48, meterW + 2, meterH + 2);
    ctx.fillStyle = '#26264e';
    ctx.fillRect(16, 49, meterW, meterH);
    ctx.fillStyle = p1.meter >= PF.SPECIAL_COST ? (Math.floor(G.tick / 10) % 2 ? '#ffe94a' : '#fff8c0') : '#4a9ae8';
    ctx.fillRect(16, 49, Math.round(meterW * p1.meter / 100), meterH);

    ctx.fillStyle = '#0a0a14';
    ctx.fillRect(VIEW_W - 16 - meterW - 2, 48, meterW + 2, meterH + 2);
    ctx.fillStyle = '#26264e';
    ctx.fillRect(VIEW_W - 16 - meterW, 49, meterW, meterH);
    ctx.fillStyle = p2.meter >= PF.SPECIAL_COST ? (Math.floor(G.tick / 10) % 2 ? '#ffe94a' : '#fff8c0') : '#4a9ae8';
    ctx.fillRect(VIEW_W - 16 - Math.round(meterW * p2.meter / 100), 49, Math.round(meterW * p2.meter / 100), meterH);

    // pips round
    for (let i = 0; i < ROUNDS_TO_WIN; i++) {
      ctx.fillStyle = i < p1.roundsWon ? '#ffe94a' : '#3a3a5e';
      ctx.fillRect(18 + i * 12, 58, 8, 8);
      ctx.fillStyle = i < p2.roundsWon ? '#ffe94a' : '#3a3a5e';
      ctx.fillRect(VIEW_W - 26 - i * 12, 58, 8, 8);
    }

    // timer
    ctx.fillStyle = '#0a0a14';
    ctx.fillRect(VIEW_W / 2 - 24, 10, 48, 26);
    ctx.strokeStyle = '#3c3c7a';
    ctx.lineWidth = 2;
    ctx.strokeRect(VIEW_W / 2 - 23, 11, 46, 24);
    ctx.font = fontPx(14);
    ctx.textAlign = 'center';
    const secs = b.mode === 'training' ? '--' : String(Math.ceil(b.timer / 60)).padStart(2, '0');
    ctx.fillStyle = (b.timer <= 600 && b.mode !== 'training') ? '#e8402f' : '#ffe94a';
    ctx.fillText(secs, VIEW_W / 2, 30);

    // messaggi centrali
    if (b.message && b.messageTimer > 0) {
      const pop = b.messageTimer > 90 ? 1.6 : 1;
      ctx.font = fontPx(b.message === 'FIGHT!' ? 22 * pop : 18 * pop);
      ctx.textAlign = 'center';
      ctx.fillStyle = '#000';
      ctx.fillText(b.message, VIEW_W / 2 + 3, VIEW_H / 2 - 20 + 3);
      ctx.fillStyle = b.message === 'K.O.' ? '#e8402f' : b.message === 'FIGHT!' ? '#ffe94a' : '#ffffff';
      ctx.fillText(b.message, VIEW_W / 2, VIEW_H / 2 - 20);
    }

    // indicatore mode
    ctx.font = fontPx(7);
    ctx.fillStyle = 'rgba(232,232,255,0.5)';
    ctx.textAlign = 'center';
    ctx.fillText(w.stage.name, VIEW_W / 2, VIEW_H - 6);
  }

  // ============================================================
  // Rendering scena
  // ============================================================

  function render() {
    const ctx = G.ctx;
    const w = G.world;
    ctx.imageSmoothingEnabled = false;

    if (G.state !== 'battle' && G.state !== 'paused' || !w) {
      // dietro i menu: sfondo animato del titolo
      drawMenuBackground(ctx);
      return;
    }

    const shake = PF.EFFECTS.getShake();
    const sx = (Math.random() - 0.5) * shake * 2;
    const sy = (Math.random() - 0.5) * shake * 2;
    const cx = Math.round(camX + sx);
    const cy = Math.round(sy);

    // layer di sfondo con parallasse
    for (const layer of w.stage.layers) {
      if (layer.foreground) continue;
      const lx = cx * layer.parallax;
      const maxX = layer.img.width - VIEW_W;
      const drawX = -Math.max(0, Math.min(maxX, lx));
      ctx.drawImage(layer.img, Math.round(drawX), layer.y - cy);
    }

    // elementi animati dello stage
    w.stage.drawAnimated(ctx, cx, G.tick * 16);

    // proiettili
    for (const p of w.projectiles) {
      const img = PF.SPRITES.projectile(p.kind, p.frame);
      if (img) {
        ctx.save();
        ctx.translate(Math.round(p.x - cx), Math.round(p.y - cy));
        if (p.vx < 0) ctx.scale(-1, 1);
        ctx.drawImage(img, -img.width / 2, -img.height / 2);
        ctx.restore();
        // glow
        ctx.fillStyle = p.kind === 'fireball' ? 'rgba(255,140,26,0.15)' : 'rgba(201,162,39,0.15)';
        ctx.fillRect(Math.round(p.x - cx) - 14, Math.round(p.y - cy) - 10, 28, 20);
      }
    }

    // lottatori (chi attacca davanti)
    const p1 = w.p1, p2 = w.p2;
    const order = (p1.attacking && !p2.attacking) ? [p2, p1] : [p1, p2];
    order.forEach(f => f.draw(ctx, cx, cy));

    // particelle
    PF.EFFECTS.draw(ctx, cx, cy);

    // foreground
    for (const layer of w.stage.layers) {
      if (!layer.foreground) continue;
      const lx = cx * layer.parallax;
      const maxX = layer.img.width - VIEW_W;
      const drawX = -Math.max(0, Math.min(maxX, lx));
      ctx.drawImage(layer.img, Math.round(drawX), layer.y - cy);
    }

    // HUD
    drawHUD(ctx);
    PF.EFFECTS.drawOverlays(ctx, VIEW_W, VIEW_H);
  }

  // Sfondo animato dietro i menu
  let menuBGTick = 0;
  function drawMenuBackground(ctx) {
    menuBGTick++;
    ctx.fillStyle = '#07070f';
    ctx.fillRect(0, 0, VIEW_W, VIEW_H);
    // griglia prospettica in stile arcade
    ctx.strokeStyle = 'rgba(74,232,255,0.10)';
    ctx.lineWidth = 1;
    const horizon = 180;
    for (let i = 0; i < 14; i++) {
      const y = horizon + Math.pow(i + menuBGTick * 0.25 % 1, 1.7) * 6;
      if (y > VIEW_H) continue;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(VIEW_W, y);
      ctx.stroke();
    }
    for (let i = -8; i <= 8; i++) {
      ctx.beginPath();
      ctx.moveTo(VIEW_W / 2 + i * 8, horizon);
      ctx.lineTo(VIEW_W / 2 + i * 60, VIEW_H);
      ctx.stroke();
    }
    // lottatori in posa dietro il menu
    const t = menuBGTick;
    const ids = PF.CHAR_IDS;
    for (let i = 0; i < ids.length; i++) {
      const f = Math.floor(t / 8) % PF.SPRITES.frameCount(ids[i], 'idle');
      PF.SPRITES.drawFrame(ctx, ids[i], 'idle', f, 90 + i * 110, 250, 2, i % 2 ? -1 : 1, { alpha: 0.9 });
    }
  }

  // ============================================================
  // Loop
  // ============================================================

  function step() {
    PF.Controls.tickBuffers();
    if (G.state === 'battle') {
      updateBattle();
    }
  }

  function frame(now) {
    requestAnimationFrame(frame);
    const dt = Math.min(100, now - G.lastTime);
    G.lastTime = now;
    G.accumulator += dt;
    const STEP = 1000 / 60;
    let guarded = 0;
    while (G.accumulator >= STEP && guarded < 4) {
      step();
      G.accumulator -= STEP;
      guarded++;
    }
    if (guarded >= 4) G.accumulator = 0;
    render();

    // orientamento (1 volta al secondo circa)
    if (G.tick % 60 === 0 && G.inBattle) {
      PF.UI.checkOrientation(true);
    }
  }

  // ============================================================
  // API pubblica (usata da ui.js)
  // ============================================================

  function buildArcadeLadder(p1Char) {
    const others = PF.CHAR_IDS.filter(c => c !== p1Char);
    for (let i = others.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [others[i], others[j]] = [others[j], others[i]];
    }
    return others.concat([p1Char]); // 4 combattimenti, l'ultimo specchio
  }

  function startArcade(charId, difficulty) {
    const ladder = buildArcadeLadder(charId);
    startBattle({
      mode: 'arcade',
      p1Char: charId,
      p2Char: ladder[0],
      p2Controller: 'cpu',
      difficulty: difficulty,
      arcadeIndex: 0,
      arcadeLadder: ladder
    });
  }

  function startNextArcadeFight() {
    const b = G.battle;
    const cfg = b.config;
    const nextIndex = cfg.arcadeIndex + 1;
    const diffOrder = { easy: ['easy', 'easy', 'normal', 'hard'], normal: ['easy', 'normal', 'normal', 'hard'], hard: ['normal', 'hard', 'hard', 'hard'] };
    startBattle({
      mode: 'arcade',
      p1Char: cfg.p1Char,
      p2Char: cfg.arcadeLadder[nextIndex],
      p2Controller: 'cpu',
      difficulty: diffOrder[cfg.difficulty][nextIndex],
      arcadeIndex: nextIndex,
      arcadeLadder: cfg.arcadeLadder
    });
    // mantieni il punteggio accumulato
    G.battle.score = b.score;
    G.battle.totalTime = b.totalTime;
  }

  function startVersus(p1Char, p2Char, stageId) {
    startBattle({
      mode: 'versus',
      p1Char, p2Char,
      p2Controller: 'human',
      stageId
    });
  }

  function startTraining(charId, dummyMode, stageId) {
    startBattle({
      mode: 'training',
      p1Char: charId,
      p2Char: PF.CHAR_IDS.find(c => c !== charId),
      p2Controller: dummyMode === 'cpu' ? 'cpu' : 'static',
      difficulty: 'easy',
      dummyMode,
      stageId
    });
  }

  function rematch() {
    const b = G.battle;
    if (!b) { quitToMenu(); return; }
    if (b.mode === 'arcade') {
      const p1Won = G.world.p1.roundsWon >= ROUNDS_TO_WIN;
      if (p1Won && b.config.arcadeIndex + 1 < b.config.arcadeLadder.length) {
        startNextArcadeFight();
        return;
      }
      if (p1Won) { quitToMenu(); return; }
    }
    startBattle(Object.assign({}, b.config));
  }

  function pause() {
    if (G.state !== 'battle') return;
    G.state = 'paused';
    PF.UI.show('screen-pause');
    PF.Controls.releaseAll();
    PF.AUDIO.stopMusic();
  }

  function resume() {
    if (G.state !== 'paused') return;
    G.state = 'battle';
    PF.UI.hideAll();
    PF.AUDIO.music('battle');
  }

  function quitToMenu() {
    G.state = 'menu';
    G.inBattle = false;
    G.world = null;
    G.battle = null;
    PF.EFFECTS.clear();
    PF.Controls.releaseAll();
    PF.Controls.updateTouchVisibility(false);
    document.getElementById('training-hud').classList.add('hidden');
    document.getElementById('btn-pause').classList.add('hidden');
    PF.UI.show('screen-menu');
    PF.AUDIO.music('menu');
  }

  PF.GAME = {
    VIEW_W, VIEW_H,
    get state() { return G.state; },
    get inBattle() { return G.inBattle; },
    get battle() { return G.battle; },
    get world() { return G.world; },
    init(canvas) {
      G.canvas = canvas;
      G.ctx = canvas.getContext('2d');
      G.ctx.imageSmoothingEnabled = false;
      G.lastTime = performance.now();
      requestAnimationFrame(frame);
    },
    startArcade, startVersus, startTraining,
    rematch, pause, resume, quitToMenu,
    toggleDummyMode, resetTraining
  };

  // pulsante pausa
  window.addEventListener('DOMContentLoaded', () => {
    const btn = document.getElementById('btn-pause');
    if (btn) btn.addEventListener('click', () => { PF.AUDIO.sfx('menuMove'); pause(); });
  });
})();
