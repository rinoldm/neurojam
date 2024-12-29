import {PlayView} from "../app.mts";
import {CircleData, CircleHitBox, moveHitbox} from "../hitbox.mjs";
import {Entity} from "./entity.mjs";
import type {World} from "./world.mts";
import {SHADOW_DEPTH} from "./depth.mjs";
import {TAU} from "./data.mjs";

export class Shadow extends Entity {
  #lightSources: CircleData[];
  #alphaCanvas: HTMLCanvasElement;
  #alphaContext: CanvasRenderingContext2D;

  constructor(id: number) {
    super(id, SHADOW_DEPTH);
    this.#lightSources = [];
    this.#alphaCanvas = document.createElement("canvas");
    this.#alphaCanvas.width = 100;
    this.#alphaCanvas.height = 100;
    this.#alphaContext = this.#alphaCanvas.getContext("2d")!;
  }

  static attach(world: World): Shadow {
    return world.register(id => new Shadow(id));
  }

  update(world: World, _tick: number): void {
    const ents = world.getCloseEntities(world.camera, 2);
    this.#lightSources.length = 0
    for (const ent of ents) {
      this.#lightSources.push(...ent.lightSources.map(hb => {
        return moveHitbox(hb, ent.pos) as CircleHitBox
      }));
    }
  }

  render(view: PlayView): void {
    if (this.#alphaCanvas.width !== view.canvas.width || this.#alphaCanvas.height !== view.canvas.height) {
      this.#alphaCanvas.width = view.canvas.width;
      this.#alphaCanvas.height = view.canvas.height;
    }
    const acx = this.#alphaContext;
    acx.resetTransform();
    acx.fillStyle = "black";
    acx.fillRect(0, 0, view.canvas.width, view.canvas.height);

    const cx = view.context;
    const t = cx.getTransform();
    acx.setTransform(t);

    acx.fillStyle = "white";
    for (const ls of this.#lightSources) {
      acx.beginPath();
      acx.moveTo(ls.center.x, ls.center.y + ls.r);
      acx.arc(ls.center.x, ls.center.y, ls.r, 0, TAU);
      acx.closePath();
      acx.fill();
    }

    cx.save();
    cx.resetTransform();
    cx.globalCompositeOperation = "multiply";
    cx.drawImage(this.#alphaCanvas, 0, 0);
    cx.globalCompositeOperation = "color";
    cx.restore();
  }
}
