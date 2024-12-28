export type HitBoxType = "Rect" | "Circle" | "Point";

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

export type AnyHitBox = CircleHitBox | PointHitBox | RectHitBox;

export class Vec2<T = number> {
  readonly x: T;
  readonly y: T;

  constructor(x: T, y: T) {
    this.x = x;
    this.y = y;
  }

  add(this: Vec2, other: Vec2): Vec2 {
    return new Vec2(this.x + other.x, this.y + other.y);
  }

  sub(this: Vec2, other: Vec2): Vec2 {
    return new Vec2(this.x - other.x, this.y - other.y);
  }

  scalarMult(this: Vec2, other: number): Vec2 {
    return new Vec2(this.x * other, this.y * other);
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

  static ZERO: Vec2 = new Vec2(0, 0);
}

export class HitBox<Data extends AnyHitBox = AnyHitBox> {
  readonly data: Data;

  constructor(data: Data) {
    this.data = data;
  }

  /// `null` if no hit, `Vec2` representing the intersection depth on hit
  hitTest(other: HitBox): Vec2 | null {
    if (this.data.type === "Rect" && other.data.type === "Rect") {
      return hitTestRectRect(this.data, other.data);
    } else if (this.data.type === "Rect" && other.data.type === "Circle") {
      return hitTestRectCircle(this.data, other.data);
    } else {
      throw new Error(`NotImplemented: hitTest(${this.data.type}, ${other.data.type})`)
    }
  }
}

function hitTestRectRect(a: RectData, b: RectData) : Vec2 | null {
  const delta = b.center.sub(a.center);
  const deltaAbs = delta.abs();
  const size = a.r.add(b.r);
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

function hitTestRectCircle(a: RectData, b: CircleData) : Vec2 | null {
  const delta = b.center.sub(a.center);
  const crossDist = delta.abs().sub(a.r);
  const foo = Math.min(Math.max(crossDist.x, crossDist.y), 0);
  if (foo >= 0) {
    return null;
  } else {
    return new Vec2(a.center.x, a.center.y);
  }
}
