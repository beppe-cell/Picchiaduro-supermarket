# SUPERRISSA — Picchiaduro del supermercato

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
- **Torneo**: prima tutti i colleghi con la felpa rossa tranne quello scelto (in ordine casuale), poi i
  mini boss FABIO, ANGEL, ASTREA ed HELA e per finire il boss BIGBOSS. Mini boss e boss vanno sempre affrontati,
  anche se li hai scelti tu (tabelle `BOSSES` e `TBL` in `index.html`).
- **Online**: sfida un altro giocatore in rete (vedi sotto).
- **Impostazioni**: volume di musica ed effetti, controlli touch, vibrazione.

## Online (senza server)

- **RANKED** (online competitivo): abbina chiunque sia in coda RANKED (per ora i giocatori sono pochi; con
  `RKNEAR=1` in `index.html` si abbinano solo punti vicini: distanza da 150 punti che si allarga di 10 al
  secondo di attesa). Si gioca un **set al meglio di 3 incontri**, ognuno al
  meglio di 3 round; tra un incontro e l'altro si riparte da soli con gli stessi dipendenti. Regole uguali per
  tutti: solo i dipendenti normali (niente mini boss e boss, anche se comprati), con **velocità e potenza uguali
  per tutti** (1,5 e 1, anche per la speciale), e le skin sono solo estetiche.
  **Chi abbandona perde**: uscire dal set, chiudere la pagina o perdere il collegamento a metà set conta come
  sconfitta (il set in corso è salvato nel profilo e alla riapertura viene registrato), e l'avversario vince a
  tavolino.
  - **Punti** (Elo): si parte da 1000; si guadagnano o perdono più punti contro avversari più forti o più deboli
    (K 40 nei primi 10 set, poi 24).
  - **Divisioni**: BRONZO, ARGENTO (1100), ORO (1250), PLATINO (1400), CAMPIONE (1550). La prima volta in una
    divisione si ricevono 300 / 600 / 1000 / 2000 cedolini; ogni set vinto dà 100 cedolini in più degli incontri.
    Divisione e punti si vedono nella schermata ONLINE e nei profili; punti e set sono nel codice di salvataggio.
  - **CLASSIFICA GLOBALE**: i migliori 50 di tutti i giocatori, con divisione, punti, set vinti/persi e
    personaggio più usato. Non c'è un server nostro: ogni giocatore pubblica la sua riga come evento Nostr
    firmato (kind 30078) su sei relay pubblici (`RKR` in `index.html`), che la conservano; aprendo la
    classifica si leggono le righe di tutti da quei relay, e a fine set la propria si ripubblica. Ognuno
    tiene anche una copia per quando la rete manca. Firma e verifica con `assets/vendor/nostr-pure.mjs`
    (nostr-tools 2.25.4, da `tools/vendor_nostr.sh`). La firma impedisce di modificare la riga di un altro,
    non di truccare la propria: è una classifica tra colleghi, non un sistema anti-trucco.
- **PARTITA FOR FUN**: abbina in automatico due giocatori che stanno cercando, senza punti.
- **CREA STANZA**: mostra un codice di 4 lettere da mandare all'amico, che lo scrive in **ENTRA CON CODICE**.
- Poi ognuno sceglie il suo dipendente (con la sua skin) e si combatte; a fine incontro **RIVINCITA**
  (serve il sì di tutti e due) o MENU. Chi crea la partita gioca a sinistra e la sua arena è a caso.
- Si guadagnano cedolini come in arcade (difficoltà x1).

Come funziona: il gioco non ha un server. I giocatori si trovano tramite i relay pubblici della rete
Nostr (libreria [Trystero](https://github.com/dmotz/trystero) 0.26.0, copiata in
`assets/vendor/trystero-nostr.mjs` da `tools/vendor_trystero.sh` e scaricata solo quando si apre ONLINE),
poi i due browser si collegano direttamente (WebRTC). Tutti usano la stessa lista di dieci relay (`NETRELAYS` in
`index.html`): senza, la libreria ne sceglierebbe 5 poco noti in base al nome del gioco. Nella schermata ONLINE si
vede quanti giocatori ci sono e quanti sono in coda RANKED e FOR FUN (sono code separate: per giocare insieme va
scelta la stessa); se l'avversario trovato non si collega entro 25 secondi si torna a cercare da soli. Le due copie del gioco simulano la stessa partita
scambiandosi solo i comandi, con il **rollback netcode** (come i picchiaduro moderni): i tuoi comandi valgono
quasi subito (2 fotogrammi, circa 33 ms) e quelli dell'avversario non ancora arrivati vengono previsti
(ripetendo il suo ultimo comando); quando arriva il comando vero, se la previsione era sbagliata il gioco torna
all'ultimo fotogramma sicuro e ricalcola fino ad ora, senza suoni doppi. Solo con un ping altissimo il ritardo
sale (fino a 8 fotogrammi) per non dover ricalcolare troppo; la previsione va avanti al massimo 14 fotogrammi.
Chi è troppo avanti rispetto all'altro rallenta di mezzo fotogramma. Ogni secondo, sui fotogrammi confermati, le
due copie confrontano un'impronta dello stato: se diverge l'HUD mostra DESYNC. La fine dell'incontro conta solo
quando è confermata da tutti e due. Il ping si vede in basso durante la partita (verde, giallo sopra 120 ms,
rosso sopra 220 ms). Se l'avversario chiude o non risponde per 8
secondi la partita si interrompe. Alcune reti (aziendali, alcuni operatori mobili) non permettono il
collegamento diretto: in quel caso servirebbe un server TURN.

## Profili, cedolini e negozio

- **Profili**: al primo avvio si sceglie un nome. Ogni profilo ha i suoi cedolini e le sue skin, salvati
  nel browser (più persone possono giocare sullo stesso dispositivo). Dal menu, il pulsante col nome in
  alto a sinistra apre PROFILI: cambia profilo, nuovo, elimina.
- **Codice di salvataggio**: PROFILI > IL MIO CODICE mostra un codice (`SPR1-...`) da copiare;
  sull'altro dispositivo PROFILI > INSERISCI CODICE (o HO UN CODICE al primo avvio) ricrea il profilo.
  Il gioco non ha un server: senza il codice, cancellare i dati del browser cancella i progressi.
- **Cedolini** (la moneta del gioco), a fine incontro, tabella `REW` in `index.html`:

  | Voce | Cedolini |
  |---|---|
  | Vittoria / sconfitta | 50 / 15 |
  | Ogni round vinto | 10 |
  | Round perfetto (senza danni) | 20 |
  | Torneo completato | 150 |
  | Difficoltà della CPU | totale × (1 + (livello − 2) × 0,15) |

- **Mini boss e boss da comprare**: FABIO, ANGEL, ASTREA, HELA e BIGBOSS si affrontano (in ARCADE e nel
  TORNEO) ma per sceglierli vanno comprati nel negozio con i cedolini: FABIO 2000, ANGEL 2500, ASTREA 3000,
  HELA 4000, BIGBOSS 5000 (tabella `PRZ` in `index.html`); poi sono giocabili in tutte le modalità
  (tranne RANKED, dove si usano solo i dipendenti normali). Chi li aveva già sbloccati li tiene.
- **Negozio**: come la scelta del dipendente, un articolo per schermata (frecce, trascinamento o tasti
  ←/→): prima i mini boss e il boss da comprare (anteprima visibile, prezzo e COMPRA),
  poi tutte le skin in vendita con il dipendente a cui appartengono e il prezzo (COMPRA). Una skin
  comprata resta nel profilo.
- **Skin in selezione**: nella scelta del dipendente il pulsante SKIN (tasto `K`) mostra le sue skin:
  ORIGINALE e quelle comprate si indossano (INDOSSA / IN USO), le altre rimandano al negozio. La skin
  indossata si vede in selezione, in combattimento e nel ritratto dell'HUD.

### Aggiungere una skin

1. Metti gli sprite in `assets/characters/<nome>/skin-<id>/` con gli **stessi nomi di file**
   dell'originale (`<nome>-<animazione>.webp`, proiettile, `<nome>-front.webp`; fai i PNG come al solito e
   lancia `tools/to_webp.py`, che converte anche le cartelle `skin-*`). Un file che manca resta quello
   originale: una skin può cambiare anche solo alcune animazioni.
   Dai fogli pose: `python3 -B tools/build_character.py <nome> <A> <B> <C> --out
   assets/characters/<nome>/skin-<id>` (aggiungi `--tieni-blu` se la skin ha parti blu, come kippah e
   stella di MATTEO SHALOM: altrimenti la pulizia delle linee guida azzurre le buca); vista per la selezione: aggiungi la tavola in `BOARDS` di
   `tools/build_fronts.py` (chiave `<nome>/skin-<id>`) e lancia `build_fronts.py <nome>/skin-<id>`.
2. Aggiungi la skin in `SKINS` dentro `index.html`, es. `BEPPE:[{id:'natale',n:'BABBO BEPPE',p:400}]`
   (`n` nome nel negozio, `p` prezzo in cedolini; `ms` nome della speciale se la skin la cambia;
   `ov` valori di SPRSET da cambiare, es. il proiettile; `nf` se un'animazione ha un numero di fotogrammi
   diverso dall'originale, es. `nf:{fall:2,win:2}`) e aumenta `VER`.

## Personaggi

| Nome | Grafica | Mossa speciale |
|---|---|---|
| BEPPE | sprite disegnati (`assets/characters/beppe/`) | Lancio del pallet |
| MATTEO | sprite disegnati (`assets/characters/matteo/`) | Carrello volante |
| VLAD | sprite disegnati (`assets/characters/vlad/`) | Spruzzino accecante |
| LUIS | sprite disegnati (`assets/characters/luis/`) | Assolo distruttivo (onda sonora) |
| ZANNA | sprite disegnati (`assets/characters/zanna/`) | Taglierino furioso (corpo a corpo) |
| HELA (mini boss) | sprite disegnati (`assets/characters/hela/`) | Risata al telefono (onda sonora) |
| ANGEL (mini boss) | sprite disegnati (`assets/characters/angel/`) | Picchiata angelica (volo corpo a corpo) |
| BIGBOSS (boss) | sprite disegnati (`assets/characters/bigboss/`) | Carica del transpallet (corpo a corpo) |
| ANDREI | sprite disegnati (`assets/characters/andrei/`) | Piede di porco (corpo a corpo) |
| FABIO (mini boss) | sprite disegnati (`assets/characters/fabio/`) | Schianto dal sollevatore: sale sulle forche, si tuffa e l'onda d'urto corre sul pavimento |
| COMINZ | sprite disegnati (`assets/characters/cominz/`) | Falce e martello (corpo a corpo) |
| ASTREA (mini boss) | sprite disegnati (`assets/characters/astrea/`) | Rotolo di scontrino che vola e si srotola (proiettile) |
| PORTE | sprite disegnati (`assets/characters/porte/`) | Lancio della scatola (proiettile che ruota) |
| KARMA | sprite disegnati (`assets/characters/karma/`) | Lancio della cassa (registratore di cassa che vola ruotando e perde monete) |

Skin in vendita nel negozio: **MATTEO SHALOM** (1500 cedolini, `assets/characters/matteo/skin-israele/`) e
**LUIS EL MARIACHI** (1500 cedolini, `assets/characters/luis/skin-mariachi/`: speciale con le maracas, stessa onda)
e **VLAD IN PUMP** (1500 cedolini, `assets/characters/vlad/skin-pump/`: a torso nudo da palestra, speciale
"lancio del manubrio" con il manubrio che vola ruotando al posto dello spruzzo; stessi danni).

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
    zanna/                      zanna-<animazione>.png (speciale corpo a corpo, senza proiettile)
      sorgenti/                tavola IMG_5456, fogli pose IMG_5458–5460, speciale IMG_5463
    hela/                      hela-<animazione>.png, hela-laugh.png (proiettile)
      sorgenti/                tavola.png, foglio-A/B/C.png, speciale IMG_5474
    angel/                     angel-<animazione>.png (speciale corpo a corpo, senza proiettile)
      sorgenti/                tavola IMG_5469, fogli pose IMG_5470–5472, speciale IMG_5473
    bigboss/                   bigboss-<animazione>.png (speciale corpo a corpo col transpallet)
    andrei/                    andrei-<animazione>.png (speciale corpo a corpo col piede di porco)
    fabio/                     fabio-<animazione>.png, fabio-shock.png (onda d'urto della speciale)
    cominz/                    cominz-<animazione>.png (speciale corpo a corpo con falce e martello)
    astrea/                    astrea-<animazione>.png, astrea-receipt.png (rotolo di scontrino)
    porte/                     porte-<animazione>.png, porte-box.png (scatola che ruota)
    karma/                   karma-<animazione>.png, karma-cassa.png (proiettile); sorgenti/: tavola, foglio-A/B/C, speciale, occhiali-foto
      sorgenti/                tavola IMG_5494, fogli pose IMG_5495–5497, speciale IMG_5498
    luis/skin-mariachi/        skin LUIS EL MARIACHI; sorgenti/: tavola IMG_5500, fogli IMG_5501–5504
                               (fuori griglia: pose scelte a mano con tools/build_figure_map.py)
    vlad/skin-pump/            skin VLAD IN PUMP; sorgenti/: tavola, foglio-A/B/C, speciale (tools/build_vlad_pump_special.py)
    matteo/skin-israele/       skin MATTEO SHALOM; sorgenti/: tavola IMG_5489, fogli pose IMG_5490, 5491, 5493
      sorgenti/                tavola IMG_5476, fogli pose IMG_5477–5479, speciale IMG_5480
assets/vendor/                 trystero-nostr.mjs (multiplayer online, MIT)
                               nostr-pure.mjs (firma e verifica Nostr per la classifica globale, Unlicense/MIT)
docs/reference/                immagini di riferimento per lo stile
docs/sprite-guide/             fogli pose e prompt per creare un personaggio con Gemini
tools/
  pose_layout.json             disposizione delle caselle dei fogli pose
  make_pose_templates.py       genera i fogli guida ed esempio in docs/sprite-guide/
  build_character.py           importa un personaggio dai 3 fogli pose (tutte le animazioni tranne la speciale)
  build_special.py             pose della speciale da una tavola a parte (con --taglio per pose che si toccano)
  build_luis_special.py        speciale di LUIS: chitarra e onda sonora
  build_hela_special.py      speciale di HELA: busto col telefono sulle gambe della guardia, onda della risata
  build_fabio_special.py       speciale di FABIO: pose col sollevatore (forche a meta' montante) e onda d'urto
  fix_zanna_mask.py             toglie la mascherina a ZANNA: trapianta la testa senza mascherina nelle pose che l'avevano
  build_throw_special.py       speciale "lancio di un oggetto" da un foglio a due righe (pose + oggetto in volo)
  build_vlad_pump_special.py   speciale e manubrio della skin VLAD IN PUMP
  rename_sign.py               riscrive il nome del gioco sull'insegna appesa negli sfondi delle arene
  replace_g_logo.py            sostituisce la G del logo sulle divise con la S di SUPERRISSA in tutti gli sprite
  build_astrea_special.py      rotolo di scontrino di ASTREA (3 fotogrammi allineati sul rotolo)
  build_porte_special.py       scatola di PORTE (--larga 140) (3 fotogrammi che ruotano, centrati sulla scatola)
  fix_crouch_legs.py           ripara l'accovacciato con le gambe tagliate (stinchi e stivali dallo stacco del salto)
  build_extra_poses.py         aggiunge singole animazioni da un foglio pose (es. vittoria di Beppe)
  build_fronts.py              vista frontale di ogni personaggio (<nome>-front.png) per la selezione
  spritebuild.py               strumenti comuni: ritaglio, scala, allineamento, fogli PNG
  build_matteo_sprites.py      genera i PNG di Matteo dalle tavole sorgenti
  build_vlad_sprites.py        genera i PNG di Vlad dalle tavole sorgenti
  build_beppe_special.py       speciale di Beppe: afferra, tiene e lancia il bancale
  build_figure_map.py          animazioni scegliendo a mano le figure, per fogli generati fuori griglia
  vendor_trystero.sh           ricostruisce la libreria del multiplayer (assets/vendor/trystero-nostr.mjs)
  vendor_nostr.sh              ricostruisce le funzioni Nostr della classifica (assets/vendor/nostr-pure.mjs)
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
