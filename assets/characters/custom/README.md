# Sprite personalizzati — istruzioni

Metti qui i tuoi PNG e scrivi "fatto" in chat: li integro nel gioco.

## Formato richiesto

- **Un PNG per animazione**, frame affiancati in orizzontale
- **Sfondo trasparente**
- Personaggio **rivolto a destra**, in piedi, **piedi sul bordo inferiore** del frame
- Altezza consigliata **64–72 px** per frame (il gioco scala poi a piacere)
- Larghezza frame libera (64 px consigliata)

Nome file: `<PERSONAGGIO>_<animazione>.png` (es. `BEPPE_idle.png`)
Personaggi attuali: BEPPE, VLAD, LUIS, ZANI, MATTEO, FALSA, ANGEL, PAULUX

## Animazioni (in ordine di importanza)

| Priorità | Suffisso | Frame consigliati | Note |
|----------|----------|-------------------|------|
| ★★★ | `_idle` | 2–4 | loop, respirazione |
| ★★★ | `_walk` | 4–6 | loop |
| ★★★ | `_punch` | 3–4 | carica → colpo → recupero |
| ★★★ | `_kick` | 3–4 | idem |
| ★★★ | `_heavy` | 4–5 | colpo pesante |
| ★★★ | `_hit` | 1–2 | reazione al colpo |
| ★★ | `_jump` | 1–3 | salita/apice/discesa |
| ★★ | `_crouch` | 1–2 | abbassato |
| ★★ | `_block` | 1–2 | parata |
| ★★ | `_special` | 3–4 | mossa speciale |
| ★★ | `_ko` | 1–2 | sconfitta |
| ★ | `_win` | 2–4 | vittoria (loop) |

Le animazioni mancanti restano disegnate dal codice procedurale: puoi
sostituire anche una sola animazione di un solo personaggio.

## Come consegnarli

1. Vai su github.com → repository `Picchiaduro-supermarket` → cartella
   `assets/characters/custom/` → **Add file** → **Upload files**
2. Trascina i PNG → **Commit changes**
3. Scrivi in chat "fatto" indicando a quale personaggio si riferiscono

Nota: i PNG sostituiscono il disegno procedurale solo una volta che io
aggiorno il codice di caricamento — caricarli da soli non basta.
__EOF__
