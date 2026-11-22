/* ---------- RANKED (online competitivo) ----------
   Punti Elo per profilo (SAVE.rk: e punti, w/l set vinti/persi, top divisione piu' alta raggiunta, ch set
   per personaggio, nk/pk chiave Nostr del profilo (segreta/pubblica, esadecimale), pend set in corso). Un set = al meglio di 3 incontri contro
   un avversario della coda RANKED, solo con i dipendenti normali (niente mini boss e boss: uguali per
   tutti, anche per chi non li ha sbloccati). Chi abbandona perde: pend si salva all'inizio del set e, se la
   pagina si chiude prima della fine, alla riapertura conta come sconfitta.
   CLASSIFICA GLOBALE senza server nostro: ogni giocatore pubblica la sua riga come evento Nostr firmato
   (kind 30078, tag d=RKTAG, contenuto {n nome, e punti, w, l, c personaggio piu' usato}) sui relay pubblici
   RKR, che la conservano (un evento per giocatore: il nuovo sostituisce il vecchio). Aprendo CLASSIFICA si
   leggono le righe di tutti da quei relay; a fine set la propria riga si ripubblica. Le righe passano anche
   da un giocatore all'altro durante gli incontri. Ognuno tiene una copia (RKB) per quando la rete manca.
   La firma impedisce di cambiare la riga di un altro, non di barare sulla propria. Firma e verifica:
   assets/vendor/nostr-pure.mjs (nostr-tools), caricato solo quando serve. */
const RKD=[{n:'BRONZO',m:0,c:'#e09a5e',p:0},{n:'ARGENTO',m:1100,c:'#d4dceb',p:300},{n:'ORO',m:1250,c:'#ffd23f',p:600},{n:'PLATINO',m:1400,c:'#7fe8d6',p:1000},{n:'CAMPIONE',m:1550,c:'#ff6a6a',p:2000}];
const RKSET=100;/* cedolini per un set vinto (oltre a quelli dei singoli incontri); RKD.p: premio la prima volta in una divisione */
const rkDiv=e=>{let d=0;RKD.forEach((x,i)=>{if(e>=x.m)d=i});return d};
const rkList=()=>CH.map((L,i)=>i).filter(i=>!BOSSES.includes(CH[i].n));
/* in RANKED tutti hanno la stessa velocita' e potenza (anche la speciale): vince chi gioca meglio */
const RKS={sp:1.5,pw:1},rkL=L=>Object.assign(Object.create(L),RKS);
/** risultato di un set: Elo (K 40 nei primi 10 set, poi 24), conteggi, premi delle divisioni nuove */
function rkApply(r,win,oe,cn){const old=r.e,K=r.w+r.l<10?40:24,E=1/(1+Math.pow(10,(oe-old)/400));
r.e=Math.max(0,Math.round(old+K*((win?1:0)-E)));if(win)r.w++;else r.l++;r.pend=null;if(cn)r.ch[cn]=(r.ch[cn]||0)+1;
const d=rkDiv(r.e),up=[];let bonus=0;for(let i=r.top+1;i<=d;i++){bonus+=RKD[i].p;up.push(RKD[i].n)}if(d>r.top)r.top=d;return{old,e:r.e,bonus,up,win}}
/* set lasciati a meta' (pagina chiusa): sconfitta */
for(const q of Object.values(PF.list))if(q.rk.pend){const x=rkApply(q.rk,false,q.rk.pend.e,null);q.ced+=x.bonus}save();
const rkFav=r=>(Object.entries(r.ch).sort((a,b)=>b[1]-a[1])[0]||[''])[0];
const rkId=()=>SAVE.rk.pk||'';
const RKTAG='superrissa-rank',RKR=window.RKRELAYS/* solo per i test */||['wss://relay.damus.io','wss://nos.lol','wss://relay.primal.net','wss://relay.nostr.band','wss://nostr.mom','wss://relay.snort.social'];
let NOSTR=null;/** firma e verifica Nostr: si scarica solo quando serve */
async function nostrLib(){if(!NOSTR)NOSTR=await import(new URL('assets/vendor/nostr-pure.mjs?v='+VER,document.baseURI).href)/* percorso dalla pagina, non da questo file */;return NOSTR}
const hex=u=>Array.from(u,b=>b.toString(16).padStart(2,'0')).join(''),unhex=h=>Uint8Array.from(h.match(/../g),x=>parseInt(x,16));
/** riga della classifica da un evento Nostr (null se non e' una riga valida; la firma si controlla a parte) */
function rkFromEv(v){try{if(!v||v.kind!==30078||typeof v.pubkey!='string'||!/^[0-9a-f]{64}$/.test(v.pubkey)||!Number.isInteger(v.created_at)||typeof v.content!='string'||v.content.length>400
||!Array.isArray(v.tags)||!v.tags.some(t=>Array.isArray(t)&&t[0]=='d'&&t[1]==RKTAG))return null;const c=JSON.parse(v.content),x={k:v.pubkey,n:c.n,e:c.e,w:c.w,l:c.l,c:c.c||'',t:v.created_at*1000,ev:v};
return typeof x.n=='string'&&/^[A-Z0-9ÀÈÉÌÒÙ ]{1,12}$/.test(x.n)&&[x.e,x.w,x.l].every(q=>Number.isInteger(q)&&q>=0)&&x.e<=4000&&x.w+x.l<2e5&&(x.c===''||CH.some(L=>L.n==x.c))&&x.t<Date.now()+864e5?x:null}catch(e){return null}}
/** la mia riga firmata (aggiunta alla copia locale); null se non ho ancora giocato set o la libreria non si carica.
    Se i dati non sono cambiati si riusa l'evento gia' firmato */
async function rkMine(){const r=SAVE.rk;if(!r.w&&!r.l)return null;try{const N=await nostrLib();if(!r.nk||!r.pk){const sk=N.generateSecretKey();r.nk=hex(sk);r.pk=N.getPublicKey(sk);save()}
const c={n:SAVE.n,e:r.e,w:r.w,l:r.l,c:rkFav(r)},o=RKB[r.pk];if(o&&o.ev&&['n','e','w','l','c'].every(q=>o[q]===c[q]))return o;
const v=N.finalizeEvent({kind:30078,created_at:Math.max(Math.floor(Date.now()/1000),o?o.t/1000+1:0),tags:[['d',RKTAG],['t',RKTAG]],content:JSON.stringify(c)},unhex(r.nk)),x=rkFromEv(v);if(x)rkPut(x);return x}catch(e){return null}}
const RKK='superrissa-classifica-2';let RKB={};try{RKB=obj(JSON.parse(localStorage.getItem(RKK)||'{}'))}catch(e){}
function rkPut(x){RKB[x.k]=x;const L=Object.values(RKB);if(L.length>500){L.sort((a,b)=>b.e-a.e||b.t-a.t);RKB={};for(const y of L.slice(0,500))RKB[y.k]=y}
clearTimeout(rkPut.t);rkPut.t=setTimeout(()=>{try{localStorage.setItem(RKK,JSON.stringify(RKB))}catch(e){}},300)}
/** eventi ricevuti (dai relay o da un altro giocatore): si tengono solo righe valide, con firma giusta e piu' recenti della copia */
async function rkMerge(list){let n=0;if(!Array.isArray(list))return 0;let N;try{N=await nostrLib()}catch(e){return 0}
for(const v of list.slice(0,600)){const x=rkFromEv(v);if(!x||(RKB[x.k]&&RKB[x.k].t>=x.t))continue;try{if(N.verifyEvent(v)){rkPut(x);n++}}catch(e){}}return n}
/** relay Nostr della classifica: pub = evento da pubblicare (la mia riga), read = leggere le righe di tutti.
    Ogni relay si chiude dopo la risposta o dopo 7 s; risolve con il numero di relay che hanno risposto */
function rkRelays(pub,read,onNew){return Promise.all(RKR.map(u=>new Promise(res=>{let ws,ok=0,done=0,buf=[];const pm=[],mg=l=>pm.push(rkMerge(l).then(n=>{if(n&&onNew)onNew()}));const sid='rk'+Math.random().toString(36).slice(2,8);
 const end=()=>{if(done)return;done=1;clearTimeout(to);try{ws&&ws.close()}catch(e){}if(buf.length)mg(buf.splice(0));Promise.all(pm).then(()=>res(ok))},to=setTimeout(end,7000);
 try{ws=new WebSocket(u)}catch(e){end();return}
 ws.onopen=()=>{if(pub)ws.send(JSON.stringify(['EVENT',pub]));if(read)ws.send(JSON.stringify(['REQ',sid,{kinds:[30078],'#d':[RKTAG],limit:500}]));else setTimeout(end,3000)};
 ws.onmessage=m=>{let d;try{d=JSON.parse(m.data)}catch(e){return}if(!Array.isArray(d))return;
  if(d[0]=='EVENT'&&d[1]==sid){ok=1;buf.push(d[2]);if(buf.length>=50)mg(buf.splice(0))}
  else if(d[0]=='EOSE'&&d[1]==sid){ok=1;try{ws.send(JSON.stringify(['CLOSE',sid]))}catch(e){}end()}else if(d[0]=='OK')ok=1};
 ws.onerror=end;ws.onclose=end}))).then(a=>a.reduce((x,y)=>x+y,0))}
const rkTop=n=>Object.values(RKB).filter(x=>Date.now()-x.t<90*864e5).sort((a,b)=>b.e-a.e||b.w-a.w||a.t-b.t).slice(0,n);
/** righe da mandare a un altro giocatore: le migliori n piu' la mia */
async function rkShare(n){const m=await rkMine(),t=rkTop(n);if(m&&!t.some(x=>x.k==m.k))t.push(m);return t.map(x=>x.ev).filter(Boolean)}
const rkBadge=r=>{const d=rkDiv(r.e),nx=RKD[d+1];return'<span style="color:'+RKD[d].c+'">'+RKD[d].n+'</span> · '+r.e+' PUNTI · '+r.w+'V '+r.l+'S'+(nx?' · '+nx.n+' A '+nx.m:'')};
/* nome valido: 1-12 tra lettere, numeri e spazi, diverso dagli altri profili; restituisce un errore o '' */
function nameErr(n,skip){if(!/^[A-Z0-9ÀÈÉÌÒÙ ]{1,12}$/.test(n))return'Da 1 a 12 lettere o numeri';if(Object.entries(PF.list).some(([k,p])=>k!=skip&&p.n==n))return'Esiste già un profilo con questo nome';return''}
function newProfile(data){const id='p'+Date.now().toString(36)+(Math.random()*1e6|0).toString(36);PF.list[id]=norm(data);PF.cur=id;SAVE=PF.list[id];save();return id}
function useProfile(id){if(PF.list[id]){PF.cur=id;SAVE=PF.list[id];save()}}
function delProfile(id){delete PF.list[id];if(PF.cur==id){PF.cur=Object.keys(PF.list)[0]||null;SAVE=PF.cur?PF.list[PF.cur]:norm({})}
try{localStorage.setItem(PFK,JSON.stringify(PF))}catch(e){}}
/* codice di salvataggio: SPR1-<controllo>-<dati in base64> (si leggono anche i vecchi GRS1-); il controllo scarta codici copiati male */
const ck=t=>{let h=7;for(const ch of t)h=(h*31+ch.charCodeAt(0))%1679616;return h.toString(36).toUpperCase().padStart(4,'0')};
function exportCode(){const b=btoa(unescape(encodeURIComponent(JSON.stringify({n:SAVE.n,c:SAVE.ced,o:SAVE.own,e:SAVE.eq,g:SAVE.prog,u:SAVE.unl,r:SAVE.rk})))).replace(/=+$/,'');return'SPR1-'+ck(b)+'-'+b}
function importCode(code){const m=String(code).replace(/\s+/g,'').match(/^(?:SPR1|GRS1)-([0-9A-Z]{4})-([A-Za-z0-9+/]+)$/i);if(!m||ck(m[2])!=m[1].toUpperCase())return null;
try{const d=JSON.parse(decodeURIComponent(escape(atob(m[2]))));return norm({n:d.n,ced:d.c,own:d.o,eq:d.e,prog:d.g,unl:d.u,rk:d.r})}catch(e){return null}}
/* personaggi da comprare nel negozio con i cedolini (mini boss e boss, in ordine di grado): prezzo.
   Si gioca con loro solo dopo l'acquisto (SAVE.unl); chi li aveva gia' sbloccati li tiene */
const locked=n=>!!PRZ[n]&&!SAVE.unl[n];
const skinsOf=n=>[{id:'base',n:'ORIGINALE',p:0},...(SKINS[n]||[])];
const owns=(n,id)=>id=='base'||(SAVE.own[n]||[]).includes(id);
/* skin indossata (torna ORIGINALE se quella salvata non esiste piu') */
const eqSkin=n=>{const id=SAVE.eq[n];return id&&owns(n,id)&&skinsOf(n).some(k=>k.id==id)?id:'base'};
/** compra una skin (si indossa dalla selezione, pulsante SKIN); false se gia' posseduta, inesistente o cedolini insufficienti */
function buy(n,id){const k=skinsOf(n).find(k=>k.id==id);if(!k||owns(n,id)||SAVE.ced<k.p)return false;SAVE.ced-=k.p;(SAVE.own[n]=SAVE.own[n]||[]).push(id);save();return true}
function equip(n,id){if(owns(n,id)){SAVE.eq[n]=id;save()}}
/* set di sprite di una skin: copia dell'originale (stesse misure e mosse) con le immagini della cartella
   skin-<id>, caricato alla prima richiesta; ogni file mancante ricade su quello originale */
const SKC={};
function skinSet(n,id){const base=SPRSET[n];if(!base||id=='base')return base;const key=n+'/'+id;if(SKC[key])return SKC[key];
const sk=(SKINS[n]||[]).find(k=>k.id==id)||{},ss=SKC[key]={...base,...(sk.ov||{}),n:{...base.n,...(sk.nf||{})},im:{},left:0,skin:id},P='assets/characters/'+base.d+'/';
const one=(file,set,a)=>{ss.left++;const im=new Image();let fb=0;im.onload=()=>{ss.left--;set&&set(im)};
im.onerror=()=>{if(fb++)ss.left--;else{if(a)ss.n[a]=base.n[a];im.src=P+file+'.webp?v='+VER}};im.src=P+'skin-'+id+'/'+file+'.webp?v='+VER;return im};
ss.front=one(base.d+'-front');for(const a of Object.keys(base.n))one(base.d+'-'+a,im=>{ss.im[a]=im},a);if(base.pj)ss.pi=one(base.pj);return ss}
const wal=()=>{document.querySelectorAll('.wallet').forEach(e=>e.textContent=SAVE.ced+' CEDOLINI');const pc=$('#pchip');if(pc)pc.textContent=SAVE.n};
for(const [k,ss] of Object.entries(SPRSET)){const fase=DEMO.includes(k)?1:2,P='assets/characters/'+ss.d+'/';ss.im={};ss.left=0;
const add=(src,set)=>{ss.left++;return ldImg(P+src+'.webp',fase,ok=>{ss.left--;if(ok&&set)set()})};
/* vista frontale per la selezione (tools/build_fronts.py) */
ss.front=ldImg(P+ss.d+'-front.webp',fase);
for(const a of Object.keys(ss.n)){const im=add(ss.d+'-'+a,()=>{ss.im[a]=im})}
if(ss.pj)ss.pi=add(ss.pj)}
/* arena: fondale orizzontale unico (11:6) per entrambi gli orientamenti, in coordinate di gioco.
   ARH = altezza nel mondo, la macchia di luce sul pavimento (87% dell'immagine) cade sui piedi (FY).
   In verticale la telecamera scorre (CAMX) e mostra i bordi quando i lottatori ci si avvicinano. */
/* le arene: f = file, fy = altezza (frazione dell'immagine) del centro della macchia di luce dove poggiano
   i piedi; luci per i lottatori: mul (multiply, dominante), top (luce dall'alto), fl (riflesso dal pavimento),
   side ([lato -1 sinistra/1 destra/0 entrambi, colore]), dust (colore del pulviscolo), dn/fg (quantita'
   di pulviscolo e fumo), nf (tremolio dei neon) */
const ARENAS=[
{n:'CORSIA CENTRALE',f:'arena-orizzontale',fy:.87,mul:'232,245,240',top:'110,160,148',ta:.22,fl:'110,85,35',fa:.26,side:[-1,'40,120,140'],dust:'220,255,240',dn:1,fg:1,nf:1},
{n:'MAGAZZINO',f:'arena-magazzino',fy:.87,mul:'246,238,220',top:'150,118,55',ta:.24,fl:'120,90,35',fa:.28,side:null,dust:'255,230,180',dn:1.6,fg:1.1,nf:0},
{n:'ZONA CASSE',f:'arena-casse',fy:.86,mul:'246,243,236',top:'150,140,115',ta:.2,fl:'120,95,45',fa:.24,side:null,dust:'255,245,225',dn:.5,fg:.4,nf:1},
{n:'REPARTO ORTOFRUTTA',f:'arena-ortofrutta',fy:.865,mul:'242,246,232',top:'120,150,80',ta:.22,fl:'125,95,40',fa:.26,side:[1,'60,120,90'],dust:'235,255,220',dn:.8,fg:.6,nf:0},
{n:'REPARTO SURGELATI',f:'arena-surgelati',fy:.84,mul:'205,226,238',top:'70,140,165',ta:.3,fl:'50,130,150',fa:.3,side:[0,'50,140,170'],dust:'200,240,255',dn:1.2,fg:1.8,nf:1},
{n:'PARCHEGGIO SUL TETTO',f:'arena-parcheggio',fy:.875,mul:'246,228,226',top:'130,85,125',ta:.22,fl:'135,85,30',fa:.3,side:[-1,'120,60,110'],dust:'255,220,200',dn:.6,fg:.5,nf:0}];
ARENAS.forEach((A,i)=>{A.c={top:'#1a2624',bot:'#3a3a30'};
A.im=ldImg('assets/backgrounds/'+A.f+'.jpeg',i?2:1,ok=>{if(!ok)return;const t=document.createElement('canvas');t.width=A.im.naturalWidth;t.height=A.im.naturalHeight;const g=t.getContext('2d');g.drawImage(A.im,0,0);
const avg=(y,h)=>{const d=g.getImageData(0,y,t.width,h).data;let r=0,gg=0,b=0,n=d.length/4;for(let i=0;i<d.length;i+=4){r+=d[i];gg+=d[i+1];b+=d[i+2]}return'rgb('+(r/n|0)+','+(gg/n|0)+','+(b/n|0)+')'};
A.c.top=avg(0,6);A.c.bot=avg(t.height-6,6)})});
let ARA=ARENAS[0],ARI=ARA.im,ARC=ARA.c;let CAMX=176,CAMHW=176,ARH,ARY,ARL,ARR;
/* sceglie l'arena dell'incontro (a caso tra quelle caricate) */
function pickArena(){const ok=ARENAS.filter(A=>A.im.complete&&A.im.naturalWidth);ARA=ok.length?ok[Math.random()*ok.length|0]:ARENAS[0];ARI=ARA.im;ARC=ARA.c;arenaFit(ARH||208)}
/* dimensiona il fondale: alto almeno h (mondo); in verticale abbastanza da arrivare in cima allo schermo.
   Il campo di gioco (XMIN..XMAX) e' sempre tutto il fondale meno un margine */
function arenaFit(h){ARH=Math.max(208,h);ARY=FY-(ARA?ARA.fy:.87)*ARH;const hw2=ARH*1408/768/2;ARL=176-hw2;ARR=176+hw2;XMIN=ARL+22;XMAX=ARR-22;
if(G&&G.net){XMIN=G.net.xmin;XMAX=G.net.xmax}}/* online il campo e' lo stesso per tutti e due, qualunque schermo */
/* zoom che conta per il gioco (distanze fra i lottatori): online quello concordato all'inizio */
const gz=()=>G&&G.net?G.net.zp:ZP;

{const v=document.getElementById('ver');if(v)v.textContent='v'+VER}
const SPR_H=0.55*384/2, SPRK=SPR_H/SPRB; /* altezza sprite ~55% del canvas, in coordinate mondo */
function draw(f,x,y,pose,sc){const L=f.L,s=pose||f.st,t=f.t,e=f.ext||0;const ss=f.ss||SPRSET[L.n],SPR=ss&&ss.im,SPRN=ss&&ss.n;sc=(sc||1)*(L.big?1.12:1)*(ss&&ss.sc||1);
if(!(SPR&&SPR.idle))return;/* niente sprite (ancora in caricamento): non si disegna nulla */
let name='idle',fi=0;
if(s=='walk'){name='walk';fi=(t/12|0)%SPRN.walk}
else if(s=='idle')fi=(t/20|0)%SPRN.idle;
else if(s=='jump'){name='jump';fi=f.vy<-3?0:f.vy<3?1:2}
else if(s=='block')name='block';
else if(s=='crouch')name='crouch';
else if(s=='hit'&&SPR.hit)name='hit';
else if(s=='atk'){name=f.atk=='s'?'special':f.atk=='p'?'punch':f.atk=='k'?'kick':'heavy';if(!SPR[name])name='idle';else if(name=='special'&&ss.spT)fi=ss.spT.filter(v=>t>=v).length;else{const m=MV[f.atk];fi=Math.min(t<m.su-2?0:t<m.su?1:t<m.su+m.ac?2:t<m.su+m.ac+2?3:4,SPRN[name]-1)}}
else if(s=='ko'){if(t<35&&SPR.fall){name='fall';fi=Math.min(t/12|0,SPRN.fall-1)}else if(SPR.ko){name='ko';fi=0}}
if(G&&G.ph=='ko'&&G.w===f&&SPR.win&&(s=='idle'||s=='walk')){name='win';fi=Math.min(SPRN.win-1,(150-G.pt)/14|0)}
if(!SPR[name])name='idle';
const src=SPR[name],fw=src.width/SPRN[name],fh=src.height,k=SPRK;
c.save();c.imageSmoothingEnabled=false;c.translate(x|0,y|0);c.scale(f.face*sc,sc);
if(s=='hit'&&name!='hit')c.rotate(-.08);
if(name=='idle'&&SPRN.idle==1)c.scale(1,1+Math.sin(t/14)*.012);
if(s=='atk'&&f.atk=='s'){c.fillStyle='rgba(255,210,63,.3)';c.fillRect(-34,-fh*k-6,68,fh*k+6)}
c.drawImage(src,fi*fw,0,fw,fh,-fw*k/2,-fh*k,fw*k,fh*k);c.restore()}
/* onda d'urto luminosa della mossa speciale (solo grafica, dipende da f.t; disegnata DIETRO ai lottatori): un primo anello quando parte
   la mossa, poi un anello piu' grande con lampo e cerchio a terra quando colpisce (tick su della mossa) */
function spFx(f){if(f.st!='atk'||f.atk!='s')return;const ss=f.ss||SPRSET[f.L.n]||{},m=ss.mv||MV.s,t=f.t,sc=(f.L.big?1.12:1)*(ss.sc||1),cy=FY+f.y-52*sc;
c.save();c.globalCompositeOperation='lighter';c.shadowColor='rgba(255,220,120,.9)';c.shadowBlur=10;
const ring=(age,dur,r0,r1,w,col)=>{if(age<0||age>dur)return;const q=age/dur,r=r0+(r1-r0)*(1-(1-q)*(1-q)),al=1-q;
 c.lineWidth=w*(1-q*.6);c.strokeStyle='rgba('+col+','+al+')';c.beginPath();c.ellipse(f.x,cy,r,r*.78,0,0,6.283);c.stroke();
 c.lineWidth=w*2.2*(1-q*.6);c.strokeStyle='rgba('+col+','+al*.25+')';c.stroke()};
ring(t,16,10,58*sc,5,'255,236,140');
const a2=t-m.su;ring(a2,22,14,100*sc,8,'255,250,210');ring(a2-3,22,8,74*sc,5,'255,170,60');ring(a2-7,20,6,50*sc,3,'255,255,255');
if(a2>=0&&a2<10){const g=c.createRadialGradient(f.x,cy,0,f.x,cy,60*sc);g.addColorStop(0,'rgba(255,245,200,'+(.35*(1-a2/10))+')');g.addColorStop(1,'rgba(255,200,80,0)');c.fillStyle=g;c.fillRect(f.x-60*sc,cy-60*sc,120*sc,120*sc)}
if(a2>=0&&a2<24){const q=a2/24;c.lineWidth=2;c.strokeStyle='rgba(255,230,150,'+(1-q)+')';c.beginPath();c.ellipse(f.x,FY+1,12+q*80*sc,3+q*9,0,0,6.283);c.stroke()}
c.restore()}
