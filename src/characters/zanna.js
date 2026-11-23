/* ZANNA - personaggio n. 4 (l'ordine dei file in index.html e' quello dell'elenco: non cambiarlo,
   la partita online identifica i personaggi per posizione) */
/* ZANNA: pose da tools/build_character.py, speciale da tools/build_special.py; ml = speciale corpo a corpo con portata ml */
character({
  n:'ZANNA',ms:'TAGLIERINO FURIOSO',sp:1.5,pw:1,
  sprites:{d:'zanna',n:{idle:1,walk:2,punch:5,kick:5,heavy:5,jump:3,block:1,crouch:1,special:3,hit:1,fall:2,ko:1,win:2}},
  special:corpoACorpo({portata:46, tempi:[5,11]})
})
