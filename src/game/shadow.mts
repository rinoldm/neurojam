import {PlayView} from "../app.mts";
import {CircleData, CircleHitBox, moveHitbox} from "../hitbox.mjs";
import {Entity} from "./entity.mjs";
import type {World} from "./world.mts";
import {SHADOW_DEPTH} from "./depth.mjs";
import {BORDER_WIDTH, CHUNK_WIDTH, MAX_VIEWPORT_HEIGHT, TAU, VIEW_WIDTH} from "./data.mjs";

export class Shadow extends Entity {
  #lightSources: CircleData[];
  #alphaCanvas: HTMLCanvasElement;
  #alphaContext: CanvasRenderingContext2D;
  #firstChunkIsFlipped : boolean;
  #debug: boolean;

  constructor(id: number) {
    super(id, null, SHADOW_DEPTH);
    this.#lightSources = [];
    this.#alphaCanvas = document.createElement("canvas");
    this.#alphaCanvas.width = 100;
    this.#alphaCanvas.height = 100;
    this.#alphaContext = this.#alphaCanvas.getContext("2d")!;
    this.#firstChunkIsFlipped = false;
    this.#debug = false;
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
    if (world.chunks.length > 0) {
      this.#firstChunkIsFlipped = world.chunks[0].flipped;
    }
    this.#debug = world.playerControl.debug !== null;
  }

  render(view: PlayView): void {
    if (this.#debug) {
      return;
    }

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

    for (let offset = 1; offset >= 0; offset -= 1) {
      acx.fillStyle = offset > 0 ? "rgb(128,128,128)" : "white";

      const topSunDepth = 1;
      const offset45 = offset * Math.sqrt(2);
      acx.save();
      acx.translate(CHUNK_WIDTH / 2, 0);
      acx.scale(this.#firstChunkIsFlipped ? -1 : 1, 1);
      acx.beginPath();
      acx.moveTo(-VIEW_WIDTH/2, MAX_VIEWPORT_HEIGHT);
      acx.lineTo(-VIEW_WIDTH/2, -VIEW_WIDTH/2 -offset45 - topSunDepth);
      acx.lineTo(0, -offset45 - topSunDepth);
      // acx.lineTo(2.5, -2.5 -offset45 - topSunDepth);
      // acx.lineTo(2.5, -9 - topSunDepth);
      // acx.lineTo(4.5, -9 - topSunDepth);
      // acx.lineTo(4.5, -4.5 -offset45 - topSunDepth);
      acx.lineTo(VIEW_WIDTH/2, -VIEW_WIDTH/2 -offset45 - topSunDepth);
      acx.lineTo(VIEW_WIDTH/2 + BORDER_WIDTH, MAX_VIEWPORT_HEIGHT);
      acx.closePath();
      acx.fill();
      acx.restore();
    }

    for (const ls of this.#lightSources) {
      const grad = acx.createRadialGradient(ls.center.x, ls.center.y, 0, ls.center.x, ls.center.y, ls.r);
      grad.addColorStop(0.9, "rgba(255, 255, 255, 1)");
      grad.addColorStop(1, "rgba(255, 255, 255, 0)");
      acx.fillStyle = grad;
      acx.beginPath();
      acx.moveTo(ls.center.x, ls.center.y + ls.r + 1);
      acx.arc(ls.center.x, ls.center.y, ls.r + 1, 0, TAU);
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
