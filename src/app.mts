import {AssetLoader} from "./assets.mjs";
import {MUS_MAIN, GLOBAL_ASSET_LIST} from "./assets/index.mts";
import {World} from "./game/world.mts";
import {Vec2} from "./hitbox.mts";
import {
  MAX_VIEWPORT_HEIGHT,
  MIN_VIEWPORT_HEIGHT,
  BASE_CELL_PX,
  TICK_DURATION_MS,
  VIEW_WIDTH,
} from "./game/data.mjs";

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
  gameOverTriggered: boolean = false;
  gameOverStartTime: number | null = null;


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
    const ticksToCompute = Math.min(remainingTicks, 3);
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
    if (ev.type === "keydown" && (ev as KeyboardEvent).key === "m") {
      this.#toggleMusic();
    }

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
        /*
        if (ev.type === "click") {
          this.#state.globalState = "Play";
        }
        */
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
            case "b":
              this.world().playerControl.debug = this.#tickCount;
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
            case "b":
              this.world().playerControl.debug = null;
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
      const now: DOMHighResTimeStamp = performance.now();
      this.#syncActiveView();
      switch (this.#state.globalState) {
      case "Load": {
        const view: LoadView = this.loadView();
        const progress = this.#assets.progress();
        view.labelText.data = "Loading...";
        view.bar.max = Math.max(progress.assetTotal, 1);
        view.bar.value = progress.assetOk;
        if (progress.ready) {
          this.#state.globalState = "Menu";
        }
        break;
      }
      case "Menu": {

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

        if (this.#backgroundMusic === null) {
          const audio = this.#assets.getAudio(MUS_MAIN);
          this.#backgroundMusic = audio;
          audio.loop = true;
          audio.volume = 0.5;
          audio.play();
        }
        if (this.world().gameOverTriggered && this.gameOverStartTime === null) {
          this.gameOverStartTime = now;
          this.#backgroundMusic.pause();
        }
        if (this.world().gameOverTriggered && this.gameOverStartTime !== null) {
          const gameOverElapsed = now - this.gameOverStartTime;
          const fadeDuration = 2000;
          const messageDuration = 10000;

          if (gameOverElapsed < fadeDuration) {
            const alpha = gameOverElapsed / fadeDuration;
            cx.fillStyle = `rgba(0, 0, 0, ${alpha})`;
            cx.fillRect(0, 0, view.canvas.width, view.canvas.height);
          } else {
            cx.fillStyle = "black";
            cx.fillRect(0, 0, view.canvas.width, view.canvas.height);
            cx.fillStyle = "white";
            cx.font = "30px Papyrus";
            cx.textAlign = "center";
            cx.fillText("Neuro was consumed by the curse.", view.canvas.width / 2, view.canvas.height / 2);
          }

          if (gameOverElapsed > messageDuration) {
            this.#state.globalState = "Menu";
            this.gameOverTriggered = false;
            this.gameOverStartTime = null;
          }
        }
        break;
      }
    }
  }

  #toggleMusic(): void {
    if (this.#backgroundMusic === null) {
      return;
    }
    if (this.#backgroundMusic.paused) {
      this.#backgroundMusic.play();
    } else {
      this.#backgroundMusic.pause();
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

      // Main menu
      const mainMenu = document.createElement("div");
      mainMenu.classList.add("main-menu"); // Added class for spacing
      mainMenu.style.backgroundSize = "cover";

      const title = document.createElement("h1");
      title.textContent = "The Curse of Ra";
      const subtitle = document.createElement("h2");
      subtitle.textContent = "(Demo)";
      const smallSubtitle = document.createElement("h3");
      smallSubtitle.textContent = "(game jams are hard)";
      mainMenu.appendChild(title);
      mainMenu.appendChild(subtitle);
      mainMenu.appendChild(smallSubtitle);

      const playButton = document.createElement("button");
      playButton.textContent = "Play";
      const helpButton = document.createElement("button");
      helpButton.textContent = "Help";
      const creditsButton = document.createElement("button");
      creditsButton.textContent = "Credits";
      const aboutButton = document.createElement("button");
      aboutButton.textContent = "About";
      mainMenu.appendChild(playButton);
      mainMenu.appendChild(helpButton);
      mainMenu.appendChild(creditsButton);
      mainMenu.appendChild(aboutButton);

      // Help page
      const helpPage = document.createElement("div");
      helpPage.classList.add("help-page");
      const helpText = document.createElement("p");
      helpText.innerHTML = `
        Beware the Curse of Ra...<br>The darkness will soon consume your light.<br>Hurry and go down the pyramid, but stay close to your torch, or risk activating the curse!<br><br>
        <strong>Controls</strong><br>
        WASD/Arrow keys : Move and jump<br>
        Space : Throw a torch<br>
        M : Toggle music
      `;
      const backButtonFromHelp = document.createElement("button");
      backButtonFromHelp.textContent = "Back";
      helpPage.appendChild(helpText);
      helpPage.appendChild(backButtonFromHelp);
      helpPage.style.display = "none";

      // Credits page
      const creditsPage = document.createElement("div");
      creditsPage.classList.add("credits-page");
      const creditsText = document.createElement("p");
      creditsText.innerHTML = `
        A game by maxdefolsch and demurgos.<br><br>
        Music: <a href="https://rest--vgmusic.bandcamp.com/track/foes-battle-1">"Foes (Battle 1)" by Rest!</a><br>
        Minor AI assistance: NovelAI (base of Neuro sprite), Copilot (code tidbits)
      `;
      const backButtonFromCredits = document.createElement("button");
      backButtonFromCredits.textContent = "Back";
      creditsPage.appendChild(creditsText);
      creditsPage.appendChild(backButtonFromCredits);
      creditsPage.style.display = "none";

      // About page
      const aboutPage = document.createElement("div");
      aboutPage.classList.add("about-page");
      const aboutText = document.createElement("p");
      aboutText.innerHTML = `
        Hi, I'm maxdefolsch, long-time Neuro-sama fan, and this is my very first game jam. To force myself to have the motivation to do this I also dragged my friend demurgos, who had never heard of Neuro-sama but is a genius developer who's done several game jams before.<br><br>
        After some thinking we settled on the idea of a fast-paced, vertical pseudo-roguelike, where you must make your way down a pyramid in a very limited time, but you also need to stay inside the halo of your torch to avoid summoning an indestructible fireball, and sometimes you actually have to take things slow to go around enemies, or even drop your torch temporarily to get through sections.<br><br>
        Some of these mechanics were influenced by our life passion, an old Flash game called <a href="https://eternalfest.net/">Hammerfest</a>, which we have spent the last decade saving from oblivion together.<br><br>
        I found out that three days is a really short time to make a game when you don't know what you're doing. I'm hoping we can improve this game in the future, and bring it to a more completed state.<br><br>
        Hope you have fun with this little demo!
      `;
      const backButtonFromAbout = document.createElement("button");
      backButtonFromAbout.textContent = "Back";
      aboutPage.appendChild(aboutText);
      aboutPage.appendChild(backButtonFromAbout);
      aboutPage.style.display = "none";

      container.appendChild(mainMenu);
      container.appendChild(helpPage);
      container.appendChild(creditsPage);
      container.appendChild(aboutPage);
      this.#root.appendChild(container);

      // Event listeners for navigation
      playButton.addEventListener("click", () => {
        this.#state.globalState = "Play";
      });

      helpButton.addEventListener("click", () => {
        mainMenu.style.display = "none";
        helpPage.style.display = "block";
      });

      creditsButton.addEventListener("click", () => {
        mainMenu.style.display = "none";
        creditsPage.style.display = "block";
      });

      backButtonFromHelp.addEventListener("click", () => {
        helpPage.style.display = "none";
        mainMenu.style.display = "block";
      });

      backButtonFromCredits.addEventListener("click", () => {
        creditsPage.style.display = "none";
        mainMenu.style.display = "block";
      });

      // Event listener for About button
      aboutButton.addEventListener("click", () => {
        mainMenu.style.display = "none";
        aboutPage.style.display = "block";
      });

      // Event listener for Back button on About page
      backButtonFromAbout.addEventListener("click", () => {
        aboutPage.style.display = "none";
        mainMenu.style.display = "block";
      });

      const view: MenuView = {
        container,
        mainMenu,
        helpPage,
        creditsPage,
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
  mainMenu: HTMLDivElement;
  helpPage: HTMLDivElement;
  creditsPage: HTMLDivElement;
}

export interface PlayView {
  container: HTMLDivElement;
  canvas: HTMLCanvasElement;
  context: CanvasRenderingContext2D;
  scale: number;
  canvasScale: Vec2;
  size: Vec2;
}
