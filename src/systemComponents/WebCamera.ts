import { ExtResource } from "../utils/extResource";
import { ReactiveValue, UnorderedSignal } from "../utils/reactive";
import * as Three from "three";

export default class WebCamera {
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
