import { lerp } from '../util.js';
export const createColor = (r, g, b, a = 255) => (a << 24) | (b << 16) | (g << 8) | r;
export const createColor24 = (r, g, b) => (b << 16) | (g << 8) | r;
export const colorToRgba = (color) => [
    color & 0xFF, (color >> 8) & 0xFF, (color >> 16) & 0xFF, color >>> 24
];
export const colorToRgb = (color) => [
    color & 0xFF, (color >> 8) & 0xFF, (color >> 16) & 0xFF
];
export const generateHues = (count, v = 100) => {
    const colors = Array(count);
    const hueStep = 360 / (count + 1);
    for (let i = 0; i < count; i++) {
        const hue = i * hueStep;
        colors[i] = createColor(...hsvToRgb(hue, 100, v));
    }
    return colors;
};
// range is 0-360, s and v are 0-100
export const hsvToRgb = (h, s, v) => {
    const sFloat = s / 100;
    const vFloat = v / 100;
    const i = Math.floor(h / 60) % 6;
    const f = h / 60 - i;
    const p = vFloat * (1 - sFloat);
    const q = vFloat * (1 - f * sFloat);
    const t = vFloat * (1 - (1 - f) * sFloat);
    let rFloat = 0, gFloat = 0, bFloat = 0;
    switch (i) {
        case 0:
            rFloat = vFloat;
            gFloat = t;
            bFloat = p;
            break;
        case 1:
            rFloat = q;
            gFloat = vFloat;
            bFloat = p;
            break;
        case 2:
            rFloat = p;
            gFloat = vFloat;
            bFloat = t;
            break;
        case 3:
            rFloat = p;
            gFloat = q;
            bFloat = vFloat;
            break;
        case 4:
            rFloat = t;
            gFloat = p;
            bFloat = vFloat;
            break;
        case 5:
            rFloat = vFloat;
            gFloat = p;
            bFloat = q;
            break;
    }
    const r = Math.round(rFloat * 255);
    const g = Math.round(gFloat * 255);
    const b = Math.round(bFloat * 255);
    return [r, g, b];
};
export const createColorStop = (r, g, b, a, 
// 0 is start, 1 is end
stop) => [r, g, b, a, stop];
export const stopToRgba = (stop) => stop.slice(0, 4);
const AT_I = 4;
export const sampleGradient = (stops, at) => {
    if (stops.length === 0)
        throw Error('No stops in gradient');
    if (stops.length === 1)
        return stopToRgba(stops[0]);
    let leftIndex = -1;
    let rightIndex = -1;
    let maxLeft = -Infinity;
    let minRight = Infinity;
    for (let i = 0; i < stops.length; i++) {
        const stopAt = stops[i][AT_I];
        if (stopAt === at)
            return stopToRgba(stops[i]);
        if (stopAt < at && stopAt > maxLeft) {
            maxLeft = stopAt;
            leftIndex = i;
        }
        if (stopAt > at && stopAt < minRight) {
            minRight = stopAt;
            rightIndex = i;
        }
    }
    if (leftIndex === -1 && rightIndex >= 0) {
        return stopToRgba(stops[rightIndex]);
    }
    if (rightIndex === -1 && leftIndex >= 0) {
        return stopToRgba(stops[leftIndex]);
    }
    const left = stops[leftIndex];
    const right = stops[rightIndex];
    const range = right[AT_I] - left[AT_I];
    if (range === 0)
        return stopToRgba(left);
    const t = (at - left[AT_I]) / range;
    return [
        lerp(left[0], right[0], t),
        lerp(left[1], right[1], t),
        lerp(left[2], right[2], t),
        lerp(left[3], right[3], t)
    ];
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29sb3IuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi9zcmMvbGliL2ltYWdlL2NvbG9yLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUNBLE9BQU8sRUFBRSxJQUFJLEVBQUUsTUFBTSxZQUFZLENBQUE7QUFFakMsTUFBTSxDQUFDLE1BQU0sV0FBVyxHQUFHLENBQUMsQ0FBUyxFQUFFLENBQVMsRUFBRSxDQUFTLEVBQUUsQ0FBQyxHQUFHLEdBQUcsRUFBRSxFQUFFLENBQ3RFLENBQUMsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxHQUFHLENBQUMsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQTtBQUV0QyxNQUFNLENBQUMsTUFBTSxhQUFhLEdBQUcsQ0FBQyxDQUFTLEVBQUUsQ0FBUyxFQUFFLENBQVMsRUFBRSxFQUFFLENBQy9ELENBQUMsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQTtBQUUxQixNQUFNLENBQUMsTUFBTSxXQUFXLEdBQUcsQ0FBQyxLQUFhLEVBQU0sRUFBRSxDQUFDO0lBQ2hELEtBQUssR0FBRyxJQUFJLEVBQUUsQ0FBQyxLQUFLLElBQUksQ0FBQyxDQUFDLEdBQUcsSUFBSSxFQUFFLENBQUMsS0FBSyxJQUFJLEVBQUUsQ0FBQyxHQUFHLElBQUksRUFBRSxLQUFLLEtBQUssRUFBRTtDQUN0RSxDQUFBO0FBRUQsTUFBTSxDQUFDLE1BQU0sVUFBVSxHQUFHLENBQUMsS0FBYSxFQUFNLEVBQUUsQ0FBQztJQUMvQyxLQUFLLEdBQUcsSUFBSSxFQUFFLENBQUMsS0FBSyxJQUFJLENBQUMsQ0FBQyxHQUFHLElBQUksRUFBRSxDQUFDLEtBQUssSUFBSSxFQUFFLENBQUMsR0FBRyxJQUFJO0NBQ3hELENBQUE7QUFFRCxNQUFNLENBQUMsTUFBTSxZQUFZLEdBQUcsQ0FBQyxLQUFhLEVBQUUsQ0FBQyxHQUFHLEdBQUcsRUFBRSxFQUFFO0lBQ3JELE1BQU0sTUFBTSxHQUFHLEtBQUssQ0FBUyxLQUFLLENBQUMsQ0FBQTtJQUVuQyxNQUFNLE9BQU8sR0FBRyxHQUFHLEdBQUcsQ0FBQyxLQUFLLEdBQUcsQ0FBQyxDQUFDLENBQUE7SUFFakMsS0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLEtBQUssRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDO1FBQy9CLE1BQU0sR0FBRyxHQUFHLENBQUMsR0FBRyxPQUFPLENBQUE7UUFFdkIsTUFBTSxDQUFDLENBQUMsQ0FBQyxHQUFHLFdBQVcsQ0FBQyxHQUFHLFFBQVEsQ0FBQyxHQUFHLEVBQUUsR0FBRyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUE7SUFDbkQsQ0FBQztJQUVELE9BQU8sTUFBTSxDQUFBO0FBQ2YsQ0FBQyxDQUFBO0FBRUQsb0NBQW9DO0FBQ3BDLE1BQU0sQ0FBQyxNQUFNLFFBQVEsR0FBRyxDQUFDLENBQVMsRUFBRSxDQUFTLEVBQUUsQ0FBUyxFQUFNLEVBQUU7SUFDOUQsTUFBTSxNQUFNLEdBQUcsQ0FBQyxHQUFHLEdBQUcsQ0FBQTtJQUN0QixNQUFNLE1BQU0sR0FBRyxDQUFDLEdBQUcsR0FBRyxDQUFBO0lBRXRCLE1BQU0sQ0FBQyxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxHQUFHLENBQUMsQ0FBQTtJQUNoQyxNQUFNLENBQUMsR0FBRyxDQUFDLEdBQUcsRUFBRSxHQUFHLENBQUMsQ0FBQTtJQUVwQixNQUFNLENBQUMsR0FBRyxNQUFNLEdBQUcsQ0FBQyxDQUFDLEdBQUcsTUFBTSxDQUFDLENBQUE7SUFDL0IsTUFBTSxDQUFDLEdBQUcsTUFBTSxHQUFHLENBQUMsQ0FBQyxHQUFHLENBQUMsR0FBRyxNQUFNLENBQUMsQ0FBQTtJQUNuQyxNQUFNLENBQUMsR0FBRyxNQUFNLEdBQUcsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLEdBQUcsTUFBTSxDQUFDLENBQUE7SUFFekMsSUFBSSxNQUFNLEdBQUcsQ0FBQyxFQUFFLE1BQU0sR0FBRyxDQUFDLEVBQUUsTUFBTSxHQUFHLENBQUMsQ0FBQTtJQUV0QyxRQUFRLENBQUMsRUFBRSxDQUFDO1FBQ1YsS0FBSyxDQUFDO1lBQUUsTUFBTSxHQUFHLE1BQU0sQ0FBQztZQUFDLE1BQU0sR0FBRyxDQUFDLENBQUM7WUFBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDO1lBQUMsTUFBSztRQUN0RCxLQUFLLENBQUM7WUFBRSxNQUFNLEdBQUcsQ0FBQyxDQUFDO1lBQUMsTUFBTSxHQUFHLE1BQU0sQ0FBQztZQUFDLE1BQU0sR0FBRyxDQUFDLENBQUM7WUFBQyxNQUFLO1FBQ3RELEtBQUssQ0FBQztZQUFFLE1BQU0sR0FBRyxDQUFDLENBQUM7WUFBQyxNQUFNLEdBQUcsTUFBTSxDQUFDO1lBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQztZQUFDLE1BQUs7UUFDdEQsS0FBSyxDQUFDO1lBQUUsTUFBTSxHQUFHLENBQUMsQ0FBQztZQUFDLE1BQU0sR0FBRyxDQUFDLENBQUM7WUFBQyxNQUFNLEdBQUcsTUFBTSxDQUFDO1lBQUMsTUFBSztRQUN0RCxLQUFLLENBQUM7WUFBRSxNQUFNLEdBQUcsQ0FBQyxDQUFDO1lBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQztZQUFDLE1BQU0sR0FBRyxNQUFNLENBQUM7WUFBQyxNQUFLO1FBQ3RELEtBQUssQ0FBQztZQUFFLE1BQU0sR0FBRyxNQUFNLENBQUM7WUFBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDO1lBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQztZQUFDLE1BQUs7SUFDeEQsQ0FBQztJQUVELE1BQU0sQ0FBQyxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsTUFBTSxHQUFHLEdBQUcsQ0FBQyxDQUFBO0lBQ2xDLE1BQU0sQ0FBQyxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsTUFBTSxHQUFHLEdBQUcsQ0FBQyxDQUFBO0lBQ2xDLE1BQU0sQ0FBQyxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsTUFB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QyxDQUFDLEVBQUUsS0FBSyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQztRQUMxQixJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxFQUFFLEtBQUssQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUM7UUFDMUIsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsRUFBRSxLQUFLLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDO1FBQzFCLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLEVBQUUsS0FBSyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQztLQUMzQixDQUFBO0FBQ0gsQ0FBQyxDQUFBIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgVDMsIFQ0LCBUNSB9IGZyb20gJy4uL3R5cGVzLmpzJ1xyXG5pbXBvcnQgeyBsZXJwIH0gZnJvbSAnLi4vdXRpbC5qcydcclxuXHJcbmV4cG9ydCBjb25zdCBjcmVhdGVDb2xvciA9IChyOiBudW1iZXIsIGc6IG51bWJlciwgYjogbnVtYmVyLCBhID0gMjU1KSA9PlxyXG4gIChhIDw8IDI0KSB8IChiIDw8IDE2KSB8IChnIDw8IDgpIHwgclxyXG5cclxuZXhwb3J0IGNvbnN0IGNyZWF0ZUNvbG9yMjQgPSAocjogbnVtYmVyLCBnOiBudW1iZXIsIGI6IG51bWJlcikgPT5cclxuICAoYiA8PCAxNikgfCAoZyA8PCA4KSB8IHJcclxuXHJcbmV4cG9ydCBjb25zdCBjb2xvclRvUmdiYSA9IChjb2xvcjogbnVtYmVyKTogVDQgPT4gW1xyXG4gIGNvbG9yICYgMHhGRiwgKGNvbG9yID4+IDgpICYgMHhGRiwgKGNvbG9yID4+IDE2KSAmIDB4RkYsIGNvbG9yID4+PiAyNFxyXG5dXHJcblxyXG5leHBvcnQgY29uc3QgY29sb3JUb1JnYiA9IChjb2xvcjogbnVtYmVyKTogVDMgPT4gW1xyXG4gIGNvbG9yICYgMHhGRiwgKGNvbG9yID4+IDgpICYgMHhGRiwgKGNvbG9yID4+IDE2KSAmIDB4RkZcclxuXVxyXG5cclxuZXhwb3J0IGNvbnN0IGdlbmVyYXRlSHVlcyA9IChjb3VudDogbnVtYmVyLCB2ID0gMTAwKSA9PiB7XHJcbiAgY29uc3QgY29sb3JzID0gQXJyYXk8bnVtYmVyPihjb3VudClcclxuXHJcbiAgY29uc3QgaHVlU3RlcCA9IDM2MCAvIChjb3VudCArIDEpXHJcblxyXG4gIGZvciAobGV0IGkgPSAwOyBpIDwgY291bnQ7IGkrKykge1xyXG4gICAgY29uc3QgaHVlID0gaSAqIGh1ZVN0ZXBcclxuXHJcbiAgICBjb2xvcnNbaV0gPSBjcmVhdGVDb2xvciguLi5oc3ZUb1JnYihodWUsIDEwMCwgdikpXHJcbiAgfVxyXG5cclxuICByZXR1cm4gY29sb3JzXHJcbn1cclxuXHJcbi8vIHJhbmdlIGlzIDAtMzYwLCBzIGFuZCB2IGFyZSAwLTEwMFxyXG5leHBvcnQgY29uc3QgaHN2VG9SZ2IgPSAoaDogbnVtYmVyLCBzOiBudW1iZXIsIHY6IG51bWJlcik6IFQzID0+IHtcclxuICBjb25zdCBzRmxvYXQgPSBzIC8gMTAwXHJcbiAgY29uc3QgdkZsb2F0ID0gdiAvIDEwMFxyXG5cclxuICBjb25zdCBpID0gTWF0aC5mbG9vcihoIC8gNjApICUgNlxyXG4gIGNvbnN0IGYgPSBoIC8gNjAgLSBpXHJcblxyXG4gIGNvbnN0IHAgPSB2RmxvYXQgKiAoMSAtIHNGbG9hdClcclxuICBjb25zdCBxID0gdkZsb2F0ICogKDEgLSBmICogc0Zsb2F0KVxyXG4gIGNvbnN0IHQgPSB2RmxvYXQgKiAoMSAtICgxIC0gZikgKiBzRmxvYXQpXHJcblxyXG4gIGxldCByRmxvYXQgPSAwLCBnRmxvYXQgPSAwLCBiRmxvYXQgPSAwXHJcblxyXG4gIHN3aXRjaCAoaSkge1xyXG4gICAgY2FzZSAwOiByRmxvYXQgPSB2RmxvYXQ7IGdGbG9hdCA9IHQ7IGJGbG9hdCA9IHA7IGJyZWFrXHJcbiAgICBjYXNlIDE6IHJGbG9hdCA9IHE7IGdGbG9hdCA9IHZGbG9hdDsgYkZsb2F0ID0gcDsgYnJlYWtcclxuICAgIGNhc2UgMjogckZsb2F0ID0gcDsgZ0Zsb2F0ID0gdkZsb2F0OyBiRmxvYXQgPSB0OyBicmVha1xyXG4gICAgY2FzZSAzOiByRmxvYXQgPSBwOyBnRmxvYXQgPSBxOyBiRmxvYXQgPSB2RmxvYXQ7IGJyZWFrXHJcbiAgICBjYXNlIDQ6IHJGbG9hdCA9IHQ7IGdGbG9hdCA9IHA7IGJGbG9hdCA9IHZGbG9hdDsgYnJlYWtcclxuICAgIGNhc2UgNTogckZsb2F0ID0gdkZsb2F0OyBnRmxvYXQgPSBwOyBiRmxvYXQgPSBxOyBicmVha1xyXG4gIH1cclxuXHJcbiAgY29uc3QgciA9IE1hdGgucm91bmQockZsb2F0ICogMjU1KVxyXG4gIGNvbnN0IGcgPSBNYXRoLnJvdW5kKGdGbG9hdCAqIDI1NSlcclxuICBjb25zdCBiID0gTWF0aC5yb3VuZChiRmxvYXQgKiAyNTUpXHJcblxyXG4gIHJldHVybiBbciwgZywgYl1cclxufVxyXG5cclxuZXhwb3J0IGNvbnN0IGNyZWF0ZUNvbG9yU3RvcCA9IChcclxuICByOiBudW1iZXIsIGc6IG51bWJlciwgYjogbnVtYmVyLCBhOiBudW1iZXIsXHJcbiAgLy8gMCBpcyBzdGFydCwgMSBpcyBlbmRcclxuICBzdG9wOiBudW1iZXJcclxuKTogVDUgPT4gW3IsIGcsIGIsIGEsIHN0b3BdXHJcblxyXG5leHBvcnQgY29uc3Qgc3RvcFRvUmdiYSA9IChzdG9wOiBUNSkgPT4gc3RvcC5zbGljZSgwLCA0KSBhcyBUNFxyXG5cclxuY29uc3QgQVRfSSA9IDRcclxuXHJcbmV4cG9ydCBjb25zdCBzYW1wbGVHcmFkaWVudCA9IChzdG9wczogVDVbXSwgYXQ6IG51bWJlcik6IFQ0ID0+IHtcclxuICBpZiAoc3RvcHMubGVuZ3RoID09PSAwKSB0aHJvdyBFcnJvcignTm8gc3RvcHMgaW4gZ3JhZGllbnQnKVxyXG5cclxuICBpZiAoc3RvcHMubGVuZ3RoID09PSAxKSByZXR1cm4gc3RvcFRvUmdiYShzdG9wc1swXSlcclxuXHJcbiAgbGV0IGxlZnRJbmRleCA9IC0xXHJcbiAgbGV0IHJpZ2h0SW5kZXggPSAtMVxyXG4gIGxldCBtYXhMZWZ0ID0gLUluZmluaXR5XHJcbiAgbGV0IG1pblJpZ2h0ID0gSW5maW5pdHlcclxuXHJcbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBzdG9wcy5sZW5ndGg7IGkrKykge1xyXG4gICAgY29uc3Qgc3RvcEF0ID0gc3RvcHNbaV1bQVRfSV1cclxuXHJcbiAgICBpZiAoc3RvcEF0ID09PSBhdCkgcmV0dXJuIHN0b3BUb1JnYmEoc3RvcHNbaV0pXHJcblxyXG4gICAgaWYgKHN0b3BBdCA8IGF0ICYmIHN0b3BBdCA+IG1heExlZnQpIHtcclxuICAgICAgbWF4TGVmdCA9IHN0b3BBdFxyXG4gICAgICBsZWZ0SW5kZXggPSBpXHJcbiAgICB9XHJcblxyXG4gICAgaWYgKHN0b3BBdCA+IGF0ICYmIHN0b3BBdCA8IG1pblJpZ2h0KSB7XHJcbiAgICAgIG1pblJpZ2h0ID0gc3RvcEF0XHJcbiAgICAgIHJpZ2h0SW5kZXggPSBpXHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICBpZiAobGVmdEluZGV4ID09PSAtMSAmJiByaWdodEluZGV4ID49IDApIHtcclxuICAgIHJldHVybiBzdG9wVG9SZ2JhKHN0b3BzW3JpZ2h0SW5kZXhdKVxyXG4gIH1cclxuXHJcbiAgaWYgKHJpZ2h0SW5kZXggPT09IC0xICYmIGxlZnRJbmRleCA+PSAwKSB7XHJcbiAgICByZXR1cm4gc3RvcFRvUmdiYShzdG9wc1tsZWZ0SW5kZXhdKVxyXG4gIH1cclxuXHJcbiAgY29uc3QgbGVmdCA9IHN0b3BzW2xlZnRJbmRleF1cclxuICBjb25zdCByaWdodCA9IHN0b3BzW3JpZ2h0SW5kZXhdXHJcblxyXG4gIGNvbnN0IHJhbmdlID0gcmlnaHRbQVRfSV0gLSBsZWZ0W0FUX0ldXHJcblxyXG4gIGlmIChyYW5nZSA9PT0gMCkgcmV0dXJuIHN0b3BUb1JnYmEobGVmdClcclxuXHJcbiAgY29uc3QgdCA9IChhdCAtIGxlZnRbQVRfSV0pIC8gcmFuZ2VcclxuXHJcbiAgcmV0dXJuIFtcclxuICAgIGxlcnAobGVmdFswXSwgcmlnaHRbMF0sIHQpLFxyXG4gICAgbGVycChsZWZ0WzFdLCByaWdodFsxXSwgdCksXHJcbiAgICBsZXJwKGxlZnRbMl0sIHJpZ2h0WzJdLCB0KSxcclxuICAgIGxlcnAobGVmdFszXSwgcmlnaHRbM10sIHQpXHJcbiAgXVxyXG59XHJcbiJdfQ==