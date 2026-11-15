"""Vista frontale di ogni personaggio per la schermata di selezione: <nome>-front.png.
Prende dalla tavola di riferimento (sfondo magenta, tre viste: lato, fronte, retro) la figura centrale
e la porta all'altezza dello sprite da fermo del personaggio, cosi' i rapporti di altezza tra i
personaggi restano quelli del gioco. Chi non ha la tavola (Beppe) in selezione usa la guardia.
Uso: python3 -B tools/build_fronts.py"""
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
    'zani': 'zani/sorgenti/IMG_5456.jpeg',
    'angel': 'angel/sorgenti/IMG_5469.jpeg',
    'falsa': 'falsa/sorgenti/tavola.png',
    'beppe': 'beppe/sorgenti/tavola.JPG',      # sfondo BIANCO (vedi white_key)
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


for name, board in BOARDS.items():
    o = white_key(CH + board) if name in WHITE_BG else key(CH + board)
    H = o.shape[0]
    figs = sorted([f for f in figures(o) if f['y1'] - f['y0'] > 0.4 * H], key=lambda f: f['x0'])
    if len(figs) != 3:
        sys.exit('%s: attese 3 viste nella tavola, trovate %d' % (name, len(figs)))
    front = figs[1]
    idle = np.asarray(Image.open(CH + '%s/%s-idle.png' % (name, name)))
    ys = np.where(idle[..., 3].max(1) > 128)[0]
    target = ys.max() - ys.min() + 1                  # altezza della guardia nello sprite
    k = target / float(front['y1'] - front['y0'] + 1)
    write_sheet(CH + '%s/%s-front.png' % (name, name), [frame_from_mask(o, front['mask'], k)])
    print('%s-front.png: scala %.3f, alta %d px' % (name, k, target))
