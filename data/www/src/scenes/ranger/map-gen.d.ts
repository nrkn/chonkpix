import { TileMap, TileMapCell } from './types.js';
export declare const generateMap: (width: number, height: number) => {
    tileMap: TileMap;
    blocking: Set<TileMapCell>;
};
