import * as Three from "three";
import * as v3 from "@verseengine/verse-three";
import * as v3ui from "@verseengine/verse-three-ui";
import type { Renderer } from "./Renderer";

const ANIMATION_MAP = {
  idle: "./assets/animation/idle.fbx",
  walk: "./assets/animation/walk.fbx",
};

export class MetaverseEngine {
  static readonly VERSE_WASM_URL =
    "https://cdn.jsdelivr.net/npm/@verseengine/verse-three@1.0.0/dist/verse_core_bg.wasm";
  static readonly VERSE_ENTRACE_SERVER_URL = "https://entrance.verseengine.cloud";
  static readonly ICE_SERVERS = [{ urls: "stun:stun.1.google.com:19302" }, { urls: "stun:stun1.1.google.com:19302" }];

  readonly collisionBoxes: Three.Box3[] = [];
  readonly collisionObjects: Three.Object3D[] = [];
  readonly teleportTargetObjects: Three.Object3D[] = [];
  private readonly adapter: v3.EnvAdapter;

  constructor(
    private readonly renderer: Renderer,
    cameraContainer: Three.Object3D,
    cameraRig: Three.Object3D,
    options?: v3.DefaultEnvAdapterOptions
  ) {
    this.adapter = new v3.DefaultEnvAdapter(
      renderer.object,
      renderer.rootScene,
      renderer.mainCamera,
      cameraContainer,
      cameraRig,
      () => this.collisionBoxes,
      () => this.collisionObjects,
      () => this.teleportTargetObjects,
      options
    );
  }

  async start(defaultAvatarUrl: string, presetAvatars: v3ui.PresetAvatar[]) {
    const res = await v3.start(
      this.adapter,
      this.renderer.rootScene,
      MetaverseEngine.VERSE_WASM_URL,
      MetaverseEngine.VERSE_ENTRACE_SERVER_URL,
      defaultAvatarUrl,
      ANIMATION_MAP,
      MetaverseEngine.ICE_SERVERS,
      {
        maxNumberOfPeople: 16,
        maxNumberOfParallelFileTransfers: 4,
        presetAvatars,
      }
    );
    this.renderer.addTickCallback(res.tick);
    return res;
  }

  addCollisionBoxes(...boxes: Three.Box3[]) {
    this.collisionBoxes.push(...boxes);
  }

  addCollisionObjects(...objects: Three.Object3D[]) {
    this.collisionObjects.push(...objects);
  }

  addTeleportTargetObjects(...objects: Three.Object3D[]) {
    this.teleportTargetObjects.push(...objects);
  }
}
