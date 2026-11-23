/* ui/selezione.js - Scelta del dipendente. */
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
