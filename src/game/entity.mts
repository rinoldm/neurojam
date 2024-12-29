import {CircleHitBox, HitBox, moveHitbox, Vec2} from "../hitbox.mjs";
import type {PlayView} from "../app.mjs";
import type {World} from "./world.mjs";
import { Sprite } from "../sprite.mts";

export class Entity {
  /// Globally unique entity id
  public id: number;
  /// If this entity was created from a chunk, chunk id
  public chunkId: number | null;
  /// Rendering depth, a higher value is rendered later (on top)
  public depth: number;
  /// Hitbox for collisions, in entity coords
  public hitbox?: HitBox;

  // cached hitbox in world coords (key and value)
  #worldHitboxPos?: Vec2;
  #worldHitbox?: HitBox;

  public lightSources: CircleHitBox[];

  /// Sprite for rendering, in entity coords
  public sprite?: Sprite;
  /// If true, enable physics
  public physics: boolean;
  /// Last tick when this entity was updated
  public updatedAt: number;

  /// All entities without this flag will be destroyed at the end of the update
  public isAttached: boolean;

  // value between 0 and 1, remaining "energy" for this tick
  public energy: number;

  // Position in world coordinates
  public pos: Vec2;
  public vel: Vec2;
  public acc: Vec2;

  /// In radians/second
  public rotationSpeed: number;
  /// In anticlockwise radians
  public angle: number;

  public touchGround: boolean;
  public touchCeiling: boolean;
  public touchWall: boolean;

  // Old physics state, before the update
  public oldPos: Vec2;
  public oldVel: Vec2;
  public oldAcc: Vec2;
  public oldRotationSpeed: number;
  public oldAngle: number;

  public oldTouchGround: boolean;
  public oldTouchCeiling: boolean;
  public oldTouchWall: boolean;

  // Target physics state, after the update (not yet commited)
  public newPos: Vec2;
  public newVel: Vec2;
  public newAcc: Vec2;
  public newRotationSpeed: number;
  public newAngle: number;



  constructor(id: number, chunkId: number | null, depth: number, hitbox?: HitBox) {
    this.id = id;
    this.chunkId = chunkId;
    this.depth = depth;
    this.hitbox = hitbox;
    this.physics = hitbox !== undefined;
    this.lightSources = [];
    this.chunkId = null;
    this.updatedAt = 0;
    this.isAttached = true;
    this.energy = 1;
    this.pos = Vec2.ZERO;
    this.vel = Vec2.ZERO;
    this.acc = Vec2.ZERO;
    this.rotationSpeed = 0;
    this.angle = 0;
    this.oldPos = Vec2.ZERO;
    this.oldVel = Vec2.ZERO;
    this.oldAcc = Vec2.ZERO;
    this.oldRotationSpeed = 0;
    this.oldAngle = 0;
    this.newPos = Vec2.ZERO;
    this.newVel = Vec2.ZERO;
    this.newAcc = Vec2.ZERO;
    this.newRotationSpeed = 0;
    this.newAngle = 0;
    this.oldTouchGround = false;
    this.oldTouchCeiling = false;
    this.oldTouchWall = false;
    this.touchGround = false;
    this.touchCeiling = false;
    this.touchWall = false;
  }

  update?(world: World, tick: number): void;

  render?(playView: PlayView): void;

  public moveRelative(diff: Vec2): void {
    this.pos = this.pos.add(diff);
  }

  public toWorld(entityCoords: Vec2): Vec2 {
    return this.pos.add(entityCoords);
  }

  public worldHitbox(): HitBox | undefined {
    if (this.hitbox === undefined) {
      return undefined;
    } else {
      if (this.#worldHitboxPos !== this.pos || this.#worldHitbox === undefined) {
        this.#worldHitboxPos = this.pos;
        this.#worldHitbox = moveHitbox(this.hitbox, this.pos);
      }
      return this.#worldHitbox;
    }
  }

  public storeOldPhysics(): void {
    this.oldPos = this.pos;
    this.oldVel = this.vel;
    this.oldAcc = this.acc;
    this.oldRotationSpeed = this.rotationSpeed;
    this.oldAngle = this.angle;
    this.oldTouchGround = this.touchGround;
    this.oldTouchWall = this.touchWall;
    this.oldTouchCeiling = this.touchCeiling;
  }

  public commitPhysics(): void {
    this.pos = this.newPos;
    this.vel = this.newVel;
    this.acc = this.newAcc;
    this.rotationSpeed = this.newRotationSpeed;
    this.angle = this.newAngle;
  }
}
