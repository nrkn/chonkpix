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
        const wheel = state.mouse.getWheel();
        const zoom = state.view.getZoom();
        if (wheel < 0) {
            state.view.setZoom(zoom + 1);
        }
        else if (wheel > 0) {
            state.view.setZoom(zoom - 1);
        }
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicGFsZXR0ZS1zY2VuZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy9zY2VuZXMvcGFsZXR0ZS1zY2VuZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxPQUFPLEVBQUUsTUFBTSxFQUFFLE1BQU0sa0JBQWtCLENBQUE7QUFDekMsT0FBTyxFQUFFLFVBQVUsRUFBRSxXQUFXLEVBQUUsYUFBYSxFQUFFLE1BQU0sdUJBQXVCLENBQUE7QUFDOUUsT0FBTyxFQUFFLFdBQVcsRUFBRSxNQUFNLHdCQUF3QixDQUFBO0FBQ3BELE9BQU8sRUFBRSxJQUFJLEVBQUUsTUFBTSxzQkFBc0IsQ0FBQTtBQUMzQyxPQUFPLEVBQUUsU0FBUyxFQUFFLE1BQU0sc0JBQXNCLENBQUE7QUFDaEQsT0FBTyxFQUFFLE1BQU0sRUFBRSxNQUFNLHdCQUF3QixDQUFBO0FBRS9DLE9BQU8sRUFBRSxLQUFLLEVBQUUsTUFBTSxnQkFBZ0IsQ0FBQTtBQUV0QyxPQUFPLEVBQ2EsZUFBZSxFQUNqQyxpQkFBaUIsRUFDbEIsTUFBTSxnQ0FBZ0MsQ0FBQTtBQUV2QyxxQ0FBcUM7QUFDckMsTUFBTSxDQUFDLE1BQU0sbUJBQW1CLEdBQUcsR0FBVSxFQUFFO0lBQzdDLElBQUksT0FBTyxHQUE0QixJQUFJLENBQUE7SUFDM0MsSUFBSSxTQUFTLEdBQXFCLElBQUksQ0FBQTtJQUV0QywyRUFBMkU7SUFDM0Usd0VBQXdFO0lBQ3hFLGNBQWM7SUFDZCxFQUFFO0lBQ0YsUUFBUTtJQUNSLElBQUksUUFBUSxHQUFzQixJQUFJLENBQUE7SUFDdEMsUUFBUTtJQUNSLElBQUksVUFBVSxHQUF1QixJQUFJLENBQUE7SUFFekMsa0JBQWtCO0lBQ2xCLFlBQVk7SUFDWixJQUFJLFNBQVMsR0FBc0IsSUFBSSxDQUFBO0lBQ3ZDLElBQUksSUFBSSxHQUF1QixJQUFJLENBQUE7SUFDbkMsSUFBSSxXQUFXLEdBQXVCLElBQUksQ0FBQTtJQUUxQyxNQUFNLGNBQWMsR0FBRyxD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Q0FBQyxPQUFPLEVBQUUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUE7Z0JBRXJELEtBQUssQ0FBQyxLQUFLLENBQUMsR0FBRyxPQUFPLENBQUE7WUFDeEIsQ0FBQztRQUNILENBQUM7SUFDSCxDQUFDO0lBRUQsT0FBTyxFQUFFLE9BQU8sRUFBRSxhQUFhLEVBQUUsS0FBSyxFQUFFLENBQUE7QUFDMUMsQ0FBQyxDQUFBO0FBRUQsTUFBTSxpQkFBaUIsR0FBRyxDQUFDLEtBQWdCLEVBQVUsRUFBRTtJQUNyRCxNQUFNLEdBQUcsR0FBRyxJQUFJLEdBQUcsRUFBVSxDQUFBO0lBRTdCLE1BQU0sU0FBUyxHQUFHLElBQUksV0FBVyxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUE7SUFFcEQsS0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLFNBQVMsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQztRQUMxQyxHQUFHLENBQUMsR0FBRyxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFBO0lBQ3ZCLENBQUM7SUFFRCxPQUFPLEdBQUcsQ0FBQyxJQUFJLENBQUE7QUFDakIsQ0FBQyxDQUFBIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgcmVuZGVyIH0gZnJvbSAnLi4vbGliL2VuZ2luZS5qcydcclxuaW1wb3J0IHsgY29sb3JUb1JnYiwgY3JlYXRlQ29sb3IsIGNyZWF0ZUNvbG9yMjQgfSBmcm9tICcuLi9saWIvaW1hZ2UvY29sb3IuanMnXHJcbmltcG9ydCB7IGNyZWF0ZUltYWdlIH0gZnJvbSAnLi4vbGliL2ltYWdlL2NyZWF0ZS5qcydcclxuaW1wb3J0IHsgZmlsbCB9IGZyb20gJy4uL2xpYi9pbWFnZS9maWxsLmpzJ1xyXG5pbXBvcnQgeyBsb2FkSW1hZ2UgfSBmcm9tICcuLi9saWIvaW1hZ2UvbG9hZC5qcydcclxuaW1wb3J0IHsgcmVzaXplIH0gZnJvbSAnLi4vbGliL2ltYWdlL3Jlc2l6ZS5qcydcclxuaW1wb3J0IHsgTWF5YmUsIFNjZW5lLCBTdGF0ZSwgVDIgfSBmcm9tICcuLi9saWIvdHlwZXMuanMnXHJcbmltcG9ydCB7IG1heWJlIH0gZnJvbSAnLi4vbGliL3V0aWwuanMnXHJcblxyXG5pbXBvcnQge1xyXG4gIEdlbmVyYXRlZFBhbGV0dGUsIGdlbmVyYXRlUGFsZXR0ZSxcclxuICBpbmRleE9mQ2xvc2VzdFJnYlxyXG59IGZyb20gJy4uL3NhbmRib3gvZ2VuZXJhdGUtcGFsZXR0ZS5qcydcclxuXHJcbi8vIGV4cGVyaW1lbnRpbmcgd2l0aCBpbmRleGVkIHBhbGV0dGVcclxuZXhwb3J0IGNvbnN0IHBhbGV0dGVTYW5kYm94U2NlbmUgPSAoKTogU2NlbmUgPT4ge1xyXG4gIGxldCBwYWxldHRlOiBNYXliZTxHZW5lcmF0ZWRQYWxldHRlPiA9IG51bGxcclxuICBsZXQgdGVzdEltYWdlOiBNYXliZTxJbWFnZURhdGE+ID0gbnVsbFxyXG5cclxuICAvLyB0aGVzZSBuYWl2ZSBsdXRzIGFyZSBzbG93IHRvIGdlbmVyYXRlIGFuZCB0YWtlIGEgbG90IG9mIG1lbW9yeSwgYnV0IHRoZXlcclxuICAvLyBzZXJ2ZSBhcyBhIGdvb2QgcmVmZXJlbmNlIGltcGxlbWVudGF0aW9uIGFuZCBiYXNlbGluZSBmb3IgcGVyZm9ybWFuY2VcclxuICAvLyBjb21wYXJpc29uc1xyXG4gIC8vXHJcbiAgLy8gMTZtYiFcclxuICBsZXQgbmFpdmVMdXQ6IE1heWJlPFVpbnQ4QXJyYXk+ID0gbnVsbFxyXG4gIC8vIDY0bWIhXHJcbiAgbGV0IG5haXZlTHV0MzI6IE1heWJlPFVpbnQzMkFycmF5PiA9IG51bGxcclxuXHJcbiAgLy8gdGVzdGluZyBhbiBpZGVhXHJcbiAgLy8gYWxzbyAxNm1iXHJcbiAgbGV0IG5haXZlTHV0MjogTWF5YmU8VWludDhBcnJheT4gPSBudWxsXHJcbiAgbGV0IHBhbDI6IE1heWJlPFVpbnQzMkFycmF5PiA9IG51bGxcclxuICBsZXQgbmFpdmUyTHV0MzI6IE1heWJlPFVpbnQzMkFycmF5PiA9IG51bGxcclxuXHJcbiAgY29uc3QgY3JlYXRlUGFsSW1hZ2UgPSAoXHJcbiAgICBwYWw6IEdlbmVyYXRlZFBhbGV0dGUsIHc6IG51bWJlciwgaDogbnVtYmVyXHJcbiAgKSA9PiB7XHJcbiAgICBjb25zdCBwYWxJbWFnZSA9IGNyZWF0ZUltYWdlKHcsIGgpXHJcblxyXG4gICAgZmlsbChwYWxJbWFnZSwgY3JlYXRlQ29sb3IoMHgwMCwgMHhmZiwgMHhmZikpXHJcblxyXG4gICAgZm9yIChsZXQgeSA9IDA7IHkgPCBoOyB5KyspIHtcclxuICAgICAgY29uc3Qgcm93ID0geSAqIHdcclxuICAgICAgZm9yIChsZXQgeCA9IDA7IHggPCB3OyB4KyspIHtcclxuICAgICAgICBjb25zdCBpbmRleCA9IHJvdyArIHhcclxuICAgICAgICBjb25zdCBwYWxJbmRleCA9IGluZGV4ICogM1xyXG5cclxuICAgICAgICBpZiAocGFsSW5kZXggPj0gcGFsLmRhdGEubGVuZ3RoKSB7XHJcbiAgICAgICAgICBicmVha1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgY29uc3QgciA9IHBhbC5kYXRhW3BhbEluZGV4XVxyXG4gICAgICAgIGNvbnN0IGcgPSBwYWwuZGF0YVtwYWxJbmRleCArIDFdXHJcbiAgICAgICAgY29uc3QgYiA9IHBhbC5kYXRhW3BhbEluZGV4ICsgMl1cclxuXHJcbiAgICAgICAgY29uc3QgaW1nSW5kZXggPSBpbmRleCAqIDRcclxuXHJcbiAgICAgICAgcGFsSW1hZ2UuZGF0YVtpbWdJbmRleF0gPSByXHJcbiAgICAgICAgcGFsSW1hZ2UuZGF0YVtpbWdJbmRleCArIDFdID0gZ1xyXG4gICAgICAgIHBhbEltYWdlLmRhdGFbaW1nSW5kZXggKyAyXSA9IGJcclxuICAgICAgICBwYWxJbWFnZS5kYXRhW2ltZ0luZGV4ICsgM10gPSAyNTVcclxuICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiBwYWxJbWFnZVxyXG4gIH1cclxuXHJcbiAgY29uc3QgY3JlYXRlUGFsMkltYWdlID0gKFxyXG4gICAgcGFsOiBVaW50MzJBcnJheSwgdzogbnVtYmVyLCBoOiBudW1iZXJcclxuICApID0+IHtcclxuICAgIGlmIChwYWwubGVuZ3RoID4gdyAqIGgpIHtcclxuICAgICAgdGhyb3cgRXJyb3IoJ1BhbGV0dGUgaXMgdG9vIGxhcmdlIGZvciBpbWFnZScpXHJcbiAgICB9XHJcbiAgICBjb25zdCBwYWxJbWFnZSA9IGNyZWF0ZUltYWdlKHcsIGgpXHJcblxyXG4gICAgZmlsbChwYWxJbWFnZSwgY3JlYXRlQ29sb3IoMHgwMCwgMHhmZiwgMHhmZikpXHJcblxyXG4gICAgcGFsID0gcGFsLm1hcChjb2xvciA9PiBjb2xvciB8IDB4ZmYwMDAwMDApXHJcblxyXG4gICAgY29uc3QgdmlldyA9IG5ldyBVaW50MzJBcnJheShwYWxJbWFnZS5kYXRhLmJ1ZmZlcilcclxuXHJcbiAgICB2aWV3LnNldChwYWwpXHJcblxyXG4gICAgcmV0dXJuIHBhbEltYWdlXHJcbiAgfVxyXG5cclxuICBjb25zdCBpbml0ID0gYXN5bmMgKHN0YXRlOiBTdGF0ZSkgPT4ge1xyXG4gICAgY29uc3QgYnVmZmVyID0gc3RhdGUudmlldy5nZXRCdWZmZXIoKVxyXG5cclxuICAgIGZpbGwoYnVmZmVyLCBjcmVhdGVDb2xvcigweDAwLCAweDAwLCAweDAwKSlcclxuXHJcbiAgICBjb25zb2xlLmxvZygnc3RhcnRpbmcgaW5pdCcpXHJcblxyXG4gICAgY29uc3QgeyB3aWR0aCwgaGVpZ2h0IH0gPSBidWZmZXJcclxuXHJcbiAgICBjb25zdCBwcm9ncmVzc0JhcldpZHRoID0gTWF0aC5mbG9vcih3aWR0aCAqIDAuOClcclxuICAgIGNvbnN0IHByb2dyZXNzQmFyWCA9IE1hdGguZmxvb3Iod2lkdGggKiAwLjEpXHJcbiAgICBjb25zdCBwcm9ncmVzc0JhclkgPSBNYXRoLmZsb29yKGhlaWdodCAqIDAuNSlcclxuICAgIGNvbnN0IHByb2dyZXNzQmFySGVpZ2h0ID0gMlxyXG5cclxuICAgIGNvbnN0IHByb2dyZXNzID0gKHRvdGFsOiBudW1iZXIpID0+IHtcclxuICAgICAgY29uc3Qgc3RlcCA9IHByb2dyZXNzQmFyV2lkdGggLyB0b3RhbFxyXG5cclxuICAgICAgcmV0dXJuIChpOiBudW1iZXIpID0+IHtcclxuICAgICAgICBmaWxsKFxyXG4gICAgICAgICAgYnVmZmVyLFxyXG4gICAgICAgICAgY3JlYXRlQ29sb3IoMHg2NiwgMHg2NiwgMHg2NiksXHJcbiAgICAgICAgICBbcHJvZ3Jlc3NCYXJYLCBwcm9ncmVzc0JhclksIHByb2dyZXNzQmFyV2lkdGgsIHByb2dyZXNzQmFySGVpZ2h0XVxyXG4gICAgICAgIClcclxuXHJcbiAgICAgICAgY29uc3Qgd2lkdGggPSBNYXRoLnJvdW5kKHN0ZXAgKiBpKVxyXG5cclxuICAgICAgICBmaWxsKFxyXG4gICAgICAgICAgYnVmZmVyLFxyXG4gICAgICAgICAgY3JlYXRlQ29sb3IoMHgzMywgMHg5OSwgMHhmZiksXHJcbiAgICAgICAgICBbcHJvZ3Jlc3NCYXJYLCBwcm9ncmVzc0JhclksIHdpZHRoLCBwcm9ncmVzc0JhckhlaWdodF1cclxuICAgICAgICApXHJcblxyXG4gICAgICAgIHJlbmRlcigpXHJcbiAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICAvLyByZXNlcnZlIG9uZSBjb2xvciBmb3IgZWcgdHJhbnNwYXJlbnRcclxuICAgIHBhbGV0dGUgPSBnZW5lcmF0ZVBhbGV0dGUoMjU1LCAxMiwgNCwgNSlcclxuXHJcbiAgICAvLyBqdXN0IGxvZyB0aGUgbWV0YWRhdGFcclxuICAgIGNvbnN0IG5vRW50cmllcyA9IHtcclxuICAgICAgLi4ucGFsZXR0ZSxcclxuICAgICAgZGF0YTogdW5kZWZpbmVkXHJcbiAgICB9XHJcblxyXG4gICAgY29uc29sZS5sb2cobm9FbnRyaWVzKVxyXG5cclxuICAgIHRlc3RJbWFnZSA9IGF3YWl0IGxvYWRJbWFnZSgnc2NlbmVzL3BhbC9jb2xvcnMucG5nJylcclxuXHJcbiAgICBjb25zdCBwYWxDb2xvcnM6IFQyW10gPSBbXVxyXG5cclxuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgcGFsZXR0ZS5lbnRyeUNvdW50OyBpKyspIHtcclxuICAgICAgY29uc3QgciA9IHBhbGV0dGUuZGF0YVtpICogM11cclxuICAgICAgY29uc3QgZyA9IHBhbGV0dGUuZGF0YVtpICogMyArIDFdXHJcbiAgICAgIGNvbnN0IGIgPSBwYWxldHRlLmRhdGFbaSAqIDMgKyAyXVxyXG5cclxuICAgICAgY29uc3QgY29sb3IyNCA9IGNyZWF0ZUNvbG9yMjQociwgZywgYilcclxuXHJcbiAgICAgIHBhbENvbG9ycy5wdXNoKFtjb2xvcjI0LCBpXSlcclxuICAgIH1cclxuXHJcbiAgICBwYWxDb2xvcnMuc29ydCgoYSwgYikgPT4gYVswXSAtIGJbMF0pXHJcblxyXG4gICAgY29uc29sZS5sb2coJ3BhbENvbG9ycycsIHBhbENvbG9ycylcclxuXHJcbiAgICBjb25zdCBwYWxNYXBOZXdUb09sZCA9IEFycmF5PG51bWJlcj4ocGFsZXR0ZS5lbnRyeUNvdW50KVxyXG4gICAgY29uc3QgcGFsTWFwT2xkVG9OZXcgPSBBcnJheTxudW1iZXI+KHBhbGV0dGUuZW50cnlDb3VudClcclxuXHJcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHBhbENvbG9ycy5sZW5ndGg7IGkrKykge1xyXG4gICAgICBjb25zdCBvbGRJbmRleCA9IHBhbENvbG9yc1tpXVsxXVxyXG5cclxuICAgICAgcGFsTWFwTmV3VG9PbGRbaV0gPSBvbGRJbmRleFxyXG4gICAgICBwYWxNYXBPbGRUb05ld1tvbGRJbmRleF0gPSBpXHJcbiAgICB9XHJcblxyXG4gICAgcGFsMiA9IG5ldyBVaW50MzJBcnJheShwYWxldHRlLmVudHJ5Q291bnQpXHJcblxyXG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBwYWxldHRlLmVudHJ5Q291bnQ7IGkrKykge1xyXG4gICAgICBwYWwyW2ldID0gcGFsQ29sb3JzW2ldWzBdXHJcbiAgICB9XHJcblxyXG4gICAgY29uc29sZS5sb2coJ3BhbDInLCBwYWwyKVxyXG5cclxuICAgIG5haXZlMkx1dDMyID0gbmV3IFVpbnQzMkFycmF5KHBhbGV0dGUuZW50cnlDb3VudClcclxuXHJcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHBhbGV0dGUuZW50cnlDb3VudDsgaSsrKSB7XHJcbiAgICAgIGNvbnN0IHIgPSBwYWxldHRlLmRhdGFbaSAqIDNdXHJcbiAgICAgIGNvbnN0IGcgPSBwYWxldHRlLmRhdGFbaSAqIDMgKyAxXVxyXG4gICAgICBjb25zdCBiID0gcGFsZXR0ZS5kYXRhW2kgKiAzICsgMl1cclxuXHJcbiAgICAgIGNvbnN0IGNvbG9yID0gY3JlYXRlQ29sb3IociwgZywgYilcclxuXHJcbiAgICAgIG5haXZlMkx1dDMyW2ldID0gY29sb3JcclxuICAgIH1cclxuXHJcbiAgICAvLyBcclxuXHJcbiAgICBjb25zdCBudW1Db2xvcnMyNCA9IDB4ZmZmZmZmXHJcblxyXG4gICAgY29uc3QgclZhbHVlcyA9IG5ldyBTZXQ8bnVtYmVyPigpXHJcbiAgICBjb25zdCBnVmFsdWVzID0gbmV3IFNldDxudW1iZXI+KClcclxuICAgIGNvbnN0IGJWYWx1ZXMgPSBuZXcgU2V0PG51bWJlcj4oKVxyXG4gICAgY29uc3QgY1ZhbHVlcyA9IG5ldyBTZXQ8bnVtYmVyPigpXHJcblxyXG4gICAgY29uc3Qgc3RlcENvdW50ID0gMTBcclxuXHJcbiAgICBjb25zdCBwID0gcHJvZ3Jlc3Moc3RlcENvdW50KVxyXG5cclxuICAgIGNvbnNvbGUubG9nKCdnZW5lcmF0ZWQgcGFsZXR0ZSBsb29rdXBzJylcclxuXHJcbiAgICBwKDApXHJcbiAgICBhd2FpdCByZW5kZXIoKVxyXG5cclxuICAgIGNvbnN0IHBzdGVwID0gbnVtQ29sb3JzMjQgLyBzdGVwQ291bnRcclxuICAgIGxldCBjc3RlcCA9IHBzdGVwXHJcbiAgICBsZXQgcHZhbCA9IDBcclxuXHJcbiAgICBjb25zdCBubHV0U3RhcnQgPSBwZXJmb3JtYW5jZS5ub3coKVxyXG4gICAgbmFpdmVMdXQgPSBuZXcgVWludDhBcnJheShudW1Db2xvcnMyNClcclxuICAgIG5haXZlTHV0MzIgPSBuZXcgVWludDMyQXJyYXkobnVtQ29sb3JzMjQpXHJcblxyXG4gICAgbmFpdmVMdXQyID0gbmV3IFVpbnQ4QXJyYXkobnVtQ29sb3JzMjQpXHJcblxyXG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCAweGZmZmZmZjsgaSsrKSB7XHJcbiAgICAgIGNvbnN0IFtyLCBnLCBiXSA9IGNvbG9yVG9SZ2IoaSlcclxuICAgICAgY29uc3QgaW5kZXggPSBpbmRleE9mQ2xvc2VzdFJnYihwYWxldHRlLCBbciwgZywgYl0pXHJcbiAgICAgIG5haXZlTHV0W2ldID0gaW5kZXhcclxuICAgICAgbmFpdmVMdXQyW2ldID0gcGFsTWFwT2xkVG9OZXdbaW5kZXhdXHJcblxyXG4gICAgICBjb25zdCBwYWxSID0gcGFsZXR0ZS5kYXRhW2luZGV4ICogM11cclxuICAgICAgY29uc3QgcGFsRyA9IHBhbGV0dGUuZGF0YVtpbmRleCAqIDMgKyAxXVxyXG4gICAgICBjb25zdCBwYWxCID0gcGFsZXR0ZS5kYXRhW2luZGV4ICogMyArIDJdXHJcblxyXG4gICAgICByVmFsdWVzLmFkZChwYWxSKVxyXG4gICAgICBnVmFsdWVzLmFkZChwYWxHKVxyXG4gICAgICBiVmFsdWVzLmFkZChwYWxCKVxyXG5cclxuICAgICAgY1ZhbHVlcy5hZGQocGFsUilcclxuICAgICAgY1ZhbHVlcy5hZGQocGFsRylcclxuICAgICAgY1ZhbHVlcy5hZGQocGFsQilcclxuXHJcbiAgICAgIGNvbnN0IGNvbG9yID0gY3JlYXRlQ29sb3IocGFsUiwgcGFsRywgcGFsQilcclxuXHJcbiAgICAgIG5haXZlTHV0MzJbaV0gPSBjb2xvclxyXG5cclxuICAgICAgaWYgKGkgPj0gY3N0ZXApIHtcclxuICAgICAgICBjc3RlcCArPSBwc3RlcFxyXG4gICAgICAgIHB2YWwrK1xyXG4gICAgICAgIHAocHZhbClcclxuXHJcbiAgICAgICAgYXdhaXQgcmVuZGVyKClcclxuICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIGNvbnN0IG5sdXRFbmQgPSBwZXJmb3JtYW5jZS5ub3coKVxyXG5cclxuICAgIGNvbnNvbGUubG9nKCdOYWl2ZSBMVVRzIFRpbWU6Jywgbmx1dEVuZCAtIG5sdXRTdGFydClcclxuXHJcbiAgICBjb25zb2xlLmxvZygnTmFpdmUgTFVUJywgbmFpdmVMdXQpXHJcbiAgICBjb25zb2xlLmxvZygnTmFpdmUgTFVUIDInLCBuYWl2ZUx1dDIpXHJcblxyXG4gICAgLy9cclxuXHJcbiAgICBjb25zdCByQXJyID0gQXJyYXkuZnJvbShyVmFsdWVzKVxyXG4gICAgY29uc3QgZ0FyciA9IEFycmF5LmZyb20oZ1ZhbHVlcylcclxuICAgIGNvbnN0IGJBcnIgPSBBcnJheS5mcm9tKGJWYWx1ZXMpXHJcbiAgICBjb25zdCBjQXJyID0gQXJyYXkuZnJvbShjVmFsdWVzKVxyXG5cclxuICAgIHJBcnIuc29ydCgoYSwgYikgPT4gYSAtIGIpXHJcbiAgICBnQXJyLnNvcnQoKGEsIGIpID0+IGEgLSBiKVxyXG4gICAgYkFyci5zb3J0KChhLCBiKSA9PiBhIC0gYilcclxuICAgIGNBcnIuc29ydCgoYSwgYikgPT4gYSAtIGIpXHJcblxyXG4gICAgY29uc29sZS5sb2coJ3JBcnInLCByQXJyKVxyXG4gICAgY29uc29sZS5sb2coJ2dBcnInLCBnQXJyKVxyXG4gICAgY29uc29sZS5sb2coJ2JBcnInLCBiQXJyKVxyXG4gICAgY29uc29sZS5sb2coJ2NBcnInLCBjQXJyKVxyXG5cclxuICAgIC8vXHJcblxyXG4gICAgLy8gbmFpdmVMdXQgaXMgYSBtYXBwaW5nIHdoZXJlIHRoZSBpbmRleCBpcyB0aGUgMjQgYml0IHJnYiB2YWx1ZSBhbmQgdGhlXHJcbiAgICAvLyB2YWx1ZSBpcyB0aGUgaW5kZXggb2YgdGhlIGNsb3Nlc3QgY29sb3IgaW4gdGhlIHBhbGV0dGVcclxuICAgIC8vXHJcbiAgICAvLyBjb25zZWN1dGl2ZSAyNCBiaXQgaW5kaWNlcyBhbGwgcG9pbnQgdG8gdGhlIHNhbWUgcGFsZXR0ZSBpbmRleCBpbiBydW5zXHJcbiAgICAvLyB3ZSBjb3VsZCBjb21wcmVzcyB0aGUgc3RydWN0dXJlIGxpa2Ugc286XHJcbiAgICAvLyBcclxuICAgIC8vIHdlIHVzZSBhIFVpbnQzMkFycmF5IHRvIHN0b3JlIHR3byBmaWVsZHM6XHJcbiAgICAvLyAxLiB0aGUgMjQgYml0IHZhbHVlIHRoYXQgaXMgdGhlICplbmQqIG9mIHRoZSByb3cgb2YgY29uc2VjdXRpdmUgaW5kaWNlc1xyXG4gICAgLy8gMi4gdGhlIDggYml0IHBhbGV0dGUgaW5kZXhcclxuICAgIC8vXHJcbiAgICAvLyB0aGVuLCB0byBtYXAgcmdiIHRvIGluZGV4LCB5b3Ugc2VhcmNoIHRocm91Z2ggZWFjaCBmaWVsZCB0byBmaW5kIHRoZSBcclxuICAgIC8vIGZpcnN0IGVuZCBvZiByb3cgd2hpY2ggaXMgZ3JlYXRlciB0aGFuIG9yIGVxdWFsIHRvIHRoZSByZ2IgdmFsdWVcclxuICAgIC8vIGFuZCByZXR1cm4gdGhlIHBhbGV0dGUgaW5kZXhcclxuICAgIC8vIGl0IHdpbGwgYmUgYSBiaXQgc2xvd2VyIHRoYW4gZWcgbmFpdmVMdXQzMiB3aGljaCBpcyB0aGUgZmFzdGVzdCwgYnV0IFxyXG4gICAgLy8gdGhhdCBzdHJ1Y3R1cmUgaXMgfjY0bWJcclxuXHJcbiAgICBsZXQgcHJldiA9IC0xXHJcbiAgICBsZXQgcm93Q291bnQgPSAwXHJcblxyXG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBudW1Db2xvcnMyNDsgaSsrKSB7XHJcbiAgICAgIGNvbnN0IHZhbHVlID0gbmFpdmVMdXRbaV1cclxuXHJcbiAgICAgIGlmICh2YWx1ZSAhPT0gcHJldikge1xyXG4gICAgICAgIHJvd0NvdW50KytcclxuICAgICAgfVxyXG5cclxuICAgICAgcHJldiA9IHZhbHVlXHJcbiAgICB9XHJcblxyXG4gICAgLy8gaXQgd2lsbCBoYXZlIHJvd0NvdW50IHJvd3NcclxuXHJcbiAgICBjb25zb2xlLmxvZygncm93Y291bnQ6Jywgcm93Q291bnQsICdieXRlczonLCByb3dDb3VudCAqIDQpXHJcblxyXG4gICAgLy9cclxuXHJcbiAgICBjcmVhdGVOZXdMdXRUaGluZyhwYWxldHRlKVxyXG4gIH1cclxuXHJcbiAgbGV0IGlzRGlzYWJsZVVwZGF0ZSA9IGZhbHNlXHJcblxyXG4gIGNvbnN0IHVwZGF0ZSA9IChzdGF0ZTogU3RhdGUpID0+IHtcclxuICAgIGlmICghbWF5YmUocGFsZXR0ZSkpIHRocm93IEVycm9yKCdQYWxldHRlIG5vdCBnZW5lcmF0ZWQnKVxyXG4gICAgaWYgKCFtYXliZSh0ZXN0SW1hZ2UpKSB0aHJvdyBFcnJvcignVGVzdCBpbWFnZSBub3QgbG9hZGVkJylcclxuICAgIGlmICghbWF5YmUobmFpdmVMdXQpKSB0aHJvdyBFcnJvcignTmFpdmUgTFVUIG5vdCBnZW5lcmF0ZWQnKVxyXG4gICAgaWYgKCFtYXliZShuYWl2ZUx1dDMyKSkgdGhyb3cgRXJyb3IoJ05haXZlIExVVDMyIG5vdCBnZW5lcmF0ZWQnKVxyXG4gICAgaWYgKCFtYXliZShuYWl2ZUx1dDIpKSB0aHJvdyBFcnJvcignTmFpdmUgTFVUMiBub3QgZ2VuZXJhdGVkJylcclxuICAgIGlmICghbWF5YmUocGFsMikpIHRocm93IEVycm9yKCdQYWwyIG5vdCBnZW5lcmF0ZWQnKVxyXG4gICAgaWYgKCFtYXliZShuYWl2ZTJMdXQzMikpIHRocm93IEVycm9yKCdOYWl2ZTIgTFVUMzIgbm90IGdlbmVyYXRlZCcpXHJcblxyXG4gICAgLy8gdGVtcCBcclxuICAgIGlmIChpc0Rpc2FibGVVcGRhdGUpIHJldHVyblxyXG5cclxuICAgIGNvbnN0IHdoZWVsID0gc3RhdGUubW91c2UuZ2V0V2hlZWwoKVxyXG4gICAgY29uc3Qgem9vbSA9IHN0YXRlLnZpZXcuZ2V0Wm9vbSgpXHJcblxyXG4gICAgaWYgKHdoZWVsIDwgMCkge1xyXG4gICAgICBzdGF0ZS52aWV3LnNldFpvb20oIHpvb20gKyAxIClcclxuICAgIH0gZWxzZSBpZiAod2hlZWwgPiAwKSB7XHJcbiAgICAgIHN0YXRlLnZpZXcuc2V0Wm9vbSggem9vbSAtIDEgKVxyXG4gICAgfVxyXG5cclxuICAgIGNvbnN0IGJ1ZmZlciA9IHN0YXRlLnZpZXcuZ2V0QnVmZmVyKClcclxuXHJcbiAgICBmaWxsKGJ1ZmZlciwgY3JlYXRlQ29sb3IoMHgwMCwgMHgwMCwgMHgwMCkpXHJcblxyXG4gICAgbG9nT25jZSgnYnVmZmVyUGl4ZWxzJywgJ0J1ZmZlciBwaXhlbHM6JywgYnVmZmVyLndpZHRoICogYnVmZmVyLmhlaWdodClcclxuXHJcbiAgICAvLyBjb3VsZCBvcHRpbWl6ZSBieSBkb2luZyB0aGlzIGluIGluaXQsIGJ1dCB0aGUgc2NlbmUgZWFzaWx5IGhpdHMgNjBmcHNcclxuICAgIC8vIGFuZCBpdCdzIGp1c3QgYSBzYW5kYm94XHJcblxyXG4gICAgLy8gcGFsZXR0ZSBzdHVmZlxyXG5cclxuICAgIGNvbnN0IG51bVBhbHMgPSAyXHJcblxyXG4gICAgLy9cclxuXHJcbiAgICBjb25zdCBwYWxXaWR0aCA9IHBhbGV0dGUubGlnaHRSYW5nZVxyXG4gICAgY29uc3QgcGFsSGVpZ2h0ID0gTWF0aC5jZWlsKHBhbGV0dGUuZW50cnlDb3VudCAvIHBhbFdpZHRoKVxyXG5cclxuICAgIC8vXHJcblxyXG4gICAgY29uc3QgcGFsSW1hZ2UgPSBjcmVhdGVQYWxJbWFnZShwYWxldHRlLCBwYWxXaWR0aCwgcGFsSGVpZ2h0KVxyXG5cclxuICAgIGNvbnN0IG5ld0hlaWdodCA9IGJ1ZmZlci5oZWlnaHRcclxuICAgIGNvbnN0IHNjYWxlID0gbmV3SGVpZ2h0IC8gcGFsSGVpZ2h0XHJcbiAgICBjb25zdCBuZXdXaWR0aCA9IE1hdGguZmxvb3IocGFsV2lkdGggKiBzY2FsZSlcclxuXHJcbiAgICByZXNpemUoXHJcbiAgICAgIHBhbEltYWdlLCBidWZmZXIsXHJcbiAgICAgIFswLCAwLCBwYWxXaWR0aCwgcGFsSGVpZ2h0XSwgWzAsIDAsIG5ld1dpZHRoLCBuZXdIZWlnaHRdXHJcbiAgICApXHJcblxyXG4gICAgLy9cclxuXHJcbiAgICBjb25zdCBwYWwySW1hZ2UgPSBjcmVhdGVQYWwySW1hZ2UocGFsMiwgcGFsV2lkdGgsIHBhbEhlaWdodClcclxuXHJcbiAgICByZXNpemUoXHJcbiAgICAgIHBhbDJJbWFnZSwgYnVmZmVyLFxyXG4gICAgICBbMCwgMCwgcGFsV2lkdGgsIHBhbEhlaWdodF0sIFtuZXdXaWR0aCwgMCwgbmV3V2lkdGgsIG5ld0hlaWdodF1cclxuICAgIClcclxuXHJcbiAgICAvL1xyXG5cclxuICAgIGNvbnN0IHBhbHNXaWR0aCA9IG5ld1dpZHRoICogbnVtUGFsc1xyXG5cclxuICAgIC8vXHJcblxyXG4gICAgY29uc3QgcmVtYWluaW5nV2lkdGggPSBidWZmZXIud2lkdGggLSBwYWxzV2lkdGhcclxuXHJcbiAgICAvL1xyXG4gICAgY29uc3QgaW1hZ2VDb3VudCA9IDVcclxuXHJcbiAgICAvLyBtYWtlIHNwYWNlIGZvciBpbWFnZXMgc2lkZSBieSBzaWRlXHJcbiAgICBjb25zdCBpbWFnZVdpZHRocyA9IE1hdGguZmxvb3IocmVtYWluaW5nV2lkdGggLyBpbWFnZUNvdW50KVxyXG5cclxuICAgIC8vIG5leHQgd2UnbGwgdHJ5IGNvbnZlcnRpbmcgYW4gaW1hZ2UgdG8gcGFsZXR0ZSBhbmQgc2hvdyB0aGUgb3JpZ2luYWxcclxuICAgIC8vIGFuZCBjb252ZXJ0ZWQgc2lkZSBieSBzaWRlLCB0aGVuIHdlIGNhbiBzdGFydCBleHBlcmltZW50aW5nIHdpdGhcclxuICAgIC8vIGNyZWF0aW5nIGEgTFVUXHJcblxyXG4gICAgY29uc3QgbmV3T3JpZ1dpZHRoID0gaW1hZ2VXaWR0aHNcclxuICAgIGNvbnN0IHNjYWxlT3JpZyA9IG5ld09yaWdXaWR0aCAvIHRlc3RJbWFnZS53aWR0aFxyXG4gICAgY29uc3QgbmV3T3JpZ0hlaWdodCA9IE1hdGguZmxvb3IodGVzdEltYWdlLmhlaWdodCAqIHNjYWxlT3JpZylcclxuXHJcbiAgICByZXNpemUoXHJcbiAgICAgIHRlc3RJbWFnZSwgYnVmZmVyLFxyXG4gICAgICBbMCwgMCwgdGVzdEltYWdlLndpZHRoLCB0ZXN0SW1hZ2UuaGVpZ2h0XSxcclxuICAgICAgW3BhbHNXaWR0aCwgMCwgbmV3T3JpZ1dpZHRoLCBuZXdPcmlnSGVpZ2h0XVxyXG4gICAgKVxyXG5cclxuICAgIGNvbnN0IGNvbG9yc09yaWcgPSBjb3VudFVuaXF1ZUNvbG9ycyh0ZXN0SW1hZ2UpXHJcblxyXG4gICAgbG9nT25jZSgnY29sb3JzT3JpZycsICdVbmlxdWUgY29sb3JzIGluIG9yaWdpbmFsIGltYWdlOicsIGNvbG9yc09yaWcpXHJcblxyXG4gICAgLy8gc2xvdyBpbmRleGVkIGNvbnZlcnNpb24sIGRpcmVjdCBzZWFyY2hcclxuXHJcbiAgICBjb25zdCBzdGFydENvbnYwVGltZSA9IHBlcmZvcm1hbmNlLm5vdygpXHJcbiAgICBjb25zdCBpbmRleGVkID0gdG9QYWxldHRlKHRlc3RJbWFnZSwgcGFsZXR0ZSlcclxuICAgIGNvbnN0IGVuZENvbnYwVGltZSA9IHBlcmZvcm1hbmNlLm5vdygpXHJcblxyXG4gICAgY29uc3QgY29sb3JzSW5kZXhlZCA9IGNvdW50VW5pcXVlQ29sb3JzKGluZGV4ZWQpXHJcblxyXG4gICAgbG9nT25jZShcclxuICAgICAgJ2NvbnYwJyxcclxuICAgICAgJ0NvbnZlcnNpb24gMCB0aW1lOicsIGVuZENvbnYwVGltZSAtIHN0YXJ0Q29udjBUaW1lLFxyXG4gICAgICAnUGl4ZWwgY291bnQ6JywgdGVzdEltYWdlLndpZHRoICogdGVzdEltYWdlLmhlaWdodCxcclxuICAgICAgJ1VuaXF1ZSBjb2xvcnM6JywgY29sb3JzSW5kZXhlZFxyXG4gICAgKVxyXG5cclxuICAgIHJlc2l6ZShcclxuICAgICAgaW5kZXhlZCwgYnVmZmVyLFxyXG4gICAgICBbMCwgMCwgaW5kZXhlZC53aWR0aCwgaW5kZXhlZC5oZWlnaHRdLFxyXG4gICAgICBbcGFsc1dpZHRoICsgbmV3T3JpZ1dpZHRoLCAwLCBuZXdPcmlnV2lkdGgsIG5ld09yaWdIZWlnaHRdXHJcbiAgICApXHJcblxyXG4gICAgLy8gTFVUIGV4cGVyaW1lbnRzXHJcblxyXG4gICAgY29uc3Qgc3RhcnRDb252MVRpbWUgPSBwZXJmb3JtYW5jZS5ub3coKVxyXG4gICAgY29uc3QgaW5kZXhlZEx1dCA9IHRvUGFsZXR0ZUx1dCh0ZXN0SW1hZ2UsIHBhbGV0dGUsIG5haXZlTHV0KVxyXG4gICAgY29uc3QgZW5kQ29udjFUaW1lID0gcGVyZm9ybWFuY2Uubm93KClcclxuXHJcbiAgICBjb25zdCBjb2xvcnNMdXQgPSBjb3VudFVuaXF1ZUNvbG9ycyhpbmRleGVkTHV0KVxyXG5cclxuICAgIGxvZ09uY2UoXHJcbiAgICAgICdjb252MScsXHJcbiAgICAgICdDb252ZXJzaW9uIDEgdGltZTonLCBlbmRDb252MVRpbWUgLSBzdGFydENvbnYxVGltZSxcclxuICAgICAgJ1BpeGVsIGNvdW50OicsIHRlc3RJbWFnZS53aWR0aCAqIHRlc3RJbWFnZS5oZWlnaHQsXHJcbiAgICAgICdVbmlxdWUgY29sb3JzOicsIGNvbG9yc0x1dFxyXG4gICAgKVxyXG5cclxuICAgIHJlc2l6ZShcclxuICAgICAgaW5kZXhlZEx1dCwgYnVmZmVyLFxyXG4gICAgICBbMCwgMCwgaW5kZXhlZEx1dC53aWR0aCwgaW5kZXhlZEx1dC5oZWlnaHRdLFxyXG4gICAgICBbcGFsc1dpZHRoICsgbmV3T3JpZ1dpZHRoICogMiwgMCwgbmV3T3JpZ1dpZHRoLCBuZXdPcmlnSGVpZ2h0XVxyXG4gICAgKVxyXG5cclxuICAgIC8vXHJcblxyXG4gICAgY29uc3Qgc3RhcnRDb252MlRpbWUgPSBwZXJmb3JtYW5jZS5ub3coKVxyXG4gICAgY29uc3QgaW5kZXhlZEx1dDMyID0gdG9QYWxldHRlTHV0MzIodGVzdEltYWdlLCBuYWl2ZUx1dDMyKVxyXG4gICAgY29uc3QgZW5kQ29udjJUaW1lID0gcGVyZm9ybWFuY2Uubm93KClcclxuXHJcbiAgICBjb25zdCBjb2xvcnNMdXQzMiA9IGNvdW50VW5pcXVlQ29sb3JzKGluZGV4ZWRMdXQzMilcclxuXHJcbiAgICBsb2dPbmNlKFxyXG4gICAgICAnY29udjInLFxyXG4gICAgICAnQ29udmVyc2lvbiAyIHRpbWU6JywgZW5kQ29udjJUaW1lIC0gc3RhcnRDb252MlRpbWUsXHJcbiAgICAgICdQaXhlbCBjb3VudDonLCB0ZXN0SW1hZ2Uud2lkdGggKiB0ZXN0SW1hZ2UuaGVpZ2h0LFxyXG4gICAgICAnVW5pcXVlIGNvbG9yczonLCBjb2xvcnNMdXQzMlxyXG4gICAgKVxyXG5cclxuICAgIHJlc2l6ZShcclxuICAgICAgaW5kZXhlZEx1dDMyLCBidWZmZXIsXHJcbiAgICAgIFswLCAwLCBpbmRleGVkTHV0MzIud2lkdGgsIGluZGV4ZWRMdXQzMi5oZWlnaHRdLFxyXG4gICAgICBbcGFsc1dpZHRoICsgbmV3T3JpZ1dpZHRoICogMywgMCwgbmV3T3JpZ1dpZHRoLCBuZXdPcmlnSGVpZ2h0XVxyXG4gICAgKVxyXG4gICAgLy8gXHJcblxyXG4gICAgY29uc3Qgc3RhcnRMdXQyVGltZSA9IHBlcmZvcm1hbmNlLm5vdygpXHJcbiAgICBjb25zdCB7IGNoQ291bnQsIGNoYW5uZWxMb29rdXAsIHRhYmxlIH0gPSBjcmVhdGVOZXdMdXRUaGluZyhwYWxldHRlKVxyXG4gICAgY29uc3QgZW5kTHV0MlRpbWUgPSBwZXJmb3JtYW5jZS5ub3coKVxyXG5cclxuICAgIGxvZ09uY2UoXHJcbiAgICAgICdsdXQyJyxcclxuICAgICAgJ0xVVCAyIHRpbWU6JywgZW5kTHV0MlRpbWUgLSBzdGFydEx1dDJUaW1lLFxyXG4gICAgICAnVGFibGUgc2l6ZTonLCB0YWJsZS5ieXRlTGVuZ3RoXHJcbiAgICApXHJcblxyXG4gICAgY29uc3Qgc3RhcnRDb252M1RpbWUgPSBwZXJmb3JtYW5jZS5ub3coKVxyXG4gICAgY29uc3QgaW5kZXhlZExvb2t1cDIgPSB0b1BhbGV0dGVMb29rdXAzKFxyXG4gICAgICB0ZXN0SW1hZ2UsIG5haXZlMkx1dDMyLFxyXG4gICAgICBjaENvdW50LCBjaGFubmVsTG9va3VwLCB0YWJsZVxyXG4gICAgKVxyXG4gICAgY29uc3QgZW5kQ29udjNUaW1lID0gcGVyZm9ybWFuY2Uubm93KClcclxuXHJcbiAgICBjb25zdCBjb2xvcnNMb29rdXAyID0gY291bnRVbmlxdWVDb2xvcnMoaW5kZXhlZExvb2t1cDIpXHJcblxyXG4gICAgbG9nT25jZShcclxuICAgICAgJ2NvbnYzJyxcclxuICAgICAgJ0NvbnZlcnNpb24gMyB0aW1lOicsIGVuZENvbnYzVGltZSAtIHN0YXJ0Q29udjNUaW1lLFxyXG4gICAgICAnUGl4ZWwgY291bnQ6JywgdGVzdEltYWdlLndpZHRoICogdGVzdEltYWdlLmhlaWdodCxcclxuICAgICAgJ1VuaXF1ZSBjb2xvcnM6JywgY29sb3JzTG9va3VwMlxyXG4gICAgKVxyXG5cclxuICAgIHJlc2l6ZShcclxuICAgICAgaW5kZXhlZExvb2t1cDIsIGJ1ZmZlcixcclxuICAgICAgWzAsIDAsIGluZGV4ZWRMb29rdXAyLndpZHRoLCBpbmRleGVkTG9va3VwMi5oZWlnaHRdLFxyXG4gICAgICBbcGFsc1dpZHRoICsgbmV3T3JpZ1dpZHRoICogNCwgMCwgbmV3T3JpZ1dpZHRoLCBuZXdPcmlnSGVpZ2h0XVxyXG4gICAgKVxyXG4gIH1cclxuXHJcbiAgY29uc3QgcXVpdCA9IGFzeW5jIChfc3RhdGU6IFN0YXRlKSA9PiB7XHJcbiAgICBwYWxldHRlID0gbnVsbFxyXG4gIH1cclxuXHJcbiAgcmV0dXJuIHsgaW5pdCwgdXBkYXRlLCBxdWl0IH1cclxufVxyXG5cclxuY29uc3Qgc2VlbiA9IG5ldyBTZXQ8c3RyaW5nPigpXHJcbmNvbnN0IGxvZ09uY2UgPSAoaWQ6IHN0cmluZywgLi4uYXJnczogYW55W10pID0+IHtcclxuICBpZiAoc2Vlbi5oYXMoaWQpKSByZXR1cm5cclxuICBzZWVuLmFkZChpZClcclxuICBjb25zb2xlLmxvZyguLi5hcmdzKVxyXG59XHJcblxyXG5jb25zdCB0b1BhbGV0dGUgPSAoaW1hZ2U6IEltYWdlRGF0YSwgcGFsZXR0ZTogR2VuZXJhdGVkUGFsZXR0ZSk6IEltYWdlRGF0YSA9PiB7XHJcbiAgY29uc3QgbmV3SW1hZ2UgPSBjcmVhdGVJbWFnZShpbWFnZS53aWR0aCwgaW1hZ2UuaGVpZ2h0KVxyXG5cclxuICAvL1xyXG5cclxuICBmb3IgKGxldCB5ID0gMDsgeSA8IGltYWdlLmhlaWdodDsgeSsrKSB7XHJcbiAgICBjb25zdCByb3cgPSB5ICogaW1hZ2Uud2lkdGhcclxuICAgIGZvciAobGV0IHggPSAwOyB4IDwgaW1hZ2Uud2lkdGg7IHgrKykge1xyXG4gICAgICBjb25zdCBpbmRleCA9IHJvdyArIHhcclxuICAgICAgY29uc3QgZGF0YUluZGV4ID0gaW5kZXggKiA0XHJcblxyXG4gICAgICBjb25zdCBvciA9IGltYWdlLmRhdGFbZGF0YUluZGV4XVxyXG4gICAgICBjb25zdCBvZyA9IGltYWdlLmRhdGFbZGF0YUluZGV4ICsgMV1cclxuICAgICAgY29uc3Qgb2IgPSBpbWFnZS5kYXRhW2RhdGFJbmRleCArIDJdXHJcblxyXG4gICAgICBjb25zdCBwYWxJbmRleCA9IGluZGV4T2ZDbG9zZXN0UmdiKHBhbGV0dGUsIFtvciwgb2csIG9iXSlcclxuXHJcbiAgICAgIGNvbnN0IHByID0gcGFsZXR0ZS5kYXRhW3BhbEluZGV4ICogM11cclxuICAgICAgY29uc3QgcGcgPSBwYWxldHRlLmRhdGFbcGFsSW5kZXggKiAzICsgMV1cclxuICAgICAgY29uc3QgcGIgPSBwYWxldHRlLmRhdGFbcGFsSW5kZXggKiAzICsgMl1cclxuXHJcbiAgICAgIG5ld0ltYWdlLmRhdGFbZGF0YUluZGV4XSA9IHByXHJcbiAgICAgIG5ld0ltYWdlLmRhdGFbZGF0YUluZGV4ICsgMV0gPSBwZ1xyXG4gICAgICBuZXdJbWFnZS5kYXRhW2RhdGFJbmRleCArIDJdID0gcGJcclxuICAgICAgbmV3SW1hZ2UuZGF0YVtkYXRhSW5kZXggKyAzXSA9IDI1NVxyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgLy9cclxuXHJcbiAgcmV0dXJuIG5ld0ltYWdlXHJcbn1cclxuXHJcbmNvbnN0IHRvUGFsZXR0ZUx1dCA9IChcclxuICBpbWFnZTogSW1hZ2VEYXRhLCBwYWxldHRlOiBHZW5lcmF0ZWRQYWxldHRlLCBsdXQ6IFVpbnQ4QXJyYXlcclxuKTogSW1hZ2VEYXRhID0+IHtcclxuICBjb25zdCBuZXdJbWFnZSA9IGNyZWF0ZUltYWdlKGltYWdlLndpZHRoLCBpbWFnZS5oZWlnaHQpXHJcblxyXG4gIC8vXHJcblxyXG4gIGZvciAobGV0IHkgPSAwOyB5IDwgaW1hZ2UuaGVpZ2h0OyB5KyspIHtcclxuICAgIGNvbnN0IHJvdyA9IHkgKiBpbWFnZS53aWR0aFxyXG4gICAgZm9yIChsZXQgeCA9IDA7IHggPCBpbWFnZS53aWR0aDsgeCsrKSB7XHJcbiAgICAgIGNvbnN0IGluZGV4ID0gcm93ICsgeFxyXG4gICAgICBjb25zdCBkYXRhSW5kZXggPSBpbmRleCAqIDRcclxuXHJcbiAgICAgIGNvbnN0IG9yID0gaW1hZ2UuZGF0YVtkYXRhSW5kZXhdXHJcbiAgICAgIGNvbnN0IG9nID0gaW1hZ2UuZGF0YVtkYXRhSW5kZXggKyAxXVxyXG4gICAgICBjb25zdCBvYiA9IGltYWdlLmRhdGFbZGF0YUluZGV4ICsgMl1cclxuXHJcbiAgICAgIGNvbnN0IGx1dEluZGV4ID0gY3JlYXRlQ29sb3IyNChvciwgb2csIG9iKVxyXG4gICAgICBjb25zdCBwYWxJbmRleCA9IGx1dFtsdXRJbmRleF1cclxuXHJcbiAgICAgIGNvbnN0IHByID0gcGFsZXR0ZS5kYXRhW3BhbEluZGV4ICogM11cclxuICAgICAgY29uc3QgcGcgPSBwYWxldHRlLmRhdGFbcGFsSW5kZXggKiAzICsgMV1cclxuICAgICAgY29uc3QgcGIgPSBwYWxldHRlLmRhdGFbcGFsSW5kZXggKiAzICsgMl1cclxuXHJcbiAgICAgIG5ld0ltYWdlLmRhdGFbZGF0YUluZGV4XSA9IHByXHJcbiAgICAgIG5ld0ltYWdlLmRhdGFbZGF0YUluZGV4ICsgMV0gPSBwZ1xyXG4gICAgICBuZXdJbWFnZS5kYXRhW2RhdGFJbmRleCArIDJdID0gcGJcclxuICAgICAgbmV3SW1hZ2UuZGF0YVtkYXRhSW5kZXggKyAzXSA9IDI1NVxyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgLy9cclxuXHJcbiAgcmV0dXJuIG5ld0ltYWdlXHJcbn1cclxuXHJcbmNvbnN0IHRvUGFsZXR0ZUx1dDMyID0gKFxyXG4gIHNyYzogSW1hZ2VEYXRhLCBsdXQ6IFVpbnQzMkFycmF5XHJcbik6IEltYWdlRGF0YSA9PiB7XHJcbiAgY29uc3QgbmV3SW1hZ2UgPSBjcmVhdGVJbWFnZShzcmMud2lkdGgsIHNyYy5oZWlnaHQpXHJcblxyXG4gIGNvbnN0IHNpemUgPSBzcmMud2lkdGggKiBzcmMuaGVpZ2h0XHJcblxyXG4gIGNvbnN0IHNyY1ZpZXcgPSBuZXcgVWludDMyQXJyYXkoc3JjLmRhdGEuYnVmZmVyKVxyXG4gIGNvbnN0IGRlc3RWaWV3ID0gbmV3IFVpbnQzMkFycmF5KG5ld0ltYWdlLmRhdGEuYnVmZmVyKVxyXG5cclxuICAvL1xyXG5cclxuICBmb3IgKGxldCBpID0gMDsgaSA8IHNpemU7IGkrKykge1xyXG4gICAgY29uc3QgcmdiYSA9IHNyY1ZpZXdbaV1cclxuICAgIGNvbnN0IHJnYiA9IHJnYmEgJiAweDAwZmZmZmZmXHJcblxyXG4gICAgZGVzdFZpZXdbaV0gPSBsdXRbcmdiXVxyXG4gIH1cclxuXHJcbiAgLy9cclxuXHJcbiAgcmV0dXJuIG5ld0ltYWdlXHJcbn1cclxuXHJcbmNvbnN0IHRvUGFsZXR0ZUxvb2t1cDMgPSAoXHJcbiAgc3JjOiBJbWFnZURhdGEsIGNvbG9yczogVWludDMyQXJyYXksXHJcbiAgY2hDb3VudDogbnVtYmVyLCBjaGFubmVsTG9va3VwOiBVaW50OEFycmF5LCB0YWJsZTogVWludDhBcnJheVxyXG4pOiBJbWFnZURhdGEgPT4ge1xyXG4gIGNvbnN0IGRlc3QgPSBjcmVhdGVJbWFnZShzcmMud2lkdGgsIHNyYy5oZWlnaHQpXHJcblxyXG4gIGNvbnN0IGRlc3RWaWV3ID0gbmV3IFVpbnQzMkFycmF5KGRlc3QuZGF0YS5idWZmZXIpXHJcblxyXG4gIC8vXHJcblxyXG4gIGNvbnN0IHJPZmZzZXRTaXplID0gY2hDb3VudCAqIGNoQ291bnRcclxuXHJcbiAgZm9yIChsZXQgeSA9IDA7IHkgPCBzcmMuaGVpZ2h0OyB5KyspIHtcclxuICAgIGNvbnN0IHJvdyA9IHkgKiBzcmMud2lkdGhcclxuICAgIGZvciAobGV0IHggPSAwOyB4IDwgc3JjLndpZHRoOyB4KyspIHtcclxuICAgICAgY29uc3QgaW5kZXggPSByb3cgKyB4XHJcbiAgICAgIGNvbnN0IGRhdGFJbmRleCA9IGluZGV4ICogNFxyXG5cclxuICAgICAgY29uc3Qgb3IgPSBzcmMuZGF0YVtkYXRhSW5kZXhdXHJcbiAgICAgIGNvbnN0IG9nID0gc3JjLmRhdGFbZGF0YUluZGV4ICsgMV1cclxuICAgICAgY29uc3Qgb2IgPSBzcmMuZGF0YVtkYXRhSW5kZXggKyAyXVxyXG5cclxuICAgICAgY29uc3QgcmkgPSBjaGFubmVsTG9va3VwW29yXVxyXG4gICAgICBjb25zdCBnaSA9IGNoYW5uZWxMb29rdXBbb2ddXHJcbiAgICAgIGNvbnN0IGJpID0gY2hhbm5lbExvb2t1cFtvYl1cclxuXHJcbiAgICAgIGNvbnN0IHJpT2Zmc2V0ID0gcmkgKiByT2Zmc2V0U2l6ZVxyXG4gICAgICBjb25zdCBnaU9mZnNldCA9IGdpICogY2hDb3VudFxyXG4gICAgICBjb25zdCBsb29rdXAgPSBiaSArIGdpT2Zmc2V0ICsgcmlPZmZzZXRcclxuXHJcbiAgICAgIGNvbnN0IGNsb3Nlc3QgPSB0YWJsZVtsb29rdXBdXHJcblxyXG4gICAgICBkZXN0Vmlld1tpbmRleF0gPSBjb2xvcnNbY2xvc2VzdF0gfCAweGZmMDAwMDAwXHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICAvL1xyXG5cclxuICByZXR1cm4gZGVzdFxyXG59XHJcblxyXG4vKlxyXG4gIG9rIG5ldyBzdHJhdGVneVxyXG5cclxuICAxLiBnZW5lcmF0ZSBhIHBhbGV0dGVcclxuICAyLiBmb3IgZXZlcnkgY29sb3IsIGdldCB0aGUgdGhyZWUgY2hhbm5lbHMgYW5kIGFkZCB0aGVpciB2YWx1ZXMgdG8gYSBzZXRcclxuICAzLiBhdCB0aGUgZW5kLCB5b3UgaGF2ZSBhIHNldCBvZiB2YWx1ZXMgZm9yIGV2ZXJ5IHBvc3NpYmxlIGNoYW5uZWwgdmFsdWVcclxuICAgICBlZyBmb3Igb3VyIDEyLzQvNSBodWUgZ2VuZXJhdGVkIHBhbGV0dGUgb2YgMjU1IGNvbG9ycywgdGhlcmUgYXJlIDM4IHVuaXF1ZVxyXG4gICAgIHZhbHVlcyBmb3IgZXZlcnkgY2hhbm5lbFxyXG4gIDQuIGNyZWF0ZSBhIGxvb2t1cCB0YWJsZSB3aXRoIDAuLjI1NSBpbmRpY2VzLCBhbmQgdGhlIG5lYXJlc3QgbWF0Y2ggZnJvbSBvdXJcclxuICAgICBzZXRcclxuICA1LiBleHBlcmltZW50IC0gb25lIHdlIHJlY29uc3RydWN0IGEgY29sb3IgZnJvbSBhbiB1bmluZGV4ZWQgaW1hZ2UsIGlzIGV2ZXJ5XHJcbiAgICAgdmFsdWUgcHJlc2VudCBpbiBvdXIgcGFsZXR0ZT9cclxuXHJcbiAgSW4gb3VyIGV4YW1wbGUgd2l0aCAzOCB1bmlxdWUgdmFsdWVzLCB0aGVyZSBhcmUgMzgqKjMgKDU0LDg3MikgcG9zc2libGUgXHJcbiAgY29sb3JzLCBhIGxvdCBsZXNzIHRoYW4gb3VyIDE2IG1pbGxpb24gY29sb3JzcGFjZSAgIFxyXG5cclxuICBGaXJzdCwgY29udmVydCByYXcgciwgZywgYiBpbnRvIHJhbmdlIDAuLjM3IG1hdGNoaW5nIHRvIGluZGV4IG9mIGNsb3Nlc3QgdmFsdWUgXHJcbiAgaW4gdGhlIHNldFxyXG5cclxuICBTbyB5b3UgY2FuIG1ha2UgYSBsb29rdXAgdGFibGUgd2hpY2ggaXMgYSBVaW50OEFycmF5IG9mIDM4KiozIGVudHJpZXNcclxuXHJcbiAgWW91IGNhbiBpbmRleCBpbnRvIGl0IGJ5OlxyXG5cclxuICByIFswLi4zN11cclxuICBnIFswLi4zN11cclxuICBiIFswLi4zN11cclxuXHJcbiAgY29uc3QgaW5kZXggPSAoIHIgKiAzOCAqIDM4ICkgKyAoIGcgKiAzOCApICsgYlxyXG5cclxuICB3aXRoIGVhY2ggaW5kZXggcG9pbnRpbmcgdG8gYSBwYWxldHRlIGluZGV4XHJcbiovXHJcblxyXG5jb25zdCBuZWFyZXN0TWF0Y2ggPSAodmFsdWVzOiBudW1iZXJbXSwgdmFsdWU6IG51bWJlcikgPT4ge1xyXG4gIGxldCBjbG9zZXN0ID0gdmFsdWVzWzBdXHJcbiAgbGV0IGNsb3Nlc3REaXN0ID0gTWF0aC5hYnModmFsdWUgLSBjbG9zZXN0KVxyXG5cclxuICBmb3IgKGxldCBpID0gMTsgaSA8IHZhbHVlcy5sZW5ndGg7IGkrKykge1xyXG4gICAgY29uc3QgZGlzdCA9IE1hdGguYWJzKHZhbHVlIC0gdmFsdWVzW2ldKVxyXG5cclxuICAgIGlmIChkaXN0IDwgY2xvc2VzdERpc3QpIHtcclxuICAgICAgY2xvc2VzdCA9IHZhbHVlc1tpXVxyXG4gICAgICBjbG9zZXN0RGlzdCA9IGRpc3RcclxuICAgIH1cclxuICB9XHJcblxyXG4gIHJldHVybiBjbG9zZXN0XHJcbn1cclxuXHJcbmNvbnN0IGNyZWF0ZU5ld0x1dFRoaW5nID0gKHBhbGV0dGU6IEdlbmVyYXRlZFBhbGV0dGUpID0+IHtcclxuICBjb25zdCBjaGFubmVsU2V0ID0gbmV3IFNldDxudW1iZXI+KClcclxuXHJcbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBwYWxldHRlLmVudHJ5Q291bnQ7IGkrKykge1xyXG4gICAgY2hhbm5lbFNldC5hZGQocGFsZXR0ZS5kYXRhW2kgKiAzXSlcclxuICAgIGNoYW5uZWxTZXQuYWRkKHBhbGV0dGUuZGF0YVtpICogMyArIDFdKVxyXG4gICAgY2hhbm5lbFNldC5hZGQocGFsZXR0ZS5kYXRhW2kgKiAzICsgMl0pXHJcbiAgfVxyXG5cclxuICBjb25zdCB2YWx1ZXMgPSBBcnJheS5mcm9tKGNoYW5uZWxTZXQpLnNvcnQoKGEsIGIpID0+IGEgLSBiKVxyXG5cclxuICBjb25zdCBjaENvdW50ID0gdmFsdWVzLmxlbmd0aFxyXG5cclxuICBjb25zdCBjaGFubmVsTG9va3VwID0gbmV3IFVpbnQ4QXJyYXkoMjU2KVxyXG5cclxuICBmb3IgKGxldCBpID0gMDsgaSA8IDI1NjsgaSsrKSB7XHJcbiAgICBjb25zdCBjbG9zZXN0ID0gbmVhcmVzdE1hdGNoKHZhbHVlcywgaSlcclxuXHJcbiAgICBjaGFubmVsTG9va3VwW2ldID0gdmFsdWVzLmluZGV4T2YoY2xvc2VzdClcclxuICB9XHJcblxyXG4gIGNvbnN0IHRhYmxlU2l6ZSA9IGNoQ291bnQgKiogM1xyXG5cclxuICBjb25zdCB0YWJsZSA9IG5ldyBVaW50OEFycmF5KHRhYmxlU2l6ZSlcclxuXHJcbiAgY29uc3QgclNpemUgPSBjaENvdW50ICogY2hDb3VudFxyXG5cclxuICBmb3IgKGxldCByaSA9IDA7IHJpIDwgY2hDb3VudDsgcmkrKykge1xyXG4gICAgY29uc3QgcmlPZmZzZXQgPSByaSAqIHJTaXplXHJcbiAgICBmb3IgKGxldCBnaSA9IDA7IGdpIDwgY2hDb3VudDsgZ2krKykge1xyXG4gICAgICBjb25zdCBnaU9mZnNldCA9IGdpICogY2hDb3VudCArIHJpT2Zmc2V0XHJcbiAgICAgIGZvciAobGV0IGJpID0gMDsgYmkgPCBjaENvdW50OyBiaSsrKSB7XHJcbiAgICAgICAgY29uc3QgaW5kZXggPSBiaSArIGdpT2Zmc2V0XHJcblxyXG4gICAgICAgIGNvbnN0IHIgPSB2YWx1ZXNbcmldXHJcbiAgICAgICAgY29uc3QgZyA9IHZhbHVlc1tnaV1cclxuICAgICAgICBjb25zdCBiID0gdmFsdWVzW2JpXVxyXG5cclxuICAgICAgICBjb25zdCBjbG9zZXN0ID0gaW5kZXhPZkNsb3Nlc3RSZ2IocGFsZXR0ZSwgW3IsIGcsIGJdKVxyXG5cclxuICAgICAgICB0YWJsZVtpbmRleF0gPSBjbG9zZXN0XHJcbiAgICAgIH1cclxuICAgIH1cclxuICB9XHJcblxyXG4gIHJldHVybiB7IGNoQ291bnQsIGNoYW5uZWxMb29rdXAsIHRhYmxlIH1cclxufVxyXG5cclxuY29uc3QgY291bnRVbmlxdWVDb2xvcnMgPSAoaW1hZ2U6IEltYWdlRGF0YSk6IG51bWJlciA9PiB7XHJcbiAgY29uc3Qgc2V0ID0gbmV3IFNldDxudW1iZXI+KClcclxuXHJcbiAgY29uc3QgaW1hZ2VWaWV3ID0gbmV3IFVpbnQzMkFycmF5KGltYWdlLmRhdGEuYnVmZmVyKVxyXG5cclxuICBmb3IgKGxldCBpID0gMDsgaSA8IGltYWdlVmlldy5sZW5ndGg7IGkrKykge1xyXG4gICAgc2V0LmFkZChpbWFnZVZpZXdbaV0pXHJcbiAgfVxyXG5cclxuICByZXR1cm4gc2V0LnNpemVcclxufVxyXG4iXX0=