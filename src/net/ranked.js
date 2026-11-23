/* net/ranked.js - RANKED: punti Elo, divisioni, classifica globale firmata sui relay Nostr. */
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
/** fine di un set classificato: punti, premi, riga della classifica aggiornata (anche all'avversario) */
function rkEnd(N,win){N.rkDone=1;const R=rkApply(SAVE.rk,win,N.pe,N.my?CH[N.my.c].n:null);if(win)R.bonus+=RKSET;SAVE.ced+=R.bonus;save();wal();
rkMine().then(x=>{if(!x)return;try{if(N.a)nsend(N.a.lb,[x.ev],N.peer)}catch(e){}rkRelays(x.ev,0)});return R}
const rkRes=R=>{const d=R.e-R.old;return'PUNTI '+R.old+' → <b>'+R.e+'</b> ('+(d>=0?'+':'')+d+')'+(R.bonus?' · +'+R.bonus+' CEDOLINI':'')+
 (R.up.length?'<br><b style="color:'+RKD[rkDiv(R.e)].c+'">NUOVA DIVISIONE: '+R.up[R.up.length-1]+'!</b>':'')+'<br>'+rkBadge(SAVE.rk)};
/* schermata CLASSIFICA: la copia locale subito, poi si aggiorna con chi e' collegato (stanza 'board') */
const RK={room:null};
const rkRow=(i,x,me)=>{const d=RKD[rkDiv(x.e)];return'<div class="rkr'+(me?' on':'')+'"><b>'+i+'</b><span>'+esc(x.n)+'</span><em style="color:'+d.c+'">'+d.n+'</em><i>'+x.e+'</i><small>'+x.w+'V '+x.l+'S'+(x.c?' · '+x.c:'')+'</small></div>'};
function rkDraw(){const me=rkId(),T=rkTop(50);let h=T.map((x,i)=>rkRow(i+1,x,x.k==me)).join('');
if(me&&RKB[me]&&!T.some(x=>x.k==me))h+=rkRow(rkTop(1e4).findIndex(x=>x.k==me)+1,RKB[me],1);
$('#rkl').innerHTML=h||'<div class="small">Ancora nessuno in classifica: gioca una partita RANKED per entrarci.</div>';$('#rk-me').innerHTML=esc(SAVE.n)+' · '+rkBadge(SAVE.rk)}
function rkClose(){if(RK.room){const r=RK.room;RK.room=null;try{r.leave()}catch(e){}}}
function rkShow(){rkClose();sh('s-rank');rkDraw();focusFirst();const st=$('#rk-st'),my=++rkShow.n;st.textContent='CARICO LA CLASSIFICA GLOBALE...';
rkMine().then(x=>{rkDraw();return rkRelays(x&&x.ev,1,()=>{if(rkShow.n==my)rkDraw()})}).then(k=>{if(rkShow.n!=my)return;rkDraw();
 const n=rkTop(1e4).length;st.textContent=k?'CLASSIFICA GLOBALE · '+n+' GIOCATORI · '+k+'/'+RKR.length+' SERVER':'Rete non disponibile: questa è l\'ultima classifica salvata ('+n+' giocatori).'})}
rkShow.n=0;
