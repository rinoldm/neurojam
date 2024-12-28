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
    // console.log(hit);
    this.hasHit = hit !== null;
    if (hit === null) {
      return;
    }

    let dx = -hit.x;
    let dy = -hit.y;
    if (Math.abs(hit.x) < Math.abs(hit.y)) {
      dy = 0;
    }
    else {
      dx = 0;
    }
    if (dy > 0) {
      player.onGround = true;
    }


    player.moveRelative(new Vec2(dx, dy));
  }
}
