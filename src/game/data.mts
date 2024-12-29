export const TICK_RATE: number = 60;
export const TICK_DURATION_S: number = 1 / TICK_RATE;
export const TICK_DURATION_MS: number = 1000 / TICK_RATE;
export const CHUNK_WIDTH: number = 25;
export const CHUNK_HEIGHT: number = 29;
export const BORDER_WIDTH: number = 0.5;
export const VIEW_WIDTH: number = CHUNK_WIDTH + BORDER_WIDTH * 2;
export const MIN_VIEWPORT_HEIGHT: number = 32;
export const MAX_VIEWPORT_HEIGHT: number = 64;
// the final scale will be a multiple of this value (in css virtual pixels)
export const BASE_CELL_PX: number = 8;
// case/second
export const MAX_HORIZONTAL_SPEED = 7;
export const MAX_FALL_SPEED = 20;
export const MAX_JUMP_SPEED = 20;
export const JUMP_PEAK_HEIGHT = 4.7;
export const JUMP_PEAK_DURATION = 0.8;
export const GRAVITY = 2 * JUMP_PEAK_HEIGHT / (JUMP_PEAK_DURATION * JUMP_PEAK_DURATION);
export const JUMP_DY = 2 * JUMP_PEAK_HEIGHT / JUMP_PEAK_DURATION;
export const TAU = Math.PI * 2;
