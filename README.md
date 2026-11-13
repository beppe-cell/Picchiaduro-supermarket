# PIXEL FURY — 2D Pixel Art Fighting Game

Picchiaduro arcade 2D in pixel art, ispirato ai classici anni '90, **giocabile direttamente nel browser** (desktop e smartphone) senza installazioni. Tutti gli asset grafici e sonori sono **originali e generati proceduralmente** a runtime: nessun file esterno, nessun framework.

## Avvio nel browser

Basta aprire `index.html` in un browser, oppure servire la cartella con un web server statico:

```bash
# esempio con Python
python3 -m http.server 8080

# oppure con Node
npx serve .
```

Poi visitare `http://localhost:8080`. Il progetto è completamente statico: pubblicabile su qualsiasi hosting web (GitHub Pages, Netlify, ecc.). Per GitHub Pages basta attivarlo da *Settings → Pages* sulla branch `main`.

## Caratteristiche

- **4 lottatori originali** con stile, statistiche e mossa speciale unici:
  - **BLAZE** — il campione del supermercato (maglia rossa con logo, come la reference), *INFERNO WAVE*
  - **SHADOW** — ninja del magazzino, affondo *PHANTOM RUSH*
  - **TITAN** — il macellaio, lento e devastante, *SEISMIC SLAM*
  - **VOLT** — cassiere fulmineo, tripla scarica *THUNDER FANG*
- **Sistema di combattimento completo**: attacco leggero/pesante, calcio, parata (alta e bassa), salto, abbassamento, mosse speciali con barra energia, hitbox/hurtbox, knockback, hit-stop, invulnerabilità dopo il knockdown, combo concatenate con finestre di cancel e messaggio **COMBO HIT**.
- **3 modalità**: Arcade (4 avversari AI con difficoltà crescente), Versus locale (2 giocatori tastiera), Training (manichino fermo o CPU, rigenerazione salute).
- **AI a 3 difficoltà** (Easy / Normal / Hard): avvicinamento, pokes a distanza, parate reattive, anti-air, salti, combo, uso della speciale.
- **4 arene con parallasse** ed elementi animati: NEON CITY (insegne al neon), DOJO (lanterne e petali di sakura), WASTELAND (fumo e polvere), SUPERMARKET (scaffali, insegna luminosa, carrelli — ispirata alla reference in `docs/reference/`).
- **Audio interamente sintetizzato** con Web Audio API: musiche chiptune (menu + battaglia), SFX per pugni, calci, speciali, KO, vittoria/sconfitta. Volumi regolabili nelle Impostazioni.
- **Mobile-first**: controlli touch multitouch con feedback visivo, safe-area per i notch, canvas a risoluzione interna fissa (512×288) con scaling pixel-perfect, nessuno scroll accidentale, pausa, suggerimento di rotazione in portrait.

## Comandi

### Giocatore 1 (tastiera)
| Azione | Tasti |
|---|---|
| Muovi | `A` / `D` |
| Salto | `W` |
| Abbassati | `S` |
| Pugno | `J` |
| Calcio | `K` |
| Pugno pesante | `L` |
| Mossa speciale | `I` |
| Parata | `SPAZIO` / `SHIFT` |
| Pausa | `P` / `ESC` |

Doppio tap su una direzione = corsa.

### Giocatore 2 (Versus)
| Azione | Tasti |
|---|---|
| Muovi | `←` / `→` |
| Salto | `↑` |
| Abbassati | `↓` |
| Pugno | `,` |
| Calcio | `.` |
| Pugno pesante | `/` |
| Mossa speciale | `SHIFT DX` |
| Parata | `INVIO` |

### Mobile
D-pad a sinistra (muovi/salta/abbassati), pulsanti a destra: `P` pugno, `K` calcio, `H` pesante, `SP` speciale, `BLK` parata.

## Struttura del progetto

```
/index.html          — shell e schermate UI
/style.css           — stile pixel-art mobile-first
/src
  main.js            — bootstrap, resize, pausa automatica
  game.js            — motore: loop 60Hz, round/KO, camera, HUD, modalità
  fighter.js         — lottatore: stati, fisica, attacchi, speciali
  enemy.js           — AI (Easy/Normal/Hard + manichino)
  combat.js          — dati attacchi, hitbox, combo, danni
  controls.js        — tastiera + touch multitouch, buffer input
  animations.js      — pose scheletriche frame-by-frame
  sprites.js         — generazione procedurale sprite/ritratti/proiettili
  stages.js          — arene con parallasse
  effects.js         — particelle, combo text, shake, flash
  audio.js           — Web Audio: SFX + musiche sequenziate
  ui.js              — menu, character select, impostazioni, risultati
/assets              — riservata (asset generati a runtime)
```

## Tecnologie

HTML5 · CSS3 · JavaScript (Canvas 2D) · Web Audio API. Nessun framework; il font arcade è caricato da CDN con fallback monospace (il gioco funziona anche offline).

## Combo di base

`P → P → K → H → SP` (pugno, pugno, calcio, pesante, speciale) — concatena gli attacchi mentre il primo colpo va a segno. La barra gialla sotto la vita carica la mossa speciale.
