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
$('#on-q').onclick=()=>{au();sfx('ui');netCerca()};$('#on-rq').onclick=()=>{au();sfx('ui');netCerca(1)};$('#on-lb').onclick=()=>{au();sfx('ui');rkShow()};
$('#rk-x').onclick=()=>{sfx('ui');rkClose();GO.online()};$('#on-cr').onclick=()=>{au();sfx('ui');netCrea()};$('#on-j').onclick=()=>{au();sfx('ui');netEntra()};
$('#on-x').onclick=()=>{sfx('ui');if(NET||netOpen.busy){netOpen.tok++;netOpen.busy=0;netLeave();netUI(0);netSt(ONT)}else GO.menu()};
$('#w-x').onclick=()=>{sfx('ui');netFail('Partita annullata.')};
$('#on-cp').onclick=()=>{const t=$('#on-c').textContent;(navigator.clipboard?navigator.clipboard.writeText(t):Promise.reject()).then(()=>netSt('Codice copiato: mandalo all\'avversario.'),()=>{})};
$('#on-i').addEventListener('input',e=>{const v=e.target.value.toUpperCase().replace(/[^A-Z]/g,'');if(v!=e.target.value)e.target.value=v});
const GO={menu:()=>{netLeave();presOff();G=null;pl=false;sh('s-menu')},online:()=>{netUI(0);netSt(ONT);sh('s-online');presOn.want=1;presOn();netLib().catch(()=>{})/* si scarica subito: il primo tocco e' rapido */},arc:()=>{mode='arc';fillSel();sh('s-sel')},tor:()=>{mode='tor';fillSel();sh('s-sel')},set:()=>sh('s-set'),shop:()=>{for(const it of shopItems())if(it.k)skFront(it.n,it.k.id);/* precarica le anteprime */fillShop();sh('s-shop')},prof:()=>{fillProf();sh('s-prof')}};
/* navigazione da tastiera nei menu: frecce/WASD per spostarsi, INVIO/SPAZIO/J per confermare, ESC per tornare */
const vis=()=>[...document.querySelectorAll('.scr.on')].find(e=>e.id!='s-title');
const btns=s=>[...s.querySelectorAll('.b')].filter(b=>b.offsetParent&&!b.closest('#grid'));
function focusB(b){document.querySelectorAll('.scr .b.f').forEach(x=>{if(!x.closest('#grid'))x.classList.remove('f')});if(b){b.classList.add('f');if(b.dataset.d)$('#mdesc').textContent=b.dataset.d}}
function focusFirst(){const s=vis();if(s&&s.id!='s-sel')focusB(btns(s)[0])}
document.querySelectorAll('.scr .b').forEach(b=>b.addEventListener('mouseenter',()=>focusB(b)));
function menuKey(e,s){const k=e.code,nx=['ArrowDown','ArrowRight','KeyS','KeyD'].includes(k),pv=['ArrowUp','ArrowLeft','KeyW','KeyA'].includes(k),ok=['Enter','Space','KeyJ','NumpadEnter'].includes(k);
if(s.id=='s-sel'){if(k=='ArrowRight'||k=='KeyD'){e.preventDefault();selStep(1)}else if(k=='ArrowLeft'||k=='KeyA'){e.preventDefault();selStep(-1)}
else if(ok){e.preventDefault();go(selI)}else if(k=='KeyK'){e.preventDefault();$('#b-skin').click()}else if(k=='Escape'||k=='Backspace'){sfx('ui');GO.menu()}return}
if(k=='Escape'&&(s.id=='s-set'||s.id=='s-shop'||s.id=='s-prof')){sfx('ui');GO.menu();return}
if(k=='Escape'&&s.id=='s-pform'&&!PFM.first){sfx('ui');$('#pff-x').click();return}
if(s.id=='s-skin'&&(k=='Escape'||k=='Backspace')){$('#sk-x').click();return}
if(s.id=='s-shop'&&['ArrowLeft','ArrowRight','KeyA','KeyD'].includes(k)){e.preventDefault();shopStep(k=='ArrowRight'||k=='KeyD'?1:-1);return}
if(k=='Escape'&&s.id=='s-online'){$('#on-x').click();return}if(k=='Escape'&&s.id=='s-rank'){$('#rk-x').click();return}if(k=='Escape'&&s.id=='s-wait'){$('#w-x').click();return}
const B=btns(s);if(!B.length)return;const j=B.findIndex(b=>b.classList.contains('f'));
if(nx||pv){e.preventDefault();sfx('ui');focusB(B[((j<0?0:j)+(nx?1:B.length-1))%B.length])}else if(ok){e.preventDefault();(B[j]||B[0]).click()}}
document.addEventListener('click',e=>{const t=e.target.closest('[data-go]');if(t){au();sfx('ui');GO[t.dataset.go]()}});
$('#s-title').onclick=()=>{if(LD.p1>0)return;au();pl=true;if(PF.cur)sh('s-menu');else pform('new',1)};
function pause(v){if(!G||G.ph=='end')return;if(!G.net)G.pz=v;pl=!v;sh(v?'s-pause':'')}/* online la partita continua */
$('#b-res').onclick=()=>pause(0);$('#pz').onpointerdown=()=>pause(1);
const KM={KeyA:'l',ArrowLeft:'l',KeyD:'r',ArrowRight:'r',KeyW:'u',ArrowUp:'u',KeyS:'d',ArrowDown:'d',KeyJ:'h',KeyK:'k',KeyL:'p',KeyI:'s',Space:'b',ShiftLeft:'b',ShiftRight:'b'};
addEventListener('keydown',e=>{if(e.target&&/^(INPUT|TEXTAREA)$/.test(e.target.tagName)){if(e.code=='Enter'&&e.target.tagName=='INPUT'){e.preventDefault();$('#'+(e.target.dataset.ok||'pff-ok')).click()}else if(e.code=='Escape')e.target.blur();return}
if($('#s-title').classList.contains('on')){$('#s-title').click();return}
const sc=vis();if(sc&&!(sc.id=='s-pause'&&(e.code=='Escape'||e.code=='KeyP'))){menuKey(e,sc);return}
if(e.code=='Escape'||e.code=='KeyP'){pause(G&&!G.pz&&!$('#s-pause').classList.contains('on')?1:0);return}const k=KM[e.code];if(!k)return;e.preventDefault();if(!keys[k]&&'pkhs'.includes(k))TR[k]=T;keys[k]=1});
addEventListener('keyup',e=>{const k=KM[e.code];if(k)keys[k]=0});
/* la finestra perde il focus (cambio scheda, notifica, alt-tab): il keyup non arriva, quindi si rilascia tutto */
const releaseAll=()=>{for(const k in keys)keys[k]=0;if(typeof touchReset=='function')touchReset()};
addEventListener('blur',releaseAll);document.addEventListener('visibilitychange',()=>{if(document.hidden)releaseAll()});
/* comandi touch. Levetta: compare dove si appoggia il pollice e lo segue se si allontana; sinistra/destra
   muovono, su salta, giu' abbassa. Pulsanti: zona unica, vale il pulsante piu' vicino al dito e si puo'
   scorrere da uno all'altro senza staccare. Piu' dita insieme (pointerId). */
const TCH={},stick=$('#stick'),sBase=stick.querySelector('.base'),sKnob=stick.querySelector('.knob'),acts=$('#acts'),AB=[...acts.querySelectorAll('.a')],SPB=acts.querySelector('.ss');
const vib=ms=>{if(O.vib&&navigator.vibrate)navigator.vibrate(ms)};
const cap=(el,e)=>{try{el.setPointerCapture(e.pointerId)}catch(_){}};
function stickPos(x,y,bx,by){sBase.style.left=bx+'px';sBase.style.top=by+'px';sKnob.style.left=x+'px';sKnob.style.top=y+'px'}
stick.addEventListener('pointerdown',e=>{e.preventDefault();au();cap(stick,e);const r=stick.getBoundingClientRect(),x=e.clientX-r.left,y=e.clientY-r.top;TCH[e.pointerId]={t:'s',ox:x,oy:y};stickPos(x,y,x,y);stick.classList.add('on')});
stick.addEventListener('pointermove',e=>{const s=TCH[e.pointerId];if(!s)return;e.preventDefault();const r=stick.getBoundingClientRect(),R=sBase.offsetWidth/2;let dx=e.clientX-r.left-s.ox,dy=e.clientY-r.top-s.oy;const m=Math.hypot(dx,dy);
if(m>R){s.ox+=dx*(1-R/m);s.oy+=dy*(1-R/m);dx*=R/m;dy*=R/m}
stickPos(s.ox+dx,s.oy+dy,s.ox,s.oy);const u=dy<-R*.5;if(u&&!tk.u)vib(8);tk.l=dx<-R*.3;tk.r=dx>R*.3;tk.u=u;tk.d=dy>R*.5});
function stickEnd(e){if(!TCH[e.pointerId])return;delete TCH[e.pointerId];tk.l=tk.r=tk.u=tk.d=0;stick.classList.remove('on');for(const el of[sBase,sKnob])el.style.left=el.style.top=''}
function hitBtn(x,y){let best=null,bd=1e9;for(const b of AB){const r=b.getBoundingClientRect(),d=Math.hypot(x-r.left-r.width/2,y-r.top-r.height/2)/(r.width/2);if(d<bd){bd=d;best=b}}return bd<1.45?best:null}
const held=k=>Object.values(TCH).some(s=>s.t=='a'&&s.k==k);
function actSet(id,b){const s=TCH[id],old=s.k,k=b?b.dataset.k:null;if(old==k)return;s.k=k;
if(old&&!held(old)){tk[old]=0;AB.find(x=>x.dataset.k==old).classList.remove('on')}
if(k){tk[k]=1;b.classList.add('on');if('pkhs'.includes(k))TR[k]=T;vib(k=='b'?8:15)}}
acts.addEventListener('pointerdown',e=>{e.preventDefault();au();cap(acts,e);TCH[e.pointerId]={t:'a',k:null};actSet(e.pointerId,hitBtn(e.clientX,e.clientY))});
acts.addEventListener('pointermove',e=>{if(TCH[e.pointerId]){e.preventDefault();actSet(e.pointerId,hitBtn(e.clientX,e.clientY))}});
function actEnd(e){if(!TCH[e.pointerId])return;actSet(e.pointerId,null);delete TCH[e.pointerId]}
for(const n of['pointerup','pointercancel','lostpointercapture']){stick.addEventListener(n,stickEnd);acts.addEventListener(n,actEnd)}
function touchReset(){for(const id in TCH)delete TCH[id];for(const k of'lrudbpkhs')tk[k]=0;AB.forEach(b=>b.classList.remove('on'));stick.classList.remove('on');for(const el of[sBase,sKnob])el.style.left=el.style.top=''}
$('#tc').addEventListener('contextmenu',e=>e.preventDefault());
$('#o-mus').oninput=e=>O.mus=+e.target.value;$('#o-sfx').oninput=e=>O.sfx=+e.target.value;
$('#o-touch').onclick=e=>{O.touch=(O.touch+1)%3;e.target.textContent=['AUTO','SEMPRE','NASCOSTI'][O.touch]};
$('#o-fx').onclick=e=>{FXON=FXON?0:1;e.target.textContent=FXON?'SI':'NO'};
$('#o-vib').onclick=e=>{O.vib=!O.vib;e.target.textContent=O.vib?'SI':'NO'};
$('#o-mus').value=O.mus;$('#o-sfx').value=O.sfx;
/* il buffer del canvas segue le proporzioni dello schermo (crisp in portrait e landscape) */
function fit(){if(!cv.getBoundingClientRect)return;const r=cv.getBoundingClientRect();if(r.width<2||r.height<2)return;const h=Math.max(384,Math.min(1760,Math.round(704*r.height/r.width)));if(cv.width!=704||cv.height!=h){cv.width=704;cv.height=h}
ZP=h>704?Math.max(1,Math.min(2.2,h*.3/211)):1}/* il campo (XMIN..XMAX) lo imposta arenaFit; in verticale la telecamera scorre */
addEventListener('resize',fit);fit();
for(const f of LD.q1)f();LD.q1=[];ldShow();
requestAnimationFrame(loop);
