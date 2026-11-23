/* ui/negozio.js - Negozio e scelta della skin. */
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
