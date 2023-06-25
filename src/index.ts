import * as Three from "three";
import { Sky } from "three/examples/jsm/objects/Sky";
import { MetaverseEngine } from "./MetaverseEngine";
import { AppScene, CleanupFunction, Renderer } from "./Renderer";
import { box3FromObject, callMultipleActions, callMultipleFunctions, hasValue, randomChoice, range } from "./utils";
import { Degrees, ThreeVector3Wrapper } from "./utils/three";
import { CSS2DObject } from "three/examples/jsm/renderers/CSS2DRenderer";

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

export class IdentifiedUser {
  static readonly LocalStorageKey = "localUser";

  static tryLoad(): IdentifiedUser | undefined {
    const savedItems = localStorage.getItem(IdentifiedUser.LocalStorageKey);

    return savedItems ? IdentifiedUser.fromJson(JSON.parse(savedItems)) : undefined;
  }

  static fromJson(json: unknown): IdentifiedUser {
    if (json === null || json === undefined) throw new Error("passed json was null");
    if (typeof json !== "object") throw new Error("invalid stored user identifier");
    if (!("identifier" in json) || !("displayName" in json)) throw new Error("missing required fields");

    return new IdentifiedUser(json["identifier"] as string, json["displayName"] as string);
  }

  constructor(readonly identifier: string, readonly displayName: string) {}

  toJson(): any {
    return {
      identifier: this.identifier,
      displayName: this.displayName,
    };
  }

  save() {
    localStorage.setItem(IdentifiedUser.LocalStorageKey, JSON.stringify(this.toJson()));
  }
}

export class PlayerState {
  static fromJson(json: unknown): PlayerState {
    if (json === null || json === undefined) throw new Error("passed json was null");
    if (typeof json !== "object") throw new Error("invalid shared state json");

    return new PlayerState("screenViewOwner" in json ? (json["screenViewOwner"] as boolean) : false);
  }

  constructor(readonly screenViewOwner: boolean = false) {}

  withScreenViewOwner(ownerFlag: boolean) {
    return new PlayerState(ownerFlag);
  }

  toJson(): any {
    return {
      screenViewOwner: this.screenViewOwner,
    };
  }
}

export function requireProperty<K extends string>(o: object, k: K): unknown {
  if (k in o) return (o as Record<K, unknown>)[k];
  throw new Error(`key ${k} was not given in object`);
}

export abstract class PlayerSignalState {
  static fromJson(json: unknown): PlayerSignalState {
    if (json === undefined || json === null) throw new Error("passed json was null");

    if (typeof json === "object" && "type" in json) {
      switch (json["type"]) {
        case "RequestScreenViewOwner":
          return new PlayerRequestScreenViewOwnerSignalState();
        case "GrantScreenViewOwnerSignalState":
          return new PlayerGrantScreenViewOwnerSignalState(requireProperty(json, "to") as string);
      }
    }

    throw new Error("invalid json object for PlayerSignalState");
  }

  abstract toJson(): any;
}
export class PlayerRequestScreenViewOwnerSignalState extends PlayerSignalState {
  override toJson(): any {
    return {
      type: "RequestScreenViewOwner",
    };
  }
}
export class PlayerGrantScreenViewOwnerSignalState extends PlayerSignalState {
  constructor(readonly to: string) {
    super();
  }

  override toJson(): any {
    return {
      type: "GrantScreenViewOwnerSignalState",
      to: this.to,
    };
  }
}

export interface IDisposable {
  dispose(): void;
}

export class EntryPopupViewModel {
  createUser(displayName: string) {
    App.Instance.currentUser = new IdentifiedUser(window.crypto.randomUUID(), displayName);
  }
}

export class EntryPopupView extends CSS2DObject {
  constructor(viewModel: EntryPopupViewModel) {
    const popupContainer = document.createElement("div");
    popupContainer.style.position = "absolute";
    popupContainer.style.backgroundColor = "white";
    popupContainer.style.borderRadius = "4px";
    popupContainer.style.boxShadow = "0 0 16px 8px rgba(0 0 0 / 5%)";
    popupContainer.style.userSelect = "none";
    popupContainer.style.pointerEvents = "auto";

    const title = popupContainer.appendChild(document.createElement("h1"));
    title.textContent = "entry planet-p.ct2.io";
    title.style.textAlign = "center";
    title.style.margin = "0.4rem";
    title.style.padding = "0";
    title.style.fontSize = "14px";
    title.style.fontWeight = "bolder";

    const border = popupContainer.appendChild(document.createElement("hr"));
    border.style.width = "100%";
    border.style.height = "1px";
    border.style.margin = "0";
    border.style.padding = "0";
    border.style.background =
      "linear-gradient(to right, rgba(192 192 192 / 0%), rgba(192 192 192 / 75%), rgba(192 192 192 / 0%))";
    border.style.border = "none";

    const form = popupContainer.appendChild(document.createElement("form"));
    form.style.margin = "0.8rem 2rem";
    form.style.padding = "0";

    const contentGrid = form.appendChild(document.createElement("section"));
    contentGrid.style.display = "grid";
    contentGrid.style.gridTemplateColumns = "auto 1fr";
    contentGrid.style.gap = "0.4rem";
    contentGrid.style.margin = "2rem 0";
    contentGrid.style.padding = "0";

    const displayNameLabel = contentGrid.appendChild(document.createElement("label"));
    displayNameLabel.textContent = "displayName:";
    displayNameLabel.htmlFor = "displayNameInput";

    const displayNameInput = contentGrid.appendChild(document.createElement("input"));
    displayNameInput.id = "displayNameInput";
    displayNameInput.type = "text";

    const buttonContainer = form.appendChild(document.createElement("div"));
    buttonContainer.style.display = "flex";
    buttonContainer.style.flexDirection = "row";
    buttonContainer.style.justifyContent = "center";
    const enterButton = buttonContainer.appendChild(document.createElement("button"));
    enterButton.type = "submit";
    enterButton.textContent = "Enter";
    // enterButton.style.borderRadius = "8px";
    // enterButton.style.margin = "0";
    // enterButton.style.padding = "0.4rem 1.2rem";
    // enterButton.style.background = "#6af";
    // enterButton.style.border = "solid 1px #06c";
    // enterButton.style.cursor = "pointer";
    // enterButton.style.color = "white";

    super(popupContainer);

    enterButton.disabled = true;
    displayNameInput.addEventListener("input", e => {
      enterButton.disabled = displayNameInput.value.length <= 0;
    });
    form.addEventListener("submit", async e => {
      e.stopPropagation();
      e.preventDefault();

      viewModel.createUser(displayNameInput.value);
      await App.Instance.renderer.sceneManager.switchScene(MainScene.initialize());

      return false;
    });
  }
}

export class EntryScene extends AppScene {
  private uiCamera: Three.OrthographicCamera;
  private popup: EntryPopupView;

  static initialize() {
    const scene = new EntryScene();

    return scene;
  }

  private constructor() {
    super();
    this.background = new Three.Color(255, 255, 255);

    const aspect = window.innerWidth / window.innerHeight;
    this.uiCamera = new Three.OrthographicCamera(-5 * aspect, 5 * aspect, 5, -5, 0.1, 10.0);

    const uiPlane = new Three.Object3D();
    uiPlane.position.set(0.0, 0.0, -1.0);
    this.add(uiPlane);

    const popupViewModel = new EntryPopupViewModel();
    this.popup = new EntryPopupView(popupViewModel);
    uiPlane.add(this.popup);
  }

  override render(renderer: Three.Renderer): void {
    renderer.render(this, this.uiCamera);
  }
}

export class GrantConfirmPopupViewModel {
  constructor(private readonly requestingUserId: string) {}

  grantToUser() {
    App.Instance.updatePlayerState(x => x.withScreenViewOwner(false));
    App.Instance.updatePlayerSignal(new PlayerGrantScreenViewOwnerSignalState(this.requestingUserId));
  }
}
export class GrantConfirmPopupView extends Three.Object3D {
  constructor(viewModel: GrantConfirmPopupViewModel) {
    super();

    const popupContainer = document.createElement("div");
    popupContainer.style.position = "absolute";
    popupContainer.style.backgroundColor = "white";
    popupContainer.style.borderRadius = "4px";
    popupContainer.style.boxShadow = "0 0 16px 8px rgba(0 0 0 / 5%)";
    popupContainer.style.userSelect = "none";
    popupContainer.style.pointerEvents = "auto";
    popupContainer.style.zIndex = "101";

    const title = popupContainer.appendChild(document.createElement("h1"));
    title.textContent = "confirm to grant";
    title.style.textAlign = "center";
    title.style.margin = "0.4rem";
    title.style.padding = "0";
    title.style.fontSize = "14px";
    title.style.fontWeight = "bolder";

    const border = popupContainer.appendChild(document.createElement("hr"));
    border.style.width = "100%";
    border.style.height = "1px";
    border.style.margin = "0";
    border.style.padding = "0";
    border.style.background =
      "linear-gradient(to right, rgba(192 192 192 / 0%), rgba(192 192 192 / 75%), rgba(192 192 192 / 0%))";
    border.style.border = "none";

    const message = popupContainer.appendChild(document.createElement("p"));
    message.textContent = "another user has requested to use ScreenView. Do you grant it?";
    message.style.margin = "0.8rem 2rem";
    message.style.padding = "0";
    message.style.fontSize = "12px";

    const buttonContainer = popupContainer.appendChild(document.createElement("div"));
    buttonContainer.style.display = "flex";
    buttonContainer.style.flexDirection = "row";
    buttonContainer.style.justifyContent = "center";
    buttonContainer.style.marginBottom = "0.4rem";
    buttonContainer.style.gap = "0.8rem";
    const okButton = buttonContainer.appendChild(document.createElement("button"));
    okButton.type = "submit";
    okButton.textContent = "Grant";
    const cancelButton = buttonContainer.appendChild(document.createElement("button"));
    cancelButton.type = "submit";
    cancelButton.textContent = "Reject";

    this.add(new CSS2DObject(popupContainer));

    const baseElement = document.createElement("div");
    baseElement.style.width = "100%";
    baseElement.style.height = "100%";
    baseElement.style.background = "rgba(0 0 0 / 30%)";
    baseElement.style.backdropFilter = "blur(8px)";
    baseElement.style.pointerEvents = "auto";
    const base = new CSS2DObject(baseElement);
    this.add(base);

    okButton.addEventListener("click", () => {
      viewModel.grantToUser();
      if (baseElement.parentNode) {
        baseElement.parentNode.removeChild(baseElement);
      }
      if (popupContainer.parentNode) {
        popupContainer.parentNode.removeChild(popupContainer);
      }
      this.removeFromParent();
    });
    cancelButton.addEventListener("click", () => {
      if (baseElement.parentNode) {
        baseElement.parentNode.removeChild(baseElement);
      }
      if (popupContainer.parentNode) {
        popupContainer.parentNode.removeChild(popupContainer);
      }
      this.removeFromParent();
    });
  }
}

export class DebugUISCene extends AppScene {
  constructor() {
    super();

    // setup overlay ui
    const uiPlane = new Three.Object3D();
    uiPlane.position.set(0.0, 0.0, -1.0);
    this.add(uiPlane);

    const vm = new GrantConfirmPopupViewModel("test");
    uiPlane.add(new GrantConfirmPopupView(vm));
  }

  override render(_: Three.Renderer): void {}
}

export class OverlayUIViewModel {
  private readonly _menuShowing = new ReactiveValue(false);

  toggleMenu() {
    this._menuShowing.update(x => !x);
  }

  hideMenu() {
    this._menuShowing.value = false;
  }

  get menuShowing() {
    return this._menuShowing.asReadonly;
  }

  requestScreenViewOwner() {
    if (App.Instance.isCurrentPlayerScreenViewOwner) return;

    if (App.Instance.isAnyoneScreenViewOwner) {
      // request owner
      App.Instance.updatePlayerSignal(new PlayerRequestScreenViewOwnerSignalState());
      return;
    }

    App.Instance.updatePlayerState(o => o.withScreenViewOwner(true));
  }
}

export class OverlayUIView extends CSS2DObject implements IDisposable {
  private cleanupFunctions: CleanupFunction[] = [];

  constructor(viewModel: OverlayUIViewModel) {
    const container = document.createElement("div");
    container.style.width = "100%";
    container.style.height = "100%";

    const menuButton = container.appendChild(document.createElement("button"));
    menuButton.textContent = "Menu";
    menuButton.type = "button";
    menuButton.style.display = "block";
    menuButton.style.position = "absolute";
    menuButton.style.left = "8px";
    menuButton.style.top = "8px";
    menuButton.style.pointerEvents = "auto";

    const menuContent = container.appendChild(document.createElement("section"));
    menuContent.style.position = "absolute";
    menuContent.style.background = "rgba(0 0 0 / 50%)";
    menuContent.style.pointerEvents = "auto";

    const menuItemList = menuContent.appendChild(document.createElement("ul"));
    menuItemList.style.margin = "0";
    menuItemList.style.padding = "0";
    menuItemList.style.listStyle = "none";

    const menuItemRequestScreenViewOwner = menuItemList.appendChild(document.createElement("button"));
    menuItemRequestScreenViewOwner.textContent = "Request ScreenViewOwner";
    menuItemRequestScreenViewOwner.className = "overlayMenuItem";

    super(container);

    this.cleanupFunctions.push(
      App.Instance.currentPlayerState.observe(state => {
        const canRequest = !state.screenViewOwner;

        menuItemRequestScreenViewOwner.textContent = canRequest ? "Request ScreenViewOwner" : "You're ScreenViewOwner";
        menuItemRequestScreenViewOwner.disabled = !canRequest;
      })
    );
    menuButton.addEventListener("click", () => {
      viewModel.toggleMenu();
    });
    menuItemRequestScreenViewOwner.addEventListener("click", () => {
      viewModel.hideMenu();
      viewModel.requestScreenViewOwner();
    });
    this.cleanupFunctions.push(
      viewModel.menuShowing.observe(x => {
        if (viewModel.menuShowing) {
          const menuButtonBox = menuButton.getBoundingClientRect();
          menuContent.style.left = `${menuButtonBox.left}px`;
          menuContent.style.top = `${menuButtonBox.bottom}px`;
        }

        menuContent.style.display = x ? "block" : "none";
      })
    );
  }

  dispose() {
    callMultipleActions(...this.cleanupFunctions);
  }
}

export class MainScene extends AppScene {
  private readonly mainCamera: Three.PerspectiveCamera;
  private readonly cameraContainer: Three.Object3D;
  private readonly player: Three.Object3D;
  private readonly baseGround: Three.Object3D;
  private readonly screenViewPlane: Three.Mesh;
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

        const data = JSON.parse(textData) as Record<"state", object> & Record<"user", object> & object;
        const user = IdentifiedUser.fromJson(data["user"]);
        const state = PlayerState.fromJson(data["state"]);
        if (state.screenViewOwner) {
          App.Instance.isAnyoneScreenViewOwner = true;
        }
        if ("signal" in data) {
          const signal = PlayerSignalState.fromJson(data["signal"]);
          console.log("requested signal", signal);
          if (
            signal instanceof PlayerRequestScreenViewOwnerSignalState &&
            App.Instance.isCurrentPlayerScreenViewOwner
          ) {
            console.log("showPopup");
            const vm = new GrantConfirmPopupViewModel(user.identifier);
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

    scene.registerUnloadActions(
      App.Instance.currentPlayerState.observe(() => {
        if (App.Instance.isCurrentPlayerScreenViewOwner) {
          WebCamera.Instance.enable();
        } else {
          WebCamera.Instance.disable();
        }
      }),
      WebCamera.Instance.videoTexture.observe(tex => {
        (scene.screenViewPlane.material as Three.MeshLambertMaterial).map = tex;
        (scene.screenViewPlane.material as Three.MeshLambertMaterial).needsUpdate = true;
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
    this.screenViewPlane = new Three.Mesh(
      new Three.PlaneGeometry(16, 9, 1, 1),
      new Three.MeshLambertMaterial({ color: 0xffffff })
    );
    this.screenViewPlane.position.set(0.0, 5, -2.0);
    this.add(this.screenViewPlane);

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

export class UnorderedSignal {
  private observers = new Set<() => void>();

  observe(handler: () => void): CleanupFunction {
    this.observers.add(handler);
    return () => this.observers.delete(handler);
  }

  signal() {
    callMultipleActions(...this.observers);
  }
}
export class ReadonlyReactiveValue<T> {
  protected observers = new Set<(value: T) => void>();

  constructor(protected _value: T) {}

  observe(handler: (value: T) => void): CleanupFunction {
    this.observers.add(handler);
    handler(this.value);
    return () => this.observers.delete(handler);
  }

  get value() {
    return this._value;
  }
}
export class ReactiveValue<T> extends ReadonlyReactiveValue<T> {
  constructor(init: T) {
    super(init);
  }

  get value() {
    return this._value;
  }

  set value(value: T) {
    this._value = value;
    callMultipleFunctions(value)(...this.observers);
  }

  update(updater: (old: T) => T) {
    this.value = updater(this.value);
  }

  get asReadonly(): ReadonlyReactiveValue<T> {
    return this;
  }
}

type ExtResourceLoading = { readonly type: "Loading" };
type ExtResourceLoaded<T> = { readonly type: "Loaded"; readonly value: T };
type ExtResource<T> = ExtResourceLoading | ExtResourceLoaded<T>;

class WebCamera {
  static readonly Instance: WebCamera = new WebCamera();

  private _videoSourceElement: HTMLVideoElement | null = null;
  private _videoTexture = new ReactiveValue<Three.VideoTexture | null>(null);
  private _cameraDevices: ExtResource<MediaDeviceInfo[]> = { type: "Loading" };
  readonly onCameraDevicesChanged = new UnorderedSignal();

  async enable() {
    this._videoTexture.value = null;

    const media = await navigator.mediaDevices.getUserMedia({ video: true });
    console.log("primary media", media);
    this.enumerateDevices();

    // TODO: これをなんとかして他ブラウザに送らないといけない（さすがにVideoTextureはVerseEngineでは自動同期されない）
    // 任意のMediaStream追加したりRTCPeerConnection追加したりする機能はなさそうなので自前でやるしかないか......？
    this._videoSourceElement ??= document.createElement("video");
    this._videoSourceElement.autoplay = true;
    this._videoSourceElement.srcObject = media;
    const vt = new Three.VideoTexture(this._videoSourceElement);
    vt.colorSpace = Three.SRGBColorSpace;
    this._videoTexture.value = vt;
  }

  disable() {
    this._videoTexture.value?.dispose();
    this._videoTexture.value = null;
  }

  async enumerateDevices() {
    return navigator.mediaDevices.enumerateDevices().then(x => {
      console.log("mediaDevices", x);
      this._cameraDevices = { type: "Loaded", value: x };
      this.onCameraDevicesChanged.signal();
    });
  }

  get cameraDevices() {
    return this._cameraDevices;
  }

  get videoTexture() {
    return this._videoTexture.asReadonly;
  }
}

class App {
  static readonly Instance: App = new App();

  readonly renderer: Renderer = new Renderer();
  private _currentUser: IdentifiedUser | null | undefined = null;
  private _currentPlayerState = new ReactiveValue(new PlayerState());
  private _currentSignal: PlayerSignalState | null = null;
  readonly onPlayerTextDataDirty = new UnorderedSignal();
  // TODO: これあとでなんとかする
  isAnyoneScreenViewOwner = false;
  private _clientSignalNonce = 0;

  private constructor() {}

  run() {
    this.renderer.mountElements(document.body);
    this.renderer.runLoop();
  }

  get currentUser(): IdentifiedUser | undefined {
    if (this._currentUser || this._currentUser === undefined) return this._currentUser;
    return (this._currentUser = IdentifiedUser.tryLoad());
  }

  set currentUser(user: IdentifiedUser) {
    user.save();
    this._currentUser = user;
  }

  get isCurrentPlayerScreenViewOwner() {
    return this._currentPlayerState.value.screenViewOwner;
  }

  makePlayerTextData(): string {
    const cuser = this.currentUser;
    if (!cuser) return "";

    const o: Record<string, unknown> = {
      user: cuser.toJson(),
      state: this._currentPlayerState.value.toJson(),
    };
    if (this._currentSignal) {
      o["signal"] = this._currentSignal.toJson();
      o["signalNonce"] = this._clientSignalNonce;
    }

    return JSON.stringify(o);
  }

  updatePlayerSignal(newSignal: PlayerSignalState) {
    this._currentSignal = newSignal;
    this._clientSignalNonce += 1;
    this.onPlayerTextDataDirty.signal();
  }

  clearPlayerSignal() {
    this._currentSignal = null;
    this._clientSignalNonce += 1;
    this.onPlayerTextDataDirty.signal();
  }

  updatePlayerState(newState: PlayerState | ((old: PlayerState) => PlayerState)) {
    this._currentPlayerState.value = newState instanceof Function ? newState(this._currentPlayerState.value) : newState;
    this.onPlayerTextDataDirty.signal();
  }

  get currentPlayerState() {
    return this._currentPlayerState.asReadonly;
  }
}

async function main() {
  if (App.Instance.currentUser === undefined) {
    await App.Instance.renderer.sceneManager.switchScene(EntryScene.initialize());
  } else {
    await App.Instance.renderer.sceneManager.switchScene(MainScene.initialize());
  }
  // await App.Instance.renderer.sceneManager.switchScene(new DebugUISCene());

  App.Instance.run();
}

main();
