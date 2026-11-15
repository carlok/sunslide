let toastTimer=0, hudKey='', greenHudKey='';
function say(msg,ms){ const t=$('toast'); t.textContent=msg; t.classList.add('on'); clearTimeout(toastTimer); toastTimer=setTimeout(()=>t.classList.remove('on'),ms||1000); }
function hintText(L){
  if(state==='warp') return 'Whoosh — straight through the planet!';
  if(state!=='play') return '';
  if(sink&&sink.phase!=='close') return 'Sinkhole ahead — turn away or fall through the planet!';
  if(fright>0) return 'Bats are scared — catch them! '+Math.ceil(fright)+'s';
  if(boostT>0) return 'Berry speed! '+Math.ceil(boostT)+'s';
  if(berry) return 'A sky berry is ripe — follow the magenta arrow';
  if(L<0.35&&bats.some(g=>g.home===player.t&&(g.mode==='live'||g.mode==='wait')&&!g.asleep)) return 'Bat island at night: watch for glowing eyes';
  if(dotsLeft<=CFG.radar) return 'Follow the gold arrows to the last bubbles';
  if(waypoint>=0) return 'Follow the pink arrow to island '+tiles[waypoint].num;
  if(tiles[player.t].left===0) return 'Island done — the gold arrow points to more bubbles';
  if(holeNeighbors().some(n=>lightSlot(n.c,n.r)>=CFG.slideLight)) return PAD.idx>=0?'LB/RB pick an island, A slides it':'Tap a glowing island (or the map) to slide it';
  return 'Islands only slide in sunlight — wait for the sun';
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
  ring.setAttribute('aria-valuetext',label+' planet green');
}
function hud(){
  const w=actorWorld(player), L=lightAt(w[0],w[1]);
  const lab=L>0.6?'DAY':L>0.2?'TWILIGHT':'NIGHT', home=tiles.filter(isHome).length;
  const key=[score,level,dotsLeft,lives,lab,home,state,hintText(L)].join('|');
  if(key===hudKey) greenHud();
  else{
    hudKey=key;
    $('score').textContent=score; $('level').textContent=level; $('left').textContent=dotsLeft; $('home').textContent=home+'/15';
    $('lives').textContent=lives<=5?'●'.repeat(Math.max(0,lives)):'●×'+lives;
    const chip=$('chip'); chip.textContent=lab; chip.style.color=L>0.6?'#ffd25e':L>0.2?'#ff9a6a':'#8f9cff';
    $('hint').textContent=hintText(L);
    greenHud();
  }
}
