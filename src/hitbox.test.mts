import {expect, test} from "vitest";
import {hitTest, RectHitBox, Vec2} from "./hitbox.mjs";

test("RectRect0", () => {
  const a: RectHitBox = {type: "Rect", center: new Vec2(10, 20), r: new Vec2(5, 2)};
  const b: RectHitBox = {type: "Rect", center: new Vec2(100, 20), r: new Vec2(5, 2)};
  expect(hitTest(a, b)).toBe(null);
});

test("RectRect1", () => {
  const a: RectHitBox = {type: "Rect", center: new Vec2(10, 20), r: new Vec2(5, 2)};
  const b: RectHitBox = {type: "Rect", center: new Vec2(20, 20), r: new Vec2(5, 2)};
  expect(hitTest(a, b)).toBe(null);
});


test("RectRect2", () => {
  const a: RectHitBox = {type: "Rect", center: new Vec2(10, 20), r: new Vec2(5, 2)};
  const b: RectHitBox = {type: "Rect", center: new Vec2(18, 20), r: new Vec2(5, 2)};
  expect(hitTest(a, b)).toBe(new Vec2(-2, 0));
});
