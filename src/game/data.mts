export const TICK_RATE: number = 60;
export const TICK_DURATION_S: number = 1 / TICK_RATE;
export const TICK_DURATION_MS: number = 1000 / TICK_RATE;
export const CHUNK_WIDTH: number = 25;
export const CHUNK_HEIGHT: number = 29;
export const BORDER_WIDTH: number = 1;
export const VIEW_WIDTH: number = CHUNK_WIDTH + BORDER_WIDTH * 2;
export const MIN_VIEWPORT_HEIGHT: number = 32;
export const MAX_VIEWPORT_HEIGHT: number = 64;
// the final scale will be a multiple of this value (in css virtual pixels)
export const BASE_CELL_PX: number = 8;
// case/second
export const PLAYER_HITBOX_WIDTH: number = 1.15;
export const PLAYER_HITBOX_HEIGHT: number = 1.875;
export const JUMP_PEAK_HEIGHT = 4.3;
export const JUMP_PEAK_DURATION = 0.3;
export const GRAVITY = 2 * JUMP_PEAK_HEIGHT / (JUMP_PEAK_DURATION * JUMP_PEAK_DURATION);
export const JUMP_DY = 2 * JUMP_PEAK_HEIGHT / JUMP_PEAK_DURATION;
export const MAX_JUMP_SPEED = Math.max(JUMP_DY, 50);
export const MAX_HORIZONTAL_SPEED = 15;
export const MAX_FALL_SPEED = 50;
export const HEADBONK_TIME_WARP = 4;
export const COYOTTE_TIME = 0.05;

export const TAU = Math.PI * 2;

export const TORCH_HIT_RADIUS = 0.25;
export const TORCH_GRAB_RADIUS = 0.75;
export const TORCH_ABANDON_RADIUS = 1.25;
export const TORCH_MIN_POWER_DURATION = 0.2;
export const TORCH_MIN_POWER_ANGLE = TAU / 12;
export const TORCH_MIN_POWER_SPEED = JUMP_DY * 0.75;
export const TORCH_MAX_POWER_DURATION = 0.5;
export const TORCH_MAX_POWER_ANGLE = TAU / 6;
export const TORCH_MAX_POWER_SPEED = JUMP_DY * 2;
export const MAX_TORCHES_HELD = 5;
export const TORCH_GRAB_FRICTION = 0.8;

export const STABLE_SPEED_X = 1;
export const STABLE_SPEED_Y = 1;

export const SKY_COLOR = "#fff4d8";
