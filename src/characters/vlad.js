/* VLAD - personaggio n. 2 (l'ordine dei file in index.html e' quello dell'elenco: non cambiarlo,
   la partita online identifica i personaggi per posizione) */
character({
  n:'VLAD',ms:'SPRUZZINO ACCECANTE',sp:1.65,pw:.95,
  sprites:{d:'vlad',sc:1.05,n:{idle:1,walk:2,punch:5,kick:5,heavy:5,jump:3,block:1,crouch:1,special:3,hit:1,fall:2,ko:1,win:2}},
  special:lancio({oggetto:'vlad-spray', fotogrammi:3, scala:.6, uscita:[33.8,-83.5], avvio:1, tempi:[5,11]}),
  skins:[{id:'pump',n:'VLAD IN PUMP',ms:'LANCIO DEL MANUBRIO',p:1500,special:lancio({fotogrammi:3, scala:0, avvio:0, alto:35, y:-17.5, uscita:[52,-78]})}]
})
