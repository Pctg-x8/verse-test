import { CSS2DObject } from "three/examples/jsm/renderers/CSS2DRenderer";
import { IdentifiedUser } from "../models/IdentifiedUser";
import MainScene from "../scenes/MainScene";
import App from "../systemComponents/App";

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
