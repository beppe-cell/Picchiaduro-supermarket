"""Controllo anti-segreti prima di un commit (il repository e' PUBBLICO: un file pubblicato per sbaglio viene
trovato dai bot in pochi minuti e resta nella cronologia).

Blocca il commit se tra i file in stage (git add) c'e':
  - un file dal nome sensibile: .env*, chiavi (.pem .key .p12 .pfx id_rsa ...), credenziali, .npmrc/.netrc,
    service account, keystore, database o archivi di backup;
  - una riga aggiunta che contiene una chiave o un token riconoscibile (GitHub, OpenAI, Anthropic, AWS,
    Google, Slack, Stripe, chiavi private, assegnazioni tipo API_KEY=...);
  - un'immagine con la posizione GPS o i dati della fotocamera (una foto vera, non un disegno);
  - un file piu' grande di 20 MB.
Esce con codice 1 e spiega cosa ha trovato; 0 se e' tutto a posto.

Uso:  python3 -B tools/check_secrets.py            (file in stage, come fa il pre-commit)
      python3 -B tools/check_secrets.py --pendenti  (anche modifiche non in stage e file nuovi)
      python3 -B tools/check_secrets.py --tutti    (tutti i file del repository)
Attivazione per git (una volta per clone):  git config core.hooksPath .githooks
Per Claude Code e' attivo da .claude/settings.json (hook su "git commit")."""
import os
import re
import subprocess
import sys

ROOT = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))

NOMI = re.compile(r'(^|/)(\.env($|\.)|.*\.(pem|key|p12|pfx|jks|keystore|ovpn|kdbx|sqlite3?|db|bak|dump)$|'
                  r'id_(rsa|dsa|ecdsa|ed25519)(\.pub)?$|.*credentials?.*\.json$|(^|/)[^/]*secrets?\.(json|ya?ml|env|txt|toml|ini|cfg)$|'
                  r'service[-_]?account.*\.json$|\.npmrc$|\.netrc$|\.pypirc$|\.git-credentials$|'
                  r'.*\.tfstate$|\.aws/|\.ssh/)', re.I)
SEGRETI = [
    ('token GitHub', r'gh[pousr]_[A-Za-z0-9]{30,}|github_pat_[A-Za-z0-9_]{40,}'),
    ('chiave Anthropic', r'sk-ant-[A-Za-z0-9_-]{20,}'),
    ('chiave OpenAI o simile', r'\bsk-(proj-)?[A-Za-z0-9_-]{20,}'),
    ('chiave AWS', r'\bAKIA[0-9A-Z]{16}\b'),
    ('chiave Google', r'\bAIza[0-9A-Za-z_-]{35}\b'),
    ('token Slack', r'\bxox[abprs]-[A-Za-z0-9-]{10,}'),
    ('chiave Stripe', r'\b(sk|rk)_(live|test)_[A-Za-z0-9]{20,}'),
    ('chiave privata', r'-----BEGIN [A-Z ]*PRIVATE KEY-----'),
    ('JWT / token Supabase', r'\beyJ[A-Za-z0-9_-]{15,}\.eyJ[A-Za-z0-9_-]{15,}\.[A-Za-z0-9_-]{15,}'),
    ('password o chiave assegnata',
     r'(?i)\b[A-Z0-9_]*(api[_-]?key|secret|password|passwd|token|access[_-]?key)[A-Z0-9_]*\s*[:=]\s*["\']?[A-Za-z0-9/+_.-]{16,}'),
]
SALTA = ('assets/vendor/',)               # librerie copiate: controllate a parte (build riproducibile)
IMG = ('.jpg', '.jpeg', '.png', '.heic', '.webp', '.tif', '.tiff')
MAX_MB = 20


def git(*a):
    return subprocess.run(['git', *a], cwd=ROOT, capture_output=True, text=True).stdout


def foto_vera(path):
    """True se l'immagine ha GPS o marca/modello della fotocamera (EXIF)"""
    try:
        from PIL import Image
        ex = Image.open(path).getexif()
        return bool(ex.get_ifd(0x8825)) or bool(ex.get(0x010F) or ex.get(0x0110))
    except Exception:
        return False


def main():
    tutti = '--tutti' in sys.argv
    pend = '--pendenti' in sys.argv      # anche le modifiche non ancora in stage e i file nuovi (per "git add -A && git commit")
    nuovi = []
    if tutti:
        files = git('ls-files').split('\n')
    elif pend:
        nuovi = [f for f in git('ls-files', '--others', '--exclude-standard').split('\n') if f]
        files = git('diff', 'HEAD', '--name-only', '--diff-filter=ACMR').split('\n') + nuovi
    else:
        files = git('diff', '--cached', '--name-only', '--diff-filter=ACMR').split('\n')
    files = [f for f in files if f]
    problemi = []
    for f in files:
        if NOMI.search(f):
            problemi.append('%s: nome di file sensibile (chiavi, credenziali, ambiente)' % f)
        p = os.path.join(ROOT, f)
        if os.path.isfile(p):
            if os.path.getsize(p) > MAX_MB * 1e6:
                problemi.append('%s: file di %.0f MB (troppo grande per il repository)' % (f, os.path.getsize(p) / 1e6))
            if f.lower().endswith(IMG) and foto_vera(p):
                problemi.append('%s: foto con posizione GPS o dati della fotocamera (togli i metadati o non pubblicarla)' % f)
    if tutti or pend:
        testo = git('diff', 'HEAD', '-U0', '--no-color', '--', '.', *[':!' + s for s in SALTA]) if pend else ''
        for f in (nuovi if pend else files):
            if f.startswith(SALTA) or f.lower().endswith(IMG + ('.woff2', '.mjs', '.pdf')):
                continue
            try:
                testo += ''.join('+%s:%s\n' % (f, l) for l in open(os.path.join(ROOT, f), encoding='utf-8', errors='ignore'))
            except OSError:
                pass
    else:
        testo = git('diff', '--cached', '-U0', '--no-color', '--', '.', *[':!' + s for s in SALTA])
    corrente = ''
    for l in testo.split('\n'):
        if l.startswith('+++ b/'):
            corrente = l[6:]
            continue
        if not l.startswith('+') or l.startswith('+++'):
            continue
        for nome, rx in SEGRETI:
            m = re.search(rx, l)
            if m:
                where = corrente or l[1:].split(':', 1)[0]
                problemi.append('%s: possibile %s ("%s...")' % (where, nome, m.group(0)[:12]))
    if problemi:
        print('BLOCCATO: il commit pubblicherebbe dati sensibili nel repository PUBBLICO.', file=sys.stderr)
        for p in problemi[:30]:
            print('  - ' + p, file=sys.stderr)
        print('Togli i file dallo stage (git restore --staged <file>) o i segreti dal codice; un falso allarme si '
              'segnala a chi mantiene il progetto, non si aggira.', file=sys.stderr)
        sys.exit(1)
    print('controllo segreti: OK (%d file)' % len(files))


if __name__ == '__main__':
    main()
