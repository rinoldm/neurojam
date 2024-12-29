import {PlayView} from "../app.mts";
import {
  CircleHitBox, hitDistanceCircleRect,
  HitRectSide,
  hitTest,
  moveHitbox,
  Vec2
} from "../hitbox.mjs";
import {Entity} from "./entity.mjs";
import type {World} from "./world.mts";
import {TORCH_DEPTH} from "./depth.mjs";
import {GRAVITY, TAU, TICK_DURATION_S, TORCH_HIT_RADIUS} from "./data.mjs";
import {Wall} from "./wall.mts";

export class Torch extends Entity {
  worldHitbox(): CircleHitBox {
    return super.worldHitbox() as any;
  }

  dir: number;
  curAnimId: number;
  curAnimFrameId: number;

  totalHP: number;
  currentHP: number;

  private constructor(id: number, pos: Vec2) {
    super(id, null, TORCH_DEPTH, {type: "Circle", center: Vec2.ZERO, r: TORCH_HIT_RADIUS} satisfies CircleHitBox)
    this.lightSources.push({type: "Circle", center: Vec2.ZERO, r: 10} satisfies CircleHitBox);
    this.pos = pos;
    this.dir = 1;
    this.curAnimId = 0;
    this.curAnimFrameId = 0;
    this.totalHP = 3;
    this.currentHP = this.totalHP;
  }

  static attach(world: World, pos: Vec2): Torch {
    return world.register(id => new Torch(id, pos, ));
  }

  update(world: World, tick: number): void {
    if (this.updatedAt === tick) {
      return;
    }
    this.updatedAt = tick;
    this.energy = 1;

    this.storeOldPhysics();

    this.newAcc = new Vec2(0, -GRAVITY); // todo: check water, etc.
    this.newVel = this.vel.add(this.newAcc.scalarMult(TICK_DURATION_S));

    const closeEnts = world.getCloseEntities(this.pos);

    while (this.energy > 0) {
      let usedEnergy = Math.max(this.energy, 0.1);
      const oldHitBox = moveHitbox(this.hitbox!, this.pos) as CircleHitBox;

      if (this.touchWall) {
        this.newVel = new Vec2(0, this.newVel.y);
      }
      if (this.touchGround || this.touchCeiling) {
        this.newVel = new Vec2(this.newVel.x, 0);
      }

      let moveVec = this.newVel.scalarMult(TICK_DURATION_S);
      this.newPos = this.pos.add(moveVec.scalarMult(usedEnergy));
      let newHitbox: CircleHitBox = moveHitbox(this.hitbox!, this.newPos) as CircleHitBox;
      const outHitSide: HitRectSide = {};

      let closestHitSide: null | "Top" | "Bottom" | "Left" | "Right" = null;

      for (const ent of closeEnts) {
        if (!(ent instanceof Wall)) {
          continue;
        }
        const wallHb = ent.worldHitbox();
        const hit = hitTest(newHitbox, wallHb);
        if (hit === null) {
          continue;
        }

        const dist = hitDistanceCircleRect(oldHitBox, wallHb, moveVec, outHitSide);

        if (dist === null || dist < 0) {
          console.warn("failed to compute collision");
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
        case "Left":
        case "Right": {
          this.touchWall = true;
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

    this.commitPhysics();

    if (this.vel.x == 0 && this.vel.y == 0) { // stopped on ground
      this.curAnimId = 0;
      this.curAnimFrameId = 0;
    }
    else if (Math.abs(this.vel.x) > 0 && this.vel.y == 0) { // walking on ground
      this.curAnimId = 0;
      this.curAnimFrameId = Math.floor(tick * TICK_DURATION_S / 0.2) % 2;
    }
    else if (Math.abs(this.vel.y) > 0) { // in the air
      // this.curAnimId = 1;
      this.curAnimFrameId = 1;
    }
  }

  render(view: PlayView): void {
    const hb = this.worldHitbox();
    const cx = view.context;
    cx.fillStyle = "yellow";
    cx.beginPath();
    cx.moveTo(hb.center.x + hb.r, hb.center.y);
    cx.arc(hb.center.x, hb.center.y, hb.r, 0, TAU);
    cx.closePath();
    cx.fill();
  }
}
