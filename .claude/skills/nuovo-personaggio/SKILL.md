---
name: nuovo-personaggio
description: "Comando 'nuovo personaggio': aggiunge a SUPERRISSA un personaggio nuovo dalle immagini di Gemini con un solo comando (tools/nuovo.py). Usala quando l'utente scrive 'nuovo personaggio', chiede un personaggio nuovo o i suoi prompt per Gemini, o carica le immagini di un personaggio. Per una skin c'e' 'nuova skin'."
argument-hint: "[nome e descrizione]"
user-invocable: true
allowed-tools: Bash, Read
---

# Nuovo personaggio

Obiettivo: **meno letture possibili**. Il comando fa tutto; tu leggi solo il suo resoconto e UNA immagine.
La skill `nuova-skin` usa questa stessa procedura.

## 0. Cosa chiedere (una sola domanda, tutto insieme)
Solo ciò che manca nella richiesta: nome; aspetto (descrizione o foto); mossa speciale (lancia un
oggetto: quale? oppure colpo corpo a corpo) e il suo nome; prezzo nel negozio o gratis; alto/basso.
Per una skin: personaggio di partenza, cosa cambia nell'aspetto, nome, prezzo, se cambia la mossa.

## Non leggere
Nessun file del codice (`src/`, `index.html`, gli script in `tools/`), né `README.md` o `ARCHITETTURA.md`.
Bastano questa pagina e, se servono i prompt, `docs/sprite-guide/PROMPT.md`.

## 1. Prompt per Gemini (se l'utente non ha ancora le immagini)
Dai i prompt di `docs/sprite-guide/PROMPT.md` (tavola, speciale, fogli), compilati con nome, aspetto e
oggetto della speciale. Non riscriverli da zero.

## 2. Immagini
Vanno in `assets/characters/<nome>/sorgenti/` (skin: `assets/characters/<personaggio>/skin-<id>/sorgenti/`)
con i nomi `tavola`, `foglio-A`, `foglio-B`, `foglio-C`, `speciale` (estensione libera). Se l'utente le
carica con altri nomi, rinominale con `mv` (guardale solo se non si capisce quale è quale).
Mai foto personali reali in `sorgenti/`: il repository è pubblico. Usa solo le immagini disegnate.

## 3. Un comando
```
python3 -B tools/nuovo.py personaggio <nome> --nome NOME --mossa "NOME MOSSA" --oggetto <oggetto> [--prezzo N] [--sc .9]
python3 -B tools/nuovo.py personaggio <nome> --nome NOME --mossa "NOME MOSSA" --corpo [--portata 50] [--scatto 4]
python3 -B tools/nuovo.py skin <personaggio> <id> --nome "NOME SKIN" [--mossa "..."] [--oggetto <oggetto>] --prezzo 1500
```
Opzioni utili: `--sc` (altezza: .9 bassa, 1.05 alta), `--sp`/`--pw` (velocità/potenza, 1.5/1 normali),
`--uscita avanti,altezza` (da dove parte l'oggetto, predefinito 40,-68), `--largo` (oggetto più grande o
piccolo in volo, predefinito 150), `--tieni-blu` (personaggio con parti blu). Prezzi nel negozio: 1500–5000.
Rilanciarlo con opzioni diverse rifà tutto: è il modo per correggere.

## 4. Controllo
Il comando stampa un resoconto e `CONTROLLA: production/qa/evidence/nuovo-....png`.
Leggi **solo quell'immagine**: selezione, speciale in gioco, tutte le pose.
- Oggetto che parte troppo alto/basso/indietro → rilancia con `--uscita`.
- Oggetto troppo grande/piccolo → `--largo`.
- Posa sbagliata o tagliata → chiedi all'utente di rigenerare solo quel foglio.
- `PROBLEMI` nella prova → leggi le righe `ATTENZIONE` del resoconto prima di aprire qualsiasi file.

## 5. Pubblicare
Niente commit finché l'utente non dice "metti online" (regola del progetto).
