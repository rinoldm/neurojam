import {AssetList} from "../assets.mjs";
import player from "./player.png";
import rourou from "./rourou.mp3";
import level000 from "./level000.tmx";
import dungeonPlainImage from "./dungeon_plain.png";
import dungeonPlainTileset from "./dungeon_plain.xml";
import spr_neuro_body from "./spr_neuro_body.png"

export const GLOBAL_ASSET_LIST: AssetList = new AssetList();
export const BACKGROUND_MUSIC = GLOBAL_ASSET_LIST.registerAudio(rourou);
export const PLAYER = GLOBAL_ASSET_LIST.registerImage("player.png", player);

export const LEVEL000 = GLOBAL_ASSET_LIST.registerLevel(level000);
export const DUNGEON_PLAIN_IMAGE = GLOBAL_ASSET_LIST.registerImage("dungeon_plain.png", dungeonPlainImage);
export const DUNGEON_PLAIN_TILESET = GLOBAL_ASSET_LIST.registerTileset("dungeon_plain.xml", dungeonPlainTileset);

export const SPR_NEURO_BODY = GLOBAL_ASSET_LIST.registerImage("spr_neuro_body.png", spr_neuro_body);