let mapDpr=1, mapG=null;
function rrect(g,x,y,w,h,r){ g.beginPath(); g.moveTo(x+r,y); g.arcTo(x+w,y,x+w,y+h,r); g.arcTo(x+w,y+h,x,y+h,r); g.arcTo(x,y+h,x,y,r); g.arcTo(x,y,x+w,y,r); g.closePath(); }
function drawMap(time){
  const W=mapC.width,H=mapC.height,g=mctx; if(!W||!H||!tiles.length) return;
  const k=mapDpr, top=13*k, pad=3*k, cw=(W-pad*2)/COLS, ch=(H-top-pad)/ROWS;
  mapG={top,pad,cw,ch};
  g.clearRect(0,0,W,H);
  g.fillStyle='#2c6627'; rrect(g,pad,top,W-pad*2,H-top-pad,6*k); g.fill();
  g.textAlign='center'; g.textBaseline='middle'; g.font=`700 ${10*k}px system-ui,sans-serif`; g.fillStyle='rgba(255,255,255,0.3)';
  for(let r=0;r<ROWS;r++) for(let c=0;c<COLS;c++){ const n=r*COLS+c+1; if(n<=NT) g.fillText(n,pad+c*cw+cw/2,top+r*ch+ch/2); }
  g.save(); g.beginPath(); g.rect(pad,top,W-pad*2,H-top-pad); g.clip();
  const elig=(state==='play'&&!tiles.some(t=>t.anim))?holeNeighbors().map(n=>slotGrid[n.r][n.c]):[];
  for(const T of tiles){ const p=tilePos(T); for(const off of (T.anim?[0,-COLS,COLS]:[0])){ const sx=p.x/TW+off; if(sx<-1||sx>COLS) continue; mapIsland(T,sx,p.y/TH,elig.includes(T.id),time); } }
  const dot=(w,r,fill,stroke)=>{ for(const off of [0,-GW,GW]){ const x=pad+(w[0]+off)/TW*cw, y=top+w[1]/TH*ch; g.beginPath(); g.arc(x,y,r,0,TAU); g.fillStyle=fill; g.fill(); if(stroke){ g.lineWidth=1.5*k; g.strokeStyle=stroke; g.stroke(); } } };
  for(const b of bats){ if(b.mode==='dead'||b.mode==='gone') continue; const w=actorWorld(b.a);
    dot(w,3.2*k,fright>0&&!b.asleep?'#9fb2ff':'#2a1f46',BATCOL[b.type]);
    if(b.asleep){ g.fillStyle='#dfe6ff'; g.font=`800 ${8*k}px system-ui`; g.fillText('z',pad+w[0]/TW*cw+5*k,top+w[1]/TH*ch-5*k); } }
  if(sink){ const T=tiles[sink.t], p=tilePos(T); dot([mod(p.x+sink.x+0.5,GW),p.y+sink.y+0.5],2.8*k,'#1a0830','#b07bff'); }
  if(berry){ const T=tiles[berry.t], p=tilePos(T); const r=(3+1.2*Math.sin(time*7))*k; dot([mod(p.x+berry.x+0.5,GW),p.y+berry.y+0.5],r,'#ff4fd8','#ffffff'); }
  dot(actorWorld(player),3.8*k,'#2fc4ea','#ffffff');
  g.restore();
  const sx=pad+(mod(sunLon,TAU)/CW)/TW*cw;
  for(const off of [0,-(W-2*pad),(W-2*pad)]){ const x=sx+off; if(x<0||x>W) continue;
    g.fillStyle='#ffd25e'; g.beginPath(); g.arc(x,top/2,3.5*k,0,TAU); g.fill();
    g.strokeStyle='rgba(255,210,94,.8)'; g.lineWidth=1.2*k; for(let i=0;i<8;i++){ const a=i/8*TAU; g.beginPath(); g.moveTo(x+Math.cos(a)*5*k,top/2+Math.sin(a)*5*k); g.lineTo(x+Math.cos(a)*7*k,top/2+Math.sin(a)*7*k); g.stroke(); } }
}
function mapIsland(T,sx,sy,elig,time){
  const g=mctx,k=mapDpr,{top,pad,cw,ch}=mapG, x=pad+sx*cw+1.5*k, y=top+sy*ch+1.5*k, w=cw-3*k, h=ch-3*k, p=tilePos(T);
  g.save(); rrect(g,x,y,w,h,4*k); g.clip();
  g.fillStyle=PALETTE[T.id]; g.fillRect(x,y,w,h);
  for(let s=0;s<8;s++){ const L=lightAt(p.x+s+0.5,p.y+TH/2); g.fillStyle=`rgba(6,8,30,${((1-L)*0.55).toFixed(3)})`; g.fillRect(x+w*s/8-0.5,y,w/8+1,h); }
  const cx=w/TW, cy=h/TH;
  for(let i=0;i<N;i++){ const v=T.dots[i]; if(!v) continue;
    g.fillStyle=v===2?'#ffd25e':'rgba(255,255,255,0.95)'; g.beginPath(); g.arc(x+((i%TW)+0.5)*cx,y+(((i/TW)|0)+0.5)*cy,(v===2?1.9:1.05)*k,0,TAU); g.fill(); }
  g.restore();
  const home=isHome(T);
  g.lineWidth=(home?2.2:1)*k; g.strokeStyle=home?'#ffd25e':'rgba(255,255,255,0.28)'; rrect(g,x,y,w,h,4*k); g.stroke();
  g.shadowColor='rgba(0,0,0,.75)'; g.shadowBlur=3*k; g.fillStyle='#fff'; g.font=`800 ${10*k}px system-ui,sans-serif`; g.textAlign='left'; g.textBaseline='top';
  g.fillText(T.num,x+2.5*k,y+1.5*k);
  g.textAlign='right'; g.textBaseline='bottom';
  if(T.cleared){ g.fillStyle='#ffb3d9'; g.font=`${10*k}px system-ui,sans-serif`; g.fillText('✿',x+w-2*k,y+h-0.5*k); }
  else { g.fillStyle=T.left<=4?'#ffc2e6':'rgba(255,255,255,0.85)'; g.font=`800 ${8.5*k}px system-ui,sans-serif`; g.fillText(T.left,x+w-2.5*k,y+h-1*k); }
  g.shadowBlur=0;
  if(home){ g.fillStyle='#ffd25e'; g.font=`${8*k}px system-ui,sans-serif`; g.textAlign='right'; g.textBaseline='top'; g.fillText('★',x+w-2*k,y+1*k); }
  if(!T.cleared&&T.left<=4){ g.lineWidth=1.6*k; g.strokeStyle=`rgba(255,150,210,${(0.45+0.45*Math.sin(time*6)).toFixed(3)})`; rrect(g,x+1.5*k,y+1.5*k,w-3*k,h-3*k,3*k); g.stroke(); }
  if(waypoint===T.id){ g.lineWidth=2.4*k; g.strokeStyle='#ff7fb8'; g.setLineDash([4*k,2.5*k]); g.lineDashOffset=-time*12*k; rrect(g,x-1.5*k,y-1.5*k,w+3*k,h+3*k,5*k); g.stroke(); g.setLineDash([]); }
  if(T.id===padSelectedId()){ g.lineWidth=3*k; g.strokeStyle='#ffffff'; rrect(g,x-2*k,y-2*k,w+4*k,h+4*k,6*k); g.stroke(); }
  if(elig){ const lit=lightSlot(T.slot.c,T.slot.r)>=CFG.slideLight; g.lineWidth=2*k;
    g.strokeStyle=lit?`${mapEligLitPrefix}${(0.55+0.45*Math.sin(time*5)).toFixed(3)})`:mapEligDarkStroke;
    if(!lit) g.setLineDash([3*k,3*k]); rrect(g,x-1*k,y-1*k,w+2*k,h+2*k,5*k); g.stroke(); g.setLineDash([]); }
  g.textAlign='center'; g.textBaseline='middle';
}
