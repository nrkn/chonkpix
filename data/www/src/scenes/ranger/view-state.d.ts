import { Maybe } from '../../lib/types.js';
import { TileMap, ViewState } from './types.js';
export declare const viewState: (width: number, height: number, tileW: number, tileH: number) => {
    state: ViewState;
    invalidate: (w: number, h: number) => void;
};
export declare const setIndices: (tilemap: TileMap, indices: Maybe<number>[], x: number, y: number, w: number, h: number, elapsed: number, emptyId: number) => void;
export declare const clearIndicesForRow: (indices: Maybe<number>[], row: number, w: number) => void;
export declare const clearIndicesForCol: (indices: Maybe<number>[], col: number, w: number, h: number) => void;
export declare const scrollIndices: (src: Maybe<number>[], dest: Maybe<number>[], w: number, h: number, x: number, y: number) => void;
