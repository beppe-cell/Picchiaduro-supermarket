# GROSSETTO — Picchiaduro del supermercato

Picchiaduro 2D in pixel art ambientato tra le corsie di un supermercato, giocabile nel browser
(desktop e smartphone, in orizzontale e in verticale). Tutto il gioco è in un solo file, `index.html`:
nessun framework, nessuna build.

## Avvio

Apri `index.html` nel browser, oppure servi la cartella con un server statico:

```bash
python3 -m http.server 8080   # poi http://localhost:8080
```

Ogni push su `main` pubblica il gioco su GitHub Pages (`.github/workflows/deploy-pages.yml`).

All'apertura il gioco carica prima solo l'arena e i due lottatori della schermata iniziale (con la
percentuale al posto di "TOCCA O PREMI UN TASTO"), poi il resto in sottofondo; se un incontro parte
prima che i suoi due lottatori siano pronti compare una breve schermata di caricamento.

## Modalità

- **Arcade**: un incontro contro un collega a caso, al meglio dei 3 round.
- **Torneo**: tre incontri di fila (ANGEL, FALSA e il boss PAULUX).
- **Impostazioni**: volume di musica ed effetti, controlli touch, vibrazione.

## Personaggi

| Nome | Grafica | Mossa speciale |
|---|---|---|
| BEPPE | sprite disegnati (`assets/characters/beppe/`) | Lancio del pallet |
| MATTEO | sprite disegnati (`assets/characters/matteo/`) | Carrello volante |
| VLAD | sprite disegnati (`assets/characters/vlad/`) | Spruzzino accecante |
| LUIS | sprite disegnati (`assets/characters/luis/`) | Assolo distruttivo (onda sonora) |
| ZANI | sprite disegnati (`assets/characters/zani/`) | Taglierino furioso (corpo a corpo) |
| FALSA | sprite disegnati (`assets/characters/falsa/`) | Risata al telefono (onda sonora) |
| ANGEL | sprite disegnati (`assets/characters/angel/`) | Picchiata angelica (volo corpo a corpo) |
| PAULUX (boss) | sprite disegnati (`assets/characters/paulux/`) | Carica del transpallet (corpo a corpo) |

## Comandi

| Azione | Tastiera | Touch |
|---|---|---|
| Muovi | `A` / `D` | levetta sinistra/destra |
| Salta / abbassati | `W` / `S` | levetta su/giù |
| Pugno forte / calcio / pugno | `J` / `K` / `L` | FORTE (in basso) / CALCIO / PUGNO (in alto) |
| Speciale (barra SUPER piena) | `I` | SPECIALE (si illumina quando è carico) |
| Parata (danno /10) | `SPAZIO` / `SHIFT` | PARATA |
| Pausa | `ESC` / `P` | II |

Sul telefono la levetta compare dove appoggi il pollice; sui pulsanti puoi far scorrere il dito da uno
all'altro. In verticale i comandi hanno un pannello tutto loro sotto l'arena. Un colpo premuto mentre ne
finisce un altro parte appena possibile (memoria comandi di circa 1/6 di secondo).

Nei menu: frecce o WASD per spostarsi, `INVIO` / `SPAZIO` / `J` per confermare, `ESC` per tornare.
Ripetere lo stesso colpo fa sempre meno danno: conviene alternare le mosse.

## Struttura

```
index.html                     gioco completo (HTML + CSS + JS)
assets/
  backgrounds/
    arena-orizzontale.jpeg     corsia centrale; con arena-magazzino, -casse, -ortofrutta, -surgelati,
                               -parcheggio sono le 6 arene (una a caso per incontro, entrambi gli
                               orientamenti; in verticale la telecamera scorre)
  characters/
    <nome>/                    <nome>-<animazione>.png (file di lavoro) e .webp (quelli caricati dal
                               gioco, generati da tools/to_webp.py), <nome>-front per la selezione
    beppe/                     beppe-<animazione>.png, pallet.png (proiettile)
      sorgenti/                disegni originali, foglio reazioni IMG_5475 (colpito e vittoria)
    matteo/                    matteo-<animazione>.png, matteo-cart.png (proiettile)
      sorgenti/                tavole originali IMG_5407–5418 (sfondo magenta)
    vlad/                      vlad-<animazione>.png, vlad-spray.png (proiettile)
      sorgenti/                tavole originali IMG_5422–5437
    luis/                      luis-<animazione>.png, luis-wave.png (proiettile)
      sorgenti/                tavola, fogli pose IMG_5449–5452, speciale IMG_5454
    zani/                      zani-<animazione>.png (speciale corpo a corpo, senza proiettile)
      sorgenti/                tavola IMG_5456, fogli pose IMG_5458–5460, speciale IMG_5463
    falsa/                     falsa-<animazione>.png, falsa-laugh.png (proiettile)
      sorgenti/                tavola.png, foglio-A/B/C.png, speciale IMG_5474
    angel/                     angel-<animazione>.png (speciale corpo a corpo, senza proiettile)
      sorgenti/                tavola IMG_5469, fogli pose IMG_5470–5472, speciale IMG_5473
    paulux/                    paulux-<animazione>.png (speciale corpo a corpo col transpallet)
      sorgenti/                tavola IMG_5476, fogli pose IMG_5477–5479, speciale IMG_5480
docs/reference/                immagini di riferimento per lo stile
docs/sprite-guide/             fogli pose e prompt per creare un personaggio con Gemini
tools/
  pose_layout.json             disposizione delle caselle dei fogli pose
  make_pose_templates.py       genera i fogli guida ed esempio in docs/sprite-guide/
  build_character.py           importa un personaggio dai 3 fogli pose (tutte le animazioni tranne la speciale)
  build_special.py             pose della speciale da una tavola a parte (con --taglio per pose che si toccano)
  build_luis_special.py        speciale di LUIS: chitarra e onda sonora
  build_falsa_special.py       speciale di FALSA: busto col telefono sulle gambe della guardia, onda della risata
  build_extra_poses.py         aggiunge singole animazioni da un foglio pose (es. vittoria di Beppe)
  build_fronts.py              vista frontale di ogni personaggio (<nome>-front.png) per la selezione
  spritebuild.py               strumenti comuni: ritaglio, scala, allineamento, fogli PNG
  build_matteo_sprites.py      genera i PNG di Matteo dalle tavole sorgenti
  build_vlad_sprites.py        genera i PNG di Vlad dalle tavole sorgenti
  build_beppe_special.py       speciale di Beppe: afferra, tiene e lancia il bancale
  to_webp.py                   converte gli sprite PNG nei WebP caricati dal gioco (3 volte piu' leggeri)
  clean_white_residue.py       toglie il bianco di sfondo residuo dagli sprite
  spritekey.py                 scontorno del magenta e separazione dei frame
```

## Aggiungere un personaggio con sprite

1. Genera con Gemini i 3 fogli pose seguendo `docs/sprite-guide/PROMPT.md` e mettili in
   `assets/characters/<nome>/sorgenti/`.
2. `python3 -B tools/build_character.py <nome> <A> <B> <C>` (richiede `pip install pillow numpy
   scipy`) crea tutte le animazioni tranne la speciale, che si fa a parte. Formato: un PNG per animazione,
   `<nome>-<animazione>.png`, frame affiancati a larghezza uguale, piedi sul bordo inferiore,
   personaggio in piedi alto circa 400 px.
3. `python3 -B tools/to_webp.py` crea i `.webp` che il gioco carica davvero.
4. Registra il personaggio in `SPRSET` dentro `index.html` (cartella, numero di frame per
   animazione, proiettile) e aumenta `VER` per svuotare la cache dei browser.

Animazioni riconosciute: `idle`, `walk`, `punch`, `kick`, `heavy`, `special`, `jump`, `block`,
`crouch`, `fall`, `ko`; facoltative `hit` (colpito) e `win` (vittoria).
