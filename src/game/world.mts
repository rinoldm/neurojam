import {AssetLoader} from "../assets.mjs";
import {Entity} from "./entity.mts";
import {PlayView} from "../app.mjs";
import {BORDER_WIDTH, CHUNK_HEIGHT, CHUNK_WIDTH} from "./data.mjs";
import {Vec2} from "../hitbox.mts";
import {Player, PlayerControl} from "./player.mts";
import {Solid} from "./solid.mts";

export class World {
  assets: AssetLoader;
  entities: Map<number, Entity>;
  nextId: number;
  depthOrder: null | Entity[];
  camera: Vec2;
  #player: null | Player;
  playerControl: PlayerControl;

  constructor(assets: AssetLoader) {
    this.assets = assets;
    this.entities = new Map<number, Entity>();
    this.nextId = 1;
    this.depthOrder = null;
    this.camera = new Vec2(CHUNK_WIDTH / 2, CHUNK_HEIGHT / 2);
    this.#player = null;
    this.playerControl = {
      down: false, jump: false, left: false, right: false, use: false,
    };
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
    for (const entity of this.entities.values()) {
      if (entity instanceof Player) {
        entity.update(this, tick);
      }
    }
    for (const entity of this.entities.values()) {
      if (entity instanceof Solid) {
        entity.update(this, tick);
      }
    }
  }

  public render(view: PlayView): void {
    const cx = view.context;
    cx.transform(view.canvas.width / view.size.x, 0, 0, view.canvas.height / view.size.y, 0, 0);
    cx.translate(BORDER_WIDTH, 0);
    const midPoint = new Vec2(CHUNK_WIDTH / 2, view.size.y / 2);
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
}
