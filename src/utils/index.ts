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
