import {HitBox, Vec2} from "../hitbox.mjs";
import type {PlayView} from "../app.mjs";
import type {World} from "./world.mjs";

export class Entity {
  public id: number;
  public depth: number;
  public hitbox?: HitBox;
  public physics: boolean;
  public updatedAt: number;
  #pos: Vec2;
  public get pos(): Vec2 {
    return this.#pos;
  }

  public set pos(next: Vec2) {
    const diff = next.sub(this.#pos);
    if (!diff.isZero()) {
      this.#pos = next;
      if (this.hitbox !== undefined) {
        this.hitbox.data.center = this.hitbox.data.center.add(diff);
      }
    }
  }
  public vel: Vec2;

  constructor(id: number, depth: number, hitbox?: HitBox) {
    this.id = id;
    this.depth = depth;
    this.hitbox = hitbox;
    this.physics = hitbox !== undefined;
    this.updatedAt = 0;
    this.#pos = Vec2.ZERO;
    this.vel = Vec2.ZERO;
  }

  update?(world: World, tick: number): void;

  render?(playView: PlayView): void;

  public moveRelative(diff: Vec2): void {
    const newPos = this.#pos.add(diff);
    this.pos = newPos;
  }
}
