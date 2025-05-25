import { T4 } from '../types.js';
export declare const pointResize: (src: ImageData, dest: ImageData, srcRect?: T4, destRect?: T4) => ImageData;
export declare const bilinearResize: (src: ImageData, dest: ImageData, srcRect?: [number, number, number, number], destRect?: [number, number, number, number]) => ImageData;
