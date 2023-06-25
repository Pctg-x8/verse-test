import * as Three from "three";

export function range(n: number): number[] {
  return [...Array(n).keys()];
}

export function randomChoice<T>(a: T[]): T {
  return a[Math.floor(Math.random() * a.length)];
}

export function box3FromObject(obj: Three.Object3D): Three.Box3 {
  return new Three.Box3().setFromObject(obj);
}

export function callMultipleActions(...actions: (() => void)[]): void {
  for (const c of actions) c();
}

export function callMultipleFunctions<Args extends readonly unknown[]>(
  ...args: Args
): (...actions: ((...args: Args) => void)[]) => void {
  return (...actions) => {
    for (const a of actions) a(...args);
  };
}

export function hasValue<T>(value: T): value is NonNullable<T> {
  return value !== undefined && value !== null;
}
