import {AssetList} from "../assets.mjs";

import mus_main from "./mus_main.mp3";

import tls_dungeonPlainImage from "./tls_dungeon_plain.png";
import tls_dungeonPlainTileset from "./tls_dungeon_plain.xml";
import tls_pyramid_png from "./tls_pyramid.png";
import tls_pyramid_xml from "./tls_pyramid.xml";

import lvl_000 from "./lvl_000.tmx";
import lvl_001 from "./lvl_001.tmx";
import lvl_002 from "./lvl_002.tmx";
import lvl_003 from "./lvl_003.tmx";
import lvl_004 from "./lvl_004.tmx";

import lvl_prototype1 from "./lvl_prototype1.tmx";
import lvl_prototype2 from "./lvl_prototype2.tmx";
import lvl_prototype3 from "./lvl_prototype3.tmx";
import lvl_prototype4 from "./lvl_prototype4.tmx";

import spr_neuro_body from "./spr_neuro_body.png";
import spr_neuro_arms from "./spr_neuro_arms.png";

import img_back_000 from "./img_back_000.png";
import img_back from "./img_back.png";
import img_eyes from "./img_eyes.png";
import img_torch_on from "./img_torch_on.png";
import img_curse_eyes from "./img_curse_eyes.png";
import img_curse_body from "./img_curse_body.png";

export const GLOBAL_ASSET_LIST: AssetList = new AssetList();
export const MUS_MAIN = GLOBAL_ASSET_LIST.registerAudio(mus_main);

export const TLS_DUNGEON_PLAIN_IMAGE = GLOBAL_ASSET_LIST.registerImage("tls_dungeon_plain.png", tls_dungeonPlainImage);
export const TLS_DUNGEON_PLAIN_TILESET = GLOBAL_ASSET_LIST.registerTileset("tls_dungeon_plain.xml", tls_dungeonPlainTileset);
export const TLS_PYRAMID_PNG = GLOBAL_ASSET_LIST.registerImage("tls_pyramid.png", tls_pyramid_png);
export const TLS_PYRAMID = GLOBAL_ASSET_LIST.registerTileset("tls_pyramid.xml", tls_pyramid_xml);
export const LVL_000 = GLOBAL_ASSET_LIST.registerLevel(lvl_000);
export const LVL_001 = GLOBAL_ASSET_LIST.registerLevel(lvl_001);
export const LVL_002 = GLOBAL_ASSET_LIST.registerLevel(lvl_002);
export const LVL_003 = GLOBAL_ASSET_LIST.registerLevel(lvl_003);
export const LVL_004 = GLOBAL_ASSET_LIST.registerLevel(lvl_004);
export const LVL_PROTOTYPE1 = GLOBAL_ASSET_LIST.registerLevel(lvl_prototype1);
export const LVL_PROTOTYPE2 = GLOBAL_ASSET_LIST.registerLevel(lvl_prototype2);
export const LVL_PROTOTYPE3 = GLOBAL_ASSET_LIST.registerLevel(lvl_prototype3);
export const LVL_PROTOTYPE4 = GLOBAL_ASSET_LIST.registerLevel(lvl_prototype4);

export const SPR_NEURO_BODY = GLOBAL_ASSET_LIST.registerImage("spr_neuro_body.png", spr_neuro_body);
export const SPR_NEURO_ARMS = GLOBAL_ASSET_LIST.registerImage("spr_neuro_arms.png", spr_neuro_arms);

export const IMG_BACK_000 = GLOBAL_ASSET_LIST.registerImage("img_back_000.png", img_back_000);
export const IMG_BACK = GLOBAL_ASSET_LIST.registerImage("img_back.png", img_back);
export const IMG_EYES = GLOBAL_ASSET_LIST.registerImage("img_eyes.png", img_eyes);
export const IMG_TORCH_ON = GLOBAL_ASSET_LIST.registerImage("img_torch_on.png", img_torch_on);
export const IMG_CURSE_EYES = GLOBAL_ASSET_LIST.registerImage("img_curse_eyes.png", img_curse_eyes);
export const IMG_CURSE_BODY = GLOBAL_ASSET_LIST.registerImage("img_curse_body.png", img_curse_body);

export const REGULAR_LEVELS = [
  LVL_003,
  LVL_004,
];
