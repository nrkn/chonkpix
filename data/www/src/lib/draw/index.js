// draw list
import { bresenhamLine } from '../image/bresenham.js';
const drawCommands = [
    'point', 'line', 'rect', 'triangle', 'circle', 'ellipse', 'polygon', 'polyline'
];
const createRow = (row, startCol, endCol, ...args) => [
    row, startCol, endCol, ...args
];
export const pointToRow = (x, y, ...args) => [
    y, x, x, ...args
];
export const lineToRows = (x0, y0, x1, y1) => {
    x0 |= 0;
    y0 |= 0;
    x1 |= 0;
    y1 |= 0;
    const steep = Math.abs(y1 - y0) > Math.abs(x1 - x0);
    if (steep) {
        [x0, y0] = [y0, x0];
        [x1, y1] = [y1, x1];
    }
    if (x0 > x1) {
        [x0, x1] = [x1, x0];
        [y0, y1] = [y1, y0];
    }
    const dx = x1 - x0;
    const dy = Math.abs(y1 - y0);
    let err = dx / 2;
    const yStep = y0 < y1 ? 1 : -1;
    let y = y0;
    const rows = [];
    let currentRow = null;
    let spanStart = null;
    let spanEnd = null;
    for (let x = x0; x <= x1; x++) {
        const px = steep ? y : x;
        const py = steep ? x : y;
        // if first pixel, start new span
        if (currentRow === null) {
            currentRow = py;
            spanStart = px;
            spanEnd = px;
        }
        else if (currentRow === py) {
            // if consecutive, extend span
            if (px < spanStart) {
                spanStart = px;
            }
            if (px > spanEnd) {
                spanEnd = px;
            }
        }
        else {
            // row changed - store last span
            rows.push(createRow(currentRow, spanStart, spanEnd));
            // start new span
            currentRow = py;
            spanStart = px;
            spanEnd = px;
        }
        err -= dy;
        if (err < 0) {
            y += yStep;
            err += dx;
        }
    }
    // maybe push last span
    if (currentRow !== null) {
        rows.push(createRow(currentRow, spanStart, spanEnd));
    }
    return rows;
};
export const rectToRows = (x, y, w, h) => {
    const rows = [];
    for (let j = 0; j < h; j++) {
        rows.push(createRow(y + j, x, x + w - 1));
    }
    return rows;
};
const flatBottom = (rows, top, middle, bottom) => {
    // slopes
    const invslope1 = (middle[0] - top[0]) / (middle[1] - top[1]);
    const invslope2 = (bottom[0] - top[0]) / (bottom[1] - top[1]);
    const startY = Math.ceil(top[1]);
    const endY = Math.ceil(bottom[1]) - 1;
    for (let y = startY; y <= endY; y++) {
        // interpolate x along each edge
        const curx1 = top[0] + invslope1 * (y - top[1]);
        const curx2 = top[0] + invslope2 * (y - top[1]);
        const xStart = Math.ceil(Math.min(curx1, curx2));
        const xEnd = Math.floor(Math.max(curx1, curx2));
        rows.push(createRow(y, xStart, xEnd));
    }
};
const flatTop = (rows, top, middle, bottom) => {
    // slopes
    const invslope1 = (bottom[0] - top[0]) / (bottom[1] - top[1]);
    const invslope2 = (bottom[0] - middle[0]) / (bottom[1] - middle[1]);
    const startY = Math.ceil(top[1]);
    const endY = Math.ceil(bottom[1]) - 1;
    for (let y = startY; y <= endY; y++) {
        // interpolate x along each edge
        const curx1 = top[0] + invslope1 * (y - top[1]);
        const curx2 = middle[0] + invslope2 * (y - middle[1]);
        const xStart = Math.ceil(Math.min(curx1, curx2));
        const xEnd = Math.floor(Math.max(curx1, curx2));
        rows.push(createRow(y, xStart, xEnd));
    }
};
export const triangleToRows = (a, b, c) => {
    const edges = [
        bresenhamLine(a[0], a[1], b[0], b[1]),
        bresenhamLine(b[0], b[1], c[0], c[1]),
        bresenhamLine(c[0], c[1], a[0], a[1])
    ];
    const edgeMap = new Map();
    for (const edge of edges) {
        for (const [x, y] of edge) {
            if (!edgeMap.has(y)) {
                edgeMap.set(y, []);
            }
            edgeMap.get(y).push(x);
        }
    }
    const rows = [];
    for (const [y, xs] of edgeMap) {
        const row = createRow(y, Math.min(...xs), Math.max(...xs));
        rows.push(row);
    }
    return rows;
};
//# sourceMappingURL=index.js.map