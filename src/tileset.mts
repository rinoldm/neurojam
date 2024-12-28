export class Tileset {
  private constructor() {
  }

  public static default(): Tileset {
    return new Tileset();
  }

  public static fromXml(_doc: Document): Tileset {
    return new Tileset();
  }
}
