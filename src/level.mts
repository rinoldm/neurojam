import { Vec2 } from "./hitbox.mts";
import {CHUNK_HEIGHT, CHUNK_WIDTH} from "./game/data.mjs";

export type LayerType = "Tile" | "Object";

export interface TileLayer {
  type: "Tile";
}

export interface ObjectLayer {
  type: "Object";
  id: string;
  name: string;
  objects: TiledObject[];
}

export type Layer = TileLayer | ObjectLayer;

export type TiledObjectType = "Ellipse" | "Point" | "Rect";

export interface EllipseTiledObject {
  type: "Ellipse";
  id: string;
  class: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface PointTiledObject {
  type: "Point";
  id: string;
  class: string;
  x: number;
  y: number;
}

export interface RectTiledObject {
  type: "Rect";
  id: string;
  class: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

export type TiledObject = EllipseTiledObject | PointTiledObject | RectTiledObject;

export class Level {
  tileSize: Vec2;
  size: Vec2;
  layers: Layer[];
  enterLeft: boolean;
  enterRight: boolean;
  exitLeft: boolean;
  exitRight: boolean;

  private constructor() {
    this.tileSize = new Vec2(32, 32);
    this.size = new Vec2(CHUNK_WIDTH, CHUNK_HEIGHT);
    this.layers = [];
    this.enterLeft = false;
    this.enterRight = false;
    this.exitLeft = false;
    this.exitRight = false;
  }

  public static default(): Level {
    return new Level();
  }

  public static fromXml(doc: XMLDocument): Level {
    const level = new Level();
    const root = doc.documentElement;
    level.tileSize = new Vec2(
      Number.parseInt(root.getAttribute("tilewidth")!, 10),
      Number.parseInt(root.getAttribute("tileheight")!, 10),
    );
    level.size = new Vec2(
      Number.parseInt(root.getAttribute("width")!, 10),
      Number.parseInt(root.getAttribute("height")!, 10),
    );

    const propertyNodes = root.querySelectorAll("& > properties > property");
    for (const propertyNode of propertyNodes) {
      const name: string = propertyNode.getAttribute("name")!;
      // const _typ: string = propertyNode.getAttribute("type")!;
      const valStr: string = propertyNode.getAttribute("value")!;
      switch (name) {
        case "enter_left":
          level.enterLeft = valStr === "true";
          break;
        case "enter_right":
          level.enterRight = valStr === "true";
          break;
        case "exit_left":
          level.exitLeft = valStr === "true";
          break;
        case "exit_right":
          level.exitLeft = valStr === "true";
          break;
        default:
          throw new Error(`unexpected property ${JSON.stringify(name)}`);
      }
    }

    const layerNodes = root.querySelectorAll("& > layer, & > objectgroup");
    for (const layerNode of layerNodes) {
      switch (layerNode.tagName.toLowerCase()) {
        case "layer": {
          break;
        }
        case "objectgroup": {
          let objects: TiledObject[] = [];
          for (const objectNode of layerNode.children) {
            switch (getObjectNodeType(objectNode)) {
              case "Ellipse": {
                break;
              }
              case "Point": {
                break;
              }
              case "Rect": {
                const id: string = objectNode.getAttribute("id")!;
                const typ: string = objectNode.getAttribute("type")!;
                const x: number = Number.parseInt(objectNode.getAttribute("x")!, 10);
                const y: number = Number.parseInt(objectNode.getAttribute("y")!, 10);
                const width: number = Number.parseInt(objectNode.getAttribute("width")!, 10);
                const height: number = Number.parseInt(objectNode.getAttribute("height")!, 10);
                objects.push({
                  type: "Rect",
                  id,
                  class: typ,
                  x,
                  y,
                  width,
                  height,
                } satisfies RectTiledObject)
                break;
              }
            }
          }
          level.layers.push({
            type: "Object",
            id: layerNode.getAttribute("id")!,
            name: layerNode.getAttribute("name")!,
            objects,
          } satisfies ObjectLayer);
          break;
        }
        default: {
          throw new Error("unexpected layer tag " + JSON.stringify(layerNode.tagName));
        }
      }
    }
    return level;
  }

  getObjects(): IterableIterator<TiledObject> {
    const objects: TiledObject[] = [];
    for (const layer of this.layers) {
      if (layer.type === "Object") {
        objects.push(...layer.objects);
      }
    }
    return objects[Symbol.iterator]();
  }
}

function getObjectNodeType(objectNode: Element): TiledObjectType {
  if (objectNode.querySelector("point") !== null) {
    return "Point";
  } else if (objectNode.querySelector("ellipse") !== null) {
    return "Ellipse";
  } else {
    return "Rect";
  }
}
