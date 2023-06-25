import { AppScene } from "../systemComponents/Renderer";
import * as Three from "three";
import { GrantConfirmPopupView, GrantConfirmPopupViewModel } from "../views/GrantConfirmPopupView";

export default class DebugUISCene extends AppScene {
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
