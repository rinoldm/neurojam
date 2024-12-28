export const EPSILON = 1e-8;

export type HitBoxType = "Circle" | "Point" | "Rect" | "Segment";

export interface SegmentData {
  center: Vec2;
  // half-width
  r: Vec2;
}

export interface SegmentHitBox extends SegmentData {
  type: "Segment";
}


export interface RectHitBox extends RectData {
  type: "Rect";
}

export interface RectData {
  center: Vec2;
  // half-width and half-height
  r: Vec2;
}

export interface RectHitBox extends RectData {
  type: "Rect";
}

export interface CircleData {
  // center
  center: Vec2;
  // radius
  r: number;
}

export interface CircleHitBox extends CircleData {
  type: "Circle";
}

export interface PointData {
  // center
  center: Vec2;
}

export interface PointHitBox extends PointData {
  type: "Point";
}

export type HitBox = CircleHitBox | PointHitBox | RectHitBox | SegmentHitBox;

export class Vec2<T = number> {
  readonly x: T;
  readonly y: T;

  constructor(x: T, y: T) {
    this.x = x;
    this.y = y;
  }

  isZero(): boolean {
    return this.x === 0 && this.y === 0;
  }

  add(this: Vec2, other: Vec2): Vec2 {
    return new Vec2(this.x + other.x, this.y + other.y);
  }

  sub(this: Vec2, other: Vec2): Vec2 {
    return new Vec2(this.x - other.x, this.y - other.y);
  }

  neg(this: Vec2): Vec2 {
    return new Vec2(-this.x, -this.y);
  }

  scalarMult(this: Vec2, other: number): Vec2 {
    return new Vec2(this.x * other, this.y * other);
  }

  elemMult(this: Vec2, other: Vec2): Vec2 {
    return new Vec2(this.x * other.x, this.y * other.y);
  }

  /// cross product
  cross(this: Vec2, other: Vec2): number {
    return this.x * other.y - other.x * this.y;
  }

  elemDiv(this: Vec2, other: Vec2): Vec2 {
    return new Vec2(this.x / other.x, this.y / other.y);
  }

  min(this: Vec2, other: Vec2): Vec2 {
    return new Vec2(Math.min(this.x, other.x), Math.min(this.y, other.y));
  }

  max(this: Vec2, other: Vec2): Vec2 {
    return new Vec2(Math.max(this.x, other.x), Math.max(this.y, other.y));
  }

  abs(this: Vec2): Vec2 {
    return new Vec2(Math.abs(this.x), Math.abs(this.y));
  }

  len2(this: Vec2): number {
    return this.x * this.x + this.y * this.y;
  }

  len(this: Vec2): number {
    return Math.sqrt(this.len2());
  }

  angle(this: Vec2): number {
    return Math.atan2(this.x, this.y);
  }


  static ZERO: Vec2 = new Vec2(0, 0);
  static TOP_LEFT: Vec2 = new Vec2(-1, 1);
  static TOP_RIGHT: Vec2 = new Vec2(1, 1);
  static BOTTOM_LEFT: Vec2 = new Vec2(-1, -1);
  static BOTTOM_RIGHT: Vec2 = new Vec2(1, -1);
}

export class Mat2<T = number> {
  readonly a: T;
  readonly b: T;
  readonly c: T;
  readonly d: T;

  constructor(a: T, b: T, c: T, d: T) {
    this.a = a;
    this.b = b;
    this.c = c;
    this.d = d;
  }

  public static colVec<U>(ab: Vec2<U>, cd: Vec2<U>): Mat2<U> {
    return new Mat2(ab.x, ab.y, cd.x, cd.y);
  }

  public det(this: Mat2): number {
    return this.a * this.d - this.b * this.c;
  }

  public inv(this: Mat2): Mat2 | null {
    const det = this.det();
    if (Math.abs(det) < EPSILON) {
      // parallel, we should check if it's aligned...
      return null;
    }
    return new Mat2(this.d / det, -this.c / det, -this.b / det, this.a / det);
  }

  public vecMult(this: Mat2, right: Vec2): Vec2 {
    return new Vec2(this.a * right.x + this.c * right.y, this.b * right.x + this.d * right.y);
  }
}

/// What's the distance between `left` and `right` measured in `unit`
/// - `0` means barely touching
/// - a positive value means not touching (if the unit is pointing from `left` towards `right`)
/// - a negative value means that there is a collision (if the unit is pointing from `left` towards `right`)
/// - `null` means that there won't be any collision ever
export function hitDistance(left: HitBox, right: HitBox, unit: Vec2): number | null {
  if (left.type === "Point" && right.type === "Segment") {
    return hitDistancePointSegment(left, right, unit);
  } else {
    throw new Error(`NotImplemented: hitTest(${left.type}, ${right.type})`)
  }
}

/// Hit distance with a point approaching a rect
export function hitDistancePointSegment(left: PointData, right: SegmentData, unit: Vec2): number | null {
  const mat = Mat2.colVec(unit, right.r.neg());
  const inv = mat.inv();
  if (inv === null) {
    // parallel, we should check if it's aligned...
    return null;
  }
  const doubleDist = inv.vecMult(right.center.sub(left.center));
  const dist = doubleDist.x;
  const segmentRadiusDist = doubleDist.y;
  if (Math.abs(segmentRadiusDist) <= 1) {
    return dist;
  } else {
    // intersection beyond the radius of the segment
    return null;
  }
}

/// `null` if no hit, `Vec2` representing the intersection depth on hit
export function hitTest(left: HitBox, right: HitBox): Vec2 | null {
  if (left.type === "Rect" && right.type === "Rect") {
    return hitTestRectRect(left, right);
  } else if (left.type === "Rect" && right.type === "Circle") {
    return hitTestRectCircle(left, right);
  } else {
    throw new Error(`NotImplemented: hitTest(${left.type}, ${right.type})`)
  }
}

export function hitTestRectRect(a: RectData, b: RectData): Vec2 | null {
  const delta = b.center.sub(a.center);
  const deltaAbs = delta.abs();
  const size = a.r.add(b.r);
  const hit = deltaAbs.sub(size);
  if (hit.x >= 0 || hit.y >= 0) {
    return null;
  } else {
    return new Vec2(
      (delta.x < 0 ? -1 : 1) * (Math.abs(hit.x) < 1e-6 ? 0 : hit.x),
      (delta.y < 0 ? -1 : 1) * (Math.abs(hit.y) < 1e-6 ? 0 : hit.y),
    )
  }
}

export function hitTestRectPoint(a: RectData, b: PointData): Vec2 | null {
  const delta = b.center.sub(a.center);
  const deltaAbs = delta.abs();
  const size = a.r;
  const hit = deltaAbs.sub(size);
  if (hit.x >= 0 || hit.y >= 0) {
    return null;
  } else {
    return new Vec2(
      (delta.x < 0 ? -1 : 1) * hit.x,
      (delta.y < 0 ? -1 : 1) * hit.y,
    )
  }
}

export function hitTestRectCircle(a: RectData, b: CircleData): Vec2 | null {
  const delta = b.center.sub(a.center);
  const crossDist = delta.abs().sub(a.r);
  const foo = Math.min(Math.max(crossDist.x, crossDist.y), 0);
  if (foo >= 0) {
    return null;
  } else {
    return new Vec2(a.center.x, a.center.y);
  }
}

export function moveHitbox(hitbox: HitBox, v: Vec2): HitBox {
  switch (hitbox.type) {
    case "Circle":
      return {type: "Circle", center: hitbox.center.add(v), r: hitbox.r};
    case "Point":
      return {type: "Point", center: hitbox.center.add(v)};
    case "Rect":
      return {type: "Rect", center: hitbox.center.add(v), r: hitbox.r};
    case "Segment":
      return {type: "Segment", center: hitbox.center.add(v), r: hitbox.r};
    default:
      throw new Error(`unexpected hitbox type ${(hitbox as any).type}`);
  }
}
