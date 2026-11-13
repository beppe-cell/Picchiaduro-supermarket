/* ============================================================
   PIXEL FURY — enemy.js
   Intelligenza artificiale degli avversari.
   3 difficoltà (Easy / Normal / Hard) + manichino da training.
   Comportamenti: avvicinamento, attacco a distanza utile, parata
   reattiva, salti, combo, anti-air, uso della speciale.
   ============================================================ */

window.PF = window.PF || {};

(function () {
  'use strict';

  const DIFF = {
    easy:   { think: 26, aggression: 0.35, block: 0.15, combo: 0.15, special: 0.25, jumpIn: 0.10, retreat: 0.25 },
    normal: { think: 15, aggression: 0.60, block: 0.40, combo: 0.45, special: 0.55, jumpIn: 0.18, retreat: 0.18 },
    hard:   { think: 8,  aggression: 0.85, block: 0.70, combo: 0.75, special: 0.80, jumpIn: 0.25, retreat: 0.12 }
  };

  class AIController {
    constructor(difficulty) {
      this.diff = DIFF[difficulty] || DIFF.normal;
      this.difficulty = difficulty;
      this.buffer = new PF.InputBuffer();
      this.cool = 0;
      this.moveDir = 0;
      this.blockTimer = 0;
      this.plan = null;
      this.lastAction = '';
      this.chain = [];
      this.pendingLowKick = 0;
      this.static = difficulty === 'static';
      this.frame = 0;
    }

    update(self, opp, world) {
      this.frame++;
      this.buffer.tick();

      if (this.static || !opp) {
        this.releaseMove();
        return;
      }

      // libera i tasti direzionali di default
      const dist = Math.abs(opp.x - self.x);
      const toward = opp.x > self.x ? 'right' : 'left';
      const away = toward === 'right' ? 'left' : 'right';

      // --- reazione: parata se l'avversario attacca ---
      if (this.blockTimer > 0) {
        this.blockTimer--;
        this.releaseMove();
        this.buffer.setHeld('block', true);
        if (this.blockTimer === 0) this.buffer.setHeld('block', false);
        return;
      }

      if (opp.attacking && dist < 100 && Math.random() < this.diff.block / 10) {
        this.blockTimer = 18 + Math.floor(Math.random() * 16);
        this.lastAction = 'block';
        return;
      }

      // parata proiettili in arrivo
      const incoming = world.projectiles.find(p => p.owner !== self && Math.sign(p.vx) === Math.sign(self.x - p.x) && Math.abs(p.x - self.x) < 130);
      if (incoming && Math.random() < (this.difficulty === 'hard' ? 0.5 : 0.25) / 5) {
        if (Math.random() < 0.5) this.buffer.press('up');
        else this.blockTimer = 24;
        return;
      }

      // low kick pianificata: prima abbassati, poi pugno
      if (this.pendingLowKick > 0) {
        this.pendingLowKick--;
        this.releaseMove();
        if (this.pendingLowKick === 0) {
          this.buffer.setHeld('down', false);
          this.buffer.press('punch');
        }
        return;
      }

      // se occupato, gestisci eventualmente la catena di combo
      if (self.attacking) {
        this.tryChain(self);
        this.releaseMove();
        return;
      }
      if (self.state === 'hit' || self.state === 'knockdown' || self.state === 'blockstun' || self.state === 'getup') {
        this.releaseMove();
        return;
      }

      // anti-air
      if (opp.airborne && dist < 80 && Math.random() < 0.06 + this.diff.aggression * 0.05) {
        this.buffer.press('heavy');
        this.lastAction = 'antiair';
        return;
      }

      // cooldown decisionale
      this.cool--;
      if (this.cool <= 0) {
        this.decide(self, opp, dist, toward, away);
      }

      // applica il movimento pianificato
      if (this.moveDir !== 0) {
        this.buffer.setHeld(this.moveDir > 0 ? 'right' : 'left', true);
        this.buffer.setHeld(this.moveDir > 0 ? 'left' : 'right', false);
      } else {
        this.releaseMove();
      }
    }

    releaseMove() {
      this.buffer.setHeld('left', false);
      this.buffer.setHeld('right', false);
    }

    decide(self, opp, dist, toward, away) {
      this.cool = this.diff.think + Math.floor(Math.random() * this.diff.think);
      const d = this.diff;
      const r = Math.random();

      // mossa speciale
      if (self.meter >= PF.SPECIAL_COST && dist < 240 && r < d.special) {
        this.buffer.press('special');
        this.lastAction = 'special';
        this.moveDir = 0;
        return;
      }

      // distanza combattimento ravvicinato
      if (dist < 58) {
        if (r < d.aggression) {
          this.chooseAttack();
        } else if (r < d.aggression + d.retreat) {
          this.moveDir = away === 'right' ? 1 : -1;
          this.lastAction = 'retreat';
        } else if (r < d.aggression + d.retreat + 0.1) {
          this.buffer.press('up');
          this.moveDir = toward === 'right' ? 1 : -1;
          this.lastAction = 'jumpaway';
        } else {
          this.moveDir = 0;
          this.lastAction = 'wait';
        }
        return;
      }

      // media distanza
      if (dist < 130) {
        if (r < d.aggression) {
          this.moveDir = toward === 'right' ? 1 : -1;
          this.lastAction = 'approach';
          // salto d'attacco occasionalmente
          if (Math.random() < d.jumpIn) {
            this.buffer.press('up');
            this.lastAction = 'jumpin';
          }
        } else if (r < d.aggression + 0.15) {
          this.buffer.press('kick'); // calcio a distanza
          this.lastAction = 'poke';
        } else {
          this.moveDir = 0;
          this.lastAction = 'wait';
        }
        return;
      }

      // lontananza
      if (r < 0.75) {
        this.moveDir = toward === 'right' ? 1 : -1;
        this.lastAction = 'approach';
      } else {
        this.moveDir = 0;
        this.lastAction = 'wait';
      }
    }

    chooseAttack() {
      const r = Math.random();
      const lastWasSame = a => this.lastAction === a;
      let action;
      if (r < 0.38) action = 'punch';
      else if (r < 0.66) action = 'kick';
      else if (r < 0.84) action = 'heavy';
      else action = 'down+punch'; // low kick
      if (lastWasSame(action) && Math.random() < 0.6) action = 'punch';

      this.lastAction = action;
      if (action === 'down+punch') {
        this.buffer.setHeld('down', true);
        this.pendingLowKick = 5;
      } else {
        this.buffer.press(action);
        // prepara eventuale catena di combo
        if (Math.random() < this.diff.combo) {
          if (action === 'punch') this.chain = ['punch2', 'kick', 'heavy'];
          else if (action === 'kick') this.chain = ['heavy'];
          else this.chain = [];
        } else {
          this.chain = [];
        }
      }
    }

    tryChain(self) {
      if (!this.chain.length || !self.attack) return;
      if (!self.attackHasHit) return;
      const atk = self.attack;
      const cancelAt = atk.startup + atk.active - 1;
      if (self.attackFrame >= cancelAt) {
        const next = this.chain.shift();
        // la chain usa nomi di ATTACKS; 'punch2' è un tasto logico per la CPU
        if (next === 'punch2') this.buffer.press('punch');
        else this.buffer.press(next);
      }
    }
  }

  PF.AIController = AIController;
})();
