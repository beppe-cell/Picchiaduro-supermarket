# Asset

- `backgrounds/`: le 6 arene (`arena-orizzontale`, `-magazzino`, `-casse`, `-ortofrutta`, `-surgelati`,
  `-parcheggio`), usate in entrambi gli orientamenti.
- `characters/<nome>/`: gli sprite di ogni personaggio, una striscia per animazione. I `.png` sono i file di
  lavoro prodotti dagli strumenti in `tools/`; il gioco carica i `.webp` generati da `tools/to_webp.py`.
  Ci sono anche il proiettile della mossa speciale e `<nome>-front` (vista frontale per la selezione).
- `characters/<nome>/sorgenti/`: i disegni originali da cui sono ricavati gli sprite. Il gioco non li carica.

Tutti i personaggi e le arene sono immagini: nel gioco non c'è più grafica disegnata via codice.
Musica ed effetti sonori sono sintetizzati a runtime con la Web Audio API.
