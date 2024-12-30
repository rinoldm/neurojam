import {PlayView} from "../app.mts";
import {Entity} from "./entity.mjs";
import type {Chunk, World} from "./world.mts";
import {BACKGROUND_DEPTH} from "./depth.mjs";
import {AssetLoader} from "../assets.mjs";
import {BORDER_WIDTH, CHUNK_HEIGHT, CHUNK_WIDTH, VIEW_WIDTH} from "./data.mjs";
import {Tileset} from "../tileset.mjs";

export class Background extends Entity {
  #chunk: Chunk | null;
  #backCanvas: HTMLCanvasElement;
  #backContext: CanvasRenderingContext2D;

  constructor(id: number, chunkId: number) {
    super(id, chunkId, BACKGROUND_DEPTH);
    this.#chunk = null;
    this.#backCanvas = document.createElement("canvas");
    this.#backCanvas.width = 100;
    this.#backCanvas.height = 100;
    this.#backContext = this.#backCanvas.getContext("2d")!;
  }

  static attach(world: World, chunkId: number): Background {
    return world.register(id => new Background(id, chunkId));
  }

  update(world: World, _tick: number): void {
    this.#chunk = world.chunks[this.chunkId!] ?? null;
  }

  render(view: PlayView, assets: AssetLoader): void {
    const chunk = this.#chunk;
    if (chunk === null) {
      return;
    }
    const scale = Math.floor(view.canvas.width / VIEW_WIDTH);
    const wantedHeight = scale * CHUNK_HEIGHT;

    let dirty = false;
    if (this.#backCanvas.width !== view.canvas.width || this.#backCanvas.height !== wantedHeight) {
      this.#backCanvas.width = view.canvas.width;
      this.#backCanvas.height = wantedHeight;
      dirty = true;
    }

    if (dirty) {
      const bcx = this.#backContext;
      bcx.resetTransform();
      bcx.clearRect(0, 0, view.canvas.width, view.canvas.height);

      const level = assets.getLevel(chunk.asset)!;
      let backgroundImageSource: string | null = null;
      for (const layer of level.layers) {
        if (layer.type === "Image" && layer.name === "background") {
          backgroundImageSource = layer.source;
        }
      }

      if (backgroundImageSource !== null) {
        const backgroundImage = assets.getImageByName(backgroundImageSource);
        bcx.drawImage(backgroundImage, 0, 0, backgroundImage.width, backgroundImage.height, 0, 0, this.#backCanvas.width, this.#backCanvas.height);
      }

      const tilesetCache: Map<string, Tileset> = new Map();
      const imageCache: Map<string, HTMLImageElement> = new Map();
      const tileCache: Map<number, TileRef> = new Map();

      for (const layer of level.layers) {
        switch(layer.type) {
          case "Image":
          case "Object":
            continue;
          case "Tile": {
            for (const [index, gid] of layer.data.entries()) {
              if (gid === 0) {
                continue;
              }
              const x = index % CHUNK_WIDTH;
              const y = (index - x) / CHUNK_WIDTH;
              let tileRef = tileCache.get(gid);
              if (tileRef === undefined) {
                const tsRef = level.getTilesetRef(gid);
                if (tsRef === null) {
                  throw new Error(`missing tileset for gid ${gid} in chunk ${chunk.id}`);
                }
                let tileset = tilesetCache.get(tsRef.source);
                if (tileset === undefined) {
                  tileset = assets.getTilesetByName(tsRef.source);
                  tilesetCache.set(tsRef.source, tileset);
                }
                if (tileset.imageSource === null) {
                  throw new Error("missing tileset source image");
                }
                let image = imageCache.get(tileset.imageSource);
                if (image === undefined) {
                  image = assets.getImageByName(tileset.imageSource);
                  imageCache.set(tileset.imageSource, image);
                }
                const localId = gid - tsRef.first;
                const localX = localId % tileset.columns;
                const localY = (localId - localX) / tileset.columns;
                tileRef = {
                  image,
                  x: tileset.margin + (tileset.tileSize.x + tileset.spacing) * localX,
                  y: tileset.margin + (tileset.tileSize.y + tileset.spacing) * localY,
                  width: tileset.tileSize.x,
                  height: tileset.tileSize.y,
                }
                tileCache.set(gid, tileRef);
              }
              bcx.drawImage(tileRef.image, tileRef.x, tileRef.y, tileRef.width, tileRef.height, scale * (x + BORDER_WIDTH), scale * y, scale, scale);
            }
            break;
          }
          default:
            throw new Error(`unexpected layer type ${(layer as any).type}`);
        }
      }
    }

    const chunkTop = -chunk.id * CHUNK_HEIGHT;
    const cx = view.context;
    cx.save();
    cx.translate(CHUNK_WIDTH / 2, chunkTop - CHUNK_HEIGHT / 2);
    cx.scale(chunk.flipped ? -1 : 1, -1);
    view.context.drawImage(this.#backCanvas, 0, 0, this.#backCanvas.width, this.#backCanvas.height, -VIEW_WIDTH/2, -CHUNK_HEIGHT/2, VIEW_WIDTH, CHUNK_HEIGHT);
    cx.restore();
  }
}

interface TileRef {
  image: HTMLImageElement;
  x: number;
  y: number;
  width: number
  height: number
}
