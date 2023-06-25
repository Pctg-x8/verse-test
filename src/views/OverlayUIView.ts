import { CSS2DObject } from "three/examples/jsm/renderers/CSS2DRenderer";
import { PlayerRequestScreenViewOwnerSignalState } from "../models/PlayerSignalState";
import { IDisposable, callMultipleActions } from "../utils";
import { CleanupFunction } from "../systemComponents/Renderer";
import App from "../systemComponents/App";
import { ReactiveValue } from "../utils/reactive";

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
