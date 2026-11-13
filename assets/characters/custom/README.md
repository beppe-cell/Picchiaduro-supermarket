# Sprite personalizzati — istruzioni

Metti qui i tuoi PNG. Verranno usati al posto degli sprite procedurali.

## Formato richiesto

- **Un PNG per animazione**, frame affiancati in orizzontale
- **64×64 px per frame**, sfondo **trasparente**
- Personaggio **rivolto a destra**, **piantato in piedi** (i piedi non "galleggiano")
- Piedi sulla riga **y=56** del frame, centro corpo a **x=30**
- Lascia ~2 px di margine ai bordi (l'outline viene aggiunto dal gioco)

Nome file: `<personaggio>_<animazione>.png`
Personaggi: `blaze`, `shadow`, `titan`, `volt` (o un nuovo nome → nuovo personaggio)

## Animazioni (in ordine di importanza)

| Priorità | File | Frame consigliati | Note |
|----------|------|-------------------|------|
| ★★★ | `_idle` | 4 | loop, respirazione |
| ★★★ | `_walk` | 6 | loop |
| ★★★ | `_punch` | 4 | 1=carica, 2-3=colpo, 4=recupero |
| ★★★ | `_kick` | 4 | idem |
| ★★★ | `_heavy` | 5 | colpo pesante |
| ★★★ | `_hit` | 2 | reazione colpo subito |
| ★★ | `_run` | 6 | loop |
| ★★ | `_jump` | 3 | salita / apice / discesa |
| ★★ | `_crouch` | 2 | abbassato |
| ★★ | `_block` | 1-2 | parata |
| ★★ | `_victory` | 4 | loop |
| ★★ | `_defeat` | 2 | KO a terra |
| ★ | `_punch2` | 4 | combo pugni 2 |
| ★ | `_lowkick` | 4 | calcio basso |
| ★ | `_jumpkick` | 3 | calcio volante |
| ★ | `_knockdown` | 2 | a terra |
| ★ | `_getup` | 3 | rialzo |
| ★ | `_special` | 4 | mossa speciale |
| ★ | `_intro` | 4 | ingresso round |
| ★ | `_crouchblock` | 1-2 | parata abbassata |

Le animazioni mancanti usano automaticamente quelle procedurali: puoi
sostituire anche una sola animazione (es. solo idle e walk).

## Come consegnarli

1. Carica i PNG in questa cartella (`assets/characters/custom/`) da github.com
   → "Add file" → "Upload files" (come hai fatto per la reference)
2. Scrivi qui in chat "fatto" (e dimmi a quale personaggio si riferiscono)
3. Il caricatore legge i PNG e li integra nel gioco
