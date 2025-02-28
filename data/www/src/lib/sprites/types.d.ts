import { T4 } from '../types.js';
export type TileSheet = {
    image: ImageData;
    rects: T4[];
    names: Map<string, number>;
};
export type AnimationFrame<T = number> = [duration: number, id: T];
