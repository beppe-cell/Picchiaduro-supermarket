/* ============================================================
   PIXEL FURY — controls.js
   Input unificato: tastiera (P1 + P2 per Versus) e touch
   multitouch con feedback visivo. Buffer di input per le combo.
   ============================================================ */

window.PF = window.PF || {};

(function () {
  'use strict';

  const ACTIONS = ['left', 'right', 'up', 'down', 'punch', 'kick', 'heavy', 'special', 'block'];
  const BUFFER_FRAMES = 14;

  // ---------------- Input buffer ----------------

  class InputBuffer {
    constructor() {
      this.held = {};
      this.buf = {};
      ACTIONS.forEach(a => { this.held[a] = false; this.buf[a] = 0; });
      this.anyPressed = false;
    }

    press(a) {
      if (!this.held[a]) this.buf[a] = BUFFER_FRAMES;
      this.held[a] = true;
      this.anyPressed = true;
    }

    setHeld(a, v) {
      if (v) this.press(a);
      else this.held[a] = false;
    }

    tick() {
      for (const a of ACTIONS) if (this.buf[a] > 0) this.buf[a]--;
      this.anyPressed = false;
    }

    consume(a) {
      if (this.buf[a] > 0) { this.buf[a] = 0; return true; }
      return false;
    }

    check(a) { return this.buf[a] > 0; }

    isHeld(a) { return this.held[a]; }

    releaseAll() {
      ACTIONS.forEach(a => { this.held[a] = false; this.buf[a] = 0; });
    }
  }

  PF.InputBuffer = InputBuffer;

  // ---------------- Tastiera ----------------

  const KEYMAPS = {
    p1: {
      KeyA: 'left', KeyD: 'right', KeyW: 'up', KeyS: 'down',
      KeyJ: 'punch', KeyK: 'kick', KeyL: 'heavy', KeyI: 'special',
      Space: 'block', ShiftLeft: 'block'
    },
    p2: {
      ArrowLeft: 'left', ArrowRight: 'right', ArrowUp: 'up', ArrowDown: 'down',
      Comma: 'punch', Period: 'kick', Slash: 'heavy',
      ShiftRight: 'special', Enter: 'block', Numpad1: 'punch', Numpad2: 'kick',
      Numpad3: 'heavy', Numpad0: 'special'
    }
  };

  const keyboardBuffers = { p1: new InputBuffer(), p2: new InputBuffer() };
  let onPauseCallback = null;
  let keyboardEnabled = true;

  function initKeyboard() {
    window.addEventListener('keydown', e => {
      if (e.code === 'Escape' || e.code === 'KeyP') {
        if (onPauseCallback) onPauseCallback();
        e.preventDefault();
        return;
      }
      if (!keyboardEnabled) return;
      const m1 = KEYMAPS.p1[e.code];
      if (m1) { keyboardBuffers.p1.press(m1); e.preventDefault(); }
      const m2 = KEYMAPS.p2[e.code];
      if (m2) { keyboardBuffers.p2.press(m2); e.preventDefault(); }
      PF.AUDIO.resume();
    });
    window.addEventListener('keyup', e => {
      const m1 = KEYMAPS.p1[e.code];
      if (m1) keyboardBuffers.p1.held[m1] = false;
      const m2 = KEYMAPS.p2[e.code];
      if (m2) keyboardBuffers.p2.held[m2] = false;
    });
    window.addEventListener('blur', () => {
      keyboardBuffers.p1.releaseAll();
      keyboardBuffers.p2.releaseAll();
    });
  }

  // ---------------- Touch ----------------

  const touchBuffer = new InputBuffer();
  let touchAvailable = false;
  let touchVisible = false;
  const buttonEls = [];

  function initTouch() {
    const container = document.getElementById('touch-controls');
    if (!container) return;

    const btns = container.querySelectorAll('.tbtn');
    btns.forEach(el => {
      const action = el.dataset.ctrl;
      buttonEls.push({ el, action });

      const down = e => {
        e.preventDefault();
        touchAvailable = true;
        touchBuffer.press(action);
        el.classList.add('active');
        PF.AUDIO.resume();
      };
      const up = e => {
        e.preventDefault();
        touchBuffer.held[action] = false;
        el.classList.remove('active');
      };

      el.addEventListener('touchstart', down, { passive: false });
      el.addEventListener('touchend', up, { passive: false });
      el.addEventListener('touchcancel', up, { passive: false });
      // fallback mouse (test desktop)
      el.addEventListener('mousedown', down);
      el.addEventListener('mouseup', up);
      el.addEventListener('mouseleave', e => {
        if (e.buttons === 0) { touchBuffer.held[action] = false; el.classList.remove('active'); }
      });
    });

    // blocca gesture del browser sull'area di gioco
    ['touchstart', 'touchmove', 'touchend'].forEach(ev => {
      container.addEventListener(ev, e => e.preventDefault(), { passive: false });
    });
    document.addEventListener('gesturestart', e => e.preventDefault());
    document.addEventListener('contextmenu', e => e.preventDefault());
    document.addEventListener('dblclick', e => e.preventDefault());
  }

  function isTouchDevice() {
    return ('ontouchstart' in window) || navigator.maxTouchPoints > 0;
  }

  function updateTouchVisibility(inBattle) {
    const container = document.getElementById('touch-controls');
    if (!container) return;
    const mode = PF.AUDIO.settings.touch;
    let show;
    if (mode === 'on') show = true;
    else if (mode === 'off') show = false;
    else show = isTouchDevice();
    touchVisible = show && inBattle;
    container.classList.toggle('hidden', !touchVisible);
  }

  // ---------------- API ----------------

  PF.Controls = {
    init() {
      initKeyboard();
      initTouch();
    },
    buffers: keyboardBuffers,
    touchBuffer,
    setPauseCallback(cb) { onPauseCallback = cb; },
    setKeyboardEnabled(v) { keyboardEnabled = v; },
    updateTouchVisibility,
    isTouchDevice,
    get touchVisible() { return touchVisible; },
    tickBuffers() {
      keyboardBuffers.p1.tick();
      keyboardBuffers.p2.tick();
      touchBuffer.tick();
    },
    releaseAll() {
      keyboardBuffers.p1.releaseAll();
      keyboardBuffers.p2.releaseAll();
      touchBuffer.releaseAll();
      buttonEls.forEach(b => b.el.classList.remove('active'));
    }
  };
})();
