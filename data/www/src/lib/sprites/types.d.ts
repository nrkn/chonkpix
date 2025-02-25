import { T4 } from '../types.js';
export type Spritesheet = {
    image: ImageData;
    rects: T4[];
    names: Map<string, number>;
};
