# Nuovo personaggio con Gemini: 3 immagini

Ogni personaggio richiede **3 generazioni**, una per foglio. Ogni foglio ha 6 caselle con le pose di
Matteo: Gemini le ridisegna con il nuovo personaggio, senza doverle inventare.

| Foglio | File da allegare | Pose |
|---|---|---|
| A | `esempio-A-movimento.png` | guardia, passo, salto (stacco e raccolto), accovacciato, parata |
| B | `esempio-B-attacchi.png` | pugno, calcio, colpo forte (carica e colpo) |
| C | `esempio-C-reazioni.png` | colpito, cade, KO disteso, 2 vittorie |

**La mossa speciale non è nei fogli**: è unica per ogni personaggio e si fa a parte, come per Beppe
(bancale), Matteo (carrello) e Vlad (spruzzino). Finché non c'è, in gioco il personaggio la esegue in
posa di guardia, con il proiettile generico.

## Come fare

1. Apri una chat nuova con Gemini e usa la **stessa chat per tutti e 3 i fogli**: il personaggio resta
   più coerente.
2. Per ogni foglio allega **due immagini**: il foglio esempio e la tavola di riferimento del
   personaggio (fronte, profilo, retro, come IMG_5407 di Matteo).
3. Incolla il prompt qui sotto, sostituendo `[NOME]`.
4. Se un foglio esce con un errore (pose tagliate, gambe in più, personaggio girato), rigenera **solo
   quel foglio**.
5. Carica le 3 immagini in `assets/characters/<nome>/sorgenti/` e dimmi quale è A, B e C (o chiamale
   `foglio-A`, `foglio-B`, `foglio-C`). Il resto lo fa `tools/build_character.py`.

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
