/** Lazy-loaded bloom post-processing (not required for title / low quality). */
import * as THREE from 'three';

export async function createPostPipeline(renderer, scene, camera) {
  const [
    { EffectComposer },
    { RenderPass },
    { UnrealBloomPass },
    { OutputPass },
  ] = await Promise.all([
    import('three/addons/postprocessing/EffectComposer.js'),
    import('three/addons/postprocessing/RenderPass.js'),
    import('three/addons/postprocessing/UnrealBloomPass.js'),
    import('three/addons/postprocessing/OutputPass.js'),
  ]);
  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  const bloom = new UnrealBloomPass(new THREE.Vector2(256, 256), 0.45, 0.35, 1.0);
  composer.addPass(bloom);
  composer.addPass(new OutputPass());
  return { composer, bloom };
}