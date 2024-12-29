import {PlayView} from "../app.mts";
import {Color} from "../color.mts";
import {RectData, RectHitBox} from "../hitbox.mjs";
import {Entity} from "./entity.mjs";
import type {World} from "./world.mts";
import {HITBOX_DEPTH} from "./depth.mjs";

export class Wall extends Entity {
  worldHitbox(): RectHitBox {
    return super.worldHitbox() as any;
  }

  color: Color;
  hasHit: boolean;

  constructor(id: number, chunkId: number, rect: RectData) {
    super(id, chunkId, HITBOX_DEPTH, {type: "Rect", ...rect} satisfies RectHitBox)
    this.color = Color.rand();
    this.hasHit = false;
  }

  static attach(world: World, chunkId: number, rect: RectData): Wall {
    return world.register(id => new Wall(id, chunkId, rect));
  }

  render(view: PlayView): void {
    view.context.fillStyle = this.hasHit ? "white" : this.color.toCss();
    const hb = this.worldHitbox();
    view.context.fillRect(hb.center.x - hb.r.x, hb.center.y - hb.r.y, hb.r.x * 2, hb.r.y * 2);
  }

  update(_world: World, _tick: number): void {
  }
}
