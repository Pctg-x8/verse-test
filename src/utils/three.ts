import * as Three from "three";

export interface AngularValue {
  asRadians(): number;
  asDegrees(): number;
}
export class Degrees implements AngularValue {
  constructor(readonly value: number) {}

  asRadians(): number {
    return Three.MathUtils.degToRad(this.value);
  }

  asDegrees(): number {
    return this.value;
  }
}
export class Radians implements AngularValue {
  constructor(readonly value: number) {}

  asRadians(): number {
    return this.value;
  }

  asDegrees(): number {
    return Three.MathUtils.radToDeg(this.value);
  }
}

export class ThreeVector3Wrapper {
  readonly value: Three.Vector3;

  static fromSphericalCoords(r: number, phi: AngularValue, theta: AngularValue) {
    const v3 = new Three.Vector3();
    v3.setFromSphericalCoords(r, phi.asRadians(), theta.asRadians());

    return new ThreeVector3Wrapper(v3);
  }

  constructor(init?: Three.Vector3) {
    this.value = init ?? new Three.Vector3();
  }
}
