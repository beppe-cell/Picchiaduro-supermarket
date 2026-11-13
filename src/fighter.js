/* ============================================================
   PIXEL FURY — fighter.js
   Lottatore: macchina a stati, movimento, attacchi, speciali,
   parate, knockdown e rendering. Usato da giocatori e CPU.
   ============================================================ */

window.PF = window.PF || {};

(function () {
  'use strict';

  const GRAVITY = 0.38;
  const FRICTION = 0.82;
  const AIR_FRICTION = 0.98;

  class Fighter {
    constructor(charId, x, facing, buffer, opts) {
      const ch = PF.CHARS[charId];
      this.char = ch;
      this.charId = charId;
      this.x = x;
      this.y = 0;              // y dei piedi (impostata dal world)
      this.vx = 0;
      this.vy = 0;
      this.facing = facing;
      this.buffer = buffer;

      this.maxHealth = ch.maxHealth;
      this.health = ch.maxHealth;
      this.meter = 0;
      this.power = ch.power;
      this.defense = ch.defense;
      this.weight = ch.weight;

      this.state = 'idle';
      this.crouching = false;
      this.airborne = false;
      this.blocking = false;

      this.attack = null;        // dati attacco corrente
      this.attackFrame = 0;
      this.attackHasHit = false;
      this.projectileSpawned = false;

      this.hitstun = 0;
      this.blockstun = 0;
      this.hitFlash = 0;
      this.invuln = 0;
      this.hitCooldown = 0;      // per mosse multi-hit
      this.knockdownTimer = 0;

      this.comboCount = 0;
      this.comboTimer = 0;
      this.comboDisplay = 0;
      this.comboDamage = 0;
      this.comboColor = opts && opts.comboColor ? opts.comboColor : '#ffe94a';

      this.stats = { damage: 0, maxCombo: 0 };
      this.roundsWon = 0;

      this.isCpu = !!(opts && opts.isCpu);
      this.isDummy = !!(opts && opts.isDummy);

      // run con doppio tap
      this.runDir = 0;
      this.lastTapDir = 0;
      this.lastTapFrame = 0;
      this.frameCount = 0;

      // animazione
      this.animName = 'idle';
      this.animFrame = 0;
      this.animTimer = 0;

      this.opponent = null;
      this.world = null;
    }

    // ---------------- Utility ----------------

    get busy() {
      return ['attack', 'special', 'hit', 'knockdown', 'getup', 'blockstun', 'victory', 'defeat'].includes(this.state);
    }

    get attacking() {
      return this.state === 'attack' || this.state === 'special';
    }

    get alive() { return this.health > 0; }

    canAct() {
      return this.alive && !this.busy && this.invuln <= 0;
    }

    setState(s) {
      if (this.state !== s) {
        this.state = s;
        this.animFrame = 0;
        this.animTimer = 0;
      }
    }

    startAttack(atk) {
      this.attack = atk;
      this.attackFrame = 0;
      this.attackHasHit = false;
      this.projectileSpawned = false;
      this.setState(atk.cost ? 'special' : 'attack');
      this.crouching = false;
      if (atk.cost) this.meter -= atk.cost;
      PF.AUDIO.sfx('whoosh');
    }

    faceOpponent() {
      if (!this.opponent || this.attacking || this.state === 'hit' || this.state === 'knockdown') return;
      this.facing = this.opponent.x >= this.x ? 1 : -1;
    }

    // ---------------- Update principale ----------------

    update() {
      const w = this.world, opp = this.opponent, buf = this.buffer;
      this.frameCount++;

      // timer generici
      if (this.hitFlash > 0) this.hitFlash--;
      if (this.invuln > 0) this.invuln--;
      if (this.hitCooldown > 0) this.hitCooldown--;
      if (this.comboTimer > 0) {
        this.comboTimer--;
        if (this.comboTimer === 0) {
          this.comboCount = 0;
          this.comboDamage = 0;
        }
      }

      const grounded = !this.airborne;

      // --- stati passivi ---
      if (this.state === 'hit') {
        this.hitstun--;
        if (this.hitstun <= 0 && grounded) this.setState('idle');
        if (this.hitstun <= 0 && !grounded) this.setState('idle');
      } else if (this.state === 'blockstun') {
        this.blockstun--;
        if (this.blockstun <= 0) this.setState('idle');
      } else if (this.state === 'knockdown') {
        this.knockdownTimer++;
        if (grounded && this.knockdownTimer > 36) {
          this.setState('getup');
          this.invuln = 40;
          this.knockdownTimer = 0;
        }
      } else if (this.state === 'getup') {
        if (this.animFrame >= PF.SPRITES.frameCount(this.charId, 'getup') - 1 && this.animTimer > 6) {
          this.setState('idle');
        }
      }

      // --- attacco in corso ---
      if (this.attacking) this.updateAttack();

      // --- controllo (solo se può agire) ---
      if (this.canAct() && w.roundActive) {
        this.handleInput(buf, opp);
      } else if (this.canAct() && !w.roundActive) {
        // tra i round: solo idle
        if (this.state !== 'victory' && this.state !== 'defeat') this.setState('idle');
      }

      // parata mantenuta
      this.blocking = grounded && buf.isHeld('block') && this.alive &&
        (this.state === 'block' || this.state === 'crouchblock' || this.canAct());

      // --- fisica ---
      if (this.airborne) {
        this.vy += GRAVITY * this.char.weight * 0.9;
        this.y += this.vy;
        this.x += this.vx;
        if (this.y >= w.groundY) {
          this.y = w.groundY;
          this.airborne = false;
          this.vy = 0;
          this.vx = 0;
          PF.EFFECTS.dust(this.x, w.groundY, 3);
          PF.AUDIO.sfx('land');
          if (this.state === 'jump') this.setState('idle');
          if (this.state === 'attack' && this.attack && this.attack.air) {
            this.attack = null;
            this.setState('idle');
          }
          if (this.state === 'hit' && this.hitstun <= 0) this.setState('idle');
        }
      } else {
        // Attrito a terra
        if (this.state !== 'walk' && this.state !== 'run') this.vx *= FRICTION;
        if (Math.abs(this.vx) < 0.1) this.vx = 0;
        this.x += this.vx;
      }

      // limiti arena
      this.x = Math.max(24, Math.min(w.stage.width - 24, this.x));

      this.faceOpponent();
      this.updateAnim();
    }

    // ---------------- Input → azioni ----------------

    handleInput(buf, opp) {
      const grounded = !this.airborne;

      // attacchi (buffered)
      if (grounded) {
        if (buf.consume('special') && this.meter >= PF.SPECIAL_COST) {
          const sid = this.specialId();
          if (sid) this.startAttack(PF.SPECIALS[sid]);
          return;
        }
        if (buf.consume('heavy')) { this.startAttack(PF.ATTACKS.heavy); return; }
        if (buf.consume('kick')) {
          this.startAttack(this.crouching ? PF.ATTACKS.lowkick : PF.ATTACKS.kick);
          return;
        }
        if (buf.consume('punch')) {
          this.startAttack(this.crouching ? PF.ATTACKS.lowkick : PF.ATTACKS.punch);
          return;
        }
      } else {
        if (buf.consume('punch') || buf.consume('kick')) {
          this.startAttack(PF.ATTACKS.jumpkick);
          return;
        }
      }

      // parata
      if (grounded && buf.isHeld('block')) {
        this.crouching = false;
        this.vx = 0;
        this.setState(this.crouching ? 'crouchblock' : 'block');
        return;
      }

      // crouch
      if (grounded && buf.isHeld('down')) {
        this.crouching = true;
        this.vx = 0;
        this.setState('crouch');
        return;
      }
      this.crouching = false;

      // salto
      if (grounded && buf.consume('up')) {
        this.airborne = true;
        this.vy = -this.char.jumpPower;
        this.vx = (buf.isHeld('left') ? -1 : buf.isHeld('right') ? 1 : 0) * this.char.walkSpeed * 1.4;
        this.setState('jump');
        PF.AUDIO.sfx('jump');
        PF.EFFECTS.dust(this.x, this.world.groundY, 4);
        return;
      }

      // movimento
      const dir = (buf.isHeld('right') ? 1 : 0) - (buf.isHeld('left') ? 1 : 0);
      if (dir !== 0) {
        // doppio tap = corsa
        if (dir !== this.lastTapDir) {
          if (this.frameCount - this.lastTapFrame < 15 && dir === this.lastTapDir * -1) {
            // tap opposto: reset
          }
          this.lastTapDir = dir;
          this.lastTapFrame = this.frameCount;
        } else if (this.frameCount - this.lastTapFrame < 15 && this.runDir !== dir) {
          this.runDir = dir;
        }

        const running = this.runDir === dir && this.frameCount - this.lastTapFrame > 6 && Math.abs(this.vx) > this.char.walkSpeed * 0.8;
        const speed = running ? this.char.runSpeed : this.char.walkSpeed;
        this.vx = dir * speed;
        this.setState(running ? 'run' : 'walk');
      } else {
        this.runDir = 0;
        this.vx = 0;
        this.setState('idle');
      }
    }

    specialId() {
      // ogni personaggio ha una sola speciale: cercala tra i SPECIALS
      for (const k in PF.SPECIALS) {
        if (PF.SPECIALS[k].charId === this.charId) return k;
      }
      return null;
    }

    // ---------------- Update attacco ----------------

    updateAttack() {
      const atk = this.attack;
      const w = this.world;
      this.attackFrame++;

      const { startup, active, recovery } = atk;
      const total = startup + active + recovery;

      // fase attiva: hitbox
      if (this.attackFrame > startup && this.attackFrame <= startup + active) {
        if (atk.projectile && !this.projectileSpawned) {
          this.spawnProjectile(atk);
          this.projectileSpawned = true;
        }
        if (atk.onActive === 'quake' && !this.projectileSpawned) {
          this.projectileSpawned = true;
          PF.EFFECTS.addShake(6);
          PF.EFFECTS.rocks(this.x + this.facing * 30, w.groundY, 10);
          PF.EFFECTS.addFlash(0.15, '#ffe94a');
        }
        if (atk.hitbox) {
          if (PF.COMBAT.resolveHit(this, this.opponent, atk, w)) {
            // colpo andato a segno
          }
        }
        // dash delle speciali
        if (atk.dash && this.attackFrame - startup <= atk.dash.frames) {
          this.vx = this.facing * atk.dash.speed;
          this.x += this.vx;
          this.x = Math.max(24, Math.min(w.stage.width - 24, this.x));
          if (atk.dash.invulnFrom !== undefined &&
              this.attackFrame - startup >= atk.dash.invulnFrom &&
              this.attackFrame - startup <= atk.dash.invulnTo) {
            this.invuln = 2;
          }
          // afterimage
          const img = PF.SPRITES.get(this.charId, atk.anim, Math.floor((this.attackFrame / total) * PF.SPRITES.frameCount(this.charId, atk.anim)));
          if (img) PF.EFFECTS.pushAfterimage(img, this.x, this.y, this.facing, PF.COMBAT.SCALE);
        } else if (atk.dash) {
          this.vx *= 0.7;
        }
      }

      // finestra di cancel per le combo
      if (this.attackHasHit && this.attackFrame > startup + active - 2 && atk.cancel && atk.cancel.length) {
        for (const nextId of atk.cancel) {
          let next = null;
          if (nextId === 'special') {
            if (this.meter < PF.SPECIAL_COST) continue;
            next = PF.SPECIALS[this.specialId()];
          } else {
            next = PF.ATTACKS[nextId];
          }
          const inputKey = (nextId === 'punch2') ? 'punch' : nextId;
          if (next && this.buffer.check(inputKey)) {
            this.buffer.consume(inputKey);
            this.startAttack(next);
            return;
          }
        }
      }

      if (this.attackFrame >= total) {
        this.attack = null;
        this.setState('idle');
      }
    }

    spawnProjectile(atk) {
      const p = atk.projectile;
      this.world.projectiles.push({
        x: this.x + this.facing * 26,
        y: this.y + p.y,
        vx: this.facing * p.speed,
        w: p.w, h: p.h,
        kind: p.kind,
        owner: this,
        def: atk,
        frame: 0,
        age: 0,
        low: !!p.low
      });
      PF.EFFECTS.addShake(2);
      if (p.kind === 'fireball') PF.EFFECTS.embers(this.x + this.facing * 30, this.y - 42, 8);
    }

    // ---------------- Animazione ----------------

    updateAnim() {
      let anim = 'idle';
      let frame = this.animFrame;

      switch (this.state) {
        case 'idle': anim = 'idle'; break;
        case 'walk': anim = 'walk'; break;
        case 'run': anim = 'run'; break;
        case 'jump': anim = 'jump'; break;
        case 'crouch': anim = 'crouch'; break;
        case 'block': anim = 'block'; break;
        case 'crouchblock': anim = 'crouchblock'; break;
        case 'hit': anim = 'hit'; break;
        case 'blockstun': anim = this.crouching ? 'crouchblock' : 'block'; break;
        case 'getup': anim = 'getup'; break;
        case 'victory': anim = 'victory'; break;
        case 'defeat': anim = 'defeat'; break;
        case 'knockdown': {
          anim = 'knockdown';
          if (this.airborne) frame = Math.min(1, Math.floor(this.knockdownTimer / 6));
          else frame = 2;
          this.animFrame = frame;
          this.animName = anim;
          return;
        }
        case 'attack':
        case 'special': {
          if (!this.attack) { anim = 'idle'; break; }
          anim = this.attack.anim;
          const total = this.attack.startup + this.attack.active + this.attack.recovery;
          const fc = PF.SPRITES.frameCount(this.charId, anim);
          const progress = Math.min(0.99, this.attackFrame / total);
          frame = Math.min(fc - 1, Math.floor(progress * fc));
          this.animFrame = frame;
          this.animName = anim;
          return;
        }
      }

      const data = PF.ANIM_DATA[anim];
      const fc = PF.SPRITES.frameCount(this.charId, anim);
      if (data.loop) {
        this.animTimer++;
        const spd = Math.max(1, Math.round(60 / data.fps));
        if (this.animTimer >= spd) { this.animTimer = 0; this.animFrame++; }
        frame = this.animFrame % fc;
      } else {
        this.animTimer++;
        const spd = Math.max(1, Math.round(60 / data.fps));
        if (this.animTimer >= spd && this.animFrame < fc - 1) { this.animTimer = 0; this.animFrame++; }
        frame = Math.min(this.animFrame, fc - 1);
      }
      this.animName = anim;
      this.animFrame = frame;
    }

    // ---------------- Rendering ----------------

    draw(ctx, camX, camY) {
      // ombra
      const w = this.world;
      const shadowW = this.airborne ? 22 : 30;
      ctx.fillStyle = 'rgba(0,0,0,0.35)';
      ctx.beginPath();
      ctx.ellipse(Math.round(this.x - camX), Math.round(w.groundY - camY) + 2, shadowW / 2, 4, 0, 0, Math.PI * 2);
      ctx.fill();

      // lampeggio invulnerabilità
      let alpha = 1;
      if (this.invuln > 0 && this.state !== 'getup' && Math.floor(this.frameCount / 3) % 2 === 0) alpha = 0.5;

      PF.SPRITES.drawFrame(
        ctx, this.charId, this.animName, this.animFrame,
        this.x - camX, this.y - camY, PF.COMBAT.SCALE, this.facing,
        { flash: this.hitFlash, alpha }
      );

      // bagliore speciale pronto
      if (this.meter >= PF.SPECIAL_COST && this.alive && !this.attacking) {
        if (Math.floor(this.frameCount / 16) % 2 === 0) {
          ctx.fillStyle = 'rgba(255,233,74,0.25)';
          ctx.fillRect(Math.round(this.x - camX) - 14, Math.round(this.y - camY) - 56, 28, 2);
        }
      }
    }

    // ---------------- Eventi round ----------------

    resetForRound(x, facing) {
      this.x = x;
      this.y = this.world ? this.world.groundY : 0;
      this.vx = 0; this.vy = 0;
      this.facing = facing;
      this.health = this.maxHealth;
      this.meter = Math.min(100, this.meter * 0.5);
      this.state = 'idle';
      this.crouching = false;
      this.airborne = false;
      this.blocking = false;
      this.attack = null;
      this.hitstun = 0; this.blockstun = 0;
      this.hitFlash = 0; this.invuln = 0;
      this.hitCooldown = 0;
      this.comboCount = 0; this.comboTimer = 0; this.comboDisplay = 0;
      this.animName = 'idle'; this.animFrame = 0; this.animTimer = 0;
    }

    resetMatch() {
      this.roundsWon = 0;
      this.stats = { damage: 0, maxCombo: 0 };
      this.meter = 0;
    }
  }

  PF.Fighter = Fighter;
})();
