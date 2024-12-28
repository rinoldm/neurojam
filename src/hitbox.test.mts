import {expect, test} from "vitest";
import {HitBox, Vec2} from "./hitbox.mjs";

test("RectRect0", ()=> {
  const a: HitBox = new HitBox({type: "Rect", center: new Vec2(10, 20), r: new Vec2(5, 2)});
  const b: HitBox = new HitBox({type: "Rect", center: new Vec2(100, 20), r: new Vec2(5, 2)});
  expect(a.hitTest(b)).toBe(null);
});

test("RectRect1", ()=> {
  const a: HitBox = new HitBox({type: "Rect", center: new Vec2(10, 20), r: new Vec2(5, 2)});
  const b: HitBox = new HitBox({type: "Rect", center: new Vec2(20, 20), r: new Vec2(5, 2)});
  expect(a.hitTest(b)).toBe(null);
});


test("RectRect2", ()=> {
  const a: HitBox = new HitBox({type: "Rect", center: new Vec2(10, 20), r: new Vec2(5, 2)});
  const b: HitBox = new HitBox({type: "Rect", center: new Vec2(18, 20), r: new Vec2(5, 2)});
  expect(a.hitTest(b)).toBe(new Vec2(-2, 0));
});
