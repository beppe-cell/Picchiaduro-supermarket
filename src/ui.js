/* ============================================================
   PIXEL FURY — ui.js
   Menu, character select, impostazioni, risultati, pausa.
   Schermate DOM in stile pixel-art sopra il canvas.
   ============================================================ */

window.PF = window.PF || {};

(function () {
  'use strict';

  const $ = id => document.getElementById(id);

  const SCREENS = ['screen-title', 'screen-menu', 'screen-select', 'screen-controls',
    'screen-settings', 'screen-pause', 'screen-results', 'rotate-overlay'];

  let selectMode = 'arcade';
  let p1Pick = null;
  let p2Pick = null;
  let selectStep = 1;
  let difficulty = 'normal';
  let dummyMode = 'static';
  let stagePick = 'random';
  let rotateDismissed = false;

  function show(id) {
    SCREENS.forEach(s => $(s).classList.toggle('hidden', s !== id));
  }

  function hideAll() {
    SCREENS.forEach(s => $(s).classList.add('hidden'));
  }

  // ---------------- Titolo ----------------

  function initTitle() {
    const go = () => {
      PF.AUDIO.resume();
      PF.AUDIO.sfx('menuSelect');
      PF.AUDIO.music('menu');
      show('screen-menu');
    };
    $('screen-title').addEventListener('click', go);
    $('screen-title').addEventListener('touchstart', go, { passive: true });
    window.addEventListener('keydown', function onFirst(e) {
      if (!$('screen-title').classList.contains('hidden')) { go(); }
      window.removeEventListener('keydown', onFirst);
    });
  }

  // ---------------- Menu principale ----------------

  function initMenu() {
    document.querySelectorAll('.menu-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        PF.AUDIO.sfx('menuSelect');
        const action = btn.dataset.action;
        if (action === 'settings') { show('screen-settings'); syncSettings(); }
        else if (action === 'controls') { show('screen-controls'); }
        else { startSelect(action); }
      });
    });

    $('btn-controls-back').addEventListener('click', () => { PF.AUDIO.sfx('menuMove'); show('screen-menu'); });
    $('btn-settings-back').addEventListener('click', () => { PF.AUDIO.sfx('menuMove'); show('screen-menu'); });
  }

  // ---------------- Impostazioni ----------------

  function syncSettings() {
    const s = PF.AUDIO.settings;
    $('set-music').value = Math.round(s.music * 100);
    $('set-sfx').value = Math.round(s.sfx * 100);
    $('val-music').textContent = Math.round(s.music * 100);
    $('val-sfx').textContent = Math.round(s.sfx * 100);
    $('set-touch').value = s.touch;
  }

  function initSettings() {
    $('set-music').addEventListener('input', e => {
      PF.AUDIO.setVolume('music', e.target.value / 100);
      $('val-music').textContent = e.target.value;
    });
    $('set-sfx').addEventListener('input', e => {
      PF.AUDIO.setVolume('sfx', e.target.value / 100);
      $('val-sfx').textContent = e.target.value;
      PF.AUDIO.sfx('menuMove');
    });
    $('set-touch').addEventListener('change', e => {
      PF.AUDIO.setTouchMode(e.target.value);
      PF.Controls.updateTouchVisibility(PF.GAME.inBattle);
    });
  }

  // ---------------- Character select ----------------

  function statPips(v, max) {
    const n = Math.max(1, Math.min(5, Math.round(v / max * 5)));
    let html = '';
    for (let i = 0; i < 5; i++) html += `<span class="pip${i < n ? ' on' : ''}"></span>`;
    return `<span class="stat-pips">${html}</span>`;
  }

  function buildCharGrid() {
    const grid = $('char-grid');
    grid.innerHTML = '';
    PF.CHAR_IDS.forEach(id => {
      const ch = PF.CHARS[id];
      const card = document.createElement('div');
      card.className = 'char-card';
      card.dataset.char = id;
      const canvas = PF.SPRITES.portrait(id).cloneNode();
      canvas.getContext('2d').drawImage(PF.SPRITES.portrait(id), 0, 0);
      card.appendChild(canvas);
      const name = document.createElement('div');
      name.className = 'char-name';
      name.textContent = ch.name;
      card.appendChild(name);
      card.addEventListener('click', () => pickChar(id));
      grid.appendChild(card);
    });
  }

  function pickChar(id) {
    PF.AUDIO.sfx('menuMove');
    if (selectMode === 'versus' && selectStep === 2) {
      p2Pick = id;
    } else {
      p1Pick = id;
    }
    refreshSelect();
  }

  function refreshSelect() {
    document.querySelectorAll('#char-grid .char-card').forEach(card => {
      card.classList.toggle('selected', card.dataset.char === p1Pick);
      card.classList.toggle('p2-selected', selectMode === 'versus' && selectStep === 2 && card.dataset.char === p2Pick);
    });

    const infoId = (selectMode === 'versus' && selectStep === 2) ? (p2Pick || p1Pick) : p1Pick;
    if (infoId) {
      const ch = PF.CHARS[infoId];
      $('char-desc').innerHTML = `<b>${ch.name}</b> — ${ch.desc}`;
      $('char-stats').innerHTML = `
        <span class="stat"><span class="stat-label">VEL</span>${statPips(ch.walkSpeed + ch.runSpeed, 6)}</span>
        <span class="stat"><span class="stat-label">POT</span>${statPips(ch.power, 1.4)}</span>
        <span class="stat"><span class="stat-label">RES</span>${statPips(ch.maxHealth, 130)}</span>`;
    } else {
      $('char-desc').innerHTML = '<span style="color:#55557f">Seleziona un lottatore…</span>';
      $('char-stats').innerHTML = '';
    }

    // titolo e step
    const titleEl = $('select-title');
    if (selectMode === 'versus') {
      titleEl.textContent = selectStep === 1 ? 'GIOCATORE 1: SCEGLI IL LOTTATORE' : 'GIOCATORE 2: SCEGLI IL LOTTATORE';
    } else if (selectMode === 'training') {
      titleEl.textContent = 'TRAINING: SCEGLI IL TUO LOTTATORE';
    } else {
      titleEl.textContent = 'SCEGLI IL TUO LOTTATORE';
    }

    buildSelectExtra();
  }

  function buildSelectExtra() {
    const extra = $('select-extra');
    extra.innerHTML = '';

    if (selectMode === 'arcade') {
      const label = document.createElement('span');
      label.className = 'select-step';
      label.textContent = 'DIFFICOLTÀ:';
      extra.appendChild(label);
      [['easy', 'EASY'], ['normal', 'NORMAL'], ['hard', 'HARD']].forEach(([id, name]) => {
        const b = document.createElement('button');
        b.className = 'pxbtn small' + (difficulty === id ? ' sel' : '');
        b.textContent = name;
        b.addEventListener('click', () => { difficulty = id; PF.AUDIO.sfx('menuMove'); refreshSelect(); });
        extra.appendChild(b);
      });
    }

    if (selectMode === 'training') {
      const label = document.createElement('span');
      label.className = 'select-step';
      label.textContent = 'MANICHINO:';
      extra.appendChild(label);
      [['static', 'FERMO'], ['easy', 'CPU FACILE']].forEach(([id, name]) => {
        const b = document.createElement('button');
        b.className = 'pxbtn small' + (dummyMode === id ? ' sel' : '');
        b.textContent = name;
        b.addEventListener('click', () => { dummyMode = id; PF.AUDIO.sfx('menuMove'); refreshSelect(); });
        extra.appendChild(b);
      });
    }

    if (selectMode !== 'arcade') {
      const label = document.createElement('span');
      label.className = 'select-step';
      label.textContent = 'ARENA:';
      extra.appendChild(label);
      const opts = [['random', 'RANDOM']].concat(PF.STAGES.all.map(s => [s.id, s.name]));
      opts.forEach(([id, name]) => {
        const b = document.createElement('button');
        b.className = 'pxbtn small' + (stagePick === id ? ' sel' : '');
        b.textContent = name;
        b.addEventListener('click', () => { stagePick = id; PF.AUDIO.sfx('menuMove'); refreshSelect(); });
        extra.appendChild(b);
      });
    }
  }

  function startSelect(mode) {
    selectMode = mode;
    p1Pick = null;
    p2Pick = null;
    selectStep = 1;
    refreshSelect();
    show('screen-select');
  }

  function initSelect() {
    buildCharGrid();
    $('btn-select-back').addEventListener('click', () => {
      PF.AUDIO.sfx('menuMove');
      if (selectMode === 'versus' && selectStep === 2) {
        selectStep = 1;
        refreshSelect();
      } else {
        show('screen-menu');
      }
    });
    $('btn-select-ok').addEventListener('click', () => {
      if (!p1Pick) { PF.AUDIO.sfx('block'); return; }
      PF.AUDIO.sfx('menuSelect');
      if (selectMode === 'versus') {
        if (selectStep === 1) { selectStep = 2; refreshSelect(); return; }
        if (!p2Pick) p2Pick = p1Pick === 'blaze' ? 'shadow' : 'blaze';
        PF.GAME.startVersus(p1Pick, p2Pick, stagePick);
      } else if (selectMode === 'training') {
        PF.GAME.startTraining(p1Pick, dummyMode, stagePick);
      } else {
        PF.GAME.startArcade(p1Pick, difficulty);
      }
    });
  }

  // ---------------- Pausa ----------------

  function initPause() {
    $('btn-resume').addEventListener('click', () => { PF.AUDIO.sfx('menuSelect'); PF.GAME.resume(); });
    $('btn-quit').addEventListener('click', () => { PF.AUDIO.sfx('menuSelect'); PF.GAME.quitToMenu(); });
  }

  // ---------------- Risultati ----------------

  function showResults(data) {
    const title = $('results-title');
    title.textContent = data.win ? 'YOU WIN' : 'YOU LOSE';
    title.className = 'results-title ' + (data.win ? 'win' : 'lose');

    const mm = String(Math.floor(data.time / 3600)).padStart(2, '0');
    const ss = String(Math.floor(data.time / 60) % 60).padStart(2, '0');
    $('results-stats').innerHTML = `
      <div>PUNTEGGIO <b>${data.score}</b></div>
      <div>TEMPO IMPIEGATO <b>${mm}:${ss}</b></div>
      <div>COMBO MAX <b>x${data.maxCombo}</b></div>
      <div>DANNO TOTALE <b>${data.damage}</b></div>
      <div>ROUND <b>${data.rounds}</b></div>`;

    const next = $('results-arcade-next');
    if (data.arcadeNext) {
      next.classList.remove('hidden');
      next.textContent = `PROSSIMO AVVERSARIO: ${data.arcadeNext}`;
      $('btn-rematch').textContent = 'PROSSIMO COMBATTIMENTO';
    } else if (data.arcadeComplete) {
      next.classList.remove('hidden');
      next.textContent = 'ARCADE COMPLETATO! SEI IL CAMPIONE DI PIXEL FURY!';
      $('btn-rematch').textContent = 'RIVINCITA';
    } else {
      next.classList.add('hidden');
      $('btn-rematch').textContent = 'RIVINCITA';
    }
    show('screen-results');
  }

  function initResults() {
    $('btn-rematch').addEventListener('click', () => { PF.AUDIO.sfx('menuSelect'); PF.GAME.rematch(); });
    $('btn-results-menu').addEventListener('click', () => { PF.AUDIO.sfx('menuSelect'); PF.GAME.quitToMenu(); });
  }

  // ---------------- Training HUD ----------------

  function initTrainingHud() {
    $('th-dummy').addEventListener('click', () => {
      PF.GAME.toggleDummyMode();
    });
    $('th-reset').addEventListener('click', () => {
      PF.AUDIO.sfx('menuSelect');
      PF.GAME.resetTraining();
    });
  }

  function updateDummyLabel(mode) {
    $('th-dummy').textContent = mode === 'static' ? 'MANICHINO: FERMO' : 'MANICHINO: CPU';
  }

  // ---------------- Overlay rotazione ----------------

  function checkOrientation(inBattle) {
    const overlay = $('rotate-overlay');
    const portrait = window.innerHeight > window.innerWidth;
    const showOverlay = inBattle && portrait && !rotateDismissed;
    overlay.classList.toggle('hidden', !showOverlay);
    return !showOverlay;
  }

  function initRotate() {
    $('btn-play-portrait').addEventListener('click', () => {
      rotateDismissed = true;
      $('rotate-overlay').classList.add('hidden');
    });
  }

  // ---------------- Init ----------------

  function init() {
    initTitle();
    initMenu();
    initSettings();
    initSelect();
    initPause();
    initResults();
    initTrainingHud();
    initRotate();
  }

  PF.UI = {
    init,
    show,
    hideAll,
    showResults,
    updateDummyLabel,
    checkOrientation,
    get rotateDismissed() { return rotateDismissed; }
  };
})();
