"""Genera i fogli sprite di MATTEO da assets/characters/matteo/sorgenti/IMG_54xx.JPG (sfondo magenta).
Uso: python3 tools/build_matteo_sprites.py"""
import os, sys
import numpy as np
sys.path.insert(0, os.path.dirname(__file__))
from spritebuild import Builder, SPRITE_H

K = SPRITE_H / 797     # altezza in piedi nelle tavole: 797px
K_KO = 470 / 1138      # tavola KO disegnata piu grande: lunghezza disteso ~470px
# tavole disegnate piu piccole (misurato sulla larghezza dell'afro: ~150px nelle tavole standard)
K_SPECIAL = K * 150 / 115
K_JUMP = K * 1.10


def prep(img, o):
    if img == 5413:  # rimuove le linee divisorie verticali (a tutta altezza) del foglio carrello
        col = (o[..., 3] > 40).sum(0) > 0.9 * o.shape[0]
        o[:, np.convolve(col, np.ones(9), 'same') > 0, 3] = 0
    return o


b = Builder('matteo', 'assets/characters/matteo/sorgenti/', 'assets/characters/matteo/', K, prep)
fig, sheet = b.fig, b.sheet

# solo pose nitide (niente frame interpolati, che davano l'effetto "mosso");
# negli attacchi la posa di colpo compare gia' dal 2o frame per una risposta immediata
idle0, walk2 = fig(5408, 0), fig(5408, 2)
sheet('idle', [idle0])                                        # respiro fatto in gioco (leggero bob)
sheet('walk', [idle0, walk2])
p = [fig(5409, i) for i in range(3)]
sheet('punch', [p[0], p[1], p[1], p[1], p[2]])
k = [fig(5410, i) for i in range(3)]
sheet('kick', [k[0], k[1], k[1], k[1], k[2]])
h = [fig(5411, i) for i in range(3)]
sheet('heavy', [h[0], h[1], h[2], h[2], idle0])
sheet('special', [fig(5412, i, K_SPECIAL) for i in range(3)])  # spinge carrello, lo solleva, lancia
j = [fig(5414, i, K_JUMP) for i in range(4)]
# la posa di stacco (j[1]) ha il braccio tagliato nella tavola: stacco/atterraggio in guardia, raccolto all'apice
sheet('jump', [j[3], j[2], j[3]])
sheet('block', [fig(5415, 0)])
sheet('crouch', [fig(5415, 3)])
f = [fig(5416, i) for i in range(3)]
sheet('hit', [f[0]])
sheet('fall', f)
sheet('ko', [fig(5417, 0, K_KO)])
sheet('win', [fig(5418, i) for i in range(3)])
# proiettile: carrello che rotola (3 pose)
sheet('cart', [fig(5413, i, K * .62) for i in range(3)], top=1, bot=1)
