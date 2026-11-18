let pauseReturnFocus=null;
function setPaused(p){
  if(p&&state!=='play'&&state!=='dying'&&state!=='warp') return;
  const was=paused;
  paused=p; renderedPaused=false; $('pause').classList.toggle('hide',!p); syncButtons();
  if(!p&&typeof refreshShadowMap==='function') refreshShadowMap();
  // Resume from the current time: otherwise the first frame runs a clamped 50 ms catch-up step.
  if(!p&&was&&typeof onDocumentVisible==='function') onDocumentVisible();
  if(AUD.ac){ try{ p?AUD.ac.suspend():AUD.ac.resume(); }catch(e){} }
  if(typeof wakeRenderLoop==='function') wakeRenderLoop();
  // Keyboard users land on RESUME when the pause panel opens, and go back where they were after.
  if(p&&!was){ pauseReturnFocus=document.activeElement; requestAnimationFrame(()=>{ if(paused) $('resume').focus({preventScroll:true}); }); }
  else if(!p&&was){
    const back=pauseReturnFocus; pauseReturnFocus=null;
    if(back&&back!==document.body&&back.getClientRects&&back.getClientRects().length) back.focus({preventScroll:true});
    else if($('pause').contains(document.activeElement)) document.activeElement.blur();
  }
}
/** Menu / tutorial cards freeze the sim like a pause, but without the pause panel. */
let uiHold=false;
const uiHoldKeys=new Set();
function setUiHold(key,on){
  if(on) uiHoldKeys.add(key); else uiHoldKeys.delete(key);
  const next=uiHoldKeys.size>0;
  if(next===uiHold) return;
  uiHold=next; renderedPaused=false;
  if(!next&&typeof refreshShadowMap==='function') refreshShadowMap();
  if(!next&&typeof onDocumentVisible==='function') onDocumentVisible();
  if(typeof wakeRenderLoop==='function') wakeRenderLoop();
}
function setView(far){ viewFar=far; store.set('viewFar',far); syncButtons(); }
function setMuted(m){ AU.muted=m; store.set('muted',m); if(AUD.ac) AUD.sfx.gain.value=m?0:1; syncButtons(); }
function setMusic(on){ MUS.on=on; store.set('music',on); audio(); if(AUD.ac){ AUD.mus.gain.value=on?0.6:0; MUS.next=0; } if(typeof syncAmbientMusic==='function') syncAmbientMusic(); syncButtons(); }
function syncButtons(){
  $('bMus').textContent=MUS.on?'♪':'×';
  $('sBtn').textContent=tr('pause.soundLine',{state:AU.muted?tr('pause.stateOff'):tr('pause.stateOn')});
  $('mBtn').textContent=tr('pause.musicLine',{state:MUS.on?tr('pause.stateOn'):tr('pause.stateOff')});
  $('vBtn').textContent=viewFar?tr('pause.viewPlanet'):tr('pause.viewClose');
  $('bView').classList.toggle('on',viewFar); $('bView2').textContent=viewFar?'◉':'◎';
  const qName=tr('settings.quality.'+qLevel);
  const qLabel=qMode==='auto'?tr('settings.quality.auto')+' ('+qName+')':qName;
  $('qBtn').textContent=tr('pause.qualityLine',{label:qLabel});
  // Toolbar: state for assistive tech, a tooltip for mouse users, and a pause glyph that flips.
  const bP=$('bPause'), bV=$('bView2'), bM=$('bMus');
  bP.textContent=paused?'▶':'❚❚';
  bP.setAttribute('aria-label',tr(paused?'toolbar.resumeAria':'toolbar.pauseAria'));
  bP.setAttribute('aria-pressed',String(!!paused));
  bV.setAttribute('aria-pressed',String(!!viewFar));
  bM.setAttribute('aria-pressed',String(!!MUS.on));
  for(const b of [bP,bV,bM]) b.title=b.getAttribute('aria-label')||'';
}
const KEYS={ArrowUp:0,KeyW:0,ArrowRight:1,KeyD:1,ArrowDown:2,KeyS:2,ArrowLeft:3,KeyA:3};
/** A modal UI layer (tutorial card, hamburger menu) owns the keyboard while it is open. */
function uiModalOpen(){
  const tut=document.getElementById('tutorialDialog'), menu=document.getElementById('menuPanel');
  return !!((tut&&!tut.classList.contains('hide'))||(menu&&!menu.classList.contains('hide')));
}
addEventListener('keydown',e=>{
  if(uiModalOpen()) return;
  const t=e.target;
  // Form controls keep their own keys (arrows change a select, Space ticks a checkbox).
  if(t&&t.closest&&t.closest('input,select,textarea')) return;
  // Enter/Space on a focused button is a native click; handling it here too started games twice.
  if((e.code==='Enter'||e.code==='Space'||e.code==='NumpadEnter')&&t&&t.closest&&t.closest('button,a[href]')) return;
  if(KEYS[e.code]!==undefined){ e.preventDefault(); if(state==='title'){ startGame(); return; } if(!paused) want=KEYS[e.code]; return; }
  if(e.code==='Space'){ e.preventDefault(); setView(!viewFar); }
  else if(state==='win'){ /* win overlay handles Esc / Enter */ }
  else if(e.code==='KeyP'||e.code==='Escape'){ setPaused(!paused); }
  else if(e.code==='KeyM'){ setMusic(!MUS.on); }
  else if(e.code==='Enter'&&(state==='title'||state==='over')) startGame();
});
document.querySelectorAll('#pad button[data-d]').forEach(b=>b.addEventListener('pointerdown',e=>{ e.preventDefault(); if(!paused) want=+b.dataset.d; }));
$('bView').addEventListener('pointerdown',e=>{ e.preventDefault(); setView(!viewFar); });
$('bView2').addEventListener('click',()=>setView(!viewFar));
const ray=new THREE.Raycaster();
let sx0=0,sy0=0,sid=-1,slideDrag=null;
function slotAtClient(clientX,clientY){
  if(state!=='play') return null;
  const rc=stageEl.getBoundingClientRect();
  ray.setFromCamera({x:((clientX-rc.left)/rc.width)*2-1,y:-(((clientY-rc.top)/rc.height)*2-1)},camera);
  const o=ray.ray.origin, d=ray.ray.direction, b=o.dot(d), c=o.dot(o)-1, disc=b*b-c; if(disc<0) return null;
  const t=-b-Math.sqrt(disc), px=o.x+d.x*t, py=o.y+d.y*t, pz=o.z+d.z*t;
  const gy=(LATR-Math.asin(clamp(py,-1,1)))/CH, gx=mod(Math.atan2(px,pz)/CW,GW);
  if(gy<0||gy>=GH) return null;
  return {c:Math.floor(gx/TW), r:Math.floor(gy/TH)};
}
function updateSlidePreview(e,pullOverride){
  slidePreview=null;
  if(state!=='play'||paused||tiles.some(t=>t.anim)) return;
  const slot=slotAtClient(e.clientX,e.clientY); if(!slot) return;
  const {c,r}=slot;
  if(!isMovableSlot(c,r,slotGrid)||lightSlot(c,r)<CFG.slideLight) return;
  const id=slotGrid[r][c]; if(id<0) return;
  const {dc,dr}=slideDeltaToHole(c,r,findHole());
  let pull=pullOverride!=null?pullOverride:0.22;
  if(slideDrag&&slideDrag.id===id){
    // Only the part of the drag that heads for the empty meadow pulls the island.
    const ddx=e.clientX-slideDrag.x0, ddy=e.clientY-slideDrag.y0, dir=holeScreenDir(id);
    pull=Math.max(pull,screenDragPull(dir?Math.max(0,ddx*dir[0]+ddy*dir[1]):Math.hypot(ddx,ddy)));
  }
  slidePreview={id,fc:c,fr:r,dc,dr,pull};
}
function clearSlidePreview(){ slidePreview=null; slideDrag=null; }
stageEl.addEventListener('pointerdown',e=>{
  if(e.target.closest('.panel,#tb,#overlay,#menuBtn,#menuPanel')) return;
  sx0=e.clientX; sy0=e.clientY; sid=e.pointerId;
  slideDrag=null;
  const slot=slotAtClient(e.clientX,e.clientY);
  if(slot&&isMovableSlot(slot.c,slot.r,slotGrid)&&lightSlot(slot.c,slot.r)>=CFG.slideLight){
    slideDrag={id:slotGrid[slot.r][slot.c],x0:e.clientX,y0:e.clientY};
  }
  updateSlidePreview(e,slideDrag?0.12:null);
});
function endPtr(e,cancel){
  if(e.pointerId!==sid) return; sid=-1; const drag=slideDrag; slideDrag=null;
  if(cancel||paused){ clearSlidePreview(); return; }
  const dx=e.clientX-sx0, dy=e.clientY-sy0, len=Math.hypot(dx,dy);
  if(len>24){
    // A drag that started on a slidable island and heads for the empty meadow slides it (the preview
    // already showed it moving); any other swipe steers Pip.
    const dir=drag?holeScreenDir(drag.id):null;
    if(dir&&(dx*dir[0]+dy*dir[1])/len>0.6){ const T=tiles[drag.id], msg=trySlide(T.slot.c,T.slot.r); clearSlidePreview(); if(msg){ say(tr(msg),1200); SFX.nope(); } return; }
    clearSlidePreview(); want=Math.abs(dx)>Math.abs(dy)?(dx>0?1:3):(dy>0?2:0); return;
  }
  tapAt(e); clearSlidePreview();
}
stageEl.addEventListener('pointerup',e=>endPtr(e,false));
stageEl.addEventListener('pointercancel',e=>endPtr(e,true));
stageEl.addEventListener('pointermove',e=>{
  if(state!=='play'||paused){ clearSlidePreview(); return; }
  if(e.pointerId===sid&&slideDrag) updateSlidePreview(e,null);
  else if(sid<0) updateSlidePreview(e,null);
});
stageEl.addEventListener('pointerleave',()=>{ if(sid<0) clearSlidePreview(); });
stageEl.addEventListener('wheel',e=>{ e.preventDefault(); if(Math.abs(e.deltaY)>4) setView(e.deltaY>0); },{passive:false});
function tapAt(e){
  if(state!=='play') return;
  const slot=slotAtClient(e.clientX,e.clientY); if(!slot) return;
  const msg=trySlide(slot.c,slot.r); if(msg){ say(tr(msg),1200); SFX.nope(); }
}
mapC.addEventListener('pointerdown',e=>{
  e.preventDefault(); if(state!=='play'||paused||!mapG) return;
  const rc=mapC.getBoundingClientRect(), x=(e.clientX-rc.left)*mapC.width/rc.width, y=(e.clientY-rc.top)*mapC.height/rc.height;
  const c=Math.floor((x-mapG.pad)/mapG.cw), r=Math.floor((y-mapG.top)/mapG.ch);
  if(c<0||c>=COLS||r<0||r>=ROWS) return;
  const id=slotGrid[r][c]; if(id<0) return;
  if(holeNeighbors().some(n=>n.c===c&&n.r===r)){ const msg=trySlide(c,r); if(msg){ say(tr(msg),1200); SFX.nope(); } return; }
  const T=tiles[id];
  if(waypoint===id){ waypoint=-1; say(tr('toast.waypointCleared'),800); SFX.tick(); return; }
  if(T.cleared){ say(tr('toast.waypointBloom',{num:T.num}),1000); return; }
  if(player.t===id){ say(tr('toast.waypointOn',{num:T.num}),900); return; }
  waypoint=id; say(tr('toast.waypointSet',{num:T.num}),1500); SFX.tick();
});
$('go').addEventListener('click',startGame);
$('again').addEventListener('click',()=>{ $('oBlock').classList.add('hide'); $('wBlock').classList.add('hide'); $('tBlock').classList.remove('hide'); startGame(); });
$('bPause').addEventListener('click',()=>setPaused(!paused));
$('bMus').addEventListener('click',()=>setMusic(!MUS.on));
$('mBtn').addEventListener('click',()=>setMusic(!MUS.on));
document.addEventListener('pointerdown',()=>{
  if(audio()&&AUD.ac){
    if(AUD.ac.state==='suspended'&&!paused) AUD.ac.resume().catch(()=>{});
    if(typeof initAmbAudio==='function') initAmbAudio();
    if(typeof syncAmbientGreen==='function') syncAmbientGreen();
  }
});
$('resume').addEventListener('click',()=>setPaused(false));
$('sBtn').addEventListener('click',()=>setMuted(!AU.muted));
$('vBtn').addEventListener('click',()=>setView(!viewFar));
$('restart').addEventListener('click',()=>{ setPaused(false); startGame(); });
$('qBtn').addEventListener('click',()=>{ const order=['auto',2,1,0]; qMode=order[(order.indexOf(qMode)+1)%order.length]; store.set('quality',qMode); qLevel=qLevelFor(qMode); perfRestart(); applyQuality(); });
document.addEventListener('visibilitychange',()=>{
  if(document.hidden){
    if(state==='play'||state==='warp'||state==='dying') setPaused(true);
    if(AUD.ac&&AUD.ac.state==='running') AUD.ac.suspend().catch(()=>{});
    return;
  }
  if(typeof onDocumentVisible==='function') onDocumentVisible();
  if(typeof wakeRenderLoop==='function') wakeRenderLoop();
  if(AUD.ac&&AUD.ac.state==='suspended'&&!paused) AUD.ac.resume().catch(()=>{});
});
