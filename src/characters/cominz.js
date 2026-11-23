/* COMINZ - personaggio n. 11 (l'ordine dei file in index.html e' quello dell'elenco: non cambiarlo,
   la partita online identifica i personaggi per posizione) */
/* COMINZ: pose da tools/build_character.py, speciale da tools/build_special.py --pose 4 --griglia: estrae falce
   e martello, carica, colpo in avanti con tutti e due (colpisce dal 3o fotogramma), chiusura; corpo a corpo, portata ml */
character({
  n:'COMINZ',ms:'FALCE E MARTELLO',sp:1.7,pw:.95,
  sprites:{d:'cominz',n:{idle:1,walk:2,punch:5,kick:5,heavy:5,jump:3,block:1,crouch:1,special:4,hit:1,fall:2,ko:1,win:2}},
  special:corpoACorpo({portata:62, tempi:[5,10,17]})
})
