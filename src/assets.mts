export type AssetType = "Image" | "Audio" | "Level";

export interface AudioAssetRef {
  type: "Audio";
  url: any;
}

export interface ImageAssetRef {
  type: "Image";
  url: any;
}

export interface LevelAssetRef {
  type: "Level";
  url: any;
}

export type AssetRef = AudioAssetRef | ImageAssetRef | LevelAssetRef;

export class AssetList {
  #audio: Set<AudioAssetRef>;
  #image: Set<ImageAssetRef>;
  #level: Set<LevelAssetRef>;

  constructor() {
    this.#audio = new Set();
    this.#image = new Set();
    this.#level = new Set();
  }

  public audioIter(): IterableIterator<AssetRef> {
    return this.#audio[Symbol.iterator]();
  }

  public imageIter(): IterableIterator<AssetRef> {
    return this.#image[Symbol.iterator]();
  }

  public levelIter(): IterableIterator<AssetRef> {
    return this.#level[Symbol.iterator]();
  }

  public registerAudio(url: any): AudioAssetRef {
    console.log(typeof url);
    const ref: AssetRef = {type: "Audio", url};
    this.#audio.add(ref);
    return ref;
  }

  public registerImage(url: any): ImageAssetRef {
    const ref: AssetRef = {type: "Image", url};
    this.#image.add(ref);
    return ref;
  }

  public registerLevel(url: any): LevelAssetRef {
    const ref: AssetRef = {type: "Level", url};
    this.#level.add(ref);
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
  #audio: Map<AssetRef, AssetTask<HTMLAudioElement>>;
  #image: Map<AssetRef, AssetTask<HTMLImageElement>>;

  private constructor(list: AssetList) {
    this.#audio = new Map();
    this.#image = new Map();
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

  public progress(): LoadProgress {
    let assetTotal = 0;
    let assetOk = 0;
    let assetPending = 0;
    let bytesExhaustive = true;
    let bytesLoaded = 0
    let bytesTotal = 0

    const tasks = [...this.#audio.values(), ...this.#image.values()];

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
