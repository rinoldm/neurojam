import {AssetList} from "../assets.mjs";
import player from "./player.png";
import rourou from "./rourou.mp3";

export const GLOBAL_ASSET_LIST: AssetList = new AssetList();
export const BACKGROUND_MUSIC = GLOBAL_ASSET_LIST.registerAudio(rourou);
export const PLAYER = GLOBAL_ASSET_LIST.registerImage(player);
