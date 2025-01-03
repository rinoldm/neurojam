import {expect, test} from "vitest";
import {
  hitDistancePointPoint, hitDistancePointRect,
  hitDistancePointSegment, hitDistanceRectRect,
  hitTest,
  PointData,
  RectData,
  RectHitBox,
  SegmentData,
  Vec2
} from "./hitbox.mjs";

test("hitDistPointPoint0", () => {
  // properly hit the point
  const left: PointData = {center: new Vec2(-1, 5)};
  const right: PointData = {center: new Vec2(3, -1)};
  const unit = new Vec2(2, -3);
  expect(hitDistancePointPoint(left, right, unit)).toBe(2);
});

test("hitDistPointPoint0", () => {
  // points not aligned
  const left: PointData = {center: new Vec2(-1, 5)};
  const right: PointData = {center: new Vec2(1, 1)};
  const unit = new Vec2(2, -3);
  expect(hitDistancePointPoint(left, right, unit)).toBe(null);
});

test("hitDistPointSegment0", () => {
  // properly hit the segment
  const left: PointData = {center: new Vec2(-1, 5)};
  const right: SegmentData = {center: new Vec2(1, -2), r: new Vec2(4, 2)};
  const unit = new Vec2(2, -3);
  expect(hitDistancePointSegment(left, right, unit)).toBe(2);
});

test("hitDistPointSegment1", () => {
  // hit an edge of the segment (normal)
  const left: PointData = {center: new Vec2(-1, 5)};
  const right: SegmentData = {center: new Vec2(1, -2), r: new Vec2(2, 1)};
  const unit = new Vec2(2, -3);
  expect(hitDistancePointSegment(left, right, unit)).toBe(null);
});

test("hitDistPointSegment2", () => {
  // segment too short, miss it
  const left: PointData = {center: new Vec2(-1, 5)};
  const right: SegmentData = {center: new Vec2(1, -2), r: new Vec2(1, 0.5)};
  const unit = new Vec2(2, -3);
  expect(hitDistancePointSegment(left, right, unit)).toBe(null);
});

test("hitDistPointSegment3", () => {
  // segment parallel to the unit
  const left: PointData = {center: new Vec2(-1, 5)};
  const right: SegmentData = {center: new Vec2(1, -2), r: new Vec2(2, -3)};
  const unit = new Vec2(2, -3);
  expect(hitDistancePointSegment(left, right, unit)).toBe(null);
});

test.skip("hitDistPointSegment4", () => {
  // segment parallel to the unit, but aligned with the point
  const left: PointData = {center: new Vec2(-1, 5)};
  const right: SegmentData = {center: new Vec2(3, -1), r: new Vec2(2, -3)};
  const unit = new Vec2(2, -3);
  expect(hitDistancePointSegment(left, right, unit)).toBe(null);
});

test("hitDistPointRect0", () => {
  // top hit (from the top-left)
  const left: PointData = {center: new Vec2(-1, 5)};
  const right: RectData = {center: new Vec2(4, -4), r: new Vec2(2, 3)};
  const unit = new Vec2(2, -3);
  expect(hitDistancePointRect(left, right, unit)).toBe(2);
});

test("hitDistPointRect1", () => {
  // left hit (from the top-left)
  const left: PointData = {center: new Vec2(-2, 4)};
  const right: RectData = {center: new Vec2(4, -4), r: new Vec2(2, 3)};
  const unit = new Vec2(2, -3);
  expect(hitDistancePointRect(left, right, unit)).toBe(2);
});

test("hitDistPointRect2", () => {
  // top hit (from the top-right)
  const left: PointData = {center: new Vec2(9, 5)};
  const right: RectData = {center: new Vec2(4, -4), r: new Vec2(2, 3)};
  const unit = new Vec2(-2, -3);
  expect(hitDistancePointRect(left, right, unit)).toBe(2);
});

test("hitDistPointRect3", () => {
  // right hit (from the top-right)
  const left: PointData = {center: new Vec2(10, 4)};
  const right: RectData = {center: new Vec2(4, -4), r: new Vec2(2, 3)};
  const unit = new Vec2(-2, -3);
  expect(hitDistancePointRect(left, right, unit)).toBe(2);
});

test("hitDistPointRect4", () => {
  // bottom hit (from the bottom-right)
  const left: PointData = {center: new Vec2(9, -13)};
  const right: RectData = {center: new Vec2(4, -4), r: new Vec2(2, 3)};
  const unit = new Vec2(-2, 3);
  expect(hitDistancePointRect(left, right, unit)).toBe(2);
});

test("hitDistPointRect5", () => {
  // right hit (from the bottom-right)
  const left: PointData = {center: new Vec2(10, -12)};
  const right: RectData = {center: new Vec2(4, -4), r: new Vec2(2, 3)};
  const unit = new Vec2(-2, 3);
  expect(hitDistancePointRect(left, right, unit)).toBe(2);
});

test("hitDistPointRect6", () => {
  // bottom hit (from the bottom-left)
  const left: PointData = {center: new Vec2(-1, -13)};
  const right: RectData = {center: new Vec2(4, -4), r: new Vec2(2, 3)};
  const unit = new Vec2(2, 3);
  expect(hitDistancePointRect(left, right, unit)).toBe(2);
});

test("hitDistPointRect7", () => {
  // right hit (from the bottom-left)
  const left: PointData = {center: new Vec2(-2, -12)};
  const right: RectData = {center: new Vec2(4, -4), r: new Vec2(2, 3)};
  const unit = new Vec2(2, 3);
  expect(hitDistancePointRect(left, right, unit)).toBe(2);
});

test("hitDistPointRect8", () => {
  // left hit (from the left)
  const left: PointData = {center: new Vec2(-2, -4)};
  const right: RectData = {center: new Vec2(4, -4), r: new Vec2(2, 3)};
  const unit = new Vec2(2, 0);
  expect(hitDistancePointRect(left, right, unit)).toBe(2);
});

test("hitDistPointRect9", () => {
  // top hit (from the top)
  const left: PointData = {center: new Vec2(4, 5)};
  const right: RectData = {center: new Vec2(4, -4), r: new Vec2(2, 3)};
  const unit = new Vec2(0, -3);
  expect(hitDistancePointRect(left, right, unit)).toBe(2);
});

test("hitDistPointRect10", () => {
  // right hit (from the right)
  const left: PointData = {center: new Vec2(10, -4)};
  const right: RectData = {center: new Vec2(4, -4), r: new Vec2(2, 3)};
  const unit = new Vec2(-2, 0);
  expect(hitDistancePointRect(left, right, unit)).toBe(2);
});

test("hitDistPointRect11", () => {
  // bottom hit (from the bottom)
  const left: PointData = {center: new Vec2(4, -13)};
  const right: RectData = {center: new Vec2(4, -4), r: new Vec2(2, 3)};
  const unit = new Vec2(0, 3);
  expect(hitDistancePointRect(left, right, unit)).toBe(2);
});

test("hitDistPointRect11", () => {
  // bottom hit (from the bottom)
  const left: PointData = {center: new Vec2(4, -13)};
  const right: RectData = {center: new Vec2(4, -4), r: new Vec2(2, 3)};
  const unit = new Vec2(0, 3);
  expect(hitDistancePointRect(left, right, unit)).toBe(2);
});

test("hitDistRectRect0", () => {
  const left: RectData = {center: new Vec2(4, 1), r: new Vec2(1, 1)};
  const right: RectData = {center: new Vec2(4, -4), r: new Vec2(2, 3)};
  const unit = new Vec2(4, -4);
  expect(hitDistanceRectRect(left, right, unit)).toBe(0.25);
});

test("hitDistRectRect1", () => {
  const left: RectData = {center: new Vec2(14.293971631206894, 0.9414930555555561), r: new Vec2(0.75, 0.9375)};
  const right: RectData = {center: new Vec2(14, -0.5), r: new Vec2(11, 0.5)};
  const unit = new Vec2(-0.11666666666666667, -0.0040798611111111105);
  expect(hitDistanceRectRect(left, right, unit)).toBe(0.9787234042554451);
});

test("hitDistRectRect2", () => {
  const left: RectData = {center: new Vec2(24.425, -0.02402777777784937), r: new Vec2(0.575, 0.9375)};
  const right: RectData = {center: new Vec2(25.5, -14.5), r: new Vec2(0.5, 14.5)};
  const unit = new Vec2(0, -0.08585069444444436);
  expect(hitDistanceRectRect(left, right, unit)).toBe(null);
});

test("hitDistRectRect3", () => {
  const left: RectData = {center: new Vec2(6.425000000000059, -6.0625), r: new Vec2(0.575, 0.9375)};
  const right: RectData = {center: new Vec2(10, -8.5), r: new Vec2(3, 1.5)};
  const unit = new Vec2(0.08333333333333333, -0.0037326388888888878);
  expect(hitDistanceRectRect(left, right, unit)).toBe(0);
});

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
  expect(hitTest(a, b)).toMatchObject(new Vec2(-2, -4));
});

test("RectRect3", () => {
  const left: RectHitBox = {type: "Rect", center: new Vec2(24.425, -3.0625), r: new Vec2(0.575, 0.9375)};
  const right: RectHitBox = {type: "Rect", center: new Vec2(25.5, -14.5), r: new Vec2(0.5, 14.5)};
  expect(hitTest(left, right)).toBe(null);
});

test("RectRect4", () => {
  const left: RectHitBox = {type: "Rect", center: new Vec2(6.508333333333393, -6.066232638888889), r: new Vec2(0.575, 0.9375)};
  const right: RectHitBox = {type: "Rect", center: new Vec2(10, -8.5), r: new Vec2(3, 1.5)};
  expect(hitTest(left, right)).toMatchObject(new Vec2(-0.08333333333339343, 0.0037326388888887507));
});
