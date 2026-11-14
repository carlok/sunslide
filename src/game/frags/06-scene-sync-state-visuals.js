function syncTiles(time){
  const elig=new Set(), padSel=padSelectedId();
  if(state==='play'&&!tiles.some(t=>t.anim)) for(const n of holeNeighbors()) elig.add(slotGrid[n.r][n.c]);
  for(const T of tiles){
    const p=tilePos(T); T.uOff.value.set(p.x,p.y); T.uLift.value=liftOf(T);
    const L=lightAt(p.x+TW/2,p.y+TH/2), home=isHome(T);
    T.mLamp.emissive.copy(home?C_LAMPHOME:C_LAMP); T.mLamp.emissiveIntensity=home?2.4:0.08+3.2*(1-L)*(1-L);
    T.mWall.color.copy(home?C_GOLDWALL:C_WHITE); T.mWall.emissive.copy(home?C_GOLDE:C_BLACK);
    const age=T.cleared?gameClock-T.clearedAt:99;
    if(age<2.5){ T.mFloor.emissive.copy(C_BLOOM); T.mFloor.emissiveIntensity=0.35*(1-age/2.5); }
    else if(T.id===padSel){ T.mFloor.emissive.copy(L>=CFG.slideLight?C_WHITE:C_HIDARK); T.mFloor.emissiveIntensity=0.22+0.12*Math.sin(time*8); }
    else if(elig.has(T.id)){ const lit=L>=CFG.slideLight; T.mFloor.emissive.copy(lit?C_HI:C_HIDARK); T.mFloor.emissiveIntensity=(lit?0.2:0.1)*(0.5+0.5*Math.sin(time*5)); }
    else T.mFloor.emissiveIntensity=0;
  }
}
function syncEcology(){
  if(!ecologyState) return;
  let pi=0, gi=0, fi=0, ti=0, ttop=0;
  const growT=ECOLOGY.growSeconds;
  for(const cell of ecologyState.byCell.values()){
    const T=tiles[cell.tileId]; if(!T) continue;
    const p=tilePos(T), lf=liftOf(T), g=smooth(clamp((gameClock-cell.growAt)/growT,0,1)), pop=0.1+0.9*g;
    frameAt(p.x+cell.x+0.5,p.y+cell.y+0.5);
    surfMatrix(_M,_R,0,CELL_TANGENT.sx*pop,PATCH_THICK*pop,CELL_TANGENT.sz*pop,1+lf+PATCH_LIFT*pop);
    ecoPatches.setMatrixAt(pi++,_M);
    for(const d of cell.decor){
      const off=decorLocalOffset(d);
      const gx=p.x+cell.x+0.5+off.x, gy=p.y+cell.y+0.5+off.y;
      const sc=decorTangentScale(d.kind,d.scale*pop);
      if(d.kind==='grass'&&gi<ECOLOGY.maxDecorTotal){
        frameAt(gx,gy);
        surfMatrix(_M,_R,d.yaw||0,sc.sx,sc.sy,sc.sz,1+lf+sc.lift);
        ecoGrass.setMatrixAt(gi++,_M);
      }else if(d.kind==='flower'&&fi<ECOLOGY.maxDecorTotal){
        frameAt(gx,gy);
        surfMatrix(_M,_R,0,sc.sx,sc.sy,sc.sz,1+lf+sc.lift);
        ecoFlower.setMatrixAt(fi++,_M);
      }else if(d.kind==='tree'&&ti<ECOLOGY.maxDecorTotal){
        frameAt(gx,gy);
        surfMatrix(_M,_R,d.yaw,sc.trunk.sx,sc.trunk.sy,sc.trunk.sz,1+lf+sc.trunk.lift);
        ecoTreeTrunk.setMatrixAt(ti++,_M);
        surfMatrix(_M,_R,d.yaw,sc.top.sx,sc.top.sy,sc.top.sz,1+lf+sc.top.sy*pop+sc.top.lift);
        ecoTreeTop.setMatrixAt(ttop++,_M);
      }
    }
  }
  ecoPatches.count=pi; ecoGrass.count=gi; ecoFlower.count=fi; ecoTreeTrunk.count=ti; ecoTreeTop.count=ttop;
  ecoPatches.instanceMatrix.needsUpdate=pi>0;
  ecoGrass.instanceMatrix.needsUpdate=gi>0;
  ecoFlower.instanceMatrix.needsUpdate=fi>0;
  ecoTreeTrunk.instanceMatrix.needsUpdate=ti>0;
  ecoTreeTop.instanceMatrix.needsUpdate=ttop>0;
}
function syncBubbles(time){
  let nb=0, ng=0;
  for(const T of tiles){
    const p=tilePos(T), lf=liftOf(T), home=isHome(T);
    for(let i=0;i<N;i++){
      const v=T.dots[i]; if(!v) continue;
      frameAt(p.x+(i%TW)+0.5,p.y+((i/TW)|0)+0.5);
      const bob=0.004*Math.sin(time*2.1+i*1.3+T.id*2.7), wob=Math.sin(time*5+i+T.id);
      if(v===1&&nb<BUB_MAX){
        _P.copy(_R).multiplyScalar(1+0.034+bob+lf);
        _M.makeScale(0.024*(1+0.04*wob),0.024*(1-0.04*wob),0.024*(1+0.04*wob)).setPosition(_P); bubbles.setMatrixAt(nb,_M);
        const sc=home?0.0105:0.0075; _M.makeScale(sc,sc,sc).setPosition(_P); seeds.setMatrixAt(nb,_M); nb++;
      } else if(v===2&&ng<16){
        _P.copy(_R).multiplyScalar(1+0.05+bob+lf);
        _M.makeScale(0.042,0.042,0.042).setPosition(_P); bigBubbles.setMatrixAt(ng,_M);
        _Q.setFromUnitVectors(_Y,_R); _Q2.setFromAxisAngle(_R,time*1.6); _Q.premultiply(_Q2);
        _M.compose(_P,_Q,_S.set(0.016,0.024,0.016)); gems.setMatrixAt(ng,_M); ng++;
      }
    }
  }
  bubbles.count=seeds.count=nb; bigBubbles.count=gems.count=ng;
  bubbles.instanceMatrix.needsUpdate=seeds.instanceMatrix.needsUpdate=bigBubbles.instanceMatrix.needsUpdate=gems.instanceMatrix.needsUpdate=true;
}
function syncFrog(time,dt){
  const a=player, w=actorWorld(a), lift=actorLift(a);
  if(state==='dying') frog.yaw+=dt*14;
  else if(a.dir>=0) frog.yaw+=angD(DIRYAW[a.dir]-frog.yaw)*Math.min(1,dt*16);
  poseObject(frog.root,w[0],w[1],lift+0.001,frog.yaw);
  let hy=0, sy=1;
  if(state==='play'&&a.moving){ const h=Math.sin(Math.PI*a.prog); hy=h*0.018; sy=1+0.09*h-0.1*Math.pow(1-h,4); }
  else sy=1+0.025*Math.sin(time*3.2);
  const sxz=1/Math.sqrt(sy); frog.hop.position.y=hy; frog.hop.scale.set(sxz,sy,sxz);
  frog.blinkT-=dt; let ey=1;
  if(frog.blinkT<0){ ey=Math.max(0.08,Math.abs(frog.blinkT*10+1)); if(frog.blinkT<-0.2) frog.blinkT=2+Math.random()*3; }
  for(const e of frog.eyes) e.scale.y=ey;
  if(frog.tongueT>0){ frog.tongueT-=dt; const k=Math.sin(Math.PI*clamp(frog.tongueT/0.16,0,1)), L=0.004+k*frog.tongueLen; frog.tongue.visible=true; frog.tStem.scale.set(1,1,L); frog.tTip.position.z=L; }
  else frog.tongue.visible=false;
  let sc=1.15; if(state==='dying'){ const t=1-dyingT/1.4; sc*=Math.max(0.01,1-t*t); }
  if(state==='warp'){
    if(!warped){ const t=warpT/0.55; sc*=Math.max(0.01,1-t); frog.hop.position.y=-0.03*t; frog.yaw+=dt*18; poseObject(frog.root,w[0],w[1],lift+0.001,frog.yaw); }
    else { const u=clamp((warpT-0.55)/0.95,0,1); sc*=Math.min(1,0.3+u*2.5); frog.hop.position.y=0.17*Math.sin(Math.PI*u); frog.hop.rotateX(0); frog.hop.rotation.x=-u*TAU; }
  } else frog.hop.rotation.x=0;
  frog.root.scale.setScalar(sc);
  frog.root.visible=!(state==='play'&&invuln>0&&readyT<=0&&(Math.floor(time*12)&1));
  // firefly companion lights the way at night
  const night=1-lightAt(w[0],w[1]), ang=time*2.3;
  firefly.position.copy(frog.root.position).addScaledVector(_R,0.085+0.01*Math.sin(time*3.1)).addScaledVector(_E,Math.cos(ang)*0.045).addScaledVector(_N,Math.sin(ang)*0.045);
  ffLight.intensity=0.002+0.016*night; ffGlow.material.opacity=0.35+0.65*night;
  firefly.visible=state!=='dying';
}
function syncBats(time,dt){
  const pl=actorWorld(player);
  for(let i=0;i<batObjs.length;i++){
    const o=batObjs[i], g=bats[i];
    if(!g||g.mode==='dead'||(g.mode==='gone'&&g.goneT>1.6)){ o.root.visible=false; o.zz.forEach(z=>z.visible=false); continue; }
    if(g.mode==='gone'){ const w=actorWorld(g.a), t=g.goneT; o.yaw+=dt*3; poseObject(o.root,w[0],w[1],actorLift(g.a)+0.05+t*t*0.12,o.yaw); o.root.scale.setScalar(Math.max(0.01,1-t/1.6)); const f=0.12+0.7*Math.sin(gameClock*26+i); o.wings[0].rotation.z=-f; o.wings[1].rotation.z=f; o.zz.forEach(z=>z.visible=false); continue; }
    o.root.scale.setScalar(1);
    o.root.visible=true;
    const w=actorWorld(g.a), night=1-lightAt(w[0],w[1]), lift=actorLift(g.a), scared=fright>0&&g.mode==='live'&&!g.asleep;
    let ty=o.yaw;
    if(g.a.moving&&g.a.dir>=0) ty=DIRYAW[g.a.dir];
    else if(!g.asleep&&player.t===g.a.t){ const dx=wrapD(pl[0]-w[0])*CW*Math.cos(gy2lat(w[1])), dy=(pl[1]-w[1])*CH; ty=Math.atan2(dx,-dy); }
    o.yaw+=angD(ty-o.yaw)*Math.min(1,dt*8);
    const fl=scared?22:lerp(7,17,night);
    poseObject(o.root,w[0],w[1],lift+(g.asleep?0.024:0.05+0.007*Math.sin(time*3+i*1.7)),o.yaw);
    let flap; if(g.asleep) flap=-1.25+0.04*Math.sin(time*1.5+i); else if(g.mode==='wait') flap=0.1+0.35*Math.sin(time*5+i); else flap=0.12+0.62*Math.sin(time*fl+i*2.1);
    o.wings[0].rotation.z=-flap; o.wings[1].rotation.z=flap;
    const lid=g.asleep?0.08:(scared?1:lerp(0.4,1,smooth(clamp(night*1.4,0,1))));
    for(const e of o.eyes) e.scale.y=lid;
    for(const b of o.brows) b.visible=!g.asleep&&!scared;
    if(scared){ o.fur.color.copy(fright<2&&(Math.floor(time*6)&1)?o.flashC:o.scaredC); o.eyeM.emissive.copy(C_WHITE); o.eyeM.emissiveIntensity=1.2; o.body.position.set((Math.random()-0.5)*0.002,0,(Math.random()-0.5)*0.002); }
    else { o.fur.color.copy(o.furC); o.eyeM.emissive.copy(o.col); o.eyeM.emissiveIntensity=g.asleep?0:0.5+2.8*night; o.body.position.set(0,g.asleep?0:0.004*Math.sin(time*fl+i*2.1),0); }
    o.zz.forEach((z,k)=>{ z.visible=g.asleep; if(!g.asleep) return; const ph=(time*0.55+k*0.5)%1;
      z.position.copy(o.root.position).addScaledVector(_R,0.035+ph*0.05).addScaledVector(_E,0.012+ph*0.02);
      z.material.opacity=Math.sin(Math.PI*ph); z.scale.setScalar(0.012+ph*0.012); });
  }
}
function syncSky(){
  U.sun.value.set(cosD*Math.sin(sunLon),sinD,cosD*Math.cos(sunLon));
  sunL.position.copy(U.sun.value).multiplyScalar(5);
  sunGlow.position.copy(U.sun.value).multiplyScalar(40); sunCore.position.copy(sunGlow.position);
  _e2.set(Math.sin(sunLon+2.75)*0.95,-0.3,Math.cos(sunLon+2.75)*0.95).normalize();
  moonL.position.copy(_e2).multiplyScalar(5); moon.position.copy(_e2).multiplyScalar(30);
}
function updateCameraTarget(dt){
  if(state==='title'||state==='over'){ camLon=mod(camLon+dt*0.12,TAU); camLat+=(CAMERA.titleCamLat-camLat)*Math.min(1,dt); zoomTarget=1; }
  else {
    const w=actorWorld(player), k=Math.min(1,dt*(state==='warp'?(REDUCED?3:4):(REDUCED?3:5)));
    camLon=mod(camLon+angD(gx2lon(w[0])-camLon)*k,TAU); camLat+=(gy2lat(w[1])-camLat)*k;
    zoomTarget=state==='clear'?1:(viewFar?1:(state==='play'&&readyT>1.0?1:(state==='warp'&&warpT>0.25&&warpT<1.25?1:0)));
  }
  zoomT+=(zoomTarget-zoomT)*Math.min(1,dt*(REDUCED?6:(state==='warp'?4.5:2.4)));
}
function placeCamera(){
  const z=smooth(clamp(zoomT,0,1));
  const off=closeCameraOffset();
  latLonFrame(camLat,camLon,_e1,_E2,_N2);
  _tA.copy(_e1).addScaledVector(_N2,CAMERA.lookTargetLift);
  _pA.copy(_tA).addScaledVector(_e1,off.alongTangent).addScaledVector(_N2,off.alongNormal);
  _uA.copy(_N2);
  latLonFrame(camLat*CAMERA.farCamLatScale,camLon,_e2,_E2,_N2);
  const dFar=farOrbitDistance(camera.aspect);
  _pB.copy(_e2).multiplyScalar(dFar); _tB.set(0,0,0); _uB.copy(_N2);
  camera.position.lerpVectors(_pA,_pB,z); _tC.lerpVectors(_tA,_tB,z);
  if(shakeT>0&&!REDUCED){ const a=shakeT*0.03; camera.position.x+=(Math.random()-0.5)*a; camera.position.y+=(Math.random()-0.5)*a; camera.position.z+=(Math.random()-0.5)*a; }
  camera.up.lerpVectors(_uA,_uB,z).normalize(); camera.lookAt(_tC);
  camera.fov=lerp(CAMERA.fovCloseDeg,CAMERA.fovFarDeg,z); camera.updateProjectionMatrix();
}
function syncScene(time,dt){
  U.time.value=time;
  syncSky(); syncTiles(time); syncBubbles(time); syncEcology(); syncBloom(); syncFrog(time,dt); syncBats(time,dt);
  syncSinks(time,dt); syncOrchard(time); syncClouds(time); syncButterflies(time); syncFlags(time); syncPillars(); syncBerry(time); syncMeteors(dt);
  if(boostT>0&&!paused&&player.moving&&Math.random()<0.6) emit(frog.root.position,1,PC.teal,0.05,0.008,0.5,0.05,0.3);
  if(!paused) updateParticles(dt);
  placeCamera();
  { const w=actorWorld(player), lit=(state==='title'||state==='over')?0.15:lightAt(w[0],w[1]), z=smooth(clamp(zoomT,0,1));
    skyDay+=(lit*(1-0.7*z)-skyDay)*Math.min(1,dt*1.5);
    frameAt(w[0],w[1]); skyMat.uniforms.uUp.value.copy(_R); skyMat.uniforms.uDay.value=skyDay; starMat.uniforms.uDay.value=skyDay;
    skyDome.position.copy(camera.position); }
  pMat.uniforms.uPx.value=ffMat.uniforms.uPx.value=glc.height/(2*Math.tan(camera.fov*DEG/2));
}
let useBloom=true;
function render(){ if(useBloom) composer.render(); else renderer.render(scene,camera); }
