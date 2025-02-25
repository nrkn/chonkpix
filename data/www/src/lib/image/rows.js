import { bresenhamLine } from './bresenham.js';
const createRow = (row, startCol, endCol, ...args) => [
    row, startCol, endCol, ...args
];
export const pointToRow = (x, y, ...args) => [y, x, x, ...args];
// nb - if the line is not mostly horizontal, you should just use bresenhamLine
// directly - this was more experimental than anything, though it is a lot 
// faster for its limited use case
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
// designed so that bresenham strokes can be used without gaps or overlaps.
// consider passing the bresenham lines in instead of the triangle points.
// could also be renamed and extended to fill any convex polygon.
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicm93cy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uL3NyYy9saWIvaW1hZ2Uvcm93cy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxPQUFPLEVBQUUsYUFBYSxFQUFFLE1BQU0sZ0JBQWdCLENBQUE7QUFJOUMsTUFBTSxTQUFTLEdBQUcsQ0FDaEIsR0FBVyxFQUFFLFFBQWdCLEVBQUUsTUFBYyxFQUFFLEdBQUcsSUFBVyxFQUNuRCxFQUFFLENBQUM7SUFDWCxHQUFHLEVBQUUsUUFBUSxFQUFFLE1BQU0sRUFBRSxHQUFHLElBQUk7Q0FDL0IsQ0FBQTtBQUVILE1BQU0sQ0FBQyxNQUFNLFVBQVUsR0FBRyxDQUN4QixDQUFTLEVBQUUsQ0FBUyxFQUFFLEdBQUcsSUFBVyxFQUMxQixFQUFFLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxHQUFHLElBQUksQ0FBQyxDQUFBO0FBRWpDLCtFQUErRTtBQUMvRSwyRUFBMkU7QUFDM0Usa0NBQWtDO0FBQ2xDLE1BQU0sQ0FBQyxNQUFNLFVBQVUsR0FBRyxDQUN4QixFQUFVLEVBQUUsRUFBVSxFQUFFLEVBQVUsRUFBRSxFQUFVLEVBQ2hDLEVBQUU7SUFDaEIsRUFBRSxJQUFJLENBQUMsQ0FBQTtJQUNQLEVBQUUsSUFBSSxDQUFDLENBQUE7SUFDUCxFQUFFLElBQUksQ0FBQyxDQUFBO0lBQ1AsRUFBRSxJQUFJLENBQUMsQ0FBQTtJQUVQLE1BQU0sS0FBSyxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxHQUFHLEVBQUUsQ0FBQyxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxHQUFHLEVBQUUsQ0FBQyxDQUFBO0lBRW5ELElBQUksS0FBSyxFQUFFLENBQUM7UUFDVixDQUFDLEVBQUUsRUFBRSxFQUFFLENBQUMsR0FBRyxDQUFDLEVBQUUsRUFBRSxFQUFFLENBQUMsQ0FBQztRQUFBLENBQUMsRUFBRSxFQUFFLEVBQUUsQ0FBQyxHQUFHLENBQUMsRUFBRSxFQUFFLEVBQUUsQ0FBQyxDQUFBO0lBQ3pDLENBQUM7SUFFRCxJQUFJLEVBQUUsR0FBRyxFQUFFLEVBQUUsQ0FBQztRQUNaLENBQUMsRUFBRSxFQUFFLEVBQUUsQ0FBQyxHQUFHLENBQUMsRUFBRSxFQUFFLEVBQUUsQ0FBQyxDQUFDO1FBQUEsQ0FBQyxFQUFFLEVBQUUsRUFBRSxDQUFDLEdBQUcsQ0FBQyxFQUFFLEVBQUUsRUFBRSxDQUFDLENBQUE7SUFDekMsQ0FBQztJQUVELE1BQU0sRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLENBQUE7SUFDbEIsTUFBTSxFQUFFLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLEdBQUcsRUFBRSxDQUFDLENBQUE7SUFFNUIsSUFBSSxHQUFHLEdBQUcsRUFBRSxHQUFHLENBQUMsQ0FBQTtJQUVoQixNQUFNLEtBQUssR0FBRyxFQUFFLEdBQUcsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFBO0lBRTlCLElBQUksQ0FBQyxHQUFHLEVBQUUsQ0FBQTtJQUVWLE1BQU0sSUFBSSxHQUFpQixFQUFFLENBQUE7SUFFN0IsSUFBSSxVQUFVLEdBQWtCLElBQUksQ0FBQTtJQUNwQyxJQUFJLFNBQVMsR0FBa0IsSUFBSSxDQUFBO0lBQ25DLElBQUksT0FBTyxHQUFrQixJQUFJLENBQUE7SUFFakMsS0FBSyxJQUFJLENBQUMsR0FBRyxFQUFFLEVBQUUsQ0FBQyxJQUFJLEVBQUUsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDO1FBQzlCLE1BQU0sRUFBRSxHQUFHLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUE7UUFDeEIsTUFBTSxFQUFFLEdBQUcsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQTtRQUV4QixpQ0FBaUM7UUFDakMsSUFBSSxVQUFVLEtBQUssSUFBSSxFQUFFLENBQUM7WUFDeEIsVUFBVSxHQUFHLEVBQUUsQ0FBQTtZQUNmLFNBQVMsR0FBRyxFQUFFLENBQUE7WUFDZCxPQUFPLEdBQUcsRUFBRSxDQUFBO1FBQ2QsQ0FBQzthQUFNLElBQUksVUFBVSxLQUFLLEVBQUUsRUFBRSxDQUFDO1lBQzdCLDhCQUE4QjtZQUM5QixJQUFJLEVBQUUsR0FBRyxTQUFVLEVBQUUsQ0FBQztnQkFDcEIsU0FBUyxHQUFHLEVBQUUsQ0FBQTtZQUNoQixDQUFDO1lBQ0QsSUFBSSxFQUFFLEdBQUcsT0FBUSxFQUFFLENBQUM7Z0JBQ2xCLE9BQU8sR0FBRyxFQUFFLENBQUE7WUFDZCxDQUFDO1FBQ0gsQ0FBQzthQUFNLENBQUM7WUFDTixnQ0FBZ0M7WUFDaEMsSUFBSSxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsVUFBVSxFQUFFLFNBQVUsRUFBRSxPQUFRLENBQUMsQ0FBQyxDQUFBO1lBRXRELGlCQUFpQjtZQUNqQixVQUFVLEdBQUcsRUFBRSxDQUFBO1lBQ2YsU0FBUyxHQUFHLEVBQUUsQ0FBQTtZQUNkLE9BQU8sR0FBRyxFQUFFLENBQUE7UUFDZCxDQUFDO1FBRUQsR0FBRyxJQUFJLEVBQUUsQ0FBQTtRQUVULElBQUksR0FBRyxHQUFHLENBQUMsRUFBRSxDQUFDO1lBQ1osQ0FBQyxJQUFJLEtBQUssQ0FBQTtZQUNWLEdBQUcsSUFBSSxFQUFFLENBQUE7UUFDWCxDQUFDO0lBQ0gsQ0FBQztJQUVELHVCQUF1QjtJQUN2QixJQUFJLFVBQVUsS0FBSyxJQUFJLEVBQUUsQ0FBQztRQUN4QixJQUFJLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxVQUFVLEVBQUUsU0FBVSxFQUFFLE9BQVEsQ0FBQyxDQUFDLENBQUE7SUFDeEQsQ0FBQztJQUVELE9BQU8sSUFBSSxDQUFBO0FBQ2IsQ0FBQyxDQUFBO0FBRUQsTUFBTSxDQUFDLE1BQU0sVUFBVSxHQUFHLENBQ3hCLENBQVMsRUFBRSxDQUFTLEVBQUUsQ0FBUyxFQUFFLENBQVMsRUFDNUIsRUFBRTtJQUNoQixNQUFNLElBQUksR0FBaUIsRUFBRSxDQUFBO0lBRTdCLEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQztRQUMzQixJQUFJLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUE7SUFDM0MsQ0FBQztJQUVELE9BQU8sSUFBSSxDQUFBO0FBQ2IsQ0FBQyxDQUFBO0FBRUQsMkVBQTJFO0FBQzNFLDBFQUEwRTtBQUMxRSxpRUFBaUU7QUFDakUsTUFBTSxDQUFDLE1BQU0sY0FBYyxHQUFHLENBQzVCLENBQUssRUFBRSxDQUFLLEVBQUUsQ0FBSyxFQUNuQixFQUFFO0lBQ0YsTUFBTSxLQUFLLEdBQUc7UUFDWixhQUFhLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ3JDLGFBQWEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDckMsYUFBYSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztLQUM3QixDQUFBO0lBRVYsTUFBTSxPQUFPLEdBQUcsSUFBSSxHQUFHLEVBQW9CLENBQUE7SUFFM0MsS0FBSyxNQUFNLElBQUksSUFBSSxLQUFLLEVBQUUsQ0FBQztRQUN6QixLQUFLLE1BQU0sQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLElBQUksSUFBSSxFQUFFLENBQUM7WUFDMUIsSUFBSSxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQztnQkFDcEIsT0FBTyxDQUFDLEdBQUcsQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUE7WUFDcEIsQ0FBQztZQUVELE9BQU8sQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFFLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFBO1FBQ3pCLENBQUM7SUFDSCxDQUFDO0lBRUQsTUFBTSxJQUFJLEdBQWlCLEVBQUUsQ0FBQTtJQUU3QixLQUFLLE1BQU0sQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLElBQUksT0FBTyxFQUFFLENBQUM7UUFDOUIsTUFBTSxHQUFHLEdBQUcsU0FBUyxDQUFRLENBQUMsRUFBRSxJQUFJLENBQUMsR0FBRyxDQUFDLEdBQUcsRUFBRSxDQUFDLEVBQUUsSUFBSSxDQUFDLEdBQUcsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxDQUFDLENBQUE7UUFFakUsSUFBSSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQTtJQUNoQixDQUFDO0lBRUQsT0FBTyxJQUFJLENBQUE7QUFDYixDQUFDLENBQUEiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBicmVzZW5oYW1MaW5lIH0gZnJvbSAnLi9icmVzZW5oYW0uanMnXHJcbmltcG9ydCB7IFJvdyB9IGZyb20gJy4vdHlwZXMuanMnXHJcbmltcG9ydCB7IFQyIH0gZnJvbSAnLi4vdHlwZXMuanMnXHJcblxyXG5jb25zdCBjcmVhdGVSb3cgPSA8QXJnPihcclxuICByb3c6IG51bWJlciwgc3RhcnRDb2w6IG51bWJlciwgZW5kQ29sOiBudW1iZXIsIC4uLmFyZ3M6IEFyZ1tdXHJcbik6IFJvdzxBcmc+ID0+IFtcclxuICAgIHJvdywgc3RhcnRDb2wsIGVuZENvbCwgLi4uYXJnc1xyXG4gIF1cclxuXHJcbmV4cG9ydCBjb25zdCBwb2ludFRvUm93ID0gPEFyZz4oXHJcbiAgeDogbnVtYmVyLCB5OiBudW1iZXIsIC4uLmFyZ3M6IEFyZ1tdXHJcbik6IFJvdzxBcmc+ID0+IFt5LCB4LCB4LCAuLi5hcmdzXVxyXG5cclxuLy8gbmIgLSBpZiB0aGUgbGluZSBpcyBub3QgbW9zdGx5IGhvcml6b250YWwsIHlvdSBzaG91bGQganVzdCB1c2UgYnJlc2VuaGFtTGluZVxyXG4vLyBkaXJlY3RseSAtIHRoaXMgd2FzIG1vcmUgZXhwZXJpbWVudGFsIHRoYW4gYW55dGhpbmcsIHRob3VnaCBpdCBpcyBhIGxvdCBcclxuLy8gZmFzdGVyIGZvciBpdHMgbGltaXRlZCB1c2UgY2FzZVxyXG5leHBvcnQgY29uc3QgbGluZVRvUm93cyA9IChcclxuICB4MDogbnVtYmVyLCB5MDogbnVtYmVyLCB4MTogbnVtYmVyLCB5MTogbnVtYmVyXHJcbik6IFJvdzxuZXZlcj5bXSA9PiB7XHJcbiAgeDAgfD0gMFxyXG4gIHkwIHw9IDBcclxuICB4MSB8PSAwXHJcbiAgeTEgfD0gMFxyXG5cclxuICBjb25zdCBzdGVlcCA9IE1hdGguYWJzKHkxIC0geTApID4gTWF0aC5hYnMoeDEgLSB4MClcclxuXHJcbiAgaWYgKHN0ZWVwKSB7XHJcbiAgICBbeDAsIHkwXSA9IFt5MCwgeDBdO1t4MSwgeTFdID0gW3kxLCB4MV1cclxuICB9XHJcblxyXG4gIGlmICh4MCA+IHgxKSB7XHJcbiAgICBbeDAsIHgxXSA9IFt4MSwgeDBdO1t5MCwgeTFdID0gW3kxLCB5MF1cclxuICB9XHJcblxyXG4gIGNvbnN0IGR4ID0geDEgLSB4MFxyXG4gIGNvbnN0IGR5ID0gTWF0aC5hYnMoeTEgLSB5MClcclxuXHJcbiAgbGV0IGVyciA9IGR4IC8gMlxyXG5cclxuICBjb25zdCB5U3RlcCA9IHkwIDwgeTEgPyAxIDogLTFcclxuXHJcbiAgbGV0IHkgPSB5MFxyXG5cclxuICBjb25zdCByb3dzOiBSb3c8bmV2ZXI+W10gPSBbXVxyXG5cclxuICBsZXQgY3VycmVudFJvdzogbnVtYmVyIHwgbnVsbCA9IG51bGxcclxuICBsZXQgc3BhblN0YXJ0OiBudW1iZXIgfCBudWxsID0gbnVsbFxyXG4gIGxldCBzcGFuRW5kOiBudW1iZXIgfCBudWxsID0gbnVsbFxyXG5cclxuICBmb3IgKGxldCB4ID0geDA7IHggPD0geDE7IHgrKykge1xyXG4gICAgY29uc3QgcHggPSBzdGVlcCA/IHkgOiB4XHJcbiAgICBjb25zdCBweSA9IHN0ZWVwID8geCA6IHlcclxuXHJcbiAgICAvLyBpZiBmaXJzdCBwaXhlbCwgc3RhcnQgbmV3IHNwYW5cclxuICAgIGlmIChjdXJyZW50Um93ID09PSBudWxsKSB7XHJcbiAgICAgIGN1cnJlbnRSb3cgPSBweVxyXG4gICAgICBzcGFuU3RhcnQgPSBweFxyXG4gICAgICBzcGFuRW5kID0gcHhcclxuICAgIH0gZWxzZSBpZiAoY3VycmVudFJvdyA9PT0gcHkpIHtcclxuICAgICAgLy8gaWYgY29uc2VjdXRpdmUsIGV4dGVuZCBzcGFuXHJcbiAgICAgIGlmIChweCA8IHNwYW5TdGFydCEpIHtcclxuICAgICAgICBzcGFuU3RhcnQgPSBweFxyXG4gICAgICB9XHJcbiAgICAgIGlmIChweCA+IHNwYW5FbmQhKSB7XHJcbiAgICAgICAgc3BhbkVuZCA9IHB4XHJcbiAgICAgIH1cclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIC8vIHJvdyBjaGFuZ2VkIC0gc3RvcmUgbGFzdCBzcGFuXHJcbiAgICAgIHJvd3MucHVzaChjcmVhdGVSb3coY3VycmVudFJvdywgc3BhblN0YXJ0ISwgc3BhbkVuZCEpKVxyXG5cclxuICAgICAgLy8gc3RhcnQgbmV3IHNwYW5cclxuICAgICAgY3VycmVudFJvdyA9IHB5XHJcbiAgICAgIHNwYW5TdGFydCA9IHB4XHJcbiAgICAgIHNwYW5FbmQgPSBweFxyXG4gICAgfVxyXG5cclxuICAgIGVyciAtPSBkeVxyXG5cclxuICAgIGlmIChlcnIgPCAwKSB7XHJcbiAgICAgIHkgKz0geVN0ZXBcclxuICAgICAgZXJyICs9IGR4XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICAvLyBtYXliZSBwdXNoIGxhc3Qgc3BhblxyXG4gIGlmIChjdXJyZW50Um93ICE9PSBudWxsKSB7XHJcbiAgICByb3dzLnB1c2goY3JlYXRlUm93KGN1cnJlbnRSb3csIHNwYW5TdGFydCEsIHNwYW5FbmQhKSlcclxuICB9XHJcblxyXG4gIHJldHVybiByb3dzXHJcbn1cclxuXHJcbmV4cG9ydCBjb25zdCByZWN0VG9Sb3dzID0gKFxyXG4gIHg6IG51bWJlciwgeTogbnVtYmVyLCB3OiBudW1iZXIsIGg6IG51bWJlclxyXG4pOiBSb3c8bmV2ZXI+W10gPT4ge1xyXG4gIGNvbnN0IHJvd3M6IFJvdzxuZXZlcj5bXSA9IFtdXHJcblxyXG4gIGZvciAobGV0IGogPSAwOyBqIDwgaDsgaisrKSB7XHJcbiAgICByb3dzLnB1c2goY3JlYXRlUm93KHkgKyBqLCB4LCB4ICsgdyAtIDEpKVxyXG4gIH1cclxuXHJcbiAgcmV0dXJuIHJvd3NcclxufVxyXG5cclxuLy8gZGVzaWduZWQgc28gdGhhdCBicmVzZW5oYW0gc3Ryb2tlcyBjYW4gYmUgdXNlZCB3aXRob3V0IGdhcHMgb3Igb3ZlcmxhcHMuXHJcbi8vIGNvbnNpZGVyIHBhc3NpbmcgdGhlIGJyZXNlbmhhbSBsaW5lcyBpbiBpbnN0ZWFkIG9mIHRoZSB0cmlhbmdsZSBwb2ludHMuXHJcbi8vIGNvdWxkIGFsc28gYmUgcmVuYW1lZCBhbmQgZXh0ZW5kZWQgdG8gZmlsbCBhbnkgY29udmV4IHBvbHlnb24uXHJcbmV4cG9ydCBjb25zdCB0cmlhbmdsZVRvUm93cyA9IChcclxuICBhOiBUMiwgYjogVDIsIGM6IFQyXHJcbikgPT4ge1xyXG4gIGNvbnN0IGVkZ2VzID0gW1xyXG4gICAgYnJlc2VuaGFtTGluZShhWzBdLCBhWzFdLCBiWzBdLCBiWzFdKSxcclxuICAgIGJyZXNlbmhhbUxpbmUoYlswXSwgYlsxXSwgY1swXSwgY1sxXSksXHJcbiAgICBicmVzZW5oYW1MaW5lKGNbMF0sIGNbMV0sIGFbMF0sIGFbMV0pXHJcbiAgXSBhcyBjb25zdFxyXG5cclxuICBjb25zdCBlZGdlTWFwID0gbmV3IE1hcDxudW1iZXIsIG51bWJlcltdPigpXHJcblxyXG4gIGZvciAoY29uc3QgZWRnZSBvZiBlZGdlcykge1xyXG4gICAgZm9yIChjb25zdCBbeCwgeV0gb2YgZWRnZSkge1xyXG4gICAgICBpZiAoIWVkZ2VNYXAuaGFzKHkpKSB7XHJcbiAgICAgICAgZWRnZU1hcC5zZXQoeSwgW10pXHJcbiAgICAgIH1cclxuXHJcbiAgICAgIGVkZ2VNYXAuZ2V0KHkpIS5wdXNoKHgpXHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICBjb25zdCByb3dzOiBSb3c8bmV2ZXI+W10gPSBbXVxyXG5cclxuICBmb3IgKGNvbnN0IFt5LCB4c10gb2YgZWRnZU1hcCkge1xyXG4gICAgY29uc3Qgcm93ID0gY3JlYXRlUm93PG5ldmVyPih5LCBNYXRoLm1pbiguLi54cyksIE1hdGgubWF4KC4uLnhzKSlcclxuXHJcbiAgICByb3dzLnB1c2gocm93KVxyXG4gIH1cclxuXHJcbiAgcmV0dXJuIHJvd3NcclxufVxyXG4iXX0=