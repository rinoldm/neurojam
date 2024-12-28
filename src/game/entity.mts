import {HitBox} from "../hitbox.mjs";
import type {PlayView} from "../app.mjs";

export class Entity {
  public id: number;
  public depth: number;
  public hitbox?: HitBox;

  constructor(id: number, depth: number, hitbox?: HitBox) {
    this.id = id;
    this.depth = depth;
    this.hitbox = hitbox;
  }

  render?(playView: PlayView): void;

  render?(playView: PlayView): void;
}
