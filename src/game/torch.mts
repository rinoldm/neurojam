import {PlayView} from "../app.mts";
import {
  CircleHitBox, EPSILON, HitBox, hitTest, moveHitbox, RectHitBox,
  Vec2
} from "../hitbox.mjs";
import {Entity} from "./entity.mjs";
import type {World} from "./world.mts";
import {TORCH_DEPTH} from "./depth.mjs";
import {
  GRAVITY,
  MAX_HORIZONTAL_SPEED,
  MAX_TORCHES_HELD, STABLE_SPEED_X, STABLE_SPEED_Y,
  TICK_DURATION_S, TORCH_GRAB_FRICTION,
  TORCH_GRAB_RADIUS,
  TORCH_HIT_RADIUS, TORCH_LIFETIME,
  TORCH_MAX_POWER_ANGLE,
  TORCH_MAX_POWER_DURATION, TORCH_MAX_POWER_SPEED,
  TORCH_MIN_POWER_ANGLE,
  TORCH_MIN_POWER_DURATION,
  TORCH_MIN_POWER_SPEED
} from "./data.mjs";
import type {Player} from "./player.mjs";
import {TAG_TORCH} from "./tag.mjs";
import {AssetLoader} from "../assets.mjs";
import {IMG_TORCH_ON} from "../assets/index.mjs";

const GRAB_HITBOX: CircleHitBox = {type: "Circle", center: Vec2.ZERO, r: TORCH_GRAB_RADIUS};

export class Torch extends Entity {
  worldHitbox(): HitBox {
    return super.worldHitbox() as any;
  }

  grabHitbox(): CircleHitBox {
    return moveHitbox(GRAB_HITBOX, this.pos) as CircleHitBox;
  }

  dir: number;
  curAnimId: number;
  curAnimFrameId: number;

  totalHP: number;
  currentHP: number;

  canBeGrabbed: boolean;
  heldByPlayer: boolean;
  heldAnimationStartAt: number | null;
  hideMainTorch: boolean;
  lastThrowAt: number | null;

  burnedTicks: number;
  burnRate: number;

  private constructor(id: number, pos: Vec2, burnRate: number) {
    super(id, null, TORCH_DEPTH, {type: "Rect", center: Vec2.ZERO, r: new Vec2(TORCH_HIT_RADIUS, TORCH_HIT_RADIUS)} satisfies RectHitBox)
    this.pos = pos;
    this.dir = 1;
    this.curAnimId = 0;
    this.curAnimFrameId = 0;
    this.totalHP = 3;
    this.currentHP = this.totalHP;
    this.heldByPlayer = false;
    this.canBeGrabbed = true;
    this.heldAnimationStartAt = null;
    this.hideMainTorch = false;
    this.lastThrowAt = null;
    this.tags.add(TAG_TORCH);
    this.lateralBounce = -0.2;
    this.groundBounce = -0.2;
    this.groundHitFriction = 15;
    this.groundFriction = 6;
    this.burnedTicks = 0;
    this.burnRate = burnRate;
  }

  static attach(world: World, pos: Vec2, burnRate: number): Torch {
    return world.register(id => new Torch(id, pos, burnRate));
  }

  update(world: World, tick: number): void {
    if (this.updatedAt === tick) {
      return;
    }
    this.updatedAt = tick;
    this.energy = 1;

    this.storeOldPhysics();

    if (!this.canBeGrabbed && this.lastThrowAt !== null) {
      const elapsed = (tick - this.lastThrowAt) * TICK_DURATION_S;
      if (elapsed > 1) {
        this.canBeGrabbed = true;
      }
    }

    let targetPosition: Vec2 | null = null;
    if (this.heldByPlayer) {
      this.physics = false;
      const player = world.player();
      const heldOrder = player.torches.indexOf(this.id);
      targetPosition = world.player().worldHitbox().center;

      this.hideMainTorch = heldOrder === 0 && this.heldAnimationStartAt === null;

      if (heldOrder > 0) {
        const prevTorchId = player.torches[heldOrder - 1];
        const prevTorch = world.entities.get(prevTorchId);
        if (prevTorch !== undefined) {
          const dir = this.pos.sub(prevTorch.pos);
          targetPosition = prevTorch.pos.add(dir.normalize().scalarMult(Math.min(1, dir.len())));
        }
      }
      if (this.heldAnimationStartAt === null || (((tick - this.heldAnimationStartAt) * TICK_DURATION_S) > 3)) {
        this.newAcc = new Vec2(0, 0);
        this.newVel = targetPosition.sub(this.pos).scalarDiv(TICK_DURATION_S);
        this.heldAnimationStartAt = null;
      } else {
        const elapsed = tick - this.heldAnimationStartAt;
        const dir = targetPosition.sub(this.pos);
        this.newAcc = new Vec2(0, 0);
        this.newVel = dir.normalize().scalarMult(Math.min(Math.abs(elapsed / (1 + dir.len()) / TORCH_GRAB_FRICTION), MAX_HORIZONTAL_SPEED * 3)).add(this.oldVel.scalarDiv(TICK_DURATION_S * 100));
        const maxLen = Math.min(1, this.newVel.len() / Math.max(EPSILON, dir.len() * TICK_DURATION_S));
        this.newVel = this.newVel.scalarMult(maxLen);
      }
    } else {
      this.hideMainTorch = false;
      this.physics = true;
      this.newAcc = new Vec2(0, -GRAVITY); // todo: check water, etc.
      this.newVel = this.vel.add(this.newAcc.scalarMult(TICK_DURATION_S));
      if (!this.canBeGrabbed) {
        // console.log(this.newVel.x, this.newVel.y);
      }
    }
    this.doPhysics(world, tick);
    if (this.physics) {
      if (this.touchWallLeft && this.oldVel.x < 0 && this.vel.x === 0) {
        this.vel = new Vec2(this.oldVel.x * this.lateralBounce, this.oldVel.y);
      }
      if (this.touchWallRight && this.oldVel.x > 0 && this.vel.x === 0) {
        this.vel = new Vec2(this.oldVel.x * this.lateralBounce, this.oldVel.y);
      }
      if (this.touchGround && this.oldVel.y < 0 && this.vel.y === 0) {
        if (!this.oldTouchGround) {
          this.vel = this.vel.elemMult(new Vec2(1 - this.groundFriction * TICK_DURATION_S, 1));
        }
        this.vel = new Vec2(this.oldVel.x, this.oldVel.y * this.groundBounce);
      }
      if (this.touchGround) {
        this.vel = this.vel.elemMult(new Vec2(1 - this.groundFriction * TICK_DURATION_S, 1));
        if (Math.abs(this.vel.x) < STABLE_SPEED_X) {
          this.vel = new Vec2(0, this.vel.y);
        }
        if (Math.abs(this.vel.y) < STABLE_SPEED_Y) {
          this.vel = new Vec2(this.vel.x, 0);
        }
      }
    }

    if (targetPosition !== null) {
      if (targetPosition.sub(this.pos).len() < 0.4) {
        this.heldAnimationStartAt = null;
      }
    }

    if (this.heldByPlayer || this.burnedTicks > 0) {
      this.burnedTicks += 1;
    }
    const burnDuration = this.burnedTicks * TICK_DURATION_S * this.burnRate;

    const remaingLife = TORCH_LIFETIME - burnDuration;
    if (remaingLife < 0) {
      this.lightSources = [];
      if (!this.heldByPlayer) {
        this.isAttached = false;
      }
    } else {
      const hitbox = {type: "Circle", center: Vec2.ZERO, r: 1 + 9 * remaingLife / TORCH_LIFETIME} satisfies CircleHitBox;
      let flickering= false;
      if (remaingLife < 5) {
        flickering = (Math.floor(remaingLife * 6) % 3) === 0;
      }
      this.lightSources = [{
        hitbox,
        heal: true,
        visible: !flickering,
      }];
    }
  }

  render(view: PlayView, assets: AssetLoader): void {
    if (this.hideMainTorch) {
      return;
    }

    const torchImgSize = new Vec2(32, 56).scalarDiv(96);
    const hb = this.worldHitbox();
    const cx = view.context;
    const img = assets.getImage(IMG_TORCH_ON);
    cx.save();
    cx.translate(hb.center.x, hb.center.y);
    cx.scale(1, -1);
    cx.drawImage(img, 0, 0, img.width, img.height, -torchImgSize.x / 2, -torchImgSize.y / 2, torchImgSize.x, torchImgSize.y);
    cx.restore();
  }

  testGrab(player: Player): boolean {
    if (this.heldByPlayer || !this.canBeGrabbed || player.torches.length >= MAX_TORCHES_HELD) {
      return false;
    }
    return hitTest(player.worldHitbox(), this.grabHitbox()) !== null;
  }

  grab(player: Player, tick: number): void {
    this.heldByPlayer = true;
    player.torches.push(this.id);
    this.heldAnimationStartAt = tick;
    this.canBeGrabbed = false;
  }

  throw(world: World, player: Player, tick: number, strength: number): void {
    strength = Math.min(strength, TORCH_MAX_POWER_DURATION);
    this.heldByPlayer = false;
    this.canBeGrabbed = false;
    player.torches.splice(0, 1);
    for (const torchId of player.torches) {
      const torch = world.entities.get(torchId)! as Torch;
      torch.heldAnimationStartAt = tick;
    }
    const ratio = (strength - TORCH_MIN_POWER_DURATION) / (TORCH_MAX_POWER_DURATION - TORCH_MIN_POWER_DURATION);
    const angle = TORCH_MIN_POWER_ANGLE + ratio * (TORCH_MAX_POWER_ANGLE - TORCH_MIN_POWER_ANGLE);
    // console.log(angle);
    const speed = TORCH_MIN_POWER_SPEED + ratio * (TORCH_MAX_POWER_SPEED - TORCH_MIN_POWER_SPEED);
    this.pos = player.worldHitbox().center;
    this.vel = Vec2.polar(speed, angle).elemMult(new Vec2(player.dir, 1));
    // console.log("throwVel");
    // console.log(this.vel);
    this.lastThrowAt = tick;
  }
}
