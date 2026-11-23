/* ui/schermi.js - Schermate e navigazione: sh(), menu (GO), focus dei pulsanti, pausa. */
function sh(id){if(id=='s-menu'||id=='s-shop'||id=='s-prof')wal();document.querySelectorAll('.scr').forEach(e=>e.classList.toggle('on',e.id==id));$('#tc').classList.toggle('on',id==''&&touchOn());if(id)touchReset();if(id&&id!='s-title')focusFirst()}
const touchOn=()=>O.touch==2?false:O.touch==1||matchMedia('(pointer:coarse)').matches;
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
