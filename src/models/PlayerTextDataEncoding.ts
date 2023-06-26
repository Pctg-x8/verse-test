import { requireProperty } from "../utils";
import { IdentifiedUser } from "./IdentifiedUser";
import { PlayerSignalState } from "./PlayerSignalState";
import { PlayerState } from "./PlayerState";

export class PlayerTextDataEncoder {
  private signal: PlayerSignalState | null = null;
  private signalNonce = 0;

  constructor(private readonly user: IdentifiedUser, private readonly state: PlayerState) {}

  withSignal(signal: PlayerSignalState, nonce: number) {
    this.signal = signal;
    this.signalNonce = nonce;

    return this;
  }

  encode(): string {
    const o: Record<string, unknown> = {
      user: this.user.toJson(),
      state: this.state.toJson(),
    };
    if (this.signal) {
      // emit signal if provided
      o["signal"] = this.signal.toJson();
      o["signalNonce"] = this.signalNonce;
    }

    return JSON.stringify(o);
  }
}

export class PlayerTextDataLazyDecoder {
  static fromString(jsonText: string) {
    return new PlayerTextDataLazyDecoder(JSON.parse(jsonText));
  }

  constructor(private readonly json: object) {}

  get user() {
    return IdentifiedUser.fromJson(requireProperty(this.json, "user"));
  }

  get state() {
    return PlayerState.fromJson(requireProperty(this.json, "state"));
  }

  get signal() {
    return "signal" in this.json ? PlayerSignalState.fromJson(this.json["signal"]) : null;
  }
}
