export class PlayerState {
  static fromJson(json: unknown): PlayerState {
    if (json === null || json === undefined) throw new Error("passed json was null");
    if (typeof json !== "object") throw new Error("invalid shared state json");

    return new PlayerState("screenViewOwner" in json ? (json["screenViewOwner"] as boolean) : false);
  }

  constructor(readonly screenViewOwner: boolean = false) {}

  withScreenViewOwner(ownerFlag: boolean) {
    return new PlayerState(ownerFlag);
  }

  toJson(): any {
    return {
      screenViewOwner: this.screenViewOwner,
    };
  }
}
