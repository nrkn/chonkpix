export declare const drawRotated: (src: ImageData, srcCx: number, srcCy: number, dest: ImageData, destCx: number, destCy: number, radians: number) => ImageData;
export declare const drawRotatedAndScaled: (src: ImageData, srcCx: number, srcCy: number, dest: ImageData, destCx: number, destCy: number, radians: number, srcScale?: number) => ImageData;
export declare const computeRotatedBoundingBox: (srcWidth: number, srcHeight: number, srcCx: number, srcCy: number, destCx: number, destCy: number, radians: number, destWidth: number, destHeight: number) => number[];
