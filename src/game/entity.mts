import {
  CircleHitBox, EPSILON,
  HitBox,
  hitDistanceAnyRect,
  HitRectSide,
  hitTest,
  moveHitbox,
  Vec2
} from "../hitbox.mjs";
import type {PlayView} from "../app.mjs";
import type {World} from "./world.mjs";
import { Sprite } from "../sprite.mts";
import {TICK_DURATION_S} from "./data.mjs";
import type {Wall} from "./wall.mjs";
import {TAG_WALL} from "./tag.mjs";
import {AssetLoader} from "../assets.mjs";

export interface LightSource {
  hitbox: CircleHitBox,
  heal: boolean,
  visible: boolean,
}

export class Entity {
  /// Globally unique entity id
  public id: number;
  /// If this entity was created from a chunk, chunk id
  public chunkId: number | null;
  public tags: Set<number>;
  /// Rendering depth, a higher value is rendered later (on top)
  public depth: number;
  /// Hitbox for collisions, in entity coords
  public hitbox?: HitBox;

  // cached hitbox in world coords (key and value)
  #worldHitboxPos?: Vec2;
  #worldHitbox?: HitBox;

  public lightSources: LightSource[];

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
  public touchWallLeft: boolean;
  public touchWallRight: boolean;

  // Old physics state, before the update
  public oldPos: Vec2;
  public oldVel: Vec2;
  public oldAcc: Vec2;
  public oldRotationSpeed: number;
  public oldAngle: number;

  public oldTouchGround: boolean;
  public oldTouchCeiling: boolean;
  public oldTouchWall: boolean;
  public oldTouchWallLeft: boolean;
  public oldTouchWallRight: boolean;

  // Target physics state, after the update (not yet commited)
  public newPos: Vec2;
  public newVel: Vec2;
  public newAcc: Vec2;
  public newRotationSpeed: number;
  public newAngle: number;

  public lateralBounce: number;
  public groundBounce: number;
  public groundHitFriction: number;
  public groundFriction: number;

  constructor(id: number, chunkId: number | null, depth: number, hitbox?: HitBox) {
    this.id = id;
    this.tags = new Set();
    this.chunkId = chunkId;
    this.depth = depth;
    this.hitbox = hitbox;
    this.physics = hitbox !== undefined;
    this.lightSources = [];
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
    this.oldTouchWallLeft = false;
    this.oldTouchWallRight = false;
    this.touchGround = false;
    this.touchCeiling = false;
    this.touchWall = false;
    this.touchWallLeft = false;
    this.touchWallRight = false;
    this.lateralBounce = 0;
    this.groundBounce = 0;
    this.groundHitFriction = 1;
    this.groundFriction = 1;
  }

  update?(world: World, tick: number): void;

  render?(playView: PlayView, assets: AssetLoader): void;

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
    this.oldTouchWallLeft = this.touchWallLeft;
    this.oldTouchWallRight = this.touchWallRight;
    this.oldTouchCeiling = this.touchCeiling;
  }

  public commitPhysics(): void {
    this.pos = this.newPos;
    this.vel = this.newVel;
    this.acc = this.newAcc;
    this.rotationSpeed = this.newRotationSpeed;
    this.angle = this.newAngle;
  }

  public doPhysics(world: World, tick: number): void {
    this.touchGround = false;
    this.touchCeiling = false;
    this.touchWall = false;

    if (this.physics) {
      const closeEnts = world.getCloseEntities(this.pos);
      while (this.energy > 0) {
        let usedEnergy = Math.min(this.energy, 0.1);
        const oldHitBox = moveHitbox(this.hitbox!, this.pos) as CircleHitBox;

        if (this.touchWall) {
          this.newVel = new Vec2(0, this.newVel.y);
        }
        if (this.touchGround || this.touchCeiling) {
          this.newVel = new Vec2(this.newVel.x, 0);
        }

        let moveVec = this.newVel.scalarMult(TICK_DURATION_S);
        this.newPos = this.pos.add(moveVec.scalarMult(usedEnergy));
        let newHitbox: HitBox = moveHitbox(this.hitbox!, this.newPos) as CircleHitBox;
        const outHitSide: HitRectSide = {};

        let closestHitSide: null | "Top" | "Bottom" | "Left" | "Right" = null;

        for (const ent of closeEnts) {
          if (!(ent.tags.has(TAG_WALL))) {
            continue;
          }
          const wall: Wall = ent as Wall;
          const wallHb = wall.worldHitbox();
          const hit = hitTest(newHitbox, wallHb);
          if (hit === null) {
            continue;
          }

          wall.hitAt = tick;

          const dist = hitDistanceAnyRect(oldHitBox, wallHb, moveVec, outHitSide);

          if (dist === null || dist < -EPSILON) {
            console.warn(`failed to compute collision: ${dist}`);
            if (world.playerControl.debug) {
              console.log(JSON.stringify(newHitbox), JSON.stringify(wallHb));
              console.log(JSON.stringify(oldHitBox), JSON.stringify(wallHb), JSON.stringify(moveVec), JSON.stringify(outHitSide), dist);
            }
            continue;
          }
          if (dist >= usedEnergy) {
            continue;
          }
          // dist is shorter!

          usedEnergy = dist;
          closestHitSide = outHitSide.side!;

          moveVec = this.newVel.scalarMult(TICK_DURATION_S);
          this.newPos = this.pos.add(moveVec.scalarMult(usedEnergy));
          newHitbox = moveHitbox(this.hitbox!, this.newPos) as CircleHitBox;
        }

        switch (closestHitSide) {
          case "Left": {
            this.touchWall = true;
            this.touchWallRight = true;
            break;
          }
          case "Right": {
            this.touchWall = true;
            this.touchWallLeft = true;
            break;
          }
          case "Top": {
            this.touchGround = true;
            break;
          }
          case "Bottom": {
            this.touchCeiling = true;
            break;
          }
        }

        this.pos = this.newPos;
        this.energy -= usedEnergy;
      }
    } else {
      this.newPos = this.pos.add(this.newVel.scalarMult(TICK_DURATION_S));
      this.energy -= 1;
    }
    this.commitPhysics();
  }
}
