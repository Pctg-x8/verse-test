import { requireProperty } from "../utils";

export abstract class PlayerSignalState {
  static fromJson(json: unknown): PlayerSignalState {
    if (json === undefined || json === null) throw new Error("passed json was null");

    if (typeof json === "object" && "type" in json) {
      switch (json["type"]) {
        case "RequestScreenViewOwner":
          return new PlayerRequestScreenViewOwnerSignalState();
        case "GrantScreenViewOwnerSignalState":
          return new PlayerGrantScreenViewOwnerSignalState(requireProperty(json, "to") as string);
      }
    }

    throw new Error("invalid json object for PlayerSignalState");
  }

  abstract toJson(): any;
}
export class PlayerRequestScreenViewOwnerSignalState extends PlayerSignalState {
  override toJson(): any {
    return {
      type: "RequestScreenViewOwner",
    };
  }
}
export class PlayerGrantScreenViewOwnerSignalState extends PlayerSignalState {
  constructor(readonly to: string) {
    super();
  }

  override toJson(): any {
    return {
      type: "GrantScreenViewOwnerSignalState",
      to: this.to,
    };
  }
}
