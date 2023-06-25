import { AppScene } from "../systemComponents/Renderer";
import * as Three from "three";
import { EntryPopupView, EntryPopupViewModel } from "../views/EntryPopupView";

export default class EntryScene extends AppScene {
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
