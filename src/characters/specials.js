/* characters/specials.js - Mosse speciali (pattern Strategy): una classe per ogni TIPO di speciale.
   Il personaggio sceglie il tipo nel suo file con un costruttore leggibile:
     special: lancio({oggetto:'karma-cassa', fotogrammi:3, alto:25.4, ...})   -> ProjectileSpecial
     special: corpoACorpo({portata:46, scatto:4.2, ...})                       -> MeleeSpecial
   I numeri restano DATI semplici nello sprite set del personaggio (SPRSET, campi pj..., ml, dash...), cosi' le skin
   possono cambiarli e il rollback online copia lo stato senza oggetti complicati; la classe contiene solo il
   comportamento. Per un tipo nuovo di speciale: una classe che estende Special e un costruttore qui sotto.

   Tempi: la speciale dura MV.s (o 'fasi' se il personaggio ha tempi propri): su = carica, ac = attiva, re = ritorno,
   in fotogrammi a passo fisso (60 al secondo: niente delta time, serve al rollback per avere la stessa partita
   su due dispositivi). */
/** numeri della speciale per il lottatore f: quelli della sua skin, ma in RANKED quelli del personaggio
    (le skin sono solo estetiche) */
const specialSet = f => (G && G.net && G.net.rk ? null : f.ss) || SPRSET[f.L.n] || {};

class Special {
  /** @param {object} fields campi dello sprite set (nomi corti usati dal motore e dal disegno) */
  constructor(fields) { this.fields = fields }
  /** chiamato a ogni fotogramma della speciale: f lottatore, o avversario, t fotogramma, m tempi {su,ac,re} */
  tick(f, o, t, m) {}
  /** la CPU la usa solo da vicino? */
  get closeRange() { return false }
}

/** speciale a proiettile: al fotogramma m.su nasce l'oggetto lanciato (PJ), che vola dritto e colpisce chi incontra */
class ProjectileSpecial extends Special {
  tick(f, o, t, m) {
    if (t != m.su) return;
    const ps0 = specialSet(f), po = ps0.pjo, bs = (f.L.big ? 1.12 : 1) * (ps0.sc || 1);
    /* nasce fermo sul punto di uscita (BEPPE: davanti alle mani, all'altezza delle spalle) e vola dritto */
    PJ.push({x: f.x + f.face * (po ? po[0] * bs : 22) - f.face * 3.6, y: (po ? po[1] * bs : -30) + (ps0.pjt ? 0 : f.y), fy: ps0.pjt ? 0 : f.y, vx: f.face * 3.6, o: f, a: f.atk, t: -1});
    if (ps0.shk) G.sh = ps0.shk;
    sfx('sp');
  }
}

/** speciale corpo a corpo: nessun proiettile, colpisce nella fase attiva entro la portata (ml);
    scatto (dash) in avanti e balzo (hop) facoltativi, come la picchiata di ANGEL */
class MeleeSpecial extends Special {
  get closeRange() { return true }
  tick(f, o, t, m) {
    const sm = specialSet(f);
    if (sm.dash && t >= 4 && t < m.su + m.ac) f.vx = f.face * sm.dash;
    if (sm.hop && t == 4 && f.y >= 0) f.vy = -sm.hop;
    if (t == m.su) sfx('sp');
    if (t >= m.su && t < m.su + m.ac && !f.did) hitchk(f, o, {r: sm.ml, d: 18, st: 24, kb: 6});
  }
}

/* ---------- costruttori leggibili (nomi italiani -> campi del motore) ---------- */
const SPECIAL_KEYS = {
  oggetto: 'pj', fotogrammi: 'pjn', alto: 'pjh', y: 'pjy', largo: 'pjw', uscita: 'pjo', scala: 'pjs',
  avvio: 'pji', cresce: 'pjg', aTerra: 'pjt', punta: 'pjr', fisso: 'pjf', trema: 'shk',
  tempi: 'spT', fasi: 'mv', portata: 'ml', scatto: 'dash', balzo: 'hop'};
function specialFields(p) {
  const out = {};
  for (const [k, v] of Object.entries(p)) {
    if (!(k in SPECIAL_KEYS)) throw new Error('speciale: parametro sconosciuto "' + k + '"');
    out[SPECIAL_KEYS[k]] = v;
  }
  return out;
}
/**
 * Lancio di un oggetto (proiettile).
 * oggetto: immagine assets/characters/<d>/<oggetto>.webp; fotogrammi: quanti nell'immagine; alto, y: altezza e bordo
 * superiore in gioco; largo: larghezza con cui colpisce; uscita: [avanti, altezza] del punto di lancio rispetto ai piedi;
 * scala: disegno a scala fissa; avvio: il 1o fotogramma e' solo l'avvio; cresce: l'effetto cresce e resta
 * sull'ultimo (onde); aTerra: corre sul pavimento; punta: x del punto che colpisce nella cella; fisso: fotogramma fisso;
 * trema: lo schermo trema; tempi: fotogrammi delle pose della speciale; fasi: tempi propri {su,ac,re}.
 */
function lancio(p) { return new ProjectileSpecial(specialFields(p)) }
/** Colpo corpo a corpo. portata: distanza a cui colpisce; scatto: velocita' in avanti; balzo: spinta verso l'alto;
    tempi e fasi come in lancio. */
function corpoACorpo(p) { return new MeleeSpecial(specialFields(p)) }
