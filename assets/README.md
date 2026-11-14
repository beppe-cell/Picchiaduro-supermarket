# Asset

- `backgrounds/`: le arene. `arena-supermercato.png` viene usata in orizzontale, `corridoio-verticale.jpeg` in verticale.
- `characters/<nome>/`: i fogli sprite usati dal gioco (`<nome>-<animazione>.png`) e il proiettile della mossa speciale.
- `characters/<nome>/sorgenti/`: i disegni originali da cui sono ricavati gli sprite. Il gioco non li carica.

I personaggi senza cartella (LUIS, ZANI, FALSA, ANGEL, PAULUX) sono disegnati via codice in `index.html`.
Musica ed effetti sonori sono sintetizzati a runtime con la Web Audio API.
