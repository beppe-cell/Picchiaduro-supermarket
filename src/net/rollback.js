/* net/rollback.js - Rollback netcode: stato salvato, previsione, correzione, controllo DESYNC. */
/* ---------- rollback ----------
   Ogni fotogramma online si calcola subito: i miei comandi (con N.d fotogrammi di ritardo, di solito 2) e,
   per l'avversario, il suo comando vero se e' gia' arrivato, altrimenti la previsione = il suo ultimo
   comando conosciuto. Dopo ogni fotogramma si salva lo stato (snapTake). Quando arrivano comandi diversi
   dalla previsione si torna allo stato del fotogramma prima dell'errore e si ricalcola fino ad ora (RB=1:
   senza suoni ne' scintille). N.cf = ultimo fotogramma confermato (comandi veri di tutti e due fino li'):
   solo li' si controlla l'impronta (DESYNC) e si chiude l'incontro (G.ph 'fin' -> endMatch). */
const fSnap=f=>({...f,rep:{...f.rep},hd:{...f.hd}});
function fLoad(f,s){for(const k of Object.keys(f))if(!(k in s))delete f[k];Object.assign(f,s,{rep:{...s.rep},hd:{...s.hd}})}
const GKEEP=['a','b','me','net'];
/** stato della simulazione (i riferimenti ai lottatori diventano 'a'/'b') */
function snapTake(){const a=G.a,b=G.b,tg=f=>f===a?'a':f===b?'b':null,g={};for(const k in G)if(!GKEEP.includes(k))g[k]=G[k];
g.w=tg(G.w);g.er={...G.er};return{g,A:fSnap(a),B:fSnap(b),PJ:PJ.map(p=>({...p,o:tg(p.o)})),CAMX,T}}
function snapLoad(s){for(const k of Object.keys(G))if(!GKEEP.includes(k)&&!(k in s.g))delete G[k];
for(const k in s.g)G[k]=s.g[k];G.w=s.g.w=='a'?G.a:s.g.w=='b'?G.b:s.g.w;G.er={...s.g.er};fLoad(G.a,s.A);fLoad(G.b,s.B);
PJ=s.PJ.map(p=>({...p,o:p.o=='a'?G.a:G.b}));CAMX=s.CAMX;T=s.T}
/** un fotogramma f: comandi veri o previsti dell'avversario, poi step() */
function netSim(f){const N=NET,mine=N.li[f]||0,k=N.ri[f]!==undefined,his=k?N.ri[f]:N.ri[N.cf]!==undefined?N.ri[N.cf]:0;N.pu[f]=his;
G.net.ia=netDec(N.host?mine:his);G.net.ib=netDec(N.host?his:mine);step();N.sn[f]=snapTake()}
/** comandi arrivati: corregge le previsioni sbagliate (rollback) e conferma i fotogrammi */
function netSync(){const N=NET,now=G.fr;let K=N.cf;while(K<now&&N.ri[K+1]!==undefined)K++;
let fm=0;for(let f=N.cf+1;f<=K;f++)if(N.ri[f]!==N.pu[f]){fm=f;break}
const cf0=N.cf;N.cf=K;/* la previsione per i fotogrammi dopo K usa gia' il comando di K */
if(fm){snapLoad(N.sn[fm-1]);RB=1;try{for(let f=fm;f<=now;f++)netSim(f)}finally{RB=0}N.rbs++}
for(let f=cf0+1;f<=K;f++){const sn=N.sn[f];
 if(f%NETH==0){N.lh[f]=netHashS(sn);nsend(N.a.hs,{m:G.net.m,f,h:N.lh[f]},N.peer);netCheck(f)}
 if(sn.g.ph=='fin'){snapLoad(sn);G.ph='ko';endMatch(G.w==G.me);return}}
for(const f in N.sn)if(f<K)delete N.sn[f];for(const f in N.pu)if(f<=K)delete N.pu[f]}
/** si puo' calcolare il prossimo fotogramma? si', finche' la previsione non va troppo avanti (NETW) */
function netCan(){const N=NET;if(!N||!G||G.ph=='end')return true;if(G.fr-N.cf<NETW){N.wait=0;return true}netSync();if(G.ph=='end'||G.fr-N.cf<NETW)return true;
const t=performance.now();if(!N.wait)N.wait=t;else if(t-N.wait>NETTO)netGone();return false}
/** un fotogramma online: correzioni, poi il fotogramma nuovo, poi i miei comandi per fra N.d fotogrammi */
function netStep(){const N=NET;if(!N||!G||G.ph=='end'){step();return}netSync();if(!G||G.ph=='end')return;
const f=G.fr+1;netSim(f);
const v=netEnc(pin()),fd=f+N.d;N.li[fd]=v;N.a.inp.send({m:G.net.m,a:netAdv(),q:[[fd,v],[fd-1,N.li[fd-1]||0],[fd-2,N.li[fd-2]||0]].filter(q=>q[0]>N.d)});
delete N.li[f-NETH*3];delete N.ri[f-NETH*3]}
/** impronta dello stato salvato di un fotogramma (si confronta con quella dell'avversario: DESYNC) */
/** impronta dello stato attuale (per i controlli) */
const netHash=()=>netHashS(snapTake());
const netHashS=s=>[s.A,s.B].map(o=>[Math.round(o.x*100),Math.round(o.y*100),Math.round(o.hp*100),o.st,o.wins].join(',')).join('|')+'|'+(s.g.ph=='fin'?'ko':s.g.ph)+s.g.rd;
function netCheck(f){const N=NET;if(N.lh[f]===undefined||N.rh[f]===undefined)return;if(N.lh[f]!==N.rh[f])G.net.ds=1;delete N.lh[f];delete N.rh[f]}
