import {PlayView} from "../app.mts";
import {Color} from "../color.mts";
import {hitTest, RectData, RectHitBox, Vec2} from "../hitbox.mjs";
import {Entity} from "./entity.mjs";
import type {World} from "./world.mts";
import {HITBOX_DEPTH} from "./depth.mjs";

export type RelativePos = "Above" | "Below" | "Side";

export class Wall extends Entity {
  worldHitbox(): RectHitBox {
    return super.worldHitbox() as any;
  }

  color: Color;
  hasHit: boolean;

  constructor(id: number, rect: RectData) {
    super(id, HITBOX_DEPTH, {type: "Rect", ...rect} satisfies RectHitBox)
    this.color = Color.rand();
    this.hasHit = false;
  }

  static attach(world: World, rect: RectData): Wall {
    return world.register(id => new Wall(id, rect));
  }

  render(view: PlayView): void {
    view.context.fillStyle = this.hasHit ? "white" : this.color.toCss();
    const hb = this.worldHitbox();
    view.context.fillRect(hb.center.x - hb.r.x, hb.center.y - hb.r.y, hb.r.x * 2, hb.r.y * 2);
  }

  update(world: World, tick: number): void {
    if (this.updatedAt === tick) {
      return;
    }
    this.updatedAt = tick;
    const player = world.player();
    const hit = hitTest(this.worldHitbox(), player.worldHitbox());
    // console.log(hit);
    this.hasHit = hit !== null;
    if (hit === null) {
      return;
    }

    let dx = -hit.x;
    let dy = -hit.y;
    if (Math.abs(hit.x) < Math.abs(hit.y)) {
      dy = 0;
    } else {
      dx = 0;
    }
    if (dy > 0) {
      player.onGround = true;
    }


    player.moveRelative(new Vec2(dx, dy));
  }
}
