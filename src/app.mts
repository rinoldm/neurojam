import {AssetLoader} from "./assets.mjs";
import {BACKGROUND_MUSIC, GLOBAL_ASSET_LIST} from "./assets/index.mts";
import {World} from "./game/world.mts";
import {Solid} from "./game/solid.mjs";
import {Vec2} from "./hitbox.mts";
import {TICK_DURATION_MS} from "./game/data.mjs";

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
  #inputCallback: null | (() => void);
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
    this.#inputCallback = () => this.onInput();
    window.addEventListener("click", this.#inputCallback);
    this.#refresh();
  }

  #refresh(): void {
    this.#frameCount += 1;
    this.#tickCount += 1;
    // const prog = this.#assets.progress();
    // this.#root.innerHTML = this.#state.globalState + " -- " + prog.bytesTotal;

    this.render();

    if (this.#refreshCallback !== null) {
      this.#refreshCallbackHandle = window.requestAnimationFrame(this.#refreshCallback);
    }
  }

  public onInput() {
    switch (this.#state.globalState) {
      case "Load": {
        const progress = this.#assets.progress();
        if (progress.ready) {
          this.#state.globalState = "Menu";
        }
        break;
      }
      case "Menu": {
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
        const cx: CanvasRenderingContext2D = view.context;
        cx.resetTransform();
        cx.clearRect(0, 0, view.canvas.width, view.canvas.height);
        this.world().render(view);
        // cx.fillStyle = "rgba(0, 0, 0, 0.1)";
        // cx.fillRect(0, 0, view.canvas.width, view.canvas.height);
        // cx.transform(view.canvas.width / 25, 0, 0, view.canvas.height / 29, 0, 0);
        // cx.fillStyle = "red";
        // cx.fillRect(0, 0, 1, 1);
        // const player = this.#assets.getImage(PLAYER);
        // const pWidth = 1.5;
        // const pHeight = 1.75;
        // const availableX = 25 - pWidth;
        // const availableY = 29 - pHeight;
        // const posX = availableX * (0.5 + 0.5 * Math.sin(this.#tickCount / 800 * TAU));
        // const posY = availableY * (0.5 + 0.5 * Math.sin(this.#tickCount / 1000 * TAU));
        // cx.drawImage(player, 0, 0, player.width, player.height, posX, posY, pWidth, pHeight);
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
      canvas.width = 800;
      canvas.height = 928;
      const context: CanvasRenderingContext2D = canvas.getContext("2d")!;

      container.appendChild(canvas);
      this.#root.appendChild(container);

      const view: PlayView = {
        container,
        canvas,
        context,
      };
      this.#playView = view;
    }
    return this.#playView;
  }

  public world(): World {
    if (this.#world === null) {
      this.#world = new World(this.#assets);
      Solid.attach(this.#world, {center: new Vec2(1.5, 1.5), r: new Vec2(0.5, 0.5),});
      Solid.attach(this.#world, {center: new Vec2(2.5, 1.5), r: new Vec2(0.5, 0.5),});
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
}
