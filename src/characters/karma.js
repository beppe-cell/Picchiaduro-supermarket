/* KARMA - personaggio n. 14 (l'ordine dei file in index.html e' quello dell'elenco: non cambiarlo,
   la partita online identifica i personaggi per posizione) */
/* KARMA: pose da tools/build_character.py, speciale e registratore di cassa da tools/build_throw_special.py
   (--scala 0.9 --sc .9 --largo 160: nel foglio della speciale Gemini l'ha disegnata piu' grande): la cassa parte dalle mani tese e vola ruotando. Bassa (sc) */
character({
  n:'KARMA',ms:'LANCIO DELLA CASSA',sp:1.55,pw:1.05,
  sprites:{d:'karma',sc:.9,n:{idle:1,walk:2,punch:5,kick:5,heavy:5,jump:3,block:1,crouch:1,special:3,hit:1,fall:2,ko:1,win:2}},
  special:lancio({oggetto:'karma-cassa', fotogrammi:3, alto:25.4, y:-12.7, largo:36, uscita:[40,-68], tempi:[5,11]})
})
