import { Renderer } from "./Renderer";
import { IdentifiedUser } from "../models/IdentifiedUser";
import { PlayerSignalState } from "../models/PlayerSignalState";
import { PlayerState } from "../models/PlayerState";
import { ReactiveValue, UnorderedSignal } from "../utils/reactive";
import { PlayerTextDataEncoder } from "../models/PlayerTextDataEncoding";

export default class App {
  static readonly Instance: App = new App();

  readonly renderer: Renderer = new Renderer();
  private _currentUser: IdentifiedUser | null | undefined = null;
  private _currentPlayerState = new ReactiveValue(new PlayerState());
  private _currentSignal: PlayerSignalState | null = null;
  readonly onPlayerTextDataDirty = new UnorderedSignal();
  // TODO: これあとでなんとかする
  isAnyoneScreenViewOwner = false;
  private _clientSignalNonce = 0;

  private constructor() {}

  run() {
    this.renderer.mountElements(document.body);
    this.renderer.runLoop();
  }

  get currentUser(): IdentifiedUser | undefined {
    if (this._currentUser || this._currentUser === undefined) return this._currentUser;
    return (this._currentUser = IdentifiedUser.tryLoad());
  }

  set currentUser(user: IdentifiedUser) {
    user.save();
    this._currentUser = user;
  }

  get isCurrentPlayerScreenViewOwner() {
    return this._currentPlayerState.value.screenViewOwner;
  }

  makePlayerTextData(): string {
    const cuser = this.currentUser;
    if (!cuser) return "";

    const encoder = new PlayerTextDataEncoder(cuser, this._currentPlayerState.value);
    if (this._currentSignal) encoder.withSignal(this._currentSignal, this._clientSignalNonce);
    return encoder.encode();
  }

  updatePlayerSignal(newSignal: PlayerSignalState) {
    this._currentSignal = newSignal;
    this._clientSignalNonce += 1;
    this.onPlayerTextDataDirty.signal();
  }

  clearPlayerSignal() {
    this._currentSignal = null;
    this._clientSignalNonce += 1;
    this.onPlayerTextDataDirty.signal();
  }

  updatePlayerState(newState: PlayerState | ((old: PlayerState) => PlayerState)) {
    this._currentPlayerState.value = newState instanceof Function ? newState(this._currentPlayerState.value) : newState;
    this.onPlayerTextDataDirty.signal();
  }

  get currentPlayerState() {
    return this._currentPlayerState.asReadonly;
  }
}
