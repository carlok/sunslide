let fxDpr=1;
const floaters=[];
function floatAt(pos,txt,col){ floaters.push({p:pos.clone(),txt,col,t:0}); }
function proj(v){ _P.copy(v).project(camera); return [(_P.x+1)/2*fxc.width,(1-_P.y)/2*fxc.height,_P.z]; }
function onScreen(v,m=0){ const cp=camera.position; if(v.x*(cp.x-v.x)+v.y*(cp.y-v.y)+v.z*(cp.z-v.z)<=0) return null; const s=proj(v); return (s[0]>m&&s[1]>m&&s[0]<fxc.width-m&&s[1]<fxc.height-m&&s[2]<1)?s:null; }
function edgeArrow(target,color,time,label){
  latLonFrame(camLat,camLon,_e1,_E2,_N2);
  _P.copy(target).normalize(); const d=_e1.dot(_P); _P.addScaledVector(_e1,-d);
  const sx=_P.dot(_E2), sy=_P.dot(_N2); if(Math.hypot(sx,sy)<1e-5) return;
  const ang=Math.atan2(-sy,sx), W=fxc.width, H=fxc.height, mg=24*fxDpr, a=W/2-mg, b=H/2-mg, c=Math.cos(ang), s=Math.sin(ang);
  const t=1/Math.sqrt((c*c)/(a*a)+(s*s)/(b*b)), x=W/2+c*t, y=H/2+s*t, k=fxDpr*(1+0.12*Math.sin(time*6));
  fctx.save(); fctx.translate(x,y); fctx.rotate(ang); fctx.fillStyle=color; fctx.shadowColor='rgba(0,0,0,.6)'; fctx.shadowBlur=6*fxDpr;
  fctx.beginPath(); fctx.moveTo(11*k,0); fctx.lineTo(-7*k,-9*k); fctx.lineTo(-3*k,0); fctx.lineTo(-7*k,9*k); fctx.closePath(); fctx.fill(); fctx.restore();
  if(label){ fctx.save(); fctx.font=`800 ${11*fxDpr}px system-ui,sans-serif`; fctx.textAlign='center'; fctx.textBaseline='middle'; fctx.fillStyle=color; fctx.shadowColor='rgba(0,0,0,.8)'; fctx.shadowBlur=4*fxDpr; fctx.fillText(label,x-c*20*fxDpr,y-s*20*fxDpr); fctx.restore(); }
}
const _fxA=new THREE.Vector3(), _fxB=new THREE.Vector3();
// Screen-space radius (px) of a world-space radius around v, so overlay rings follow the zoom.
function screenRadius(v,worldR,s){ _fxB.setFromMatrixColumn(camera.matrixWorld,0).multiplyScalar(worldR).add(v); const b=proj(_fxB); return Math.hypot(b[0]-s[0],b[1]-s[1]); }
function drawBatRoosts(time){
  // A bat that hasn't spawned yet is invisible and harmless; mark its roost with a ring in its eye colour
  // that pulses faster as it gets ready, so the pop-in is expected.
  for(const g of bats){
    if(g.mode!=='wait') continue;
    _fxA.copy(actorPos(g.a,0.008)); const s=onScreen(_fxA,6*fxDpr); if(!s) continue;
    const ready=1-clamp(g.timer/2.5,0,1), r=Math.max(4*fxDpr,screenRadius(_fxA,0.026,s));
    const pulse=0.5+0.5*Math.sin(time*(3+10*ready)+g.idx);
    fctx.save(); fctx.globalAlpha=0.35+0.5*ready;
    fctx.fillStyle='rgba(14,6,30,.45)'; fctx.beginPath(); fctx.arc(s[0],s[1],r*(0.85+0.15*pulse),0,TAU); fctx.fill();
    fctx.strokeStyle=BATCOL[g.type%BATCOL.length]; fctx.lineWidth=1.6*fxDpr; fctx.setLineDash([3*fxDpr,3*fxDpr]); fctx.lineDashOffset=-time*12*fxDpr;
    fctx.beginPath(); fctx.arc(s[0],s[1],r*(1+0.25*pulse),0,TAU); fctx.stroke(); fctx.restore();
  }
}
function drawShield(time,dt){
  shieldFlash=Math.max(0,shieldFlash-dt);
  if(state!=='play'||invuln<=0) return;
  _fxA.copy(actorPos(player,0.03)); const s=onScreen(_fxA); if(!s) return;
  const r=screenRadius(_fxA,0.062,s), fade=Math.min(1,invuln/0.8), f=shieldFlash/0.35;
  fctx.save(); fctx.globalAlpha=fade;
  fctx.fillStyle=`rgba(150,232,255,${0.08+0.18*f})`; fctx.beginPath(); fctx.arc(s[0],s[1],r*(1+0.18*f),0,TAU); fctx.fill();
  fctx.strokeStyle=`rgba(170,240,255,${0.5+0.45*f})`; fctx.lineWidth=(2+2*f)*fxDpr; fctx.beginPath(); fctx.arc(s[0],s[1],r*(1+0.04*Math.sin(time*5)+0.18*f),0,TAU); fctx.stroke();
  fctx.restore();
}
function ring(s,color,r,time){ fctx.strokeStyle=color; fctx.lineWidth=2*fxDpr; fctx.beginPath(); fctx.arc(s[0],s[1],(r+3*Math.sin(time*6))*fxDpr,0,TAU); fctx.stroke(); }
function nearestBubble(){ const pp=actorPos(player,0).normalize(); let best=null,bd=-2; for(const T of tiles){ if(!T.left) continue; for(let i=0;i<N;i++) if(T.dots[i]){ const v=cellWorld(T.id,i%TW,(i/TW)|0,0.035), d=v.clone().normalize().dot(pp); if(d>bd){bd=d;best=v;} } } return best; }
function drawFx(time,dt){
  const W=fxc.width,H=fxc.height; fctx.clearRect(0,0,W,H);
  if(state==='play'||state==='dying'){
    drawBatRoosts(time); drawShield(time,dt);
    const h=findHole(); frameAt(h.c*TW+TW/2,h.r*TH+TH/2); const hp=_R.clone();
    if(!onScreen(hp,10*fxDpr)) edgeArrow(hp,'#8be04a',time);
    if(sink&&sink.phase!=='close'){ const v=cellWorld(sink.t,sink.x,sink.y,0.01), sc=onScreen(v,8*fxDpr); if(sc) ring(sc,sink.phase==='warn'?'rgba(255,90,90,.95)':'rgba(190,120,255,.9)',14,time*2); }
    if(waypoint>=0){ const T=tiles[waypoint], p=tilePos(T); frameAt(p.x+TW/2,p.y+TH/2); const v=_R.clone().multiplyScalar(1.02); const sc=onScreen(v,10*fxDpr); if(sc) ring(sc,'rgba(255,127,184,.9)',16,time); else edgeArrow(v,'#ff7fb8',time,String(T.num)); }
    if(berry){ const v=cellWorld(berry.t,berry.x,berry.y,0.05), sc=onScreen(v,10*fxDpr); if(sc) ring(sc,'rgba(255,79,216,.9)',13,time); else edgeArrow(v,'#ff4fd8',time,'✦'); }
    if(dotsLeft>CFG.radar&&waypoint<0&&tiles[player.t].left===0){ const v=nearestBubble(); if(v&&!onScreen(v,10*fxDpr)) edgeArrow(v,'#ffd25e',time); }
    if(dotsLeft>0&&dotsLeft<=CFG.radar){
      const pp=actorPos(player,0).normalize(), off=[];
      for(const T of tiles) for(let i=0;i<N;i++) if(T.dots[i]){
        const v=cellWorld(T.id,i%TW,(i/TW)|0,0.035), s=onScreen(v);
        if(s){ const r=(10+4*Math.sin(time*6))*fxDpr; fctx.strokeStyle='rgba(255,210,94,.9)'; fctx.lineWidth=2*fxDpr; fctx.beginPath(); fctx.arc(s[0],s[1],r,0,TAU); fctx.stroke(); }
        else off.push([v,-v.clone().normalize().dot(pp)]);
      }
      off.sort((a,b)=>a[1]-b[1]); for(const [v] of off.slice(0,3)) edgeArrow(v,'#ffd25e',time);
    }
  }
  fctx.textAlign='center'; fctx.font=`800 ${15*fxDpr}px system-ui,sans-serif`;
  for(let i=floaters.length-1;i>=0;i--){
    const f=floaters[i]; f.t+=dt; if(f.t>1.1){ floaters.splice(i,1); continue; }
    const s=onScreen(f.p); if(!s) continue;
    fctx.globalAlpha=1-f.t/1.1; fctx.fillStyle=f.col; fctx.shadowColor='rgba(0,0,0,.7)'; fctx.shadowBlur=4*fxDpr;
    fctx.fillText(f.txt,s[0],s[1]-f.t*36*fxDpr);
  }
  fctx.globalAlpha=1; fctx.shadowBlur=0;
}
