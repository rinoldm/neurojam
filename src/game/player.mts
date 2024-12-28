import {PlayView} from "../app.mts";
import {HitBox, RectData, RectHitBox, Vec2} from "../hitbox.mjs";
import {Entity} from "./entity.mjs";
import type {World} from "./world.mts";
import {HITBOX_DEPTH} from "./depth.mjs";
import {PLAYER} from "../assets/index.mjs";

export class Player extends Entity {
  declare public hitbox: HitBox<RectHitBox>;
  asset: HTMLImageElement;
  onGround: Boolean;

  private constructor(id: number, asset: HTMLImageElement, rect: RectData) {
    super(id, HITBOX_DEPTH, new HitBox({type: "Rect", ...rect}))
    this.asset = asset;
    this.onGround = true;
  }

  static attach(world: World, pos: Vec2): Player {
    const asset = world.assets.getImage(PLAYER);


    return world.register(id => new Player(id, asset, {center: pos, r: new Vec2(1.5 / 2, 1.875 / 2)}));
  }

  update(world: World, tick: number): void {
    if (this.updatedAt === tick) {
      return;
    }
    this.updatedAt = tick;
    let dx = 0;
    if (world.playerControl.right) {
      dx = 0.06;
    } else if (world.playerControl.left) {
      dx = -0.06;
    }
    let dy = -0.05;
    if (world.playerControl.jump && this.onGround) {
      dy = +1.5;
    }
    this.moveRelative(new Vec2(dx, dy));
    this.onGround = false;
    // console.log(this.pos);
  }

  render(view: PlayView): void {
    // view.context.drawImage(this.asset, 0, 0, this.asset.width, this.asset.height, this.hitbox.data.center.x - this.hitbox.data.r.x, this.hitbox.data.center.y + this.hitbox.data.r.y, this.hitbox.data.r.x * 2, - this.hitbox.data.r.y * 2);
    view.context.fillStyle = "red";
    view.context.fillRect(this.hitbox.data.center.x - this.hitbox.data.r.x, this.hitbox.data.center.y + this.hitbox.data.r.y, this.hitbox.data.r.x * 2, - this.hitbox.data.r.y * 2);
  }
}

// number: tick when the control was set
export interface PlayerControl {
  jump: number | null;
  left: number | null;
  right: number | null;
  down: number | null;
  use: number | null;
}
