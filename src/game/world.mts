import {AssetLoader, LevelAssetRef} from "../assets.mjs";
import {Entity} from "./entity.mts";
import {PlayView} from "../app.mjs";
import {BORDER_WIDTH, CHUNK_HEIGHT, CHUNK_WIDTH, MAX_VIEWPORT_HEIGHT, SKY_COLOR} from "./data.mjs";
import {Vec2} from "../hitbox.mts";
import {Player, PlayerControl} from "./player.mts";
import {Wall} from "./wall.mts";
import {LVL_000, REGULAR_LEVELS} from "../assets/index.mjs";
import {Level} from "../level.mts";
import {Shadow} from "./shadow.mjs";
import {Torch} from "./torch.mts";
import {Background} from "./background.mjs";

export interface Chunk {
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
  levelFollowers: Map<number, LevelFollower[]>;

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
    this.levelFollowers = computeFollowers(assets);
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

    const transitionRadius = 1.5;
    const playerCenter = player.worldHitbox().center;
    const playerChunk = this.posToChunkId(playerCenter);
    const chunkStart = -playerChunk * CHUNK_HEIGHT;
    const playerPosInChunk = Math.abs(playerCenter.y - chunkStart);
    const normalizedPos = playerPosInChunk < transitionRadius ? smooth(0.5 * playerPosInChunk / transitionRadius) :
      playerPosInChunk < CHUNK_HEIGHT - transitionRadius ? smooth(0.5) : smooth(1 - 0.5 * (CHUNK_HEIGHT - playerPosInChunk) / transitionRadius);

    const newCameraTarget = new Vec2(CHUNK_WIDTH / 2, chunkStart - CHUNK_HEIGHT * normalizedPos);
    this.cameraTarget = this.cameraTarget.min(newCameraTarget); // prevent camera from going back up when jumping at a transition

    this.camera = new Vec2(this.camera.x, this.camera.y + (this.cameraTarget.y - this.camera.y) / 8);
    if (Math.abs(this.cameraTarget.y - this.camera.y) < 1e-3) {
      this.camera = new Vec2(this.camera.x, this.cameraTarget.y);
    }
  }

  public render(view: PlayView): void {
    this.viewHeight = view.size.y;
    const cx = view.context;
    cx.fillStyle = SKY_COLOR;
    cx.fillRect(0, 0, cx.canvas.width, cx.canvas.height);
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
      entity.render?.(view, this.assets);
    }
  }

  public player(): Player {
    return this.#player!;
  }

  public genChunks() {
    const lowestVisibleY = this.camera.y - this.viewHeight / 2;
    const neededChunks = 1 + Math.ceil(Math.abs(lowestVisibleY) / CHUNK_HEIGHT);
    while (this.chunks.length < neededChunks) {
      let chunk: Chunk;
      const chunkId = this.chunks.length;
      if (chunkId === 0) {
        chunk = {
          id: chunkId,
          asset: LVL_000,
          flipped: Math.random() < 0.5,
          applied: false,
        };
      } else {
        const prevChunk = this.chunks[chunkId - 1];
        const prevLevel: Level = this.assets.getLevel(prevChunk.asset);
        let prevLeft = prevChunk.flipped ? prevLevel.exitLeft : prevLevel.exitRight;
        let prevRight = prevChunk.flipped ? prevLevel.exitRight : prevLevel.exitLeft;
        const connection = (+prevLeft) | ((+prevRight) << 1);
        const followers: LevelFollower[] = this.levelFollowers.get(connection)!;
        const picked = followers[Math.floor(Math.random() * followers.length)];
        chunk = {
          id: chunkId,
          asset: picked.asset,
          flipped: picked.flipped,
          applied: false,
        };
      }
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
      this.#player = Player.attach(this, new Vec2(CHUNK_WIDTH / 2, -10));
      Shadow.attach(this);
      Torch.attach(this, new Vec2(CHUNK_WIDTH / 2, -12));
      // Torch.attach(this, new Vec2(14.5, 2.5));
      // Torch.attach(this, new Vec2(12.5, 2.5));
    }

    if (chunk.applied) {
      return;
    }

    Background.attach(this, chunk.id);

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

interface LevelFollower {
  asset: LevelAssetRef,
  flipped: boolean,
}

function computeFollowers(assets: AssetLoader): Map<number, LevelFollower[]> {
  const result: Map<number, LevelFollower[]> = new Map([[0, []], [1, []], [2, []], [3, []]]);
  for (const levelRef of REGULAR_LEVELS) {
    const level: Level = assets.getLevel(levelRef);
    const left = level.enterLeft ? 1 : 0;
    const right = level.enterRight ? 1 : 0;
    const prev = left | (right << 1);
    result.get(prev)!.push({asset: levelRef, flipped: false} satisfies LevelFollower);
    const prevFlipped = right | (left << 1);
    result.get(prevFlipped)!.push({asset: levelRef, flipped: true} satisfies LevelFollower);
  }
  return result;
}

// converts a linear [0, 1[ value to one with a nul slope at 0.5
function smooth(x: number): number {
  if (x < 0.5) {
    return -2 * x * (x - 1);
  } else {
    return 1 + 2 * x * (x  - 1)
  }
}
