import { T2 } from '../../lib/types.js';
export type BicycleUpdate = {
    location: T2;
    heading: number;
};
export type Bicycle = BicycleUpdate & {
    speed: number;
    steerAngle: number;
    wheelBase: number;
};
export declare const createBicycle: (location?: T2, heading?: number, speed?: number, steerAngle?: number, wheelBase?: number) => Bicycle;
export declare const frontWheel: (bicycle: Bicycle, center?: number, cosHead?: number, sinHead?: number) => T2;
export declare const backWheel: (bicycle: Bicycle, center?: number, cosHead?: number, sinHead?: number) => T2;
export declare const updateBicycle: (bicycle: Bicycle, delta: number) => BicycleUpdate;
