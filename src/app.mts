const TICK_RATE: number = 60;
const TICK_DURATION_MS: number = 1000 / TICK_RATE;
// const TAU: number = Math.PI * 2;

export interface State {
  globalState: GlobalState;
}

export type GlobalState = "Load" | "LoadError" | "Wait" | "Menu" | "Play";

export class App {
  #root: HTMLDivElement;
  #state: State;
  #startTime: DOMHighResTimeStamp;
  #droppedTicks: number;
  #tickCount: number;
  #frameCount: number;
  #refreshCallback: null | (() => void);
  #refreshCallbackHandle: null | number;

  constructor(root: HTMLDivElement, startTime: DOMHighResTimeStamp) {
    this.#root = root;
    this.#state = { globalState: "Load" };
    this.#startTime = startTime;
    this.#tickCount = 0;
    this.#droppedTicks = 0;
    this.#frameCount = 0;
    this.#refreshCallback = null;
    this.#refreshCallbackHandle = null;
  }

  static start(root: HTMLDivElement): App {
    const startTime: DOMHighResTimeStamp = performance.now();
    const app = new App(root, startTime);
    app.#enable();
    return app;
  }

  stop() {
    if (this.#refreshCallbackHandle !== null) {
      window.cancelAnimationFrame(this.#refreshCallbackHandle);
      this.#refreshCallbackHandle = null;
    }
    this.#refreshCallback = null;
  }

  #enable(): void {
    this.#refreshCallback = () => this.#refresh();
    this.#refresh();
  }

  #refresh(): void {
    const now: DOMHighResTimeStamp = performance.now();
    const elapsedTimeMs: DOMHighResTimeStamp = now - (this.#startTime + this.#droppedTicks * TICK_DURATION_MS);
    const hue = (elapsedTimeMs / 1000 * 60) % 360;
    this.#root.style.color = `hsl(${hue}, 100%, 50%)`;
    this.#frameCount += 1;
    this.#tickCount += 1;
    this.#root.innerHTML = this.#state.globalState;

    if (this.#refreshCallback !== null) {
      this.#refreshCallbackHandle = window.requestAnimationFrame(this.#refreshCallback);
    }
  }
}
