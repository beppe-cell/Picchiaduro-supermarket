"""Un comando per un personaggio o una skin nuovi: dalle immagini di Gemini al gioco provato.

Le immagini vanno in una cartella `sorgenti/` con nomi fissi (qualsiasi estensione: .jpeg, .png...):
  foglio-A  foglio-B  foglio-C   i 3 fogli pose (docs/sprite-guide/PROMPT.md)
  speciale                       la mossa speciale: 3 pose in alto + 3 oggetti in basso (lancio)
                                 oppure solo 3 pose (con --corpo)
  tavola                         la tavola di riferimento (fronte al centro): vista nella selezione
Cartella: assets/characters/<cartella>/sorgenti/  (skin: assets/characters/<personaggio>/skin-<id>/sorgenti/)

Uso:
  python3 -B tools/nuovo.py personaggio karma --nome KARMA --mossa "LANCIO DELLA CASSA" --oggetto cassa
      [--prezzo 2500] [--sc .9] [--sp 1.5] [--pw 1] [--uscita 40,-68] [--largo 150] [--corpo --portata 50]
  python3 -B tools/nuovo.py skin vlad pump --nome "VLAD IN PUMP" --mossa "LANCIO DEL MANUBRIO"
      [--oggetto manubrio] [--prezzo 1500] [--uscita 52,-78]

Cosa fa, in ordine (si ferma al primo errore, senza toccare il codice):
  1. sprite dai 3 fogli (build_character.py) e scala trovata;
  2. speciale: lancio (build_throw_special.py) o corpo a corpo (build_special.py), alla stessa scala;
  3. vista per la selezione dalla tavola (build_fronts.py);
  4. WebP (to_webp.py);
  5. codice: src/characters/<cartella>.js nuovo e riga in fondo all'elenco di index.html (personaggio),
     oppure la skin nel file del personaggio (skin); sale VER (e NETV per un personaggio nuovo);
  6. prova nel gioco (prova_personaggio.js) e UNA immagine di controllo:
     production/qa/evidence/nuovo-<cartella>[-<id>].png = selezione + speciale + tutte le pose.
Stampa un resoconto breve. Rilanciarlo rifa' tutto (sostituisce il personaggio o la skin con lo stesso nome)."""
import argparse
import glob
import json
import os
import re
import subprocess
import sys
import tempfile
from PIL import Image

ROOT = os.path.normpath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))
T = os.path.join(ROOT, 'tools')
CHD = os.path.join(ROOT, 'assets', 'characters')
INDEX = os.path.join(ROOT, 'index.html')
LOADER = os.path.join(ROOT, 'src', 'core', 'loader.js')
ONLINE = os.path.join(ROOT, 'src', 'net', 'online.js')
EVID = os.path.join(ROOT, 'production', 'qa', 'evidence')


def stop(msg):
    sys.exit('ERRORE: ' + msg)


def run(cmd):
    """esegue uno strumento; in caso di errore mostra il suo messaggio e si ferma"""
    r = subprocess.run(cmd, cwd=ROOT, capture_output=True, text=True)
    if r.returncode:
        stop('%s\n%s%s' % (' '.join(os.path.basename(c) for c in cmd[1:3]), r.stdout[-1500:], r.stderr[-1500:]))
    return r.stdout


def src(dirp, name, needed=True):
    f = sorted(glob.glob(os.path.join(dirp, 'sorgenti', name + '.*')))
    if not f and needed:
        stop('manca %s/sorgenti/%s.jpeg (o .png)' % (os.path.relpath(dirp, ROOT), name))
    return f[0] if f else None


def num(v):
    return ('%.2f' % v).rstrip('0').rstrip('.')


def js_str(s):
    return "'" + s.replace('\\', '').replace("'", "\\'") + "'"


def bump(path, var):
    s = open(path, encoding='utf-8').read()
    m = re.search(r'\b%s=(\d+)' % var, s)
    v = int(m.group(1)) + 1
    open(path, 'w', encoding='utf-8').write(s[:m.start(1)] + str(v) + s[m.end(1):])
    return v


def balanced(s, i, op='{', cl='}'):
    """indice dopo la parentesi che chiude quella aperta in s[i]"""
    d = 0
    for j in range(i, len(s)):
        d += {op: 1, cl: -1}.get(s[j], 0)
        if d == 0:
            return j + 1
    stop('parentesi non chiuse nel file del personaggio')


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('tipo', choices=['personaggio', 'skin'])
    ap.add_argument('cartella', help='cartella in assets/characters/ (es. karma); per una skin: il personaggio')
    ap.add_argument('id', nargs='?', help='solo skin: id della skin (cartella skin-<id>)')
    ap.add_argument('--nome', required=True, help='nome in gioco (personaggio: MAIUSCOLO, es. KARMA)')
    ap.add_argument('--mossa', help='nome della mossa speciale (es. "LANCIO DELLA CASSA")')
    ap.add_argument('--oggetto', help='oggetto lanciato: file <cartella>-<oggetto> (es. cassa)')
    ap.add_argument('--corpo', action='store_true', help='speciale corpo a corpo invece del lancio')
    ap.add_argument('--portata', type=float, default=50, help='corpo a corpo: distanza a cui colpisce')
    ap.add_argument('--scatto', type=float, default=0, help='corpo a corpo: velocita\' in avanti')
    ap.add_argument('--prezzo', type=int, help='si compra nel negozio (cedolini, 1500-5000)')
    ap.add_argument('--sc', type=float, default=1, help='scala del personaggio (es. .9 bassa, 1.05 alto)')
    ap.add_argument('--sp', type=float, default=1.5, help='velocita\' (1.5 = normale)')
    ap.add_argument('--pw', type=float, default=1, help='potenza (1 = normale)')
    ap.add_argument('--uscita', default='40,-68', help='punto da cui parte l\'oggetto: avanti,altezza (da 0,0 ai piedi)')
    ap.add_argument('--largo', type=float, default=150, help='larghezza dell\'oggetto in volo, px sprite')
    ap.add_argument('--tieni-blu', action='store_true', help='il personaggio ha parti blu (vedi build_character.py)')
    ap.add_argument('--senza-prova', action='store_true', help='non provare nel gioco')
    a = ap.parse_args()

    d = a.cartella.lower()
    skin = a.tipo == 'skin'
    if skin and not a.id:
        stop('per una skin serve l\'id: nuovo.py skin <personaggio> <id> ...')
    base_js = os.path.join(ROOT, 'src', 'characters', d + '.js')
    if skin and not os.path.exists(base_js):
        stop('personaggio %s inesistente (%s)' % (d, os.path.relpath(base_js, ROOT)))
    if not skin and not a.mossa:
        stop('serve --mossa "NOME DELLA SPECIALE"')
    out = os.path.join(CHD, d, 'skin-' + a.id) if skin else os.path.join(CHD, d)
    key = d + ('/skin-' + a.id if skin else '')
    rel = os.path.relpath(out, ROOT)
    if skin:
        base_txt = open(base_js, encoding='utf-8').read()
        n_ch = re.search(r"n:'([A-Z]+)'", base_txt).group(1)
    else:
        n_ch = re.sub(r'[^A-Z]', '', a.nome.upper())
    rep = ['%s %s' % ('SKIN' if skin else 'PERSONAGGIO', a.nome)]

    # 1. pose
    fogli = [src(out, 'foglio-' + x) for x in 'ABC']
    o = run([sys.executable, '-B', os.path.join(T, 'build_character.py'), d, *fogli, '--out', out]
            + (['--tieni-blu'] if a.tieni_blu else []))
    fattore = float(re.search(r'fattore ([\d.]+)', o).group(1))
    nn = dict((k, int(v)) for k, v in re.findall(r'(\w+):(\d+)', re.search(r'n:\{([^}]*)\}', o).group(1)))
    avvisi = [l.strip(' -') for l in o.splitlines() if 'MANCA' in l or 'ATTENZIONE' in l]
    rep.append('pose: %s' % (re.search(r'caselle trovate: \d+ su \d+', o).group(0)))

    # 2. speciale
    sp_file = src(out, 'speciale', needed=False)
    special = None
    ux, uy = (float(v) for v in a.uscita.split(','))
    if sp_file and a.corpo:
        o = run([sys.executable, '-B', os.path.join(T, 'build_special.py'), d, sp_file, '--scala', str(fattore), '--out', out])
        nn['special'] = 3
        special = 'corpoACorpo({portata:%s%s, tempi:[4,9,13]})' % (num(a.portata), ', scatto:%s' % num(a.scatto) if a.scatto else '')
        rep.append('speciale: corpo a corpo, 3 pose')
    elif sp_file:
        if not a.oggetto and not skin:
            stop('serve --oggetto (es. cassa) oppure --corpo')
        proj = '%s-%s' % (d, a.oggetto) if a.oggetto else None
        if not proj:   # skin senza oggetto nuovo: sostituisce l'oggetto dell'originale
            m = re.search(r"oggetto:'([^']+)'", base_txt)
            proj = m.group(1) if m else stop('l\'originale non lancia nulla: serve --oggetto')
        o = run([sys.executable, '-B', os.path.join(T, 'build_throw_special.py'), d, sp_file, proj, '--out', out,
                 '--scala', str(fattore), '--sc', str(a.sc), '--largo', str(a.largo)])
        pjh, pjy = (float(v) for v in re.search(r'pjh:([-\d.]+),pjy:([-\d.]+)', o).groups())
        nn['special'] = 3
        ogg = "oggetto:'%s', " % proj if a.oggetto else ''
        extra = ', scala:0, avvio:0' if skin else ''   # una skin azzera le opzioni dell'oggetto originale
        special = 'lancio({%sfotogrammi:3%s, alto:%s, y:%s, largo:%s, uscita:[%s,%s], tempi:[5,11]})' % (
            ogg, extra, num(pjh), num(pjy), num(min(40, a.largo * 0.24)), num(ux), num(uy))
        rep.append('speciale: lancio di %s' % proj)
    else:
        rep.append('speciale: manca sorgenti/speciale -> %s' % ('quella dell\'originale' if skin else 'proiettile generico'))

    # 3-4. vista frontale e WebP
    if src(out, 'tavola', needed=False):
        run([sys.executable, '-B', os.path.join(T, 'build_fronts.py'), key])
    else:
        avvisi.append('manca sorgenti/tavola: nella selezione si vede la guardia')
    run([sys.executable, '-B', os.path.join(T, 'to_webp.py')])

    # 5. codice
    if skin:
        entry = "{id:%s,n:%s%s,p:%d%s}" % (
            js_str(a.id), js_str(a.nome.upper()), ',ms:' + js_str(a.mossa.upper()) if a.mossa else '', a.prezzo or 1500,
            ',special:' + special if special else '')
        s = base_txt
        m = re.search(r"\{id:'%s'" % re.escape(a.id), s)
        if m:
            s = s[:m.start()] + entry + s[balanced(s, m.start()):]
        elif 'skins:[' in s:
            i = s.index('skins:[') + len('skins:')
            j = balanced(s, i, '[', ']')
            s = s[:j - 1] + (',' if s[i + 1:j - 1].strip() else '') + entry + s[j - 1:]
        else:
            j = s.rindex('})')
            s = s[:j].rstrip() + ',\n  skins:[' + entry + ']\n' + s[j:]
        open(base_js, 'w', encoding='utf-8').write(s)
        rep.append('codice: skin in %s' % os.path.relpath(base_js, ROOT))
    else:
        nstr = ','.join('%s:%d' % (k, v) for k, v in nn.items())
        exists = os.path.exists(base_js)
        html = open(INDEX, encoding='utf-8').read()
        tags = re.findall(r'<script src="src/characters/([a-z]+)\.js"></script>', html)
        chars = [t for t in tags if t not in ('registry', 'specials')]
        pos = chars.index(d) + 1 if d in chars else len(chars) + 1
        body = ("/* %s - personaggio n. %d (l'ordine dei file in index.html e' quello dell'elenco: non cambiarlo,\n"
                "   la partita online identifica i personaggi per posizione) */\n"
                "/* creato con tools/nuovo.py dalle immagini in %s/sorgenti/ */\n"
                "character({\n  n:%s,ms:%s,sp:%s,pw:%s,\n  sprites:{d:%s%s,n:{%s}}%s%s\n})\n") % (
            n_ch, pos, rel, js_str(n_ch), js_str(a.mossa.upper()), num(a.sp), num(a.pw), js_str(d),
            ',sc:' + num(a.sc) if a.sc != 1 else '', nstr,
            ',\n  special:' + special if special else '', ',\n  price:%d' % a.prezzo if a.prezzo else '')
        open(base_js, 'w', encoding='utf-8').write(body)
        if d not in chars:
            last = '<script src="src/characters/%s.js"></script>' % chars[-1]
            html = html.replace(last, last + '\n<script src="src/characters/%s.js"></script>' % d, 1)
            open(INDEX, 'w', encoding='utf-8').write(html)
            rep.append('codice: %s nuovo, n. %d in fondo all\'elenco, NETV=%d' % (
                os.path.relpath(base_js, ROOT), pos, bump(ONLINE, 'NETV')))
        else:
            rep.append('codice: %s %s' % (os.path.relpath(base_js, ROOT), 'rifatto' if exists else 'creato'))
    rep.append('VER=%d' % bump(LOADER, 'VER'))

    # 6. prova e immagine di controllo
    tmp = tempfile.mkdtemp(prefix='superrissa-')
    res = {}
    if not a.senza_prova:
        r = subprocess.run(['node', os.path.join(T, 'prova_personaggio.js'), n_ch, a.id if skin else 'base', tmp],
                           cwd=ROOT, capture_output=True, text=True)
        try:
            res = json.loads(r.stdout.strip().splitlines()[-1])
        except (ValueError, IndexError):
            res = {'ok': False, 'errori': [(r.stderr or r.stdout)[-400:]]}
        rep.append('prova nel gioco: %s (speciale %s, danno %s%s)' % (
            'OK' if res.get('ok') else 'PROBLEMI', (res.get('speciale') or {}).get('tipo', '?'), res.get('danno', '?'),
            ', proiettile partito' if res.get('proiettile') else ''))
        for k in ('errori', 'mancanti'):
            if res.get(k):
                avvisi.append('%s: %s' % (k, '; '.join(res[k])))
    else:
        rep.append('prova nel gioco: NON FATTA (--senza-prova): nessun controllo che funzioni')
    shots = [os.path.join(tmp, f) for f in ('selezione.png', 'speciale.png') if os.path.exists(os.path.join(tmp, f))]
    prev = os.path.join(out, d + '-anteprima.png')
    parts = [Image.open(f).convert('RGB') for f in shots]
    W = 1100
    row = None
    if parts:
        h = 300
        parts = [p.resize((int(p.width * h / p.height), h)) for p in parts]
        row = Image.new('RGB', (sum(p.width for p in parts), h))
        x = 0
        for p in parts:
            row.paste(p, (x, 0))
            x += p.width
        row = row.resize((W, int(h * W / row.width)))
    pv = Image.open(prev).convert('RGB')
    pv = pv.resize((W, int(pv.height * W / pv.width)))
    img = Image.new('RGB', (W, (row.height if row else 0) + pv.height), (20, 20, 30))
    if row:
        img.paste(row, (0, 0))
    img.paste(pv, (0, row.height if row else 0))
    os.makedirs(EVID, exist_ok=True)
    ev = os.path.join(EVID, 'nuovo-%s%s.png' % (d, '-' + a.id if skin else ''))
    img.save(ev, optimize=True)

    print('\n'.join(rep))
    for w in avvisi:
        print('ATTENZIONE:', w)
    print('CONTROLLA:', os.path.relpath(ev, ROOT))
    sys.exit(0 if a.senza_prova or res.get('ok') else 1)


if __name__ == '__main__':
    main()
