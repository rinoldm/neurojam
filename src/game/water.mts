import {PlayView} from "../app.mts";
import {RectData, RectHitBox} from "../hitbox.mjs";
import {Entity} from "./entity.mjs";
import type {World} from "./world.mts";
import {WATER_DEPTH} from "./depth.mjs";
import {TAG_WATER} from "./tag.mjs";

export class Water extends Entity {
  worldHitbox(): RectHitBox {
    return super.worldHitbox() as any;
  }

  public isSurface: boolean = false;

  constructor(id: number, chunkId: number, rect: RectData, isSurface: boolean) {
    super(id, chunkId, WATER_DEPTH, {type: "Rect", ...rect} satisfies RectHitBox);
    this.tags.add(TAG_WATER);
    this.isSurface = isSurface;
  }

  static attach(world: World, chunkId: number, rect: RectData, isSurface: boolean): Water {
    return world.register(id => new Water(id, chunkId, rect, isSurface));
  }

  render(view: PlayView): void {
    view.context.fillStyle = "rgba(50, 70, 180, 0.4)";
    const hb = this.worldHitbox();
    view.context.fillRect(hb.center.x - hb.r.x, hb.center.y - hb.r.y, hb.r.x * 2, hb.r.y * 2);
  }

  update(_world: World, tick: number): void {
    this.updatedAt = tick;
  }
}
