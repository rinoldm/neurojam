import { Level } from "./level.mts";
import {Tileset} from "./tileset.mjs";

export type AssetType = "Image" | "Audio" | "Level" | "Tileset";

export interface AudioAssetRef {
  type: "Audio";
  url: string;
}

export interface ImageAssetRef {
  type: "Image";
  url: string;
  name: string;
}

export interface LevelAssetRef {
  type: "Level";
  url: string;
}

export interface TilesetAssetRef {
  type: "Tileset";
  url: string;
  name: string;
}

export type AssetRef = AudioAssetRef | ImageAssetRef | LevelAssetRef | TilesetAssetRef;

export class AssetList {
  #audio: Set<AudioAssetRef>;
  #image: Set<ImageAssetRef>;
  #level: Set<LevelAssetRef>;
  #tileset: Set<TilesetAssetRef>;

  constructor() {
    this.#audio = new Set();
    this.#image = new Set();
    this.#level = new Set();
    this.#tileset = new Set();
  }

  public audioIter(): IterableIterator<AudioAssetRef> {
    return this.#audio[Symbol.iterator]();
  }

  public imageIter(): IterableIterator<ImageAssetRef> {
    return this.#image[Symbol.iterator]();
  }

  public levelIter(): IterableIterator<LevelAssetRef> {
    return this.#level[Symbol.iterator]();
  }

  public tilesetIter(): IterableIterator<TilesetAssetRef> {
    return this.#tileset[Symbol.iterator]();
  }

  public registerAudio(url: string): AudioAssetRef {
    const ref: AudioAssetRef = {type: "Audio", url};
    this.#audio.add(ref);
    return ref;
  }

  public registerImage(name: string, url: string): ImageAssetRef {
    const ref: ImageAssetRef = {type: "Image", url, name};
    this.#image.add(ref);
    return ref;
  }

  public registerLevel(url: string): LevelAssetRef {
    const ref: LevelAssetRef = {type: "Level", url};
    this.#level.add(ref);
    return ref;
  }

  public registerTileset(name: string, url: string): TilesetAssetRef {
    const ref: TilesetAssetRef = {type: "Tileset", url, name};
    this.#tileset.add(ref);
    return ref;
  }
}

export interface LoadProgress {
  ready: boolean;
  assetTotal: number;
  assetPending: number;
  assetOk: number;
  assetErr: number;
  bytesLoaded: number;
  bytesTotal: number;
  bytesExhaustive: boolean;
}

interface AssetTask<Target> {
  target: Target;
  xhr: XMLHttpRequest;
  ready: boolean;
  totalBytes: number | null;
  loadedBytes: number;
}

export class AssetLoader {
  #audio: Map<AudioAssetRef, AssetTask<HTMLAudioElement>>;
  #image: Map<ImageAssetRef, AssetTask<HTMLImageElement>>;
  #tileset: Map<TilesetAssetRef, AssetTask<Tileset>>;
  #level: Map<LevelAssetRef, AssetTask<Level>>;

  private constructor(list: AssetList) {
    this.#audio = new Map();
    this.#image = new Map();
    this.#tileset = new Map();
    this.#level = new Map();
    for (const audio of list.audioIter()) {
      const target = new Audio();
      const xhr = new XMLHttpRequest();
      const loader: AssetTask<HTMLAudioElement> = { target, loadedBytes: 0, xhr, ready: true, totalBytes: null };
      const loadCb = (e: ProgressEvent<XMLHttpRequestEventTarget>) => {
        const blob = new Blob([xhr.response as ArrayBuffer]);
        target.src = URL.createObjectURL(blob);
        loader.ready = true;
        if (e.lengthComputable) {
          loader.totalBytes = e.total;
        }
        if (loader.totalBytes === null) {
          loader.totalBytes = 1;
        }
        loader.loadedBytes = loader.totalBytes;
      };
      const progressCb = (e: ProgressEvent<XMLHttpRequestEventTarget>) => {
        if (e.lengthComputable) {
          loader.totalBytes = e.total;
        }
        loader.loadedBytes = e.loaded;
      };
      const loadStartCb = (e: ProgressEvent<XMLHttpRequestEventTarget>) => {
        if (e.lengthComputable) {
          loader.totalBytes = e.total;
        }
        loader.loadedBytes = e.loaded;
      };
      xhr.open("GET", audio.url, true);
      xhr.responseType = "arraybuffer";
      xhr.addEventListener("load", loadCb);
      xhr.addEventListener("progress", progressCb);
      xhr.addEventListener("loadstart", loadStartCb);
      xhr.send(null);
      this.#audio.set(audio,  loader);
    }
    for (const image of list.imageIter()) {
      const target = new Image();
      const xhr = new XMLHttpRequest();
      const imageLoader: AssetTask<HTMLImageElement> = { target, loadedBytes: 0, xhr, ready: true, totalBytes: null };
      const loadCb = (e: ProgressEvent<XMLHttpRequestEventTarget>) => {
        const blob = new Blob([xhr.response as ArrayBuffer]);
        target.src = URL.createObjectURL(blob);
        imageLoader.ready = true;
        if (e.lengthComputable) {
          imageLoader.totalBytes = e.total;
        }
        if (imageLoader.totalBytes === null) {
          imageLoader.totalBytes = 1;
        }
        imageLoader.loadedBytes = imageLoader.totalBytes;
      };
      const progressCb = (e: ProgressEvent<XMLHttpRequestEventTarget>) => {
        if (e.lengthComputable) {
          imageLoader.totalBytes = e.total;
        }
        imageLoader.loadedBytes = e.loaded;
      };
      const loadStartCb = (e: ProgressEvent<XMLHttpRequestEventTarget>) => {
        if (e.lengthComputable) {
          imageLoader.totalBytes = e.total;
        }
        imageLoader.loadedBytes = e.loaded;
      };
      xhr.open("GET", image.url, true);
      xhr.responseType = "arraybuffer";
      xhr.addEventListener("load", loadCb);
      xhr.addEventListener("progress", progressCb);
      xhr.addEventListener("loadstart", loadStartCb);
      xhr.send(null);
      this.#image.set(image,  imageLoader);
    }
    for (const assetRef of list.tilesetIter()) {
      const target = Tileset.default();
      const xhr = new XMLHttpRequest();
      const task: AssetTask<Tileset> = { target, loadedBytes: 0, xhr, ready: true, totalBytes: null };
      const loadCb = (e: ProgressEvent<XMLHttpRequestEventTarget>) => {
        const tileset = Tileset.fromXml(xhr.response);
        task.target = tileset;
        task.ready = true;
        if (e.lengthComputable) {
          task.totalBytes = e.total;
        }
        if (task.totalBytes === null) {
          task.totalBytes = 1;
        }
        task.loadedBytes = task.totalBytes;
      };
      const progressCb = (e: ProgressEvent<XMLHttpRequestEventTarget>) => {
        if (e.lengthComputable) {
          task.totalBytes = e.total;
        }
        task.loadedBytes = e.loaded;
      };
      const loadStartCb = (e: ProgressEvent<XMLHttpRequestEventTarget>) => {
        if (e.lengthComputable) {
          task.totalBytes = e.total;
        }
        task.loadedBytes = e.loaded;
      };
      xhr.open("GET", assetRef.url, true);
      xhr.responseType = "document";
      xhr.addEventListener("load", loadCb);
      xhr.addEventListener("progress", progressCb);
      xhr.addEventListener("loadstart", loadStartCb);
      xhr.send(null);
      this.#tileset.set(assetRef,  task);
    }
    for (const assetRef of list.levelIter()) {
      const target = Level.default();
      const xhr = new XMLHttpRequest();
      const task: AssetTask<Level> = { target, loadedBytes: 0, xhr, ready: true, totalBytes: null };
      const loadCb = (e: ProgressEvent<XMLHttpRequestEventTarget>) => {
        task.target = Level.fromXml(xhr.response);
        task.ready = true;
        if (e.lengthComputable) {
          task.totalBytes = e.total;
        }
        if (task.totalBytes === null) {
          task.totalBytes = 1;
        }
        task.loadedBytes = task.totalBytes;
      };
      const progressCb = (e: ProgressEvent<XMLHttpRequestEventTarget>) => {
        if (e.lengthComputable) {
          task.totalBytes = e.total;
        }
        task.loadedBytes = e.loaded;
      };
      const loadStartCb = (e: ProgressEvent<XMLHttpRequestEventTarget>) => {
        if (e.lengthComputable) {
          task.totalBytes = e.total;
        }
        task.loadedBytes = e.loaded;
      };
      xhr.open("GET", assetRef.url, true);
      xhr.responseType = "document";
      xhr.addEventListener("load", loadCb);
      xhr.addEventListener("progress", progressCb);
      xhr.addEventListener("loadstart", loadStartCb);
      xhr.send(null);
      this.#level.set(assetRef,  task);
    }
  }

  public static load(list: AssetList): AssetLoader {
    return new AssetLoader(list);
  }

  public getAudio(audioRef: AudioAssetRef): HTMLAudioElement {
    return this.#audio.get(audioRef)!.target;
  }

  public getImage(imageRef: ImageAssetRef): HTMLImageElement {
    return this.#image.get(imageRef)!.target;
  }

  public getImageByName(name: string): HTMLImageElement {
    for (const [imageRef, image] of this.#image.entries()) {
      if (imageRef.name === name) {
        return image.target;
      }
    }
    throw new Error(`image not found: ${JSON.stringify(name)}`);
  }

  public getLevel(assetRef: LevelAssetRef): Level {
    return this.#level.get(assetRef)!.target;
  }

  public getTileset(assetRef: TilesetAssetRef): Tileset {
    return this.#tileset.get(assetRef)!.target;
  }

  public getTilesetByName(name: string): Tileset {
    for (const [ref, task] of this.#tileset.entries()) {
      if (ref.name === name) {
        return task.target;
      }
    }
    throw new Error(`tileset not found: ${JSON.stringify(name)}`);
  }

  public progress(): LoadProgress {
    let assetTotal = 0;
    let assetOk = 0;
    let assetPending = 0;
    let bytesExhaustive = true;
    let bytesLoaded = 0
    let bytesTotal = 0

    const tasks = [...this.#audio.values(), ...this.#image.values(), ...this.#level.values(), ...this.#tileset.values()];

    for (const task of tasks) {
      assetTotal += 1;
      if (task.ready) {
        assetOk += 1;
      } else {
        assetPending += 1;
      }
      if (task.totalBytes === null) {
        bytesExhaustive = false;
        bytesTotal += 1;
        bytesLoaded += 0;
      } else {
        bytesTotal += task.totalBytes;
        bytesLoaded += task.loadedBytes;
      }
    }

    return {
      ready: assetOk === assetTotal,
      assetTotal,
      assetPending,
      assetOk,
      assetErr: 1,
      bytesLoaded,
      bytesTotal,
      bytesExhaustive,
    }
  }
}
