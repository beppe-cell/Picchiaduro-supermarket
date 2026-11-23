/* core/base.js - Costanti di base: dimensioni del campo, canvas, $ (selettore), font. */
const W=352,H=192,FY=182,cv=document.getElementById('g');let c=cv.getContext('2d');c.scale(2,2);c.imageSmoothingEnabled=false;
const $=s=>document.querySelector(s),FT='"Press Start 2P",monospace';
