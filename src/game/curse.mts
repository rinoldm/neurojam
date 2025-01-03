import { CircleHitBox, Vec2, moveHitbox, hitTest } from "../hitbox.mjs";
import { Entity } from "./entity.mts";
import type { World } from "./world.mts";
import { PlayView } from "../app.mts";
import {TAU, TICK_DURATION_S } from "./data.mjs";
import { CURSE_DEPTH } from "./depth.mts";
import {AssetLoader} from "../assets.mjs";
import {IMG_CURSE_BODY, IMG_CURSE_EYES} from "../assets/index.mjs";

export class Curse extends Entity {
  private static readonly BASE_SPEED = 5;
  private static readonly LIGHT_RADIUS = 10;
  private static readonly BASE_ANGULAR_SPEED = 1;
  private static readonly SPEED_INCREMENT = 0.001;

  private currentAngle: number;
  private speedMultiplier: number;
  private angularSpeedMultiplier: number;
  public flicker: boolean;
  public flickerSwapAt: number | null;

  private constructor(id: number, pos: Vec2) {
    super(id, null, CURSE_DEPTH, { type: "Circle", center: Vec2.ZERO, r: 1 } satisfies CircleHitBox);
    this.pos = pos;
    this.currentAngle = 90;
    this.speedMultiplier = 1;
    this.angularSpeedMultiplier = 1;
    this.lightSources.push({hitbox: { type: "Circle", center: Vec2.ZERO, r: Curse.LIGHT_RADIUS }, heal: false, visible: true});
    this.flickerSwapAt = null;
    this.flicker = false;
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

    if (world.danger < 0.3) {
      let shouldSwap = false;
      if (this.flickerSwapAt === null) {
        shouldSwap = true;
      } else {
        const elapsedTime = (tick - this.flickerSwapAt) * TICK_DURATION_S;
        if (elapsedTime > 0.1 && this.flicker || elapsedTime > 0.2 && !this.flicker) {
          shouldSwap = true;
        }
      }
      if (shouldSwap) {
        this.flickerSwapAt = tick;
        this.flicker = !this.flicker;
      }
    } else {
      this.flicker = false;
    }

    const playerHitbox = player.worldHitbox();
    const curseHitbox = moveHitbox(this.hitbox!, this.pos);
    if (hitTest(playerHitbox, curseHitbox) !== null) {
      world.gameOver();
    }
  }

  render(view: PlayView, assets: AssetLoader): void {
    if (this.flicker) {
      return;
    }

    const curseImgSize = new Vec2(6, 6);
    const hb = this.worldHitbox()! as CircleHitBox;
    const cx = view.context;
    const body = assets.getImage(IMG_CURSE_BODY);
    const eyes = assets.getImage(IMG_CURSE_EYES);

    const angle = (this.currentAngle + 360) % 360;
    const dir = angle > 90 && angle <= 270 ? -1 : 1;
    cx.save();
    cx.translate(hb.center.x, hb.center.y);
    cx.save();
    cx.rotate(angle * TAU / 360);
    cx.drawImage(body, 0, 0, body.width, body.height, -curseImgSize.x / 2, -curseImgSize.y / 2, curseImgSize.x, curseImgSize.y);
    cx.restore();
    cx.scale(dir, -1);
    cx.drawImage(eyes, 0, 0, eyes.width, eyes.height, -curseImgSize.x / 2, -curseImgSize.y / 2, curseImgSize.x, curseImgSize.y);
    cx.restore();
  }
}
