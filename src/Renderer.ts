import * as Three from "three";

type TickerFunction = (deltaTime: number) => void;

export class Renderer {
  private readonly renderer: Three.WebGLRenderer;
  private readonly tickerCallbacks: TickerFunction[] = [];
  readonly rootScene: Three.Scene;
  readonly mainCamera: Three.PerspectiveCamera;

  constructor() {
    this.renderer = new Three.WebGLRenderer();
    this.renderer.outputColorSpace = Three.SRGBColorSpace;
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(window.devicePixelRatio ?? 1);

    this.rootScene = new Three.Scene();
    this.mainCamera = new Three.PerspectiveCamera(90.0, window.innerWidth / window.innerHeight, 0.1, 100.0);
    this.rootScene.add(this.mainCamera);
  }

  get object() {
    return this.renderer;
  }

  get domElement() {
    return this.renderer.domElement;
  }

  addTickCallback(ticker: TickerFunction) {
    this.tickerCallbacks.push(ticker);
  }

  resize(newWidth: number, newHeight: number) {
    this.mainCamera.aspect = newWidth / newHeight;
    this.mainCamera.updateProjectionMatrix();
    this.renderer.setSize(newWidth, newHeight);
  }

  runLoop() {
    const timer = new Three.Clock(true);
    this.renderer.setAnimationLoop(() => {
      const dt = timer.getDelta();
      for (const c of this.tickerCallbacks) {
        c(dt);
      }
      this.renderer.render(this.rootScene, this.mainCamera);
    });
  }
}
