import { render } from '../lib/engine.js';
import { colorToRgb, createColor, createColor24 } from '../lib/image/color.js';
import { createImage } from '../lib/image/create.js';
import { fill } from '../lib/image/fill.js';
import { loadImage } from '../lib/image/load.js';
import { resize } from '../lib/image/resize.js';
import { maybe } from '../lib/util.js';
import { generatePalette, indexOfClosestRgb } from '../sandbox/generate-palette.js';
// experimenting with indexed palette
export const paletteSandboxScene = () => {
    let palette = null;
    let testImage = null;
    // these naive luts are slow to generate and take a lot of memory, but they
    // serve as a good reference implementation and baseline for performance
    // comparisons
    //
    // 16mb!
    let naiveLut = null;
    // 64mb!
    let naiveLut32 = null;
    // testing an idea
    // also 16mb
    let naiveLut2 = null;
    let pal2 = null;
    let naive2Lut32 = null;
    const createPalImage = (pal, w, h) => {
        const palImage = createImage(w, h);
        fill(palImage, createColor(0x00, 0xff, 0xff));
        for (let y = 0; y < h; y++) {
            const row = y * w;
            for (let x = 0; x < w; x++) {
                const index = row + x;
                const palIndex = index * 3;
                if (palIndex >= pal.data.length) {
                    break;
                }
                const r = pal.data[palIndex];
                const g = pal.data[palIndex + 1];
                const b = pal.data[palIndex + 2];
                const imgIndex = index * 4;
                palImage.data[imgIndex] = r;
                palImage.data[imgIndex + 1] = g;
                palImage.data[imgIndex + 2] = b;
                palImage.data[imgIndex + 3] = 255;
            }
        }
        return palImage;
    };
    const createPal2Image = (pal, w, h) => {
        if (pal.length > w * h) {
            throw Error('Palette is too large for image');
        }
        const palImage = createImage(w, h);
        fill(palImage, createColor(0x00, 0xff, 0xff));
        pal = pal.map(color => color | 0xff000000);
        const view = new Uint32Array(palImage.data.buffer);
        view.set(pal);
        return palImage;
    };
    const init = async (state) => {
        const buffer = state.view.getBuffer();
        fill(buffer, createColor(0x00, 0x00, 0x00));
        console.log('starting init');
        const { width, height } = buffer;
        const progressBarWidth = Math.floor(width * 0.8);
        const progressBarX = Math.floor(width * 0.1);
        const progressBarY = Math.floor(height * 0.5);
        const progressBarHeight = 2;
        const progress = (total) => {
            const step = progressBarWidth / total;
            return (i) => {
                fill(buffer, createColor(0x66, 0x66, 0x66), [progressBarX, progressBarY, progressBarWidth, progressBarHeight]);
                const width = Math.round(step * i);
                fill(buffer, createColor(0x33, 0x99, 0xff), [progressBarX, progressBarY, width, progressBarHeight]);
                render();
            };
        };
        // reserve one color for eg transparent
        palette = generatePalette(255, 12, 4, 5);
        // just log the metadata
        const noEntries = {
            ...palette,
            data: undefined
        };
        console.log(noEntries);
        testImage = await loadImage('scenes/pal/colors.png');
        const palColors = [];
        for (let i = 0; i < palette.entryCount; i++) {
            const r = palette.data[i * 3];
            const g = palette.data[i * 3 + 1];
            const b = palette.data[i * 3 + 2];
            const color24 = createColor24(r, g, b);
            palColors.push([color24, i]);
        }
        palColors.sort((a, b) => a[0] - b[0]);
        console.log('palColors', palColors);
        const palMapNewToOld = Array(palette.entryCount);
        const palMapOldToNew = Array(palette.entryCount);
        for (let i = 0; i < palColors.length; i++) {
            const oldIndex = palColors[i][1];
            palMapNewToOld[i] = oldIndex;
            palMapOldToNew[oldIndex] = i;
        }
        pal2 = new Uint32Array(palette.entryCount);
        for (let i = 0; i < palette.entryCount; i++) {
            pal2[i] = palColors[i][0];
        }
        console.log('pal2', pal2);
        naive2Lut32 = new Uint32Array(palette.entryCount);
        for (let i = 0; i < palette.entryCount; i++) {
            const r = palette.data[i * 3];
            const g = palette.data[i * 3 + 1];
            const b = palette.data[i * 3 + 2];
            const color = createColor(r, g, b);
            naive2Lut32[i] = color;
        }
        // 
        const numColors24 = 0xffffff;
        const rValues = new Set();
        const gValues = new Set();
        const bValues = new Set();
        const cValues = new Set();
        const stepCount = 10;
        const p = progress(stepCount);
        console.log('generated palette lookups');
        p(0);
        await render();
        const pstep = numColors24 / stepCount;
        let cstep = pstep;
        let pval = 0;
        const nlutStart = performance.now();
        naiveLut = new Uint8Array(numColors24);
        naiveLut32 = new Uint32Array(numColors24);
        naiveLut2 = new Uint8Array(numColors24);
        for (let i = 0; i < 0xffffff; i++) {
            const [r, g, b] = colorToRgb(i);
            const index = indexOfClosestRgb(palette, [r, g, b]);
            naiveLut[i] = index;
            naiveLut2[i] = palMapOldToNew[index];
            const palR = palette.data[index * 3];
            const palG = palette.data[index * 3 + 1];
            const palB = palette.data[index * 3 + 2];
            rValues.add(palR);
            gValues.add(palG);
            bValues.add(palB);
            cValues.add(palR);
            cValues.add(palG);
            cValues.add(palB);
            const color = createColor(palR, palG, palB);
            naiveLut32[i] = color;
            if (i >= cstep) {
                cstep += pstep;
                pval++;
                p(pval);
                await render();
            }
        }
        const nlutEnd = performance.now();
        console.log('Naive LUTs Time:', nlutEnd - nlutStart);
        console.log('Naive LUT', naiveLut);
        console.log('Naive LUT 2', naiveLut2);
        //
        const rArr = Array.from(rValues);
        const gArr = Array.from(gValues);
        const bArr = Array.from(bValues);
        const cArr = Array.from(cValues);
        rArr.sort((a, b) => a - b);
        gArr.sort((a, b) => a - b);
        bArr.sort((a, b) => a - b);
        cArr.sort((a, b) => a - b);
        console.log('rArr', rArr);
        console.log('gArr', gArr);
        console.log('bArr', bArr);
        console.log('cArr', cArr);
        //
        // naiveLut is a mapping where the index is the 24 bit rgb value and the
        // value is the index of the closest color in the palette
        //
        // consecutive 24 bit indices all point to the same palette index in runs
        // we could compress the structure like so:
        // 
        // we use a Uint32Array to store two fields:
        // 1. the 24 bit value that is the *end* of the row of consecutive indices
        // 2. the 8 bit palette index
        //
        // then, to map rgb to index, you search through each field to find the 
        // first end of row which is greater than or equal to the rgb value
        // and return the palette index
        // it will be a bit slower than eg naiveLut32 which is the fastest, but 
        // that structure is ~64mb
        let prev = -1;
        let rowCount = 0;
        for (let i = 0; i < numColors24; i++) {
            const value = naiveLut[i];
            if (value !== prev) {
                rowCount++;
            }
            prev = value;
        }
        // it will have rowCount rows
        console.log('rowcount:', rowCount, 'bytes:', rowCount * 4);
        //
        createNewLutThing(palette);
    };
    let isDisableUpdate = false;
    const update = (state) => {
        if (!maybe(palette))
            throw Error('Palette not generated');
        if (!maybe(testImage))
            throw Error('Test image not loaded');
        if (!maybe(naiveLut))
            throw Error('Naive LUT not generated');
        if (!maybe(naiveLut32))
            throw Error('Naive LUT32 not generated');
        if (!maybe(naiveLut2))
            throw Error('Naive LUT2 not generated');
        if (!maybe(pal2))
            throw Error('Pal2 not generated');
        if (!maybe(naive2Lut32))
            throw Error('Naive2 LUT32 not generated');
        // temp 
        if (isDisableUpdate)
            return;
        // handle io
        const wheel = state.mouse.takeWheel();
        const zoom = state.view.getZoom();
        if (wheel < 0) {
            state.view.setZoom(zoom + 1);
        }
        else if (wheel > 0) {
            state.view.setZoom(zoom - 1);
        }
        const keys = state.getKeys();
        if (keys['Escape']) {
            state.setRunning(false);
            // consume the key
            keys['Escape'] = false;
            return;
        }
        //
        const buffer = state.view.getBuffer();
        fill(buffer, createColor(0x00, 0x00, 0x00));
        logOnce('bufferPixels', 'Buffer pixels:', buffer.width * buffer.height);
        // could optimize by doing this in init, but the scene easily hits 60fps
        // and it's just a sandbox
        // palette stuff
        const numPals = 2;
        //
        const palWidth = palette.lightRange;
        const palHeight = Math.ceil(palette.entryCount / palWidth);
        //
        const palImage = createPalImage(palette, palWidth, palHeight);
        const newHeight = buffer.height;
        const scale = newHeight / palHeight;
        const newWidth = Math.floor(palWidth * scale);
        resize(palImage, buffer, [0, 0, palWidth, palHeight], [0, 0, newWidth, newHeight]);
        //
        const pal2Image = createPal2Image(pal2, palWidth, palHeight);
        resize(pal2Image, buffer, [0, 0, palWidth, palHeight], [newWidth, 0, newWidth, newHeight]);
        //
        const palsWidth = newWidth * numPals;
        //
        const remainingWidth = buffer.width - palsWidth;
        //
        const imageCount = 5;
        // make space for images side by side
        const imageWidths = Math.floor(remainingWidth / imageCount);
        // next we'll try converting an image to palette and show the original
        // and converted side by side, then we can start experimenting with
        // creating a LUT
        const newOrigWidth = imageWidths;
        const scaleOrig = newOrigWidth / testImage.width;
        const newOrigHeight = Math.floor(testImage.height * scaleOrig);
        resize(testImage, buffer, [0, 0, testImage.width, testImage.height], [palsWidth, 0, newOrigWidth, newOrigHeight]);
        const colorsOrig = countUniqueColors(testImage);
        logOnce('colorsOrig', 'Unique colors in original image:', colorsOrig);
        // slow indexed conversion, direct search
        const startConv0Time = performance.now();
        const indexed = toPalette(testImage, palette);
        const endConv0Time = performance.now();
        const colorsIndexed = countUniqueColors(indexed);
        logOnce('conv0', 'Conversion 0 time:', endConv0Time - startConv0Time, 'Pixel count:', testImage.width * testImage.height, 'Unique colors:', colorsIndexed);
        resize(indexed, buffer, [0, 0, indexed.width, indexed.height], [palsWidth + newOrigWidth, 0, newOrigWidth, newOrigHeight]);
        // LUT experiments
        const startConv1Time = performance.now();
        const indexedLut = toPaletteLut(testImage, palette, naiveLut);
        const endConv1Time = performance.now();
        const colorsLut = countUniqueColors(indexedLut);
        logOnce('conv1', 'Conversion 1 time:', endConv1Time - startConv1Time, 'Pixel count:', testImage.width * testImage.height, 'Unique colors:', colorsLut);
        resize(indexedLut, buffer, [0, 0, indexedLut.width, indexedLut.height], [palsWidth + newOrigWidth * 2, 0, newOrigWidth, newOrigHeight]);
        //
        const startConv2Time = performance.now();
        const indexedLut32 = toPaletteLut32(testImage, naiveLut32);
        const endConv2Time = performance.now();
        const colorsLut32 = countUniqueColors(indexedLut32);
        logOnce('conv2', 'Conversion 2 time:', endConv2Time - startConv2Time, 'Pixel count:', testImage.width * testImage.height, 'Unique colors:', colorsLut32);
        resize(indexedLut32, buffer, [0, 0, indexedLut32.width, indexedLut32.height], [palsWidth + newOrigWidth * 3, 0, newOrigWidth, newOrigHeight]);
        // 
        const startLut2Time = performance.now();
        const { chCount, channelLookup, table } = createNewLutThing(palette);
        const endLut2Time = performance.now();
        logOnce('lut2', 'LUT 2 time:', endLut2Time - startLut2Time, 'Table size:', table.byteLength);
        const startConv3Time = performance.now();
        const indexedLookup2 = toPaletteLookup3(testImage, naive2Lut32, chCount, channelLookup, table);
        const endConv3Time = performance.now();
        const colorsLookup2 = countUniqueColors(indexedLookup2);
        logOnce('conv3', 'Conversion 3 time:', endConv3Time - startConv3Time, 'Pixel count:', testImage.width * testImage.height, 'Unique colors:', colorsLookup2);
        resize(indexedLookup2, buffer, [0, 0, indexedLookup2.width, indexedLookup2.height], [palsWidth + newOrigWidth * 4, 0, newOrigWidth, newOrigHeight]);
    };
    const quit = async (_state) => {
        palette = null;
    };
    return { init, update, quit };
};
const seen = new Set();
const logOnce = (id, ...args) => {
    if (seen.has(id))
        return;
    seen.add(id);
    console.log(...args);
};
const toPalette = (image, palette) => {
    const newImage = createImage(image.width, image.height);
    //
    for (let y = 0; y < image.height; y++) {
        const row = y * image.width;
        for (let x = 0; x < image.width; x++) {
            const index = row + x;
            const dataIndex = index * 4;
            const or = image.data[dataIndex];
            const og = image.data[dataIndex + 1];
            const ob = image.data[dataIndex + 2];
            const palIndex = indexOfClosestRgb(palette, [or, og, ob]);
            const pr = palette.data[palIndex * 3];
            const pg = palette.data[palIndex * 3 + 1];
            const pb = palette.data[palIndex * 3 + 2];
            newImage.data[dataIndex] = pr;
            newImage.data[dataIndex + 1] = pg;
            newImage.data[dataIndex + 2] = pb;
            newImage.data[dataIndex + 3] = 255;
        }
    }
    //
    return newImage;
};
const toPaletteLut = (image, palette, lut) => {
    const newImage = createImage(image.width, image.height);
    //
    for (let y = 0; y < image.height; y++) {
        const row = y * image.width;
        for (let x = 0; x < image.width; x++) {
            const index = row + x;
            const dataIndex = index * 4;
            const or = image.data[dataIndex];
            const og = image.data[dataIndex + 1];
            const ob = image.data[dataIndex + 2];
            const lutIndex = createColor24(or, og, ob);
            const palIndex = lut[lutIndex];
            const pr = palette.data[palIndex * 3];
            const pg = palette.data[palIndex * 3 + 1];
            const pb = palette.data[palIndex * 3 + 2];
            newImage.data[dataIndex] = pr;
            newImage.data[dataIndex + 1] = pg;
            newImage.data[dataIndex + 2] = pb;
            newImage.data[dataIndex + 3] = 255;
        }
    }
    //
    return newImage;
};
const toPaletteLut32 = (src, lut) => {
    const newImage = createImage(src.width, src.height);
    const size = src.width * src.height;
    const srcView = new Uint32Array(src.data.buffer);
    const destView = new Uint32Array(newImage.data.buffer);
    //
    for (let i = 0; i < size; i++) {
        const rgba = srcView[i];
        const rgb = rgba & 0x00ffffff;
        destView[i] = lut[rgb];
    }
    //
    return newImage;
};
// this is the winner for several reasons:
// a) it's by far the fastest due to small table size helping with cache 
//    locality, even though the arithmetic is more complex than eg toPaletteLut32
// b) it uses the least memory, ~60kb compared to eg 16MB or 64MB for the other
//    luts
// c) it produces slightly better results, eg less information is lost in the 
//    resultant output image
const toPaletteLookup3 = (src, colors, chCount, channelLookup, table) => {
    const dest = createImage(src.width, src.height);
    const destView = new Uint32Array(dest.data.buffer);
    //
    const rOffsetSize = chCount * chCount;
    for (let y = 0; y < src.height; y++) {
        const row = y * src.width;
        for (let x = 0; x < src.width; x++) {
            const index = row + x;
            const dataIndex = index * 4;
            const or = src.data[dataIndex];
            const og = src.data[dataIndex + 1];
            const ob = src.data[dataIndex + 2];
            const ri = channelLookup[or];
            const gi = channelLookup[og];
            const bi = channelLookup[ob];
            const riOffset = ri * rOffsetSize;
            const giOffset = gi * chCount;
            const lookup = bi + giOffset + riOffset;
            const closest = table[lookup];
            destView[index] = colors[closest] | 0xff000000;
        }
    }
    //
    return dest;
};
/*
  ok new strategy

  1. generate a palette
  2. for every color, get the three channels and add their values to a set
  3. at the end, you have a set of values for every possible channel value
     eg for our 12/4/5 hue generated palette of 255 colors, there are 38 unique
     values for every channel
  4. create a lookup table with 0..255 indices, and the nearest match from our
     set
  5. experiment - one we reconstruct a color from an unindexed image, is every
     value present in our palette?

  In our example with 38 unique values, there are 38**3 (54,872) possible
  colors, a lot less than our 16 million colorspace

  First, convert raw r, g, b into range 0..37 matching to index of closest value
  in the set

  So you can make a lookup table which is a Uint8Array of 38**3 entries

  You can index into it by:

  r [0..37]
  g [0..37]
  b [0..37]

  const index = ( r * 38 * 38 ) + ( g * 38 ) + b

  with each index pointing to a palette index
*/
const nearestMatch = (values, value) => {
    let closest = values[0];
    let closestDist = Math.abs(value - closest);
    for (let i = 1; i < values.length; i++) {
        const dist = Math.abs(value - values[i]);
        if (dist < closestDist) {
            closest = values[i];
            closestDist = dist;
        }
    }
    return closest;
};
const createNewLutThing = (palette) => {
    const channelSet = new Set();
    for (let i = 0; i < palette.entryCount; i++) {
        channelSet.add(palette.data[i * 3]);
        channelSet.add(palette.data[i * 3 + 1]);
        channelSet.add(palette.data[i * 3 + 2]);
    }
    const values = Array.from(channelSet).sort((a, b) => a - b);
    const chCount = values.length;
    const channelLookup = new Uint8Array(256);
    for (let i = 0; i < 256; i++) {
        const closest = nearestMatch(values, i);
        channelLookup[i] = values.indexOf(closest);
    }
    const tableSize = chCount ** 3;
    const table = new Uint8Array(tableSize);
    const rSize = chCount * chCount;
    for (let ri = 0; ri < chCount; ri++) {
        const riOffset = ri * rSize;
        for (let gi = 0; gi < chCount; gi++) {
            const giOffset = gi * chCount + riOffset;
            for (let bi = 0; bi < chCount; bi++) {
                const index = bi + giOffset;
                const r = values[ri];
                const g = values[gi];
                const b = values[bi];
                const closest = indexOfClosestRgb(palette, [r, g, b]);
                table[index] = closest;
            }
        }
    }
    return { chCount, channelLookup, table };
};
const countUniqueColors = (image) => {
    const set = new Set();
    const imageView = new Uint32Array(image.data.buffer);
    for (let i = 0; i < imageView.length; i++) {
        set.add(imageView[i]);
    }
    return set.size;
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicGFsZXR0ZS1zY2VuZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy9zY2VuZXMvcGFsZXR0ZS1zY2VuZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxPQUFPLEVBQUUsTUFBTSxFQUFFLE1BQU0sa0JBQWtCLENBQUE7QUFDekMsT0FBTyxFQUFFLFVBQVUsRUFBRSxXQUFXLEVBQUUsYUFBYSxFQUFFLE1BQU0sdUJBQXVCLENBQUE7QUFDOUUsT0FBTyxFQUFFLFdBQVcsRUFBRSxNQUFNLHdCQUF3QixDQUFBO0FBQ3BELE9BQU8sRUFBRSxJQUFJLEVBQUUsTUFBTSxzQkFBc0IsQ0FBQTtBQUMzQyxPQUFPLEVBQUUsU0FBUyxFQUFFLE1BQU0sc0JBQXNCLENBQUE7QUFDaEQsT0FBTyxFQUFFLE1BQU0sRUFBRSxNQUFNLHdCQUF3QixDQUFBO0FBRS9DLE9BQU8sRUFBRSxLQUFLLEVBQUUsTUFBTSxnQkFBZ0IsQ0FBQTtBQUV0QyxPQUFPLEVBQ2EsZUFBZSxFQUNqQyxpQkFBaUIsRUFDbEIsTUFBTSxnQ0FBZ0MsQ0FBQTtBQUV2QyxxQ0FBcUM7QUFDckMsTUFBTSxDQUFDLE1BQU0sbUJBQW1CLEdBQUcsR0FBVSxFQUFFO0lBQzdDLElBQUksT0FBTyxHQUE0QixJQUFJLENBQUE7SUFDM0MsSUFBSSxTQUFTLEdBQXFCLElBQUksQ0FBQTtJQUV0QywyRUFBMkU7SUFDM0Usd0VBQXdFO0lBQ3hFLGNBQWM7SUFDZCxFQUFFO0lBQ0YsUUFBUTtJQUNSLElBQUksUUFBUSxHQUFzQixJQUFJLENBQUE7SUFDdEMsUUFBUTtJQUNSLElBQUksVUFBVSxHQUF1QixJQUFJLENBQUE7SUFFekMsa0JBQWtCO0lBQ2xCLFlBQVk7SUFDWixJQUFJLFNBQVMsR0FBc0IsSUFBSSxDQUFBO0lBQ3ZDLElBQUksSUFBSSxHQUF1QixJQUFJLENBQUE7SUFDbkMsSUFBSSxXQUFXLEdBQXVCLElBQUksQ0FBQTtJQUUxQyxNQUFNLGNBQWMsR0FBRyxD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IGZyb20gJy4uL2xpYi9lbmdpbmUuanMnXHJcbmltcG9ydCB7IGNvbG9yVG9SZ2IsIGNyZWF0ZUNvbG9yLCBjcmVhdGVDb2xvcjI0IH0gZnJvbSAnLi4vbGliL2ltYWdlL2NvbG9yLmpzJ1xyXG5pbXBvcnQgeyBjcmVhdGVJbWFnZSB9IGZyb20gJy4uL2xpYi9pbWFnZS9jcmVhdGUuanMnXHJcbmltcG9ydCB7IGZpbGwgfSBmcm9tICcuLi9saWIvaW1hZ2UvZmlsbC5qcydcclxuaW1wb3J0IHsgbG9hZEltYWdlIH0gZnJvbSAnLi4vbGliL2ltYWdlL2xvYWQuanMnXHJcbmltcG9ydCB7IHJlc2l6ZSB9IGZyb20gJy4uL2xpYi9pbWFnZS9yZXNpemUuanMnXHJcbmltcG9ydCB7IE1heWJlLCBTY2VuZSwgU3RhdGUsIFQyIH0gZnJvbSAnLi4vbGliL3R5cGVzLmpzJ1xyXG5pbXBvcnQgeyBtYXliZSB9IGZyb20gJy4uL2xpYi91dGlsLmpzJ1xyXG5cclxuaW1wb3J0IHtcclxuICBHZW5lcmF0ZWRQYWxldHRlLCBnZW5lcmF0ZVBhbGV0dGUsXHJcbiAgaW5kZXhPZkNsb3Nlc3RSZ2JcclxufSBmcm9tICcuLi9zYW5kYm94L2dlbmVyYXRlLXBhbGV0dGUuanMnXHJcblxyXG4vLyBleHBlcmltZW50aW5nIHdpdGggaW5kZXhlZCBwYWxldHRlXHJcbmV4cG9ydCBjb25zdCBwYWxldHRlU2FuZGJveFNjZW5lID0gKCk6IFNjZW5lID0+IHtcclxuICBsZXQgcGFsZXR0ZTogTWF5YmU8R2VuZXJhdGVkUGFsZXR0ZT4gPSBudWxsXHJcbiAgbGV0IHRlc3RJbWFnZTogTWF5YmU8SW1hZ2VEYXRhPiA9IG51bGxcclxuXHJcbiAgLy8gdGhlc2UgbmFpdmUgbHV0cyBhcmUgc2xvdyB0byBnZW5lcmF0ZSBhbmQgdGFrZSBhIGxvdCBvZiBtZW1vcnksIGJ1dCB0aGV5XHJcbiAgLy8gc2VydmUgYXMgYSBnb29kIHJlZmVyZW5jZSBpbXBsZW1lbnRhdGlvbiBhbmQgYmFzZWxpbmUgZm9yIHBlcmZvcm1hbmNlXHJcbiAgLy8gY29tcGFyaXNvbnNcclxuICAvL1xyXG4gIC8vIDE2bWIhXHJcbiAgbGV0IG5haXZlTHV0OiBNYXliZTxVaW50OEFycmF5PiA9IG51bGxcclxuICAvLyA2NG1iIVxyXG4gIGxldCBuYWl2ZUx1dDMyOiBNYXliZTxVaW50MzJBcnJheT4gPSBudWxsXHJcblxyXG4gIC8vIHRlc3RpbmcgYW4gaWRlYVxyXG4gIC8vIGFsc28gMTZtYlxyXG4gIGxldCBuYWl2ZUx1dDI6IE1heWJlPFVpbnQ4QXJyYXk+ID0gbnVsbFxyXG4gIGxldCBwYWwyOiBNYXliZTxVaW50MzJBcnJheT4gPSBudWxsXHJcbiAgbGV0IG5haXZlMkx1dDMyOiBNYXliZTxVaW50MzJBcnJheT4gPSBudWxsXHJcblxyXG4gIGNvbnN0IGNyZWF0ZVBhbEltYWdlID0gKFxyXG4gICAgcGFsOiBHZW5lcmF0ZWRQYWxldHRlLCB3OiBudW1iZXIsIGg6IG51bWJlclxyXG4gICkgPT4ge1xyXG4gICAgY29uc3QgcGFsSW1hZ2UgPSBjcmVhdGVJbWFnZSh3LCBoKVxyXG5cclxuICAgIGZpbGwocGFsSW1hZ2UsIGNyZWF0ZUNvbG9yKDB4MDAsIDB4ZmYsIDB4ZmYpKVxyXG5cclxuICAgIGZvciAobGV0IHkgPSAwOyB5IDwgaDsgeSsrKSB7XHJcbiAgICAgIGNvbnN0IHJvdyA9IHkgKiB3XHJcbiAgICAgIGZvciAobGV0IHggPSAwOyB4IDwgdzsgeCsrKSB7XHJcbiAgICAgICAgY29uc3QgaW5kZXggPSByb3cgKyB4XHJcbiAgICAgICAgY29uc3QgcGFsSW5kZXggPSBpbmRleCAqIDNcclxuXHJcbiAgICAgICAgaWYgKHBhbEluZGV4ID49IHBhbC5kYXRhLmxlbmd0aCkge1xyXG4gICAgICAgICAgYnJlYWtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGNvbnN0IHIgPSBwYWwuZGF0YVtwYWxJbmRleF1cclxuICAgICAgICBjb25zdCBnID0gcGFsLmRhdGFbcGFsSW5kZXggKyAxXVxyXG4gICAgICAgIGNvbnN0IGIgPSBwYWwuZGF0YVtwYWxJbmRleCArIDJdXHJcblxyXG4gICAgICAgIGNvbnN0IGltZ0luZGV4ID0gaW5kZXggKiA0XHJcblxyXG4gICAgICAgIHBhbEltYWdlLmRhdGFbaW1nSW5kZXhdID0gclxyXG4gICAgICAgIHBhbEltYWdlLmRhdGFbaW1nSW5kZXggKyAxXSA9IGdcclxuICAgICAgICBwYWxJbWFnZS5kYXRhW2ltZ0luZGV4ICsgMl0gPSBiXHJcbiAgICAgICAgcGFsSW1hZ2UuZGF0YVtpbWdJbmRleCArIDNdID0gMjU1XHJcbiAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gcGFsSW1hZ2VcclxuICB9XHJcblxyXG4gIGNvbnN0IGNyZWF0ZVBhbDJJbWFnZSA9IChcclxuICAgIHBhbDogVWludDMyQXJyYXksIHc6IG51bWJlciwgaDogbnVtYmVyXHJcbiAgKSA9PiB7XHJcbiAgICBpZiAocGFsLmxlbmd0aCA+IHcgKiBoKSB7XHJcbiAgICAgIHRocm93IEVycm9yKCdQYWxldHRlIGlzIHRvbyBsYXJnZSBmb3IgaW1hZ2UnKVxyXG4gICAgfVxyXG4gICAgY29uc3QgcGFsSW1hZ2UgPSBjcmVhdGVJbWFnZSh3LCBoKVxyXG5cclxuICAgIGZpbGwocGFsSW1hZ2UsIGNyZWF0ZUNvbG9yKDB4MDAsIDB4ZmYsIDB4ZmYpKVxyXG5cclxuICAgIHBhbCA9IHBhbC5tYXAoY29sb3IgPT4gY29sb3IgfCAweGZmMDAwMDAwKVxyXG5cclxuICAgIGNvbnN0IHZpZXcgPSBuZXcgVWludDMyQXJyYXkocGFsSW1hZ2UuZGF0YS5idWZmZXIpXHJcblxyXG4gICAgdmlldy5zZXQocGFsKVxyXG5cclxuICAgIHJldHVybiBwYWxJbWFnZVxyXG4gIH1cclxuXHJcbiAgY29uc3QgaW5pdCA9IGFzeW5jIChzdGF0ZTogU3RhdGUpID0+IHtcclxuICAgIGNvbnN0IGJ1ZmZlciA9IHN0YXRlLnZpZXcuZ2V0QnVmZmVyKClcclxuXHJcbiAgICBmaWxsKGJ1ZmZlciwgY3JlYXRlQ29sb3IoMHgwMCwgMHgwMCwgMHgwMCkpXHJcblxyXG4gICAgY29uc29sZS5sb2coJ3N0YXJ0aW5nIGluaXQnKVxyXG5cclxuICAgIGNvbnN0IHsgd2lkdGgsIGhlaWdodCB9ID0gYnVmZmVyXHJcblxyXG4gICAgY29uc3QgcHJvZ3Jlc3NCYXJXaWR0aCA9IE1hdGguZmxvb3Iod2lkdGggKiAwLjgpXHJcbiAgICBjb25zdCBwcm9ncmVzc0JhclggPSBNYXRoLmZsb29yKHdpZHRoICogMC4xKVxyXG4gICAgY29uc3QgcHJvZ3Jlc3NCYXJZID0gTWF0aC5mbG9vcihoZWlnaHQgKiAwLjUpXHJcbiAgICBjb25zdCBwcm9ncmVzc0JhckhlaWdodCA9IDJcclxuXHJcbiAgICBjb25zdCBwcm9ncmVzcyA9ICh0b3RhbDogbnVtYmVyKSA9PiB7XHJcbiAgICAgIGNvbnN0IHN0ZXAgPSBwcm9ncmVzc0JhcldpZHRoIC8gdG90YWxcclxuXHJcbiAgICAgIHJldHVybiAoaTogbnVtYmVyKSA9PiB7XHJcbiAgICAgICAgZmlsbChcclxuICAgICAgICAgIGJ1ZmZlcixcclxuICAgICAgICAgIGNyZWF0ZUNvbG9yKDB4NjYsIDB4NjYsIDB4NjYpLFxyXG4gICAgICAgICAgW3Byb2dyZXNzQmFyWCwgcHJvZ3Jlc3NCYXJZLCBwcm9ncmVzc0JhcldpZHRoLCBwcm9ncmVzc0JhckhlaWdodF1cclxuICAgICAgICApXHJcblxyXG4gICAgICAgIGNvbnN0IHdpZHRoID0gTWF0aC5yb3VuZChzdGVwICogaSlcclxuXHJcbiAgICAgICAgZmlsbChcclxuICAgICAgICAgIGJ1ZmZlcixcclxuICAgICAgICAgIGNyZWF0ZUNvbG9yKDB4MzMsIDB4OTksIDB4ZmYpLFxyXG4gICAgICAgICAgW3Byb2dyZXNzQmFyWCwgcHJvZ3Jlc3NCYXJZLCB3aWR0aCwgcHJvZ3Jlc3NCYXJIZWlnaHRdXHJcbiAgICAgICAgKVxyXG5cclxuICAgICAgICByZW5kZXIoKVxyXG4gICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgLy8gcmVzZXJ2ZSBvbmUgY29sb3IgZm9yIGVnIHRyYW5zcGFyZW50XHJcbiAgICBwYWxldHRlID0gZ2VuZXJhdGVQYWxldHRlKDI1NSwgMTIsIDQsIDUpXHJcblxyXG4gICAgLy8ganVzdCBsb2cgdGhlIG1ldGFkYXRhXHJcbiAgICBjb25zdCBub0VudHJpZXMgPSB7XHJcbiAgICAgIC4uLnBhbGV0dGUsXHJcbiAgICAgIGRhdGE6IHVuZGVmaW5lZFxyXG4gICAgfVxyXG5cclxuICAgIGNvbnNvbGUubG9nKG5vRW50cmllcylcclxuXHJcbiAgICB0ZXN0SW1hZ2UgPSBhd2FpdCBsb2FkSW1hZ2UoJ3NjZW5lcy9wYWwvY29sb3JzLnBuZycpXHJcblxyXG4gICAgY29uc3QgcGFsQ29sb3JzOiBUMltdID0gW11cclxuXHJcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHBhbGV0dGUuZW50cnlDb3VudDsgaSsrKSB7XHJcbiAgICAgIGNvbnN0IHIgPSBwYWxldHRlLmRhdGFbaSAqIDNdXHJcbiAgICAgIGNvbnN0IGcgPSBwYWxldHRlLmRhdGFbaSAqIDMgKyAxXVxyXG4gICAgICBjb25zdCBiID0gcGFsZXR0ZS5kYXRhW2kgKiAzICsgMl1cclxuXHJcbiAgICAgIGNvbnN0IGNvbG9yMjQgPSBjcmVhdGVDb2xvcjI0KHIsIGcsIGIpXHJcblxyXG4gICAgICBwYWxDb2xvcnMucHVzaChbY29sb3IyNCwgaV0pXHJcbiAgICB9XHJcblxyXG4gICAgcGFsQ29sb3JzLnNvcnQoKGEsIGIpID0+IGFbMF0gLSBiWzBdKVxyXG5cclxuICAgIGNvbnNvbGUubG9nKCdwYWxDb2xvcnMnLCBwYWxDb2xvcnMpXHJcblxyXG4gICAgY29uc3QgcGFsTWFwTmV3VG9PbGQgPSBBcnJheTxudW1iZXI+KHBhbGV0dGUuZW50cnlDb3VudClcclxuICAgIGNvbnN0IHBhbE1hcE9sZFRvTmV3ID0gQXJyYXk8bnVtYmVyPihwYWxldHRlLmVudHJ5Q291bnQpXHJcblxyXG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBwYWxDb2xvcnMubGVuZ3RoOyBpKyspIHtcclxuICAgICAgY29uc3Qgb2xkSW5kZXggPSBwYWxDb2xvcnNbaV1bMV1cclxuXHJcbiAgICAgIHBhbE1hcE5ld1RvT2xkW2ldID0gb2xkSW5kZXhcclxuICAgICAgcGFsTWFwT2xkVG9OZXdbb2xkSW5kZXhdID0gaVxyXG4gICAgfVxyXG5cclxuICAgIHBhbDIgPSBuZXcgVWludDMyQXJyYXkocGFsZXR0ZS5lbnRyeUNvdW50KVxyXG5cclxuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgcGFsZXR0ZS5lbnRyeUNvdW50OyBpKyspIHtcclxuICAgICAgcGFsMltpXSA9IHBhbENvbG9yc1tpXVswXVxyXG4gICAgfVxyXG5cclxuICAgIGNvbnNvbGUubG9nKCdwYWwyJywgcGFsMilcclxuXHJcbiAgICBuYWl2ZTJMdXQzMiA9IG5ldyBVaW50MzJBcnJheShwYWxldHRlLmVudHJ5Q291bnQpXHJcblxyXG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBwYWxldHRlLmVudHJ5Q291bnQ7IGkrKykge1xyXG4gICAgICBjb25zdCByID0gcGFsZXR0ZS5kYXRhW2kgKiAzXVxyXG4gICAgICBjb25zdCBnID0gcGFsZXR0ZS5kYXRhW2kgKiAzICsgMV1cclxuICAgICAgY29uc3QgYiA9IHBhbGV0dGUuZGF0YVtpICogMyArIDJdXHJcblxyXG4gICAgICBjb25zdCBjb2xvciA9IGNyZWF0ZUNvbG9yKHIsIGcsIGIpXHJcblxyXG4gICAgICBuYWl2ZTJMdXQzMltpXSA9IGNvbG9yXHJcbiAgICB9XHJcblxyXG4gICAgLy8gXHJcblxyXG4gICAgY29uc3QgbnVtQ29sb3JzMjQgPSAweGZmZmZmZlxyXG5cclxuICAgIGNvbnN0IHJWYWx1ZXMgPSBuZXcgU2V0PG51bWJlcj4oKVxyXG4gICAgY29uc3QgZ1ZhbHVlcyA9IG5ldyBTZXQ8bnVtYmVyPigpXHJcbiAgICBjb25zdCBiVmFsdWVzID0gbmV3IFNldDxudW1iZXI+KClcclxuICAgIGNvbnN0IGNWYWx1ZXMgPSBuZXcgU2V0PG51bWJlcj4oKVxyXG5cclxuICAgIGNvbnN0IHN0ZXBDb3VudCA9IDEwXHJcblxyXG4gICAgY29uc3QgcCA9IHByb2dyZXNzKHN0ZXBDb3VudClcclxuXHJcbiAgICBjb25zb2xlLmxvZygnZ2VuZXJhdGVkIHBhbGV0dGUgbG9va3VwcycpXHJcblxyXG4gICAgcCgwKVxyXG4gICAgYXdhaXQgcmVuZGVyKClcclxuXHJcbiAgICBjb25zdCBwc3RlcCA9IG51bUNvbG9yczI0IC8gc3RlcENvdW50XHJcbiAgICBsZXQgY3N0ZXAgPSBwc3RlcFxyXG4gICAgbGV0IHB2YWwgPSAwXHJcblxyXG4gICAgY29uc3Qgbmx1dFN0YXJ0ID0gcGVyZm9ybWFuY2Uubm93KClcclxuICAgIG5haXZlTHV0ID0gbmV3IFVpbnQ4QXJyYXkobnVtQ29sb3JzMjQpXHJcbiAgICBuYWl2ZUx1dDMyID0gbmV3IFVpbnQzMkFycmF5KG51bUNvbG9yczI0KVxyXG5cclxuICAgIG5haXZlTHV0MiA9IG5ldyBVaW50OEFycmF5KG51bUNvbG9yczI0KVxyXG5cclxuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgMHhmZmZmZmY7IGkrKykge1xyXG4gICAgICBjb25zdCBbciwgZywgYl0gPSBjb2xvclRvUmdiKGkpXHJcbiAgICAgIGNvbnN0IGluZGV4ID0gaW5kZXhPZkNsb3Nlc3RSZ2IocGFsZXR0ZSwgW3IsIGcsIGJdKVxyXG4gICAgICBuYWl2ZUx1dFtpXSA9IGluZGV4XHJcbiAgICAgIG5haXZlTHV0MltpXSA9IHBhbE1hcE9sZFRvTmV3W2luZGV4XVxyXG5cclxuICAgICAgY29uc3QgcGFsUiA9IHBhbGV0dGUuZGF0YVtpbmRleCAqIDNdXHJcbiAgICAgIGNvbnN0IHBhbEcgPSBwYWxldHRlLmRhdGFbaW5kZXggKiAzICsgMV1cclxuICAgICAgY29uc3QgcGFsQiA9IHBhbGV0dGUuZGF0YVtpbmRleCAqIDMgKyAyXVxyXG5cclxuICAgICAgclZhbHVlcy5hZGQocGFsUilcclxuICAgICAgZ1ZhbHVlcy5hZGQocGFsRylcclxuICAgICAgYlZhbHVlcy5hZGQocGFsQilcclxuXHJcbiAgICAgIGNWYWx1ZXMuYWRkKHBhbFIpXHJcbiAgICAgIGNWYWx1ZXMuYWRkKHBhbEcpXHJcbiAgICAgIGNWYWx1ZXMuYWRkKHBhbEIpXHJcblxyXG4gICAgICBjb25zdCBjb2xvciA9IGNyZWF0ZUNvbG9yKHBhbFIsIHBhbEcsIHBhbEIpXHJcblxyXG4gICAgICBuYWl2ZUx1dDMyW2ldID0gY29sb3JcclxuXHJcbiAgICAgIGlmIChpID49IGNzdGVwKSB7XHJcbiAgICAgICAgY3N0ZXAgKz0gcHN0ZXBcclxuICAgICAgICBwdmFsKytcclxuICAgICAgICBwKHB2YWwpXHJcblxyXG4gICAgICAgIGF3YWl0IHJlbmRlcigpXHJcbiAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBjb25zdCBubHV0RW5kID0gcGVyZm9ybWFuY2Uubm93KClcclxuXHJcbiAgICBjb25zb2xlLmxvZygnTmFpdmUgTFVUcyBUaW1lOicsIG5sdXRFbmQgLSBubHV0U3RhcnQpXHJcblxyXG4gICAgY29uc29sZS5sb2coJ05haXZlIExVVCcsIG5haXZlTHV0KVxyXG4gICAgY29uc29sZS5sb2coJ05haXZlIExVVCAyJywgbmFpdmVMdXQyKVxyXG5cclxuICAgIC8vXHJcblxyXG4gICAgY29uc3QgckFyciA9IEFycmF5LmZyb20oclZhbHVlcylcclxuICAgIGNvbnN0IGdBcnIgPSBBcnJheS5mcm9tKGdWYWx1ZXMpXHJcbiAgICBjb25zdCBiQXJyID0gQXJyYXkuZnJvbShiVmFsdWVzKVxyXG4gICAgY29uc3QgY0FyciA9IEFycmF5LmZyb20oY1ZhbHVlcylcclxuXHJcbiAgICByQXJyLnNvcnQoKGEsIGIpID0+IGEgLSBiKVxyXG4gICAgZ0Fyci5zb3J0KChhLCBiKSA9PiBhIC0gYilcclxuICAgIGJBcnIuc29ydCgoYSwgYikgPT4gYSAtIGIpXHJcbiAgICBjQXJyLnNvcnQoKGEsIGIpID0+IGEgLSBiKVxyXG5cclxuICAgIGNvbnNvbGUubG9nKCdyQXJyJywgckFycilcclxuICAgIGNvbnNvbGUubG9nKCdnQXJyJywgZ0FycilcclxuICAgIGNvbnNvbGUubG9nKCdiQXJyJywgYkFycilcclxuICAgIGNvbnNvbGUubG9nKCdjQXJyJywgY0FycilcclxuXHJcbiAgICAvL1xyXG5cclxuICAgIC8vIG5haXZlTHV0IGlzIGEgbWFwcGluZyB3aGVyZSB0aGUgaW5kZXggaXMgdGhlIDI0IGJpdCByZ2IgdmFsdWUgYW5kIHRoZVxyXG4gICAgLy8gdmFsdWUgaXMgdGhlIGluZGV4IG9mIHRoZSBjbG9zZXN0IGNvbG9yIGluIHRoZSBwYWxldHRlXHJcbiAgICAvL1xyXG4gICAgLy8gY29uc2VjdXRpdmUgMjQgYml0IGluZGljZXMgYWxsIHBvaW50IHRvIHRoZSBzYW1lIHBhbGV0dGUgaW5kZXggaW4gcnVuc1xyXG4gICAgLy8gd2UgY291bGQgY29tcHJlc3MgdGhlIHN0cnVjdHVyZSBsaWtlIHNvOlxyXG4gICAgLy8gXHJcbiAgICAvLyB3ZSB1c2UgYSBVaW50MzJBcnJheSB0byBzdG9yZSB0d28gZmllbGRzOlxyXG4gICAgLy8gMS4gdGhlIDI0IGJpdCB2YWx1ZSB0aGF0IGlzIHRoZSAqZW5kKiBvZiB0aGUgcm93IG9mIGNvbnNlY3V0aXZlIGluZGljZXNcclxuICAgIC8vIDIuIHRoZSA4IGJpdCBwYWxldHRlIGluZGV4XHJcbiAgICAvL1xyXG4gICAgLy8gdGhlbiwgdG8gbWFwIHJnYiB0byBpbmRleCwgeW91IHNlYXJjaCB0aHJvdWdoIGVhY2ggZmllbGQgdG8gZmluZCB0aGUgXHJcbiAgICAvLyBmaXJzdCBlbmQgb2Ygcm93IHdoaWNoIGlzIGdyZWF0ZXIgdGhhbiBvciBlcXVhbCB0byB0aGUgcmdiIHZhbHVlXHJcbiAgICAvLyBhbmQgcmV0dXJuIHRoZSBwYWxldHRlIGluZGV4XHJcbiAgICAvLyBpdCB3aWxsIGJlIGEgYml0IHNsb3dlciB0aGFuIGVnIG5haXZlTHV0MzIgd2hpY2ggaXMgdGhlIGZhc3Rlc3QsIGJ1dCBcclxuICAgIC8vIHRoYXQgc3RydWN0dXJlIGlzIH42NG1iXHJcblxyXG4gICAgbGV0IHByZXYgPSAtMVxyXG4gICAgbGV0IHJvd0NvdW50ID0gMFxyXG5cclxuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgbnVtQ29sb3JzMjQ7IGkrKykge1xyXG4gICAgICBjb25zdCB2YWx1ZSA9IG5haXZlTHV0W2ldXHJcblxyXG4gICAgICBpZiAodmFsdWUgIT09IHByZXYpIHtcclxuICAgICAgICByb3dDb3VudCsrXHJcbiAgICAgIH1cclxuXHJcbiAgICAgIHByZXYgPSB2YWx1ZVxyXG4gICAgfVxyXG5cclxuICAgIC8vIGl0IHdpbGwgaGF2ZSByb3dDb3VudCByb3dzXHJcblxyXG4gICAgY29uc29sZS5sb2coJ3Jvd2NvdW50OicsIHJvd0NvdW50LCAnYnl0ZXM6Jywgcm93Q291bnQgKiA0KVxyXG5cclxuICAgIC8vXHJcblxyXG4gICAgY3JlYXRlTmV3THV0VGhpbmcocGFsZXR0ZSlcclxuICB9XHJcblxyXG4gIGxldCBpc0Rpc2FibGVVcGRhdGUgPSBmYWxzZVxyXG5cclxuICBjb25zdCB1cGRhdGUgPSAoc3RhdGU6IFN0YXRlKSA9PiB7XHJcbiAgICBpZiAoIW1heWJlKHBhbGV0dGUpKSB0aHJvdyBFcnJvcignUGFsZXR0ZSBub3QgZ2VuZXJhdGVkJylcclxuICAgIGlmICghbWF5YmUodGVzdEltYWdlKSkgdGhyb3cgRXJyb3IoJ1Rlc3QgaW1hZ2Ugbm90IGxvYWRlZCcpXHJcbiAgICBpZiAoIW1heWJlKG5haXZlTHV0KSkgdGhyb3cgRXJyb3IoJ05haXZlIExVVCBub3QgZ2VuZXJhdGVkJylcclxuICAgIGlmICghbWF5YmUobmFpdmVMdXQzMikpIHRocm93IEVycm9yKCdOYWl2ZSBMVVQzMiBub3QgZ2VuZXJhdGVkJylcclxuICAgIGlmICghbWF5YmUobmFpdmVMdXQyKSkgdGhyb3cgRXJyb3IoJ05haXZlIExVVDIgbm90IGdlbmVyYXRlZCcpXHJcbiAgICBpZiAoIW1heWJlKHBhbDIpKSB0aHJvdyBFcnJvcignUGFsMiBub3QgZ2VuZXJhdGVkJylcclxuICAgIGlmICghbWF5YmUobmFpdmUyTHV0MzIpKSB0aHJvdyBFcnJvcignTmFpdmUyIExVVDMyIG5vdCBnZW5lcmF0ZWQnKVxyXG5cclxuICAgIC8vIHRlbXAgXHJcbiAgICBpZiAoaXNEaXNhYmxlVXBkYXRlKSByZXR1cm5cclxuXHJcbiAgICAvLyBoYW5kbGUgaW9cclxuXHJcbiAgICBjb25zdCB3aGVlbCA9IHN0YXRlLm1vdXNlLnRha2VXaGVlbCgpXHJcbiAgICBjb25zdCB6b29tID0gc3RhdGUudmlldy5nZXRab29tKClcclxuXHJcbiAgICBpZiAod2hlZWwgPCAwKSB7XHJcbiAgICAgIHN0YXRlLnZpZXcuc2V0Wm9vbSggem9vbSArIDEgKVxyXG4gICAgfSBlbHNlIGlmICh3aGVlbCA+IDApIHtcclxuICAgICAgc3RhdGUudmlldy5zZXRab29tKCB6b29tIC0gMSApXHJcbiAgICB9XHJcblxyXG4gICAgY29uc3Qga2V5cyA9IHN0YXRlLmdldEtleXMoKVxyXG5cclxuICAgIGlmIChrZXlzWydFc2NhcGUnXSkge1xyXG4gICAgICBzdGF0ZS5zZXRSdW5uaW5nKGZhbHNlKVxyXG5cclxuICAgICAgLy8gY29uc3VtZSB0aGUga2V5XHJcbiAgICAgIGtleXNbJ0VzY2FwZSddID0gZmFsc2VcclxuXHJcbiAgICAgIHJldHVyblxyXG4gICAgfVxyXG5cclxuICAgIC8vXHJcblxyXG4gICAgY29uc3QgYnVmZmVyID0gc3RhdGUudmlldy5nZXRCdWZmZXIoKVxyXG5cclxuICAgIGZpbGwoYnVmZmVyLCBjcmVhdGVDb2xvcigweDAwLCAweDAwLCAweDAwKSlcclxuXHJcbiAgICBsb2dPbmNlKCdidWZmZXJQaXhlbHMnLCAnQnVmZmVyIHBpeGVsczonLCBidWZmZXIud2lkdGggKiBidWZmZXIuaGVpZ2h0KVxyXG5cclxuICAgIC8vIGNvdWxkIG9wdGltaXplIGJ5IGRvaW5nIHRoaXMgaW4gaW5pdCwgYnV0IHRoZSBzY2VuZSBlYXNpbHkgaGl0cyA2MGZwc1xyXG4gICAgLy8gYW5kIGl0J3MganVzdCBhIHNhbmRib3hcclxuXHJcbiAgICAvLyBwYWxldHRlIHN0dWZmXHJcblxyXG4gICAgY29uc3QgbnVtUGFscyA9IDJcclxuXHJcbiAgICAvL1xyXG5cclxuICAgIGNvbnN0IHBhbFdpZHRoID0gcGFsZXR0ZS5saWdodFJhbmdlXHJcbiAgICBjb25zdCBwYWxIZWlnaHQgPSBNYXRoLmNlaWwocGFsZXR0ZS5lbnRyeUNvdW50IC8gcGFsV2lkdGgpXHJcblxyXG4gICAgLy9cclxuXHJcbiAgICBjb25zdCBwYWxJbWFnZSA9IGNyZWF0ZVBhbEltYWdlKHBhbGV0dGUsIHBhbFdpZHRoLCBwYWxIZWlnaHQpXHJcblxyXG4gICAgY29uc3QgbmV3SGVpZ2h0ID0gYnVmZmVyLmhlaWdodFxyXG4gICAgY29uc3Qgc2NhbGUgPSBuZXdIZWlnaHQgLyBwYWxIZWlnaHRcclxuICAgIGNvbnN0IG5ld1dpZHRoID0gTWF0aC5mbG9vcihwYWxXaWR0aCAqIHNjYWxlKVxyXG5cclxuICAgIHJlc2l6ZShcclxuICAgICAgcGFsSW1hZ2UsIGJ1ZmZlcixcclxuICAgICAgWzAsIDAsIHBhbFdpZHRoLCBwYWxIZWlnaHRdLCBbMCwgMCwgbmV3V2lkdGgsIG5ld0hlaWdodF1cclxuICAgIClcclxuXHJcbiAgICAvL1xyXG5cclxuICAgIGNvbnN0IHBhbDJJbWFnZSA9IGNyZWF0ZVBhbDJJbWFnZShwYWwyLCBwYWxXaWR0aCwgcGFsSGVpZ2h0KVxyXG5cclxuICAgIHJlc2l6ZShcclxuICAgICAgcGFsMkltYWdlLCBidWZmZXIsXHJcbiAgICAgIFswLCAwLCBwYWxXaWR0aCwgcGFsSGVpZ2h0XSwgW25ld1dpZHRoLCAwLCBuZXdXaWR0aCwgbmV3SGVpZ2h0XVxyXG4gICAgKVxyXG5cclxuICAgIC8vXHJcblxyXG4gICAgY29uc3QgcGFsc1dpZHRoID0gbmV3V2lkdGggKiBudW1QYWxzXHJcblxyXG4gICAgLy9cclxuXHJcbiAgICBjb25zdCByZW1haW5pbmdXaWR0aCA9IGJ1ZmZlci53aWR0aCAtIHBhbHNXaWR0aFxyXG5cclxuICAgIC8vXHJcbiAgICBjb25zdCBpbWFnZUNvdW50ID0gNVxyXG5cclxuICAgIC8vIG1ha2Ugc3BhY2UgZm9yIGltYWdlcyBzaWRlIGJ5IHNpZGVcclxuICAgIGNvbnN0IGltYWdlV2lkdGhzID0gTWF0aC5mbG9vcihyZW1haW5pbmdXaWR0aCAvIGltYWdlQ291bnQpXHJcblxyXG4gICAgLy8gbmV4dCB3ZSdsbCB0cnkgY29udmVydGluZyBhbiBpbWFnZSB0byBwYWxldHRlIGFuZCBzaG93IHRoZSBvcmlnaW5hbFxyXG4gICAgLy8gYW5kIGNvbnZlcnRlZCBzaWRlIGJ5IHNpZGUsIHRoZW4gd2UgY2FuIHN0YXJ0IGV4cGVyaW1lbnRpbmcgd2l0aFxyXG4gICAgLy8gY3JlYXRpbmcgYSBMVVRcclxuXHJcbiAgICBjb25zdCBuZXdPcmlnV2lkdGggPSBpbWFnZVdpZHRoc1xyXG4gICAgY29uc3Qgc2NhbGVPcmlnID0gbmV3T3JpZ1dpZHRoIC8gdGVzdEltYWdlLndpZHRoXHJcbiAgICBjb25zdCBuZXdPcmlnSGVpZ2h0ID0gTWF0aC5mbG9vcih0ZXN0SW1hZ2UuaGVpZ2h0ICogc2NhbGVPcmlnKVxyXG5cclxuICAgIHJlc2l6ZShcclxuICAgICAgdGVzdEltYWdlLCBidWZmZXIsXHJcbiAgICAgIFswLCAwLCB0ZXN0SW1hZ2Uud2lkdGgsIHRlc3RJbWFnZS5oZWlnaHRdLFxyXG4gICAgICBbcGFsc1dpZHRoLCAwLCBuZXdPcmlnV2lkdGgsIG5ld09yaWdIZWlnaHRdXHJcbiAgICApXHJcblxyXG4gICAgY29uc3QgY29sb3JzT3JpZyA9IGNvdW50VW5pcXVlQ29sb3JzKHRlc3RJbWFnZSlcclxuXHJcbiAgICBsb2dPbmNlKCdjb2xvcnNPcmlnJywgJ1VuaXF1ZSBjb2xvcnMgaW4gb3JpZ2luYWwgaW1hZ2U6JywgY29sb3JzT3JpZylcclxuXHJcbiAgICAvLyBzbG93IGluZGV4ZWQgY29udmVyc2lvbiwgZGlyZWN0IHNlYXJjaFxyXG5cclxuICAgIGNvbnN0IHN0YXJ0Q29udjBUaW1lID0gcGVyZm9ybWFuY2Uubm93KClcclxuICAgIGNvbnN0IGluZGV4ZWQgPSB0b1BhbGV0dGUodGVzdEltYWdlLCBwYWxldHRlKVxyXG4gICAgY29uc3QgZW5kQ29udjBUaW1lID0gcGVyZm9ybWFuY2Uubm93KClcclxuXHJcbiAgICBjb25zdCBjb2xvcnNJbmRleGVkID0gY291bnRVbmlxdWVDb2xvcnMoaW5kZXhlZClcclxuXHJcbiAgICBsb2dPbmNlKFxyXG4gICAgICAnY29udjAnLFxyXG4gICAgICAnQ29udmVyc2lvbiAwIHRpbWU6JywgZW5kQ29udjBUaW1lIC0gc3RhcnRDb252MFRpbWUsXHJcbiAgICAgICdQaXhlbCBjb3VudDonLCB0ZXN0SW1hZ2Uud2lkdGggKiB0ZXN0SW1hZ2UuaGVpZ2h0LFxyXG4gICAgICAnVW5pcXVlIGNvbG9yczonLCBjb2xvcnNJbmRleGVkXHJcbiAgICApXHJcblxyXG4gICAgcmVzaXplKFxyXG4gICAgICBpbmRleGVkLCBidWZmZXIsXHJcbiAgICAgIFswLCAwLCBpbmRleGVkLndpZHRoLCBpbmRleGVkLmhlaWdodF0sXHJcbiAgICAgIFtwYWxzV2lkdGggKyBuZXdPcmlnV2lkdGgsIDAsIG5ld09yaWdXaWR0aCwgbmV3T3JpZ0hlaWdodF1cclxuICAgIClcclxuXHJcbiAgICAvLyBMVVQgZXhwZXJpbWVudHNcclxuXHJcbiAgICBjb25zdCBzdGFydENvbnYxVGltZSA9IHBlcmZvcm1hbmNlLm5vdygpXHJcbiAgICBjb25zdCBpbmRleGVkTHV0ID0gdG9QYWxldHRlTHV0KHRlc3RJbWFnZSwgcGFsZXR0ZSwgbmFpdmVMdXQpXHJcbiAgICBjb25zdCBlbmRDb252MVRpbWUgPSBwZXJmb3JtYW5jZS5ub3coKVxyXG5cclxuICAgIGNvbnN0IGNvbG9yc0x1dCA9IGNvdW50VW5pcXVlQ29sb3JzKGluZGV4ZWRMdXQpXHJcblxyXG4gICAgbG9nT25jZShcclxuICAgICAgJ2NvbnYxJyxcclxuICAgICAgJ0NvbnZlcnNpb24gMSB0aW1lOicsIGVuZENvbnYxVGltZSAtIHN0YXJ0Q29udjFUaW1lLFxyXG4gICAgICAnUGl4ZWwgY291bnQ6JywgdGVzdEltYWdlLndpZHRoICogdGVzdEltYWdlLmhlaWdodCxcclxuICAgICAgJ1VuaXF1ZSBjb2xvcnM6JywgY29sb3JzTHV0XHJcbiAgICApXHJcblxyXG4gICAgcmVzaXplKFxyXG4gICAgICBpbmRleGVkTHV0LCBidWZmZXIsXHJcbiAgICAgIFswLCAwLCBpbmRleGVkTHV0LndpZHRoLCBpbmRleGVkTHV0LmhlaWdodF0sXHJcbiAgICAgIFtwYWxzV2lkdGggKyBuZXdPcmlnV2lkdGggKiAyLCAwLCBuZXdPcmlnV2lkdGgsIG5ld09yaWdIZWlnaHRdXHJcbiAgICApXHJcblxyXG4gICAgLy9cclxuXHJcbiAgICBjb25zdCBzdGFydENvbnYyVGltZSA9IHBlcmZvcm1hbmNlLm5vdygpXHJcbiAgICBjb25zdCBpbmRleGVkTHV0MzIgPSB0b1BhbGV0dGVMdXQzMih0ZXN0SW1hZ2UsIG5haXZlTHV0MzIpXHJcbiAgICBjb25zdCBlbmRDb252MlRpbWUgPSBwZXJmb3JtYW5jZS5ub3coKVxyXG5cclxuICAgIGNvbnN0IGNvbG9yc0x1dDMyID0gY291bnRVbmlxdWVDb2xvcnMoaW5kZXhlZEx1dDMyKVxyXG5cclxuICAgIGxvZ09uY2UoXHJcbiAgICAgICdjb252MicsXHJcbiAgICAgICdDb252ZXJzaW9uIDIgdGltZTonLCBlbmRDb252MlRpbWUgLSBzdGFydENvbnYyVGltZSxcclxuICAgICAgJ1BpeGVsIGNvdW50OicsIHRlc3RJbWFnZS53aWR0aCAqIHRlc3RJbWFnZS5oZWlnaHQsXHJcbiAgICAgICdVbmlxdWUgY29sb3JzOicsIGNvbG9yc0x1dDMyXHJcbiAgICApXHJcblxyXG4gICAgcmVzaXplKFxyXG4gICAgICBpbmRleGVkTHV0MzIsIGJ1ZmZlcixcclxuICAgICAgWzAsIDAsIGluZGV4ZWRMdXQzMi53aWR0aCwgaW5kZXhlZEx1dDMyLmhlaWdodF0sXHJcbiAgICAgIFtwYWxzV2lkdGggKyBuZXdPcmlnV2lkdGggKiAzLCAwLCBuZXdPcmlnV2lkdGgsIG5ld09yaWdIZWlnaHRdXHJcbiAgICApXHJcbiAgICAvLyBcclxuXHJcbiAgICBjb25zdCBzdGFydEx1dDJUaW1lID0gcGVyZm9ybWFuY2Uubm93KClcclxuICAgIGNvbnN0IHsgY2hDb3VudCwgY2hhbm5lbExvb2t1cCwgdGFibGUgfSA9IGNyZWF0ZU5ld0x1dFRoaW5nKHBhbGV0dGUpXHJcbiAgICBjb25zdCBlbmRMdXQyVGltZSA9IHBlcmZvcm1hbmNlLm5vdygpXHJcblxyXG4gICAgbG9nT25jZShcclxuICAgICAgJ2x1dDInLFxyXG4gICAgICAnTFVUIDIgdGltZTonLCBlbmRMdXQyVGltZSAtIHN0YXJ0THV0MlRpbWUsXHJcbiAgICAgICdUYWJsZSBzaXplOicsIHRhYmxlLmJ5dGVMZW5ndGhcclxuICAgIClcclxuXHJcbiAgICBjb25zdCBzdGFydENvbnYzVGltZSA9IHBlcmZvcm1hbmNlLm5vdygpXHJcbiAgICBjb25zdCBpbmRleGVkTG9va3VwMiA9IHRvUGFsZXR0ZUxvb2t1cDMoXHJcbiAgICAgIHRlc3RJbWFnZSwgbmFpdmUyTHV0MzIsXHJcbiAgICAgIGNoQ291bnQsIGNoYW5uZWxMb29rdXAsIHRhYmxlXHJcbiAgICApXHJcbiAgICBjb25zdCBlbmRDb252M1RpbWUgPSBwZXJmb3JtYW5jZS5ub3coKVxyXG5cclxuICAgIGNvbnN0IGNvbG9yc0xvb2t1cDIgPSBjb3VudFVuaXF1ZUNvbG9ycyhpbmRleGVkTG9va3VwMilcclxuXHJcbiAgICBsb2dPbmNlKFxyXG4gICAgICAnY29udjMnLFxyXG4gICAgICAnQ29udmVyc2lvbiAzIHRpbWU6JywgZW5kQ29udjNUaW1lIC0gc3RhcnRDb252M1RpbWUsXHJcbiAgICAgICdQaXhlbCBjb3VudDonLCB0ZXN0SW1hZ2Uud2lkdGggKiB0ZXN0SW1hZ2UuaGVpZ2h0LFxyXG4gICAgICAnVW5pcXVlIGNvbG9yczonLCBjb2xvcnNMb29rdXAyXHJcbiAgICApXHJcblxyXG4gICAgcmVzaXplKFxyXG4gICAgICBpbmRleGVkTG9va3VwMiwgYnVmZmVyLFxyXG4gICAgICBbMCwgMCwgaW5kZXhlZExvb2t1cDIud2lkdGgsIGluZGV4ZWRMb29rdXAyLmhlaWdodF0sXHJcbiAgICAgIFtwYWxzV2lkdGggKyBuZXdPcmlnV2lkdGggKiA0LCAwLCBuZXdPcmlnV2lkdGgsIG5ld09yaWdIZWlnaHRdXHJcbiAgICApXHJcbiAgfVxyXG5cclxuICBjb25zdCBxdWl0ID0gYXN5bmMgKF9zdGF0ZTogU3RhdGUpID0+IHtcclxuICAgIHBhbGV0dGUgPSBudWxsXHJcbiAgfVxyXG5cclxuICByZXR1cm4geyBpbml0LCB1cGRhdGUsIHF1aXQgfVxyXG59XHJcblxyXG5jb25zdCBzZWVuID0gbmV3IFNldDxzdHJpbmc+KClcclxuY29uc3QgbG9nT25jZSA9IChpZDogc3RyaW5nLCAuLi5hcmdzOiBhbnlbXSkgPT4ge1xyXG4gIGlmIChzZWVuLmhhcyhpZCkpIHJldHVyblxyXG4gIHNlZW4uYWRkKGlkKVxyXG4gIGNvbnNvbGUubG9nKC4uLmFyZ3MpXHJcbn1cclxuXHJcbmNvbnN0IHRvUGFsZXR0ZSA9IChpbWFnZTogSW1hZ2VEYXRhLCBwYWxldHRlOiBHZW5lcmF0ZWRQYWxldHRlKTogSW1hZ2VEYXRhID0+IHtcclxuICBjb25zdCBuZXdJbWFnZSA9IGNyZWF0ZUltYWdlKGltYWdlLndpZHRoLCBpbWFnZS5oZWlnaHQpXHJcblxyXG4gIC8vXHJcblxyXG4gIGZvciAobGV0IHkgPSAwOyB5IDwgaW1hZ2UuaGVpZ2h0OyB5KyspIHtcclxuICAgIGNvbnN0IHJvdyA9IHkgKiBpbWFnZS53aWR0aFxyXG4gICAgZm9yIChsZXQgeCA9IDA7IHggPCBpbWFnZS53aWR0aDsgeCsrKSB7XHJcbiAgICAgIGNvbnN0IGluZGV4ID0gcm93ICsgeFxyXG4gICAgICBjb25zdCBkYXRhSW5kZXggPSBpbmRleCAqIDRcclxuXHJcbiAgICAgIGNvbnN0IG9yID0gaW1hZ2UuZGF0YVtkYXRhSW5kZXhdXHJcbiAgICAgIGNvbnN0IG9nID0gaW1hZ2UuZGF0YVtkYXRhSW5kZXggKyAxXVxyXG4gICAgICBjb25zdCBvYiA9IGltYWdlLmRhdGFbZGF0YUluZGV4ICsgMl1cclxuXHJcbiAgICAgIGNvbnN0IHBhbEluZGV4ID0gaW5kZXhPZkNsb3Nlc3RSZ2IocGFsZXR0ZSwgW29yLCBvZywgb2JdKVxyXG5cclxuICAgICAgY29uc3QgcHIgPSBwYWxldHRlLmRhdGFbcGFsSW5kZXggKiAzXVxyXG4gICAgICBjb25zdCBwZyA9IHBhbGV0dGUuZGF0YVtwYWxJbmRleCAqIDMgKyAxXVxyXG4gICAgICBjb25zdCBwYiA9IHBhbGV0dGUuZGF0YVtwYWxJbmRleCAqIDMgKyAyXVxyXG5cclxuICAgICAgbmV3SW1hZ2UuZGF0YVtkYXRhSW5kZXhdID0gcHJcclxuICAgICAgbmV3SW1hZ2UuZGF0YVtkYXRhSW5kZXggKyAxXSA9IHBnXHJcbiAgICAgIG5ld0ltYWdlLmRhdGFbZGF0YUluZGV4ICsgMl0gPSBwYlxyXG4gICAgICBuZXdJbWFnZS5kYXRhW2RhdGFJbmRleCArIDNdID0gMjU1XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICAvL1xyXG5cclxuICByZXR1cm4gbmV3SW1hZ2VcclxufVxyXG5cclxuY29uc3QgdG9QYWxldHRlTHV0ID0gKFxyXG4gIGltYWdlOiBJbWFnZURhdGEsIHBhbGV0dGU6IEdlbmVyYXRlZFBhbGV0dGUsIGx1dDogVWludDhBcnJheVxyXG4pOiBJbWFnZURhdGEgPT4ge1xyXG4gIGNvbnN0IG5ld0ltYWdlID0gY3JlYXRlSW1hZ2UoaW1hZ2Uud2lkdGgsIGltYWdlLmhlaWdodClcclxuXHJcbiAgLy9cclxuXHJcbiAgZm9yIChsZXQgeSA9IDA7IHkgPCBpbWFnZS5oZWlnaHQ7IHkrKykge1xyXG4gICAgY29uc3Qgcm93ID0geSAqIGltYWdlLndpZHRoXHJcbiAgICBmb3IgKGxldCB4ID0gMDsgeCA8IGltYWdlLndpZHRoOyB4KyspIHtcclxuICAgICAgY29uc3QgaW5kZXggPSByb3cgKyB4XHJcbiAgICAgIGNvbnN0IGRhdGFJbmRleCA9IGluZGV4ICogNFxyXG5cclxuICAgICAgY29uc3Qgb3IgPSBpbWFnZS5kYXRhW2RhdGFJbmRleF1cclxuICAgICAgY29uc3Qgb2cgPSBpbWFnZS5kYXRhW2RhdGFJbmRleCArIDFdXHJcbiAgICAgIGNvbnN0IG9iID0gaW1hZ2UuZGF0YVtkYXRhSW5kZXggKyAyXVxyXG5cclxuICAgICAgY29uc3QgbHV0SW5kZXggPSBjcmVhdGVDb2xvcjI0KG9yLCBvZywgb2IpXHJcbiAgICAgIGNvbnN0IHBhbEluZGV4ID0gbHV0W2x1dEluZGV4XVxyXG5cclxuICAgICAgY29uc3QgcHIgPSBwYWxldHRlLmRhdGFbcGFsSW5kZXggKiAzXVxyXG4gICAgICBjb25zdCBwZyA9IHBhbGV0dGUuZGF0YVtwYWxJbmRleCAqIDMgKyAxXVxyXG4gICAgICBjb25zdCBwYiA9IHBhbGV0dGUuZGF0YVtwYWxJbmRleCAqIDMgKyAyXVxyXG5cclxuICAgICAgbmV3SW1hZ2UuZGF0YVtkYXRhSW5kZXhdID0gcHJcclxuICAgICAgbmV3SW1hZ2UuZGF0YVtkYXRhSW5kZXggKyAxXSA9IHBnXHJcbiAgICAgIG5ld0ltYWdlLmRhdGFbZGF0YUluZGV4ICsgMl0gPSBwYlxyXG4gICAgICBuZXdJbWFnZS5kYXRhW2RhdGFJbmRleCArIDNdID0gMjU1XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICAvL1xyXG5cclxuICByZXR1cm4gbmV3SW1hZ2VcclxufVxyXG5cclxuY29uc3QgdG9QYWxldHRlTHV0MzIgPSAoXHJcbiAgc3JjOiBJbWFnZURhdGEsIGx1dDogVWludDMyQXJyYXlcclxuKTogSW1hZ2VEYXRhID0+IHtcclxuICBjb25zdCBuZXdJbWFnZSA9IGNyZWF0ZUltYWdlKHNyYy53aWR0aCwgc3JjLmhlaWdodClcclxuXHJcbiAgY29uc3Qgc2l6ZSA9IHNyYy53aWR0aCAqIHNyYy5oZWlnaHRcclxuXHJcbiAgY29uc3Qgc3JjVmlldyA9IG5ldyBVaW50MzJBcnJheShzcmMuZGF0YS5idWZmZXIpXHJcbiAgY29uc3QgZGVzdFZpZXcgPSBuZXcgVWludDMyQXJyYXkobmV3SW1hZ2UuZGF0YS5idWZmZXIpXHJcblxyXG4gIC8vXHJcblxyXG4gIGZvciAobGV0IGkgPSAwOyBpIDwgc2l6ZTsgaSsrKSB7XHJcbiAgICBjb25zdCByZ2JhID0gc3JjVmlld1tpXVxyXG4gICAgY29uc3QgcmdiID0gcmdiYSAmIDB4MDBmZmZmZmZcclxuXHJcbiAgICBkZXN0Vmlld1tpXSA9IGx1dFtyZ2JdXHJcbiAgfVxyXG5cclxuICAvL1xyXG5cclxuICByZXR1cm4gbmV3SW1hZ2VcclxufVxyXG5cclxuLy8gdGhpcyBpcyB0aGUgd2lubmVyIGZvciBzZXZlcmFsIHJlYXNvbnM6XHJcbi8vIGEpIGl0J3MgYnkgZmFyIHRoZSBmYXN0ZXN0IGR1ZSB0byBzbWFsbCB0YWJsZSBzaXplIGhlbHBpbmcgd2l0aCBjYWNoZSBcclxuLy8gICAgbG9jYWxpdHksIGV2ZW4gdGhvdWdoIHRoZSBhcml0aG1ldGljIGlzIG1vcmUgY29tcGxleCB0aGFuIGVnIHRvUGFsZXR0ZUx1dDMyXHJcbi8vIGIpIGl0IHVzZXMgdGhlIGxlYXN0IG1lbW9yeSwgfjYwa2IgY29tcGFyZWQgdG8gZWcgMTZNQiBvciA2NE1CIGZvciB0aGUgb3RoZXJcclxuLy8gICAgbHV0c1xyXG4vLyBjKSBpdCBwcm9kdWNlcyBzbGlnaHRseSBiZXR0ZXIgcmVzdWx0cywgZWcgbGVzcyBpbmZvcm1hdGlvbiBpcyBsb3N0IGluIHRoZSBcclxuLy8gICAgcmVzdWx0YW50IG91dHB1dCBpbWFnZVxyXG5jb25zdCB0b1BhbGV0dGVMb29rdXAzID0gKFxyXG4gIHNyYzogSW1hZ2VEYXRhLCBjb2xvcnM6IFVpbnQzMkFycmF5LFxyXG4gIGNoQ291bnQ6IG51bWJlciwgY2hhbm5lbExvb2t1cDogVWludDhBcnJheSwgdGFibGU6IFVpbnQ4QXJyYXlcclxuKTogSW1hZ2VEYXRhID0+IHtcclxuICBjb25zdCBkZXN0ID0gY3JlYXRlSW1hZ2Uoc3JjLndpZHRoLCBzcmMuaGVpZ2h0KVxyXG5cclxuICBjb25zdCBkZXN0VmlldyA9IG5ldyBVaW50MzJBcnJheShkZXN0LmRhdGEuYnVmZmVyKVxyXG5cclxuICAvL1xyXG5cclxuICBjb25zdCByT2Zmc2V0U2l6ZSA9IGNoQ291bnQgKiBjaENvdW50XHJcblxyXG4gIGZvciAobGV0IHkgPSAwOyB5IDwgc3JjLmhlaWdodDsgeSsrKSB7XHJcbiAgICBjb25zdCByb3cgPSB5ICogc3JjLndpZHRoXHJcblxyXG4gICAgZm9yIChsZXQgeCA9IDA7IHggPCBzcmMud2lkdGg7IHgrKykge1xyXG4gICAgICBjb25zdCBpbmRleCA9IHJvdyArIHhcclxuICAgICAgY29uc3QgZGF0YUluZGV4ID0gaW5kZXggKiA0XHJcblxyXG4gICAgICBjb25zdCBvciA9IHNyYy5kYXRhW2RhdGFJbmRleF1cclxuICAgICAgY29uc3Qgb2cgPSBzcmMuZGF0YVtkYXRhSW5kZXggKyAxXVxyXG4gICAgICBjb25zdCBvYiA9IHNyYy5kYXRhW2RhdGFJbmRleCArIDJdXHJcblxyXG4gICAgICBjb25zdCByaSA9IGNoYW5uZWxMb29rdXBbb3JdXHJcbiAgICAgIGNvbnN0IGdpID0gY2hhbm5lbExvb2t1cFtvZ11cclxuICAgICAgY29uc3QgYmkgPSBjaGFubmVsTG9va3VwW29iXVxyXG5cclxuICAgICAgY29uc3QgcmlPZmZzZXQgPSByaSAqIHJPZmZzZXRTaXplXHJcbiAgICAgIGNvbnN0IGdpT2Zmc2V0ID0gZ2kgKiBjaENvdW50XHJcbiAgICAgIGNvbnN0IGxvb2t1cCA9IGJpICsgZ2lPZmZzZXQgKyByaU9mZnNldFxyXG5cclxuICAgICAgY29uc3QgY2xvc2VzdCA9IHRhYmxlW2xvb2t1cF1cclxuXHJcbiAgICAgIGRlc3RWaWV3W2luZGV4XSA9IGNvbG9yc1tjbG9zZXN0XSB8IDB4ZmYwMDAwMDBcclxuICAgIH1cclxuICB9XHJcblxyXG4gIC8vXHJcblxyXG4gIHJldHVybiBkZXN0XHJcbn1cclxuXHJcbi8qXHJcbiAgb2sgbmV3IHN0cmF0ZWd5XHJcblxyXG4gIDEuIGdlbmVyYXRlIGEgcGFsZXR0ZVxyXG4gIDIuIGZvciBldmVyeSBjb2xvciwgZ2V0IHRoZSB0aHJlZSBjaGFubmVscyBhbmQgYWRkIHRoZWlyIHZhbHVlcyB0byBhIHNldFxyXG4gIDMuIGF0IHRoZSBlbmQsIHlvdSBoYXZlIGEgc2V0IG9mIHZhbHVlcyBmb3IgZXZlcnkgcG9zc2libGUgY2hhbm5lbCB2YWx1ZVxyXG4gICAgIGVnIGZvciBvdXIgMTIvNC81IGh1ZSBnZW5lcmF0ZWQgcGFsZXR0ZSBvZiAyNTUgY29sb3JzLCB0aGVyZSBhcmUgMzggdW5pcXVlXHJcbiAgICAgdmFsdWVzIGZvciBldmVyeSBjaGFubmVsXHJcbiAgNC4gY3JlYXRlIGEgbG9va3VwIHRhYmxlIHdpdGggMC4uMjU1IGluZGljZXMsIGFuZCB0aGUgbmVhcmVzdCBtYXRjaCBmcm9tIG91clxyXG4gICAgIHNldFxyXG4gIDUuIGV4cGVyaW1lbnQgLSBvbmUgd2UgcmVjb25zdHJ1Y3QgYSBjb2xvciBmcm9tIGFuIHVuaW5kZXhlZCBpbWFnZSwgaXMgZXZlcnlcclxuICAgICB2YWx1ZSBwcmVzZW50IGluIG91ciBwYWxldHRlP1xyXG5cclxuICBJbiBvdXIgZXhhbXBsZSB3aXRoIDM4IHVuaXF1ZSB2YWx1ZXMsIHRoZXJlIGFyZSAzOCoqMyAoNTQsODcyKSBwb3NzaWJsZSBcclxuICBjb2xvcnMsIGEgbG90IGxlc3MgdGhhbiBvdXIgMTYgbWlsbGlvbiBjb2xvcnNwYWNlICAgXHJcblxyXG4gIEZpcnN0LCBjb252ZXJ0IHJhdyByLCBnLCBiIGludG8gcmFuZ2UgMC4uMzcgbWF0Y2hpbmcgdG8gaW5kZXggb2YgY2xvc2VzdCB2YWx1ZSBcclxuICBpbiB0aGUgc2V0XHJcblxyXG4gIFNvIHlvdSBjYW4gbWFrZSBhIGxvb2t1cCB0YWJsZSB3aGljaCBpcyBhIFVpbnQ4QXJyYXkgb2YgMzgqKjMgZW50cmllc1xyXG5cclxuICBZb3UgY2FuIGluZGV4IGludG8gaXQgYnk6XHJcblxyXG4gIHIgWzAuLjM3XVxyXG4gIGcgWzAuLjM3XVxyXG4gIGIgWzAuLjM3XVxyXG5cclxuICBjb25zdCBpbmRleCA9ICggciAqIDM4ICogMzggKSArICggZyAqIDM4ICkgKyBiXHJcblxyXG4gIHdpdGggZWFjaCBpbmRleCBwb2ludGluZyB0byBhIHBhbGV0dGUgaW5kZXhcclxuKi9cclxuXHJcbmNvbnN0IG5lYXJlc3RNYXRjaCA9ICh2YWx1ZXM6IG51bWJlcltdLCB2YWx1ZTogbnVtYmVyKSA9PiB7XHJcbiAgbGV0IGNsb3Nlc3QgPSB2YWx1ZXNbMF1cclxuICBsZXQgY2xvc2VzdERpc3QgPSBNYXRoLmFicyh2YWx1ZSAtIGNsb3Nlc3QpXHJcblxyXG4gIGZvciAobGV0IGkgPSAxOyBpIDwgdmFsdWVzLmxlbmd0aDsgaSsrKSB7XHJcbiAgICBjb25zdCBkaXN0ID0gTWF0aC5hYnModmFsdWUgLSB2YWx1ZXNbaV0pXHJcblxyXG4gICAgaWYgKGRpc3QgPCBjbG9zZXN0RGlzdCkge1xyXG4gICAgICBjbG9zZXN0ID0gdmFsdWVzW2ldXHJcbiAgICAgIGNsb3Nlc3REaXN0ID0gZGlzdFxyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgcmV0dXJuIGNsb3Nlc3RcclxufVxyXG5cclxuY29uc3QgY3JlYXRlTmV3THV0VGhpbmcgPSAocGFsZXR0ZTogR2VuZXJhdGVkUGFsZXR0ZSkgPT4ge1xyXG4gIGNvbnN0IGNoYW5uZWxTZXQgPSBuZXcgU2V0PG51bWJlcj4oKVxyXG5cclxuICBmb3IgKGxldCBpID0gMDsgaSA8IHBhbGV0dGUuZW50cnlDb3VudDsgaSsrKSB7XHJcbiAgICBjaGFubmVsU2V0LmFkZChwYWxldHRlLmRhdGFbaSAqIDNdKVxyXG4gICAgY2hhbm5lbFNldC5hZGQocGFsZXR0ZS5kYXRhW2kgKiAzICsgMV0pXHJcbiAgICBjaGFubmVsU2V0LmFkZChwYWxldHRlLmRhdGFbaSAqIDMgKyAyXSlcclxuICB9XHJcblxyXG4gIGNvbnN0IHZhbHVlcyA9IEFycmF5LmZyb20oY2hhbm5lbFNldCkuc29ydCgoYSwgYikgPT4gYSAtIGIpXHJcblxyXG4gIGNvbnN0IGNoQ291bnQgPSB2YWx1ZXMubGVuZ3RoXHJcblxyXG4gIGNvbnN0IGNoYW5uZWxMb29rdXAgPSBuZXcgVWludDhBcnJheSgyNTYpXHJcblxyXG4gIGZvciAobGV0IGkgPSAwOyBpIDwgMjU2OyBpKyspIHtcclxuICAgIGNvbnN0IGNsb3Nlc3QgPSBuZWFyZXN0TWF0Y2godmFsdWVzLCBpKVxyXG5cclxuICAgIGNoYW5uZWxMb29rdXBbaV0gPSB2YWx1ZXMuaW5kZXhPZihjbG9zZXN0KVxyXG4gIH1cclxuXHJcbiAgY29uc3QgdGFibGVTaXplID0gY2hDb3VudCAqKiAzXHJcblxyXG4gIGNvbnN0IHRhYmxlID0gbmV3IFVpbnQ4QXJyYXkodGFibGVTaXplKVxyXG5cclxuICBjb25zdCByU2l6ZSA9IGNoQ291bnQgKiBjaENvdW50XHJcblxyXG4gIGZvciAobGV0IHJpID0gMDsgcmkgPCBjaENvdW50OyByaSsrKSB7XHJcbiAgICBjb25zdCByaU9mZnNldCA9IHJpICogclNpemVcclxuICAgIGZvciAobGV0IGdpID0gMDsgZ2kgPCBjaENvdW50OyBnaSsrKSB7XHJcbiAgICAgIGNvbnN0IGdpT2Zmc2V0ID0gZ2kgKiBjaENvdW50ICsgcmlPZmZzZXRcclxuICAgICAgZm9yIChsZXQgYmkgPSAwOyBiaSA8IGNoQ291bnQ7IGJpKyspIHtcclxuICAgICAgICBjb25zdCBpbmRleCA9IGJpICsgZ2lPZmZzZXRcclxuXHJcbiAgICAgICAgY29uc3QgciA9IHZhbHVlc1tyaV1cclxuICAgICAgICBjb25zdCBnID0gdmFsdWVzW2dpXVxyXG4gICAgICAgIGNvbnN0IGIgPSB2YWx1ZXNbYmldXHJcblxyXG4gICAgICAgIGNvbnN0IGNsb3Nlc3QgPSBpbmRleE9mQ2xvc2VzdFJnYihwYWxldHRlLCBbciwgZywgYl0pXHJcblxyXG4gICAgICAgIHRhYmxlW2luZGV4XSA9IGNsb3Nlc3RcclxuICAgICAgfVxyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgcmV0dXJuIHsgY2hDb3VudCwgY2hhbm5lbExvb2t1cCwgdGFibGUgfVxyXG59XHJcblxyXG5jb25zdCBjb3VudFVuaXF1ZUNvbG9ycyA9IChpbWFnZTogSW1hZ2VEYXRhKTogbnVtYmVyID0+IHtcclxuICBjb25zdCBzZXQgPSBuZXcgU2V0PG51bWJlcj4oKVxyXG5cclxuICBjb25zdCBpbWFnZVZpZXcgPSBuZXcgVWludDMyQXJyYXkoaW1hZ2UuZGF0YS5idWZmZXIpXHJcblxyXG4gIGZvciAobGV0IGkgPSAwOyBpIDwgaW1hZ2VWaWV3Lmxlbmd0aDsgaSsrKSB7XHJcbiAgICBzZXQuYWRkKGltYWdlVmlld1tpXSlcclxuICB9XHJcblxyXG4gIHJldHVybiBzZXQuc2l6ZVxyXG59XHJcbiJdfQ==