import { colorToRgb, createColor, createColor24 } from '../lib/image/color.js';
import { createImage } from '../lib/image/create.js';
import { fill } from '../lib/image/fill.js';
import { loadImage } from '../lib/image/load.js';
import { pointResize } from '../lib/image/resize.js';
import { maybe, wait } from '../lib/util.js';
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
            return async (i) => {
                fill(buffer, createColor(0x66, 0x66, 0x66), [progressBarX, progressBarY, progressBarWidth, progressBarHeight]);
                const width = Math.round(step * i);
                fill(buffer, createColor(0x33, 0x99, 0xff), [progressBarX, progressBarY, width, progressBarHeight]);
                await wait();
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
        await p(0);
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
                await p(pval);
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
        pointResize(palImage, buffer, [0, 0, palWidth, palHeight], [0, 0, newWidth, newHeight]);
        //
        const pal2Image = createPal2Image(pal2, palWidth, palHeight);
        pointResize(pal2Image, buffer, [0, 0, palWidth, palHeight], [newWidth, 0, newWidth, newHeight]);
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
        pointResize(testImage, buffer, [0, 0, testImage.width, testImage.height], [palsWidth, 0, newOrigWidth, newOrigHeight]);
        const colorsOrig = countUniqueColors(testImage);
        logOnce('colorsOrig', 'Unique colors in original image:', colorsOrig);
        // slow indexed conversion, direct search
        const startConv0Time = performance.now();
        const indexed = toPalette(testImage, palette);
        const endConv0Time = performance.now();
        const colorsIndexed = countUniqueColors(indexed);
        logOnce('conv0', 'Conversion 0 time:', endConv0Time - startConv0Time, 'Pixel count:', testImage.width * testImage.height, 'Unique colors:', colorsIndexed);
        pointResize(indexed, buffer, [0, 0, indexed.width, indexed.height], [palsWidth + newOrigWidth, 0, newOrigWidth, newOrigHeight]);
        // LUT experiments
        const startConv1Time = performance.now();
        const indexedLut = toPaletteLut(testImage, palette, naiveLut);
        const endConv1Time = performance.now();
        const colorsLut = countUniqueColors(indexedLut);
        logOnce('conv1', 'Conversion 1 time:', endConv1Time - startConv1Time, 'Pixel count:', testImage.width * testImage.height, 'Unique colors:', colorsLut);
        pointResize(indexedLut, buffer, [0, 0, indexedLut.width, indexedLut.height], [palsWidth + newOrigWidth * 2, 0, newOrigWidth, newOrigHeight]);
        //
        const startConv2Time = performance.now();
        const indexedLut32 = toPaletteLut32(testImage, naiveLut32);
        const endConv2Time = performance.now();
        const colorsLut32 = countUniqueColors(indexedLut32);
        logOnce('conv2', 'Conversion 2 time:', endConv2Time - startConv2Time, 'Pixel count:', testImage.width * testImage.height, 'Unique colors:', colorsLut32);
        pointResize(indexedLut32, buffer, [0, 0, indexedLut32.width, indexedLut32.height], [palsWidth + newOrigWidth * 3, 0, newOrigWidth, newOrigHeight]);
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
        pointResize(indexedLookup2, buffer, [0, 0, indexedLookup2.width, indexedLookup2.height], [palsWidth + newOrigWidth * 4, 0, newOrigWidth, newOrigHeight]);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicGFsZXR0ZS1zY2VuZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy9zY2VuZXMvcGFsZXR0ZS1zY2VuZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxPQUFPLEVBQUUsVUFBVSxFQUFFLFdBQVcsRUFBRSxhQUFhLEVBQUUsTUFBTSx1QkFBdUIsQ0FBQTtBQUM5RSxPQUFPLEVBQUUsV0FBVyxFQUFFLE1BQU0sd0JBQXdCLENBQUE7QUFDcEQsT0FBTyxFQUFFLElBQUksRUFBRSxNQUFNLHNCQUFzQixDQUFBO0FBQzNDLE9BQU8sRUFBRSxTQUFTLEVBQUUsTUFBTSxzQkFBc0IsQ0FBQTtBQUNoRCxPQUFPLEVBQUUsV0FBVyxFQUFFLE1BQU0sd0JBQXdCLENBQUE7QUFFcEQsT0FBTyxFQUFFLEtBQUssRUFBRSxJQUFJLEVBQUUsTUFBTSxnQkFBZ0IsQ0FBQTtBQUU1QyxPQUFPLEVBQ2EsZUFBZSxFQUNqQyxpQkFBaUIsRUFDbEIsTUFBTSxnQ0FBZ0MsQ0FBQTtBQUV2QyxxQ0FBcUM7QUFDckMsTUFBTSxDQUFDLE1BQU0sbUJBQW1CLEdBQUcsR0FBVSxFQUFFO0lBQzdDLElBQUksT0FBTyxHQUE0QixJQUFJLENBQUE7SUFDM0MsSUFBSSxTQUFTLEdBQXFCLElBQUksQ0FBQTtJQUV0QywyRUFBMkU7SUFDM0Usd0VBQXdFO0lBQ3hFLGNBQWM7SUFDZCxFQUFFO0lBQ0YsUUFBUTtJQUNSLElBQUksUUFBUSxHQUFzQixJQUFJLENBQUE7SUFDdEMsUUFBUTtJQUNSLElBQUksVUFBVSxHQUF1QixJQUFJLENBQUE7SUFFekMsa0JBQWtCO0lBQ2xCLFlBQVk7SUFDWixJQUFJLFNBQVMsR0FBc0IsSUFBSSxDQUFBO0lBQ3ZDLElBQUksSUFBSSxHQUF1QixJQUFJLENBQUE7SUFDbkMsSUFBSSxXQUFXLEdBQXVCLElBQUksQ0FBQTtJQUUxQyxNQUFNLGNBQWMsR0FBRyxDQUNyQixHQUFxQixFQUFFLENBQVMsRUFBRSxDQUFTLEVB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QUcsT0FBTyxFQUFFLEVBQUUsRUFBRSxFQUFFLENBQUM7Z0JBQ3BDLE1BQU0sS0FBSyxHQUFHLEVBQUUsR0FBRyxRQUFRLENBQUE7Z0JBRTNCLE1BQU0sQ0FBQyxHQUFHLE1BQU0sQ0FBQyxFQUFFLENBQUMsQ0FBQTtnQkFDcEIsTUFBTSxDQUFDLEdBQUcsTUFBTSxDQUFDLEVBQUUsQ0FBQyxDQUFBO2dCQUNwQixNQUFNLENBQUMsR0FBRyxNQUFNLENBQUMsRUFBRSxDQUFDLENBQUE7Z0JBRXBCLE1BQU0sT0FBTyxHQUFHLGlCQUFpQixDQUFDLE9BQU8sRUFBRSxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQTtnQkFFckQsS0FBSyxDQUFDLEtBQUssQ0FBQyxHQUFHLE9BQU8sQ0FBQTtZQUN4QixDQUFDO1FBQ0gsQ0FBQztJQUNILENBQUM7SUFFRCxPQUFPLEVBQUUsT0FBTyxFQUFFLGFBQWEsRUFBRSxLQUFLLEVBQUUsQ0FBQTtBQUMxQyxDQUFDLENBQUE7QUFFRCxNQUFNLGlCQUFpQixHQUFHLENBQUMsS0FBZ0IsRUFBVSxFQUFFO0lBQ3JELE1BQU0sR0FBRyxHQUFHLElBQUksR0FBRyxFQUFVLENBQUE7SUFFN0IsTUFBTSxTQUFTLEdBQUcsSUFBSSxXQUFXLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQTtJQUVwRCxLQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsU0FBUyxDQUFDLE1BQU0sRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDO1FBQzFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUE7SUFDdkIsQ0FBQztJQUVELE9BQU8sR0FBRyxDQUFDLElBQUksQ0FBQTtBQUNqQixDQUFDLENBQUEiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBjb2xvclRvUmdiLCBjcmVhdGVDb2xvciwgY3JlYXRlQ29sb3IyNCB9IGZyb20gJy4uL2xpYi9pbWFnZS9jb2xvci5qcydcclxuaW1wb3J0IHsgY3JlYXRlSW1hZ2UgfSBmcm9tICcuLi9saWIvaW1hZ2UvY3JlYXRlLmpzJ1xyXG5pbXBvcnQgeyBmaWxsIH0gZnJvbSAnLi4vbGliL2ltYWdlL2ZpbGwuanMnXHJcbmltcG9ydCB7IGxvYWRJbWFnZSB9IGZyb20gJy4uL2xpYi9pbWFnZS9sb2FkLmpzJ1xyXG5pbXBvcnQgeyBwb2ludFJlc2l6ZSB9IGZyb20gJy4uL2xpYi9pbWFnZS9yZXNpemUuanMnXHJcbmltcG9ydCB7IE1heWJlLCBTY2VuZSwgU3RhdGUsIFQyIH0gZnJvbSAnLi4vbGliL3R5cGVzLmpzJ1xyXG5pbXBvcnQgeyBtYXliZSwgd2FpdCB9IGZyb20gJy4uL2xpYi91dGlsLmpzJ1xyXG5cclxuaW1wb3J0IHtcclxuICBHZW5lcmF0ZWRQYWxldHRlLCBnZW5lcmF0ZVBhbGV0dGUsXHJcbiAgaW5kZXhPZkNsb3Nlc3RSZ2JcclxufSBmcm9tICcuLi9zYW5kYm94L2dlbmVyYXRlLXBhbGV0dGUuanMnXHJcblxyXG4vLyBleHBlcmltZW50aW5nIHdpdGggaW5kZXhlZCBwYWxldHRlXHJcbmV4cG9ydCBjb25zdCBwYWxldHRlU2FuZGJveFNjZW5lID0gKCk6IFNjZW5lID0+IHtcclxuICBsZXQgcGFsZXR0ZTogTWF5YmU8R2VuZXJhdGVkUGFsZXR0ZT4gPSBudWxsXHJcbiAgbGV0IHRlc3RJbWFnZTogTWF5YmU8SW1hZ2VEYXRhPiA9IG51bGxcclxuXHJcbiAgLy8gdGhlc2UgbmFpdmUgbHV0cyBhcmUgc2xvdyB0byBnZW5lcmF0ZSBhbmQgdGFrZSBhIGxvdCBvZiBtZW1vcnksIGJ1dCB0aGV5XHJcbiAgLy8gc2VydmUgYXMgYSBnb29kIHJlZmVyZW5jZSBpbXBsZW1lbnRhdGlvbiBhbmQgYmFzZWxpbmUgZm9yIHBlcmZvcm1hbmNlXHJcbiAgLy8gY29tcGFyaXNvbnNcclxuICAvL1xyXG4gIC8vIDE2bWIhXHJcbiAgbGV0IG5haXZlTHV0OiBNYXliZTxVaW50OEFycmF5PiA9IG51bGxcclxuICAvLyA2NG1iIVxyXG4gIGxldCBuYWl2ZUx1dDMyOiBNYXliZTxVaW50MzJBcnJheT4gPSBudWxsXHJcblxyXG4gIC8vIHRlc3RpbmcgYW4gaWRlYVxyXG4gIC8vIGFsc28gMTZtYlxyXG4gIGxldCBuYWl2ZUx1dDI6IE1heWJlPFVpbnQ4QXJyYXk+ID0gbnVsbFxyXG4gIGxldCBwYWwyOiBNYXliZTxVaW50MzJBcnJheT4gPSBudWxsXHJcbiAgbGV0IG5haXZlMkx1dDMyOiBNYXliZTxVaW50MzJBcnJheT4gPSBudWxsXHJcblxyXG4gIGNvbnN0IGNyZWF0ZVBhbEltYWdlID0gKFxyXG4gICAgcGFsOiBHZW5lcmF0ZWRQYWxldHRlLCB3OiBudW1iZXIsIGg6IG51bWJlclxyXG4gICkgPT4ge1xyXG4gICAgY29uc3QgcGFsSW1hZ2UgPSBjcmVhdGVJbWFnZSh3LCBoKVxyXG5cclxuICAgIGZpbGwocGFsSW1hZ2UsIGNyZWF0ZUNvbG9yKDB4MDAsIDB4ZmYsIDB4ZmYpKVxyXG5cclxuICAgIGZvciAobGV0IHkgPSAwOyB5IDwgaDsgeSsrKSB7XHJcbiAgICAgIGNvbnN0IHJvdyA9IHkgKiB3XHJcbiAgICAgIGZvciAobGV0IHggPSAwOyB4IDwgdzsgeCsrKSB7XHJcbiAgICAgICAgY29uc3QgaW5kZXggPSByb3cgKyB4XHJcbiAgICAgICAgY29uc3QgcGFsSW5kZXggPSBpbmRleCAqIDNcclxuXHJcbiAgICAgICAgaWYgKHBhbEluZGV4ID49IHBhbC5kYXRhLmxlbmd0aCkge1xyXG4gICAgICAgICAgYnJlYWtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGNvbnN0IHIgPSBwYWwuZGF0YVtwYWxJbmRleF1cclxuICAgICAgICBjb25zdCBnID0gcGFsLmRhdGFbcGFsSW5kZXggKyAxXVxyXG4gICAgICAgIGNvbnN0IGIgPSBwYWwuZGF0YVtwYWxJbmRleCArIDJdXHJcblxyXG4gICAgICAgIGNvbnN0IGltZ0luZGV4ID0gaW5kZXggKiA0XHJcblxyXG4gICAgICAgIHBhbEltYWdlLmRhdGFbaW1nSW5kZXhdID0gclxyXG4gICAgICAgIHBhbEltYWdlLmRhdGFbaW1nSW5kZXggKyAxXSA9IGdcclxuICAgICAgICBwYWxJbWFnZS5kYXRhW2ltZ0luZGV4ICsgMl0gPSBiXHJcbiAgICAgICAgcGFsSW1hZ2UuZGF0YVtpbWdJbmRleCArIDNdID0gMjU1XHJcbiAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gcGFsSW1hZ2VcclxuICB9XHJcblxyXG4gIGNvbnN0IGNyZWF0ZVBhbDJJbWFnZSA9IChcclxuICAgIHBhbDogVWludDMyQXJyYXksIHc6IG51bWJlciwgaDogbnVtYmVyXHJcbiAgKSA9PiB7XHJcbiAgICBpZiAocGFsLmxlbmd0aCA+IHcgKiBoKSB7XHJcbiAgICAgIHRocm93IEVycm9yKCdQYWxldHRlIGlzIHRvbyBsYXJnZSBmb3IgaW1hZ2UnKVxyXG4gICAgfVxyXG4gICAgY29uc3QgcGFsSW1hZ2UgPSBjcmVhdGVJbWFnZSh3LCBoKVxyXG5cclxuICAgIGZpbGwocGFsSW1hZ2UsIGNyZWF0ZUNvbG9yKDB4MDAsIDB4ZmYsIDB4ZmYpKVxyXG5cclxuICAgIHBhbCA9IHBhbC5tYXAoY29sb3IgPT4gY29sb3IgfCAweGZmMDAwMDAwKVxyXG5cclxuICAgIGNvbnN0IHZpZXcgPSBuZXcgVWludDMyQXJyYXkocGFsSW1hZ2UuZGF0YS5idWZmZXIpXHJcblxyXG4gICAgdmlldy5zZXQocGFsKVxyXG5cclxuICAgIHJldHVybiBwYWxJbWFnZVxyXG4gIH1cclxuXHJcbiAgY29uc3QgaW5pdCA9IGFzeW5jIChzdGF0ZTogU3RhdGUpID0+IHtcclxuICAgIGNvbnN0IGJ1ZmZlciA9IHN0YXRlLnZpZXcuZ2V0QnVmZmVyKClcclxuXHJcbiAgICBmaWxsKGJ1ZmZlciwgY3JlYXRlQ29sb3IoMHgwMCwgMHgwMCwgMHgwMCkpXHJcblxyXG4gICAgY29uc29sZS5sb2coJ3N0YXJ0aW5nIGluaXQnKVxyXG5cclxuICAgIGNvbnN0IHsgd2lkdGgsIGhlaWdodCB9ID0gYnVmZmVyXHJcblxyXG4gICAgY29uc3QgcHJvZ3Jlc3NCYXJXaWR0aCA9IE1hdGguZmxvb3Iod2lkdGggKiAwLjgpXHJcbiAgICBjb25zdCBwcm9ncmVzc0JhclggPSBNYXRoLmZsb29yKHdpZHRoICogMC4xKVxyXG4gICAgY29uc3QgcHJvZ3Jlc3NCYXJZID0gTWF0aC5mbG9vcihoZWlnaHQgKiAwLjUpXHJcbiAgICBjb25zdCBwcm9ncmVzc0JhckhlaWdodCA9IDJcclxuXHJcbiAgICBjb25zdCBwcm9ncmVzcyA9ICh0b3RhbDogbnVtYmVyKSA9PiB7XHJcbiAgICAgIGNvbnN0IHN0ZXAgPSBwcm9ncmVzc0JhcldpZHRoIC8gdG90YWxcclxuXHJcbiAgICAgIHJldHVybiBhc3luYyAoaTogbnVtYmVyKSA9PiB7XHJcbiAgICAgICAgZmlsbChcclxuICAgICAgICAgIGJ1ZmZlcixcclxuICAgICAgICAgIGNyZWF0ZUNvbG9yKDB4NjYsIDB4NjYsIDB4NjYpLFxyXG4gICAgICAgICAgW3Byb2dyZXNzQmFyWCwgcHJvZ3Jlc3NCYXJZLCBwcm9ncmVzc0JhcldpZHRoLCBwcm9ncmVzc0JhckhlaWdodF1cclxuICAgICAgICApXHJcblxyXG4gICAgICAgIGNvbnN0IHdpZHRoID0gTWF0aC5yb3VuZChzdGVwICogaSlcclxuXHJcbiAgICAgICAgZmlsbChcclxuICAgICAgICAgIGJ1ZmZlcixcclxuICAgICAgICAgIGNyZWF0ZUNvbG9yKDB4MzMsIDB4OTksIDB4ZmYpLFxyXG4gICAgICAgICAgW3Byb2dyZXNzQmFyWCwgcHJvZ3Jlc3NCYXJZLCB3aWR0aCwgcHJvZ3Jlc3NCYXJIZWlnaHRdXHJcbiAgICAgICAgKVxyXG5cclxuICAgICAgICBhd2FpdCB3YWl0KClcclxuICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIC8vIHJlc2VydmUgb25lIGNvbG9yIGZvciBlZyB0cmFuc3BhcmVudFxyXG4gICAgcGFsZXR0ZSA9IGdlbmVyYXRlUGFsZXR0ZSgyNTUsIDEyLCA0LCA1KVxyXG5cclxuICAgIC8vIGp1c3QgbG9nIHRoZSBtZXRhZGF0YVxyXG4gICAgY29uc3Qgbm9FbnRyaWVzID0ge1xyXG4gICAgICAuLi5wYWxldHRlLFxyXG4gICAgICBkYXRhOiB1bmRlZmluZWRcclxuICAgIH1cclxuXHJcbiAgICBjb25zb2xlLmxvZyhub0VudHJpZXMpXHJcblxyXG4gICAgdGVzdEltYWdlID0gYXdhaXQgbG9hZEltYWdlKCdzY2VuZXMvcGFsL2NvbG9ycy5wbmcnKVxyXG5cclxuICAgIGNvbnN0IHBhbENvbG9yczogVDJbXSA9IFtdXHJcblxyXG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBwYWxldHRlLmVudHJ5Q291bnQ7IGkrKykge1xyXG4gICAgICBjb25zdCByID0gcGFsZXR0ZS5kYXRhW2kgKiAzXVxyXG4gICAgICBjb25zdCBnID0gcGFsZXR0ZS5kYXRhW2kgKiAzICsgMV1cclxuICAgICAgY29uc3QgYiA9IHBhbGV0dGUuZGF0YVtpICogMyArIDJdXHJcblxyXG4gICAgICBjb25zdCBjb2xvcjI0ID0gY3JlYXRlQ29sb3IyNChyLCBnLCBiKVxyXG5cclxuICAgICAgcGFsQ29sb3JzLnB1c2goW2NvbG9yMjQsIGldKVxyXG4gICAgfVxyXG5cclxuICAgIHBhbENvbG9ycy5zb3J0KChhLCBiKSA9PiBhWzBdIC0gYlswXSlcclxuXHJcbiAgICBjb25zb2xlLmxvZygncGFsQ29sb3JzJywgcGFsQ29sb3JzKVxyXG5cclxuICAgIGNvbnN0IHBhbE1hcE5ld1RvT2xkID0gQXJyYXk8bnVtYmVyPihwYWxldHRlLmVudHJ5Q291bnQpXHJcbiAgICBjb25zdCBwYWxNYXBPbGRUb05ldyA9IEFycmF5PG51bWJlcj4ocGFsZXR0ZS5lbnRyeUNvdW50KVxyXG5cclxuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgcGFsQ29sb3JzLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgIGNvbnN0IG9sZEluZGV4ID0gcGFsQ29sb3JzW2ldWzFdXHJcblxyXG4gICAgICBwYWxNYXBOZXdUb09sZFtpXSA9IG9sZEluZGV4XHJcbiAgICAgIHBhbE1hcE9sZFRvTmV3W29sZEluZGV4XSA9IGlcclxuICAgIH1cclxuXHJcbiAgICBwYWwyID0gbmV3IFVpbnQzMkFycmF5KHBhbGV0dGUuZW50cnlDb3VudClcclxuXHJcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHBhbGV0dGUuZW50cnlDb3VudDsgaSsrKSB7XHJcbiAgICAgIHBhbDJbaV0gPSBwYWxDb2xvcnNbaV1bMF1cclxuICAgIH1cclxuXHJcbiAgICBjb25zb2xlLmxvZygncGFsMicsIHBhbDIpXHJcblxyXG4gICAgbmFpdmUyTHV0MzIgPSBuZXcgVWludDMyQXJyYXkocGFsZXR0ZS5lbnRyeUNvdW50KVxyXG5cclxuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgcGFsZXR0ZS5lbnRyeUNvdW50OyBpKyspIHtcclxuICAgICAgY29uc3QgciA9IHBhbGV0dGUuZGF0YVtpICogM11cclxuICAgICAgY29uc3QgZyA9IHBhbGV0dGUuZGF0YVtpICogMyArIDFdXHJcbiAgICAgIGNvbnN0IGIgPSBwYWxldHRlLmRhdGFbaSAqIDMgKyAyXVxyXG5cclxuICAgICAgY29uc3QgY29sb3IgPSBjcmVhdGVDb2xvcihyLCBnLCBiKVxyXG5cclxuICAgICAgbmFpdmUyTHV0MzJbaV0gPSBjb2xvclxyXG4gICAgfVxyXG5cclxuICAgIC8vIFxyXG5cclxuICAgIGNvbnN0IG51bUNvbG9yczI0ID0gMHhmZmZmZmZcclxuXHJcbiAgICBjb25zdCByVmFsdWVzID0gbmV3IFNldDxudW1iZXI+KClcclxuICAgIGNvbnN0IGdWYWx1ZXMgPSBuZXcgU2V0PG51bWJlcj4oKVxyXG4gICAgY29uc3QgYlZhbHVlcyA9IG5ldyBTZXQ8bnVtYmVyPigpXHJcbiAgICBjb25zdCBjVmFsdWVzID0gbmV3IFNldDxudW1iZXI+KClcclxuXHJcbiAgICBjb25zdCBzdGVwQ291bnQgPSAxMFxyXG5cclxuICAgIGNvbnN0IHAgPSBwcm9ncmVzcyhzdGVwQ291bnQpXHJcblxyXG4gICAgY29uc29sZS5sb2coJ2dlbmVyYXRlZCBwYWxldHRlIGxvb2t1cHMnKVxyXG5cclxuICAgIGF3YWl0IHAoMClcclxuXHJcbiAgICBjb25zdCBwc3RlcCA9IG51bUNvbG9yczI0IC8gc3RlcENvdW50XHJcbiAgICBsZXQgY3N0ZXAgPSBwc3RlcFxyXG4gICAgbGV0IHB2YWwgPSAwXHJcblxyXG4gICAgY29uc3Qgbmx1dFN0YXJ0ID0gcGVyZm9ybWFuY2Uubm93KClcclxuICAgIG5haXZlTHV0ID0gbmV3IFVpbnQ4QXJyYXkobnVtQ29sb3JzMjQpXHJcbiAgICBuYWl2ZUx1dDMyID0gbmV3IFVpbnQzMkFycmF5KG51bUNvbG9yczI0KVxyXG5cclxuICAgIG5haXZlTHV0MiA9IG5ldyBVaW50OEFycmF5KG51bUNvbG9yczI0KVxyXG5cclxuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgMHhmZmZmZmY7IGkrKykge1xyXG4gICAgICBjb25zdCBbciwgZywgYl0gPSBjb2xvclRvUmdiKGkpXHJcbiAgICAgIGNvbnN0IGluZGV4ID0gaW5kZXhPZkNsb3Nlc3RSZ2IocGFsZXR0ZSwgW3IsIGcsIGJdKVxyXG4gICAgICBuYWl2ZUx1dFtpXSA9IGluZGV4XHJcbiAgICAgIG5haXZlTHV0MltpXSA9IHBhbE1hcE9sZFRvTmV3W2luZGV4XVxyXG5cclxuICAgICAgY29uc3QgcGFsUiA9IHBhbGV0dGUuZGF0YVtpbmRleCAqIDNdXHJcbiAgICAgIGNvbnN0IHBhbEcgPSBwYWxldHRlLmRhdGFbaW5kZXggKiAzICsgMV1cclxuICAgICAgY29uc3QgcGFsQiA9IHBhbGV0dGUuZGF0YVtpbmRleCAqIDMgKyAyXVxyXG5cclxuICAgICAgclZhbHVlcy5hZGQocGFsUilcclxuICAgICAgZ1ZhbHVlcy5hZGQocGFsRylcclxuICAgICAgYlZhbHVlcy5hZGQocGFsQilcclxuXHJcbiAgICAgIGNWYWx1ZXMuYWRkKHBhbFIpXHJcbiAgICAgIGNWYWx1ZXMuYWRkKHBhbEcpXHJcbiAgICAgIGNWYWx1ZXMuYWRkKHBhbEIpXHJcblxyXG4gICAgICBjb25zdCBjb2xvciA9IGNyZWF0ZUNvbG9yKHBhbFIsIHBhbEcsIHBhbEIpXHJcblxyXG4gICAgICBuYWl2ZUx1dDMyW2ldID0gY29sb3JcclxuXHJcbiAgICAgIGlmIChpID49IGNzdGVwKSB7XHJcbiAgICAgICAgY3N0ZXAgKz0gcHN0ZXBcclxuICAgICAgICBwdmFsKytcclxuICAgICAgICBhd2FpdCBwKHB2YWwpXHJcbiAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBjb25zdCBubHV0RW5kID0gcGVyZm9ybWFuY2Uubm93KClcclxuXHJcbiAgICBjb25zb2xlLmxvZygnTmFpdmUgTFVUcyBUaW1lOicsIG5sdXRFbmQgLSBubHV0U3RhcnQpXHJcblxyXG4gICAgY29uc29sZS5sb2coJ05haXZlIExVVCcsIG5haXZlTHV0KVxyXG4gICAgY29uc29sZS5sb2coJ05haXZlIExVVCAyJywgbmFpdmVMdXQyKVxyXG5cclxuICAgIC8vXHJcblxyXG4gICAgY29uc3QgckFyciA9IEFycmF5LmZyb20oclZhbHVlcylcclxuICAgIGNvbnN0IGdBcnIgPSBBcnJheS5mcm9tKGdWYWx1ZXMpXHJcbiAgICBjb25zdCBiQXJyID0gQXJyYXkuZnJvbShiVmFsdWVzKVxyXG4gICAgY29uc3QgY0FyciA9IEFycmF5LmZyb20oY1ZhbHVlcylcclxuXHJcbiAgICByQXJyLnNvcnQoKGEsIGIpID0+IGEgLSBiKVxyXG4gICAgZ0Fyci5zb3J0KChhLCBiKSA9PiBhIC0gYilcclxuICAgIGJBcnIuc29ydCgoYSwgYikgPT4gYSAtIGIpXHJcbiAgICBjQXJyLnNvcnQoKGEsIGIpID0+IGEgLSBiKVxyXG5cclxuICAgIGNvbnNvbGUubG9nKCdyQXJyJywgckFycilcclxuICAgIGNvbnNvbGUubG9nKCdnQXJyJywgZ0FycilcclxuICAgIGNvbnNvbGUubG9nKCdiQXJyJywgYkFycilcclxuICAgIGNvbnNvbGUubG9nKCdjQXJyJywgY0FycilcclxuXHJcbiAgICAvL1xyXG5cclxuICAgIC8vIG5haXZlTHV0IGlzIGEgbWFwcGluZyB3aGVyZSB0aGUgaW5kZXggaXMgdGhlIDI0IGJpdCByZ2IgdmFsdWUgYW5kIHRoZVxyXG4gICAgLy8gdmFsdWUgaXMgdGhlIGluZGV4IG9mIHRoZSBjbG9zZXN0IGNvbG9yIGluIHRoZSBwYWxldHRlXHJcbiAgICAvL1xyXG4gICAgLy8gY29uc2VjdXRpdmUgMjQgYml0IGluZGljZXMgYWxsIHBvaW50IHRvIHRoZSBzYW1lIHBhbGV0dGUgaW5kZXggaW4gcnVuc1xyXG4gICAgLy8gd2UgY291bGQgY29tcHJlc3MgdGhlIHN0cnVjdHVyZSBsaWtlIHNvOlxyXG4gICAgLy8gXHJcbiAgICAvLyB3ZSB1c2UgYSBVaW50MzJBcnJheSB0byBzdG9yZSB0d28gZmllbGRzOlxyXG4gICAgLy8gMS4gdGhlIDI0IGJpdCB2YWx1ZSB0aGF0IGlzIHRoZSAqZW5kKiBvZiB0aGUgcm93IG9mIGNvbnNlY3V0aXZlIGluZGljZXNcclxuICAgIC8vIDIuIHRoZSA4IGJpdCBwYWxldHRlIGluZGV4XHJcbiAgICAvL1xyXG4gICAgLy8gdGhlbiwgdG8gbWFwIHJnYiB0byBpbmRleCwgeW91IHNlYXJjaCB0aHJvdWdoIGVhY2ggZmllbGQgdG8gZmluZCB0aGUgXHJcbiAgICAvLyBmaXJzdCBlbmQgb2Ygcm93IHdoaWNoIGlzIGdyZWF0ZXIgdGhhbiBvciBlcXVhbCB0byB0aGUgcmdiIHZhbHVlXHJcbiAgICAvLyBhbmQgcmV0dXJuIHRoZSBwYWxldHRlIGluZGV4XHJcbiAgICAvLyBpdCB3aWxsIGJlIGEgYml0IHNsb3dlciB0aGFuIGVnIG5haXZlTHV0MzIgd2hpY2ggaXMgdGhlIGZhc3Rlc3QsIGJ1dCBcclxuICAgIC8vIHRoYXQgc3RydWN0dXJlIGlzIH42NG1iXHJcblxyXG4gICAgbGV0IHByZXYgPSAtMVxyXG4gICAgbGV0IHJvd0NvdW50ID0gMFxyXG5cclxuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgbnVtQ29sb3JzMjQ7IGkrKykge1xyXG4gICAgICBjb25zdCB2YWx1ZSA9IG5haXZlTHV0W2ldXHJcblxyXG4gICAgICBpZiAodmFsdWUgIT09IHByZXYpIHtcclxuICAgICAgICByb3dDb3VudCsrXHJcbiAgICAgIH1cclxuXHJcbiAgICAgIHByZXYgPSB2YWx1ZVxyXG4gICAgfVxyXG5cclxuICAgIC8vIGl0IHdpbGwgaGF2ZSByb3dDb3VudCByb3dzXHJcblxyXG4gICAgY29uc29sZS5sb2coJ3Jvd2NvdW50OicsIHJvd0NvdW50LCAnYnl0ZXM6Jywgcm93Q291bnQgKiA0KVxyXG5cclxuICAgIC8vXHJcblxyXG4gICAgY3JlYXRlTmV3THV0VGhpbmcocGFsZXR0ZSlcclxuICB9XHJcblxyXG4gIGxldCBpc0Rpc2FibGVVcGRhdGUgPSBmYWxzZVxyXG5cclxuICBjb25zdCB1cGRhdGUgPSAoc3RhdGU6IFN0YXRlKSA9PiB7XHJcbiAgICBpZiAoIW1heWJlKHBhbGV0dGUpKSB0aHJvdyBFcnJvcignUGFsZXR0ZSBub3QgZ2VuZXJhdGVkJylcclxuICAgIGlmICghbWF5YmUodGVzdEltYWdlKSkgdGhyb3cgRXJyb3IoJ1Rlc3QgaW1hZ2Ugbm90IGxvYWRlZCcpXHJcbiAgICBpZiAoIW1heWJlKG5haXZlTHV0KSkgdGhyb3cgRXJyb3IoJ05haXZlIExVVCBub3QgZ2VuZXJhdGVkJylcclxuICAgIGlmICghbWF5YmUobmFpdmVMdXQzMikpIHRocm93IEVycm9yKCdOYWl2ZSBMVVQzMiBub3QgZ2VuZXJhdGVkJylcclxuICAgIGlmICghbWF5YmUobmFpdmVMdXQyKSkgdGhyb3cgRXJyb3IoJ05haXZlIExVVDIgbm90IGdlbmVyYXRlZCcpXHJcbiAgICBpZiAoIW1heWJlKHBhbDIpKSB0aHJvdyBFcnJvcignUGFsMiBub3QgZ2VuZXJhdGVkJylcclxuICAgIGlmICghbWF5YmUobmFpdmUyTHV0MzIpKSB0aHJvdyBFcnJvcignTmFpdmUyIExVVDMyIG5vdCBnZW5lcmF0ZWQnKVxyXG5cclxuICAgIC8vIHRlbXAgXHJcbiAgICBpZiAoaXNEaXNhYmxlVXBkYXRlKSByZXR1cm5cclxuXHJcbiAgICAvLyBoYW5kbGUgaW9cclxuXHJcbiAgICBjb25zdCB3aGVlbCA9IHN0YXRlLm1vdXNlLnRha2VXaGVlbCgpXHJcbiAgICBjb25zdCB6b29tID0gc3RhdGUudmlldy5nZXRab29tKClcclxuXHJcbiAgICBpZiAod2hlZWwgPCAwKSB7XHJcbiAgICAgIHN0YXRlLnZpZXcuc2V0Wm9vbSggem9vbSArIDEgKVxyXG4gICAgfSBlbHNlIGlmICh3aGVlbCA+IDApIHtcclxuICAgICAgc3RhdGUudmlldy5zZXRab29tKCB6b29tIC0gMSApXHJcbiAgICB9XHJcblxyXG4gICAgY29uc3Qga2V5cyA9IHN0YXRlLmdldEtleXMoKVxyXG5cclxuICAgIGlmIChrZXlzWydFc2NhcGUnXSkge1xyXG4gICAgICBzdGF0ZS5zZXRSdW5uaW5nKGZhbHNlKVxyXG5cclxuICAgICAgLy8gY29uc3VtZSB0aGUga2V5XHJcbiAgICAgIGtleXNbJ0VzY2FwZSddID0gZmFsc2VcclxuXHJcbiAgICAgIHJldHVyblxyXG4gICAgfVxyXG5cclxuICAgIC8vXHJcblxyXG4gICAgY29uc3QgYnVmZmVyID0gc3RhdGUudmlldy5nZXRCdWZmZXIoKVxyXG5cclxuICAgIGZpbGwoYnVmZmVyLCBjcmVhdGVDb2xvcigweDAwLCAweDAwLCAweDAwKSlcclxuXHJcbiAgICBsb2dPbmNlKCdidWZmZXJQaXhlbHMnLCAnQnVmZmVyIHBpeGVsczonLCBidWZmZXIud2lkdGggKiBidWZmZXIuaGVpZ2h0KVxyXG5cclxuICAgIC8vIGNvdWxkIG9wdGltaXplIGJ5IGRvaW5nIHRoaXMgaW4gaW5pdCwgYnV0IHRoZSBzY2VuZSBlYXNpbHkgaGl0cyA2MGZwc1xyXG4gICAgLy8gYW5kIGl0J3MganVzdCBhIHNhbmRib3hcclxuXHJcbiAgICAvLyBwYWxldHRlIHN0dWZmXHJcblxyXG4gICAgY29uc3QgbnVtUGFscyA9IDJcclxuXHJcbiAgICAvL1xyXG5cclxuICAgIGNvbnN0IHBhbFdpZHRoID0gcGFsZXR0ZS5saWdodFJhbmdlXHJcbiAgICBjb25zdCBwYWxIZWlnaHQgPSBNYXRoLmNlaWwocGFsZXR0ZS5lbnRyeUNvdW50IC8gcGFsV2lkdGgpXHJcblxyXG4gICAgLy9cclxuXHJcbiAgICBjb25zdCBwYWxJbWFnZSA9IGNyZWF0ZVBhbEltYWdlKHBhbGV0dGUsIHBhbFdpZHRoLCBwYWxIZWlnaHQpXHJcblxyXG4gICAgY29uc3QgbmV3SGVpZ2h0ID0gYnVmZmVyLmhlaWdodFxyXG4gICAgY29uc3Qgc2NhbGUgPSBuZXdIZWlnaHQgLyBwYWxIZWlnaHRcclxuICAgIGNvbnN0IG5ld1dpZHRoID0gTWF0aC5mbG9vcihwYWxXaWR0aCAqIHNjYWxlKVxyXG5cclxuICAgIHBvaW50UmVzaXplKFxyXG4gICAgICBwYWxJbWFnZSwgYnVmZmVyLFxyXG4gICAgICBbMCwgMCwgcGFsV2lkdGgsIHBhbEhlaWdodF0sIFswLCAwLCBuZXdXaWR0aCwgbmV3SGVpZ2h0XVxyXG4gICAgKVxyXG5cclxuICAgIC8vXHJcblxyXG4gICAgY29uc3QgcGFsMkltYWdlID0gY3JlYXRlUGFsMkltYWdlKHBhbDIsIHBhbFdpZHRoLCBwYWxIZWlnaHQpXHJcblxyXG4gICAgcG9pbnRSZXNpemUoXHJcbiAgICAgIHBhbDJJbWFnZSwgYnVmZmVyLFxyXG4gICAgICBbMCwgMCwgcGFsV2lkdGgsIHBhbEhlaWdodF0sIFtuZXdXaWR0aCwgMCwgbmV3V2lkdGgsIG5ld0hlaWdodF1cclxuICAgIClcclxuXHJcbiAgICAvL1xyXG5cclxuICAgIGNvbnN0IHBhbHNXaWR0aCA9IG5ld1dpZHRoICogbnVtUGFsc1xyXG5cclxuICAgIC8vXHJcblxyXG4gICAgY29uc3QgcmVtYWluaW5nV2lkdGggPSBidWZmZXIud2lkdGggLSBwYWxzV2lkdGhcclxuXHJcbiAgICAvL1xyXG4gICAgY29uc3QgaW1hZ2VDb3VudCA9IDVcclxuXHJcbiAgICAvLyBtYWtlIHNwYWNlIGZvciBpbWFnZXMgc2lkZSBieSBzaWRlXHJcbiAgICBjb25zdCBpbWFnZVdpZHRocyA9IE1hdGguZmxvb3IocmVtYWluaW5nV2lkdGggLyBpbWFnZUNvdW50KVxyXG5cclxuICAgIC8vIG5leHQgd2UnbGwgdHJ5IGNvbnZlcnRpbmcgYW4gaW1hZ2UgdG8gcGFsZXR0ZSBhbmQgc2hvdyB0aGUgb3JpZ2luYWxcclxuICAgIC8vIGFuZCBjb252ZXJ0ZWQgc2lkZSBieSBzaWRlLCB0aGVuIHdlIGNhbiBzdGFydCBleHBlcmltZW50aW5nIHdpdGhcclxuICAgIC8vIGNyZWF0aW5nIGEgTFVUXHJcblxyXG4gICAgY29uc3QgbmV3T3JpZ1dpZHRoID0gaW1hZ2VXaWR0aHNcclxuICAgIGNvbnN0IHNjYWxlT3JpZyA9IG5ld09yaWdXaWR0aCAvIHRlc3RJbWFnZS53aWR0aFxyXG4gICAgY29uc3QgbmV3T3JpZ0hlaWdodCA9IE1hdGguZmxvb3IodGVzdEltYWdlLmhlaWdodCAqIHNjYWxlT3JpZylcclxuXHJcbiAgICBwb2ludFJlc2l6ZShcclxuICAgICAgdGVzdEltYWdlLCBidWZmZXIsXHJcbiAgICAgIFswLCAwLCB0ZXN0SW1hZ2Uud2lkdGgsIHRlc3RJbWFnZS5oZWlnaHRdLFxyXG4gICAgICBbcGFsc1dpZHRoLCAwLCBuZXdPcmlnV2lkdGgsIG5ld09yaWdIZWlnaHRdXHJcbiAgICApXHJcblxyXG4gICAgY29uc3QgY29sb3JzT3JpZyA9IGNvdW50VW5pcXVlQ29sb3JzKHRlc3RJbWFnZSlcclxuXHJcbiAgICBsb2dPbmNlKCdjb2xvcnNPcmlnJywgJ1VuaXF1ZSBjb2xvcnMgaW4gb3JpZ2luYWwgaW1hZ2U6JywgY29sb3JzT3JpZylcclxuXHJcbiAgICAvLyBzbG93IGluZGV4ZWQgY29udmVyc2lvbiwgZGlyZWN0IHNlYXJjaFxyXG5cclxuICAgIGNvbnN0IHN0YXJ0Q29udjBUaW1lID0gcGVyZm9ybWFuY2Uubm93KClcclxuICAgIGNvbnN0IGluZGV4ZWQgPSB0b1BhbGV0dGUodGVzdEltYWdlLCBwYWxldHRlKVxyXG4gICAgY29uc3QgZW5kQ29udjBUaW1lID0gcGVyZm9ybWFuY2Uubm93KClcclxuXHJcbiAgICBjb25zdCBjb2xvcnNJbmRleGVkID0gY291bnRVbmlxdWVDb2xvcnMoaW5kZXhlZClcclxuXHJcbiAgICBsb2dPbmNlKFxyXG4gICAgICAnY29udjAnLFxyXG4gICAgICAnQ29udmVyc2lvbiAwIHRpbWU6JywgZW5kQ29udjBUaW1lIC0gc3RhcnRDb252MFRpbWUsXHJcbiAgICAgICdQaXhlbCBjb3VudDonLCB0ZXN0SW1hZ2Uud2lkdGggKiB0ZXN0SW1hZ2UuaGVpZ2h0LFxyXG4gICAgICAnVW5pcXVlIGNvbG9yczonLCBjb2xvcnNJbmRleGVkXHJcbiAgICApXHJcblxyXG4gICAgcG9pbnRSZXNpemUoXHJcbiAgICAgIGluZGV4ZWQsIGJ1ZmZlcixcclxuICAgICAgWzAsIDAsIGluZGV4ZWQud2lkdGgsIGluZGV4ZWQuaGVpZ2h0XSxcclxuICAgICAgW3BhbHNXaWR0aCArIG5ld09yaWdXaWR0aCwgMCwgbmV3T3JpZ1dpZHRoLCBuZXdPcmlnSGVpZ2h0XVxyXG4gICAgKVxyXG5cclxuICAgIC8vIExVVCBleHBlcmltZW50c1xyXG5cclxuICAgIGNvbnN0IHN0YXJ0Q29udjFUaW1lID0gcGVyZm9ybWFuY2Uubm93KClcclxuICAgIGNvbnN0IGluZGV4ZWRMdXQgPSB0b1BhbGV0dGVMdXQodGVzdEltYWdlLCBwYWxldHRlLCBuYWl2ZUx1dClcclxuICAgIGNvbnN0IGVuZENvbnYxVGltZSA9IHBlcmZvcm1hbmNlLm5vdygpXHJcblxyXG4gICAgY29uc3QgY29sb3JzTHV0ID0gY291bnRVbmlxdWVDb2xvcnMoaW5kZXhlZEx1dClcclxuXHJcbiAgICBsb2dPbmNlKFxyXG4gICAgICAnY29udjEnLFxyXG4gICAgICAnQ29udmVyc2lvbiAxIHRpbWU6JywgZW5kQ29udjFUaW1lIC0gc3RhcnRDb252MVRpbWUsXHJcbiAgICAgICdQaXhlbCBjb3VudDonLCB0ZXN0SW1hZ2Uud2lkdGggKiB0ZXN0SW1hZ2UuaGVpZ2h0LFxyXG4gICAgICAnVW5pcXVlIGNvbG9yczonLCBjb2xvcnNMdXRcclxuICAgIClcclxuXHJcbiAgICBwb2ludFJlc2l6ZShcclxuICAgICAgaW5kZXhlZEx1dCwgYnVmZmVyLFxyXG4gICAgICBbMCwgMCwgaW5kZXhlZEx1dC53aWR0aCwgaW5kZXhlZEx1dC5oZWlnaHRdLFxyXG4gICAgICBbcGFsc1dpZHRoICsgbmV3T3JpZ1dpZHRoICogMiwgMCwgbmV3T3JpZ1dpZHRoLCBuZXdPcmlnSGVpZ2h0XVxyXG4gICAgKVxyXG5cclxuICAgIC8vXHJcblxyXG4gICAgY29uc3Qgc3RhcnRDb252MlRpbWUgPSBwZXJmb3JtYW5jZS5ub3coKVxyXG4gICAgY29uc3QgaW5kZXhlZEx1dDMyID0gdG9QYWxldHRlTHV0MzIodGVzdEltYWdlLCBuYWl2ZUx1dDMyKVxyXG4gICAgY29uc3QgZW5kQ29udjJUaW1lID0gcGVyZm9ybWFuY2Uubm93KClcclxuXHJcbiAgICBjb25zdCBjb2xvcnNMdXQzMiA9IGNvdW50VW5pcXVlQ29sb3JzKGluZGV4ZWRMdXQzMilcclxuXHJcbiAgICBsb2dPbmNlKFxyXG4gICAgICAnY29udjInLFxyXG4gICAgICAnQ29udmVyc2lvbiAyIHRpbWU6JywgZW5kQ29udjJUaW1lIC0gc3RhcnRDb252MlRpbWUsXHJcbiAgICAgICdQaXhlbCBjb3VudDonLCB0ZXN0SW1hZ2Uud2lkdGggKiB0ZXN0SW1hZ2UuaGVpZ2h0LFxyXG4gICAgICAnVW5pcXVlIGNvbG9yczonLCBjb2xvcnNMdXQzMlxyXG4gICAgKVxyXG5cclxuICAgIHBvaW50UmVzaXplKFxyXG4gICAgICBpbmRleGVkTHV0MzIsIGJ1ZmZlcixcclxuICAgICAgWzAsIDAsIGluZGV4ZWRMdXQzMi53aWR0aCwgaW5kZXhlZEx1dDMyLmhlaWdodF0sXHJcbiAgICAgIFtwYWxzV2lkdGggKyBuZXdPcmlnV2lkdGggKiAzLCAwLCBuZXdPcmlnV2lkdGgsIG5ld09yaWdIZWlnaHRdXHJcbiAgICApXHJcbiAgICAvLyBcclxuXHJcbiAgICBjb25zdCBzdGFydEx1dDJUaW1lID0gcGVyZm9ybWFuY2Uubm93KClcclxuICAgIGNvbnN0IHsgY2hDb3VudCwgY2hhbm5lbExvb2t1cCwgdGFibGUgfSA9IGNyZWF0ZU5ld0x1dFRoaW5nKHBhbGV0dGUpXHJcbiAgICBjb25zdCBlbmRMdXQyVGltZSA9IHBlcmZvcm1hbmNlLm5vdygpXHJcblxyXG4gICAgbG9nT25jZShcclxuICAgICAgJ2x1dDInLFxyXG4gICAgICAnTFVUIDIgdGltZTonLCBlbmRMdXQyVGltZSAtIHN0YXJ0THV0MlRpbWUsXHJcbiAgICAgICdUYWJsZSBzaXplOicsIHRhYmxlLmJ5dGVMZW5ndGhcclxuICAgIClcclxuXHJcbiAgICBjb25zdCBzdGFydENvbnYzVGltZSA9IHBlcmZvcm1hbmNlLm5vdygpXHJcbiAgICBjb25zdCBpbmRleGVkTG9va3VwMiA9IHRvUGFsZXR0ZUxvb2t1cDMoXHJcbiAgICAgIHRlc3RJbWFnZSwgbmFpdmUyTHV0MzIsXHJcbiAgICAgIGNoQ291bnQsIGNoYW5uZWxMb29rdXAsIHRhYmxlXHJcbiAgICApXHJcbiAgICBjb25zdCBlbmRDb252M1RpbWUgPSBwZXJmb3JtYW5jZS5ub3coKVxyXG5cclxuICAgIGNvbnN0IGNvbG9yc0xvb2t1cDIgPSBjb3VudFVuaXF1ZUNvbG9ycyhpbmRleGVkTG9va3VwMilcclxuXHJcbiAgICBsb2dPbmNlKFxyXG4gICAgICAnY29udjMnLFxyXG4gICAgICAnQ29udmVyc2lvbiAzIHRpbWU6JywgZW5kQ29udjNUaW1lIC0gc3RhcnRDb252M1RpbWUsXHJcbiAgICAgICdQaXhlbCBjb3VudDonLCB0ZXN0SW1hZ2Uud2lkdGggKiB0ZXN0SW1hZ2UuaGVpZ2h0LFxyXG4gICAgICAnVW5pcXVlIGNvbG9yczonLCBjb2xvcnNMb29rdXAyXHJcbiAgICApXHJcblxyXG4gICAgcG9pbnRSZXNpemUoXHJcbiAgICAgIGluZGV4ZWRMb29rdXAyLCBidWZmZXIsXHJcbiAgICAgIFswLCAwLCBpbmRleGVkTG9va3VwMi53aWR0aCwgaW5kZXhlZExvb2t1cDIuaGVpZ2h0XSxcclxuICAgICAgW3BhbHNXaWR0aCArIG5ld09yaWdXaWR0aCAqIDQsIDAsIG5ld09yaWdXaWR0aCwgbmV3T3JpZ0hlaWdodF1cclxuICAgIClcclxuICB9XHJcblxyXG4gIGNvbnN0IHF1aXQgPSBhc3luYyAoX3N0YXRlOiBTdGF0ZSkgPT4ge1xyXG4gICAgcGFsZXR0ZSA9IG51bGxcclxuICB9XHJcblxyXG4gIHJldHVybiB7IGluaXQsIHVwZGF0ZSwgcXVpdCB9XHJcbn1cclxuXHJcbmNvbnN0IHNlZW4gPSBuZXcgU2V0PHN0cmluZz4oKVxyXG5jb25zdCBsb2dPbmNlID0gKGlkOiBzdHJpbmcsIC4uLmFyZ3M6IGFueVtdKSA9PiB7XHJcbiAgaWYgKHNlZW4uaGFzKGlkKSkgcmV0dXJuXHJcbiAgc2Vlbi5hZGQoaWQpXHJcbiAgY29uc29sZS5sb2coLi4uYXJncylcclxufVxyXG5cclxuY29uc3QgdG9QYWxldHRlID0gKGltYWdlOiBJbWFnZURhdGEsIHBhbGV0dGU6IEdlbmVyYXRlZFBhbGV0dGUpOiBJbWFnZURhdGEgPT4ge1xyXG4gIGNvbnN0IG5ld0ltYWdlID0gY3JlYXRlSW1hZ2UoaW1hZ2Uud2lkdGgsIGltYWdlLmhlaWdodClcclxuXHJcbiAgLy9cclxuXHJcbiAgZm9yIChsZXQgeSA9IDA7IHkgPCBpbWFnZS5oZWlnaHQ7IHkrKykge1xyXG4gICAgY29uc3Qgcm93ID0geSAqIGltYWdlLndpZHRoXHJcbiAgICBmb3IgKGxldCB4ID0gMDsgeCA8IGltYWdlLndpZHRoOyB4KyspIHtcclxuICAgICAgY29uc3QgaW5kZXggPSByb3cgKyB4XHJcbiAgICAgIGNvbnN0IGRhdGFJbmRleCA9IGluZGV4ICogNFxyXG5cclxuICAgICAgY29uc3Qgb3IgPSBpbWFnZS5kYXRhW2RhdGFJbmRleF1cclxuICAgICAgY29uc3Qgb2cgPSBpbWFnZS5kYXRhW2RhdGFJbmRleCArIDFdXHJcbiAgICAgIGNvbnN0IG9iID0gaW1hZ2UuZGF0YVtkYXRhSW5kZXggKyAyXVxyXG5cclxuICAgICAgY29uc3QgcGFsSW5kZXggPSBpbmRleE9mQ2xvc2VzdFJnYihwYWxldHRlLCBbb3IsIG9nLCBvYl0pXHJcblxyXG4gICAgICBjb25zdCBwciA9IHBhbGV0dGUuZGF0YVtwYWxJbmRleCAqIDNdXHJcbiAgICAgIGNvbnN0IHBnID0gcGFsZXR0ZS5kYXRhW3BhbEluZGV4ICogMyArIDFdXHJcbiAgICAgIGNvbnN0IHBiID0gcGFsZXR0ZS5kYXRhW3BhbEluZGV4ICogMyArIDJdXHJcblxyXG4gICAgICBuZXdJbWFnZS5kYXRhW2RhdGFJbmRleF0gPSBwclxyXG4gICAgICBuZXdJbWFnZS5kYXRhW2RhdGFJbmRleCArIDFdID0gcGdcclxuICAgICAgbmV3SW1hZ2UuZGF0YVtkYXRhSW5kZXggKyAyXSA9IHBiXHJcbiAgICAgIG5ld0ltYWdlLmRhdGFbZGF0YUluZGV4ICsgM10gPSAyNTVcclxuICAgIH1cclxuICB9XHJcblxyXG4gIC8vXHJcblxyXG4gIHJldHVybiBuZXdJbWFnZVxyXG59XHJcblxyXG5jb25zdCB0b1BhbGV0dGVMdXQgPSAoXHJcbiAgaW1hZ2U6IEltYWdlRGF0YSwgcGFsZXR0ZTogR2VuZXJhdGVkUGFsZXR0ZSwgbHV0OiBVaW50OEFycmF5XHJcbik6IEltYWdlRGF0YSA9PiB7XHJcbiAgY29uc3QgbmV3SW1hZ2UgPSBjcmVhdGVJbWFnZShpbWFnZS53aWR0aCwgaW1hZ2UuaGVpZ2h0KVxyXG5cclxuICAvL1xyXG5cclxuICBmb3IgKGxldCB5ID0gMDsgeSA8IGltYWdlLmhlaWdodDsgeSsrKSB7XHJcbiAgICBjb25zdCByb3cgPSB5ICogaW1hZ2Uud2lkdGhcclxuICAgIGZvciAobGV0IHggPSAwOyB4IDwgaW1hZ2Uud2lkdGg7IHgrKykge1xyXG4gICAgICBjb25zdCBpbmRleCA9IHJvdyArIHhcclxuICAgICAgY29uc3QgZGF0YUluZGV4ID0gaW5kZXggKiA0XHJcblxyXG4gICAgICBjb25zdCBvciA9IGltYWdlLmRhdGFbZGF0YUluZGV4XVxyXG4gICAgICBjb25zdCBvZyA9IGltYWdlLmRhdGFbZGF0YUluZGV4ICsgMV1cclxuICAgICAgY29uc3Qgb2IgPSBpbWFnZS5kYXRhW2RhdGFJbmRleCArIDJdXHJcblxyXG4gICAgICBjb25zdCBsdXRJbmRleCA9IGNyZWF0ZUNvbG9yMjQob3IsIG9nLCBvYilcclxuICAgICAgY29uc3QgcGFsSW5kZXggPSBsdXRbbHV0SW5kZXhdXHJcblxyXG4gICAgICBjb25zdCBwciA9IHBhbGV0dGUuZGF0YVtwYWxJbmRleCAqIDNdXHJcbiAgICAgIGNvbnN0IHBnID0gcGFsZXR0ZS5kYXRhW3BhbEluZGV4ICogMyArIDFdXHJcbiAgICAgIGNvbnN0IHBiID0gcGFsZXR0ZS5kYXRhW3BhbEluZGV4ICogMyArIDJdXHJcblxyXG4gICAgICBuZXdJbWFnZS5kYXRhW2RhdGFJbmRleF0gPSBwclxyXG4gICAgICBuZXdJbWFnZS5kYXRhW2RhdGFJbmRleCArIDFdID0gcGdcclxuICAgICAgbmV3SW1hZ2UuZGF0YVtkYXRhSW5kZXggKyAyXSA9IHBiXHJcbiAgICAgIG5ld0ltYWdlLmRhdGFbZGF0YUluZGV4ICsgM10gPSAyNTVcclxuICAgIH1cclxuICB9XHJcblxyXG4gIC8vXHJcblxyXG4gIHJldHVybiBuZXdJbWFnZVxyXG59XHJcblxyXG5jb25zdCB0b1BhbGV0dGVMdXQzMiA9IChcclxuICBzcmM6IEltYWdlRGF0YSwgbHV0OiBVaW50MzJBcnJheVxyXG4pOiBJbWFnZURhdGEgPT4ge1xyXG4gIGNvbnN0IG5ld0ltYWdlID0gY3JlYXRlSW1hZ2Uoc3JjLndpZHRoLCBzcmMuaGVpZ2h0KVxyXG5cclxuICBjb25zdCBzaXplID0gc3JjLndpZHRoICogc3JjLmhlaWdodFxyXG5cclxuICBjb25zdCBzcmNWaWV3ID0gbmV3IFVpbnQzMkFycmF5KHNyYy5kYXRhLmJ1ZmZlcilcclxuICBjb25zdCBkZXN0VmlldyA9IG5ldyBVaW50MzJBcnJheShuZXdJbWFnZS5kYXRhLmJ1ZmZlcilcclxuXHJcbiAgLy9cclxuXHJcbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBzaXplOyBpKyspIHtcclxuICAgIGNvbnN0IHJnYmEgPSBzcmNWaWV3W2ldXHJcbiAgICBjb25zdCByZ2IgPSByZ2JhICYgMHgwMGZmZmZmZlxyXG5cclxuICAgIGRlc3RWaWV3W2ldID0gbHV0W3JnYl1cclxuICB9XHJcblxyXG4gIC8vXHJcblxyXG4gIHJldHVybiBuZXdJbWFnZVxyXG59XHJcblxyXG4vLyB0aGlzIGlzIHRoZSB3aW5uZXIgZm9yIHNldmVyYWwgcmVhc29uczpcclxuLy8gYSkgaXQncyBieSBmYXIgdGhlIGZhc3Rlc3QgZHVlIHRvIHNtYWxsIHRhYmxlIHNpemUgaGVscGluZyB3aXRoIGNhY2hlIFxyXG4vLyAgICBsb2NhbGl0eSwgZXZlbiB0aG91Z2ggdGhlIGFyaXRobWV0aWMgaXMgbW9yZSBjb21wbGV4IHRoYW4gZWcgdG9QYWxldHRlTHV0MzJcclxuLy8gYikgaXQgdXNlcyB0aGUgbGVhc3QgbWVtb3J5LCB+NjBrYiBjb21wYXJlZCB0byBlZyAxNk1CIG9yIDY0TUIgZm9yIHRoZSBvdGhlclxyXG4vLyAgICBsdXRzXHJcbi8vIGMpIGl0IHByb2R1Y2VzIHNsaWdodGx5IGJldHRlciByZXN1bHRzLCBlZyBsZXNzIGluZm9ybWF0aW9uIGlzIGxvc3QgaW4gdGhlIFxyXG4vLyAgICByZXN1bHRhbnQgb3V0cHV0IGltYWdlXHJcbmNvbnN0IHRvUGFsZXR0ZUxvb2t1cDMgPSAoXHJcbiAgc3JjOiBJbWFnZURhdGEsIGNvbG9yczogVWludDMyQXJyYXksXHJcbiAgY2hDb3VudDogbnVtYmVyLCBjaGFubmVsTG9va3VwOiBVaW50OEFycmF5LCB0YWJsZTogVWludDhBcnJheVxyXG4pOiBJbWFnZURhdGEgPT4ge1xyXG4gIGNvbnN0IGRlc3QgPSBjcmVhdGVJbWFnZShzcmMud2lkdGgsIHNyYy5oZWlnaHQpXHJcblxyXG4gIGNvbnN0IGRlc3RWaWV3ID0gbmV3IFVpbnQzMkFycmF5KGRlc3QuZGF0YS5idWZmZXIpXHJcblxyXG4gIC8vXHJcblxyXG4gIGNvbnN0IHJPZmZzZXRTaXplID0gY2hDb3VudCAqIGNoQ291bnRcclxuXHJcbiAgZm9yIChsZXQgeSA9IDA7IHkgPCBzcmMuaGVpZ2h0OyB5KyspIHtcclxuICAgIGNvbnN0IHJvdyA9IHkgKiBzcmMud2lkdGhcclxuXHJcbiAgICBmb3IgKGxldCB4ID0gMDsgeCA8IHNyYy53aWR0aDsgeCsrKSB7XHJcbiAgICAgIGNvbnN0IGluZGV4ID0gcm93ICsgeFxyXG4gICAgICBjb25zdCBkYXRhSW5kZXggPSBpbmRleCAqIDRcclxuXHJcbiAgICAgIGNvbnN0IG9yID0gc3JjLmRhdGFbZGF0YUluZGV4XVxyXG4gICAgICBjb25zdCBvZyA9IHNyYy5kYXRhW2RhdGFJbmRleCArIDFdXHJcbiAgICAgIGNvbnN0IG9iID0gc3JjLmRhdGFbZGF0YUluZGV4ICsgMl1cclxuXHJcbiAgICAgIGNvbnN0IHJpID0gY2hhbm5lbExvb2t1cFtvcl1cclxuICAgICAgY29uc3QgZ2kgPSBjaGFubmVsTG9va3VwW29nXVxyXG4gICAgICBjb25zdCBiaSA9IGNoYW5uZWxMb29rdXBbb2JdXHJcblxyXG4gICAgICBjb25zdCByaU9mZnNldCA9IHJpICogck9mZnNldFNpemVcclxuICAgICAgY29uc3QgZ2lPZmZzZXQgPSBnaSAqIGNoQ291bnRcclxuICAgICAgY29uc3QgbG9va3VwID0gYmkgKyBnaU9mZnNldCArIHJpT2Zmc2V0XHJcblxyXG4gICAgICBjb25zdCBjbG9zZXN0ID0gdGFibGVbbG9va3VwXVxyXG5cclxuICAgICAgZGVzdFZpZXdbaW5kZXhdID0gY29sb3JzW2Nsb3Nlc3RdIHwgMHhmZjAwMDAwMFxyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgLy9cclxuXHJcbiAgcmV0dXJuIGRlc3RcclxufVxyXG5cclxuLypcclxuICBvayBuZXcgc3RyYXRlZ3lcclxuXHJcbiAgMS4gZ2VuZXJhdGUgYSBwYWxldHRlXHJcbiAgMi4gZm9yIGV2ZXJ5IGNvbG9yLCBnZXQgdGhlIHRocmVlIGNoYW5uZWxzIGFuZCBhZGQgdGhlaXIgdmFsdWVzIHRvIGEgc2V0XHJcbiAgMy4gYXQgdGhlIGVuZCwgeW91IGhhdmUgYSBzZXQgb2YgdmFsdWVzIGZvciBldmVyeSBwb3NzaWJsZSBjaGFubmVsIHZhbHVlXHJcbiAgICAgZWcgZm9yIG91ciAxMi80LzUgaHVlIGdlbmVyYXRlZCBwYWxldHRlIG9mIDI1NSBjb2xvcnMsIHRoZXJlIGFyZSAzOCB1bmlxdWVcclxuICAgICB2YWx1ZXMgZm9yIGV2ZXJ5IGNoYW5uZWxcclxuICA0LiBjcmVhdGUgYSBsb29rdXAgdGFibGUgd2l0aCAwLi4yNTUgaW5kaWNlcywgYW5kIHRoZSBuZWFyZXN0IG1hdGNoIGZyb20gb3VyXHJcbiAgICAgc2V0XHJcbiAgNS4gZXhwZXJpbWVudCAtIG9uZSB3ZSByZWNvbnN0cnVjdCBhIGNvbG9yIGZyb20gYW4gdW5pbmRleGVkIGltYWdlLCBpcyBldmVyeVxyXG4gICAgIHZhbHVlIHByZXNlbnQgaW4gb3VyIHBhbGV0dGU/XHJcblxyXG4gIEluIG91ciBleGFtcGxlIHdpdGggMzggdW5pcXVlIHZhbHVlcywgdGhlcmUgYXJlIDM4KiozICg1NCw4NzIpIHBvc3NpYmxlIFxyXG4gIGNvbG9ycywgYSBsb3QgbGVzcyB0aGFuIG91ciAxNiBtaWxsaW9uIGNvbG9yc3BhY2UgICBcclxuXHJcbiAgRmlyc3QsIGNvbnZlcnQgcmF3IHIsIGcsIGIgaW50byByYW5nZSAwLi4zNyBtYXRjaGluZyB0byBpbmRleCBvZiBjbG9zZXN0IHZhbHVlIFxyXG4gIGluIHRoZSBzZXRcclxuXHJcbiAgU28geW91IGNhbiBtYWtlIGEgbG9va3VwIHRhYmxlIHdoaWNoIGlzIGEgVWludDhBcnJheSBvZiAzOCoqMyBlbnRyaWVzXHJcblxyXG4gIFlvdSBjYW4gaW5kZXggaW50byBpdCBieTpcclxuXHJcbiAgciBbMC4uMzddXHJcbiAgZyBbMC4uMzddXHJcbiAgYiBbMC4uMzddXHJcblxyXG4gIGNvbnN0IGluZGV4ID0gKCByICogMzggKiAzOCApICsgKCBnICogMzggKSArIGJcclxuXHJcbiAgd2l0aCBlYWNoIGluZGV4IHBvaW50aW5nIHRvIGEgcGFsZXR0ZSBpbmRleFxyXG4qL1xyXG5cclxuY29uc3QgbmVhcmVzdE1hdGNoID0gKHZhbHVlczogbnVtYmVyW10sIHZhbHVlOiBudW1iZXIpID0+IHtcclxuICBsZXQgY2xvc2VzdCA9IHZhbHVlc1swXVxyXG4gIGxldCBjbG9zZXN0RGlzdCA9IE1hdGguYWJzKHZhbHVlIC0gY2xvc2VzdClcclxuXHJcbiAgZm9yIChsZXQgaSA9IDE7IGkgPCB2YWx1ZXMubGVuZ3RoOyBpKyspIHtcclxuICAgIGNvbnN0IGRpc3QgPSBNYXRoLmFicyh2YWx1ZSAtIHZhbHVlc1tpXSlcclxuXHJcbiAgICBpZiAoZGlzdCA8IGNsb3Nlc3REaXN0KSB7XHJcbiAgICAgIGNsb3Nlc3QgPSB2YWx1ZXNbaV1cclxuICAgICAgY2xvc2VzdERpc3QgPSBkaXN0XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICByZXR1cm4gY2xvc2VzdFxyXG59XHJcblxyXG5jb25zdCBjcmVhdGVOZXdMdXRUaGluZyA9IChwYWxldHRlOiBHZW5lcmF0ZWRQYWxldHRlKSA9PiB7XHJcbiAgY29uc3QgY2hhbm5lbFNldCA9IG5ldyBTZXQ8bnVtYmVyPigpXHJcblxyXG4gIGZvciAobGV0IGkgPSAwOyBpIDwgcGFsZXR0ZS5lbnRyeUNvdW50OyBpKyspIHtcclxuICAgIGNoYW5uZWxTZXQuYWRkKHBhbGV0dGUuZGF0YVtpICogM10pXHJcbiAgICBjaGFubmVsU2V0LmFkZChwYWxldHRlLmRhdGFbaSAqIDMgKyAxXSlcclxuICAgIGNoYW5uZWxTZXQuYWRkKHBhbGV0dGUuZGF0YVtpICogMyArIDJdKVxyXG4gIH1cclxuXHJcbiAgY29uc3QgdmFsdWVzID0gQXJyYXkuZnJvbShjaGFubmVsU2V0KS5zb3J0KChhLCBiKSA9PiBhIC0gYilcclxuXHJcbiAgY29uc3QgY2hDb3VudCA9IHZhbHVlcy5sZW5ndGhcclxuXHJcbiAgY29uc3QgY2hhbm5lbExvb2t1cCA9IG5ldyBVaW50OEFycmF5KDI1NilcclxuXHJcbiAgZm9yIChsZXQgaSA9IDA7IGkgPCAyNTY7IGkrKykge1xyXG4gICAgY29uc3QgY2xvc2VzdCA9IG5lYXJlc3RNYXRjaCh2YWx1ZXMsIGkpXHJcblxyXG4gICAgY2hhbm5lbExvb2t1cFtpXSA9IHZhbHVlcy5pbmRleE9mKGNsb3Nlc3QpXHJcbiAgfVxyXG5cclxuICBjb25zdCB0YWJsZVNpemUgPSBjaENvdW50ICoqIDNcclxuXHJcbiAgY29uc3QgdGFibGUgPSBuZXcgVWludDhBcnJheSh0YWJsZVNpemUpXHJcblxyXG4gIGNvbnN0IHJTaXplID0gY2hDb3VudCAqIGNoQ291bnRcclxuXHJcbiAgZm9yIChsZXQgcmkgPSAwOyByaSA8IGNoQ291bnQ7IHJpKyspIHtcclxuICAgIGNvbnN0IHJpT2Zmc2V0ID0gcmkgKiByU2l6ZVxyXG4gICAgZm9yIChsZXQgZ2kgPSAwOyBnaSA8IGNoQ291bnQ7IGdpKyspIHtcclxuICAgICAgY29uc3QgZ2lPZmZzZXQgPSBnaSAqIGNoQ291bnQgKyByaU9mZnNldFxyXG4gICAgICBmb3IgKGxldCBiaSA9IDA7IGJpIDwgY2hDb3VudDsgYmkrKykge1xyXG4gICAgICAgIGNvbnN0IGluZGV4ID0gYmkgKyBnaU9mZnNldFxyXG5cclxuICAgICAgICBjb25zdCByID0gdmFsdWVzW3JpXVxyXG4gICAgICAgIGNvbnN0IGcgPSB2YWx1ZXNbZ2ldXHJcbiAgICAgICAgY29uc3QgYiA9IHZhbHVlc1tiaV1cclxuXHJcbiAgICAgICAgY29uc3QgY2xvc2VzdCA9IGluZGV4T2ZDbG9zZXN0UmdiKHBhbGV0dGUsIFtyLCBnLCBiXSlcclxuXHJcbiAgICAgICAgdGFibGVbaW5kZXhdID0gY2xvc2VzdFxyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICByZXR1cm4geyBjaENvdW50LCBjaGFubmVsTG9va3VwLCB0YWJsZSB9XHJcbn1cclxuXHJcbmNvbnN0IGNvdW50VW5pcXVlQ29sb3JzID0gKGltYWdlOiBJbWFnZURhdGEpOiBudW1iZXIgPT4ge1xyXG4gIGNvbnN0IHNldCA9IG5ldyBTZXQ8bnVtYmVyPigpXHJcblxyXG4gIGNvbnN0IGltYWdlVmlldyA9IG5ldyBVaW50MzJBcnJheShpbWFnZS5kYXRhLmJ1ZmZlcilcclxuXHJcbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBpbWFnZVZpZXcubGVuZ3RoOyBpKyspIHtcclxuICAgIHNldC5hZGQoaW1hZ2VWaWV3W2ldKVxyXG4gIH1cclxuXHJcbiAgcmV0dXJuIHNldC5zaXplXHJcbn1cclxuIl19