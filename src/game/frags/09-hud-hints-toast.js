let toastTimer=0, hudKey='', greenHudKey='';
function say(msg,ms){ const t=$('toast'); t.textContent=msg; t.classList.add('on'); clearTimeout(toastTimer); toastTimer=setTimeout(()=>t.classList.remove('on'),ms||1000); }
function hintText(L){
  if(state==='warp') return tr('hint.warp');
  if(state!=='play') return '';
  if(sink&&sink.phase!=='close') return tr('hint.sinkhole');
  if(fright>0) return tr('hint.fright',{seconds:Math.ceil(fright)});
  if(boostT>0) return tr('hint.berryBoost',{seconds:Math.ceil(boostT)});
  if(berry) return tr('hint.berryRipe');
  if(L<0.35&&bats.some(g=>g.home===player.t&&g.mode==='live'&&!g.asleep)) return tr('hint.batEyes');
  if(dotsLeft<=CFG.radar) return tr('hint.lastBubbles');
  if(waypoint>=0) return tr('hint.waypoint',{num:tiles[waypoint].num});
  if(tiles[player.t].left===0) return tr('hint.islandDone');
  if(holeNeighbors().some(n=>lightSlot(n.c,n.r)>=CFG.slideLight)) return PAD.idx>=0?tr('hint.padSlide'):tr('hint.tapSlide');
  return tr('hint.waitSun');
}
function greenHud(){
  if(state!=='play'&&state!=='warp'&&state!=='clear'&&state!=='dying') return;
  const g=ecologyCount(ecologyState), pct=planetGreenPercent(g,initialGreenTarget);
  const key=g+'|'+pct+'|'+initialGreenTarget;
  if(key===greenHudKey) return; greenHudKey=key;
  const ring=$('greenGoal'), el=$('greenPct');
  if(!ring||!el) return;
  const label=formatGreenPercent(pct);
  el.textContent=label;
  ring.style.setProperty('--green-pct',String(pct));
  ring.setAttribute('aria-valuenow',String(pct));
  ring.setAttribute('aria-valuetext',tr('hud.greenPctAria',{pct:label}));
}
function hud(){
  const w=actorWorld(player), L=lightAt(w[0],w[1]);
  const lab=L>0.6?tr('hud.chip.day'):L>0.2?tr('hud.chip.twilight'):tr('hud.chip.night'), home=tiles.filter(isHome).length;
  const key=[score,level,dotsLeft,lives,lab,home,state,hintText(L)].join('|');
  if(key===hudKey) greenHud();
  else{
    hudKey=key;
    $('score').textContent=score; $('level').textContent=level; $('left').textContent=dotsLeft; $('home').textContent=home+'/15';
    $('lives').textContent=lives<=5?'●'.repeat(Math.max(0,lives)):'●×'+lives;
    $('lives').setAttribute('aria-label',tr('hud.livesAria',{count:Math.max(0,lives)}));
    const chip=$('chip'); chip.textContent=lab; chip.style.color=L>0.6?'#ffd25e':L>0.2?'#ff9a6a':'#8f9cff';
    $('hint').textContent=hintText(L);
    greenHud();
  }
}
