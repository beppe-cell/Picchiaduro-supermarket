/* ---------- gioco ---------- */
const MV={p:{su:5,ac:9,re:5,d:5,r:34,st:11,kb:2},k:{su:5,ac:9,re:5,d:7,r:41,st:13,kb:3},h:{su:12,ac:9,re:18,d:13,r:39,st:22,kb:7},s:{su:11,ac:6,re:16}};
let RB=0/* 1 mentre il rollback ricalcola fotogrammi gia' mostrati: niente suoni, scintille, vibrazione */,G=null,T=0,mode='arc',tour=0,pickI=0,keys={},TR={},PS=[],PJ=[],last=0,acc=0,ZP=1,XMIN=18,XMAX=334,demo=[{L:CH[0],x:88,face:1,st:'idle',t:0,ext:0,y:0},{L:CH[7],x:264,face:-1,st:'idle',t:0,ext:0,y:0}];
arenaFit(208);
function mk(L,x,face,ai,lv){return{L,x,y:0,vx:0,vy:0,face,hp:100,tr:100,sp:0,st:'idle',t:0,atk:null,did:0,stun:0,blk:0,cr:0,rep:{m:'',n:0,t:-999},ai,lv,ob:0,hd:{},wins:0,ext:0}}
function sh(id){if(id=='s-menu'||id=='s-shop'||id=='s-prof')wal();document.querySelectorAll('.scr').forEach(e=>e.classList.toggle('on',e.id==id));$('#tc').classList.toggle('on',id==''&&touchOn());if(id)touchReset();if(id&&id!='s-title')focusFirst()}
const touchOn=()=>O.touch==2?false:O.touch==1||matchMedia('(pointer:coarse)').matches;
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
/* danno dei colpi ripetuti: x0.55 a ogni ripetizione, minimo 0.25 (tabella: identica su ogni browser) */
const REPK=[1,.55,.3025,.25];
function hitchk(a,d,m){const dx=(d.x-a.x)*a.face,dy=Math.abs(a.y-d.y);if(dx<-6||dx>m.r+8||dy>28)return;if(a.atk=='p'&&d.cr&&d.y>=0)return;a.did=1;dmg(a,d,m.d*a.L.pw,m)}
function dmg(a,d,base,m){if(G.ph!='play')return;const r=a.rep;if(r.m==a.atk&&G.fr-r.t<110)r.n++;else r.n=0;r.m=a.atk;r.t=G.fr;
let v=base*REPK[Math.min(r.n,REPK.length-1)];if(d.stun>0)v*=.7;
const bl=d.blk&&(a.x-d.x)*d.face>0&&d.st!='hit';
if(bl){v*=.1;d.vx=a.face*2;sfx('blk');sparkBlk(d.x+d.face*12,-64,-d.face)}
else{a.cmb=T-(a.cmbT||-999)<80?(a.cmb||0)+1:1;a.cmbT=T;d.hT=T;d.stun=m.st;d.st='hit';d.t=0;d.atk=null;d.vx=a.face*m.kb;if(d.y>=0&&m.kb>5)d.vy=-3;sfx('hit');spark(d.x-a.face*4,-36,'#ffd23f');if(O.vib&&navigator.vibrate&&!RB)navigator.vibrate(m.kb>5?40:15)}
d.hp-=v;a.sp=Math.min(100,a.sp+v*1.4);d.sp=Math.min(100,d.sp+v*.8);G.hs=bl?2:m.kb>5?7:4;G.sh=bl?0:m.kb>5?10:5;
if(d.hp<=0){d.hp=0;d.vx=a.face*3;d.vy=-4;endRound(a,'K.O.')}}
function endRound(w,txt){if(G.ph!='play')return;G.ph='ko';G.pt=150;G.w=w;G.txt=txt;w.wins++;if(txt=='K.O.')G.slow=60;if(w==G.me){G.er.round++;if(w.hp>=100)G.er.perfect++}const l=w==G.a?G.b:G.a;l.st='ko';l.atk=null;l.t=0;sfx('ko')}
function upd(f,o,i){f.t++;
if(f.st=='ko'){f.vx*=.92;f.x+=f.vx;f.vy+=.5;f.y=Math.min(0,f.y+f.vy);if(f.y>=0)f.vy=0;return}
const gr=f.y>=0&&f.vy>=0;
if(f.stun>0){f.stun--;f.vx*=.85;f.st=f.stun>0?'hit':'idle'}
else if(f.st=='atk'){const m=f.atk=='s'&&(f.ss||SPRSET[f.L.n]||{}).mv||MV[f.atk],t=f.t;/* mv: speciale con tempi propri (FABIO) */f.ext=t<m.su?t/m.su:t<m.su+m.ac?1:Math.max(0,1-(t-m.su-m.ac)/m.re);f.vx*=.8;
if(f.atk=='s'&&(SPRSET[f.L.n]||{}).ml){/* speciale corpo a corpo (es. taglierino di ZANNA): nessun proiettile, colpo nella fase attiva */
 const sm=SPRSET[f.L.n];if(sm.dash&&t>=4&&t<m.su+m.ac)f.vx=f.face*sm.dash;if(sm.hop&&t==4&&f.y>=0)f.vy=-sm.hop;/* volo in picchiata (ANGEL) */
 if(t==m.su)sfx('sp');if(t>=m.su&&t<m.su+m.ac&&!f.did)hitchk(f,o,{r:SPRSET[f.L.n].ml,d:18,st:24,kb:6})}
else if(f.atk=='s'){if(t==m.su){const ps0=(G.net&&G.net.rk?SPRSET[f.L.n]:f.ss)||SPRSET[f.L.n]||{},/* RANKED: le skin non cambiano il punto di lancio */po=ps0.pjo,bs=(f.L.big?1.12:1)*(ps0.sc||1);PJ.push({x:f.x+f.face*(po?po[0]*bs:22)-f.face*3.6,y:(po?po[1]*bs:-30)+(ps0.pjt?0:f.y),fy:ps0.pjt?0:f.y,vx:f.face*3.6,o:f,a:f.atk,t:-1});if(ps0.shk)G.sh=ps0.shk;/* nasce fermo sul punto di uscita (BEPPE: davanti alle mani, all'altezza delle spalle) e vola dritto */sfx('sp')}}
else if(t>=m.su&&t<m.su+m.ac&&!f.did)hitchk(f,o,m);
if(t>=m.su+m.ac+m.re){f.st='idle';f.atk=null;f.ext=0}}
else{f.ext=0;f.blk=gr&&i.b;f.cr=gr&&i.d&&!i.b;if(gr)f.face=o.x>f.x?1:-1;
if(f.blk||f.cr)f.vx=0;else{const sp=f.L.sp;f.vx=i.l?-sp:i.r?sp:gr?0:f.vx;if(gr&&i.u){f.vy=-8.4;sfx('jp')}}
const k=i.s&&f.sp>=100?'s':i.h?'h':i.k?'k':i.p?'p':null;
if(k&&!f.blk){if(f.loc&&!RB)delete TR[k];f.st='atk';f.atk=k;f.t=0;f.did=0;f.cr=0;if(k=='s')f.sp=0;else sfx('whf')}
else f.st=!gr?'jump':f.blk?'block':f.cr?'crouch':f.vx?'walk':'idle'}
f.vy+=.45;f.y+=f.vy;if(f.y>=0){f.y=0;f.vy=0}f.x=Math.max(XMIN,Math.min(XMAX,f.x+f.vx))}
function AI(f,o){if(f.ob>0){f.ob--;return{...f.hd}}const mlS=!!(SPRSET[f.L.n]||{}).ml;
const lv=f.lv,dx=o.x-f.x,ad=Math.abs(dx),tw=dx>0?'r':'l',aw=dx>0?'l':'r',rn=Math.random(),hd={},dz=ZP;
f.ob=Math.max(4,20-lv*3)+(Math.random()*8|0);
const thr=o.st=='atk'&&ad<66/dz,rec=o.st=='atk'&&o.t>MV[o.atk].su+MV[o.atk].ac;
if(thr&&!rec&&rn<.22+.13*lv+(o.rep.n>1?.15:0)){hd.b=1;f.ob=12+(Math.random()*10|0)}
else if(rec&&ad<48/dz&&rn<.35+.12*lv){hd[rn<.5?'p':'k']=1}
else if(ad>120/dz){hd[tw]=1;if(f.sp>=100&&rn<.5&&!mlS)hd.s=1}
else if(ad>54/dz){if(rn<.55)hd[tw]=1;else if(rn<.65&&f.sp>=100&&!mlS)hd.s=1;else if(rn<.72)hd.u=1}
else{if(mlS&&f.sp>=100&&rn<.3)hd.s=1;/* speciale corpo a corpo: solo da vicino */else if(rn<.38)hd.p=1;else if(rn<.6)hd.k=1;else if(rn<.7)hd.h=1;else if(rn<.84)hd[aw]=1;else hd.b=1}
f.hd={l:hd.l,r:hd.r,d:hd.d,b:hd.b};return hd}
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
