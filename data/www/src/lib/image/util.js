export const clampTransfer = (srcW, srcH, destW, destH, transfer) => {
    let [sx, sy, sw, sh, dx, dy] = transfer;
    if (sx < 0) {
        sw += sx;
        dx -= sx;
        sx = 0;
    }
    if (sy < 0) {
        sh += sy;
        dy -= sy;
        sy = 0;
    }
    if (sx + sw > srcW) {
        sw = srcW - sx;
    }
    if (sy + sh > srcH) {
        sh = srcH - sy;
    }
    if (dx < 0) {
        sw += dx;
        sx -= dx;
        dx = 0;
    }
    if (dy < 0) {
        sh += dy;
        sy -= dy;
        dy = 0;
    }
    if (dx + sw > destW) {
        sw = destW - dx;
    }
    if (dy + sh > destH) {
        sh = destH - dy;
    }
    if (sw < 0)
        sw = 0;
    if (sh < 0)
        sh = 0;
    return [sx, sy, sw, sh, dx, dy];
};
export const clampRect = (srcW, srcH, rect) => {
    let [x, y, w, h] = rect;
    if (x < 0) {
        w += x;
        x = 0;
    }
    if (y < 0) {
        h += y;
        y = 0;
    }
    if (x + w > srcW) {
        w = srcW - x;
    }
    if (y + h > srcH) {
        h = srcH - y;
    }
    if (w < 0)
        w = 0;
    if (h < 0)
        h = 0;
    return [x, y, w, h];
};
export const clampRows = (rows, w, h) => rows.reduce((acc, [y, x0, x1, ...args]) => {
    if (y < 0 || y >= h)
        return acc;
    let x0c = Math.max(x0, 0);
    let x1c = Math.min(x1, w);
    if (x0c > x1c)
        return acc;
    acc.push([y, x0c, x1c, ...args]);
    return acc;
}, []);
export const clampRow = (row, w, h) => {
    const [y, x0, x1, ...args] = row;
    if (y < 0 || y >= h)
        return null;
    let x0c = Math.max(x0, 0);
    let x1c = Math.min(x1, w);
    if (x0c > x1c)
        return null;
    return [y, x0c, x1c, ...args];
};
export const pointsToIndices = (w, h, channels) => (points) => points.reduce((acc, [x, y]) => {
    if (x < 0 || x >= w || y < 0 || y >= h)
        return acc;
    acc.push((y * w + x) * channels);
    return acc;
}, []);
export const pset = (image, x, y, color) => {
    const view = new Uint32Array(image.data.buffer);
    const index = y * image.width + x;
    view[index] = color;
};
export const pget = (image, x, y) => {
    const view = new Uint32Array(image.data.buffer);
    const index = y * image.width + x;
    return view[index];
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXRpbC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uL3NyYy9saWIvaW1hZ2UvdXRpbC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFHQSxNQUFNLENBQUMsTUFBTSxhQUFhLEdBQUcsQ0FDM0IsSUFBWSxFQUFFLElBQVksRUFBRSxLQUFhLEVBQUUsS0FBYSxFQUN4RCxRQUFZLEVBQ1IsRUFBRTtJQUNOLElBQUksQ0FBQyxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsQ0FBQyxHQUFHLFFBQVEsQ0FBQTtJQUV2QyxJQUFJLEVBQUUsR0FBRyxDQUFDLEVBQUUsQ0FBQztRQUNYLEVBQUUsSUFBSSxFQUFFLENBQUE7UUFDUixFQUFFLElBQUksRUFBRSxDQUFBO1FBQ1IsRUFBRSxHQUFHLENBQUMsQ0FBQTtJQUNSLENBQUM7SUFFRCxJQUFJLEVBQUUsR0FBRyxDQUFDLEVBQUUsQ0FBQztRQUNYLEVBQUUsSUFBSSxFQUFFLENBQUE7UUFDUixFQUFFLElBQUksRUFBRSxDQUFBO1FBQ1IsRUFBRSxHQUFHLENBQUMsQ0FBQTtJQUNSLENBQUM7SUFFRCxJQUFJLEVBQUUsR0FBRyxFQUFFLEdBQUcsSUFBSSxFQUFFLENBQUM7UUFDbkIsRUFBRSxHQUFHLElBQUksR0FBRyxFQUFFLENBQUE7SUFDaEIsQ0FBQztJQUVELElBQUksRUFBRSxHQUFHLEVBQUUsR0FBRyxJQUFJLEVBQUUsQ0FBQztRQUNuQixFQUFFLEdBQUcsSUFBSSxHQUFHLEVBQUUsQ0FBQTtJQUNoQixDQUFDO0lBRUQsSUFBSSxFQUFFLEdBQUcsQ0FBQyxFQUFFLENBQUM7UUFDWCxFQUFFLElBQUksRUFBRSxDQUFBO1FBQ1IsRUFBRSxJQUFJLEVBQUUsQ0FBQTtRQUNSLEVBQUUsR0FBRyxDQUFDLENBQUE7SUFDUixDQUFDO0lBRUQsSUFBSSxFQUFFLEdBQUcsQ0FBQyxFQUFFLENBQUM7UUFDWCxFQUFFLElBQUksRUFB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SyxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQTtJQUMvQyxNQUFNLEtBQUssR0FBRyxDQUFDLEdBQUcsS0FBSyxDQUFDLEtBQUssR0FBRyxDQUFDLENBQUE7SUFFakMsSUFBSSxDQUFDLEtBQUssQ0FBQyxHQUFHLEtBQUssQ0FBQTtBQUNyQixDQUFDLENBQUE7QUFFRCxNQUFNLENBQUMsTUFBTSxJQUFJLEdBQUcsQ0FBQyxLQUFnQixFQUFFLENBQVMsRUFBRSxDQUFTLEVBQUUsRUFBRTtJQUM3RCxNQUFNLElBQUksR0FBRyxJQUFJLFdBQVcsQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFBO0lBQy9DLE1BQU0sS0FBSyxHQUFHLENBQUMsR0FBRyxLQUFLLENBQUMsS0FBSyxHQUFHLENBQUMsQ0FBQTtJQUVqQyxPQUFPLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQTtBQUNwQixDQUFDLENBQUEiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBSb3cgfSBmcm9tICcuL3R5cGVzLmpzJ1xyXG5pbXBvcnQgeyBUMiwgVDQsIFQ2IH0gZnJvbSAnLi4vdHlwZXMuanMnXHJcblxyXG5leHBvcnQgY29uc3QgY2xhbXBUcmFuc2ZlciA9IChcclxuICBzcmNXOiBudW1iZXIsIHNyY0g6IG51bWJlciwgZGVzdFc6IG51bWJlciwgZGVzdEg6IG51bWJlcixcclxuICB0cmFuc2ZlcjogVDZcclxuKTogVDYgPT4ge1xyXG4gIGxldCBbc3gsIHN5LCBzdywgc2gsIGR4LCBkeV0gPSB0cmFuc2ZlclxyXG5cclxuICBpZiAoc3ggPCAwKSB7XHJcbiAgICBzdyArPSBzeFxyXG4gICAgZHggLT0gc3hcclxuICAgIHN4ID0gMFxyXG4gIH1cclxuXHJcbiAgaWYgKHN5IDwgMCkge1xyXG4gICAgc2ggKz0gc3lcclxuICAgIGR5IC09IHN5XHJcbiAgICBzeSA9IDBcclxuICB9XHJcblxyXG4gIGlmIChzeCArIHN3ID4gc3JjVykge1xyXG4gICAgc3cgPSBzcmNXIC0gc3hcclxuICB9XHJcblxyXG4gIGlmIChzeSArIHNoID4gc3JjSCkge1xyXG4gICAgc2ggPSBzcmNIIC0gc3lcclxuICB9XHJcblxyXG4gIGlmIChkeCA8IDApIHtcclxuICAgIHN3ICs9IGR4XHJcbiAgICBzeCAtPSBkeFxyXG4gICAgZHggPSAwXHJcbiAgfVxyXG5cclxuICBpZiAoZHkgPCAwKSB7XHJcbiAgICBzaCArPSBkeVxyXG4gICAgc3kgLT0gZHlcclxuICAgIGR5ID0gMFxyXG4gIH1cclxuXHJcbiAgaWYgKGR4ICsgc3cgPiBkZXN0Vykge1xyXG4gICAgc3cgPSBkZXN0VyAtIGR4XHJcbiAgfVxyXG5cclxuICBpZiAoZHkgKyBzaCA+IGRlc3RIKSB7XHJcbiAgICBzaCA9IGRlc3RIIC0gZHlcclxuICB9XHJcblxyXG4gIGlmIChzdyA8IDApIHN3ID0gMFxyXG4gIGlmIChzaCA8IDApIHNoID0gMFxyXG5cclxuICByZXR1cm4gW3N4LCBzeSwgc3csIHNoLCBkeCwgZHldXHJcbn1cclxuXHJcbmV4cG9ydCBjb25zdCBjbGFtcFJlY3QgPSAoc3JjVzogbnVtYmVyLCBzcmNIOiBudW1iZXIsIHJlY3Q6IFQ0KTogVDQgPT4ge1xyXG4gIGxldCBbeCwgeSwgdywgaF0gPSByZWN0XHJcblxyXG4gIGlmICh4IDwgMCkge1xyXG4gICAgdyArPSB4XHJcbiAgICB4ID0gMFxyXG4gIH1cclxuXHJcbiAgaWYgKHkgPCAwKSB7XHJcbiAgICBoICs9IHlcclxuICAgIHkgPSAwXHJcbiAgfVxyXG5cclxuICBpZiAoeCArIHcgPiBzcmNXKSB7XHJcbiAgICB3ID0gc3JjVyAtIHhcclxuICB9XHJcblxyXG4gIGlmICh5ICsgaCA+IHNyY0gpIHtcclxuICAgIGggPSBzcmNIIC0geVxyXG4gIH1cclxuXHJcbiAgaWYgKHcgPCAwKSB3ID0gMFxyXG4gIGlmIChoIDwgMCkgaCA9IDBcclxuXHJcbiAgcmV0dXJuIFt4LCB5LCB3LCBoXVxyXG59XHJcblxyXG5leHBvcnQgY29uc3QgY2xhbXBSb3dzID0gPEFyZz4ocm93czogUm93PEFyZz5bXSwgdzogbnVtYmVyLCBoOiBudW1iZXIpID0+XHJcbiAgcm93cy5yZWR1Y2UoKGFjYywgW3ksIHgwLCB4MSwgLi4uYXJnc10pID0+IHtcclxuICAgIGlmICh5IDwgMCB8fCB5ID49IGgpIHJldHVybiBhY2NcclxuXHJcbiAgICBsZXQgeDBjID0gTWF0aC5tYXgoeDAsIDApXHJcbiAgICBsZXQgeDFjID0gTWF0aC5taW4oeDEsIHcpXHJcblxyXG4gICAgaWYgKHgwYyA+IHgxYykgcmV0dXJuIGFjY1xyXG5cclxuICAgIGFjYy5wdXNoKFt5LCB4MGMsIHgxYywgLi4uYXJnc10pXHJcblxyXG4gICAgcmV0dXJuIGFjY1xyXG4gIH0sIFtdIGFzIFJvdzxBcmc+W10pXHJcblxyXG5leHBvcnQgY29uc3QgY2xhbXBSb3cgPSA8QXJnPihyb3c6IFJvdzxBcmc+LCB3OiBudW1iZXIsIGg6IG51bWJlcikgPT4ge1xyXG4gIGNvbnN0IFt5LCB4MCwgeDEsIC4uLmFyZ3NdID0gcm93XHJcblxyXG4gIGlmICh5IDwgMCB8fCB5ID49IGgpIHJldHVybiBudWxsXHJcblxyXG4gIGxldCB4MGMgPSBNYXRoLm1heCh4MCwgMClcclxuICBsZXQgeDFjID0gTWF0aC5taW4oeDEsIHcpXHJcblxyXG4gIGlmICh4MGMgPiB4MWMpIHJldHVybiBudWxsXHJcblxyXG4gIHJldHVybiBbeSwgeDBjLCB4MWMsIC4uLmFyZ3NdIGFzIFJvdzxBcmc+XHJcbn1cclxuXHJcblxyXG5leHBvcnQgY29uc3QgcG9pbnRzVG9JbmRpY2VzID0gKHc6IG51bWJlciwgaDogbnVtYmVyLCBjaGFubmVsczogbnVtYmVyKSA9PlxyXG4gIChwb2ludHM6IFQyW10pID0+XHJcbiAgICBwb2ludHMucmVkdWNlKChhY2MsIFt4LCB5XSkgPT4ge1xyXG4gICAgICBpZiAoeCA8IDAgfHwgeCA+PSB3IHx8IHkgPCAwIHx8IHkgPj0gaCkgcmV0dXJuIGFjY1xyXG5cclxuICAgICAgYWNjLnB1c2goKHkgKiB3ICsgeCkgKiBjaGFubmVscylcclxuXHJcbiAgICAgIHJldHVybiBhY2NcclxuICAgIH0sIFtdIGFzIG51bWJlcltdKVxyXG5cclxuXHJcbmV4cG9ydCBjb25zdCBwc2V0ID0gKFxyXG4gIGltYWdlOiBJbWFnZURhdGEsIHg6IG51bWJlciwgeTogbnVtYmVyLCBjb2xvcjogbnVtYmVyXHJcbikgPT4ge1xyXG4gIGNvbnN0IHZpZXcgPSBuZXcgVWludDMyQXJyYXkoaW1hZ2UuZGF0YS5idWZmZXIpXHJcbiAgY29uc3QgaW5kZXggPSB5ICogaW1hZ2Uud2lkdGggKyB4XHJcblxyXG4gIHZpZXdbaW5kZXhdID0gY29sb3JcclxufVxyXG5cclxuZXhwb3J0IGNvbnN0IHBnZXQgPSAoaW1hZ2U6IEltYWdlRGF0YSwgeDogbnVtYmVyLCB5OiBudW1iZXIpID0+IHtcclxuICBjb25zdCB2aWV3ID0gbmV3IFVpbnQzMkFycmF5KGltYWdlLmRhdGEuYnVmZmVyKVxyXG4gIGNvbnN0IGluZGV4ID0geSAqIGltYWdlLndpZHRoICsgeFxyXG5cclxuICByZXR1cm4gdmlld1tpbmRleF1cclxufVxyXG4iXX0=