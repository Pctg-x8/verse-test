import * as Three from "three";
import { Sky } from "three/examples/jsm/objects/Sky";
import { MetaverseEngine } from "./MetaverseEngine";
import { Renderer } from "./Renderer";
import { box3FromObject, randomChoice, range } from "./utils";
import { Degrees, ThreeVector3Wrapper } from "./utils/three";

function createSky() {
  const o = new Sky();
  o.scale.setScalar(450000);
  o.material.uniforms["sunPosition"].value.copy(
    ThreeVector3Wrapper.fromSphericalCoords(1.0, new Degrees(60.0), new Degrees(180.0)).value
  );

  return o;
}

function createBaseGround() {
  const geometry = new Three.PlaneGeometry(50, 50, 1, 1);
  const mat = new Three.MeshLambertMaterial({ color: 0x5e5e5e });

  const o = new Three.Mesh(geometry, mat);
  o.rotation.x = Math.PI / -2.0;
  return o;
}

const AmbientLight = new Three.AmbientLight(0xffffffff, 1.0);
const HelperObjects = [new Three.GridHelper(50, 50), new Three.AxesHelper(100)];

async function main() {
  const renderer = new Renderer();
  const baseGround = createBaseGround();
  renderer.rootScene.add(AmbientLight, createSky(), baseGround, ...HelperObjects);

  // setup base containers
  const cameraContainer = new Three.Object3D();
  const player = new Three.Object3D();
  cameraContainer.add(renderer.mainCamera);
  player.add(cameraContainer);
  renderer.rootScene.add(player);

  const PresetAvatars = [...range(3).map(x => `f${x}`), ...range(3).map(x => `m${x}`)].map(s => ({
    thumbnailURL: `./assets/avatar/${s}.png`,
    avatarURL: `./assets/avatar/${s}.vrm`,
  }));
  const DefaultAvatarURL = randomChoice(PresetAvatars).avatarURL;

  const mvEngine = new MetaverseEngine(renderer, cameraContainer, player, { isLowSpecMode: false });
  mvEngine.addTeleportTargetObjects(baseGround);
  mvEngine.addCollisionBoxes(box3FromObject(baseGround));
  await mvEngine.start(DefaultAvatarURL, PresetAvatars);

  document.body.appendChild(renderer.domElement);
  renderer.runLoop();
}

main();
