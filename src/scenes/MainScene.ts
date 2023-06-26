import { AppScene } from "../systemComponents/Renderer";
import * as Three from "three";
import { box3FromObject, randomChoice, range } from "../utils";
import { MetaverseEngine } from "../systemComponents/MetaverseEngine";
import { IdentifiedUser } from "../models/IdentifiedUser";
import { PlayerState } from "../models/PlayerState";
import {
  PlayerGrantScreenViewOwnerSignalState,
  PlayerRequestScreenViewOwnerSignalState,
  PlayerSignalState,
} from "../models/PlayerSignalState";
import { GrantConfirmPopupView, GrantConfirmPopupViewModel } from "../views/GrantConfirmPopupView";
import { Sky } from "three/examples/jsm/objects/Sky";
import { Degrees, ThreeVector3Wrapper } from "../utils/three";
import { OverlayUIView, OverlayUIViewModel } from "../views/OverlayUIView";
import WebCamera from "../systemComponents/WebCamera";
import App from "../systemComponents/App";
import { PlayerTextDataLazyDecoder } from "../models/PlayerTextDataEncoding";

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

export default class MainScene extends AppScene {
  private readonly mainCamera: Three.PerspectiveCamera;
  private readonly cameraContainer: Three.Object3D;
  private readonly player: Three.Object3D;
  private readonly baseGround: Three.Object3D;
  private readonly screenViewPlaneMaterial: Three.MeshLambertMaterial;
  private readonly uiPlane: Three.Object3D;

  static async initialize() {
    const scene = new MainScene();

    scene.registerUnloadActions(
      App.Instance.renderer.observeResize((newWidth, newHeight) => {
        scene.mainCamera.aspect = newWidth / newHeight;
        scene.mainCamera.updateProjectionMatrix();
      })
    );

    const PresetAvatars = [...range(3).map(x => `f${x}`), ...range(3).map(x => `m${x}`)].map(s => ({
      thumbnailURL: `./assets/avatar/${s}.png`,
      avatarURL: `./assets/avatar/${s}.vrm`,
    }));
    const DefaultAvatarURL = randomChoice(PresetAvatars).avatarURL;

    const mvEngine = new MetaverseEngine(
      App.Instance.renderer,
      scene,
      scene.mainCamera,
      scene.cameraContainer,
      scene.player,
      {
        isLowSpecMode: false,
      }
    );
    mvEngine.addTeleportTargetObjects(scene.baseGround);
    mvEngine.addCollisionBoxes(box3FromObject(scene.baseGround));
    scene.registerUnloadActions(
      mvEngine.observeTextDataChanges((issuer, textData) => {
        console.log("text data changes", textData, issuer);

        const decoder = PlayerTextDataLazyDecoder.fromString(textData);
        if (decoder.state.screenViewOwner) {
          App.Instance.isAnyoneScreenViewOwner = true;
        }

        const signal = decoder.signal;
        if (signal) {
          console.log("signal", signal);

          if (
            signal instanceof PlayerRequestScreenViewOwnerSignalState &&
            App.Instance.isCurrentPlayerScreenViewOwner
          ) {
            console.log("showPopup");
            const vm = new GrantConfirmPopupViewModel(decoder.user.identifier);
            scene.uiPlane.add(new GrantConfirmPopupView(vm));
          }

          if (
            signal instanceof PlayerGrantScreenViewOwnerSignalState &&
            signal.to === App.Instance.currentUser!.identifier
          ) {
            console.log("granted!");
            App.Instance.updatePlayerState(p => p.withScreenViewOwner(true));
            App.Instance.clearPlayerSignal();
          }
        }
      })
    );
    const res = await mvEngine.start(DefaultAvatarURL, PresetAvatars);

    // これは毎回設定しないといけない
    res.player.setTextData(App.Instance.makePlayerTextData());
    scene.registerUnloadActions(
      App.Instance.onPlayerTextDataDirty.observe(() => {
        res.player.setTextData(App.Instance.makePlayerTextData());
      })
    );

    // WebCamera制御
    scene.registerUnloadActions(
      App.Instance.currentPlayerState.observe(() => {
        if (App.Instance.isCurrentPlayerScreenViewOwner) {
          WebCamera.Instance.enable();
        } else {
          WebCamera.Instance.disable();
        }
      }),
      WebCamera.Instance.videoTexture.observe(tex => {
        scene.screenViewPlaneMaterial.map = tex;
        scene.screenViewPlaneMaterial.needsUpdate = true;
      })
    );

    return scene;
  }

  private constructor() {
    super();

    this.mainCamera = new Three.PerspectiveCamera(90.0, window.innerWidth / window.innerHeight, 0.1, 100.0);
    this.baseGround = createBaseGround();
    this.add(this.mainCamera, AmbientLight, createSky(), this.baseGround, ...HelperObjects);

    // setup base containers
    this.cameraContainer = new Three.Object3D();
    this.player = new Three.Object3D();
    this.cameraContainer.add(this.mainCamera);
    this.player.add(this.cameraContainer);
    this.add(this.player);

    // setup screen view
    this.screenViewPlaneMaterial = new Three.MeshLambertMaterial({ color: 0xffffff });
    const screenViewPlane = new Three.Mesh(new Three.PlaneGeometry(16, 9, 1, 1), this.screenViewPlaneMaterial);
    screenViewPlane.position.set(0.0, 5, -2.0);
    this.add(screenViewPlane);

    // setup overlay ui
    this.uiPlane = new Three.Object3D();
    this.uiPlane.position.set(0.0, 0.0, -1.0);
    this.add(this.uiPlane);

    const overlayUIViewModel = new OverlayUIViewModel();
    const overlayUI = new OverlayUIView(overlayUIViewModel);
    this.uiPlane.add(overlayUI);
    this.registerUnloadActions(() => overlayUI.dispose());
  }

  override render(renderer: Three.Renderer) {
    renderer.render(this, this.mainCamera);
  }
}
