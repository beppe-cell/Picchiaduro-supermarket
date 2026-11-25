# Come è fatto SUPERRISSA

Questa guida spiega come è costruito il gioco e le regole per modificarlo senza romperlo.
È pensata per chi impara: si legge dall'inizio alla fine in una ventina di minuti.
Per giocare, pubblicare o aggiungere sprite c'è il `README.md`.

---

## 1. L'idea in una frase

Il gioco è una pagina web (`index.html`) che carica degli **script JavaScript normali**, uno dopo l'altro.
Uno di questi script fa girare la partita **60 volte al secondo** e la disegna su un `<canvas>`.
Non ci sono librerie per il gioco, né compilazione, né `npm`: i file che vedi sono quelli che il browser esegue.

---

## 2. Come si carica: l'ordine conta

In fondo a `index.html` c'è l'elenco degli script:

```html
<script src="src/core/base.js"></script>
<script src="src/characters/registry.js"></script>
<script src="src/characters/specials.js"></script>
<script src="src/characters/beppe.js"></script>
...
<script src="src/main.js"></script>
```

Il browser li esegue **in quest'ordine**. Tutti condividono lo stesso spazio di nomi: una
`const CH` dichiarata in `registry.js` si usa direttamente in `fighter.js`, senza `import`.

Ne seguono due regole.

- **Si usa solo ciò che è già stato caricato.** Un file può usare le cose dei file *sopra* di lui
  appena viene eseguito. Le cose dei file *sotto* può usarle solo dentro funzioni chiamate più tardi.
  Per esempio `beppe.js` chiama `lancio(...)`, quindi `specials.js` deve venire prima.
- **I personaggi sono in ordine fisso.** L'ordine dei file in `src/characters/` è l'ordine dei
  personaggi nel gioco. L'online identifica i personaggi per posizione (0 = BEPPE, 1 = VLAD...).
  **Un personaggio nuovo va sempre in fondo**, mai in mezzo.

---

## 3. La mappa delle cartelle

```
index.html          pagina: schermate (menu, negozio, online...) + elenco degli script
css/style.css       aspetto delle schermate
src/
  core/             le fondamenta
    base.js           costanti, canvas, $() per prendere gli elementi della pagina
    loader.js         carica le immagini (VER = versione, serve contro la cache)
    audio.js          musica ed effetti, sintetizzati con Web Audio
    input.js          tastiera e comandi touch
    loop.js           il ciclo dei 60 fotogrammi al secondo
  characters/       un file per personaggio + il "registro"
    registry.js       character({...}): registra un personaggio
    specials.js       le mosse speciali (classi)
    beppe.js ...      i personaggi
  game/             le regole del gioco
    fighter.js        il lottatore: classe Fighter, colpi, danni, CPU
    partita.js        la partita: round, step() di un fotogramma, fine incontro
    arena.js          sfondi e dimensioni del campo
    torneo.js         ordine degli avversari, boss
    economia.js       cedolini, negozio, skin
  render/           il disegno (non cambia le regole)
    render.js         scena, barre della vita, scritte
    sprite.js         disegno di un lottatore
    luci.js           luci e atmosfera
  ui/               le schermate
    schermi.js        sh() mostra una schermata, menu, pausa
    selezione.js negozio.js profili.js impostazioni.js
  save/profili.js   salvataggi nel browser, nomi sicuri
  net/              l'online
    online.js         giocatori presenti, ricerca avversario, stanze
    rollback.js       netcode rollback
    ranked.js         punti, divisioni, classifica
  main.js           avvio: carica tutto e fa partire il ciclo
assets/             immagini (.webp), font, librerie online (vendor/)
tools/              script Python per preparare gli sprite e controllare i segreti
```

**Regola pratica:** per cambiare un personaggio si apre solo il suo file. Le altre cartelle si
aprono solo quando il lavoro riguarda loro.

---

## 4. La vita di un fotogramma

Ogni 1/60 di secondo succede questo:

```
loop()                       core/loop.js
 ├─ step()                   game/partita.js   ← LE REGOLE (offline)
 │   ├─ pin()                comandi del giocatore
 │   ├─ AI(b, a)             comandi della CPU
 │   ├─ upd(a, b, comandi)   ogni lottatore si muove, attacca, salta...
 │   │    └─ f.special.tick(...)   se sta facendo la speciale
 │   ├─ corpi che non si sovrappongono, telecamera
 │   ├─ proiettili (PJ): volano e colpiscono → dmg()
 │   └─ fine round / fine incontro
 └─ render()                 render/render.js  ← IL DISEGNO
```

Online, al posto di `step()` gira `netStep()` (in `net/rollback.js`), che a sua volta chiama `step()`.
Le regole sono quindi **le stesse** offline e online.

**Separazione importante:** `step()` cambia lo stato, `render()` lo disegna e basta. Il disegno non
deve mai cambiare le regole: online i due giocatori devono calcolare esattamente la stessa partita.

---

## 5. Oggetti per il comportamento, dati per lo stato

Questa è la scelta più importante del progetto.

### Il comportamento sta nelle classi

- **`Fighter`** (`game/fighter.js`) è il lottatore. Si crea con `mk(personaggio, x, verso, cpu, livello)`.
- **`Special`** (`characters/specials.js`) è la mossa speciale, con il pattern *Strategy*: ogni
  personaggio sceglie *quale* strategia usare.
  - `ProjectileSpecial`: lancia un oggetto (la cassa di KARMA, il manubrio di VLAD IN PUMP...).
  - `MeleeSpecial`: colpisce da vicino (ZANNA, ANGEL...).

Durante la speciale il lottatore non sa *come* è fatta: chiama `f.special.tick(...)` e fa la
strategia giusta. Per un tipo nuovo di speciale basta una classe nuova, senza toccare `fighter.js`.

### Lo stato resta fatto di dati semplici

La posizione, la vita, il fotogramma dell'animazione, i proiettili in volo sono solo **numeri, testi e
piccoli oggetti**. Il motivo è il rollback online (sezione 7): il gioco deve poter **fotografare** tutta
la partita (`snapTake`) e **tornare indietro** (`snapLoad`) decine di volte al secondo. Con dati semplici
la fotografia è una copia (`{...f}`).

Per questo la strategia della speciale **non** sta dentro il lottatore. Si trova a partire dal
personaggio (`SPRSET[nome].spc`), quindi la fotografia non la copia.

> **Perché non un "ECS" o un motore a componenti?** Per un picchiaduro con due lottatori sarebbe molto
> codice in più senza vantaggi. Le classi dove serve il comportamento, e i dati dove serve lo stato,
> bastano.

---

## 6. Un personaggio, dall'inizio alla fine

`src/characters/karma.js`:

```js
character({
  n:'KARMA', ms:'LANCIO DELLA CASSA', sp:1.55, pw:1.05,
  sprites:{d:'karma', sc:.9, n:{idle:1,walk:2,punch:5,kick:5,heavy:5,jump:3,block:1,crouch:1,special:3,hit:1,fall:2,ko:1,win:2}},
  special:lancio({oggetto:'karma-cassa', fotogrammi:3, alto:25.4, y:-12.7, largo:36, uscita:[40,-68], tempi:[5,11]})
})
```

| Campo | Significato |
|---|---|
| `n` | nome (anche l'identificativo) |
| `ms` | nome della mossa speciale, mostrato nella selezione |
| `sp`, `pw` | velocità e potenza (1 = normale) |
| `sprites.d` | cartella in `assets/characters/` |
| `sprites.n` | quanti fotogrammi ha ogni animazione |
| `sprites.sc` | scala del disegno (facoltativa) |
| `special` | `lancio({...})` oppure `corpoACorpo({...})`; i parametri sono spiegati in `specials.js` |
| `skins` | facoltativo: skin in vendita `{id, n, ms, p prezzo, special}` |
| `price` | facoltativo: si compra nel negozio |
| `boss` | facoltativo: `{order, lv, final}` nel torneo |

`character()` (in `registry.js`) mette questi dati nelle tabelle del gioco:

| Tabella | Contenuto |
|---|---|
| `CH` | elenco dei personaggi |
| `SPRSET` | come disegnarli + i numeri della speciale |
| `SKINS` | skin in vendita |
| `PRZ` | prezzi dei personaggi |
| `BOSSES`, `MINI` | boss del torneo |

---

## 7. L'online in breve

- **Niente server nostro.** I due giocatori si collegano direttamente (WebRTC, libreria Trystero).
  Si trovano tramite dei *relay* pubblici Nostr.
- **Si scambiano solo i comandi** (destra, pugno, speciale...), non la partita. Ognuno calcola la
  partita per conto suo: per questo `step()` deve dare **sempre lo stesso risultato** con gli stessi
  comandi.
- **Rollback.** Non si aspettano i comandi dell'avversario: il gioco **prevede** che ripeta l'ultimo
  comando e va avanti. Quando arriva il comando vero ed era diverso, torna alla fotografia di quel
  fotogramma e ricalcola fino ad ora (in silenzio: `RB=1` spegne suoni e scintille). Così il
  ritardo dei comandi è minimo anche con connessioni lente.
- **DESYNC.** Ogni tanto i due giocatori confrontano un'impronta dello stato. Se differisce, qualcosa
  ha calcolato in modo diverso: è un bug da correggere.
- **RANKED.** Punti Elo e divisioni stanno nel profilo. La classifica globale è fatta di messaggi
  firmati pubblicati sui relay Nostr. In RANKED tutti i personaggi hanno le stesse statistiche e le
  skin sono solo estetiche.

---

## 8. Le regole fisse

Queste regole proteggono il gioco. Se una va infranta, prima si capisce perché esiste.

1. **Passo fisso, niente delta time.** Le regole avanzano a 60 passi al secondo esatti, con numeri
   per fotogramma (velocità, durate in fotogrammi). È un'eccezione voluta alla regola generale del
   "delta time": serve al rollback, perché due dispositivi diversi devono calcolare la stessa partita.
2. **Niente `Math.random()` nelle regole online.** Due dispositivi darebbero numeri diversi. Il caso
   è ammesso solo per la CPU (offline) e per gli effetti estetici. Una scelta a caso che vale per tutti e
   due, come l'arena, la fa un solo giocatore e la manda all'altro (`net/online.js`).
3. **Lo stato è fatto di dati semplici.** Niente funzioni o riferimenti nascosti dentro il lottatore o
   dentro `G`: il rollback li copierebbe male.
4. **Il disegno non cambia le regole.** `render/` legge lo stato, non lo modifica.
5. **Suoni, scintille e vibrazione controllano `RB`.** Durante il ricalcolo del rollback non devono
   partire.
6. **Personaggi solo in fondo** all'elenco di `index.html`. Se cambia l'elenco, sali `NETV` in
   `net/online.js`, così le versioni vecchie non giocano contro quelle nuove.
7. **Ogni modifica pubblicata sale `VER`** in `core/loader.js`, così i browser scaricano le immagini
   nuove.
8. **Ciò che arriva da fuori non è fidato.** Nomi, messaggi online e codici di salvataggio passano da
   `cleanName()` e `esc()` prima di finire nella pagina. I comandi online vengono controllati.
9. **Mai segreti nel repository.** Il repository è pubblico: niente chiavi, password, `.env` o foto
   personali. `tools/check_secrets.py` lo controlla a ogni commit (hook in `.githooks/`) e prima della
   pubblicazione.

---

## 9. Ricette

### Aggiungere un personaggio
Vedi il `README.md`, sezione "Aggiungere un personaggio con sprite". In breve: sprite con
`tools/build_character.py`, un file in `src/characters/`, una riga **in fondo** all'elenco in
`index.html`, poi si salgono `VER` e `NETV`.

### Aggiungere una skin
Nel file del personaggio, in `skins`:
```js
skins:[{id:'pump', n:'VLAD IN PUMP', ms:'LANCIO DEL MANUBRIO', p:1500,
        special:lancio({fotogrammi:3, alto:35, y:-17.5, uscita:[52,-78]})}]
```
Gli sprite vanno in `assets/characters/<personaggio>/skin-<id>/`. La `special` è facoltativa: senza,
la skin usa la speciale del personaggio.

### Un tipo nuovo di mossa speciale
In `src/characters/specials.js`:
```js
class OndaSpecial extends Special {
  tick(f, o, t, m) { /* ogni fotogramma della speciale: f lottatore, o avversario, t fotogramma */ }
  get closeRange() { return false }   // true = la CPU la usa solo da vicino
}
function onda(p) { return new OndaSpecial(specialFields(p)) }
```
Poi, nel personaggio, `special: onda({...})`. Se servono parametri nuovi, aggiungili a `SPECIAL_KEYS`.
Ricorda le regole 1–3 e 5 della sezione 8.

### Una schermata nuova
Si aggiunge un `<div class="scr" id="s-nome">` in `index.html` con i suoi pulsanti `.b`, e lo si
mostra con `sh('s-nome')`. La navigazione da tastiera funziona da sola per i pulsanti `.b`.

---

## 10. Glossario dei nomi corti

Il codice usa nomi brevi per le cose usate di continuo.

| Nome | Cos'è |
|---|---|
| `G` | la partita in corso (`G.a` e `G.b` i due lottatori, `G.ph` la fase: intro, play, ko, end) |
| `f`, `o` | il lottatore e il suo avversario |
| `f.st` | stato del lottatore: idle, walk, jump, atk, hit, ko... |
| `f.atk` | attacco in corso: `p` pugno, `k` calcio, `h` pesante, `s` speciale |
| `f.t` | fotogrammi passati nello stato attuale |
| `f.sp` | barra della speciale (100 = pronta) |
| `f.L` | il personaggio (da `CH`); `f.ss` = i suoi sprite, con la skin |
| `MV` | tempi degli attacchi: `su` carica, `ac` attivo, `re` ritorno (in fotogrammi) |
| `PJ`, `PS` | proiettili in volo, scintille |
| `T` | contatore globale dei fotogrammi |
| `RB` | 1 mentre il rollback ricalcola |
| `NET` | stato della connessione online |
| `SAVE` | il profilo in uso (cedolini, skin...); `save()` lo scrive nel browser |
| `sh(id)` | mostra una schermata |
| `$('#id')` | prende un elemento della pagina |
| `sfx('nome')` | suona un effetto |

---

## 11. Provare e pubblicare

- **Provare:** apri `index.html` con un server locale (per esempio `python3 -m http.server`) e gioca.
  Per l'online servono due finestre.
- **Prima di pubblicare:** gioca una partita per tipo di modifica toccata e sali `VER`. Se hai toccato
  le regole, prova anche una partita online per vedere che non esca DESYNC.
- **Pubblicare:** il ramo `main` viene pubblicato su GitHub Pages da `.github/workflows/deploy-pages.yml`.
  Pubblica solo i file del gioco: niente `sorgenti/`, strumenti o documenti.
