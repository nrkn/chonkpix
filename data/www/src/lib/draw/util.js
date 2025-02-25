import { t2N, t3, t5 } from '../utils.js';
const createPt = t2N;
const emptyPoint = createPt();
const createTri = t3(emptyPoint);
const emptyTri = createTri();
const createPentagon = t5(emptyTri);
export const createPentagonTriangles = (cx, cy, radius, angleOffset = 0) => {
    const tris = createPentagon();
    //
    const vertices = polygonPoints(5, cx, cy, radius, angleOffset);
    for (let i = 0; i < 5; i++) {
        const nextIndex = (i + 1) % 5;
        tris[i] = [vertices[i], vertices[nextIndex], [cx, cy]];
    }
    //
    return tris;
};
export const polygonPoints = (sides, cx, cy, radius, radianOffset = 0) => {
    const points = [];
    for (let i = 0; i < sides; i++) {
        const angle = (2 * Math.PI * i) / sides + radianOffset;
        const x = cx + radius * Math.cos(angle);
        const y = cy + radius * Math.sin(angle);
        points.push([x, y]);
    }
    return points;
};
export const polygonTriangles = (sides, cx, cy, radius, radianOffset = 0) => {
    const points = polygonPoints(sides, cx, cy, radius, radianOffset);
    const triangles = [];
    for (let i = 0; i < sides; i++) {
        const nextIndex = (i + 1) % sides;
        triangles.push([points[i], points[nextIndex], [cx, cy]]);
    }
    return triangles;
};
//# sourceMappingURL=util.js.map