import {AssetLoader} from "./assets.mjs";
import {BACKGROUND_MUSIC, GLOBAL_ASSET_LIST} from "./assets/index.mts";
import {World} from "./game/world.mts";
import {Wall} from "./game/wall.mjs";
import {Vec2} from "./hitbox.mts";
import {
  MAX_VIEWPORT_HEIGHT,
  MIN_VIEWPORT_HEIGHT,
  BASE_CELL_PX,
  TICK_DURATION_MS,
  VIEW_WIDTH, CHUNK_HEIGHT, CHUNK_WIDTH, BORDER_WIDTH
} from "./game/data.mjs";
import { Player } from "./game/player.mts";

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
  #inputCallback: null | ((ev: UIEvent) => void);
  #refreshCallbackHandle: null | number;
  #assets: AssetLoader;
  #loadView: null | LoadView;
  #menuView: null | MenuView;
  #playView: null | PlayView;
  #backgroundMusic: null | HTMLAudioElement;
  #world: null | World;

  constructor(root: HTMLDivElement, startTime: DOMHighResTimeStamp) {
    this.#root = root;
    this.#state = {globalState: "Load"};
    this.#startTime = startTime;
    this.#tickCount = 0;
    this.#droppedTicks = 0;
    this.#frameCount = 0;
    this.#refreshCallback = null;
    this.#inputCallback = null;
    this.#refreshCallbackHandle = null;
    this.#assets = AssetLoader.load(GLOBAL_ASSET_LIST);
    this.#loadView = null;
    this.#menuView = null;
    this.#playView = null;
    this.#backgroundMusic = null;
    this.#world = null;
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
    this.#inputCallback = (ev: UIEvent) => this.onInput(ev);
    window.addEventListener("click", this.#inputCallback);
    window.addEventListener("keydown", this.#inputCallback);
    window.addEventListener("keyup", this.#inputCallback);
    this.#refresh();
  }

  #refresh(): void {
    const now: DOMHighResTimeStamp = performance.now();
    const elapsed = now - this.#startTime;
    const tickId = Math.floor(elapsed / TICK_DURATION_MS);
    const prevTickId = this.#tickCount + this.#droppedTicks
    const remainingTicks = tickId - prevTickId;
    const ticksToCompute = Math.max(remainingTicks, 3);
    const extraDroppedTicks = remainingTicks - ticksToCompute;
    // todo: print warning when dropping ticks
    this.#droppedTicks += extraDroppedTicks;
    for (let t = 0; t < ticksToCompute; t++) {
      this.#tickCount += 1;
      if (this.#world !== null) {
        this.#world.update(this.#tickCount);
      }
    }

    this.#frameCount += 1;
    this.render();

    if (this.#refreshCallback !== null) {
      this.#refreshCallbackHandle = window.requestAnimationFrame(this.#refreshCallback);
    }
  }

  public onInput(ev: UIEvent) {
    switch (this.#state.globalState) {
      case "Load": {
        const progress = this.#assets.progress();
        if (progress.ready && ev.type === "click") {
          this.#state.globalState = "Menu";
        }
        break;
      }
      case "Menu": {
        // todo: switch on target elem
        if (ev.type === "click") {
          this.#state.globalState = "Play";
        }
        break;
      }
      case "Play": {
        if (ev.type === "keydown") {
          const kev: KeyboardEvent = ev as KeyboardEvent;
          switch (kev.key) {
            case "ArrowUp":
            case "w":
              this.world().playerControl.jump = this.#tickCount;
              break;
            case "ArrowLeft":
            case "a":
              this.world().playerControl.left = this.#tickCount;
              break;
            case "ArrowRight":
            case "d":
              this.world().playerControl.right = this.#tickCount;
              break;
            case "ArrowDown":
            case "s":
              this.world().playerControl.down = this.#tickCount;
              break;
            case " ":
            case "e":
              this.world().playerControl.use = this.#tickCount;
              break;
          }
        }
        if (ev.type === "keyup") {
          const kev: KeyboardEvent = ev as KeyboardEvent;
          switch (kev.key) {
            case "ArrowUp":
            case "w":
              this.world().playerControl.jump = null;
              break;
            case "ArrowLeft":
            case "a":
              this.world().playerControl.left = null;
              break;
            case "ArrowRight":
            case "d":
              this.world().playerControl.right = null;
              break;
            case "ArrowDown":
            case "s":
              this.world().playerControl.down = null;
              break;
            case " ":
            case "e":
              this.world().playerControl.use = null;
              break;
          }
        }

        // todo: switch on target elem
        this.#state.globalState = "Play";
        break;
      }
    }
  }

  public render(): void {
    this.#syncActiveView();
    switch (this.#state.globalState) {
      case "Load": {
        const now: DOMHighResTimeStamp = performance.now();
        const elapsedTimeMs: DOMHighResTimeStamp = now - (this.#startTime + this.#droppedTicks * TICK_DURATION_MS);
        const hue = (elapsedTimeMs / 1000 * 60) % 360;
        this.#root.style.color = `hsl(${hue}, 100%, 50%)`;

        const view: LoadView = this.loadView();
        const progress = this.#assets.progress();
        view.labelText.data = progress.ready ? "Click To Play" : "Loading...";
        view.bar.max = Math.max(progress.assetTotal, 1);
        view.bar.value = progress.assetOk;
        break;
      }
      case "Menu": {
        const now: DOMHighResTimeStamp = performance.now();
        const elapsedTimeMs: DOMHighResTimeStamp = now - (this.#startTime + this.#droppedTicks * TICK_DURATION_MS);
        const hue = (elapsedTimeMs / 1000 * 60) % 360;
        this.#root.style.color = `hsl(${hue}, 100%, 50%)`;

        if (this.#backgroundMusic === null) {
          const audio = this.#assets.getAudio(BACKGROUND_MUSIC);
          this.#backgroundMusic = audio;
          audio.loop = true;
          // audio.play();
        }
        // Nothing to do beyond `syncActiveView`
        break;
      }
      case "Play": {
        const view: PlayView = this.playView();
        const minSize = new Vec2(VIEW_WIDTH * BASE_CELL_PX, MIN_VIEWPORT_HEIGHT * BASE_CELL_PX);
        const root: HTMLElement = document.documentElement
        const appSize = new Vec2(root.clientWidth, root.clientHeight);
        const availableSize = minSize.max(appSize);
        const scale2 = availableSize.elemDiv(minSize);
        const scale = Math.floor(Math.max(Math.min(scale2.x, scale2.y), 1));
        let size = minSize.scalarMult(scale);

        // extra row logic: comment out to skip
        const allowedExtraRows = MAX_VIEWPORT_HEIGHT - MIN_VIEWPORT_HEIGHT;
        const availableExtraRows = Math.floor((availableSize.y - size.y) / scale / BASE_CELL_PX);
        const extraRows = Math.min(Math.max(availableExtraRows, 0), allowedExtraRows);
        size = new Vec2(size.x, size.y + extraRows * scale * BASE_CELL_PX);
        const pxRatio = window.devicePixelRatio;
        view.scale = scale;
        view.canvasScale = new Vec2(scale * pxRatio, scale * pxRatio);
        view.size = new Vec2(VIEW_WIDTH, MIN_VIEWPORT_HEIGHT + extraRows);

        view.canvas.style.width = `${size.x}px`;
        view.canvas.style.height = `${size.y}px`;
        view.canvas.width = size.x * pxRatio;
        view.canvas.height = size.y * pxRatio;
        const cx: CanvasRenderingContext2D = view.context;
        cx.resetTransform();
        cx.clearRect(0, 0, view.canvas.width, view.canvas.height);
        this.world().render(view);
        break;
      }
    }
  }

  #syncActiveView(): void {
    if (this.#state.globalState === "Load") {
      const view = this.loadView();
      view.container.style.display = "block";
    } else if (this.#loadView !== null) {
      this.#loadView.container.style.display = "none";
    }
    if (this.#state.globalState === "Menu") {
      const view = this.menuView();
      view.container.style.display = "block";
    } else if (this.#menuView !== null) {
      this.#menuView.container.style.display = "none";
    }
    if (this.#state.globalState === "Play") {
      const view = this.playView();
      view.container.style.display = "block";
    } else if (this.#playView !== null) {
      this.#playView.container.style.display = "none";
    }
  }

  public loadView(): LoadView {
    if (this.#loadView === null) {
      const container = document.createElement("div");
      const label = document.createElement("p");
      const labelText = document.createTextNode("");
      const bar = document.createElement("progress");
      const errorList = document.createElement("div");

      container.appendChild(label);
      label.appendChild(labelText);
      container.appendChild(bar);
      container.appendChild(errorList);
      this.#root.appendChild(container);

      const view: LoadView = {
        container,
        label,
        labelText,
        bar,
        errorList,
      };
      this.#loadView = view;
    }
    return this.#loadView;
  }

  public menuView(): MenuView {
    if (this.#menuView === null) {
      const container = document.createElement("div");
      const label = document.createElement("p");
      const labelText = document.createTextNode("Play");

      container.appendChild(label);
      label.appendChild(labelText);
      this.#root.appendChild(container);

      const view: MenuView = {
        container,
        label,
        labelText,
      };
      this.#menuView = view;
    }
    return this.#menuView;
  }

  public playView(): PlayView {
    if (this.#playView === null) {
      const container = document.createElement("div");
      const canvas = document.createElement("canvas");
      canvas.width = VIEW_WIDTH * BASE_CELL_PX;
      canvas.height = MIN_VIEWPORT_HEIGHT * BASE_CELL_PX;
      const context: CanvasRenderingContext2D = canvas.getContext("2d")!;

      container.appendChild(canvas);
      this.#root.appendChild(container);

      const view: PlayView = {
        container,
        canvas,
        context,
        scale: 1,
        canvasScale: new Vec2(1, 1),
        size: new Vec2(VIEW_WIDTH, MIN_VIEWPORT_HEIGHT),
      };
      this.#playView = view;
    }
    return this.#playView;
  }

  public world(): World {
    if (this.#world === null) {
      this.#world = new World(this.#assets);
      Wall.attach(this.#world, {center: new Vec2(-BORDER_WIDTH, 0), r: new Vec2(BORDER_WIDTH, CHUNK_HEIGHT * 1000),});
      Wall.attach(this.#world, {center: new Vec2(CHUNK_WIDTH + BORDER_WIDTH, 0), r: new Vec2(BORDER_WIDTH, CHUNK_HEIGHT * 1000),});
      Player.attach(this.#world, new Vec2(14.5, 2.5));
    }
    return this.#world;
  }
}

interface LoadView {
  container: HTMLDivElement;
  label: HTMLParagraphElement;
  labelText: Text;
  bar: HTMLProgressElement;
  errorList: HTMLDivElement;
}

interface MenuView {
  container: HTMLDivElement;
  label: HTMLParagraphElement;
  labelText: Text;
}

export interface PlayView {
  container: HTMLDivElement;
  canvas: HTMLCanvasElement;
  context: CanvasRenderingContext2D;
  scale: number;
  canvasScale: Vec2;
  size: Vec2;
}
