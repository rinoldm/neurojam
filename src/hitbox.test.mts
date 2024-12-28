import {expect, test} from "vitest";
import {hitDistancePointPoint, hitDistancePointSegment, hitTest, PointData, RectHitBox, SegmentData, Vec2} from "./hitbox.mjs";

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
  // hit an edge of the segment
  const left: PointData = {center: new Vec2(-1, 5)};
  const right: SegmentData = {center: new Vec2(1, -2), r: new Vec2(2, 1)};
  const unit = new Vec2(2, -3);
  expect(hitDistancePointSegment(left, right, unit)).toBe(2);
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
