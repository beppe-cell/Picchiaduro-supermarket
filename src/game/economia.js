/* game/economia.js - Cedolini (REW), personaggi da comprare (locked), skin: possesso, acquisto, caricamento (skinSet). */
/* REW: cedolini guadagnati a fine incontro dal giocatore. win/lose = vittoria o sconfitta, round = per
   ogni round vinto, perfect = round vinto senza subire danni, tour = torneo completato. Il totale e'
   moltiplicato per la difficolta' della CPU: x(1 + (lv-2)*lvk), lv da 1 a 5 */
const REW={win:50,lose:15,round:10,perfect:20,tour:150,lvk:.15};
/* skin alternative in vendita nel negozio: SKINS.<NOME> = [{id,n,p}]
   id = cartella assets/characters/<d>/skin-<id>/ con gli stessi nomi di file dell'originale
   (<d>-<animazione>.webp, proiettile, <d>-front.webp): un file che manca resta quello originale.
   n = nome nel negozio, p = prezzo in cedolini, nf = fotogrammi delle animazioni che nella skin sono in
   numero diverso dall'originale (es. {fall:2,win:2}), ov = valori di SPRSET diversi (es. pjo, l'uscita
   del proiettile della speciale). ORIGINALE ('base') e' sempre posseduta.
   Esempio: BEPPE:[{id:'natale',n:'BABBO BEPPE',p:1500}] (prezzi tra 1500 e 5000) con i file in assets/characters/beppe/skin-natale/ */
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
const sk=(SKINS[n]||[]).find(k=>k.id==id)||{},ss=SKC[key]={...base,...(sk.special?{...sk.special.fields,spc:sk.special}:{}),...(sk.ov||{}),/* la skin puo cambiare la speciale (special) o singoli valori (ov) */n:{...base.n,...(sk.nf||{})},im:{},left:0,skin:id},P='assets/characters/'+base.d+'/';
const one=(file,set,a)=>{ss.left++;const im=new Image();let fb=0;im.onload=()=>{ss.left--;set&&set(im)};
im.onerror=()=>{if(fb++)ss.left--;else{if(a)ss.n[a]=base.n[a];im.src=P+file+'.webp?v='+VER}};im.src=P+'skin-'+id+'/'+file+'.webp?v='+VER;return im};
ss.front=one(base.d+'-front');for(const a of Object.keys(base.n))one(base.d+'-'+a,im=>{ss.im[a]=im},a);if(ss.pj)ss.pi=one(ss.pj);/* proiettile: quello della skin (special con oggetto proprio) o dell'originale */return ss}
const wal=()=>{document.querySelectorAll('.wallet').forEach(e=>e.textContent=SAVE.ced+' CEDOLINI');const pc=$('#pchip');if(pc)pc.textContent=SAVE.n};
