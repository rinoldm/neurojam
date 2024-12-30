import {PlayView} from "../app.mts";
import {Color} from "../color.mts";
import {RectData, RectHitBox} from "../hitbox.mjs";
import {Entity} from "./entity.mjs";
import type {World} from "./world.mts";
import {HITBOX_DEPTH} from "./depth.mjs";
import {TAG_WALL} from "./tag.mjs";

export class Wall extends Entity {
  worldHitbox(): RectHitBox {
    return super.worldHitbox() as any;
  }

  color: Color;
  hitAt: null | number;
  #debug: boolean;

  constructor(id: number, chunkId: number, rect: RectData) {
    super(id, chunkId, HITBOX_DEPTH, {type: "Rect", ...rect} satisfies RectHitBox);
    this.tags.add(TAG_WALL);
    this.color = Color.rand();
    this.hitAt = null;
    this.#debug = false;
  }

  static attach(world: World, chunkId: number, rect: RectData): Wall {
    return world.register(id => new Wall(id, chunkId, rect));
  }

  render(view: PlayView): void {
    if (!this.#debug) {
      return;
    }
    view.context.fillStyle = this.hitAt === this.updatedAt ? "white" : this.color.toCss();
    const hb = this.worldHitbox();
    view.context.fillRect(hb.center.x - hb.r.x, hb.center.y - hb.r.y, hb.r.x * 2, hb.r.y * 2);
  }

  update(world: World, tick: number): void {
    this.updatedAt = tick;
    this.#debug = world.playerControl.debug !== null;
  }
}
