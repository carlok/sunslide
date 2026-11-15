import { execSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { readFileSync, writeFileSync } from 'node:fs';

const root = process.env.BUILD_ROOT || '/tmp/sunslide-main-shadow';
const renderer = path.join(root, 'src/game/frags/05-renderer.js');
const bak = path.join('/tmp', 'renderer-main.bak.js');

const patches = {
  polar: (s) =>
    s.replace(
      'const inst=(geo,mat,n,shadow=true)=>{ const im=new THREE.InstancedMesh',
      'const inst=(geo,mat,n,shadow=false)=>{ const im=new THREE.InstancedMesh',
    ),
  wall: (s) => s.replace('wallBatch.castShadow=slabBatch.castShadow=true', 'wallBatch.castShadow=false; slabBatch.castShadow=true'),
  slab: (s) => s.replace('wallBatch.castShadow=slabBatch.castShadow=true', 'wallBatch.castShadow=true; slabBatch.castShadow=false'),
  tiles: (s) => s.replace('wallBatch.castShadow=slabBatch.castShadow=true', 'wallBatch.castShadow=false; slabBatch.castShadow=false'),
};

const which = process.argv[2] || 'polar';
let src = readFileSync(bak, 'utf8');
if (patches[which]) src = patches[which](src);
writeFileSync(renderer, src);
execSync('npm run build', { cwd: root, stdio: 'inherit' });
execSync(
  `OUT=/tmp/carlo-bisect-${which}.png BUILD_ROOT=${root} PORT=4214 node ${path.join(path.dirname(fileURLToPath(import.meta.url)), 'carlo-shadow-shot.mjs')}`,
  { stdio: 'inherit' },
);
console.log('done', which);