import { clampRect, clampRows } from './util.js';
export const fill = (dest, color, rect = [0, 0, dest.width, dest.height]) => {
    const [x, y, w, h] = clampRect(dest.width, dest.height, rect);
    const row = new Uint32Array(w).fill(color);
    const data = new Uint32Array(dest.data.buffer);
    for (let j = 0; j < h; j++) {
        const rowIndex = (y + j) * dest.width + x;
        data.set(row, rowIndex);
    }
    return dest;
};
export const fillIndices = (src, dest, color) => {
    const data = new Uint32Array(dest.data.buffer);
    for (let i = 0; i < src.length; i++) {
        data[src[i]] = color;
    }
    return dest;
};
export const fillRows = (src, dest, color) => {
    src = clampRows(src, dest.width, dest.height);
    const data = new Uint32Array(dest.data.buffer);
    for (let i = 0; i < src.length; i++) {
        const [y, x0, x1] = src[i];
        const w = x1 - x0 + 1;
        const row = new Uint32Array(w).fill(color);
        const rowIndex = y * dest.width + x0;
        data.set(row, rowIndex);
    }
    return dest;
};
export const fillRow = (dest, color, y, x0 = 0, x1 = dest.width - 1) => {
    if (y < 0 || y >= dest.height) {
        return;
    }
    if (x0 > x1) {
        [x0, x1] = [x1, x0];
    }
    x0 = x0 < 0 ? 0 : x0;
    x1 = x1 >= dest.width ? dest.width - 1 : x1;
    const w = x1 - x0 + 1;
    const pixels = new Uint32Array(w).fill(color);
    const data = new Uint32Array(dest.data.buffer);
    data.set(pixels, y * dest.width + x0);
    return dest;
};
export const fillCol = (dest, color, x, y0 = 0, y1 = dest.height - 1) => {
    if (x < 0 || x >= dest.width) {
        return;
    }
    if (y0 > y1) {
        [y0, y1] = [y1, y0];
    }
    y0 = y0 < 0 ? 0 : y0;
    y1 = y1 >= dest.height ? dest.height - 1 : y1;
    const h = y1 - y0 + 1;
    const data = new Uint32Array(dest.data.buffer);
    let index = y0 * dest.width + x;
    for (let i = 0; i < h; i++) {
        data[index] = color;
        index += dest.width;
    }
    return dest;
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZmlsbC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uL3NyYy9saWIvaW1hZ2UvZmlsbC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFFQSxPQUFPLEVBQUUsU0FBUyxFQUFFLFNBQVMsRUFBRSxNQUFNLFdBQVcsQ0FBQTtBQUVoRCxNQUFNLENBQUMsTUFBTSxJQUFJLEdBQUcsQ0FDbEIsSUFBZSxFQUFFLEtBQWEsRUFBRSxPQUFXLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxJQUFJLENBQUMsS0FBSyxFQUFFLElBQUksQ0FBQyxNQUFNLENBQUMsRUFDMUUsRUFBRTtJQUNGLE1BQU0sQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsR0FBRyxTQUFTLENBQUMsSUFBSSxDQUFDLEtBQUssRUFBRSxJQUFJLENBQUMsTUFBTSxFQUFFLElBQUksQ0FBQyxDQUFBO0lBRTdELE1BQU0sR0FBRyxHQUFHLElBQUksV0FBVyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQTtJQUMxQyxNQUFNLElBQUksR0FBRyxJQUFJLFdBQVcsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFBO0lBRTlDLEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQztRQUMzQixNQUFNLFFBQVEsR0FBRyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsS0FBSyxHQUFHLENBQUMsQ0FBQTtRQUN6QyxJQUFJLENBQUMsR0FBRyxDQUFDLEdBQUcsRUFBRSxRQUFRLENBQUMsQ0FBQTtJQUN6QixDQUFDO0lBRUQsT0FBTyxJQUFJLENBQUE7QUFDYixDQUFDLENBQUE7QUFFRCxNQUFNLENBQUMsTUFBTSxXQUFXLEdBQUcsQ0FDekIsR0FBYSxFQUFFLElBQWUsRUFBRSxLQUFhLEVBQzdDLEVBQUU7SUFDRixNQUFNLElBQUksR0FBRyxJQUFJLFdBQVcsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFBO0lBRTlDLEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxHQUFHLENBQUMsTUFBTSxFQUFFLENBQUMsRUFBRSxFQUFHLENBQUM7UUFDckMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLEtBQUssQ0FBQTtJQUN0QixDQUFDO0lBRUQsT0FBTyxJQUFJLENBQUE7QUFDYixDQUFDLENBQUE7QUFFRCxNQUFNLENBQUMsTUFBTSxRQUFRLEdBQUcsQ0FDdEIsR0FBZSxFQUFFLElBQWUsRUFBRSxLQUFhLEVBQy9DLEVBQUU7SUFDRixHQUFHLEdBQUcsU0FBUyxDQUFDLEdBQUcsRUFBRSxJQUFJLENBQUMsS0FBSyxFQUFFLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQTtJQUU3QyxNQUFNLElBQUksR0FBRyxJQUFJLFdBQVcsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFBO0lBRTlDLEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxHQUFHLENBQUMsTUFBTSxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUM7UUFDcEMsTUFBTSxDQUFDLENBQUMsRUFBRSxFQUFFLEVBQUUsRUFBRSxDQUFDLEdBQUcsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFBO1FBQzFCLE1BQU0sQ0FBQyxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsQ0FBQyxDQUFBO1FBQ3JCLE1BQU0sR0FBRyxHQUFHLElBQUksV0FBVyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQTtRQUMxQyxNQUFNLFFBQVEsR0FBRyxDQUFDLEdBQUcsSUFBSSxDQUFDLEtBQUssR0FBRyxFQUFFLENBQUE7UUFFcEMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxHQUFHLEVBQUUsUUFBUSxDQUFDLENBQUE7SUFDekIsQ0FBQztJ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cy5qcydcclxuaW1wb3J0IHsgVDQgfSBmcm9tICcuLi90eXBlcy5qcydcclxuaW1wb3J0IHsgY2xhbXBSZWN0LCBjbGFtcFJvd3MgfSBmcm9tICcuL3V0aWwuanMnXHJcblxyXG5leHBvcnQgY29uc3QgZmlsbCA9IChcclxuICBkZXN0OiBJbWFnZURhdGEsIGNvbG9yOiBudW1iZXIsIHJlY3Q6IFQ0ID0gWzAsIDAsIGRlc3Qud2lkdGgsIGRlc3QuaGVpZ2h0XVxyXG4pID0+IHtcclxuICBjb25zdCBbeCwgeSwgdywgaF0gPSBjbGFtcFJlY3QoZGVzdC53aWR0aCwgZGVzdC5oZWlnaHQsIHJlY3QpXHJcblxyXG4gIGNvbnN0IHJvdyA9IG5ldyBVaW50MzJBcnJheSh3KS5maWxsKGNvbG9yKVxyXG4gIGNvbnN0IGRhdGEgPSBuZXcgVWludDMyQXJyYXkoZGVzdC5kYXRhLmJ1ZmZlcilcclxuXHJcbiAgZm9yIChsZXQgaiA9IDA7IGogPCBoOyBqKyspIHtcclxuICAgIGNvbnN0IHJvd0luZGV4ID0gKHkgKyBqKSAqIGRlc3Qud2lkdGggKyB4XHJcbiAgICBkYXRhLnNldChyb3csIHJvd0luZGV4KVxyXG4gIH1cclxuXHJcbiAgcmV0dXJuIGRlc3RcclxufVxyXG5cclxuZXhwb3J0IGNvbnN0IGZpbGxJbmRpY2VzID0gKCBcclxuICBzcmM6IG51bWJlcltdLCBkZXN0OiBJbWFnZURhdGEsIGNvbG9yOiBudW1iZXIgXHJcbikgPT4ge1xyXG4gIGNvbnN0IGRhdGEgPSBuZXcgVWludDMyQXJyYXkoZGVzdC5kYXRhLmJ1ZmZlcilcclxuXHJcbiAgZm9yKCBsZXQgaSA9IDA7IGkgPCBzcmMubGVuZ3RoOyBpKysgKSB7XHJcbiAgICBkYXRhW3NyY1tpXV0gPSBjb2xvclxyXG4gIH1cclxuXHJcbiAgcmV0dXJuIGRlc3RcclxufVxyXG5cclxuZXhwb3J0IGNvbnN0IGZpbGxSb3dzID0gKFxyXG4gIHNyYzogUm93PGFueT5bXSwgZGVzdDogSW1hZ2VEYXRhLCBjb2xvcjogbnVtYmVyXHJcbikgPT4ge1xyXG4gIHNyYyA9IGNsYW1wUm93cyhzcmMsIGRlc3Qud2lkdGgsIGRlc3QuaGVpZ2h0KVxyXG5cclxuICBjb25zdCBkYXRhID0gbmV3IFVpbnQzMkFycmF5KGRlc3QuZGF0YS5idWZmZXIpXHJcblxyXG4gIGZvciAobGV0IGkgPSAwOyBpIDwgc3JjLmxlbmd0aDsgaSsrKSB7XHJcbiAgICBjb25zdCBbeSwgeDAsIHgxXSA9IHNyY1tpXVxyXG4gICAgY29uc3QgdyA9IHgxIC0geDAgKyAxXHJcbiAgICBjb25zdCByb3cgPSBuZXcgVWludDMyQXJyYXkodykuZmlsbChjb2xvcilcclxuICAgIGNvbnN0IHJvd0luZGV4ID0geSAqIGRlc3Qud2lkdGggKyB4MFxyXG5cclxuICAgIGRhdGEuc2V0KHJvdywgcm93SW5kZXgpXHJcbiAgfVxyXG5cclxuICByZXR1cm4gZGVzdFxyXG59XHJcblxyXG5leHBvcnQgY29uc3QgZmlsbFJvdyA9ICggXHJcbiAgZGVzdDogSW1hZ2VEYXRhLCBjb2xvcjogbnVtYmVyLCBcclxuICB5OiBudW1iZXIsIHgwID0gMCwgeDEgPSBkZXN0LndpZHRoIC0gMVxyXG4pID0+IHtcclxuICBpZiggeSA8IDAgfHwgeSA+PSBkZXN0LmhlaWdodCApIHtcclxuICAgIHJldHVyblxyXG4gIH1cclxuXHJcbiAgaWYoIHgwID4geDEgKXtcclxuICAgIFsgeDAsIHgxIF0gPSBbIHgxLCB4MCBdXHJcbiAgfVxyXG5cclxuICB4MCA9IHgwIDwgMCA/IDAgOiB4MFxyXG4gIHgxID0geDEgPj0gZGVzdC53aWR0aCA/IGRlc3Qud2lkdGggLSAxIDogeDFcclxuXHJcbiAgY29uc3QgdyA9IHgxIC0geDAgKyAxXHJcbiAgY29uc3QgcGl4ZWxzID0gbmV3IFVpbnQzMkFycmF5KHcpLmZpbGwoY29sb3IpXHJcbiAgY29uc3QgZGF0YSA9IG5ldyBVaW50MzJBcnJheShkZXN0LmRhdGEuYnVmZmVyKVxyXG5cclxuICBkYXRhLnNldChwaXhlbHMsIHkgKiBkZXN0LndpZHRoICsgeDApXHJcblxyXG4gIHJldHVybiBkZXN0XHJcbn1cclxuXHJcbmV4cG9ydCBjb25zdCBmaWxsQ29sID0gKFxyXG4gIGRlc3Q6IEltYWdlRGF0YSwgY29sb3I6IG51bWJlciwgXHJcbiAgeDogbnVtYmVyLCB5MCA9IDAsIHkxID0gZGVzdC5oZWlnaHQgLSAxXHJcbikgPT4ge1xyXG4gIGlmKCB4IDwgMCB8fCB4ID49IGRlc3Qud2lkdGggKSB7XHJcbiAgICByZXR1cm5cclxuICB9XHJcblxyXG4gIGlmKCB5MCA+IHkxICl7XHJcbiAgICBbIHkwLCB5MSBdID0gWyB5MSwgeTAgXVxyXG4gIH1cclxuXHJcbiAgeTAgPSB5MCA8IDAgPyAwIDogeTBcclxuICB5MSA9IHkxID49IGRlc3QuaGVpZ2h0ID8gZGVzdC5oZWlnaHQgLSAxIDogeTFcclxuXHJcbiAgY29uc3QgaCA9IHkxIC0geTAgKyAxXHJcbiAgY29uc3QgZGF0YSA9IG5ldyBVaW50MzJBcnJheShkZXN0LmRhdGEuYnVmZmVyKVxyXG5cclxuICBsZXQgaW5kZXggPSB5MCAqIGRlc3Qud2lkdGggKyB4XHJcbiAgXHJcbiAgZm9yKCBsZXQgaSA9IDA7IGkgPCBoOyBpKysgKXtcclxuICAgIGRhdGFbaW5kZXhdID0gY29sb3JcclxuICAgIFxyXG4gICAgaW5kZXggKz0gZGVzdC53aWR0aFxyXG4gIH1cclxuXHJcbiAgcmV0dXJuIGRlc3RcclxufSJdfQ==