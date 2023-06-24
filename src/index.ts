import * as Three from "three";
import { Sky } from "three/examples/jsm/objects/Sky";
import * as v3 from "@verseengine/verse-three";

const ticks: ((delta: number) => void)[] = [];
const VERSE_WASM_URL = "https://cdn.jsdelivr.net/npm/@verseengine/verse-three@1.0.0/dist/verse_core_bg.wasm";
const VERSE_ENTRACE_SERVER_URL = "https://entrance.verseengine.cloud";
const ANIMATION_MAP = {
  idle: "./assets/animation/idle.fbx",
  walk: "./assets/animation/walk.fbx",
};
function range(n: number): number[] {
  return [...Array(n).keys()];
}
const PRESET_AVATARS = [...range(3).map(x => `f${x}`), ...range(3).map(x => `m${x}`)].map(s => ({
  thumbnailURL: `./assets/avatar/${s}.png`,
  avatarURL: `./assets/avatar/${s}.vrm`,
}));
const DEFAULT_AVATAR_URL = PRESET_AVATARS[Math.floor(Math.random() * PRESET_AVATARS.length)].avatarURL;
const ICE_SERVERS = [{ urls: "stun:stun.1.google.com:19302" }, { urls: "stun:stun1.1.google.com:19302" }];

async function setupScene(ticks: ((deltaTime: number) => void)[]) {
  const renderer = new Three.WebGLRenderer();
  renderer.outputColorSpace = Three.SRGBColorSpace;
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(window.devicePixelRatio ?? 1);
  document.body.appendChild(renderer.domElement);

  const scene = new Three.Scene();
  const camera = new Three.PerspectiveCamera(90.0, window.innerWidth / window.innerHeight, 0.1, 100.0);
  scene.add(camera);

  window.addEventListener("resize", () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  scene.add(new Three.AmbientLight(0xffffffff, 1.0));

  const sky = new Sky();
  sky.scale.setScalar(450000);
  scene.add(sky);

  const sun = new Three.Vector3();
  sun.setFromSphericalCoords(1.0, Three.MathUtils.degToRad(60.0), Three.MathUtils.degToRad(180.0));
  sky.material.uniforms["sunPosition"].value.copy(sun);

  const ground = new Three.Mesh(
    new Three.PlaneGeometry(50, 50, 1, 1),
    new Three.MeshLambertMaterial({ color: 0x5e5e5e })
  );
  ground.rotation.x = Math.PI / -2.0;
  scene.add(ground);

  scene.add(new Three.GridHelper(50, 50));

  const clock = new Three.Clock();
  renderer.setAnimationLoop(() => {
    const dt = clock.getDelta();
    for (const c of ticks) {
      c(dt);
    }
    renderer.render(scene, camera);
  });

  return { scene, renderer, camera, ground };
}

async function main() {
  const ticks: ((deltaTime: number) => void)[] = [];
  const { scene, renderer, camera, ground } = await setupScene(ticks);

  // setup base containers
  const cameraContainer = new Three.Object3D();
  cameraContainer.add(camera);
  const player = new Three.Object3D();
  player.add(cameraContainer);
  scene.add(player);

  const teleportTargetObjects = [ground];
  const collisionBoxes = [new Three.Box3().setFromObject(ground)];

  const adapter = new v3.DefaultEnvAdapter(
    renderer,
    scene,
    camera,
    cameraContainer,
    player,
    () => collisionBoxes,
    () => [],
    () => teleportTargetObjects,
    { isLowSpecMode: false }
  );
  const res = await v3.start(
    adapter,
    scene,
    VERSE_WASM_URL,
    VERSE_ENTRACE_SERVER_URL,
    DEFAULT_AVATAR_URL,
    ANIMATION_MAP,
    ICE_SERVERS,
    {
      maxNumberOfPeople: 16,
      maxNumberOfParallelFileTransfers: 4,
      presetAvatars: PRESET_AVATARS,
    }
  );
  ticks.push(res.tick);
}

main();
