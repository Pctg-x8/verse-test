import * as Three from "three";
import { callMultipleActions } from "../utils";
import { CSS2DRenderer } from "three/examples/jsm/renderers/CSS2DRenderer";

export type TickerFunction = (deltaTime: number) => void;
export type ResizeHandler = (newWidth: number, newHeight: number) => void;
export type CleanupFunction = () => void;

export interface IScene {
  render(renderer: Three.Renderer): void;
}

export abstract class AppScene extends Three.Scene implements IScene {
  private unloadActions: (() => void)[] = [];

  protected registerUnloadActions(...actions: (() => void)[]) {
    this.unloadActions.push(...actions);
  }

  onUnload() {
    callMultipleActions(...this.unloadActions);
  }

  abstract render(renderer: Three.Renderer): void;
}

export class SceneManager {
  private current: AppScene | null = null;

  constructor(private extraCleanupFunction?: () => void) {}

  get currentScene(): AppScene | null {
    return this.current;
  }

  async switchScene(next: AppScene | Promise<AppScene> | (() => AppScene) | (() => Promise<AppScene>)) {
    let s = next instanceof Function ? next() : next;
    s = s instanceof Promise ? await s : s;

    this.extraCleanupFunction?.();
    if (this.current) this.current.onUnload();
    this.current = s;
  }
}

export class Renderer {
  private readonly renderer = new Three.WebGLRenderer();
  private readonly tickerCallbacks = new Set<TickerFunction>();
  private readonly resizeHandlers = new Set<ResizeHandler>();
  private readonly overlayUIRenderer = new CSS2DRenderer();
  private readonly overlayUICamera: Three.OrthographicCamera;
  readonly sceneManager = new SceneManager(this.cleanupOverlayUIs.bind(this));

  constructor() {
    this.renderer.outputColorSpace = Three.SRGBColorSpace;
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(window.devicePixelRatio ?? 1);

    this.overlayUIRenderer.domElement.style.position = "absolute";
    this.overlayUIRenderer.domElement.style.top = "0px";
    this.overlayUIRenderer.domElement.style.bottom = "0px";
    this.overlayUIRenderer.domElement.style.pointerEvents = "none";
    this.overlayUIRenderer.setSize(window.innerWidth, window.innerHeight);
    const aspect = window.innerWidth / window.innerHeight;
    this.overlayUICamera = new Three.OrthographicCamera(-aspect, aspect, 1, -1, 0.1, 10.0);

    window.addEventListener("resize", () => {
      this.resize(window.innerWidth, window.innerHeight);
    });
  }

  get object() {
    return this.renderer;
  }

  mountElements(baseNode: Node) {
    baseNode.appendChild(this.renderer.domElement);
    baseNode.appendChild(this.overlayUIRenderer.domElement);
  }

  addTickCallback(ticker: TickerFunction): CleanupFunction {
    this.tickerCallbacks.add(ticker);
    return () => this.tickerCallbacks.delete(ticker);
  }

  observeResize(handler: ResizeHandler): CleanupFunction {
    this.resizeHandlers.add(handler);
    return () => this.resizeHandlers.delete(handler);
  }

  resize(newWidth: number, newHeight: number) {
    this.renderer.setSize(newWidth, newHeight);
    const aspect = newWidth / newHeight;
    this.overlayUICamera.left = -aspect;
    this.overlayUICamera.right = aspect;
    this.overlayUICamera.updateProjectionMatrix();
    this.overlayUIRenderer.setSize(newWidth, newHeight);
    for (const h of this.resizeHandlers) h(newWidth, newHeight);
  }

  runLoop() {
    const timer = new Three.Clock(true);
    this.renderer.setAnimationLoop(() => {
      const dt = timer.getDelta();
      for (const c of this.tickerCallbacks) {
        c(dt);
      }
      if (this.sceneManager.currentScene) {
        this.sceneManager.currentScene.render(this.renderer);
        this.overlayUIRenderer.render(this.sceneManager.currentScene, this.overlayUICamera);
      }
    });
  }

  private cleanupOverlayUIs() {
    while (this.overlayUIRenderer.domElement.firstChild) {
      this.overlayUIRenderer.domElement.removeChild(this.overlayUIRenderer.domElement.firstChild);
    }
  }
}
