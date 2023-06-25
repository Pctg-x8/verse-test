import { CSS2DObject } from "three/examples/jsm/renderers/CSS2DRenderer";
import { PlayerGrantScreenViewOwnerSignalState } from "../models/PlayerSignalState";
import * as Three from "three";
import App from "../systemComponents/App";

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
