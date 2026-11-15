# Fogli pose per i personaggi

Materiale per creare le animazioni di un personaggio con 3 immagini generate da Gemini.
Istruzioni e prompt: [`PROMPT.md`](PROMPT.md). La mossa speciale è esclusa: è unica per ogni
personaggio e si fa a parte.

- `esempio-*.png`: i 3 fogli con le pose di Matteo, da allegare a Gemini.
- `guida-*.png`: le stesse griglie vuote (sfondo magenta, linea dei piedi, linea della testa).

Tutto è generato da `tools/make_pose_templates.py` a partire da `tools/pose_layout.json` e dagli
sprite di Matteo: se cambi la disposizione delle caselle, cambia il JSON e rilancia lo script
(`python3 -B tools/make_pose_templates.py`). I fogli generati si importano con
`python3 -B tools/build_character.py <nome> <A> <B> <C>`.
