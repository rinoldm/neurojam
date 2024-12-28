import {AssetLoader} from "../assets.mjs";
import {Entity} from "./entity.mts";
import {PlayView} from "../app.mjs";

export class World {
  assets: AssetLoader;
  entities: Map<number, Entity>;
  nextId: number;
  depthOrder: null | Entity[];

  constructor(assets: AssetLoader) {
    this.assets = assets;
    this.entities = new Map<number, Entity>();
    this.nextId = 1;
    this.depthOrder = null;
  }

  register<E extends Entity>(cb: (id: number) => E): E {
    const id = this.nextId++;
    const entity = cb(id);
    this.entities.set(id, entity);
    this.dirtyDepth();
    return entity;
  }

  /// mark the depth order list as dirty, it should be recomputed on the next render
  public dirtyDepth() {
    this.depthOrder = null;
  }

  public render(view: PlayView): void {
    const cx = view.context;
    cx.transform(view.canvas.width / 25, 0, 0, view.canvas.height / 29, 0, 0);
    if (this.depthOrder === null) {
      const entities = [...this.entities.values()];
      entities.sort((a, b) => a.depth === b.depth ? a.id - b.id : a.depth - b.depth);
      this.depthOrder = entities;
    }
    for (const entity of this.depthOrder) {
      entity.render?.(view);
    }
  }
}
