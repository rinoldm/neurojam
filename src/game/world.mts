import {AssetLoader, LevelAssetRef} from "../assets.mjs";
import {Entity} from "./entity.mts";
import {PlayView} from "../app.mjs";
import {BORDER_WIDTH, CHUNK_HEIGHT, CHUNK_WIDTH, MAX_VIEWPORT_HEIGHT} from "./data.mjs";
import {Vec2} from "../hitbox.mts";
import {Player, PlayerControl} from "./player.mts";
import {Wall} from "./wall.mts";
import {LEVEL000} from "../assets/index.mjs";
import { Level } from "../level.mts";

interface Chunk {
  id: number;
  asset: LevelAssetRef;
  flipped: boolean;
  applied: boolean;
}

export class World {
  assets: AssetLoader;
  entities: Map<number, Entity>;
  entitiesByChunk: Map<number, Set<Entity>>;
  nextId: number;
  depthOrder: null | Entity[];
  camera: Vec2;
  #player: null | Player;
  playerControl: PlayerControl;
  chunks: Chunk[];
  viewHeight: number;

  constructor(assets: AssetLoader) {
    this.assets = assets;
    this.entities = new Map<number, Entity>();
    this.entitiesByChunk = new Map();
    this.nextId = 1;
    this.depthOrder = null;
    this.camera = new Vec2(CHUNK_WIDTH / 2, -CHUNK_HEIGHT / 2);
    this.#player = null;
    this.playerControl = {
      down: null, jump: null, left: null, right: null, use: null,
    };
    this.chunks = [];
    this.viewHeight = MAX_VIEWPORT_HEIGHT;
  }

  register<E extends Entity>(cb: (id: number) => E): E {
    const id = this.nextId++;
    const entity = cb(id);
    this.entities.set(id, entity);
    this.dirtyDepth();
    if (entity instanceof Player) {
      this.#player = entity;
    }
    return entity;
  }

  /// mark the depth order list as dirty, it should be recomputed on the next render
  public dirtyDepth() {
    this.depthOrder = null;
  }

  public update(tick: number) {
    this.genChunks();

    for (const entity of this.entities.values()) {
      if (entity instanceof Player) {
        entity.update(this, tick);
      }
    }
    for (const entity of this.entities.values()) {
      if (entity instanceof Wall) {
        entity.update(this, tick);
      }
    }
    this.camera = new Vec2(CHUNK_WIDTH / 2, this.player().pos.y);
  }

  public render(view: PlayView): void {
    this.viewHeight = view.size.y;
    const cx = view.context;
    cx.transform(view.canvas.width / view.size.x, 0, 0, -view.canvas.height / view.size.y, 0, 0);
    cx.translate(BORDER_WIDTH, 0);
    const midPoint = new Vec2(CHUNK_WIDTH / 2, -view.size.y / 2);
    const cameraOffset = midPoint.sub(this.camera);
    cx.translate(cameraOffset.x, cameraOffset.y);

    if (this.depthOrder === null) {
      const entities = [...this.entities.values()];
      entities.sort((a, b) => a.depth === b.depth ? a.id - b.id : a.depth - b.depth);
      this.depthOrder = entities;
    }
    for (const entity of this.depthOrder) {
      entity.render?.(view);
    }
  }

  public player(): Player {
    return this.#player!;
  }

  public genChunks() {
    const lowestVisibleY = this.camera.y - this.viewHeight / 2;
    const neededChunks = 1 + Math.ceil(Math.abs(lowestVisibleY) / CHUNK_HEIGHT);
    while(this.chunks.length < neededChunks) {
      const chunk: Chunk = {
        id: this.chunks.length,
        asset: LEVEL000,
        flipped: true,
        applied: false,
      };
      this.chunks.push(chunk);
      this.applyChunk(chunk)
    }
  }

  public getCloseEntities(pos: Vec2): Entity[] {
    const res: Entity[] = [];
    const chunkId = this.posToChunkId(pos);
    for (let cid = chunkId - 1; cid < chunkId + 2; cid++) {
      const ents = this.entitiesByChunk.get(cid);
      if (ents !== undefined) {
        res.push(...ents);
      }
    }
    return res;
  }

  public applyChunk(chunk: Chunk) {
    if (chunk.applied) {
      return;
    }
    const chunkEntities: Set<Entity> = new Set();

    const worldAnchor = new Vec2(CHUNK_WIDTH / 2, -CHUNK_HEIGHT * chunk.id);
    const level: Level = this.assets.getLevel(chunk.asset);
    const levelAnchor = new Vec2(CHUNK_WIDTH / 2, 0);
    for (const obj of level.getObjects()) {
      switch(obj.class) {
        case "Wall": {
          if (obj.type !== "Rect") {
            throw new Error("`Wall` object must have type `Rect`");
          }

          const levelDiameter = new Vec2(obj.width, obj.height);
          const chunkDiameter =  levelDiameter.elemDiv(level.tileSize);
          const chunkRadius = chunkDiameter.scalarMult(0.5);

          const levelCorner = new Vec2(obj.x, obj.y);
          const chunkCorner = levelCorner.elemDiv(level.tileSize).elemMult(Vec2.BOTTOM_RIGHT);
          const chunkCenter = chunkCorner.add(chunkRadius.elemMult(Vec2.BOTTOM_RIGHT));

          const worldRadius = chunkRadius;
          const worldCenter = chunk.flipped ? chunkCenter.sub(levelAnchor).elemMult(Vec2.TOP_LEFT).add(worldAnchor) : chunkCenter.sub(levelAnchor).add(worldAnchor);

          chunkEntities.add(Wall.attach(this, {center: worldCenter, r: worldRadius}));

          break;
        }
        default: {
          throw new Error(`Unexpected object class ${obj.class}`)
        }
      }
    }

    chunkEntities.add(Wall.attach(this, {center: worldAnchor.add(new Vec2(-CHUNK_WIDTH/2 -BORDER_WIDTH, 0)), r: new Vec2(BORDER_WIDTH, CHUNK_HEIGHT),}));
    chunkEntities.add(Wall.attach(this, {center: worldAnchor.add(new Vec2(CHUNK_WIDTH/2 +BORDER_WIDTH, 0)), r: new Vec2(BORDER_WIDTH, CHUNK_HEIGHT),}));
    for(const e of chunkEntities) {
      e.chunkId = chunk.id;
    }
    this.entitiesByChunk.set(chunk.id, chunkEntities);

    chunk.applied = true;
  }

  public posToChunkId(pos: Vec2): number {
    return Math.floor(pos.y / CHUNK_HEIGHT);
  }
}
