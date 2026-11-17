const QUAL=[{n:'Low',dpr:1,px:0.7e6,shadow:0,bloom:false,blades:7000,flowers:700,ff:200},{n:'Medium',dpr:1.5,px:1.4e6,shadow:1024,bloom:true,blades:15000,flowers:1500,ff:400},{n:'High',dpr:2,px:2.4e6,shadow:1024,bloom:true,blades:30000,flowers:2800,ff:600}];
let qMode=store.get('quality','auto'); if(![ 'auto',0,1,2].includes(qMode)) qMode='auto';
// After a WebGL context loss we reload one tier lower for this tab session only; the saved preference
// (often 'auto') is left alone so one bad backgrounding doesn't pin the game to Low forever.
const Q_CAP_KEY='sunslide.qCap';
const Q_CAP=(()=>{ try{ const v=sessionStorage.getItem(Q_CAP_KEY); return v==null?2:clamp(Math.round(+v)||0,0,2); }catch(e){ return 2; } })();
function qLevelFor(mode){ return Math.min(mode==='auto'?2:mode,Q_CAP); }
let qLevel=qLevelFor(qMode), pixelRatio=1, perfStart=performance.now(), perfAcc=0, perfN=0, renderedPaused=false;
let adaptiveDprState=createAdaptiveDprState({ deviceDpr: window.devicePixelRatio||1 });
function shadowDeviceCtx(){ return { qualityShadow:QUAL[qLevel].shadow, coarsePointer:matchMedia('(pointer: coarse)').matches, hardwareConcurrency:navigator.hardwareConcurrency, deviceMemory:navigator.deviceMemory, viewportWidth:stageEl.clientWidth }; }
function applyQuality(){
  const q=QUAL[qLevel];
  useBloom=q.bloom;
  if(useBloom) schedulePostPipelineLoad();
  const sh=resolveShadowSettings(shadowDeviceCtx());
  sunL.castShadow=sh.enabled;
  if(sh.enabled&&sunL.shadow.mapSize.x!==sh.mapSize){ sunL.shadow.mapSize.set(sh.mapSize,sh.mapSize); if(sunL.shadow.map){ sunL.shadow.map.dispose(); sunL.shadow.map=null; } }
  else if(!sh.enabled&&sunL.shadow.map){ sunL.shadow.map.dispose(); sunL.shadow.map=null; }
  // A freed map renders as fully shadowed in three r160 until redrawn; force a redraw even if paused.
  refreshShadowMap();
  blades.geometry.instanceCount=q.blades; flowers.count=q.flowers; ffPts.geometry.setDrawRange(0,q.ff);
  resize(); syncButtons();
}
function perfSample(ms){
  if(qMode!=='auto'||qLevel===0||state!=='play'||paused||uiHold||performance.now()-perfStart<4000){ perfAcc=perfN=0; return; }
  perfAcc+=ms; if(++perfN>=90){ const avg=perfAcc/perfN; perfAcc=perfN=0; if(avg>24){ qLevel--; applyQuality(); perfStart=performance.now(); } }
}
function resize(){
  const w=Math.max(1,stageEl.clientWidth), h=Math.max(1,stageEl.clientHeight), q=QUAL[qLevel];
  const area=w*h, budgetPr=Math.sqrt(q.px/area);
  const minPr=useBloom?(area>1.2e6?0.85:0.75):0.6;
  const deviceCap=capDevicePixelRatio(window.devicePixelRatio||1,2);
  syncAdaptiveCap(adaptiveDprState,window.devicePixelRatio||1,2);
  const basePr=Math.max(minPr,Math.min(deviceCap,q.dpr,budgetPr));
  pixelRatio=effectivePixelRatio(basePr,adaptiveDprState);
  renderer.setPixelRatio(pixelRatio); renderer.setSize(w,h,false);
  if(composer){ composer.setPixelRatio(pixelRatio); composer.setSize(w,h); }
  camera.aspect=w/h; camera.updateProjectionMatrix();
  fxDpr=Math.min(2,deviceCap); fxc.width=Math.round(w*fxDpr); fxc.height=Math.round(h*fxDpr);
  mapDpr=Math.min(2,deviceCap); mapC.width=Math.round(mapC.clientWidth*mapDpr); mapC.height=Math.round(mapC.clientHeight*mapDpr);
  starMat.uniforms.uDpr.value=pixelRatio; renderedPaused=false;
  // Resizing clears the canvases; while paused the loop is asleep, so wake it for one redraw.
  if(paused||uiHold) wakeRenderLoop();
}
new ResizeObserver(()=>resize()).observe(stageEl);
new ResizeObserver(()=>resize()).observe(mapC);
let lastT=0, renderLoopActive=false, pendingClockAlign=false;
function wakeRenderLoop(){
  if(renderLoopActive) return;
  renderLoopActive=true;
  requestAnimationFrame(frame);
}
function onDocumentVisible(){ pendingClockAlign=true; }
addEventListener('pointerdown',()=>wakeRenderLoop(),{passive:true});
addEventListener('keydown',()=>wakeRenderLoop());
/* ---------- gamepad (standard mapping) ---------- */
const PAD={idx:-1,prev:[],sel:-1};
addEventListener('gamepadconnected',e=>{ PAD.idx=e.gamepad.index; PAD.sel=-1; say(tr('toast.gamepadOn'),2200); });
addEventListener('gamepaddisconnected',e=>{ if(e.gamepad.index===PAD.idx){ PAD.idx=-1; say(tr('toast.gamepadOff'),1200); } });
function padChoices(){
  if(state!=='play'||tiles.some(t=>t.anim)) return [];
  const pt=tiles[player.t].slot;
  return holeNeighbors().map(n=>({c:n.c,r:n.r,id:slotGrid[n.r][n.c],lit:lightSlot(n.c,n.r)>=CFG.slideLight,d:slotDist(n,pt)}))
    .filter(o=>o.id>=0).sort((a,b)=>(b.lit-a.lit)||(a.d-b.d));
}
function padSelectedId(){ if(PAD.idx<0) return -1; const ch=padChoices(); if(!ch.length) return -1; return ch[clamp(PAD.sel,0,ch.length-1)].id; }
function padSelect(dir){
  const ch=padChoices(); if(!ch.length) return;
  PAD.sel=((PAD.sel<0?0:PAD.sel)+dir+ch.length)%ch.length; const o=ch[PAD.sel];
  const num=tiles[o.id].num; say(o.lit?tr('toast.padPickLit',{num}):tr('toast.padPickDark',{num}),900); SFX.tick();
}
function padSlide(){
  const ch=padChoices(); if(!ch.length) return;
  const o=ch[clamp(PAD.sel,0,ch.length-1)], msg=trySlide(o.c,o.r);
  if(msg){ say(tr(msg),1200); SFX.nope(); } else PAD.sel=-1;
}
function pollPad(){
  const gps=navigator.getGamepads?navigator.getGamepads():[];
  let gp=PAD.idx>=0?gps[PAD.idx]:null;
  if(!gp) for(const g of gps) if(g&&g.connected){ gp=g; PAD.idx=g.index; break; }
  if(!gp) return;
  // Menu / tutorial cards own input while open (their buttons are reachable by keyboard/touch).
  if(uiModalOpen()){ PAD.prev=gp.buttons.map(x=>x.pressed); return; }
  const b=i=>!!(gp.buttons[i]&&gp.buttons[i].pressed), hit=i=>b(i)&&!PAD.prev[i];
  if(gp.buttons.some(x=>x.pressed)) audio();
  const ax=gp.axes[0]||0, ay=gp.axes[1]||0; let d=-1;
  if(b(12)) d=0; else if(b(13)) d=2; else if(b(14)) d=3; else if(b(15)) d=1;
  else if(Math.hypot(ax,ay)>0.5) d=Math.abs(ax)>Math.abs(ay)?(ax>0?1:3):(ay>0?2:0);
  if(state==='title'){ if(hit(0)||hit(9)) startGame(); }
  else if(state==='over'){ if(hit(0)||hit(9)) $('again').click(); }
  else {
    if(hit(9)) setPaused(!paused);
    else if(paused){ if(hit(0)||hit(1)) setPaused(false); }
    else {
      if(d>=0) want=d;
      if(hit(4)) padSelect(-1); if(hit(5)) padSelect(1);
      if(hit(0)) padSlide();
      if(hit(2)||hit(3)) setView(!viewFar);
    }
    if(hit(8)) setMusic(!MUS.on);
  }
  PAD.prev=gp.buttons.map(x=>x.pressed);
}
// Gamepad buttons fire no DOM events, so once a paused frame lets the rAF loop sleep, keep polling
// the pad on a timer; otherwise Start could pause the game but never resume it.
let padIdleTimer=0;
function schedulePadIdlePoll(){
  if(padIdleTimer||PAD.idx<0) return;
  padIdleTimer=setTimeout(padIdlePoll,100);
}
function padIdlePoll(){
  padIdleTimer=0;
  if(renderLoopActive||PAD.idx<0||document.hidden) return;
  pollPad();
  schedulePadIdlePoll();
}
function frame(ts){
  const held=paused||uiHold;
  const plan=planRenderLoopFrame({
    documentHidden:document.hidden,
    gameState:state,
    paused:held,
    tilesAnimating:tiles.some(t=>t.anim),
    renderedPaused,
  });
  if(plan.continueLoop){ requestAnimationFrame(frame); renderLoopActive=true; }
  else { renderLoopActive=false; schedulePadIdlePoll(); }

  if(pendingClockAlign){ lastT=resumeClockAfterHidden(ts/1000); pendingClockAlign=false; }
  const now=ts/1000;
  const dt=plan.advanceClock?Math.min(0.05,Math.max(0.0001,(now-lastT)||0.016)):0;
  if(plan.advanceClock) lastT=now;
  if(plan.advanceClock&&!window.__ssSmokeNoFullscreen&&tickAdaptiveDpr(adaptiveDprState,dt*1000)) resize();
  perfSample(dt*1000);
  pollPad();
  if(plan.simulate&&!held) update(dt);
  if(!plan.render) return;
  syncScene(now,dt); render(); drawFx(now,dt); drawMap(now); hud();
  renderedPaused=held;
}
