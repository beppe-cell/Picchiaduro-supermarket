"""Importa un personaggio dai 3 fogli pose generati con Gemini sulla griglia di tools/pose_layout.json
(fogli guida ed esempio in docs/sprite-guide/, istruzioni in docs/sprite-guide/PROMPT.md).
La mossa speciale non e' nei fogli: e' unica per ogni personaggio e si fa a parte, come per Beppe,
Matteo e Vlad. Finche' non c'e', il personaggio in gioco la esegue in posa di guardia con il
proiettile generico.

Uso:
  python3 -B tools/build_character.py <nome> <foglio A> <foglio B> <foglio C> [--out CARTELLA]

Cosa fa:
  1. toglie lo sfondo magenta e le linee guida/etichette in ciano;
  2. assegna ogni figura alla casella in cui cade il suo centro (tollera griglie un po' spostate);
  3. porta tutto alla scala degli sprite: la GUARDIA del foglio A diventa alta 400 px, e gli altri
     fogli seguono in proporzione alla loro risoluzione;
  4. scrive <nome>-<animazione>.png nel formato di index.html (SPRSET) e un'anteprima;
  5. stampa la riga SPRSET da aggiungere a index.html.
Ogni casella vuota o sostituita con un'altra posa viene detta per nome: non c'e' nessun ripiego silenzioso."""
import argparse
import json
import os
import sys
import numpy as np
from PIL import Image, ImageDraw
from scipy import ndimage as nd

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from spritekey import key            # noqa: E402
from spritebuild import frame_from_mask, write_sheet, SPRITE_H  # noqa: E402

LAYOUT = json.load(open(os.path.join(HERE, 'pose_layout.json')))

# posa che prende il posto di una casella vuota (sempre segnalato nel resoconto)
FALLBACK = {'walk': 'idle', 'jump_up': 'kick_0', 'jump_tuck': 'jump_up', 'crouch': 'idle', 'block': 'idle',
            'punch_0': 'idle', 'kick_0': 'idle', 'heavy_0': 'punch_0', 'heavy_1': 'punch_1',
            'hit': 'idle', 'fall': 'hit', 'win_0': 'idle', 'win_1': 'win_0'}

# animazioni del gioco: nome -> pose (gli attacchi mostrano il colpo dal 2o frame, come Matteo e Vlad)
ANIMS = [('idle', ['idle']), ('walk', ['idle', 'walk']),
         ('punch', ['punch_0', 'punch_1', 'punch_1', 'punch_1', 'idle']),
         ('kick', ['kick_0', 'kick_1', 'kick_1', 'kick_1', 'idle']),
         ('heavy', ['heavy_0', 'heavy_0', 'heavy_1', 'heavy_1', 'idle']),
         ('jump', ['jump_up', 'jump_tuck', 'jump_up']), ('block', ['block']), ('crouch', ['crouch']),
         ('hit', ['hit']), ('fall', ['hit', 'fall']), ('ko', ['ko']), ('win', ['win_0', 'win_1'])]


# --tieni-blu: il blu del personaggio (es. kippah, stella, divisa blu) non si tocca; si toglie solo il blu
# che forma linee dritte e lunghe (guide e tratteggi), oltre al ciano e alla striscia delle etichette
KEEP_BLUE = False


def guide_lines(blue, n=60, gap=14):
    """pixel blu che stanno su una linea orizzontale o verticale lunga almeno n px (i tratteggi con
    buchi fino a gap px contano come linea intera), un po' allargati per prendere l'alone del JPEG"""
    h = nd.binary_opening(nd.binary_closing(blue, np.ones((1, gap))), np.ones((1, n)))
    v = nd.binary_opening(nd.binary_closing(blue, np.ones((gap, 1))), np.ones((n, 1)))
    return nd.binary_dilation(h | v, iterations=2) & blue


def load_sheet(path, sheet):
    """RGBA float con sfondo magenta e guide ciano trasparenti.
    Il ciano puro si toglie ovunque. Le sue sfumature (ciano mescolato al magenta e al JPEG: toni
    bluastri) si tolgono solo dove stanno le guide, cosi' un dettaglio blu del personaggio resta:
    righe/colonne che formano una linea lunga, una fascia attorno a ogni linea prevista e la striscia
    delle etichette sotto la linea dei piedi."""
    o = key(path)
    H, W = o.shape[:2]
    # magenta scuro o spento (Gemini a volte sbaglia il colore dello sfondo): rosso e blu entrambi
    # ben sopra il verde. La pelle (B < G), la maglia rossa (B basso), i capelli grigi e il nero
    # non rientrano.
    raw = np.asarray(Image.open(path).convert('RGB')).astype(np.float32)
    r, gg, b = raw[..., 0], raw[..., 1], raw[..., 2]
    mag = np.minimum(r, b) - gg
    dull = (mag > 22) & (r > 1.5 * gg + 8) & (b > 1.5 * gg + 8)
    soft = np.clip(1 - (mag - 22) / 28, 0, 1) * 255
    o[..., 3] = np.where(dull, np.minimum(o[..., 3], soft), o[..., 3])
    R, G, B = o[..., 0], o[..., 1], o[..., 2]
    cyan = (G > 140) & (B > 140) & (R < 120) & (np.abs(G - B) < 80)
    blue = (B > np.maximum(R, G) + 30) & (B > 70) & (o[..., 3] > 0)   # anche blu scuro (guide su fondo scuro)
    zone = np.zeros((H, W), bool)
    rows = np.where(blue.sum(1) > 0.25 * W)[0]
    cols = np.where(blue.sum(0) > 0.25 * H)[0]
    for r in rows:
        zone[max(0, r - 3):r + 4] = True
    for c in cols:
        zone[:, max(0, c - 3):c + 4] = True
    g = LAYOUT['guides']
    band = max(6, int(H * 0.012))
    for c, (x0, y0, x1, y1) in cell_boxes(sheet, W, H):
        x0, y0, x1, y1 = int(x0), int(y0), int(x1), int(y1)
        for yy in (y0, y1 - 1, int(y0 + g['head'] * (y1 - y0))):
            zone[max(0, yy - band):yy + band, x0:x1] = True
        for xx in (x0, x1 - 1):
            zone[y0:y1, max(0, xx - band):xx + band] = True
        zone[int(y0 + g['feet'] * (y1 - y0)) - band:y1, x0:x1] = True   # linea dei piedi ed etichetta
    if KEEP_BLUE:
        strip = np.zeros((H, W), bool)   # striscia delle etichette sotto la linea dei piedi: tutto via
        for c, (x0, y0, x1, y1) in cell_boxes(sheet, W, H):
            strip[int(y0 + g['feet'] * (y1 - y0)) + band:int(y1), int(x0):int(x1)] = True
        o[..., 3][cyan | (blue & zone & (guide_lines(blue) | strip))] = 0
        return o
    o[..., 3][cyan | (blue & zone)] = 0
    return o


def cell_boxes(sheet, W, H):
    s = LAYOUT['sheet']
    cw, ch = W / s['cols'], H / s['rows']
    return [(c, (c['col'] * cw, c['row'] * ch, (c['col'] + c.get('span', 1)) * cw, (c['row'] + 1) * ch))
            for c in LAYOUT['sheets'][sheet]['cells']]


def figures_by_cell(o, sheet, notes):
    """{id casella: maschera} unendo le parti che cadono nella stessa casella."""
    H, W = o.shape[:2]
    boxes = cell_boxes(sheet, W, H)
    feet = LAYOUT['guides']['feet']
    msk = o[..., 3] > 40
    lab, n = nd.label(nd.binary_dilation(msk, iterations=2))
    out = {}
    for i, sl in enumerate(nd.find_objects(lab), 1):
        comp = (lab == i) & msk
        area = comp.sum()
        if area < 60:
            continue
        bh, bw = sl[0].stop - sl[0].start, sl[1].stop - sl[1].start
        if area / float(bh * bw) < 0.04 and max(bh, bw) > 100:   # cornici e linee rimaste
            continue
        cy, cx = nd.center_of_mass(comp)
        for c, (x0, y0, x1, y1) in boxes:
            if x0 <= cx < x1 and y0 <= cy < y1:
                if c.get('lying') and bh > 0.5 * (y1 - y0) and bh > 1.2 * bw:
                    notes.append('foglio %s, %s: ignorata una figura in piedi nella casella del KO'
                                 % (sheet, c['label']))
                    break
                if sl[0].start > y0 + feet * (y1 - y0) - 3 and area < 0.05 * (x1 - x0) * (y1 - y0):
                    break   # scritta sotto la linea dei piedi (etichetta ridisegnata)
                out[c['id']] = out.get(c['id'], np.zeros_like(msk)) | comp
                break
    # una casella con solo frammenti (avanzi di linee, macchie) conta come vuota, e lo si dice
    for c, (x0, y0, x1, y1) in boxes:
        m = out.get(c['id'])
        if m is None:
            continue
        need = (0.004 if c.get('object') else 0.02) * (x1 - x0) * (y1 - y0)
        if m.sum() < need:
            notes.append('foglio %s, %s: solo frammenti (%d px), casella considerata vuota'
                         % (sheet, c['label'], m.sum()))
            del out[c['id']]
    return out


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('name')
    ap.add_argument('sheets', nargs=len(LAYOUT['sheets']), metavar='FOGLIO',
                    help='fogli %s in quest\'ordine' % ' '.join(LAYOUT['sheets']))
    ap.add_argument('--out', help='cartella di uscita (predefinita: assets/characters/<nome>/)')
    ap.add_argument('--cella', action='append', default=[], metavar='ID=FOGLIO',
                    help='prende la casella ID da un\'altra versione dello stesso foglio '
                         '(es. win_1=IMG_5452.jpeg); ripetibile')
    ap.add_argument('--tieni-blu', action='store_true',
                    help='il personaggio ha parti blu (kippah, stemmi, divisa): toglie solo il blu delle '
                         'linee guida dritte, non quello del disegno')
    a = ap.parse_args()
    global KEEP_BLUE
    KEEP_BLUE = a.tieni_blu
    name = a.name.lower()
    out_dir = a.out or os.path.join(HERE, '..', 'assets', 'characters', name)
    os.makedirs(out_dir, exist_ok=True)
    notes = []

    loaded = {}
    for sheet, path in zip(LAYOUT['sheets'], a.sheets):
        o = load_sheet(path, sheet)
        loaded[sheet] = (o, figures_by_cell(o, sheet, notes))

    # scala: la guardia del foglio A alta SPRITE_H; gli altri fogli in proporzione alla risoluzione
    oA, figsA = loaded['A']
    if 'idle' not in figsA:
        sys.exit('ERRORE: nel foglio A manca la GUARDIA (casella 1): serve per la scala. Nessun file scritto.')
    ys = np.where(figsA['idle'].any(1))[0]
    h_idle = ys.max() - ys.min() + 1
    kA = SPRITE_H / h_idle
    g = LAYOUT['guides']
    guide_h = (g['feet'] - g['head']) * oA.shape[0] / LAYOUT['sheet']['rows']
    if abs(h_idle / guide_h - 1) > 0.15:
        notes.append('ATTENZIONE: la guardia e\' alta %d px, le linee guida ne prevedono %d: '
                     'controlla la scala nell\'anteprima' % (h_idle, guide_h))

    frames = {}
    for sheet, (o, figs) in loaded.items():
        k = kA * oA.shape[0] / o.shape[0]
        for cid, m in figs.items():
            frames[cid] = frame_from_mask(o, m, k)
    # caselle prese da un'altra versione dello stesso foglio
    sheet_of = {c['id']: s for s, sh in LAYOUT['sheets'].items() for c in sh['cells']}
    for spec in a.cella:
        cid, _, path = spec.partition('=')
        if cid not in sheet_of or not path:
            sys.exit('ERRORE: --cella %s non valido (ID tra: %s). Nessun file scritto.' % (spec, ', '.join(sheet_of)))
        o = load_sheet(path, sheet_of[cid])
        figs = figures_by_cell(o, sheet_of[cid], notes)
        if cid not in figs:
            sys.exit('ERRORE: in %s la casella %s e\' vuota. Nessun file scritto.' % (path, cid))
        frames[cid] = frame_from_mask(o, figs[cid], kA * oA.shape[0] / o.shape[0])
        notes.append('%s preso da %s' % (cid, os.path.basename(path)))
    expected = [c['id'] for s in LAYOUT['sheets'].values() for c in s['cells']]
    for cid in expected:
        if cid in frames:
            continue
        fb = FALLBACK.get(cid)
        while fb and fb not in frames:
            fb = FALLBACK.get(fb)
        if cid == 'ko' or not fb:
            notes.append('MANCA: %s (nessuna posa sostitutiva)' % cid)
        else:
            frames[cid] = frames[fb]
            notes.append('MANCA: %s -> uso la posa %s' % (cid, fb))
    missing = [cid for cid in ('ko',) if cid not in frames]
    if missing:
        sys.exit('ERRORE: mancano %s. Nessun file scritto.\n' % ', '.join(missing) + '\n'.join(notes))

    n = {}
    for anim, poses in ANIMS:
        write_sheet(os.path.join(out_dir, '%s-%s.png' % (name, anim)), [frames[p] for p in poses])
        n[anim] = len(poses)
    notes.append('SPECIALE: non inclusa nei fogli, da fare a parte (in gioco per ora: posa di guardia '
                 'e proiettile generico)')

    # anteprima: tutte le pose affiancate su fondo neutro, con il nome della casella
    tiles = [(cid, Image.fromarray(np.clip(frames[cid]['px'], 0, 255).astype(np.uint8), 'RGBA')) for cid in expected]
    sc = 0.5
    tiles = [(cid, t.resize((max(1, int(t.width * sc)), max(1, int(t.height * sc))))) for cid, t in tiles]
    W = 1400
    x = y = rh = 0
    pos = []
    for cid, t in tiles:
        if x + t.width > W:
            x, y, rh = 0, y + rh + 18, 0
        pos.append((x, y))
        x += t.width + 8
        rh = max(rh, t.height)
    prev = Image.new('RGBA', (W, y + rh + 18), (60, 70, 90, 255))
    d = ImageDraw.Draw(prev)
    for (cid, t), (x, y) in zip(tiles, pos):
        prev.alpha_composite(t, (x, y + 16))
        d.text((x + 2, y + 2), cid, fill='yellow')
    prev.save(os.path.join(out_dir, '%s-anteprima.png' % name))

    print('scritti in', os.path.normpath(out_dir))
    print('scala: guardia %d px -> %d px (fattore %.3f)' % (h_idle, SPRITE_H, kA))
    found = sum(1 for cid in expected if not any(l.startswith('MANCA: %s ' % cid) for l in notes))
    print(' - caselle trovate: %d su %d' % (found, len(expected)))
    for line in notes:
        print(' -', line)
    nn = ','.join('%s:%d' % (k_, v) for k_, v in n.items())
    print('\nriga per SPRSET in index.html (speciale e proiettile si aggiungono quando sono pronti):\n'
          '%s:{d:\'%s\',n:{%s}},' % (name.upper(), name, nn))


if __name__ == '__main__':
    main()
