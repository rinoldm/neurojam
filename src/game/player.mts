import {PlayView} from "../app.mts";
import {hitDistanceRectRect, HitRectSide, hitTest, moveHitbox, RectData, RectHitBox, Vec2} from "../hitbox.mjs";
import {Entity} from "./entity.mjs";
import type {World} from "./world.mts";
import {HITBOX_DEPTH} from "./depth.mjs";
import {PLAYER} from "../assets/index.mjs";
import {GRAVITY, JUMP_DY, MAX_FALL_SPEED, MAX_HORIZONTAL_SPEED, TICK_DURATION_S} from "./data.mjs";
import {Wall} from "./wall.mts";

export class Player extends Entity {
  worldHitbox(): RectHitBox {
    return super.worldHitbox() as any;
  }

  asset: HTMLImageElement;

  oldTouchGround: boolean;
  oldTouchCeiling: boolean;
  oldTouchWall: boolean;

  touchGround: boolean;
  touchCeiling: boolean;
  touchWall: boolean;

  private constructor(id: number, asset: HTMLImageElement, rect: RectData) {
    super(id, HITBOX_DEPTH, {type: "Rect", ...rect} satisfies RectHitBox)
    this.asset = asset;
    this.oldTouchGround = false;
    this.oldTouchCeiling = false;
    this.oldTouchWall = false;
    this.touchGround = false;
    this.touchCeiling = false;
    this.touchWall = false;
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
    this.energy = 1;

    this.oldTouchGround = this.touchGround;
    this.oldTouchWall = this.touchWall;
    this.oldTouchCeiling = this.touchCeiling;
    this.storeOldPhysics();

    this.touchGround = false;
    this.touchCeiling = false;
    this.touchWall = false;

    this.newAcc = new Vec2(0, -GRAVITY); // todo: check water, etc.
    this.newVel = this.vel.add(this.newAcc.scalarMult(TICK_DURATION_S));
    if (world.playerControl.jump && this.oldTouchGround) {
      this.newVel = new Vec2(this.newVel.x, JUMP_DY);
    }
    if (world.playerControl.right) {
      this.newVel = new Vec2(MAX_HORIZONTAL_SPEED, this.newVel.y);
    } else if (world.playerControl.left) {
      this.newVel = new Vec2(-MAX_HORIZONTAL_SPEED, this.newVel.y);
    } else {
      this.newVel = new Vec2(0, this.newVel.y);
    }
    // this.newVel = this.newVel.clampAbs(new Vec2(MAX_FALL_SPEED, MAX_HORIZONTAL_SPEED));

    const closeEnts = world.getCloseEntities(this.pos);

    while (this.energy > 0) {
      let usedEnergy = Math.max(this.energy, 0.1);
      const oldHitBox = moveHitbox(this.hitbox!, this.pos) as RectHitBox;

      if (this.touchWall) {
        this.newVel = new Vec2(0, this.newVel.y);
      }
      if (this.touchGround || this.touchCeiling) {
        this.newVel = new Vec2(this.newVel.x, 0);
      }

      let moveVec = this.newVel.scalarMult(TICK_DURATION_S);
      this.newPos = this.pos.add(moveVec.scalarMult(usedEnergy));
      let newHitbox: RectHitBox = moveHitbox(this.hitbox!, this.newPos) as RectHitBox;
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

        const dist = hitDistanceRectRect(oldHitBox, wallHb, moveVec, outHitSide);

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
        newHitbox = moveHitbox(this.hitbox!, this.newPos) as RectHitBox;
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
  }

  render(view: PlayView): void {
    // view.context.drawImage(this.asset, 0, 0, this.asset.width, this.asset.height, this.hitbox.data.center.x - this.hitbox.data.r.x, this.hitbox.data.center.y + this.hitbox.data.r.y, this.hitbox.data.r.x * 2, - this.hitbox.data.r.y * 2);
    view.context.fillStyle = "red";
    const hb = this.worldHitbox();
    view.context.fillRect(hb.center.x - hb.r.x, hb.center.y + hb.r.y, hb.r.x * 2, -hb.r.y * 2);
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
