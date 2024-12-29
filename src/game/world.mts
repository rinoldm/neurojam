import {AssetLoader, LevelAssetRef} from "../assets.mjs";
import {Entity} from "./entity.mts";
import {PlayView} from "../app.mjs";
import {BORDER_WIDTH, CHUNK_HEIGHT, CHUNK_WIDTH, MAX_VIEWPORT_HEIGHT} from "./data.mjs";
import {Vec2} from "../hitbox.mts";
import {Player, PlayerControl} from "./player.mts";
import {Wall} from "./wall.mts";
import {LVL_PROTOTYPE4} from "../assets/index.mjs";
import {Level} from "../level.mts";
import {Shadow} from "./shadow.mjs";
import {Torch} from "./torch.mts";

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
  globalEntities: Set<Entity>;
  nextId: number;
  depthOrder: null | Entity[];
  camera: Vec2;
  cameraTarget: Vec2;
  #player: null | Player;
  playerControl: PlayerControl;
  chunks: Chunk[];
  viewHeight: number;

  constructor(assets: AssetLoader) {
    this.assets = assets;
    this.entities = new Map<number, Entity>();
    this.entitiesByChunk = new Map();
    this.globalEntities = new Set();
    this.nextId = 1;
    this.depthOrder = null;
    this.camera = new Vec2(CHUNK_WIDTH / 2, -CHUNK_HEIGHT / 2);
    this.cameraTarget = this.camera;
    this.#player = null;
    this.playerControl = {
      down: null, jump: null, left: null, right: null, use: null, debug: null,
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
    if (entity.chunkId === null) {
      this.globalEntities.add(entity);
    } else {
      let chunkEntities = this.entitiesByChunk.get(entity.chunkId);
      if (chunkEntities === undefined) {
        chunkEntities = new Set();
        this.entitiesByChunk.set(entity.chunkId, chunkEntities);
      }
      chunkEntities.add(entity);
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
      entity.update?.(this, tick);
    }

    this.updateCamera();
  }

  public updateCamera() {
    const player = this.#player;
    if (player === null) {
      return;
    }
    const curChunkCamera = this.posToChunkId(this.camera);
    const curChunkPlayer = this.posToChunkId(player.pos);
    if ((this.#player?.pos?.y ?? 0) % CHUNK_HEIGHT <= -(CHUNK_HEIGHT - 0.5) && curChunkCamera == curChunkPlayer && this.cameraTarget.y == this.camera.y) {
      this.cameraTarget = new Vec2(CHUNK_WIDTH / 2, this.camera.y - CHUNK_HEIGHT);
    }
    this.camera = new Vec2(this.camera.x, this.camera.y + (this.cameraTarget.y - this.camera.y) * 1. / 20);
    if (Math.abs(this.cameraTarget.y - this.camera.y) < 1e-6) {
      this.camera = new Vec2(this.camera.x, this.cameraTarget.y);
    }
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

    const curChunk = this.posToChunkId(this.camera);
    for (let cid = curChunk - 2; cid < curChunk + 3; cid++) {
      const top = -cid * CHUNK_HEIGHT;
      // const bottom = top - CHUNK_HEIGHT;
      const left = -BORDER_WIDTH;
      const right = CHUNK_WIDTH + BORDER_WIDTH;
      const grad = cx.createLinearGradient(0, 0, 0, -CHUNK_HEIGHT);
      grad.addColorStop(0, "orange");
      grad.addColorStop(1, "blue");
      cx.fillStyle = grad;
      cx.fillRect(left, top, right - left, CHUNK_HEIGHT);
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
    while (this.chunks.length < neededChunks) {
      const chunk: Chunk = {
        id: this.chunks.length,
        asset: LVL_PROTOTYPE4,
        flipped: true,
        applied: false,
      };
      this.chunks.push(chunk);
      this.applyChunk(chunk)
    }
  }

  public getCloseEntities(pos: Vec2, range: number = 1): Entity[] {
    const res: Entity[] = [];
    const chunkId = this.posToChunkId(pos);
    for (let cid = chunkId - range; cid < chunkId + 1 + range; cid++) {
      const ents = this.entitiesByChunk.get(cid);
      if (ents !== undefined) {
        res.push(...ents);
      }
    }
    res.push(...this.globalEntities);
    return res;
  }

  public applyChunk(chunk: Chunk) {
    if (chunk.id === 0) {
      this.#player = Player.attach(this, new Vec2(4.5, 2.5));
      Shadow.attach(this);
      Torch.attach(this, new Vec2(16.5, 2.5));
      // Torch.attach(this, new Vec2(14.5, 2.5));
      // Torch.attach(this, new Vec2(12.5, 2.5));
    }

    if (chunk.applied) {
      return;
    }

    const worldAnchor = new Vec2(CHUNK_WIDTH / 2, -CHUNK_HEIGHT * chunk.id);
    const level: Level = this.assets.getLevel(chunk.asset);
    const levelAnchor = new Vec2(CHUNK_WIDTH / 2, 0);
    for (const obj of level.getObjects()) {
      switch (obj.class) {
        case "Wall": {
          if (obj.type !== "Rect") {
            throw new Error("`Wall` object must have type `Rect`");
          }

          const levelDiameter = new Vec2(obj.width, obj.height);
          const chunkDiameter = levelDiameter.elemDiv(level.tileSize);
          const chunkRadius = chunkDiameter.scalarMult(0.5);

          const levelCorner = new Vec2(obj.x, obj.y);
          const chunkCorner = levelCorner.elemDiv(level.tileSize).elemMult(Vec2.BOTTOM_RIGHT);
          const chunkCenter = chunkCorner.add(chunkRadius.elemMult(Vec2.BOTTOM_RIGHT));

          const worldRadius = chunkRadius;
          const worldCenter = chunk.flipped ? chunkCenter.sub(levelAnchor).elemMult(Vec2.TOP_LEFT).add(worldAnchor) : chunkCenter.sub(levelAnchor).add(worldAnchor);

          Wall.attach(this, chunk.id, {center: worldCenter, r: worldRadius});

          break;
        }
        case "Water":
        case "Sand":
        case "Enemy1":
        case "Enemy2":
        case "Enemy3":
          break;

        default: {
          throw new Error(`Unexpected object class ${obj.class}`)
        }
      }
    }

    Wall.attach(this, chunk.id, {
      center: worldAnchor.add(new Vec2(-CHUNK_WIDTH / 2 - BORDER_WIDTH, -CHUNK_HEIGHT / 2)),
      r: new Vec2(BORDER_WIDTH, CHUNK_HEIGHT / 2),
    });
    Wall.attach(this, chunk.id, {
      center: worldAnchor.add(new Vec2(CHUNK_WIDTH / 2 + BORDER_WIDTH, -CHUNK_HEIGHT / 2)),
      r: new Vec2(BORDER_WIDTH, CHUNK_HEIGHT / 2),
    });

    chunk.applied = true;
  }

  public posToChunkId(pos: Vec2): number {
    return Math.floor(-pos.y / CHUNK_HEIGHT);
  }
}
