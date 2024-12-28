export class Color {
  readonly r: number;
  readonly g: number;
  readonly b: number;
  #css?: string;

  constructor(r: number, g: number, b: number) {
    this.r = r;
    this.g = g;
    this.b = b;
  }

  toCss(): string {
    if (typeof this.#css !== "string") {
      const r = Math.min(Math.max(Math.round(this.r * 255), 0), 255);
      const g = Math.min(Math.max(Math.round(this.g * 255), 0), 255);
      const b = Math.min(Math.max(Math.round(this.b * 255), 0), 255);
      const code = (r << 16) + (g << 8) + b;
      this.#css = `#${code.toString(16).padStart(6, "0")}`;
    }
    return this.#css;
  }

  static rand(): Color {
    return new Color(Math.random(), Math.random(), Math.random());
  }
}
