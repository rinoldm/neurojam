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

export interface HitRectSide {
  side?: "Top" | "Bottom" | "Left" | "Right";
}

export class Vec2<T = number> {
  readonly x: T;
  readonly y: T;

  constructor(x: T, y: T) {
    if (isNaN(x as any) || isNaN(y as any)) {
      throw new Error("GotNaN");
    }
    this.x = x;
    this.y = y;
  }

  static polar(r: number, angle: number) {
    return new Vec2(r * Math.cos(angle), r * Math.sin(angle));
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

  /// scalar product
  scalar(this: Vec2, other: Vec2): number {
    return this.x * other.x + this.y * other.y;
  }

  scalarDiv(this: Vec2, other: number): Vec2 {
    return new Vec2(this.x / other, this.y / other);
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

  clampAbs(this: Vec2, other: Vec2): Vec2 {
    const abs = other.abs();
    return this.min(abs).max(abs.neg());
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
    return Math.atan2(this.y, this.x);
  }

  normalize(this: Vec2): Vec2 {
    return Vec2.polar(1, this.angle());
  }

  swap(): Vec2<T> {
    return new Vec2(this.y, this.x);
  }

  shallowEq(other: Vec2<T>): boolean {
    return this.x === other.x && this.y === other.y;
  }

  static ZERO: Vec2 = new Vec2(0, 0);
  static TOP_LEFT: Vec2 = new Vec2(-1, 1);
  static TOP_RIGHT: Vec2 = new Vec2(1, 1);
  static BOTTOM_LEFT: Vec2 = new Vec2(-1, -1);
  static BOTTOM_RIGHT: Vec2 = new Vec2(1, -1);
}

/// Represents the matrix:
/// (a c)
/// (b d)
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
    return new Mat2(this.d / det, -this.b / det, -this.c / det, this.a / det);
  }

  public vecMult(this: Mat2, right: Vec2): Vec2 {
    return new Vec2(this.a * right.x + this.c * right.y, this.b * right.x + this.d * right.y);
  }
}

/// Returns the distance to the first hit between `left` and `right` measured in `unit`
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

/// Returns the distance to the first hit between `left` and `right` measured in `unit`
/// - `0` means barely touching
/// - a positive value means not touching (if the unit is pointing from `left` towards `right`)
/// - a negative value means that there is a collision (if the unit is pointing from `left` towards `right`)
/// - `null` means that there won't be any collision ever
export function hitDistanceAnyRect(left: HitBox, right: RectData, unit: Vec2, outSide?: HitRectSide): number | null {
  switch (left.type) {
    case "Circle":
      return hitDistanceCircleRect(left, right, unit, outSide);
    case "Point":
      return hitDistancePointRect(left, right, unit);
    case "Rect":
      return hitDistanceRectRect(left, right, unit, outSide);
    default:
      throw new Error(`NotImplemented: hitDistanceAnyRect(${left.type})`)
  }
}

/// Hit distance with a point approaching an other point
export function hitDistancePointPoint(left: PointData, right: PointData, unit: Vec2): number | null {
  const diff = right.center.sub(left.center);
  const alignment = diff.cross(unit);
  if (Math.abs(alignment) > EPSILON) {
    // the points are not aligned, but we still double-check as they maybe overlap
    return diff.len() < EPSILON ? 0 : null;
  }
  return diff.scalar(unit) / unit.len2();
}

/// Hit distance with a point approaching a segment
export function hitDistancePointSegment(left: PointData, right: SegmentData, unit: Vec2): number | null {
  const mat = Mat2.colVec(unit, right.r.neg());
  const inv = mat.inv();
  if (inv === null) {
    // parallel, we should check if it's aligned...
    return null;
  }
  const doubleDist = inv.vecMult(right.center.sub(left.center));
  const dist = doubleDist.x;
  const segmentRadiusDistAbs = Math.abs(doubleDist.y);
  if (segmentRadiusDistAbs < 1 - EPSILON) {
    return dist;
  } else if (segmentRadiusDistAbs < 1) {
    // we're very close to 1, do a test based on the cosine similarity
    const cos = Math.abs(right.r.scalar(unit) / (right.r.len() * unit.len()));
    return cos > 0.99 ? dist : null;
  } else {
    // intersection beyond the radius of the segment
    return null;
  }
}

/// Hit distance with a point approaching a rectangle
export function hitDistancePointRect(left: PointData, right: RectData, unit: Vec2, outSide?: HitRectSide): number | null {
  let best = null;

  // horizontal hit
  if (unit.x > 0) {
    // moving from left to right, the first hit could be on the left edge
    const candidate = hitDistancePointSegment(left, rectSegmentLeftData(right), unit);
    best = minHitDistance(best, candidate);
    if (outSide !== undefined && best === candidate) {
      outSide.side = "Left";
    }
  } else if (unit.x < 0) {
    // moving from right to left, the first hit could be on the right edge
    const candidate = hitDistancePointSegment(left, rectSegmentRightData(right), unit);
    best = minHitDistance(best, candidate);
    if (outSide !== undefined && best === candidate) {
      outSide.side = "Right";
    }
  } // else: moving vertically, or not moving -> we we won't hit the left/right edges

  // vertical hit
  if (unit.y > 0) {
    // moving from bottom to top, the first hit could be on the bottom edge
    const candidate = hitDistancePointSegment(left, rectSegmentBottomData(right), unit);
    best = minHitDistance(best, candidate);
    if (outSide !== undefined && best === candidate) {
      outSide.side = "Bottom";
    }
  } else if (unit.y < 0) {
    // moving from top to bottom, the first hit could be on the top edge
    const candidate = hitDistancePointSegment(left, rectSegmentTopData(right), unit);
    best = minHitDistance(best, candidate);
    if (outSide !== undefined && best === candidate) {
      outSide.side = "Top";
    }
  } // else: moving horizontally, or not moving -> we we won't hit the bottom/top edges

  return best;
}

/// Hit distance with a rect approaching a rect
export function hitDistanceRectRect(left: RectData, right: RectData, unit: Vec2, outSide?: HitRectSide): number | null {
  const target: RectData = {center: right.center, r: left.r.add(right.r)};
  return hitDistancePointRect(left, target, unit, outSide);
}

/// return the min hit distance, `null` is treated as +inf
export function minHitDistance(left: number | null, right: number | null): number | null {
  if (left === null) {
    return right;
  } else if (right === null) {
    return left;
  } else {
    return Math.min(left, right);
  }
}

/// Hit distance with a rect approaching a rect
export function hitDistanceCircleRect(left: CircleData, right: RectData, unit: Vec2, outSide?: HitRectSide): number | null {
  const target: RectData = {center: right.center, r: new Vec2(right.r.x + left.r, right.r.y + left.r)};
  return hitDistancePointRect({center: left.center,}, target, unit, outSide);
}

/// `null` if no hit, `Vec2` representing the intersection depth on hit
export function hitTest(left: HitBox, right: HitBox): Vec2 | null {
  if (left.type === "Rect" && right.type === "Rect") {
    return hitTestRectRect(left, right);
  } else if (left.type === "Rect" && right.type === "Circle") {
    return hitTestRectCircle(left, right);
  } else if (left.type === "Circle" && right.type === "Rect") {
    return hitTestCircleRect(left, right);
  } else {
    throw new Error(`NotImplemented: hitTest(${left.type}, ${right.type})`)
  }
}

export function hitTestRectRect(a: RectData, b: RectData): Vec2 | null {
  const delta = b.center.sub(a.center);
  const deltaAbs = delta.abs();
  const size = a.r.add(b.r);
  const hit = deltaAbs.sub(size);
  if (hit.x > -EPSILON || hit.y > -EPSILON) {
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

export function hitTestRectCircle(left: RectData, right: CircleData): Vec2 | null {
  return hitTestRectRect(left, {center: right.center, r: new Vec2(right.r, right.r)});
  // const delta = left.center.sub(left.center);
  // const crossDist = delta.abs().sub(left.r);
  // const foo = Math.min(Math.max(crossDist.x, crossDist.y), 0);
  // if (foo >= 0) {
  //   return null;
  // } else {
  //   return new Vec2(left.center.x, left.center.y);
  // }
}

export function hitTestCircleRect(left: CircleData, right: RectData): Vec2 | null {
  return hitTestCircleCircle(left, {center: right.center, r: right.r.len()});
}

export function hitTestCircleCircle(left: CircleData, right: CircleData): Vec2 | null {
  const dir = right.center.sub(left.center);
  const dist = dir.len();
  const touchDist = left.r + right.r;
  if (dist > touchDist) {
    return null;
  } else {
    const intersectionRatio = 1 - (dist / touchDist);
    return dir.scalarMult(intersectionRatio);
  }
}

/// Get the top segment from a rect hitbox
export function rectSegmentTopData(rect: RectData): SegmentData {
  return {center: new Vec2(rect.center.x, rect.center.y + rect.r.y), r: new Vec2(rect.r.x, 0)};
}

/// Get the top segment from a rect hitbox
export function rectSegmentBottomData(rect: RectData): SegmentData {
  return {center: new Vec2(rect.center.x, rect.center.y - rect.r.y), r: new Vec2(rect.r.x, 0)};
}

/// Get the left segment from a rect hitbox
export function rectSegmentLeftData(rect: RectData): SegmentData {
  return {center: new Vec2(rect.center.x - rect.r.x, rect.center.y), r: new Vec2(0, rect.r.y)};
}

/// Get the right segment from a rect hitbox
export function rectSegmentRightData(rect: RectData): SegmentData {
  return {center: new Vec2(rect.center.x + rect.r.x, rect.center.y), r: new Vec2(0, rect.r.y)};
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
