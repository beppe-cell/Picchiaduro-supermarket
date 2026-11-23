/* net/online.js - Online: giocatori presenti, ricerca avversario, stanze, scelta, avvio delle partite, pulsanti della schermata. */
/* Nessun server nostro: i giocatori si trovano tramite i relay pubblici Nostr (libreria Trystero in
   assets/vendor/trystero-nostr.mjs, caricata solo quando si apre ONLINE) e poi giocano collegati
   direttamente (WebRTC). Le due copie del gioco simulano la stessa partita e si scambiano solo i
   comandi (9 bit per fotogramma), con il ROLLBACK (vedi netSync): i miei comandi valgono dopo N.d
   fotogrammi (2, cioe' 33 ms; di piu' solo con un ping altissimo, netDelay), quelli dell'avversario non
   ancora arrivati si prevedono e, se la previsione era sbagliata, si torna indietro e si ricalcola.
   I due si mandano un ping ogni 400 ms ('pg'); chi e' troppo avanti rallenta di mezzo fotogramma
   (netLag) cosi' i ricalcoli restano corti. L'HUD mostra il ping.
   Ruoli: chi ha l'id piu' piccolo e' l'host, gioca a sinistra (G.a) e sceglie l'arena.
   Ricerca rapida: tutti entrano nella stanza 'lobby'; chi ha l'id piu' piccolo propone a un altro una
   stanza nuova, l'altro accetta se e' ancora libero. Stanza privata: codice di 4 lettere.
   Ogni NETH fotogrammi i due si scambiano un'impronta dello stato: se differisce compare DESYNC.
   NETV = versione del protocollo: giocatori con versioni diverse non si collegano. */
/* giocatori online: chi e' nella sezione ONLINE (o gioca online) sta nella stanza 'presenza' e conta chi
   c'e' dentro, se stesso compreso. Si entra aprendo ONLINE e si esce tornando al menu */
const PRES={room:null,peers:new Set()};
function presDraw(){const e=$('#on-cnt');if(!e)return;if(!PRES.room){e.innerHTML='<i></i>GIOCATORI ONLINE: ...';return}
const v=[...PRES.peers.values(),presMe()],n=k=>v.filter(x=>x==k).length;
e.innerHTML='<i></i>GIOCATORI ONLINE: <b>'+v.length+'</b>'+(n('rank')||n('fun')?'<small> · IN CODA RANKED <b>'+n('rank')+'</b> · FOR FUN <b>'+n('fun')+'</b></small>':'')}
function presOn(){presDraw();if(PRES.room||presOn.go)return;presOn.go=1;netLib().then(L=>{presOn.go=0;if(PRES.room||!presOn.want)return;
 const r=PRES.room=netJoin(L,'presenza-v1');PRES.peers=new Map();const st=PRES.act=r.makeAction('st');
 r.onPeerJoin=p=>{if(PRES.room===r){PRES.peers.set(p,'');presDraw();nsend(st,{s:presMe()},p)}};
 r.onPeerLeave=p=>{if(PRES.room===r){PRES.peers.delete(p);presDraw()}};
 st.onMessage=(d,{peerId:p})=>{if(PRES.room===r&&d&&typeof d.s=='string'&&d.s.length<8){PRES.peers.set(p,d.s);presDraw()}};presDraw()},()=>{presOn.go=0})}
/** cosa sto facendo, per gli altri nella stanza presenza: in coda RANKED, in coda FOR FUN, in partita, nel menu */
const presMe=()=>NET&&NET.lobby?(NET.rkq?'rank':'fun'):NET&&(NET.peer||NET.room)?'play':'menu';
/** manda il mio stato agli altri (quando cambia) */
function presTell(){const s=presMe();if(PRES.room&&PRES.act&&s!==presTell.s){presTell.s=s;nsend(PRES.act,{s},undefined)}presDraw()}
function presOff(){presOn.want=0;presTell.s=null;if(PRES.room){const r=PRES.room;PRES.room=null;PRES.act=null;PRES.peers.clear();netQuit(r)}}
const ONT='RANKED: set al meglio di 3 incontri, conta per punti e classifica. PARTITA FOR FUN: senza punti.';
const NETV=4,NETD=2,NETW=14/* fotogrammi massimi previsti senza i comandi dell'avversario */,NETH=60,NETAPP='superrissa-picchiaduro',NETK='lrudbpkhs',NETTO=8000;
/* server Nostr per trovarsi: tutti usano la stessa lista intera (senza, la libreria ne sceglie 5 a caso
   tra server poco noti in base al nome del gioco). Bastano uno o due server vivi in comune */
const NETRELAYS=['wss://nos.lol','wss://relay.damus.io','wss://nostr.mom','wss://relay.primal.net',
 'wss://relay.nostr.dev.br','wss://nostr.stakey.net','wss://relay.flashapp.me','wss://nostrcity-club.fly.dev',
 'wss://nostr.christiansass.de','wss://relay.nostr.blockhenge.com'];
const NETCFG=window.NETCFG/* solo per i test */||{appId:NETAPP,relayConfig:{urls:NETRELAYS},maxReceiveBytes:262144/* sicurezza: messaggi di un altro giocatore al massimo 256 KB (predefinito 256 MB) */};
/** stanza Trystero; la ricerca puo' essere ripresa subito dopo averla lasciata: si riusa la stanza ancora aperta */
const NETROOMS={};
function netJoin(L,id){const o=NETROOMS[id];if(o&&o.leaving){clearTimeout(o.leaving);o.leaving=0;return o.room}
const room=L.joinRoom(NETCFG,id);NETROOMS[id]={room};return room}
function netQuit(room,ms){for(const[id,o]of Object.entries(NETROOMS))if(o.room===room){clearTimeout(o.leaving);
 const go=()=>{if(NETROOMS[id]===o){delete NETROOMS[id];try{room.leave()}catch(e){}}};if(ms)o.leaving=setTimeout(go,ms);else go();return}try{room.leave()}catch(e){}}
let NET=null,NETLIB=null;
const netEnc=i=>{let v=0;for(let j=0;j<9;j++)if(i[NETK[j]])v|=1<<j;return v};
const netDec=v=>{const i={};for(let j=0;j<9;j++)if(v>>j&1)i[NETK[j]]=1;return i};
const netCode=()=>{let c='';for(let i=0;i<4;i++)c+='ABCDEFGHJKLMNPQRSTUVWXYZ'[Math.random()*24|0];return c};
/** la libreria si scarica solo qui (window.NETFAKE: trasporto finto per i test) */
async function netLib(){if(window.NETFAKE)return window.NETFAKE;if(!NETLIB)NETLIB=await import(new URL('assets/vendor/trystero-nostr.mjs?v='+VER,document.baseURI).href)/* percorso dalla pagina, non da questo file */;return NETLIB}
function netSt(t){$('#on-st').textContent=t}
function netUI(busy,code){$('#on-rk').innerHTML='RANKED: '+rkBadge(SAVE.rk);$('#on-m').style.display=busy?'none':'';$('#on-i').style.display=busy?'none':'';
$('#on-code').style.display=code?'':'none';if(code)$('#on-c').textContent=code;$('#on-x').textContent=busy?'ANNULLA':'INDIETRO';focusFirst()}
/** esce da stanze e ricerca */
function netLeave(){if(!NET)return;const n=NET;clearInterval(n.pi);if(n.rk&&n.set&&!n.rkDone)rkEnd(n,false);/* lasciare un set classificato = sconfitta */NET=null;clearTimeout(n.nx);clearInterval(n.ti);clearTimeout(n.to);for(const r of[n.lobby,n.room])if(r)netQuit(r);setTimeout(presTell,0)}
/** errore o fine collegamento: torna alla schermata ONLINE con un messaggio */
function netFail(t){netLeave();G=null;pl=false;sh('s-online');netUI(0);netSt(t)}
/** apre il collegamento e poi fa fn. Mentre la libreria si scarica si vede subito COLLEGAMENTO... con ANNULLA;
    i tocchi ripetuti nel frattempo non contano, e ANNULLA (netOpen.tok) ferma tutto anche a meta' */
async function netOpen(fn){if(netOpen.busy)return;const tok=++netOpen.tok;netOpen.busy=1;
try{netLeave();netUI(1);netSt('COLLEGAMENTO ALLA RETE...');const L=await netLib();
 if(tok!==netOpen.tok||!$('#s-online').classList.contains('on'))return;NET={me:L.selfId,L,ri:{},buf:{},lh:{},rh:{},m:0};fn()}
catch(e){if(tok===netOpen.tok)netFail('Rete non disponibile: controlla la connessione e riprova.')}finally{if(tok===netOpen.tok)netOpen.busy=0}}
netOpen.tok=0;
/* ricerca rapida */
/* rk: coda RANKED (stanza a parte). Con RKNEAR=1 si propone la partita solo a chi ha punti vicini (la
   distanza accettata parte da 150 e cresce di 10 al secondo di attesa); con RKNEAR=0, finche' i giocatori
   sono pochi, va bene chiunque sia in coda */
const RKNEAR=0;
function netCerca(rk){netOpen(()=>{const N=NET,me=SAVE.rk.e,lobby=N.lobby=netJoin(N.L,(rk?'rank-v':'lobby-v')+NETV),t0=performance.now(),pre=rk?'k-':'m-';
const win=()=>150+(performance.now()-t0)/100,near=e=>!rk||!RKNEAR||Math.abs((typeof e=='number'?e:1000)-me)<=win();
N.rkq=!!rk;presTell();
const other=()=>{const v=[...PRES.peers.values()],k=v.filter(x=>x==(rk?'fun':'rank')).length;return k?' · '+k+' IN CODA '+(rk?'FOR FUN':'RANKED')+': per giocare con loro scegliete la stessa modalità':''};
const st=()=>{const q=Object.keys(lobby.getPeers?lobby.getPeers():{}).length;
 netSt((rk&&RKNEAR?'RANKED: CERCO UN AVVERSARIO TRA '+Math.max(0,me-win()|0)+' E '+(me+win()|0)+' PUNTI...':rk?'RANKED: CERCO UN AVVERSARIO...':'FOR FUN: CERCO UN AVVERSARIO...')+(q?' ('+q+' IN CODA CON TE)':'')+other())};
netUI(1);st();
const ann=lobby.makeAction('ann'),prop=lobby.makeAction('prop'),free=()=>NET===N&&!N.room&&!N.pend;
const say=p=>{if(free())ann.send({v:NETV,e:me},p?{target:p}:undefined)};
lobby.onPeerJoin=p=>{say(p);if(free())st()};lobby.onPeerLeave=()=>{if(free())st()};N.ti=setInterval(()=>{say();if(free())st()},3000);N.retry=()=>netCerca(rk);
ann.onMessage=(d,{peerId:p})=>{if(!free()||!d||d.v!==NETV||!(N.me<p)||!near(d.e))return;
 N.pend=p;N.code=netCode();nsend(prop,{code:N.code,e:me},p);N.to=setTimeout(()=>{if(N.pend==p)N.pend=null},5000)};
prop.onMessage=(d,{peerId:p})=>{if(NET!==N||!d)return;
 if(d.ok){if(N.pend==p&&d.code==N.code)netMatch(pre+d.code,'TROVATO! COLLEGAMENTO...',0,rk);return}
 if(d.no){if(N.pend==p)N.pend=null;return}
 if(d.code&&free()&&near(d.e)){nsend(prop,{ok:1,code:d.code},p);netMatch(pre+d.code,'TROVATO! COLLEGAMENTO...',0,rk)}else nsend(prop,{no:1},p)}})}
/* stanza privata */
function netCrea(){netOpen(()=>{const c=netCode();netMatch('r-'+c,'Manda questo codice all\'avversario e aspetta che entri:',c)})}
function netEntra(){const c=$('#on-i').value.trim().toUpperCase();if(!/^[A-Z]{4}$/.test(c)){netSt(c?'Il codice è di 4 lettere.':'Scrivi qui sopra il codice di 4 lettere che ti ha mandato l\'avversario.');$('#on-i').focus();return}
netOpen(()=>netMatch('r-'+c,'ENTRO NELLA STANZA '+c+'...'))}
/** stanza della partita (dalla ricerca o col codice): saluto, scelta dei dipendenti, partite */
function netMatch(id,msg,code,rk){const N=NET;clearInterval(N.ti);N.pend=null;N.rk=!!rk;
/* la ricerca si chiude un po' dopo: cosi' la risposta 'ok' fa in tempo a partire */
if(N.lobby){const l=N.lobby;N.lobby=null;netQuit(l,2000)}
const room=N.room=netJoin(N.L,id);presTell();sh('s-online');netUI(1,code);netSt(msg);
if(!code){clearTimeout(N.to);N.to=setTimeout(()=>{if(NET!==N||N.peer)return;/* l'avversario trovato non si e' collegato: si torna a cercare da soli */
 const re=N.retry;netLeave();if(re&&$('#s-online').classList.contains('on')){re();netSt('Collegamento non riuscito con l\'avversario trovato: cerco ancora...')}else netFail('Nessuna risposta: riprova.')},25000)}
const A=k=>room.makeAction(k);N.a={hi:A('hi'),rdy:A('rdy'),go:A('go'),inp:A('in'),hs:A('hs'),re:A('re'),lb:A('lb'),pg:A('pg')};N.rtt=[];N.rx={};
const mine=p=>{if(!N.peer){N.peer=p;N.host=N.me<p}return p==N.peer};
room.onPeerJoin=p=>{if(NET!==N||(N.peer&&N.peer!=p))return;/* stanza gia' in uso: il terzo resta fuori */mine(p);N.a.hi.send({v:NETV,n:SAVE.n,rk:N.rk?1:0,e:SAVE.rk.e},{target:p});rkShare(30).then(t=>{if(NET===N&&t.length)N.a.lb.send(t,{target:p})})};
room.onPeerLeave=p=>{if(NET===N&&p==N.peer)netGone()};
N.a.hi.onMessage=(d,{peerId:p})=>{if(NET!==N||!mine(p))return;clearTimeout(N.to);if(!d||d.v!==NETV){netFail('L\'avversario ha un\'altra versione del gioco: aggiornate la pagina tutti e due.');return}
 if(N.pn)return;if(!!d.rk!==N.rk){netFail('L\'avversario ha un\'altra versione del gioco: aggiornate la pagina tutti e due.');return}
 N.pe=typeof d.e=='number'&&isFinite(d.e)?Math.max(0,Math.min(4000,Math.round(d.e))):1000;N.pn=cleanName(d.n,'AVVERSARIO');netSel();
 clearInterval(N.pi);N.pi=setInterval(()=>{if(NET===N)nsend(N.a.pg,{t:performance.now()},N.peer)},400)};
/* ping: si risponde subito con lo stesso t; chi riceve la risposta misura il giro */
N.a.pg.onMessage=(d,{peerId:p})=>{if(NET!==N||p!=N.peer||!d||typeof d.t!='number')return;
 if(!d.r){nsend(N.a.pg,{t:d.t,r:1},p);return}const r=performance.now()-d.t;if(r>=0&&r<5000){N.rtt.push(r);if(N.rtt.length>15)N.rtt.shift()}};
N.a.lb.onMessage=(d,{peerId:p})=>{if(NET===N&&p==N.peer)rkMerge(d)};
N.a.rdy.onMessage=(d,{peerId:p})=>{if(NET!==N||p!=N.peer)return;const c=netPick(d,N.rk);if(!c)return;N.prdy=c;netGo()};
N.a.go.onMessage=(d,{peerId:p})=>{if(NET!==N||p!=N.peer||N.host||!d)return;const a=netPick(d.a,N.rk),b=netPick(d.b,N.rk);
 if(!a||!b||!Number.isInteger(d.m)||d.m<1||d.m>1e6)return;netStart({m:d.m,d:Math.max(2,Math.min(15,d.d|0)),ar:Math.max(0,Math.min(ARENAS.length-1,d.ar|0)),zp:Math.max(1,Math.min(3,+d.zp||1)),a,b})};
N.a.inp.onMessage=(d,{peerId:p})=>{if(NET!==N||p!=N.peer||!d||!Number.isInteger(d.m)||!Array.isArray(d.q)||d.q.length>8||!d.q.every(q=>Array.isArray(q)&&Number.isInteger(q[0])&&q[0]>0&&q[0]<1e7&&Number.isInteger(q[1])&&q[1]>=0&&q[1]<512))return;if(N.m&&Math.abs(d.m-N.m)>1)return;const b=N.buf[d.m]||(N.buf[d.m]={});for(const[f,v]of d.q){b[f]=v;if(f>(N.rx[d.m]||0))N.rx[d.m]=f}if(typeof d.a=='number')N.ra=d.a};
N.a.hs.onMessage=(d,{peerId:p})=>{if(NET!==N||p!=N.peer||!d||!G||!G.net||d.m!==G.net.m)return;N.rh[d.f]=d.h;netCheck(d.f)};
N.a.re.onMessage=(d,{peerId:p})=>{if(NET!==N||p!=N.peer)return;N.pre=1;if(G&&G.ph=='end'&&!(N.rk&&N.set&&!N.rkDone))$('#e-s').textContent=N.pn+(N.rk?' vuole un altro set!':' vuole la rivincita!');netGo()}}
/* scelta del dipendente: la stessa schermata della modalita' arcade */
function netSel(){const N=NET;N.my=N.prdy=null;N.pre=N.mre=0;mode='net';G=null;pl=false;fillSel();sh('s-sel')}
/** scelta di un giocatore ricevuta dalla rete: personaggio ammesso (in RANKED solo i dipendenti normali),
    skin esistente (altrimenti quella originale), nome pulito; null se non valida */
function netPick(d,rk){if(!d||typeof d!='object')return null;const c=d.c;if(!Number.isInteger(c)||c<0||c>=CH.length||(rk&&!rkList().includes(c)))return null;
const sk=typeof d.sk=='string'&&skinsOf(CH[c].n).some(k=>k.id==d.sk)?d.sk:'base';return{c,sk,zp:Math.max(1,Math.min(3,+d.zp||1)),n:cleanName(d.n,'')}}
function netReady(i){const N=NET;if(!N||!N.peer||!selList().includes(i))return;N.my={c:i,sk:eqSkin(CH[i].n),zp:ZP,n:SAVE.n};N.a.rdy.send(N.my);
$('#w-s').textContent='IN ATTESA DI '+N.pn+'...';sh('s-wait');netGo()}
/** l'host avvia quando tutti e due sono pronti (prima partita) o vogliono la rivincita */
function netGo(){const N=NET;if(!N||!N.host||!N.my||!N.prdy)return;if(N.m&&!(N.pre&&N.mre))return;
if(N.rtt.length<4&&!N.gw){/* aspetta qualche misura del ping (al massimo 2 s) per scegliere il ritardo */N.gw=performance.now()}
if(N.rtt.length<4&&performance.now()-N.gw<2000){clearTimeout(N.gt);N.gt=setTimeout(netGo,200);return}
const P={m:N.m+1,d:netDelay(),ar:Math.random()*ARENAS.length|0,zp:Math.max(N.my.zp||1,N.prdy.zp||1),a:N.my,b:N.prdy};N.a.go.send(P);netStart(P)}
/** invio che non lascia errori in giro se l'altro se n'e' gia' andato (Trystero: send restituisce una Promise) */
function nsend(a,d,p){try{const r=a.send(d,p?{target:p}:undefined);if(r&&r.catch)r.catch(()=>{})}catch(e){}}
/** ping del collegamento (ms): il valore alto tra gli ultimi (la variazione conta), null se non ancora misurato */
function netPing(N,q){if(!N||!N.rtt||!N.rtt.length)return null;const a=N.rtt.slice().sort((x,y)=>x-y);return a[Math.min(a.length-1,Math.floor(a.length*q))]}
/** fotogrammi di ritardo dei miei comandi (lo sceglie l'host): 2 di base; con un ping molto alto un po' di
    piu', cosi' il rollback non deve mai tornare indietro piu' di ~8 fotogrammi */
function netDelay(){const r=netPing(NET,.8);return r==null?NETD:Math.max(2,Math.min(8,Math.ceil(r/2/16.67)-6))}
/** chi e' troppo avanti rispetto all'altro rallenta di mezzo fotogramma: cosi' nessuno dei due deve
    prevedere troppo e i ricalcoli restano corti (vantaggio = fotogrammi davanti all'ultimo comando ricevuto) */
function netAdv(){const N=NET;return G.fr-((N.rx[G.net.m]||0)-N.d)}
function netLag(){const N=NET;if(!N||!G||!G.net||G.ph=='end'||N.ra==null)return 0;return netAdv()-N.ra>=2?8:0}
function netStart(P){const N=NET;if(!N)return;N.m=P.m;N.pre=N.mre=0;N.d=Math.max(2,Math.min(15,P.d|0||NETD));
const sa=skinSet(CH[P.a.c].n,P.a.sk||'base'),sb=skinSet(CH[P.b.c].n,P.b.sk||'base'),A=ARENAS[P.ar]||ARENAS[0];
if(!ready(sa)||!ready(sb)||!A.im.naturalWidth){sh('s-load');ldShow();clearTimeout(netStart.w);netStart.w=setTimeout(()=>netStart(P),150);return}
ARA=A;ARI=A.im;ARC=A.c;const fw=208*1408/768/2;
G={a:mk(N.rk?rkL(CH[P.a.c]):CH[P.a.c],88,1),b:mk(N.rk?rkL(CH[P.b.c]):CH[P.b.c],264,-1),rd:1,pi:P.a.c,oi:P.b.c,lv:2,hs:0,sh:0,pz:0,fr:0,er:{round:0,perfect:0},
 net:{m:P.m,zp:P.zp,xmin:176-fw+22,xmax:176+fw-22,ia:{},ib:{}}};
arenaFit(ARH||208);G.a.ss=sa;G.b.ss=sb;G.a.nm=cleanName(P.a.n,'');G.b.nm=cleanName(P.b.n,'');
G.me=N.host?G.a:G.b;G.me.loc=1;
if(N.rk){if(!N.set||N.rkDone){N.set={me:0,op:0};N.rkDone=0;SAVE.rk.pend={e:N.pe};save()}/* inizio set: se si chiude la pagina conta come sconfitta */
 G.net.rk=1;G.net.set=N.host?[N.set.me,N.set.op]:[N.set.op,N.set.me]}
N.li={};N.ri=N.buf[P.m]||(N.buf[P.m]={});for(let f=1;f<=N.d;f++){N.li[f]=0;N.ri[f]=0}N.lh={};N.rh={};N.wait=0;N.ra=null;
newRound();N.sn={0:snapTake()};N.cf=0;N.pu={};N.rbs=0;sh('');pl=true;sfx('ui')}
/** l'avversario se n'e' andato (o non risponde da NETTO ms) */
function netGone(){const N0=NET,n=N0&&N0.pn,R=N0&&N0.rk&&N0.set&&!N0.rkDone?rkEnd(N0,true):null;/* l'avversario abbandona il set: vittoria */netLeave();
if(G&&G.net&&G.ph!='end'){G.ph='end';pl=false;$('#e-t').className='lose';$('#e-t').textContent='PARTITA INTERROTTA';$('#e-s').textContent=(n||'L\'avversario')+' si è disconnesso.';$('#e-c').innerHTML='';$('#b-nx').style.display='none';if(R){$('#e-t').className='win';$('#e-t').textContent='VITTORIA A TAVOLINO';$('#e-s').innerHTML=esc(n||'L\'avversario')+' ha abbandonato il set.<br>'+rkRes(R)}sh('s-end')}
else if(R)netFail((n||'L\'avversario')+' ha abbandonato il set: vittoria a tavolino! PUNTI '+R.old+' → '+R.e+(R.bonus?' · +'+R.bonus+' CEDOLINI':''));
else if(n)netFail(n+' si è disconnesso.');else if($('#s-online').classList.contains('on')||$('#s-wait').classList.contains('on'))netFail('Collegamento perso.')}
/** fine incontro online: rivincita (serve il si' di tutti e due) o menu */
function netEnd(win){const N=NET,bn=$('#b-nx');$('#e-s').textContent=N?'contro '+N.pn:'';bn.style.display=N?'':'none';bn.textContent='RIVINCITA';
if(N&&N.rk&&N.set&&!N.rkDone){if(win)N.set.me++;else N.set.op++;const sc=N.set.me+'-'+N.set.op;
 if(N.set.me<2&&N.set.op<2){/* set non finito: il prossimo incontro parte da solo, stessi dipendenti */
  $('#e-s').textContent='SET '+sc+' contro '+N.pn+' · prossimo incontro fra poco...';bn.style.display='none';
  clearTimeout(N.nx);N.nx=setTimeout(()=>{if(NET!==N||!G||!G.net)return;N.mre=1;N.a.re.send({m:G.net.m});netGo()},3500);return}
 const R=rkEnd(N,N.set.me>N.set.op);$('#e-t').className=R.win?'win':'lose';$('#e-t').textContent=R.win?'SET VINTO!':'SET PERSO';
 $('#e-s').innerHTML='SET '+sc+' contro '+esc(N.pn)+'<br>'+rkRes(R);bn.textContent='ALTRO SET'}
bn.onclick=()=>{if(!NET)return;NET.mre=1;NET.a.re.send({m:G.net.m});$('#e-s').textContent='IN ATTESA DI '+NET.pn+'...';netGo()}}
$('#on-q').onclick=()=>{au();sfx('ui');netCerca()};$('#on-rq').onclick=()=>{au();sfx('ui');netCerca(1)};$('#on-lb').onclick=()=>{au();sfx('ui');rkShow()};
$('#rk-x').onclick=()=>{sfx('ui');rkClose();GO.online()};$('#on-cr').onclick=()=>{au();sfx('ui');netCrea()};$('#on-j').onclick=()=>{au();sfx('ui');netEntra()};
$('#on-x').onclick=()=>{sfx('ui');if(NET||netOpen.busy){netOpen.tok++;netOpen.busy=0;netLeave();netUI(0);netSt(ONT)}else GO.menu()};
$('#w-x').onclick=()=>{sfx('ui');netFail('Partita annullata.')};
$('#on-cp').onclick=()=>{const t=$('#on-c').textContent;(navigator.clipboard?navigator.clipboard.writeText(t):Promise.reject()).then(()=>netSt('Codice copiato: mandalo all\'avversario.'),()=>{})};
$('#on-i').addEventListener('input',e=>{const v=e.target.value.toUpperCase().replace(/[^A-Z]/g,'');if(v!=e.target.value)e.target.value=v});
