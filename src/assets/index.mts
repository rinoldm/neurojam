import {AssetList} from "../assets.mjs";

import mus_main from "./mus_main.mp3";

import tls_dungeonPlainImage from "./tls_dungeon_plain.png";
import tls_dungeonPlainTileset from "./tls_dungeon_plain.xml";
import lvl_000 from "./lvl_000.tmx";
import lvl_001 from "./lvl_001.tmx";
import lvl_002 from "./lvl_002.tmx";
import lvl_prototype1 from "./lvl_prototype1.tmx";
import lvl_prototype2 from "./lvl_prototype2.tmx";
import lvl_prototype3 from "./lvl_prototype3.tmx";
import lvl_prototype4 from "./lvl_prototype4.tmx";

import spr_neuro_body from "./spr_neuro_body.png"
import spr_neuro_arms from "./spr_neuro_arms.png"

export const GLOBAL_ASSET_LIST: AssetList = new AssetList();
export const MUS_MAIN = GLOBAL_ASSET_LIST.registerAudio(mus_main);

export const TLS_DUNGEON_PLAIN_IMAGE = GLOBAL_ASSET_LIST.registerImage("tls_dungeon_plain.png", tls_dungeonPlainImage);
export const TLS_DUNGEON_PLAIN_TILESET = GLOBAL_ASSET_LIST.registerTileset("tls_dungeon_plain.xml", tls_dungeonPlainTileset);
export const LVL_000 = GLOBAL_ASSET_LIST.registerLevel(lvl_000);
export const LVL_001 = GLOBAL_ASSET_LIST.registerLevel(lvl_001);
export const LVL_002 = GLOBAL_ASSET_LIST.registerLevel(lvl_002);
export const LVL_PROTOTYPE1 = GLOBAL_ASSET_LIST.registerLevel(lvl_prototype1);
export const LVL_PROTOTYPE2 = GLOBAL_ASSET_LIST.registerLevel(lvl_prototype2);
export const LVL_PROTOTYPE3 = GLOBAL_ASSET_LIST.registerLevel(lvl_prototype3);
export const LVL_PROTOTYPE4 = GLOBAL_ASSET_LIST.registerLevel(lvl_prototype4);

export const SPR_NEURO_BODY = GLOBAL_ASSET_LIST.registerImage("spr_neuro_body.png", spr_neuro_body);
export const SPR_NEURO_ARMS = GLOBAL_ASSET_LIST.registerImage("spr_neuro_arms.png", spr_neuro_arms);

export const REGULAR_LEVELS = [
  LVL_001,
  LVL_002,
];
