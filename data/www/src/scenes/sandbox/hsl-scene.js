import { bresenhamLine } from '../../lib/image/bresenham.js';
import { createColor, hslToRgb } from '../../lib/image/color.js';
import { clampTransfer } from '../../lib/image/util.js';
import { debugTextSceneHelper } from '../../lib/scene/debug-text.js';
import { exitOnEscape, zoomOnWheel } from '../../lib/scene/io.js';
import { maybe } from '../../lib/util.js';
export const hslScene = () => {
    let isActive = false;
    let debugHelper;
    let lastW = 0;
    let lastH = 0;
    let hsla16;
    let selectedColor = hmidgrey;
    let drawRect = [0, 0, 0, 0];
    // x, y, hsla color
    let paintPts = [];
    let pmode = 'paint';
    let lastMx = null;
    let lastMy = null;
    let lastMb = false;
    let debugText = [];
    const init = async (state) => {
        debugHelper = debugTextSceneHelper(() => debugText);
        await debugHelper.init(state);
        paintPts = [];
        isActive = true;
    };
    const onResize = () => {
        hsla16 = createHsla16(lastW, lastH);
    };
    const io = (state) => {
        if (exitOnEscape(state))
            return;
        if (zoomOnWheel(state)) {
            lastW = 0;
            lastH = 0;
        }
        const keys = state.getKeyPresses();
        for (let i = 0; i < keys.length; i++) {
            const lkey = keys[i].toLowerCase();
            if (lkey === 'p') {
                pmode = 'paint';
            }
            if (lkey === 'f') {
                pmode = 'fill';
            }
        }
        keys.length = 0;
        if (!maybe(hsla16))
            return;
        const mbuts = state.mouse.getButtons();
        const mx = state.mouse.getX();
        const my = state.mouse.getY();
        const [rx, ry, rw, rh] = drawRect;
        const inDrawRect = (mx >= rx && mx < rx + rw &&
            my >= ry && my < ry + rh);
        if (mbuts[0]) {
            if (inDrawRect) {
                if (pmode === 'paint') {
                    if (!maybe(lastMx) || !maybe(lastMy)) {
                        paintPts.push([mx - rx, my - ry, selectedColor]);
                    }
                    else {
                        const line = bresenhamLine(lastMx, lastMy, mx, my);
                        for (let l = 0; l < line.length; l++) {
                            const [lx, ly] = line[l];
                            paintPts.push([lx - rx, ly - ry, selectedColor]);
                        }
                    }
                    lastMx = mx;
                    lastMy = my;
                }
                else {
                    lastMx = null;
                    lastMy = null;
                }
            }
            else {
                const index = my * hsla16.width + mx;
                selectedColor = hsla16.data[index];
            }
            lastMb = true;
        }
        else {
            lastMx = null;
            lastMy = null;
            if (lastMb && pmode === 'fill') {
                const fillPts = floodFill(hsla16, selectedColor, mx, my);
                for (let i = 0; i < fillPts.length; i++) {
                    const [fx, fy, fh] = fillPts[i];
                    paintPts.push([fx - rx, fy - ry, fh]);
                }
            }
            lastMb = false;
        }
    };
    const update = (state) => {
        if (!maybe(debugHelper))
            throw Error('debugHelper not initialized');
        if (isActive)
            io(state);
        const buffer = state.view.getBuffer();
        const { width, height } = buffer;
        if (width !== lastW || height !== lastH) {
            lastW = width;
            lastH = height;
            onResize();
        }
        // draw to hsl buffer
        if (!maybe(hsla16))
            throw Error('hsla16 not initialized');
        hsla16.data.fill(selectedColor);
        const padding = 1;
        const cellW = 16;
        const cellH = 16;
        const advX = cellW + padding;
        const advY = cellH + padding;
        let dx = padding;
        let dy = padding;
        for (let h = 0; h < 16; h++) {
            //
            for (let s = 0; s < 16; s++) {
                const destY = s + dy;
                const rowStart = destY * hsla16.width;
                for (let l = 0; l < 16; l++) {
                    const destX = l + dx;
                    const index = destX + rowStart;
                    const color = createHslaColor(h, s, l);
                    hsla16.data[index] = color;
                }
            }
            //
            dy += advY;
            const remY = height - dy;
            if (remY < cellH) {
                dy = padding;
                dx += advX;
                const remX = width - dx;
                if (remX < cellW)
                    break;
            }
        }
        dx += advX;
        const rightX = dx;
        const rightY = padding;
        const rightW = width - dx - padding;
        const rightH = height - padding * 2;
        for (let ry = 0; ry < rightH; ry++) {
            const rectY = ry + rightY;
            const rowStart = rectY * hsla16.width;
            for (let rx = 0; rx < rightW; rx++) {
                const rectX = rx + rightX;
                const index = rectX + rowStart;
                hsla16.data[index] = hblack;
            }
        }
        drawRect = [rightX, rightY, rightW, rightH];
        for (let i = 0; i < paintPts.length; i++) {
            const [px, py, ph] = paintPts[i];
            const rectX = rightX + px;
            const rectY = rightY + py;
            if (rectX < 0 || rectX >= width || rectY < 0 || rectY >= height)
                continue;
            const index = rectY * hsla16.width + rectX;
            hsla16.data[index] = ph;
        }
        //
        blitHsla(hsla16, buffer);
        //
        const frameTime = state.time.getFrameTime();
        const fps = Math.round(1000 / frameTime);
        const fpsText = `${fps} fps (${frameTime.toFixed(1)}ms)`;
        debugText = [fpsText, pmode];
        debugHelper.update(state);
    };
    const quit = async (state) => {
        isActive = false;
    };
    const setActive = (active) => {
        isActive = active;
    };
    return { init, update, quit, setActive };
};
const hMask = 0b1111000000000000;
const sMask = 0b0000111100000000;
const lMask = 0b0000000011110000;
const aMask = 0b0000000000001111;
const createHslaColor = (h, s, l, a = 15) => (h << 12) | (s << 8) | (l << 4) | a;
//
const hwhite = createHslaColor(0, 0, 15);
const hmidgrey = createHslaColor(0, 0, 8);
const hblack = createHslaColor(0, 0, 0);
//
const hslaColorToTuple = (color) => [
    (color & hMask) >> 12,
    (color & sMask) >> 8,
    (color & lMask) >> 4,
    color & aMask
];
const createHsla16 = (width, height) => {
    const size = width * height;
    const data = new Uint16Array(size);
    return { width, height, data };
};
const totalHsla = 16 ** 4;
const hslaToRgbaLut = new Uint32Array(totalHsla);
for (let i = 0; i < totalHsla; i++) {
    let [h, s, l, a] = hslaColorToTuple(i);
    h /= 15;
    s /= 15;
    l /= 15;
    a *= 17; // /= 15 * 255
    const [r, g, b] = hslToRgb([h, s, l]);
    const rgbaColor = createColor(r, g, b, a);
    hslaToRgbaLut[i] = rgbaColor;
}
const blitHsla = (src, dest, transfer = [0, 0, src.width, src.height, 0, 0]) => {
    const [sx, sy, sw, sh, dx, dy] = clampTransfer(src.width, src.height, dest.width, dest.height, transfer);
    const destView = new Uint32Array(dest.data.buffer);
    for (let y = 0; y < sh; y++) {
        for (let x = 0; x < sw; x++) {
            const srcIndex = x + sx + (y + sy) * src.width;
            const destIndex = x + dx + (y + dy) * dest.width;
            const hslaColor = src.data[srcIndex];
            const rgbaColor = hslaToRgbaLut[hslaColor];
            destView[destIndex] = rgbaColor;
        }
    }
    return dest;
};
const floodFill = (dest, color, x, y) => {
    const pts = [];
    const seen = new Set();
    if (x < 0 || x >= dest.width || y < 0 || y >= dest.height)
        return pts;
    const index = y * dest.width + x;
    const oldColor = dest.data[index];
    if (oldColor === color)
        return pts;
    const queue = [];
    queue.push([x, y]);
    while (queue.length > 0) {
        const [cx, cy] = queue.shift();
        if (cx < 0 || cx >= dest.width || cy < 0 || cy >= dest.height)
            continue;
        const index = cy * dest.width + cx;
        if (seen.has(index))
            continue;
        if (dest.data[index] !== oldColor)
            continue;
        pts.push([cx, cy, color]);
        seen.add(index);
        queue.push([cx, cy - 1]);
        queue.push([cx + 1, cy]);
        queue.push([cx, cy + 1]);
        queue.push([cx - 1, cy]);
    }
    return pts;
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaHNsLXNjZW5lLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vc3JjL3NjZW5lcy9zYW5kYm94L2hzbC1zY2VuZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxPQUFPLEVBQUUsYUFBYSxFQUFFLE1BQU0sOEJBQThCLENBQUE7QUFDNUQsT0FBTyxFQUFFLFdBQVcsRUFBRSxRQUFRLEVBQUUsTUFBTSwwQkFBMEIsQ0FBQTtBQUNoRSxPQUFPLEVBQUUsYUFBYSxFQUFFLE1BQU0seUJBQXlCLENBQUE7QUFDdkQsT0FBTyxFQUFFLG9CQUFvQixFQUFFLE1BQU0sK0JBQStCLENBQUE7QUFDcEUsT0FBTyxFQUFFLFlBQVksRUFBRSxXQUFXLEVBQUUsTUFBTSx1QkFBdUIsQ0FBQTtBQUVqRSxPQUFPLEVBQUUsS0FBSyxFQUFFLE1BQU0sbUJBQW1CLENBQUE7QUFJekMsTUFBTSxDQUFDLE1BQU0sUUFBUSxHQUFHLEdBQVUsRUFBRTtJQUNsQyxJQUFJLFFBQVEsR0FBRyxLQUFLLENBQUE7SUFDcEIsSUFBSSxXQUF5QixDQUFBO0lBQzdCLElBQUksS0FBSyxHQUFHLENBQUMsQ0FBQTtJQUNiLElBQUksS0FBSyxHQUFHLENBQUMsQ0FBQTtJQUNiLElBQUksTUFBcUIsQ0FBQTtJQUN6QixJQUFJLGFBQWEsR0FBRyxRQUFRLENBQUE7SUFDNUIsSUFBSSxRQUFRLEdBQU8sQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQTtJQUMvQixtQkFBbUI7SUFDbkIsSUFBSSxRQUFRLEdBQVMsRUFBRSxDQUFBO0lBQ3ZCLElBQUksS0FBSyxHQUFVLE9BQU8sQ0FBQTtJQUUxQixJQUFJLE1BQU0sR0FBa0IsSUFBSSxDQUFBO0lBQ2hDLElBQUksTUFBTSxHQUFrQixJQUFJLENBQUE7SUFDaEMsSUFBSSxNQUFNLEdBQUcsS0FBSyxDQUFBO0lBRWxCLElBQUksU0FBUyxHQUFhLEVBQUUsQ0FBQTtJQUU1QixN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SUFBSSxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxHQUFHLGdCQUFnQixDQUFDLENBQUMsQ0FBQyxDQUFBO0lBRXRDLENBQUMsSUFBSSxFQUFFLENBQUE7SUFDUCxDQUFDLElBQUksRUFBRSxDQUFBO0lBQ1AsQ0FBQyxJQUFJLEVBQUUsQ0FBQTtJQUNQLENBQUMsSUFBSSxFQUFFLENBQUEsQ0FBQyxjQUFjO0lBRXRCLE1BQU0sQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxHQUFHLFFBQVEsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQTtJQUVyQyxNQUFNLFNBQVMsR0FBRyxXQUFXLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUE7SUFFekMsYUFBYSxDQUFDLENBQUMsQ0FBQyxHQUFHLFNBQVMsQ0FBQTtBQUM5QixDQUFDO0FBRUQsTUFBTSxRQUFRLEdBQUcsQ0FDZixHQUFXLEVBQUUsSUFBZSxFQUM1QixXQUFlLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxHQUFHLENBQUMsS0FBSyxFQUFFLEdBQUcsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxFQUNsRCxFQUFFO0lBQ0YsTUFBTSxDQUFDLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxDQUFDLEdBQUcsYUFBYSxDQUM1QyxHQUFHLENBQUMsS0FBSyxFQUFFLEdBQUcsQ0FBQyxNQUFNLEVBQUUsSUFBSSxDQUFDLEtBQUssRUFBRSxJQUFJLENBQUMsTUFBTSxFQUFFLFFBQVEsQ0FDekQsQ0FBQTtJQUVELE1BQU0sUUFBUSxHQUFHLElBQUksV0FBVyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUE7SUFFbEQsS0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLEVBQUUsRUFBRSxDQUFDLEVBQUUsRUFB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QUFPLEdBQUcsQ0FBQTtBQUNaLENBQUMsQ0FBQSIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IGJyZXNlbmhhbUxpbmUgfSBmcm9tICcuLi8uLi9saWIvaW1hZ2UvYnJlc2VuaGFtLmpzJ1xuaW1wb3J0IHsgY3JlYXRlQ29sb3IsIGhzbFRvUmdiIH0gZnJvbSAnLi4vLi4vbGliL2ltYWdlL2NvbG9yLmpzJ1xuaW1wb3J0IHsgY2xhbXBUcmFuc2ZlciB9IGZyb20gJy4uLy4uL2xpYi9pbWFnZS91dGlsLmpzJ1xuaW1wb3J0IHsgZGVidWdUZXh0U2NlbmVIZWxwZXIgfSBmcm9tICcuLi8uLi9saWIvc2NlbmUvZGVidWctdGV4dC5qcydcbmltcG9ydCB7IGV4aXRPbkVzY2FwZSwgem9vbU9uV2hlZWwgfSBmcm9tICcuLi8uLi9saWIvc2NlbmUvaW8uanMnXG5pbXBvcnQgeyBNYXliZSwgU2NlbmUsIFN0YXRlLCBUMiwgVDMsIFQ0LCBUNiB9IGZyb20gJy4uLy4uL2xpYi90eXBlcy5qcydcbmltcG9ydCB7IG1heWJlIH0gZnJvbSAnLi4vLi4vbGliL3V0aWwuanMnXG5cbnR5cGUgUE1vZGUgPSAncGFpbnQnIHwgJ2ZpbGwnXG5cbmV4cG9ydCBjb25zdCBoc2xTY2VuZSA9ICgpOiBTY2VuZSA9PiB7XG4gIGxldCBpc0FjdGl2ZSA9IGZhbHNlXG4gIGxldCBkZWJ1Z0hlbHBlcjogTWF5YmU8U2NlbmU+XG4gIGxldCBsYXN0VyA9IDBcbiAgbGV0IGxhc3RIID0gMFxuICBsZXQgaHNsYTE2OiBNYXliZTxIc2xhMTY+XG4gIGxldCBzZWxlY3RlZENvbG9yID0gaG1pZGdyZXlcbiAgbGV0IGRyYXdSZWN0OiBUNCA9IFswLCAwLCAwLCAwXVxuICAvLyB4LCB5LCBoc2xhIGNvbG9yXG4gIGxldCBwYWludFB0czogVDNbXSA9IFtdXG4gIGxldCBwbW9kZTogUE1vZGUgPSAncGFpbnQnXG5cbiAgbGV0IGxhc3RNeDogTWF5YmU8bnVtYmVyPiA9IG51bGxcbiAgbGV0IGxhc3RNeTogTWF5YmU8bnVtYmVyPiA9IG51bGxcbiAgbGV0IGxhc3RNYiA9IGZhbHNlXG5cbiAgbGV0IGRlYnVnVGV4dDogc3RyaW5nW10gPSBbXVxuXG4gIGNvbnN0IGluaXQgPSBhc3luYyAoc3RhdGU6IFN0YXRlKSA9PiB7XG4gICAgZGVidWdIZWxwZXIgPSBkZWJ1Z1RleHRTY2VuZUhlbHBlcigoKSA9PiBkZWJ1Z1RleHQpXG5cbiAgICBhd2FpdCBkZWJ1Z0hlbHBlci5pbml0KHN0YXRlKVxuXG4gICAgcGFpbnRQdHMgPSBbXVxuXG4gICAgaXNBY3RpdmUgPSB0cnVlXG4gIH1cblxuICBjb25zdCBvblJlc2l6ZSA9ICgpID0+IHtcbiAgICBoc2xhMTYgPSBjcmVhdGVIc2xhMTYobGFzdFcsIGxhc3RIKVxuICB9XG5cbiAgY29uc3QgaW8gPSAoc3RhdGU6IFN0YXRlKSA9PiB7XG4gICAgaWYgKGV4aXRPbkVzY2FwZShzdGF0ZSkpIHJldHVyblxuXG4gICAgaWYgKHpvb21PbldoZWVsKHN0YXRlKSkge1xuICAgICAgbGFzdFcgPSAwXG4gICAgICBsYXN0SCA9IDBcbiAgICB9XG5cbiAgICBjb25zdCBrZXlzID0gc3RhdGUuZ2V0S2V5UHJlc3NlcygpXG5cbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGtleXMubGVuZ3RoOyBpKyspIHtcbiAgICAgIGNvbnN0IGxrZXkgPSBrZXlzW2ldLnRvTG93ZXJDYXNlKClcblxuICAgICAgaWYgKGxrZXkgPT09ICdwJykge1xuICAgICAgICBwbW9kZSA9ICdwYWludCdcbiAgICAgIH1cblxuICAgICAgaWYgKGxrZXkgPT09ICdmJykge1xuICAgICAgICBwbW9kZSA9ICdmaWxsJ1xuICAgICAgfVxuICAgIH1cblxuICAgIGtleXMubGVuZ3RoID0gMFxuXG4gICAgaWYgKCFtYXliZShoc2xhMTYpKSByZXR1cm5cblxuICAgIGNvbnN0IG1idXRzID0gc3RhdGUubW91c2UuZ2V0QnV0dG9ucygpXG4gICAgY29uc3QgbXggPSBzdGF0ZS5tb3VzZS5nZXRYKClcbiAgICBjb25zdCBteSA9IHN0YXRlLm1vdXNlLmdldFkoKVxuXG4gICAgY29uc3QgW3J4LCByeSwgcncsIHJoXSA9IGRyYXdSZWN0XG5cbiAgICBjb25zdCBpbkRyYXdSZWN0ID0gKFxuICAgICAgbXggPj0gcnggJiYgbXggPCByeCArIHJ3ICYmXG4gICAgICBteSA+PSByeSAmJiBteSA8IHJ5ICsgcmhcbiAgICApXG5cbiAgICBpZiAobWJ1dHNbMF0pIHtcbiAgICAgIGlmIChpbkRyYXdSZWN0KSB7XG4gICAgICAgIGlmIChwbW9kZSA9PT0gJ3BhaW50Jykge1xuICAgICAgICAgIGlmICghbWF5YmUobGFzdE14KSB8fCAhbWF5YmUobGFzdE15KSkge1xuICAgICAgICAgICAgcGFpbnRQdHMucHVzaChbbXggLSByeCwgbXkgLSByeSwgc2VsZWN0ZWRDb2xvcl0pXG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGNvbnN0IGxpbmUgPSBicmVzZW5oYW1MaW5lKGxhc3RNeCwgbGFzdE15LCBteCwgbXkpXG5cbiAgICAgICAgICAgIGZvciAobGV0IGwgPSAwOyBsIDwgbGluZS5sZW5ndGg7IGwrKykge1xuICAgICAgICAgICAgICBjb25zdCBbbHgsIGx5XSA9IGxpbmVbbF1cblxuICAgICAgICAgICAgICBwYWludFB0cy5wdXNoKFtseCAtIHJ4LCBseSAtIHJ5LCBzZWxlY3RlZENvbG9yXSlcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG5cbiAgICAgICAgICBsYXN0TXggPSBteFxuICAgICAgICAgIGxhc3RNeSA9IG15XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgbGFzdE14ID0gbnVsbFxuICAgICAgICAgIGxhc3RNeSA9IG51bGxcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgY29uc3QgaW5kZXggPSBteSAqIGhzbGExNi53aWR0aCArIG14XG5cbiAgICAgICAgc2VsZWN0ZWRDb2xvciA9IGhzbGExNi5kYXRhW2luZGV4XVxuICAgICAgfVxuXG4gICAgICBsYXN0TWIgPSB0cnVlXG4gICAgfSBlbHNlIHtcbiAgICAgIGxhc3RNeCA9IG51bGxcbiAgICAgIGxhc3RNeSA9IG51bGxcblxuICAgICAgaWYgKGxhc3RNYiAmJiBwbW9kZSA9PT0gJ2ZpbGwnKSB7XG4gICAgICAgIGNvbnN0IGZpbGxQdHMgPSBmbG9vZEZpbGwoaHNsYTE2LCBzZWxlY3RlZENvbG9yLCBteCwgbXkpXG5cbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBmaWxsUHRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgY29uc3QgW2Z4LCBmeSwgZmhdID0gZmlsbFB0c1tpXVxuXG4gICAgICAgICAgcGFpbnRQdHMucHVzaChbZnggLSByeCwgZnkgLSByeSwgZmhdKVxuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIGxhc3RNYiA9IGZhbHNlXG4gICAgfVxuICB9XG5cbiAgY29uc3QgdXBkYXRlID0gKHN0YXRlOiBTdGF0ZSkgPT4ge1xuICAgIGlmICghbWF5YmUoZGVidWdIZWxwZXIpKSB0aHJvdyBFcnJvcignZGVidWdIZWxwZXIgbm90IGluaXRpYWxpemVkJylcblxuICAgIGlmIChpc0FjdGl2ZSkgaW8oc3RhdGUpXG5cbiAgICBjb25zdCBidWZmZXIgPSBzdGF0ZS52aWV3LmdldEJ1ZmZlcigpXG4gICAgY29uc3QgeyB3aWR0aCwgaGVpZ2h0IH0gPSBidWZmZXJcblxuICAgIGlmICh3aWR0aCAhPT0gbGFzdFcgfHwgaGVpZ2h0ICE9PSBsYXN0SCkge1xuICAgICAgbGFzdFcgPSB3aWR0aFxuICAgICAgbGFzdEggPSBoZWlnaHRcbiAgICAgIG9uUmVzaXplKClcbiAgICB9XG5cbiAgICAvLyBkcmF3IHRvIGhzbCBidWZmZXJcblxuICAgIGlmICghbWF5YmUoaHNsYTE2KSkgdGhyb3cgRXJyb3IoJ2hzbGExNiBub3QgaW5pdGlhbGl6ZWQnKVxuXG4gICAgaHNsYTE2LmRhdGEuZmlsbChzZWxlY3RlZENvbG9yKVxuXG4gICAgY29uc3QgcGFkZGluZyA9IDFcbiAgICBjb25zdCBjZWxsVyA9IDE2XG4gICAgY29uc3QgY2VsbEggPSAxNlxuICAgIGNvbnN0IGFkdlggPSBjZWxsVyArIHBhZGRpbmdcbiAgICBjb25zdCBhZHZZID0gY2VsbEggKyBwYWRkaW5nXG5cbiAgICBsZXQgZHggPSBwYWRkaW5nXG4gICAgbGV0IGR5ID0gcGFkZGluZ1xuXG4gICAgZm9yIChsZXQgaCA9IDA7IGggPCAxNjsgaCsrKSB7XG4gICAgICAvL1xuXG4gICAgICBmb3IgKGxldCBzID0gMDsgcyA8IDE2OyBzKyspIHtcbiAgICAgICAgY29uc3QgZGVzdFkgPSBzICsgZHlcbiAgICAgICAgY29uc3Qgcm93U3RhcnQgPSBkZXN0WSAqIGhzbGExNi53aWR0aFxuXG4gICAgICAgIGZvciAobGV0IGwgPSAwOyBsIDwgMTY7IGwrKykge1xuICAgICAgICAgIGNvbnN0IGRlc3RYID0gbCArIGR4XG4gICAgICAgICAgY29uc3QgaW5kZXggPSBkZXN0WCArIHJvd1N0YXJ0XG5cbiAgICAgICAgICBjb25zdCBjb2xvciA9IGNyZWF0ZUhzbGFDb2xvcihoLCBzLCBsKVxuXG4gICAgICAgICAgaHNsYTE2LmRhdGFbaW5kZXhdID0gY29sb3JcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICAvL1xuXG4gICAgICBkeSArPSBhZHZZXG5cbiAgICAgIGNvbnN0IHJlbVkgPSBoZWlnaHQgLSBkeVxuXG4gICAgICBpZiAocmVtWSA8IGNlbGxIKSB7XG4gICAgICAgIGR5ID0gcGFkZGluZ1xuICAgICAgICBkeCArPSBhZHZYXG5cbiAgICAgICAgY29uc3QgcmVtWCA9IHdpZHRoIC0gZHhcblxuICAgICAgICBpZiAocmVtWCA8IGNlbGxXKSBicmVha1xuICAgICAgfVxuICAgIH1cblxuICAgIGR4ICs9IGFkdlhcblxuICAgIGNvbnN0IHJpZ2h0WCA9IGR4XG4gICAgY29uc3QgcmlnaHRZID0gcGFkZGluZ1xuICAgIGNvbnN0IHJpZ2h0VyA9IHdpZHRoIC0gZHggLSBwYWRkaW5nXG4gICAgY29uc3QgcmlnaHRIID0gaGVpZ2h0IC0gcGFkZGluZyAqIDJcblxuICAgIGZvciAobGV0IHJ5ID0gMDsgcnkgPCByaWdodEg7IHJ5KyspIHtcbiAgICAgIGNvbnN0IHJlY3RZID0gcnkgKyByaWdodFlcbiAgICAgIGNvbnN0IHJvd1N0YXJ0ID0gcmVjdFkgKiBoc2xhMTYud2lkdGhcblxuICAgICAgZm9yIChsZXQgcnggPSAwOyByeCA8IHJpZ2h0VzsgcngrKykge1xuICAgICAgICBjb25zdCByZWN0WCA9IHJ4ICsgcmlnaHRYXG4gICAgICAgIGNvbnN0IGluZGV4ID0gcmVjdFggKyByb3dTdGFydFxuXG4gICAgICAgIGhzbGExNi5kYXRhW2luZGV4XSA9IGhibGFja1xuICAgICAgfVxuICAgIH1cblxuICAgIGRyYXdSZWN0ID0gW3JpZ2h0WCwgcmlnaHRZLCByaWdodFcsIHJpZ2h0SF1cblxuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgcGFpbnRQdHMubGVuZ3RoOyBpKyspIHtcbiAgICAgIGNvbnN0IFtweCwgcHksIHBoXSA9IHBhaW50UHRzW2ldXG5cbiAgICAgIGNvbnN0IHJlY3RYID0gcmlnaHRYICsgcHhcbiAgICAgIGNvbnN0IHJlY3RZID0gcmlnaHRZICsgcHlcblxuICAgICAgaWYgKHJlY3RYIDwgMCB8fCByZWN0WCA+PSB3aWR0aCB8fCByZWN0WSA8IDAgfHwgcmVjdFkgPj0gaGVpZ2h0KSBjb250aW51ZVxuXG4gICAgICBjb25zdCBpbmRleCA9IHJlY3RZICogaHNsYTE2LndpZHRoICsgcmVjdFhcblxuICAgICAgaHNsYTE2LmRhdGFbaW5kZXhdID0gcGhcbiAgICB9XG5cbiAgICAvL1xuXG4gICAgYmxpdEhzbGEoaHNsYTE2LCBidWZmZXIpXG5cbiAgICAvL1xuXG4gICAgY29uc3QgZnJhbWVUaW1lID0gc3RhdGUudGltZS5nZXRGcmFtZVRpbWUoKVxuICAgIGNvbnN0IGZwcyA9IE1hdGgucm91bmQoMTAwMCAvIGZyYW1lVGltZSlcbiAgICBjb25zdCBmcHNUZXh0ID0gYCR7ZnBzfSBmcHMgKCR7ZnJhbWVUaW1lLnRvRml4ZWQoMSl9bXMpYFxuXG4gICAgZGVidWdUZXh0ID0gW2Zwc1RleHQsIHBtb2RlXVxuXG4gICAgZGVidWdIZWxwZXIudXBkYXRlKHN0YXRlKVxuICB9XG5cbiAgY29uc3QgcXVpdCA9IGFzeW5jIChzdGF0ZTogU3RhdGUpID0+IHtcbiAgICBpc0FjdGl2ZSA9IGZhbHNlXG4gIH1cblxuICBjb25zdCBzZXRBY3RpdmUgPSAoYWN0aXZlOiBib29sZWFuKSA9PiB7XG4gICAgaXNBY3RpdmUgPSBhY3RpdmVcbiAgfVxuXG4gIHJldHVybiB7IGluaXQsIHVwZGF0ZSwgcXVpdCwgc2V0QWN0aXZlIH1cbn1cblxudHlwZSBIc2xhMTYgPSB7XG4gIHdpZHRoOiBudW1iZXJcbiAgaGVpZ2h0OiBudW1iZXJcbiAgZGF0YTogVWludDE2QXJyYXlcbn1cblxuY29uc3QgaE1hc2sgPSAwYjExMTEwMDAwMDAwMDAwMDBcbmNvbnN0IHNNYXNrID0gMGIwMDAwMTExMTAwMDAwMDAwXG5jb25zdCBsTWFzayA9IDBiMDAwMDAwMDAxMTExMDAwMFxuY29uc3QgYU1hc2sgPSAwYjAwMDAwMDAwMDAwMDExMTFcblxuY29uc3QgY3JlYXRlSHNsYUNvbG9yID0gKGg6IG51bWJlciwgczogbnVtYmVyLCBsOiBudW1iZXIsIGEgPSAxNSk6IG51bWJlciA9PlxuICAoaCA8PCAxMikgfCAocyA8PCA4KSB8IChsIDw8IDQpIHwgYVxuXG5cbi8vXG5cbmNvbnN0IGh3aGl0ZSA9IGNyZWF0ZUhzbGFDb2xvcigwLCAwLCAxNSlcbmNvbnN0IGhtaWRncmV5ID0gY3JlYXRlSHNsYUNvbG9yKDAsIDAsIDgpXG5jb25zdCBoYmxhY2sgPSBjcmVhdGVIc2xhQ29sb3IoMCwgMCwgMClcblxuLy9cblxuY29uc3QgaHNsYUNvbG9yVG9UdXBsZSA9IChjb2xvcjogbnVtYmVyKTogVDQgPT4gW1xuICAoY29sb3IgJiBoTWFzaykgPj4gMTIsXG4gIChjb2xvciAmIHNNYXNrKSA+PiA4LFxuICAoY29sb3IgJiBsTWFzaykgPj4gNCxcbiAgY29sb3IgJiBhTWFza1xuXVxuXG5jb25zdCBjcmVhdGVIc2xhMTYgPSAod2lkdGg6IG51bWJlciwgaGVpZ2h0OiBudW1iZXIpOiBIc2xhMTYgPT4ge1xuICBjb25zdCBzaXplID0gd2lkdGggKiBoZWlnaHRcbiAgY29uc3QgZGF0YSA9IG5ldyBVaW50MTZBcnJheShzaXplKVxuXG4gIHJldHVybiB7IHdpZHRoLCBoZWlnaHQsIGRhdGEgfVxufVxuXG5jb25zdCB0b3RhbEhzbGEgPSAxNiAqKiA0XG5cbmNvbnN0IGhzbGFUb1JnYmFMdXQgPSBuZXcgVWludDMyQXJyYXkodG90YWxIc2xhKVxuXG5mb3IgKGxldCBpID0gMDsgaSA8IHRvdGFsSHNsYTsgaSsrKSB7XG4gIGxldCBbaCwgcywgbCwgYV0gPSBoc2xhQ29sb3JUb1R1cGxlKGkpXG5cbiAgaCAvPSAxNVxuICBzIC89IDE1XG4gIGwgLz0gMTVcbiAgYSAqPSAxNyAvLyAvPSAxNSAqIDI1NVxuXG4gIGNvbnN0IFtyLCBnLCBiXSA9IGhzbFRvUmdiKFtoLCBzLCBsXSlcblxuICBjb25zdCByZ2JhQ29sb3IgPSBjcmVhdGVDb2xvcihyLCBnLCBiLCBhKVxuXG4gIGhzbGFUb1JnYmFMdXRbaV0gPSByZ2JhQ29sb3Jcbn1cblxuY29uc3QgYmxpdEhzbGEgPSAoXG4gIHNyYzogSHNsYTE2LCBkZXN0OiBJbWFnZURhdGEsXG4gIHRyYW5zZmVyOiBUNiA9IFswLCAwLCBzcmMud2lkdGgsIHNyYy5oZWlnaHQsIDAsIDBdXG4pID0+IHtcbiAgY29uc3QgW3N4LCBzeSwgc3csIHNoLCBkeCwgZHldID0gY2xhbXBUcmFuc2ZlcihcbiAgICBzcmMud2lkdGgsIHNyYy5oZWlnaHQsIGRlc3Qud2lkdGgsIGRlc3QuaGVpZ2h0LCB0cmFuc2ZlclxuICApXG5cbiAgY29uc3QgZGVzdFZpZXcgPSBuZXcgVWludDMyQXJyYXkoZGVzdC5kYXRhLmJ1ZmZlcilcblxuICBmb3IgKGxldCB5ID0gMDsgeSA8IHNoOyB5KyspIHtcbiAgICBmb3IgKGxldCB4ID0gMDsgeCA8IHN3OyB4KyspIHtcbiAgICAgIGNvbnN0IHNyY0luZGV4ID0geCArIHN4ICsgKHkgKyBzeSkgKiBzcmMud2lkdGhcbiAgICAgIGNvbnN0IGRlc3RJbmRleCA9IHggKyBkeCArICh5ICsgZHkpICogZGVzdC53aWR0aFxuXG4gICAgICBjb25zdCBoc2xhQ29sb3IgPSBzcmMuZGF0YVtzcmNJbmRleF1cbiAgICAgIGNvbnN0IHJnYmFDb2xvciA9IGhzbGFUb1JnYmFMdXRbaHNsYUNvbG9yXVxuXG4gICAgICBkZXN0Vmlld1tkZXN0SW5kZXhdID0gcmdiYUNvbG9yXG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIGRlc3Rcbn1cblxuY29uc3QgZmxvb2RGaWxsID0gKGRlc3Q6IEhzbGExNiwgY29sb3I6IG51bWJlciwgeDogbnVtYmVyLCB5OiBudW1iZXIpID0+IHtcbiAgY29uc3QgcHRzOiBUM1tdID0gW11cbiAgY29uc3Qgc2VlbiA9IG5ldyBTZXQ8bnVtYmVyPigpXG5cbiAgaWYgKHggPCAwIHx8IHggPj0gZGVzdC53aWR0aCB8fCB5IDwgMCB8fCB5ID49IGRlc3QuaGVpZ2h0KSByZXR1cm4gcHRzXG5cbiAgY29uc3QgaW5kZXggPSB5ICogZGVzdC53aWR0aCArIHhcblxuICBjb25zdCBvbGRDb2xvciA9IGRlc3QuZGF0YVtpbmRleF1cblxuICBpZiAob2xkQ29sb3IgPT09IGNvbG9yKSByZXR1cm4gcHRzXG5cbiAgY29uc3QgcXVldWU6IFQyW10gPSBbXVxuXG4gIHF1ZXVlLnB1c2goW3gsIHldKVxuXG4gIHdoaWxlIChxdWV1ZS5sZW5ndGggPiAwKSB7XG4gICAgY29uc3QgW2N4LCBjeV0gPSBxdWV1ZS5zaGlmdCgpIVxuXG4gICAgaWYgKGN4IDwgMCB8fCBjeCA+PSBkZXN0LndpZHRoIHx8IGN5IDwgMCB8fCBjeSA+PSBkZXN0LmhlaWdodCkgY29udGludWVcblxuICAgIGNvbnN0IGluZGV4ID0gY3kgKiBkZXN0LndpZHRoICsgY3hcblxuICAgIGlmIChzZWVuLmhhcyhpbmRleCkpIGNvbnRpbnVlXG4gICAgaWYgKGRlc3QuZGF0YVtpbmRleF0gIT09IG9sZENvbG9yKSBjb250aW51ZVxuXG4gICAgcHRzLnB1c2goW2N4LCBjeSwgY29sb3JdKVxuICAgIHNlZW4uYWRkKGluZGV4KVxuXG4gICAgcXVldWUucHVzaChbY3gsIGN5IC0gMV0pXG4gICAgcXVldWUucHVzaChbY3ggKyAxLCBjeV0pXG4gICAgcXVldWUucHVzaChbY3gsIGN5ICsgMV0pXG4gICAgcXVldWUucHVzaChbY3ggLSAxLCBjeV0pXG4gIH1cblxuICByZXR1cm4gcHRzXG59Il19