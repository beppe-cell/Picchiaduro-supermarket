/* MATTEO - personaggio n. 5 (l'ordine dei file in index.html e' quello dell'elenco: non cambiarlo,
   la partita online identifica i personaggi per posizione) */
character({
  n:'MATTEO',ms:'CARRELLO VOLANTE',sp:1.5,pw:1.05,
  sprites:{d:'matteo',n:{idle:1,walk:2,punch:5,kick:5,heavy:5,jump:3,block:1,crouch:1,special:3,hit:1,fall:3,ko:1,win:3}},
  special:lancio({oggetto:'matteo-cart', fotogrammi:3, fisso:0, aTerra:1, alto:71.3, y:-40.8, tempi:[5,11]}),
  skins:[{id:'israele',n:'MATTEO SHALOM',p:1500,nf:{fall:2,win:2}}]
})
