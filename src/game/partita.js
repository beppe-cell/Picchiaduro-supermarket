/* game/partita.js - La partita: stato globale (G, PJ, PS...), round, comandi del giocatore, step() di un fotogramma, fine incontro. */
let RB=0/* 1 mentre il rollback ricalcola fotogrammi gia' mostrati: niente suoni, scintille, vibrazione */,G=null,T=0,mode='arc',tour=0,pickI=0,keys={},TR={},PS=[],PJ=[],last=0,acc=0,ZP=1,XMIN=18,XMAX=334,demo=[{L:CH[0],x:88,face:1,st:'idle',t:0,ext:0,y:0},{L:CH[7],x:264,face:-1,st:'idle',t:0,ext:0,y:0}];
arenaFit(208);
function spark(x,y,col){if(RB)return;for(let i=0;i<9;i++)PS.push({x,y,vx:(Math.random()-.5)*4,vy:-Math.random()*3,l:14,col})}
/* parata: scintille rosse piu' numerose e veloci, a ventaglio verso chi attacca (dir) */
function sparkBlk(x,y,dir){if(RB)return;for(let i=0;i<16;i++)PS.push({x,y:y+(Math.random()-.5)*14,vx:dir*(1+Math.random()*4),vy:-Math.random()*3.5,l:12+(Math.random()*8|0),col:i%3?'#ff2a1f':'#ffb3a1',s:4})}
function newRound(){const a=G.a,b=G.b;CAMX=176;a.cmb=b.cmb=0;a.x=176-88/gz();b.x=176+88/gz();for(const f of[a,b]){f.y=0;f.vx=f.vy=0;f.hp=100;f.tr=100;f.sp=0;f.st='idle';f.atk=null;f.stun=0;f.rep.n=0}a.face=1;b.face=-1;G.ph='intro';G.pt=100;G.tm=3600;PJ=[]}
function startMatch(pi,oi,lv){const sa=skinSet(CH[pi].n,eqSkin(CH[pi].n)),sb=SPRSET[CH[oi].n];if(!ready(sa)||!ready(sb)||!ARENAS.some(A=>A.im.naturalWidth)){sh('s-load');ldShow();clearTimeout(startMatch.w);startMatch.w=setTimeout(()=>startMatch(pi,oi,lv),150);return}
pickArena();G={a:mk(CH[pi],88,1),b:mk(CH[oi],264,-1,1,lv),rd:1,pi,oi,lv,hs:0,sh:0,pz:0,er:{round:0,perfect:0}};G.a.ss=sa;G.b.ss=sb;G.me=G.a;G.a.loc=1;newRound();sh('');pl=true;sfx('ui')}
/* memoria comandi: un colpo premuto resta valido per 10 fotogrammi (~1/6 s), cosi' se lo premi mentre
   finisce l'attacco precedente parte appena possibile invece di andare perso */
function pin(){const i={};for(const k of'lrudbpkhs')i[k]=!!(keys[k]||tk[k]||(TR[k]&&T-TR[k]<=10));return i}
const tk={};
function endRound(w,txt){if(G.ph!='play')return;G.ph='ko';G.pt=150;G.w=w;G.txt=txt;w.wins++;if(txt=='K.O.')G.slow=60;if(w==G.me){G.er.round++;if(w.hp>=100)G.er.perfect++}const l=w==G.a?G.b:G.a;l.st='ko';l.atk=null;l.t=0;sfx('ko')}
function step(){T++;if(!G||G.pz||G.ph=='end')return;G.fr=(G.fr||0)+1;/* orologio della partita */if(G.ph=='fin')return;/* online: fine incontro in attesa di conferma */if(G.hs>0){G.hs--;return}
if(G.slow>0){G.slow--;if(G.slow%3){for(const p of PS){p.x+=p.vx/3;p.y+=p.vy/3}return}}/* rallentatore KO */
const a=G.a,b=G.b;let ia={},ib={};
if(G.ph=='intro'&&--G.pt<=0)G.ph='play';
if(G.ph=='play'){if(G.net){ia=G.net.ia;ib=G.net.ib}else{ia=pin();ib=AI(b,a)}if(--G.tm<=0)endRound(a.hp>=b.hp?a:b,'TEMPO!')}
upd(a,b,ia);upd(b,a,ib);
/* collisione dei corpi: a terra i lottatori non si sovrappongono mai (distanza minima BODY tra i
   centri). Si separano del tutto nello stesso tick, meta' a testa, senza uscire dal campo; chi salta
   abbastanza in alto puo' passare sopra l'altro */
{const BODY=34,d=b.x-a.x;if(Math.abs(d)<BODY&&a.y>-28&&b.y>-28){const s=d!==0?Math.sign(d):(a.face>0?1:-1),need=(BODY-Math.abs(d))/2;
a.x-=s*need;b.x+=s*need;
if(a.x<XMIN){b.x+=XMIN-a.x;a.x=XMIN}if(a.x>XMAX){b.x-=a.x-XMAX;a.x=XMAX}if(b.x<XMIN){a.x+=XMIN-b.x;b.x=XMIN}if(b.x>XMAX){a.x-=b.x-XMAX;b.x=XMAX}}}
/* telecamera: segue il punto medio dei lottatori, un passo per tick (indipendente dal disegno) */
{const t=Math.max(ARL+CAMHW,Math.min(ARR-CAMHW,(a.x+b.x)/2));CAMX+=(t-CAMX)*.12}
/* i due lottatori restano sempre insieme nell'inquadratura: distanza massima = larghezza visibile meno un margine */
{const ms=352/gz()-50,d=a.x-b.x;if(Math.abs(d)>ms){const e=(Math.abs(d)-ms)/2*Math.sign(d);a.x-=e;b.x+=e}}
for(let i=PJ.length-1;i>=0;i--){const p=PJ[i],o=p.o==a?b:a;p.x+=p.vx;p.t++;
const av=(o.x-p.x)*Math.sign(p.vx),hw=((SPRSET[p.o.L.n]||{}).pjw||0)/2;/* hw: un proiettile largo (bancale) colpisce con tutta la sua larghezza */
if(av<12&&av>-12-hw&&Math.abs(o.y-(p.fy||0))<45&&G.ph=='play'){/* da terra: come prima (avversario non troppo in alto); in salto: colpisce chi e' alla stessa altezza */dmg(p.o,o,18*p.o.L.pw,{st:24,kb:6});PJ.splice(i,1)}else if(p.x<ARL-20||p.x>ARR+20)PJ.splice(i,1)}
for(let i=PS.length-1;i>=0;i--){const p=PS[i];p.x+=p.vx;p.y+=p.vy;p.vy+=.2;if(--p.l<=0)PS.splice(i,1)}
for(const f of[a,b])f.tr+=(f.hp-f.tr)*.06;
if(G.ph=='ko'&&--G.pt<=0){const w=G.w;if(w.wins>=2){if(G.net)G.ph='fin';else endMatch(w==G.me)}else{G.rd++;newRound()}}
if(G.sh>0)G.sh--}
function endMatch(win){G.ph='end';const t=$('#e-t'),s=$('#e-s'),bn=$('#b-nx');
t.className=win?'win':'lose';
if(win){if(mode=='tor'&&tour>=TOR.length-1){t.textContent='CAMPIONE DI SUPERRISSA!';s.textContent='Hai battuto tutti, anche il boss.';bn.style.display='none'}
else{t.textContent='VITTORIA!';s.textContent=mode=='tor'?'Prossimo avversario: '+CH[TOR[tour+1]].n+(MINI.includes(CH[TOR[tour+1]].n)?' (MINI BOSS)':TOR[tour+1]==TOR[TOR.length-1]?' (BOSS)':'')+' · incontro '+(tour+2)+'/'+TOR.length:'';bn.style.display='';bn.textContent='PROSSIMO';bn.onclick=()=>{if(mode=='tor')tour++;nextFight()}}}
else{t.textContent='SCONFITTA';s.textContent='';bn.style.display='';bn.textContent='RIVINCITA';bn.onclick=()=>nextFight(1)}
/* cedolini guadagnati (tabella REW) */
const mul=1+((G.lv||2)-2)*REW.lvk,parts=[[win?'VITTORIA':'PARTECIPAZIONE',win?REW.win:REW.lose],['ROUND VINTI',G.er.round*REW.round],['PERFETTO',G.er.perfect*REW.perfect]];
if(win&&mode=='tor'&&tour>=TOR.length-1)parts.push(['TORNEO',REW.tour]);
let ul='';
if(G.net)netEnd(win);
const tot=Math.round(parts.reduce((a,q)=>a+q[1],0)*mul);SAVE.ced+=tot;save();G.earn=tot;
$('#e-c').innerHTML='+'+tot+' CEDOLINI<div class="small">'+parts.filter(q=>q[1]).map(q=>q[0]+' '+q[1]).join(' · ')+(mul!=1?' · DIFFICOLTÀ x'+mul.toFixed(2):'')+'</div>'+ul;
sh('s-end');pl=false}
function nextFight(again){if(mode=='tor'){startMatch(pickI,TOR[tour],TLV[tour])}else{let o=again?G.oi:Math.random()*CH.length|0;while(o==pickI)o=Math.random()*CH.length|0;startMatch(pickI,o,again?G.lv:2+(Math.random()*3|0))}}
