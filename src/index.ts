import App from "./systemComponents/App";
import EntryScene from "./scenes/EntryScene";
import MainScene from "./scenes/MainScene";

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
