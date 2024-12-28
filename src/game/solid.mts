import {PlayView} from "../app.mts";
import {Color} from "../color.mts";
import {HitBox, RectData, RectHitBox} from "../hitbox.mjs";
import {Entity} from "./entity.mjs";
import type {World} from "./world.mts";
import {HITBOX_DEPTH} from "./depth.mjs";

export class Solid extends Entity {
  declare public hitbox: HitBox<RectHitBox>;
  color: Color;

  constructor(id: number, rect: RectData) {
    super(id, HITBOX_DEPTH, new HitBox({type: "Rect", ...rect}))
    this.color = Color.rand();
  }

  static attach(world: World, rect: RectData): Solid {
    return world.register(id => new Solid(id, rect));
  }

  render(view: PlayView): void {
    view.context.fillStyle = this.color.toCss();
    view.context.fillRect(this.hitbox.data.center.x - this.hitbox.data.r.x, this.hitbox.data.center.y - this.hitbox.data.r.y, this.hitbox.data.r.x * 2, this.hitbox.data.r.y * 2);
  }
}
