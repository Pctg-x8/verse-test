export class IdentifiedUser {
  static readonly LocalStorageKey = "localUser";

  static tryLoad(): IdentifiedUser | undefined {
    const savedItems = localStorage.getItem(IdentifiedUser.LocalStorageKey);

    return savedItems ? IdentifiedUser.fromJson(JSON.parse(savedItems)) : undefined;
  }

  static fromJson(json: unknown): IdentifiedUser {
    if (json === null || json === undefined) throw new Error("passed json was null");
    if (typeof json !== "object") throw new Error("invalid stored user identifier");
    if (!("identifier" in json) || !("displayName" in json)) throw new Error("missing required fields");

    return new IdentifiedUser(json["identifier"] as string, json["displayName"] as string);
  }

  constructor(readonly identifier: string, readonly displayName: string) {}

  toJson(): any {
    return {
      identifier: this.identifier,
      displayName: this.displayName,
    };
  }

  save() {
    localStorage.setItem(IdentifiedUser.LocalStorageKey, JSON.stringify(this.toJson()));
  }
}
