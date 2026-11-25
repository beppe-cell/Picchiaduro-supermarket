# Nuovo personaggio con Gemini

**In breve:** 5 immagini con i nomi fissi in `assets/characters/<nome>/sorgenti/` (per una skin:
`assets/characters/<nome>/skin-<id>/sorgenti/`), poi un solo comando:

| File | Cos'è | Prompt |
|---|---|---|
| `tavola` | il personaggio di fronte, di profilo e di schiena | [Tavola](#prompt-tavola-di-riferimento) |
| `foglio-A`, `foglio-B`, `foglio-C` | le pose | [Fogli](#prompt-fogli-pose) |
| `speciale` | la mossa speciale | [Speciale](#prompt-mossa-speciale-lancio) |

```
python3 -B tools/nuovo.py personaggio <nome> --nome NOME --mossa "NOME DELLA MOSSA" --oggetto <oggetto>
python3 -B tools/nuovo.py skin <personaggio> <id> --nome "NOME SKIN" --mossa "NOME DELLA MOSSA" --prezzo 1500
```

Estensione libera (`.jpeg`, `.png`). L'ordine giusto è: prima la tavola, poi i fogli e la speciale
allegando la tavola, tutto nella **stessa chat** di Gemini.

## Prompt: tavola di riferimento

Allega una foto o descrivi il personaggio al posto di `[DESCRIZIONE]`.

```
Disegna in pixel art, stile picchiaduro arcade anni '90, la tavola di riferimento di un personaggio:
[NOME], [DESCRIZIONE]. Dipendente di un supermercato: maglia rossa con la lettera S bianca sul petto,
pantaloni neri da lavoro.
Tre figure intere in piedi affiancate, stessa altezza, che non si toccano: a sinistra di profilo
(guarda a destra), al centro di fronte, a destra di schiena.
Sfondo magenta pieno (#FF00FF), senza ombre, pavimento, scritte o cornici.
Immagine orizzontale, alla risoluzione più alta che puoi.
```

Per una **skin** scrivi cosa cambia (es. "senza maglietta, più muscoloso, fascia in testa") e allega la
tavola dell'originale: "Ridisegna questa tavola con [CAMBIAMENTI], stesso viso e stesse proporzioni".

## Prompt: mossa speciale (lancio)

Allega la tavola. Sostituisci `[NOME]` e `[OGGETTO]` (es. "un registratore di cassa").

```
Pixel art come la tavola allegata, sfondo magenta pieno (#FF00FF). Due righe:
IN ALTO 3 figure intere di [NOME] rivolto verso DESTRA, che lancia [OGGETTO]:
  1) tiene [OGGETTO] con tutte e due le mani; 2) lo carica indietro; 3) braccia tese in avanti, mani vuote.
IN BASSO 3 volte [OGGETTO] da solo, in volo verso destra: dritto, inclinato, capovolto, con qualche
linea di movimento a sinistra.
Le figure non si toccano e non escono dall'immagine; niente scritte, cornici, ombre o pavimento.
Immagine orizzontale, alla risoluzione più alta che puoi.
```

Per una speciale **corpo a corpo** (tools/nuovo.py ... `--corpo`) usa solo la riga in alto, con 3 pose
del colpo (carica, colpo, ritorno), e niente riga in basso.

## Prompt: fogli pose

Ogni personaggio richiede **3 generazioni**, una per foglio. Ogni foglio ha 6 caselle con le pose di
Matteo: Gemini le ridisegna con il nuovo personaggio, senza doverle inventare.

| Foglio | File da allegare | Pose |
|---|---|---|
| A | `esempio-A-movimento.png` | guardia, passo, salto (stacco e raccolto), accovacciato, parata |
| B | `esempio-B-attacchi.png` | pugno, calcio, colpo forte (carica e colpo) |
| C | `esempio-C-reazioni.png` | colpito, cade, KO disteso, 2 vittorie |

**La mossa speciale non è nei fogli**: ha la sua immagine (`speciale`, prompt sopra).

## Come fare

1. Apri una chat nuova con Gemini e usa la **stessa chat per tutti e 3 i fogli**: il personaggio resta
   più coerente.
2. Per ogni foglio allega **due immagini**: il foglio esempio e la tavola di riferimento del
   personaggio (fronte, profilo, retro, come IMG_5407 di Matteo).
3. Incolla il prompt qui sotto, sostituendo `[NOME]`.
4. Se un foglio esce con un errore (pose tagliate, gambe in più, personaggio girato), rigenera **solo
   quel foglio**.
5. Salva le 3 immagini in `assets/characters/<nome>/sorgenti/` come `foglio-A`, `foglio-B`, `foglio-C`.
   Il resto lo fa `tools/nuovo.py`.

## Prompt (uguale per tutti i fogli)

```
Ti allego due immagini:
1) un foglio di pose di un personaggio in pixel art (Matteo) su sfondo magenta, diviso in 6 caselle
   con linee guida azzurre;
2) la tavola di riferimento di un altro personaggio: [NOME].

Ridisegna LO STESSO foglio con [NOME] al posto di Matteo:
- stesse pose, stessa casella per ogni posa, stessa grandezza, stesso stile pixel art;
- [NOME] sempre rivolto verso DESTRA, come Matteo;
- ogni figura intera dentro la sua casella, con un po' di margine: niente braccia, gambe, capelli o
  oggetti tagliati o che escono dalla casella;
- piedi appoggiati sulla linea azzurra in basso e testa all'altezza della linea tratteggiata in alto,
  come Matteo;
- esattamente due braccia e due gambe per figura; nessuna figura tocca quella vicina;
- sfondo magenta pieno (#FF00FF), senza ombre, senza pavimento, senza sfumature;
- lascia le linee azzurre e le scritte come sono, oppure toglile; non aggiungere altro testo.
Mantieni il viso, i capelli, la corporatura e la divisa di [NOME] come nella seconda immagine.
Immagine orizzontale, alla risoluzione più alta che puoi.
```

## Se qualcosa non va

- **Personaggio più piccolo o più grande delle linee guida:** va bene lo stesso, la scala la sistema
  lo script partendo dalla GUARDIA del foglio A (che quindi deve esserci).
- **Una casella vuota o sbagliata:** lo script la segnala per nome e usa una posa di riserva, così
  puoi decidere se rigenerare quel foglio.
- **Figure che si toccano:** finiscono nella casella in cui cade il loro centro; se si fondono, rigenera
  il foglio.
