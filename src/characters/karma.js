/* KARMA - personaggio n. 14 (l'ordine dei file in index.html e' quello dell'elenco: non cambiarlo,
   la partita online identifica i personaggi per posizione) */
/* KARMA: pose da tools/build_character.py, speciale e registratore di cassa da tools/build_throw_special.py
   (--scala 0.9 --sc .9 --largo 160: nel foglio della speciale Gemini l'ha disegnata piu' grande): la cassa parte dalle mani tese e vola ruotando. Bassa (sc) */
character({
  n:'KARMA',ms:'LANCIO DELLA CASSA',sp:1.55,pw:1.05,
  sprites:{d:'karma',sc:.9,n:{idle:1,walk:2,punch:5,kick:5,heavy:5,jump:3,block:1,crouch:1,special:3,hit:1,fall:2,ko:1,win:2},pj:'karma-cassa',pjn:3,pjh:25.4,pjy:-12.7,pjw:36,pjo:[40,-68],spT:[5,11]}
})
