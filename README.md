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
| LUIS, ZANI, FALSA, ANGEL | disegno procedurale | Carrellino |
| PAULUX (boss) | disegno procedurale | Carrellino |

## Comandi

| Azione | Tastiera | Touch |
|---|---|---|
| Muovi | `A` / `D` | ◀ ▶ |
| Salta / abbassati | `W` / `S` | ▲ ▼ |
| Pugno / calcio / pesante | `J` / `K` / `L` | P / K / H |
| Speciale (barra SUPER piena) | `I` | SP |
| Parata (danno /10) | `SPAZIO` / `SHIFT` | BLK |
| Pausa | `ESC` / `P` | II |

Nei menu: frecce o WASD per spostarsi, `INVIO` / `SPAZIO` / `J` per confermare, `ESC` per tornare.
Ripetere lo stesso colpo fa sempre meno danno: conviene alternare le mosse.

## Struttura

```
index.html                     gioco completo (HTML + CSS + JS)
assets/
  backgrounds/
    arena-supermercato.png     arena in orizzontale
    corridoio-verticale.jpeg   arena in verticale
  characters/
    beppe/                     beppe-<animazione>.png, pallet.png (proiettile)
      sorgenti/                disegni originali
    matteo/                    matteo-<animazione>.png, matteo-cart.png (proiettile)
      sorgenti/                tavole originali IMG_5407–5418 (sfondo magenta)
    vlad/                      vlad-<animazione>.png, vlad-spray.png (proiettile)
      sorgenti/                tavole originali IMG_5422–5437
docs/reference/                immagini di riferimento per lo stile
tools/
  spritebuild.py               strumenti comuni: ritaglio, scala, allineamento, fogli PNG
  build_matteo_sprites.py      genera i PNG di Matteo dalle tavole sorgenti
  build_vlad_sprites.py        genera i PNG di Vlad dalle tavole sorgenti
  build_beppe_special.py       speciale di Beppe: afferra, tiene e lancia il bancale
  clean_white_residue.py       toglie il bianco di sfondo residuo dagli sprite
  spritekey.py                 scontorno del magenta e separazione dei frame
```

## Aggiungere un personaggio con sprite

1. Prepara le tavole con sfondo magenta pieno (una posa per figura, rivolte a destra) e mettile in
   `assets/characters/<nome>/sorgenti/`.
2. Genera i fogli copiando `tools/build_vlad_sprites.py`
   (richiede `pip install pillow numpy scipy`). Formato: un PNG per animazione,
   `<nome>-<animazione>.png`, frame affiancati a larghezza uguale, piedi sul bordo inferiore,
   personaggio in piedi alto circa 400 px.
3. Registra il personaggio in `SPRSET` dentro `index.html` (cartella, numero di frame per
   animazione, proiettile) e aumenta `VER` per svuotare la cache dei browser.

Animazioni riconosciute: `idle`, `walk`, `punch`, `kick`, `heavy`, `special`, `jump`, `block`,
`crouch`, `fall`, `ko`; facoltative `hit` (colpito) e `win` (vittoria).
