import { T2 } from '../types.js';
export type GridKey = `${string}${number}`;
export type NamedGrid = {
    [key in GridKey]: T2;
} & {
    width: number;
    height: number;
};
