/* ---------- UI ---------- */
let selI=0,lastPT='mouse';
const selList=()=>mode=='net'&&NET&&NET.rk?rkList():CH.map((L,i)=>i).filter(i=>!locked(CH[i].n));/* RANKED: solo i dipendenti normali *//* i personaggi da comprare (PRZ) non si scelgono */
function setSel(i,dir){selI=i;const rk=mode=='net'&&NET&&NET.rk,L=rk?rkL(CH[i]):CH[i],cl=v=>Math.round(Math.min(1,Math.max(.12,v))*100)+'%';$('#pvn').textContent=L.n;
$('#pvs').style.width=cl((L.sp-1.1)/.8);$('#pvp').style.width=cl((L.pw-.75)/.6);$('#pvx').innerHTML='SPECIALE: <b>'+((skinsOf(L.n).find(k=>k.id==eqSkin(L.n))||{}).ms||L.ms||'CARRELLINO')+'</b>'+(rk?' <span style="color:#7fe8d6">· RANKED: VELOCITÀ E POTENZA UGUALI PER TUTTI</span>':L.big?' <span style="color:#ff6a6a">· BOSS</span>':MINI.includes(L.n)?' <span style="color:#ffb347">· MINI BOSS</span>':'')+(eqSkin(L.n)!='base'?' · SKIN: <b>'+skinsOf(L.n).find(k=>k.id==eqSkin(L.n)).n+'</b>':'');
const L2=selList();$('#dots').innerHTML=L2.map(j=>'<i class="'+(j==i?'on':'')+'"></i>').join('');
const cv=$('#pvc');if(dir){cv.classList.remove('in','inl');void cv.offsetWidth;cv.classList.add(dir>0?'in':'inl')}}
/* scorre al dipendente precedente/successivo (in giro) */
function selStep(d){const L=selList(),j=L.indexOf(selI),n=L.length;au();sfx('ui');setSel(L[(j+d+n)%n],d)}
function go(i){au();sfx('ui');if(mode=='net'){netReady(i);return}pickI=i;tour=0;if(mode=='tor'){tourPlan(i);startMatch(i,TOR[0],TLV[0])}else{let o=Math.random()*CH.length|0;while(o==i)o=Math.random()*CH.length|0;startMatch(i,o,2+(Math.random()*3|0))}}
function fillSel(){$('#sel-t').textContent=mode=='tor'?'TORNEO: SCEGLI IL DIPENDENTE':mode=='net'?(NET&&NET.rk?'RANKED CONTRO '+NET.pn+' ('+NET.pe+')':'ONLINE CONTRO '+(NET&&NET.pn||'')):'SCEGLI IL DIPENDENTE';
if(!selList().includes(selI))selI=0;setSel(selI)}
$('#sel-l').onclick=()=>selStep(-1);$('#sel-r').onclick=()=>selStep(1);
/* trascinare il dito sul personaggio: a sinistra il successivo, a destra il precedente */
{let sx=null;const st=$('#stage');st.addEventListener('pointerdown',e=>{if(!e.target.closest('.arr'))sx=e.clientX});
st.addEventListener('pointerup',e=>{if(sx==null)return;const d=e.clientX-sx;sx=null;if(Math.abs(d)>30)selStep(d<0?1:-1)});st.addEventListener('pointercancel',()=>{sx=null})}
/* anteprima a tutto schermo: vista frontale (dalla tavola di riferimento) con un leggero respiro,
   altrimenti la posa di guardia animata; altezze nelle stesse proporzioni del gioco */
function selAnim(){shopAnim();if(!$('#s-sel').classList.contains('on'))return;const sv=c,L=CH[selI],ss=SPRSET[L.n],fr=skFront(L.n,eqSkin(L.n));
try{c=$('#pvc').getContext('2d');c.imageSmoothingEnabled=false;c.clearRect(0,0,300,420);
const kk=(ss&&ss.sc||1)*(L.big?1.12:1)/1.12;/* il piu' grande (boss) occupa tutta l'altezza */
if(fr&&fr.complete&&fr.naturalWidth){const h=404*(ss.fk||kk)*(1+Math.sin(T/22)*.008),w=fr.naturalWidth*h/fr.naturalHeight;c.drawImage(fr,150-w/2,416-h,w,h)}}finally{c=sv}}
$('#b-go').onclick=()=>go(selI);
/* scheda di una skin: anteprima (vista frontale della skin, o l'originale se manca), nome, personaggio, pulsante */
const skImg=(n,id)=>{const d=SPRSET[n].d,b='assets/characters/'+d+'/'+d+'-front.webp?v='+VER;return'<img alt="" src="'+(id=='base'?b:'assets/characters/'+d+'/skin-'+id+'/'+d+'-front.webp?v='+VER)+'" onerror="this.onerror=null;this.src=\''+b+'\'">'};
const card=(n,k,btn,on)=>'<div class="card'+(on?' on':'')+'">'+skImg(n,k.id)+'<b>'+k.n+'</b><span>'+n+'</span>'+btn+'</div>';
const hook=(el,fn)=>el.querySelectorAll('[data-k]').forEach(b=>{b.addEventListener('mouseenter',()=>focusB(b));b.onclick=()=>{if(b.disabled)return;au();fn(b.dataset.n,b.dataset.k)}});
/* negozio: come la selezione, un articolo per schermata (frecce o trascinamento): prima i personaggi da
   comprare (PRZ), poi tutte le skin in vendita (SKINS); tutto si paga in cedolini */
let shI=0;
const shopItems=()=>[...Object.keys(PRZ).sort((a,b)=>PRZ[a]-PRZ[b]).map(n=>({n,p:PRZ[n]}))/* in ordine di prezzo */,...CH.flatMap(L=>(SKINS[L.n]||[]).map(k=>({n:L.n,k})))];
function shopStep(d){const L=shopItems();au();sfx('ui');shI=(shI+d+L.length)%L.length;fillShop(d)}
function fillShop(dir){wal();const L=shopItems();shI=Math.min(shI,L.length-1);const it=L[shI],n=it.n,bt=$('#sh-b'),st=(k,g)=>'<div class="st"><i><b style="width:'+(k/g*100)+'%"></b></i></div>';
if(it.p){const u=!locked(n),no=!u&&SAVE.ced<it.p;
 $('#shn').textContent=n;$('#shi').innerHTML=u?'<span class="ok">SBLOCCATO</span><span>GIOCABILE IN TUTTE LE MODALITÀ</span>':'<span>'+(CH.find(x=>x.n==n).big?'BOSS':'MINI BOSS')+' DA COMPRARE</span><span>PREZZO: <b>'+it.p+' CEDOLINI</b></span>'+(no?'<span>TI MANCANO '+(it.p-SAVE.ced)+'</span>':'');
 bt.textContent=u?'SBLOCCATO':'COMPRA';bt.disabled=u||no;bt.className='b'+(u||no?' alt':'')}
else{const o=owns(n,it.k.id),no=!o&&SAVE.ced<it.k.p;
 $('#shn').textContent=it.k.n;$('#shi').innerHTML='<span>SKIN DI <b>'+n+'</b></span>'+(o?'<span class="ok">ACQUISTATA: INDOSSALA DALLA SELEZIONE (SKIN)</span>':'<span>PREZZO: <b>'+it.k.p+' CEDOLINI</b></span>'+(no?'<span>TI MANCANO '+(it.k.p-SAVE.ced)+'</span>':''));
 bt.textContent=o?'ACQUISTATA':'COMPRA';bt.disabled=o||no;bt.className='b'+(o||no?' alt':'')}
$('#shd').innerHTML=L.map((x,j)=>'<i class="'+(j==shI?'on':'')+'"></i>').join('');
const cv=$('#shc');if(dir){cv.classList.remove('in','inl');void cv.offsetWidth;cv.classList.add(dir>0?'in':'inl')}}
$('#sh-b').onclick=()=>{const it=shopItems()[shI];if(!it||$('#sh-b').disabled)return;au();
if(it.p){if(!locked(it.n)||SAVE.ced<it.p)return;SAVE.ced-=it.p;SAVE.unl[it.n]=1;save()}
else if(!buy(it.n,it.k.id))return;sfx('ui');fillShop()};
$('#sh-l').onclick=()=>shopStep(-1);$('#sh-r').onclick=()=>shopStep(1);
{let sx=null;const st=$('#sh-st');st.addEventListener('pointerdown',e=>{if(!e.target.closest('.arr'))sx=e.clientX});
st.addEventListener('pointerup',e=>{if(sx==null)return;const d=e.clientX-sx;sx=null;if(Math.abs(d)>30)shopStep(d<0?1:-1)});st.addEventListener('pointercancel',()=>{sx=null})}
/* vista frontale di una skin per le anteprime: si scarica da sola (non tutte le animazioni); se la skin
   non ce l'ha si usa quella originale. Finche' non e' pronta l'anteprima resta vuota (niente lampo
   dell'originale) */
const SKF={};
function skFront(n,id){const B=SPRSET[n];if(id=='base')return B.front;const k=n+'/'+id;if(SKF[k])return SKF[k];
const im=SKF[k]=new Image(),P='assets/characters/'+B.d+'/';im.onerror=()=>{im.onerror=null;im.src=P+B.d+'-front.webp?v='+VER};im.src=P+'skin-'+id+'/'+B.d+'-front.webp?v='+VER;return im}
const imgOk=im=>im&&im.complete&&im.naturalWidth>0;
/* anteprima: vista frontale (della skin, se c'e'), sempre visibile anche prima dell'acquisto */
function shopAnim(){if(!$('#s-shop').classList.contains('on'))return;const it=shopItems()[shI];if(!it)return;const g=$('#shc').getContext('2d'),L=CH.find(x=>x.n==it.n),B=SPRSET[it.n];
const fr=it.k?skFront(it.n,it.k.id):B.front;g.imageSmoothingEnabled=false;g.clearRect(0,0,300,420);
if(!imgOk(fr))return;const kk=(B.sc||1)*(L.big?1.12:1)/1.12,h=404*(B.fk||kk)*(1+Math.sin(T/22)*.008),w=fr.naturalWidth*h/fr.naturalHeight;
g.drawImage(fr,150-w/2,416-h,w,h);}
/* skin del dipendente scelto in selezione: ORIGINALE e quelle comprate si indossano, le altre rimandano al negozio */
function fillSkin(){const n=CH[selI].n,eq=eqSkin(n);$('#skt').textContent='SKIN DI '+n;
$('#skl').innerHTML=skinsOf(n).map(k=>{const o=owns(n,k.id),u=eq==k.id;
return card(n,k,'<button class="b'+(u||!o?' alt':'')+'" data-n="'+n+'" data-k="'+k.id+'"'+(u||!o?' disabled':'')+'>'+(u?'IN USO':o?'INDOSSA':'NEGOZIO · '+k.p)+'</button>',u)}).join('')+
(skinsOf(n).length<2?'<div class="small empty">Per ora '+n+' ha solo la skin originale: le nuove skin si comprano nel NEGOZIO con i cedolini.</div>':'');
hook($('#skl'),(n,id)=>{equip(n,id);sfx('ui');fillSkin();setSel(selI)})}
$('#b-skin').onclick=()=>{au();sfx('ui');fillSkin();sh('s-skin')};$('#sk-x').onclick=()=>{sfx('ui');sh('s-sel')};
/* profili: elenco (USA / ELIMINA), nuovo, codice di salvataggio da copiare o da inserire */
function fillProf(){const L=Object.entries(PF.list);$('#pfl').innerHTML=L.map(([id,p])=>'<div class="pf'+(id==PF.cur?' on':'')+'"><span>'+esc(p.n)+'</span><i>'+p.ced+' CEDOLINI'+(p.rk.w+p.rk.l?' · <b style="color:'+RKD[rkDiv(p.rk.e)].c+'">'+RKD[rkDiv(p.rk.e)].n+' '+p.rk.e+'</b>':'')+'</i>'+
(id==PF.cur?'<button class="b alt" disabled>IN USO</button>':'<button class="b" data-pu="'+id+'">USA</button>')+'<button class="b alt" data-pd="'+id+'">ELIMINA</button></div>').join('');
$('#pfl').querySelectorAll('.b').forEach(b=>b.addEventListener('mouseenter',()=>focusB(b)));
$('#pfl').querySelectorAll('[data-pu]').forEach(b=>b.onclick=()=>{au();sfx('ui');useProfile(b.dataset.pu);fillProf();wal()});
$('#pfl').querySelectorAll('[data-pd]').forEach(b=>b.onclick=()=>{au();sfx('ui');pform('del',0,b.dataset.pd)})}
/* modulo: m = 'new' (nome), 'imp' (incolla un codice), 'code' (mostra il proprio codice), 'del' (conferma);
   first = primo avvio, senza profili: non si puo' tornare indietro */
let PFM={};
function pform(m,first,id){PFM={m,first,id};const I=$('#pff-i'),C=$('#pff-c'),ok=$('#pff-ok'),b2=$('#pff-2');
$('#pff-e').textContent='';I.value='';C.value='';I.style.display=m=='new'?'':'none';C.style.display=m=='imp'||m=='code'?'':'none';C.readOnly=m=='code';
$('#pff-x').style.display=first?'none':'';b2.style.display=m=='code'||(first&&m=='new')||(first&&m=='imp')?'':'none';
const T={new:[first?'BENVENUTO!':'NUOVO PROFILO',first?'Scegli il tuo nome: cedolini e skin restano salvati in questo profilo.':'Nome del nuovo profilo:','CREA'],
imp:['INSERISCI CODICE','Incolla il codice di salvataggio copiato dall\'altro dispositivo:','CARICA'],
code:['IL MIO CODICE','Copia questo codice e inseriscilo nell\'altro dispositivo (PROFILI > INSERISCI CODICE). Contiene cedolini e skin di '+SAVE.n+'.','FATTO'],
del:['ELIMINA PROFILO','Eliminare '+(PF.list[id]||{}).n+'? Cedolini e skin andranno persi (salva prima il suo codice se ti serve).','ELIMINA']}[m];
$('#pff-t').textContent=T[0];$('#pff-l').textContent=T[1];ok.textContent=T[2];b2.textContent=m=='code'?'COPIA':m=='new'?'HO UN CODICE':'NUOVO PROFILO';
if(m=='code')C.value=exportCode();sh('s-pform');if(m=='new')I.focus();else if(m=='imp')C.focus()}
$('#pf-new').onclick=()=>pform('new');$('#pf-code').onclick=()=>pform('code');$('#pf-imp').onclick=()=>pform('imp');
$('#pff-x').onclick=()=>{fillProf();sh('s-prof')};
$('#pff-i').addEventListener('input',e=>{const v=e.target.value.toUpperCase();if(v!=e.target.value)e.target.value=v});
$('#pff-2').onclick=()=>{au();sfx('ui');const {m,first}=PFM;if(m=='code'){const C=$('#pff-c');C.select();
(navigator.clipboard?navigator.clipboard.writeText(C.value):Promise.reject()).then(()=>$('#pff-e').textContent='Copiato!',()=>{try{document.execCommand('copy');$('#pff-e').textContent='Copiato!'}catch(e){$('#pff-e').textContent='Selezionalo e copialo a mano'}})}
else pform(m=='new'?'imp':'new',first)};
$('#pff-ok').onclick=()=>{au();const {m,first,id}=PFM,er=t=>{$('#pff-e').textContent=t;sfx('ui')};
if(m=='new'){const n=$('#pff-i').value.trim().replace(/\s+/g,' ').toUpperCase(),e=nameErr(n);if(e)return er(e);newProfile({n})}
else if(m=='imp'){const d=importCode($('#pff-c').value);if(!d)return er('Codice non valido: controlla di averlo copiato tutto');
let n=d.n,i=2;while(nameErr(n))n=(d.n.slice(0,10)+' '+i++).slice(0,12);newProfile({...d,n})}
else if(m=='del'){delProfile(id);if(!PF.cur)return pform('new',1)}
sfx('ui');if(first){sh('s-menu');return}fillProf();sh('s-prof')};
