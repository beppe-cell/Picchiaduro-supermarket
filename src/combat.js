/* ============================================================
   PIXEL FURY — combat.js
   Dati degli attacchi (startup/active/recovery, danno, hitbox),
   risoluzione colpi, combo, parate, knockback e mosse speciali.
   Tutte le hitbox sono relative ai piedi del lottatore:
   x = avanti rispetto al facing, y = negativo verso l'alto.
   ============================================================ */

window.PF = window.PF || {};

(function () {
  'use strict';

  const SCALE = 2; // sprite scale nel mondo

  // ---------------- Dati attacchi base ----------------

  PF.ATTACKS = {
    punch: {
      id: 'punch', anim: 'punch', label: 'PUNCH',
      dmg: 5, startup: 5, active: 4, recovery: 8,
      hitbox: { x: 18, y: -46, w: 26, h: 14 },
      kb: 2.4, kbUp: 0, hitstun: 16, blockstun: 9,
      meterGain: 9, meterTaken: 5,
      cancel: ['punch2', 'kick', 'heavy', 'special'],
      low: false, knockdown: false, sfx: 'punch'
    },
    punch2: {
      id: 'punch2', anim: 'punch2', label: 'PUNCH',
      dmg: 6, startup: 5, active: 4, recovery: 9,
      hitbox: { x: 18, y: -46, w: 26, h: 14 },
      kb: 3.0, kbUp: 0, hitstun: 18, blockstun: 10,
      meterGain: 9, meterTaken: 5,
      cancel: ['kick', 'heavy', 'special'],
      low: false, knockdown: false, sfx: 'punch'
    },
    heavy: {
      id: 'heavy', anim: 'heavy', label: 'HEAVY',
      dmg: 12, startup: 10, active: 5, recovery: 16,
      hitbox: { x: 20, y: -48, w: 30, h: 18 },
      kb: 5.5, kbUp: -2.5, hitstun: 24, blockstun: 14,
      meterGain: 12, meterTaken: 7,
      cancel: ['special'],
      low: false, knockdown: false, sfx: 'heavy'
    },
    kick: {
      id: 'kick', anim: 'kick', label: 'KICK',
      dmg: 8, startup: 8, active: 5, recovery: 12,
      hitbox: { x: 20, y: -50, w: 28, h: 20 },
      kb: 3.6, kbUp: 0, hitstun: 20, blockstun: 11,
      meterGain: 10, meterTaken: 6,
      cancel: ['heavy', 'special'],
      low: false, knockdown: false, sfx: 'kick'
    },
    lowkick: {
      id: 'lowkick', anim: 'lowkick', label: 'LOW KICK',
      dmg: 6, startup: 6, active: 4, recovery: 10,
      hitbox: { x: 16, y: -16, w: 26, h: 14 },
      kb: 2.6, kbUp: 0, hitstun: 18, blockstun: 10,
      meterGain: 9, meterTaken: 5,
      cancel: [],
      low: true, knockdown: false, sfx: 'kick'
    },
    jumpkick: {
      id: 'jumpkick', anim: 'jumpkick', label: 'JUMP KICK',
      dmg: 9, startup: 5, active: 12, recovery: 6,
      hitbox: { x: 12, y: -34, w: 26, h: 24 },
      kb: 3.2, kbUp: 0, hitstun: 20, blockstun: 10,
      meterGain: 10, meterTaken: 6,
      cancel: [],
      low: false, knockdown: false, sfx: 'kick', air: true
    }
  };

  // ---------------- Mosse speciali ----------------

  PF.SPECIALS = {
    inferno: {
      id: 'inferno', charId: 'blaze', anim: 'special_blaze', label: 'INFERNO WAVE',
      cost: 40, dmg: 14, startup: 12, active: 2, recovery: 18,
      projectile: { kind: 'fireball', speed: 4.2, w: 18, h: 12, y: -42 },
      kb: 5, kbUp: -2, hitstun: 26, blockstun: 14,
      meterGain: 0, meterTaken: 8,
      low: false, knockdown: false, sfx: 'specialFire',
      hitbox: null
    },
    phantom: {
      id: 'phantom', charId: 'shadow', anim: 'special_shadow', label: 'PHANTOM RUSH',
      cost: 40, dmg: 16, startup: 8, active: 10, recovery: 16,
      dash: { speed: 11, frames: 10, invulnFrom: 2, invulnTo: 10 },
      hitbox: { x: 8, y: -48, w: 30, h: 30 },
      kb: 6, kbUp: -2, hitstun: 28, blockstun: 14,
      meterGain: 0, meterTaken: 8,
      low: false, knockdown: false, sfx: 'specialDash'
    },
    seismic: {
      id: 'seismic', charId: 'titan', anim: 'special_titan', label: 'SEISMIC SLAM',
      cost: 40, dmg: 15, startup: 16, active: 4, recovery: 22,
      projectile: { kind: 'wave', speed: 3.2, w: 20, h: 14, y: -12, low: true },
      kb: 5, kbUp: -3, hitstun: 30, blockstun: 16,
      meterGain: 0, meterTaken: 8,
      low: true, knockdown: true, sfx: 'specialSlam',
      hitbox: null,
      onActive: 'quake'
    },
    thunder: {
      id: 'thunder', charId: 'volt', anim: 'special_volt', label: 'THUNDER FANG',
      cost: 40, dmg: 5, hits: 3, startup: 9, active: 14, recovery: 16,
      dash: { speed: 7, frames: 12 },
      hitbox: { x: 10, y: -50, w: 28, h: 34 },
      kb: 2, kbUp: -1.5, hitstun: 12, blockstun: 8,
      meterGain: 0, meterTaken: 6,
      low: false, knockdown: false, sfx: 'specialVolt',
      multiHit: true, reHitEvery: 5
    }
  };

  PF.SPECIAL_COST = 40;

  // ---------------- Utility hitbox ----------------

  // Converte una hitbox relativa in rect mondo
  function worldHitbox(f, hb) {
    const dir = f.facing;
    const x = dir > 0 ? f.x + hb.x : f.x - hb.x - hb.w;
    const y = f.y + hb.y;
    return { x, y, w: hb.w, h: hb.h };
  }

  // Hurtbox del lottatore secondo lo stato
  function hurtbox(f) {
    if (f.state === 'knockdown' || f.state === 'defeat' || f.state === 'getup') {
      return { x: f.x - 18, y: f.y - 14, w: 36, h: 14 };
    }
    if (f.crouching && !f.airborne) {
      return { x: f.x - 11, y: f.y - 34, w: 22, h: 34 };
    }
    return { x: f.x - 10, y: f.y - 52, w: 20, h: 52 };
  }

  function overlap(a, b) {
    return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  }

  // ---------------- Risoluzione colpo ----------------

  // Ritorna true se il colpo va a segno (o è parato)
  function resolveHit(attacker, defender, atk, world) {
    const FX = PF.EFFECTS, AUDIO = PF.AUDIO;

    const isSpecial = !!atk.cost;
    const hits = isSpecial && atk.hits ? atk.hits : 1;
    const baseDmg = (atk.dmg / (isSpecial && atk.hits ? atk.hits : 1)) * attacker.power;

    const hitting = isSpecial && atk.multiHit
      ? (defender.hitCooldown <= 0)
      : !attacker.attackHasHit;

    if (!hitting) return false;

    const hb = worldHitbox(attacker, atk.hitbox);
    const hurt = hurtbox(defender);
    if (!overlap(hb, hurt)) return false;

    // parata: il difensore sta parando e guarda verso l'attaccante
    const facingEachOther = (attacker.x - defender.x) * defender.facing > 0;
    const canBlock = defender.blocking && facingEachOther && !(atk.low && !defender.crouching);

    const contactX = (hb.x + hb.w / 2 + hurt.x + hurt.w / 2) / 2;
    const contactY = hb.y + hb.h / 2;

    if (canBlock) {
      const chip = Math.max(1, Math.round(baseDmg * 0.15));
      defender.health = Math.max(0, defender.health - chip);
      defender.blockstun = atk.blockstun;
      defender.vx = attacker.facing * atk.kb * 0.4;
      defender.meter = Math.min(100, defender.meter + atk.meterTaken * 0.5);
      attacker.meter = Math.min(100, attacker.meter + atk.meterGain * 0.4);
      FX.blockSpark(contactX, contactY);
      FX.addShake(1.5);
      AUDIO.sfx('block');
      world.hitstop = Math.max(world.hitstop, 4);
      markHit(attacker, atk, isSpecial);
      return true;
    }

    // colpo a segno
    const comboCount = (defender.hitstun > 0 ? attacker.comboCount + 1 : 1);
    attacker.comboCount = comboCount;
    attacker.comboTimer = 90;

    const scaling = Math.max(0.35, 1 - (comboCount - 1) * 0.11);
    const dmg = Math.max(1, Math.round(baseDmg * scaling * defender.defense));

    defender.health = Math.max(0, defender.health - dmg);
    defender.hitstun = atk.hitstun;
    defender.hitFlash = 6;
    defender.invuln = 0;
    defender.blocking = false;
    defender.state = 'hit';
    defender.vx = attacker.facing * atk.kb / defender.weight;
    if (atk.kbUp || defender.airborne) {
      defender.vy = atk.kbUp ? atk.kbUp / defender.weight : -2;
      defender.airborne = true;
    }
    if (atk.knockdown || (defender.health <= 0)) {
      defender.state = 'knockdown';
      defender.knockdownTimer = 0;
      defender.vx = attacker.facing * 4 / defender.weight;
      defender.vy = -3.5;
      defender.airborne = true;
    }

    defender.meter = Math.min(100, defender.meter + atk.meterTaken);
    attacker.meter = Math.min(100, attacker.meter + atk.meterGain);

    attacker.stats.damage += dmg;
    if (comboCount > attacker.stats.maxCombo) attacker.stats.maxCombo = comboCount;
    attacker.comboDamage = (attacker.comboDamage || 0) + dmg;

    // feedback
    FX.hitSpark(contactX, contactY, atk.dmg / 12);
    FX.addShake(atk.dmg >= 10 ? 4 : 2);
    if (atk.dmg >= 10) FX.addFlash(0.12, '#ffffff');
    AUDIO.sfx(atk.sfx === 'punch' || atk.sfx === 'kick' ? 'hit' : atk.sfx);
    world.hitstop = Math.max(world.hitstop, atk.dmg >= 10 ? 9 : 6);

    // testo combo
    if (comboCount >= 2) {
      const side = attacker.facing > 0 ? 90 : PF.GAME.VIEW_W - 90;
      FX.addText(side, 120, `COMBO HIT x${comboCount}`, attacker.comboColor, { size: 10, life: 46, big: true });
      if (comboCount === attacker.comboCount) attacker.comboDisplay = comboCount;
    }

    markHit(attacker, atk, isSpecial);
    if (isSpecial && atk.multiHit) defender.hitCooldown = atk.reHitEvery;
    return true;
  }

  function markHit(attacker, atk, isSpecial) {
    if (isSpecial && atk.multiHit) return; // multi-hit gestito separatamente
    attacker.attackHasHit = true;
  }

  PF.COMBAT = {
    worldHitbox,
    hurtbox,
    overlap,
    resolveHit,
    SCALE
  };
})();
