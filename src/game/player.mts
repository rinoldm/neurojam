import {PlayView} from "../app.mts";
import {
  RectData,
  RectHitBox,
  Vec2
} from "../hitbox.mjs";
import {Entity} from "./entity.mjs";
import type {World} from "./world.mts";
import {PLAYER_DEPTH} from "./depth.mjs";
import {SPR_NEURO_BODY} from "../assets/index.mjs";
import {
  GRAVITY,
  JUMP_DY,
  MAX_FALL_SPEED,
  MAX_HORIZONTAL_SPEED,
  TICK_DURATION_S,
  PLAYER_HITBOX_HEIGHT,
  PLAYER_HITBOX_WIDTH,
  MAX_JUMP_SPEED,
  TORCH_MIN_POWER_DURATION
} from "./data.mjs";
import {Torch} from "./torch.mjs";

export class Player extends Entity {
  worldHitbox(): RectHitBox {
    return super.worldHitbox() as any;
  }

  spr_body: HTMLImageElement;
  spr_arms: HTMLImageElement;

  dir: number;
  curAnimId: number;
  curAnimFrameId: number;

  totalHP: number;
  currentHP: number;
  torches: number[];
  loadUseSince: number | null;

  private constructor(id: number, spr_body: HTMLImageElement, spr_arms: HTMLImageElement, pos: Vec2, rect: RectData) {
    super(id, null, PLAYER_DEPTH, {type: "Rect", ...rect} satisfies RectHitBox)
    this.spr_body = spr_body;
    this.spr_arms = spr_arms;
    this.pos = pos;
    this.dir = 1;
    this.curAnimId = 0;
    this.curAnimFrameId = 0;
    this.totalHP = 3;
    this.currentHP = this.totalHP;
    this.torches = [];
    this.loadUseSince = null;
  }

  static attach(world: World, pos: Vec2): Player {
    const spr_body = world.assets.getImage(SPR_NEURO_BODY);
    const spr_arms = world.assets.getImage(SPR_NEURO_BODY); // TODO change to SPR_NEURO_ARMS

    return world.register(id => new Player(id, spr_body, spr_arms, pos, {center: new Vec2(PLAYER_HITBOX_WIDTH / 2, PLAYER_HITBOX_HEIGHT / 2), r: new Vec2(PLAYER_HITBOX_WIDTH / 2, PLAYER_HITBOX_HEIGHT / 2)}));
  }

  update(world: World, tick: number): void {
    if (this.updatedAt === tick) {
      return;
    }
    this.updatedAt = tick;
    this.energy = 1;

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
      this.dir = 1;
    } else if (world.playerControl.left) {
      this.newVel = new Vec2(-MAX_HORIZONTAL_SPEED, this.newVel.y);
      this.dir = -1;
    } else {
      this.newVel = new Vec2(0, this.newVel.y);
    }
    this.newVel = this.newVel.min(new Vec2(MAX_HORIZONTAL_SPEED, MAX_JUMP_SPEED)).max(new Vec2(-MAX_HORIZONTAL_SPEED, -MAX_FALL_SPEED));

    this.doPhysics(world, tick);

    const closeEnts = world.getCloseEntities(this.pos);
    for (const ent of closeEnts) {
      if (ent instanceof Torch) {
        if (ent.testGrab(this)) {
          ent.grab(this, tick);
        }
      }
    }

    if (world.playerControl.use) {
      if (this.loadUseSince === null) {
        this.loadUseSince = tick;
      }
    } else {
      if (this.loadUseSince !== null && this.torches.length > 0) {
        const strength = (tick - this.loadUseSince) * TICK_DURATION_S;
        if (strength < TORCH_MIN_POWER_DURATION) {
          this.slash();
        } else {
          const mainTorchId = this.torches[0];
          const mainTorch = world.entities.get(mainTorchId)! as Torch;
          mainTorch.throw(world, this, tick, strength);
        }
      }
      this.loadUseSince = null;
    }

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

  slash() {
    console.log("todo: slash attack")
  }

  render(view: PlayView): void {
    const hb = this.worldHitbox();

    // view.context.fillStyle = "red";
    // view.context.fillRect(hb.center.x - hb.r.x, hb.center.y + hb.r.y, hb.r.x * 2, -hb.r.y * 2);

    view.context.save();
    view.context.translate(hb.center.x, hb.center.y);
    view.context.scale(-this.dir, -1);
    view.context.drawImage(this.spr_body, this.curAnimFrameId * 256, this.curAnimId * 256, 256 /* sprite width */, 256 /* sprite height */, -1, 1 + 1/16, 2, -2);
    view.context.restore();
  }
}

// number: tick when the control was set
export interface PlayerControl {
  jump: number | null;
  left: number | null;
  right: number | null;
  down: number | null;
  use: number | null;
  debug: number | null;
}
