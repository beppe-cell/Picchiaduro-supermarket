---
name: nuova-skin
description: "Comando 'nuova skin': aggiunge a SUPERRISSA una skin per un personaggio esistente dalle immagini di Gemini con un solo comando (tools/nuovo.py skin). Usala quando l'utente scrive 'nuova skin', chiede una skin o i suoi prompt per Gemini, o carica le immagini di una skin."
argument-hint: "[personaggio e descrizione della skin]"
user-invocable: true
allowed-tools: Bash, Read
---

# Nuova skin

Leggi `.claude/skills/nuovo-personaggio/SKILL.md` e seguilo: è la stessa procedura. Per una skin cambia solo:

- **Immagini** in `assets/characters/<personaggio>/skin-<id>/sorgenti/` (`<id>`: una parola minuscola, es. `pump`).
  La `speciale` serve solo se la skin lancia un oggetto diverso; la `tavola` si fa allegando quella dell'originale.
- **Comando:**
  ```
  python3 -B tools/nuovo.py skin <personaggio> <id> --nome "NOME SKIN" --prezzo 1500 [--mossa "NOME MOSSA"] [--oggetto <oggetto>]
  ```
  Senza `--oggetto` la skin lancia l'oggetto dell'originale, ridisegnato se c'è `speciale`.
  Senza `speciale` usa la mossa dell'originale.
- In RANKED le skin sono solo estetiche: valgono le statistiche e la mossa dell'originale.
