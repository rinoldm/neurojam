import { CircleHitBox, Vec2, moveHitbox, hitTest } from "../hitbox.mjs";
import { Entity } from "./entity.mts";
import type { World } from "./world.mts";
import { PlayView } from "../app.mts";
import { TICK_DURATION_S } from "./data.mjs";
import { CURSE_DEPTH } from "./depth.mts";

export class Curse extends Entity {
  private static readonly BASE_SPEED = 5;
  private static readonly LIGHT_RADIUS = 10;
  private static readonly BASE_ANGULAR_SPEED = 1;
  private static readonly SPEED_INCREMENT = 0.001;

  private currentAngle: number;
  private speedMultiplier: number;
  private angularSpeedMultiplier: number;

  private constructor(id: number, pos: Vec2) {
    super(id, null, CURSE_DEPTH, { type: "Circle", center: Vec2.ZERO, r: 1 } satisfies CircleHitBox);
    this.pos = pos;
    this.currentAngle = 0;
    this.speedMultiplier = 1;
    this.angularSpeedMultiplier = 1;
    this.lightSources.push({ type: "Circle", center: Vec2.ZERO, r: Curse.LIGHT_RADIUS });
  }

  static attach(world: World, pos: Vec2): Curse {
    return world.register(id => new Curse(id, pos));
  }

  private adjustAngle(angle: number): number {
    return (angle + 360) % 360;
  }

  update(world: World, tick: number): void {
    if (this.updatedAt === tick) {
      return;
    }
    this.updatedAt = tick;

    // Increase the speed and angular speed multipliers over time
    this.speedMultiplier += Curse.SPEED_INCREMENT;
    this.angularSpeedMultiplier += Curse.SPEED_INCREMENT;

    const player = world.player();
    const playerCenter = player.worldHitbox().center;
    const targetAngle = Math.atan2(playerCenter.y - this.pos.y, playerCenter.x - this.pos.x) * 180 / Math.PI;
    let adjustedTargetAngle = this.adjustAngle(targetAngle);

    if (this.currentAngle - adjustedTargetAngle > 180) {
      this.currentAngle -= 360;
    }
    if (adjustedTargetAngle - this.currentAngle > 180) {
      this.currentAngle += 360;
    }

    const angularSpeed = Curse.BASE_ANGULAR_SPEED * this.angularSpeedMultiplier;

    if (this.currentAngle < adjustedTargetAngle) {
      this.currentAngle += angularSpeed;
      if (this.currentAngle > adjustedTargetAngle) {
        this.currentAngle = adjustedTargetAngle;
      }
    } else if (this.currentAngle > adjustedTargetAngle) {
      this.currentAngle -= angularSpeed;
      if (this.currentAngle < adjustedTargetAngle) {
        this.currentAngle = adjustedTargetAngle;
      }
    }

    this.currentAngle = this.adjustAngle(this.currentAngle);
    const radianAngle = this.currentAngle * Math.PI / 180;
    this.newVel = new Vec2(Math.cos(radianAngle), Math.sin(radianAngle)).scalarMult(Curse.BASE_SPEED * this.speedMultiplier * TICK_DURATION_S);

    this.pos = this.pos.add(this.newVel);

    const playerHitbox = player.worldHitbox();
    const curseHitbox = moveHitbox(this.hitbox!, this.pos);
    if (hitTest(playerHitbox, curseHitbox) !== null) {
      world.gameOver();
    }
  }

  render(view: PlayView): void {
    const cx = view.context;
    cx.fillStyle = "orange";
    cx.beginPath();
    cx.arc(this.pos.x, this.pos.y, 1, 0, Math.PI * 2);
    cx.closePath();
    cx.fill();
  }
}