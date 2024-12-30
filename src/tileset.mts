import {Vec2} from "./hitbox.mts";

export class Tileset {
  tileSize: Vec2;
  columns: number;
  count: number;
  spacing: number;
  margin: number;
  imageSource: string | null;

  private constructor() {
    this.tileSize = new Vec2(32, 32);
    this.columns = 1;
    this.count = 0;
    this.spacing = 0;
    this.margin = 0;
    this.imageSource = null;
  }

  public static default(): Tileset {
    return new Tileset();
  }

  public static fromXml(doc: XMLDocument): Tileset {
    const tileset = new Tileset();
    const root = doc.documentElement;
    tileset.tileSize = new Vec2(
      Number.parseInt(root.getAttribute("tilewidth")!, 10),
      Number.parseInt(root.getAttribute("tileheight")!, 10),
    );
    tileset.count = Number.parseInt(root.getAttribute("tilecount")!, 10);
    tileset.columns = Number.parseInt(root.getAttribute("columns")!, 10);

    let spacingStr = root.getAttribute("spacing");
    if (spacingStr !== null) {
      tileset.spacing = Number.parseInt(spacingStr, 10);
    }

    let marginStr = root.getAttribute("margin");
    if (marginStr !== null) {
      tileset.margin = Number.parseInt(marginStr, 10);
    }

    const imageNode = root.querySelector("& > image");
    if (imageNode !== null) {
      tileset.imageSource = imageNode.getAttribute("source")!;
    }

    return tileset;
  }
}
