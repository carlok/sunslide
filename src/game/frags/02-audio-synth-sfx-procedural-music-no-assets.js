const AU={muted:store.get('muted',false)}, MUS={on:store.get('music',true),next:0,step:0,mood:'title',seed:ri(1000)};
const AUD={ac:null};
const MIDI=m=>440*Math.pow(2,(m-69)/12);
function audio(){
  if(AUD.ac) return AUD.ac;
  try{
    const ac=new (window.AudioContext||window.webkitAudioContext)();
    const comp=ac.createDynamicsCompressor(); comp.threshold.value=-12; comp.ratio.value=4; comp.connect(ac.destination);
    const master=ac.createGain(); master.gain.value=0.9; master.connect(comp);
    const sfx=ac.createGain(); sfx.gain.value=AU.muted?0:1; sfx.connect(master);
    const mus=ac.createGain(); mus.gain.value=MUS.on?0.6:0; mus.connect(master);
    const len=Math.floor(ac.sampleRate*2.4), ib=ac.createBuffer(2,len,ac.sampleRate);
    for(let c=0;c<2;c++){ const d=ib.getChannelData(c); for(let i=0;i<len;i++) d[i]=(Math.random()*2-1)*Math.pow(1-i/len,2.4); }
    const rev=ac.createConvolver(); rev.buffer=ib; const rg=ac.createGain(); rg.gain.value=0.45; rev.connect(rg); rg.connect(master);
    const nb=ac.createBuffer(1,ac.sampleRate,ac.sampleRate), nd=nb.getChannelData(0); for(let i=0;i<nd.length;i++) nd[i]=Math.random()*2-1;
    Object.assign(AUD,{ac,master,sfx,mus,rev,noise:nb});
    return ac;
  }catch(e){ return null; }
}
function voice(bus,type,freq,t,a,peak,d,o={}){
  const ac=AUD.ac; if(!ac) return;
  const osc=ac.createOscillator(), g=ac.createGain(); osc.type=type; osc.frequency.setValueAtTime(freq,t);
  if(o.glide) osc.frequency.exponentialRampToValueAtTime(o.glide,t+a+d);
  if(o.det) osc.detune.setValueAtTime(o.det,t);
  let n=osc; if(o.lp){ const f=ac.createBiquadFilter(); f.type='lowpass'; f.frequency.setValueAtTime(o.lp,t); osc.connect(f); n=f; }
  n.connect(g); g.gain.setValueAtTime(0.0001,t);
  if(o.sus){ g.gain.linearRampToValueAtTime(peak,t+a); g.gain.setValueAtTime(peak,t+a+o.sus); g.gain.exponentialRampToValueAtTime(0.0001,t+a+o.sus+d); }
  else { g.gain.exponentialRampToValueAtTime(peak,t+a); g.gain.exponentialRampToValueAtTime(0.0001,t+a+d); }
  g.connect(bus); if(o.rev){ const sg=ac.createGain(); sg.gain.value=o.rev; g.connect(sg); sg.connect(AUD.rev); }
  osc.start(t); osc.stop(t+a+(o.sus||0)+d+0.05);
}
function noiseHit(bus,t,peak,d,hp){
  const ac=AUD.ac, src=ac.createBufferSource(), f=ac.createBiquadFilter(), g=ac.createGain();
  src.buffer=AUD.noise; f.type='highpass'; f.frequency.value=hp; src.connect(f); f.connect(g); g.connect(bus);
  g.gain.setValueAtTime(peak,t); g.gain.exponentialRampToValueAtTime(0.0001,t+d); src.start(t,Math.random()*0.5); src.stop(t+d+0.02);
}
const INS={
  pluck(b,m,t,v){ voice(b,'triangle',MIDI(m),t,0.004,v,0.34,{lp:3400,rev:0.22}); voice(b,'sine',MIDI(m+12),t,0.003,v*0.35,0.16); },
  bell(b,m,t,v){
    const ac=AUD.ac, f=MIDI(m), car=ac.createOscillator(), mo=ac.createOscillator(), mg=ac.createGain(), g=ac.createGain(), sg=ac.createGain();
    car.frequency.value=f; mo.frequency.value=f*3.5; mg.gain.setValueAtTime(f*2.2,t); mg.gain.exponentialRampToValueAtTime(1,t+1.2);
    mo.connect(mg); mg.connect(car.frequency); car.connect(g);
    g.gain.setValueAtTime(0.0001,t); g.gain.exponentialRampToValueAtTime(v,t+0.006); g.gain.exponentialRampToValueAtTime(0.0001,t+1.9);
    g.connect(b); sg.gain.value=0.5; g.connect(sg); sg.connect(AUD.rev); car.start(t); mo.start(t); car.stop(t+2); mo.stop(t+2);
  },
  pad(b,ms,t,dur,v){ for(const m of ms) for(const det of [-8,8]) voice(b,'sawtooth',MIDI(m),t,0.5,v,0.6,{sus:Math.max(0.1,dur-0.5),lp:1000,det,rev:0.4}); },
  bass(b,m,t,dur,v){ voice(b,'triangle',MIDI(m),t,0.01,v,dur,{lp:700}); voice(b,'sine',MIDI(m-12),t,0.01,v*0.7,dur); },
  kick(b,t,v){ voice(b,'sine',140,t,0.004,v,0.24,{glide:42}); },
  hat(b,t,v){ noiseHit(b,t,v,0.045,7500); },
  arp(b,m,t,v){ voice(b,'square',MIDI(m),t,0.004,v,0.11,{lp:2400,rev:0.15}); }
};
const PROG_MAJ=[[48,[60,64,67]],[45,[57,60,64]],[41,[53,57,60]],[43,[55,59,62]]];
const PROG_MIN=[[45,[57,60,64]],[41,[53,57,60]],[48,[55,60,64]],[40,[52,55,59]]];
const SC_MAJ=[72,74,76,79,81,84], SC_MIN=[69,72,74,76,79,81];
const MOODS={
  title:{bpm:84,prog:PROG_MAJ,scale:SC_MAJ,lead:'bell',dens:0.28,kick:0,hat:0,pad:0.02,bass:0.05},
  day:{bpm:104,prog:PROG_MAJ,scale:SC_MAJ,lead:'pluck',dens:0.55,kick:0.3,hat:0.045,pad:0.011,bass:0.085},
  twilight:{bpm:96,prog:PROG_MAJ,scale:SC_MAJ,lead:'pluck',dens:0.38,kick:0,hat:0.03,pad:0.018,bass:0.075},
  night:{bpm:80,prog:PROG_MIN,scale:SC_MIN,lead:'bell',dens:0.26,kick:0,hat:0,pad:0.024,bass:0.055},
  fright:{bpm:136,prog:PROG_MAJ,scale:SC_MAJ,lead:'arp',dens:1,kick:0.34,hat:0.055,pad:0.008,bass:0.09}
};
function pickMood(){
  if(state!=='play'&&state!=='dying'&&state!=='clear'&&state!=='warp') return 'title';
  if(fright>0) return 'fright';
  const w=actorWorld(player), L=lightAt(w[0],w[1]); return L>0.55?'day':L>0.22?'twilight':'night';
}
function schedStep(st,t){
  const sI=st&7, bar=st>>3;
  if(sI===0) MUS.mood=pickMood();
  const M=MOODS[MUS.mood], pr=M.prog[bar%4], root=pr[0], chord=pr[1], e8=30/M.bpm, b=AUD.mus;
  if(sI===0&&M.pad) INS.pad(b,chord,t,e8*8,M.pad);
  if(M.bass&&(sI===0||sI===4)) INS.bass(b,sI===0?root:root+(M.prog===PROG_MIN?0:7),t,e8*3,M.bass);
  if(M.kick&&(sI===0||sI===4||(M.bpm>120&&(sI===2||sI===6)))) INS.kick(b,t,M.kick);
  if(M.hat&&(sI&1)) INS.hat(b,t,M.hat);
  if(M.lead==='arp'){ for(let k=0;k<2;k++) INS.arp(b,chord[(sI*2+k)%3]+12,t+k*e8/2,0.02); return; }
  const ph=bar%4===3?10+bar%8:bar%2, r=hash(MUS.seed,ph,sI);
  if(r<M.dens*(sI%2?0.6:1.25)){
    let m=M.scale[Math.floor(hash(MUS.seed,ph,sI+17)*M.scale.length)];
    if(sI%4===0){ let bm=m,bd=99; for(const c of chord) for(const o of [12,24]){ const d=Math.abs(c+o-m); if(d<bd){bd=d;bm=c+o;} } m=bm; }
    INS[M.lead](b,m,t,M.lead==='bell'?0.05:0.055);
  }
}
function musicTick(){
  const ac=AUD.ac; if(!ac||!MUS.on||ac.state!=='running') return;
  if(MUS.next<ac.currentTime) MUS.next=ac.currentTime+0.05;
  while(MUS.next<ac.currentTime+0.14){ schedStep(MUS.step,MUS.next); MUS.next+=30/MOODS[MUS.mood].bpm; MUS.step++; }
}
setInterval(musicTick,25);
function tone(f,d,type='sine',vol=0.05,f2=0,delay=0){ if(AU.muted||!audio()) return; voice(AUD.sfx,type,f,AUD.ac.currentTime+delay,0.012,vol,d,f2?{glide:f2}:{}); }
const SFX={
  pop(n){ if(AU.muted||!audio()) return; const sc=MOODS[MUS.mood].scale, m=sc[n%sc.length]+12*Math.min(1,Math.floor(n/sc.length)); INS.pluck(AUD.sfx,m,AUD.ac.currentTime,0.075); },
  sun(){ [523,659,784,1046].forEach((f,i)=>tone(f,0.18,'triangle',0.05,0,i*0.06)); },
  batEat(){ tone(1300,0.3,'square',0.028,180); },
  slide(){ tone(110,0.42,'sawtooth',0.022,70); tone(220,0.36,'triangle',0.03,110); },
  thump(){ tone(95,0.2,'sine',0.08,48); },
  home(){ [659,880,1175].forEach((f,i)=>tone(f,0.35,'sine',0.05,0,i*0.09)); },
  bloom(){ [67,72,76,79,84].forEach((m,i)=>tone(MIDI(m),0.45,'sine',0.045,0,i*0.07)); },
  berry(){ [72,76,79,84,88].forEach((m,i)=>tone(MIDI(m),0.22,'triangle',0.05,0,i*0.05)); },
  tick(){ tone(1400,0.05,'sine',0.03); },
  buzz(){ if(AU.muted||!audio()) return; const t=AUD.ac.currentTime, f=200+Math.random()*40; voice(AUD.sfx,'sawtooth',f,t,0.05,0.012,0.35,{lp:900,glide:f*1.12}); voice(AUD.sfx,'sawtooth',f*1.01,t,0.05,0.01,0.33,{lp:800,glide:f*0.95}); },
  rumble(){ tone(60,0.45,'sawtooth',0.05,40); tone(90,0.4,'triangle',0.04,55,0.05); },
  whoosh(){ tone(300,0.3,'sine',0.04,90); },
  fall(){ tone(900,0.55,'sine',0.06,110); },
  boing(){ tone(150,0.35,'triangle',0.07,900); tone(300,0.25,'sine',0.04,1200,0.08); },
  die(){ tone(520,0.9,'triangle',0.06,70); },
  clear(){ [523,659,784,1046,1318].forEach((f,i)=>tone(f,0.3,'triangle',0.05,0,i*0.08)); },
  nope(){ tone(180,0.12,'square',0.022,140); },
  shield(){ tone(880,0.14,'sine',0.035,1320); tone(1320,0.1,'triangle',0.02,1760,0.03); },
  batWake(){ tone(240,0.2,'triangle',0.03,430); },
  prism(){ [84,88,91,96].forEach((m,i)=>tone(MIDI(m),0.16,'sine',0.04,0,i*0.045)); },
  life(){ [784,988,1175,1568].forEach((f,i)=>tone(f,0.2,'sine',0.05,0,i*0.07)); },
  start(){ tone(392,0.3,'triangle',0.05,784); }
};
