/* ---------- audio ---------- */
let AC,pl=false,mst=0,O={mus:70,sfx:80,touch:0,vib:1};
function au(){if(!AC)AC=new(window.AudioContext||window.webkitAudioContext)();if(AC.state=='suspended')AC.resume()}
function tone(f,d,ty,v,sl){if(!AC||v<=0)return;const o=AC.createOscillator(),g=AC.createGain(),n=AC.currentTime;o.type=ty;o.frequency.setValueAtTime(f,n);if(sl)o.frequency.exponentialRampToValueAtTime(sl,n+d);g.gain.setValueAtTime(v,n);g.gain.exponentialRampToValueAtTime(.001,n+d);o.connect(g).connect(AC.destination);o.start();o.stop(n+d)}
const SF={hit:[180,.1,'square',.3,60],blk:[500,.06,'triangle',.25],whf:[260,.07,'sawtooth',.08,120],sp:[300,.4,'sawtooth',.3,900],ko:[400,.7,'square',.3,40],ui:[660,.07,'square',.2],jp:[200,.12,'triangle',.15,500]};
function sfx(n){if(RB)return;const s=SF[n];if(s)tone(s[0],s[1],s[2],s[3]*O.sfx/100,s[4])}
setInterval(()=>{if(!AC||!pl)return;const q=(mst/12|0)%2?5:0,n=[0,3,7,12,7,3][mst%6]+q;tone(110*2**(n/12),.15,'square',.05*O.mus/100);if(mst%2==0)tone(55*2**(q/12),.2,'triangle',.09*O.mus/100);mst++},170);
