#!/bin/bash
# Claude Code PreToolUse (Bash): prima di un "git commit" controlla che non si pubblichino segreti, file
# sensibili o foto con GPS nel repository PUBBLICO (tools/check_secrets.py --pendenti: anche i file non ancora
# in stage, perche' spesso "git add -A && git commit" e' un comando solo). Exit 2 = blocca, stderr a Claude.
cd "${CLAUDE_PROJECT_DIR:-$(dirname "${BASH_SOURCE[0]}")/../..}" 2>/dev/null || exit 0
INPUT=$(cat)
CMD=$(printf '%s' "$INPUT" | python3 -c 'import json,sys
try: print(json.load(sys.stdin).get("tool_input",{}).get("command",""))
except Exception: print("")' 2>/dev/null)
case "$CMD" in *"git commit"*|*"git -C"*" commit"*) ;; *) exit 0 ;; esac
[ -f tools/check_secrets.py ] || exit 0
OUT=$(python3 -B tools/check_secrets.py --pendenti 2>&1) && exit 0
printf '%s\n' "$OUT" >&2
exit 2
