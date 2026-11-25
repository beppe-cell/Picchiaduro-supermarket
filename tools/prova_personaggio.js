/* Prova automatica di un personaggio o di una skin nel gioco vero (browser Chromium con Playwright).
   Apre index.html, lo mostra nella selezione, avvia un incontro e gli fa fare la speciale contro BEPPE.
   Scrive due foto nella cartella indicata (selezione.png, speciale.png) e stampa un resoconto JSON:
     errori JavaScript, immagini mancanti, tipo di speciale, proiettile partito, danno fatto.
   Lo usa tools/nuovo.py; si puo' lanciare anche da solo:
     node tools/prova_personaggio.js KARMA [idSkin] [cartella]
   Serve Playwright (require('playwright')) con Chromium. */
const path = require('path'), os = require('os'), fs = require('fs');
const { chromium } = require('playwright');
const [NOME, SKIN = 'base', OUT = path.join(os.tmpdir(), 'superrissa-prova')] = process.argv.slice(2);
if (!NOME) { console.error('uso: node tools/prova_personaggio.js NOME [idSkin] [cartella]'); process.exit(2) }
fs.mkdirSync(OUT, { recursive: true });
const PAGE = 'file://' + path.resolve(__dirname, '..', 'index.html');

(async () => {
  const b = await chromium.launch({ args: ['--allow-file-access-from-files'] });
  const ctx = await b.newContext({ viewport: { width: 1100, height: 600 } });
  /* profilo di prova: tutto sbloccato, la skin posseduta e indossata */
  await ctx.addInitScript(([n, sk]) => {
    if (sessionStorage.x) return; sessionStorage.x = 1; localStorage.clear();
    localStorage.setItem('superrissa-profili', JSON.stringify({ cur: 'a', list: { a: { n: 'PROVA', ced: 0,
      own: sk == 'base' ? {} : { [n]: [sk] }, eq: sk == 'base' ? {} : { [n]: sk }, unl: { [n]: 1 } } } }));
  }, [NOME, SKIN]);
  const p = await ctx.newPage(), errori = [], mancanti = [];
  p.on('pageerror', e => errori.push(e.message));
  p.on('requestfailed', r => { if (!/webp/.test(r.url()) || SKIN == 'base' || !r.url().includes('/skin-')) mancanti.push(r.url().replace(/^.*assets\//, '')) });
  await p.goto(PAGE); await p.waitForFunction(() => LD.n == LD.t); await p.mouse.click(300, 300);
  const ci = await p.evaluate(n => CH.findIndex(L => L.n == n), NOME);
  if (ci < 0) { console.log(JSON.stringify({ errore: 'personaggio ' + NOME + ' non registrato', errori })); await b.close(); process.exit(1) }
  const r = { personaggio: NOME, skin: SKIN };
  r.selezione = await p.evaluate(ci => { mode = 'arc'; fillSel(); sh('s-sel'); setSel(ci); return $('#pvx').innerText.replace(/\s+/g, ' ') }, ci);
  await p.waitForTimeout(800); await p.screenshot({ path: path.join(OUT, 'selezione.png') });
  await p.evaluate(ci => startMatch(ci, 0, 1), ci);
  await p.waitForFunction(() => G && G.a && ready(G.a.ss), null, { timeout: 15000 });
  /* posizioni: da vicino per il corpo a corpo, da lontano per il lancio */
  r.speciale = await p.evaluate(() => {
    const a = G.a, s = a.special; G.ph = 'play'; G.tm = 9999; G.b.ob = 1e9; G.b.hd = {}; /* l'avversario resta fermo */ a.x = 110; G.b.x = s.closeRange ? 150 : 290;
    a.sp = 100; a.st = 'atk'; a.atk = 's'; a.t = 0; a.did = 0; G.pz = 1;
    return { tipo: s.constructor.name, skinCaricata: (a.ss && a.ss.skin) || 'base', tempi: specialSet(a).mv || MV.s };
  });
  /* avanza fino a poco dopo il lancio/colpo e fotografa */
  const m = r.speciale.tempi;
  await p.evaluate(k => { G.pz = 0; for (let i = 0; i < k; i++) { G.b.st = 'idle'; step() } G.pz = 1 }, m.su + 4);
  await p.waitForTimeout(150); await p.screenshot({ path: path.join(OUT, 'speciale.png') });
  r.proiettile = await p.evaluate(() => PJ.length > 0);
  r.danno = await p.evaluate(() => { G.pz = 0; for (let i = 0; i < 120 && G.ph == 'play'; i++) step(); G.pz = 1; return Math.round(100 - G.b.hp) });
  r.errori = errori; r.mancanti = mancanti.slice(0, 8);
  r.ok = !errori.length && !mancanti.length && r.danno > 0 && r.speciale.skinCaricata == SKIN;
  console.log(JSON.stringify(r));
  await b.close(); process.exit(r.ok ? 0 : 1);
})();
