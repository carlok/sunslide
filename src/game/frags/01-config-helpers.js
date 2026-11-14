const TAU=Math.PI*2, DEG=Math.PI/180;
const TW=8,TH=4,COLS=4,ROWS=4,GW=TW*COLS,GH=TH*ROWS,N=TW*TH,NT=15;
const LATR=70*DEG, DECL=0.22, CW=TAU/GW, CH=2*LATR/GH;
const DX=[0,1,0,-1], DY=[-1,0,1,0], DIRYAW=[0,Math.PI/2,Math.PI,-Math.PI/2];
const CFG={dayLen:100,slideT:0.45,slideCool:0.3,pSpeed:4.2,batDay:1.6,batNight:2.5,batLvl:0.06,batScared:1.15,
  frightBase:8,frightMin:4,moteBase:0.36,moteStep:0.04,moteMax:0.7,sunstones:4,slideLight:0.3,lifeEvery:10000,maxBats:9,radar:12,comboWin:0.8,sinkEvery:[16,28],sinkWarn:0.45,sinkOpen:3.5,berryEvery:[22,36],berryTTL:14,boostT:5,boostMul:1.35};
const dayLen=()=>Math.max(70,95-5*(level-1));
const PALETTE=['#7cc552','#9bd14a','#4fae6a','#3fa596','#8fb07a','#a6a34a','#d8b44c','#e09346','#c96a4a','#b07ab8','#9890d8','#6b9ee0','#79d3b0','#3d8a5a','#e8828a'];
const BATCOL=['#ff4f7b','#ffae35','#5fe6ff','#c286ff'];
const INSET=0.09, SLAB=0.045, LIFT=0.07;
const gx2lon=gx=>gx*CW, gy2lat=gy=>LATR-gy*CH;
const mod=(a,n)=>((a%n)+n)%n, wrapD=d=>mod(d+GW/2,GW)-GW/2, angD=d=>mod(d+Math.PI,TAU)-Math.PI;
const clamp=(v,a,b)=>v<a?a:v>b?b:v, lerp=(a,b,t)=>a+(b-a)*t, ri=n=>(Math.random()*n)|0, smooth=t=>t*t*(3-2*t);
const hash=(a,b,c)=>{ const s=Math.sin(a*127.1+b*311.7+c*74.7)*43758.5453; return s-Math.floor(s); };
const $=id=>document.getElementById(id);
const REDUCED=!!(window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches);
const store={get(k,d){try{const v=localStorage.getItem('sunslide.'+k);return v===null?d:JSON.parse(v);}catch(e){return d;}},
  set(k,v){try{localStorage.setItem('sunslide.'+k,JSON.stringify(v));}catch(e){}}};
