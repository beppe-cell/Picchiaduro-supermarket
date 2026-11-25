"""Vista frontale di ogni personaggio per la schermata di selezione: <nome>-front.png.
Prende dalla tavola di riferimento (sfondo magenta, tre viste: lato, fronte, retro) la figura centrale
e la porta all'altezza dello sprite da fermo del personaggio, cosi' i rapporti di altezza tra i
personaggi restano quelli del gioco. Chi non ha la tavola (Beppe) in selezione usa la guardia.
Le skin hanno la loro tavola: chiave '<nome>/skin-<id>', vista scritta nella cartella della skin e
portata all'altezza della guardia della skin.
Per un personaggio o una skin nuovi basta la tavola in <chiave>/sorgenti/tavola.<estensione>.
Uso: python3 -B tools/build_fronts.py [chiave ...]   (senza chiavi: tutte; es. andrei matteo/skin-israele)"""
import glob
import os
import sys
import numpy as np
from PIL import Image
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from spritekey import key, figures                # noqa: E402
from spritebuild import frame_from_mask, write_sheet  # noqa: E402

CH = 'assets/characters/'
BOARDS = {   # personaggio -> tavola di riferimento
    'matteo': 'matteo/sorgenti/IMG_5407.JPG',
    'vlad': 'vlad/sorgenti/IMG_5422.JPG',
    'luis': 'luis/sorgenti/IMG_5445.jpeg',
    'zanna': 'zanna/sorgenti/IMG_5456.jpeg',
    'angel': 'angel/sorgenti/IMG_5469.jpeg',
    'hela': 'hela/sorgenti/tavola.png',
    'beppe': 'beppe/sorgenti/tavola.JPG',      # sfondo BIANCO (vedi white_key)
    'bigboss': 'bigboss/sorgenti/IMG_5476.jpeg',
    'andrei': 'andrei/sorgenti/IMG_5494.jpeg',
    'fabio': 'fabio/sorgenti/tavola.jpeg',
    'cominz': 'cominz/sorgenti/tavola.jpeg',
    'astrea': 'astrea/sorgenti/tavola.jpeg',
    'porte': 'porte/sorgenti/tavola.jpeg',
    'karma': 'karma/sorgenti/tavola.jpeg',
    'matteo/skin-israele': 'matteo/skin-israele/sorgenti/IMG_5489.jpeg',
    'luis/skin-mariachi': 'luis/skin-mariachi/sorgenti/IMG_5500.jpeg',
    'vlad/skin-pump': 'vlad/skin-pump/sorgenti/tavola.jpeg',
}
WHITE_BG = {'beppe'}


def white_key(path):
    """Scontorno di una tavola su sfondo bianco: e' sfondo solo il bianco collegato ai bordi
    (flood fill), cosi' i bianchi del disegno (G, scritta, cartellino) restano."""
    from scipy import ndimage as nd
    a = np.asarray(Image.open(path).convert('RGB')).astype(np.float32)
    light = a.min(-1) > 215
    lab, _ = nd.label(light)
    edge = np.unique(np.concatenate([lab[0], lab[-1], lab[:, 0], lab[:, -1]]))
    bg = np.isin(lab, edge[edge > 0])
    bg = nd.binary_dilation(bg, iterations=1) & (a.min(-1) > 185)   # alone chiaro del JPEG
    al = np.where(bg, 0, 255).astype(np.float32)
    return np.concatenate([a, al[..., None]], -1)




def find_board(k):
    """tavola di un personaggio o skin nuovo: <chiave>/sorgenti/tavola.<estensione> (non serve registrarla)"""
    found = sorted(glob.glob(CH + k + '/sorgenti/tavola.*'))
    return found[0][len(CH):] if found else None


keys = sys.argv[1:] or list(BOARDS)
for k in keys:
    if k not in BOARDS:
        BOARDS[k] = find_board(k)
        if not BOARDS[k]:
            sys.exit('%s: manca la tavola (%s%s/sorgenti/tavola.jpeg)' % (k, CH, k))
for dest in keys:
    board, name = BOARDS[dest], dest.split('/')[0]
    o = white_key(CH + board) if name in WHITE_BG else key(CH + board)
    H = o.shape[0]
    figs = sorted([f for f in figures(o) if f['y1'] - f['y0'] > 0.4 * H], key=lambda f: f['x0'])
    if len(figs) != 3:
        sys.exit('%s: attese 3 viste nella tavola, trovate %d' % (name, len(figs)))
    front = figs[1]
    idle = np.asarray(Image.open(CH + '%s/%s-idle.png' % (dest, name)))
    ys = np.where(idle[..., 3].max(1) > 128)[0]
    target = ys.max() - ys.min() + 1                  # altezza della guardia nello sprite
    k = target / float(front['y1'] - front['y0'] + 1)
    out = CH + '%s/%s-front.png' % (dest, name)
    write_sheet(out, [frame_from_mask(o, front['mask'], k)])
    extra = ''
    if name in WHITE_BG:            # sfondo bianco: toglie l'alone chiaro sul contorno
        from defringe import defringe, harden
        extra = ', alone tolto: %d px + bordo grigio %d px' % (defringe(out), harden(out))
    print('%s/%s-front.png: scala %.3f, alta %d px%s' % (dest, name, k, target, extra))
