/* core/loader.js - Caricamento delle immagini in due fasi (LD, ldImg) e degli sprite di tutti i personaggi. */
/* sprite dei personaggi: 1 riga per animazione in assets/characters/<nome>/, corpo in piedi normalizzato a 400px, piedi sul bordo inferiore, rivolti a destra.
   n = frame per animazione; pj = proiettile dello speciale (pjn frame); spT = soglie (tick) dei frame dello speciale se diverse dallo standard.
   hit/win sono opzionali: se mancano si usa la posa idle (inclinata quando colpito). */
const SPRB=400,VER=74;
/* proiettile a più frame: pjh altezza e pjy bordo superiore (rispetto alla linea del proiettile), pji = il 1o frame è solo l'avvio;
   pjg = l'effetto cresce frame dopo frame e resta sull'ultimo (onda di LUIS);
   pjf = fotogramma fisso (carrello di MATTEO dritto, senza ruotare); pjt = corre sempre sul pavimento, anche se lanciato in salto;
   carrello: alto ~58% di un personaggio (come uno vero), pjy porta le ruote sul pavimento;
   sc = scala del personaggio (es. Vlad un po' più alto); pjo = [avanti, altezza] del punto di uscita rispetto ai piedi (es. ugello dello spruzzino), pjs = scala rispetto agli sprite:
   in quel caso il bordo sinistro del frame (la punta del getto) parte esattamente dal punto di uscita */
/* caricamento a due fasi: prima quello che serve alla schermata iniziale (prima arena e i due lottatori
   della demo), poi tutto il resto in sottofondo. Gli sprite sono WebP (tools/to_webp.py).
   LD.n/LD.t = immagini finite/totali; ss.left = immagini del personaggio ancora da caricare */
const LD={n:0,t:0,q1:[],q2:[],p1:0,t1:0},DEMO=['BEPPE','BIGBOSS'];
function ldImg(src,fase,cb){const im=new Image();LD.t++;if(fase==1){LD.p1++;LD.t1++}
const fine=ok=>{LD.n++;cb&&cb(ok);if(fase==1&&!--LD.p1){for(const f of LD.q2)f();LD.q2=[]}ldShow()};
im.onload=()=>fine(1);im.onerror=()=>fine(0);(fase==1?LD.q1:LD.q2).push(()=>{im.src=src+'?v='+VER});return im}
function ldShow(){const b=$('#s-title .blink');if(b)b.textContent=LD.p1>0?'CARICAMENTO '+(100*(LD.t1-LD.p1)/LD.t1|0)+'%':'TOCCA O PREMI UN TASTO';
const lp=$('#ld-p');if(lp)lp.textContent=(100*LD.n/LD.t|0)+'%'}
const ready=ss=>!ss||!ss.left;
for(const [k,ss] of Object.entries(SPRSET)){const fase=DEMO.includes(k)?1:2,P='assets/characters/'+ss.d+'/';ss.im={};ss.left=0;
const add=(src,set)=>{ss.left++;return ldImg(P+src+'.webp',fase,ok=>{ss.left--;if(ok&&set)set()})};
/* vista frontale per la selezione (tools/build_fronts.py) */
ss.front=ldImg(P+ss.d+'-front.webp',fase);
for(const a of Object.keys(ss.n)){const im=add(ss.d+'-'+a,()=>{ss.im[a]=im})}
if(ss.pj)ss.pi=add(ss.pj)}
{const v=document.getElementById('ver');if(v)v.textContent='v'+VER}
