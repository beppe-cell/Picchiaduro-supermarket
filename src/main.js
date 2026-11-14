/* ============================================================
   PIXEL FURY — main.js
   Bootstrap: generazione asset procedurali, init moduli,
   resize pixel-perfect del canvas, loop di gioco.
   ============================================================ */

window.PF = window.PF || {};

(function () {
  'use strict';

  const VIEW_W = 512, VIEW_H = 288;

  function resize() {
    const canvas = document.getElementById('game');
    const app = document.getElementById('app');
    const availW = app.clientWidth;
    const availH = app.clientHeight;
    const scale = Math.max(0.5, Math.min(availW / VIEW_W, availH / VIEW_H));
    canvas.style.width = Math.round(VIEW_W * scale) + 'px';
    canvas.style.height = Math.round(VIEW_H * scale) + 'px';
  }

  function boot() {
    PF.AUDIO.loadSettings();

    // genera tutti gli sprite procedurali
    PF.SPRITES.buildAll();
    PF.STAGES.buildAll();

    PF.Controls.init();
    PF.UI.init();
    PF.Controls.setPauseCallback(() => {
      if (PF.GAME.state === 'battle') PF.GAME.pause();
      else if (PF.GAME.state === 'paused') PF.GAME.resume();
    });

    PF.GAME.init(document.getElementById('game'));
    resize();
    window.addEventListener('resize', resize);
    window.addEventListener('orientationchange', () => setTimeout(resize, 120));

    // pausa automatica se la pagina perde il focus
    document.addEventListener('visibilitychange', () => {
      if (document.hidden && PF.GAME.state === 'battle') PF.GAME.pause();
    });

    // sblocca l'audio al primo tocco (policy mobile)
    const unlock = () => { PF.AUDIO.resume(); };
    window.addEventListener('touchstart', unlock, { once: true, passive: true });
    window.addEventListener('mousedown', unlock, { once: true });
    window.addEventListener('keydown', unlock, { once: true });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
