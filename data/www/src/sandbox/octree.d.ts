import { T2, T3, T8 } from '../lib/types.js';
export declare const boxOcts: (box: T2<T3>) => T8<T2<T3>>;
export type Octant = {
    children: T8<Octant>;
    aabb: T2<T3>;
    isLeaf: boolean;
    solid: boolean;
    width: number;
};
export declare const createOct: (box: T2<T3>) => Octant;
export declare const octSubdivide: (octant: Octant) => void;
export declare const octInsert: (octant: Octant, point: T3, width: number) => void;
export type OctIntersects = (box: T2<T3>) => boolean;
export declare const octIntersects: (root: Octant, isInter: OctIntersects) => boolean;
export declare const boxContainsP3: (box: T2<T3>, p3: T3) => boolean;
