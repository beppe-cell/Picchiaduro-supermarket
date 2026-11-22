/* LUIS - personaggio n. 3 (l'ordine dei file in index.html e' quello dell'elenco: non cambiarlo,
   la partita online identifica i personaggi per posizione) */
/* LUIS: pose da tools/build_character.py (fogli pose), speciale e onda da tools/build_luis_special.py */
character({
  n:'LUIS',ms:'ASSOLO DISTRUTTIVO',sp:1.4,pw:1.1,
  sprites:{d:'luis',sc:1.05,n:{idle:1,walk:2,punch:5,kick:5,heavy:5,jump:3,block:1,crouch:1,special:3,hit:1,fall:2,ko:1,win:2},pj:'luis-wave',pjn:3,pjs:.6,pjo:[26.4,-63.4],pjg:1,spT:[5,11]},
  skins:[{id:'mariachi',n:'LUIS EL MARIACHI',p:1500,ov:{pjo:[28,-92]}}]
})
