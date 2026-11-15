let state='title', paused=false;
let tiles=[], slotGrid=[];
let score=0, lives=3, level=1, dotsLeft=0, scoreBest=store.get('scoreBest',0), nextLife=CFG.lifeEvery;
let runMoves=0, runTimeMs=0;
let sunLon=0, gameClock=0;
let sink=null, sinkTimer=14, warpT=0, warpDest=null, warped=false, exitFx=null;
let combo=0, comboT=9, berry=null, berryTimer=25, boostT=0, waypoint=-1, shakeT=0, deaths=0;
let want=-1, cooldown=0, readyT=0, invuln=0, fright=0, chain=0, dyingT=0, clearT=0;
let aligned=false, startTile=0;
let player=null, bats=[];
let viewFar=store.get('viewFar',false), zoomT=1, zoomTarget=1, camLat=0.3, camLon=0;
let ecologyState=null, initialGreenTarget=0, planetGreenCelebrated=false, sectorPar=0;
let slidePreview=null;

/* ---------- maze islands ---------- */
function makeTile(id){
  const walls=new Uint8Array(N).fill(15);
  const inside=(x,y)=>x>=0&&y>=0&&x<TW&&y<TH;
  const open=(i,d)=>{ const x=i%TW,y=(i/TW)|0,nx=x+DX[d],ny=y+DY[d]; if(!inside(nx,ny)) return;
    walls[i]&=~(1<<d); walls[ny*TW+nx]&=~(1<<((d+2)&3)); };
  const seen=new Uint8Array(N), st=[ri(N)]; seen[st[0]]=1;
  while(st.length){
    const i=st[st.length-1], x=i%TW, y=(i/TW)|0, opts=[];
    for(let d=0;d<4;d++){ const nx=x+DX[d],ny=y+DY[d]; if(inside(nx,ny)&&!seen[ny*TW+nx]) opts.push(d); }
    if(!opts.length){ st.pop(); continue; }
    const d=opts[ri(opts.length)], j=(y+DY[d])*TW+x+DX[d]; open(i,d); seen[j]=1; st.push(j);
  }
  for(let i=0;i<N;i++) for(const d of [1,2]) if(Math.random()<0.32) open(i,d);
  for(let i=0;i<N;i++){
    const w=walls[i]; let c=0; for(let d=0;d<4;d++) if(w&(1<<d)) c++;
    if(c>=3){ const x=i%TW,y=(i/TW)|0, ds=[]; for(let d=0;d<4;d++) if((w&(1<<d))&&inside(x+DX[d],y+DY[d])) ds.push(d); if(ds.length) open(i,ds[ri(ds.length)]); }
  }
  return {id,num:id+1,walls,dots:new Uint8Array(N),slot:{c:0,r:0},anim:null,homeAwarded:false,cleared:false,clearedAt:0,
    uOff:{value:new THREE.Vector2()},uLift:{value:0},group:null};
}
const isHome=T=>!T.anim&&T.slot.c===T.id%COLS&&T.slot.r===((T.id/COLS)|0);
function findHole(){ for(let r=0;r<ROWS;r++) for(let c=0;c<COLS;c++) if(slotGrid[r][c]<0) return {c,r}; return {c:3,r:3}; }
function holeNeighbors(){
  const h=findHole(), out=[];
  for(let d=0;d<4;d++){ const c=(h.c+DX[d]+COLS)%COLS, r=h.r+DY[d]; if(r>=0&&r<ROWS) out.push({c,r,d}); }
  return out;
}
function slideInstant(c,r){ const h=findHole(), id=slotGrid[r][c]; slotGrid[h.r][h.c]=id; slotGrid[r][c]=-1; tiles[id].slot={c:h.c,r:h.r}; }
function tilePos(T){
  const a=T.anim;
  if(!a){
    if(slidePreview&&slidePreview.id===T.id){
      return ghostTilePosition(slidePreview.fc,slidePreview.fr,slidePreview.dc,slidePreview.dr,slidePreview.pull,REDUCED);
    }
    return {x:T.slot.c*TW,y:T.slot.r*TH};
  }
  const e=slideSnapProgress(a.t,REDUCED);
  return {x:(a.fc+a.dc*e)*TW, y:(a.fr+a.dr*e)*TH};
}
const liftOf=T=>{
  if(T.anim) return slideLiftAtProgress(T.anim.t,REDUCED)*LIFT;
  if(slidePreview&&slidePreview.id===T.id) return ghostPreviewBlend(slidePreview.pull,REDUCED)*LIFT*0.35;
  return 0;
};

/* ---------- movement graph ---------- */
function nbrLocal(t,x,y,d){
  if(tiles[t].walls[y*TW+x]&(1<<d)) return null;
  const nx=x+DX[d], ny=y+DY[d];
  return (nx>=0&&nx<TW&&ny>=0&&ny<TH)?{t,x:nx,y:ny}:null;
}
function nbr(t,x,y,d){
  const T=tiles[t], nx=x+DX[d], ny=y+DY[d];
  if(nx>=0&&nx<TW&&ny>=0&&ny<TH) return (T.walls[y*TW+x]&(1<<d))?null:{t,x:nx,y:ny};
  const r=T.slot.r+DY[d]; if(r<0||r>=ROWS) return null;
  const c=(T.slot.c+DX[d]+COLS)%COLS, u=slotGrid[r][c];
  if(u<0||T.anim||tiles[u].anim) return null;
  return {t:u,x:(nx+TW)%TW,y:(ny+TH)%TH};
}
const NN=NT*N, vis=new Int32Array(NN), bq=new Int32Array(NN), bfd=new Int8Array(NN), bdd=new Int16Array(NN);
let stamp=0, bDir=-1, bDist=999;
function bfs(a,goal,local){
  stamp++; let h=0,tl=0; const s=a.t*N+a.y*TW+a.x;
  vis[s]=stamp; bq[tl++]=s; bfd[s]=-1; bdd[s]=0; bDir=-1; bDist=999;
  while(h<tl){
    const u=bq[h++];
    if(u===goal){ bDir=bfd[u]; bDist=bdd[u]; return; }
    const t=(u/N)|0, rem=u-t*N, y=(rem/TW)|0, x=rem-y*TW;
    for(let d=0;d<4;d++){
      const n=local?nbrLocal(t,x,y,d):nbr(t,x,y,d); if(!n) continue;
      const v=n.t*N+n.y*TW+n.x; if(vis[v]===stamp) continue;
      vis[v]=stamp; bfd[v]=(u===s)?d:bfd[u]; bdd[v]=bdd[u]+1; bq[tl++]=v;
    }
  }
}
const idx=c=>c.t*N+c.y*TW+c.x;

/* ---------- actors ---------- */
const mkActor=(t,x,y)=>({t,x,y,moving:false,dir:-1,nt:0,nx:0,ny:0,prog:0});
function actorWorld(a){
  const p=tilePos(tiles[a.t]); let x=p.x+a.x+0.5, y=p.y+a.y+0.5;
  if(a.moving){ const q=tilePos(tiles[a.nt]), x2=q.x+a.nx+0.5, y2=q.y+a.ny+0.5; x+=wrapD(x2-x)*a.prog; y+=(y2-y)*a.prog; }
  return [mod(x,GW),y];
}
function actorLift(a){ const l0=liftOf(tiles[a.t]); return a.moving?l0+(liftOf(tiles[a.nt])-l0)*a.prog:l0; }
function stepActor(a,dt,speed,choose,onArrive){
  let rem=speed*dt, guard=0;
  while(rem>1e-6&&guard++<6){
    if(!a.moving){
      const d=choose(a); if(d<0) return;
      const n=nbr(a.t,a.x,a.y,d); if(!n) return;
      a.dir=d; a.nt=n.t; a.nx=n.x; a.ny=n.y; a.moving=true; a.prog=0;
    }
    const need=1-a.prog;
    if(rem>=need){ rem-=need; a.t=a.nt;a.x=a.nx;a.y=a.ny;a.moving=false;a.prog=0; if(onArrive) onArrive(a); }
    else { a.prog+=rem; rem=0; }
  }
}

/* ---------- sunlight (matches the renderer) ---------- */
const sinD=Math.sin(DECL), cosD=Math.cos(DECL);
function lightAt(gx,gy){
  const lat=gy2lat(gy), lon=gx2lon(gx), raw=Math.sin(lat)*sinD+Math.cos(lat)*cosD*Math.cos(lon-sunLon);
  return smooth(clamp((raw+0.08)*2.5,0,1));
}
const lightSlot=(c,r)=>lightAt(c*TW+TW/2,r*TH+TH/2);
