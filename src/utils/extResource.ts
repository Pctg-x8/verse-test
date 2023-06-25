type ExtResourceLoading = { readonly type: "Loading" };
type ExtResourceLoaded<T> = { readonly type: "Loaded"; readonly value: T };
export type ExtResource<T> = ExtResourceLoading | ExtResourceLoaded<T>;
