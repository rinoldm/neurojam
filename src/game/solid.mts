import {PlayView} from "../app.mts";
import {Color} from "../color.mts";
import {HitBox, hitTestRectPoint, RectData, RectHitBox, Vec2} from "../hitbox.mjs";
import {Entity} from "./entity.mjs";
import type {World} from "./world.mts";
import {HITBOX_DEPTH} from "./depth.mjs";

export type RelativePos = "Above" | "Below" | "Side";

export class Solid extends Entity {
  declare public hitbox: HitBox<RectHitBox>;
  color: Color;
  hasHit: boolean;

  constructor(id: number, rect: RectData) {
    super(id, HITBOX_DEPTH, new HitBox({type: "Rect", ...rect}))
    this.color = Color.rand();
    this.hasHit = false;
  }

  static attach(world: World, rect: RectData): Solid {
    return world.register(id => new Solid(id, rect));
  }

  render(view: PlayView): void {
    view.context.fillStyle = this.hasHit ? "white" : this.color.toCss();
    view.context.fillRect(this.hitbox.data.center.x - this.hitbox.data.r.x, this.hitbox.data.center.y - this.hitbox.data.r.y, this.hitbox.data.r.x * 2, this.hitbox.data.r.y * 2);
  }

  update(world: World, tick: number): void {
    if (this.updatedAt === tick) {
      return;
    }
    this.updatedAt = tick;
    const player = world.player();
    const hit = this.hitbox.hitTest(player.hitbox);
    this.hasHit = hit !== null;
    if (hit === null) {
      return;
    }

    const bottomLeft = player.hitbox.data.center.add(player.hitbox.data.r.elemMult(Vec2.BOTTOM_LEFT));
    const bottomRight = player.hitbox.data.center.add(player.hitbox.data.r.elemMult(Vec2.BOTTOM_RIGHT));
    const topLeft = player.hitbox.data.center.add(player.hitbox.data.r.elemMult(Vec2.TOP_LEFT));
    const topRight = player.hitbox.data.center.add(player.hitbox.data.r.elemMult(Vec2.TOP_RIGHT));

    const bottomLeftHit = hitTestRectPoint(this.hitbox.data, {center: bottomLeft}) !== null;
    const bottomRightHit = hitTestRectPoint(this.hitbox.data, {center: bottomRight}) !== null;
    const topLeftHit = hitTestRectPoint(this.hitbox.data, {center: topLeft}) !== null;
    const topRightHit = hitTestRectPoint(this.hitbox.data, {center: topRight}) !== null;

    let dx = -hit.x;
    if ((bottomLeftHit && bottomRightHit) || (topLeftHit && topRightHit)) {
      dx = 0;
    }
    let dy = -hit.y;
    if ((bottomLeftHit && topLeftHit) || (bottomRightHit && topRightHit)) {
      dy = 0;
    }

    player.moveRelative(new Vec2(dx, dy));
    // const dir = player.hitbox.data.center.sub(this.hitbox.data.center);

  }
}
