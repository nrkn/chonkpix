import { colorToRgb, createColor, createColor24 } from '../lib/image/color.js';
import { createImage } from '../lib/image/create.js';
import { fill } from '../lib/image/fill.js';
import { loadImage } from '../lib/image/load.js';
import { resize } from '../lib/image/resize.js';
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicGFsZXR0ZS1zY2VuZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy9zY2VuZXMvcGFsZXR0ZS1zY2VuZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxPQUFPLEVBQUUsVUFBVSxFQUFFLFdBQVcsRUFBRSxhQUFhLEVBQUUsTUFBTSx1QkFBdUIsQ0FBQTtBQUM5RSxPQUFPLEVBQUUsV0FBVyxFQUFFLE1BQU0sd0JBQXdCLENBQUE7QUFDcEQsT0FBTyxFQUFFLElBQUksRUFBRSxNQUFNLHNCQUFzQixDQUFBO0FBQzNDLE9BQU8sRUFBRSxTQUFTLEVBQUUsTUFBTSxzQkFBc0IsQ0FBQTtBQUNoRCxPQUFPLEVBQUUsTUFBTSxFQUFFLE1BQU0sd0JBQXdCLENBQUE7QUFFL0MsT0FBTyxFQUFFLEtBQUssRUFBRSxJQUFJLEVBQUUsTUFBTSxnQkFBZ0IsQ0FBQTtBQUU1QyxPQUFPLEVBQ2EsZUFBZSxFQUNqQyxpQkFBaUIsRUFDbEIsTUFBTSxnQ0FBZ0MsQ0FBQTtBQUV2QyxxQ0FBcUM7QUFDckMsTUFBTSxDQUFDLE1BQU0sbUJBQW1CLEdBQUcsR0FBVSxFQUFFO0lBQzdDLElBQUksT0FBTyxHQUE0QixJQUFJLENBQUE7SUFDM0MsSUFBSSxTQUFTLEdBQXFCLElBQUksQ0FBQTtJQUV0QywyRUFBMkU7SUFDM0Usd0VBQXdFO0lBQ3hFLGNBQWM7SUFDZCxFQUFFO0lBQ0YsUUFBUTtJQUNSLElBQUksUUFBUSxHQUFzQixJQUFJLENBQUE7SUFDdEMsUUFBUTtJQUNSLElBQUksVUFBVSxHQUF1QixJQUFJLENBQUE7SUFFekMsa0JBQWtCO0lBQ2xCLFlBQVk7SUFDWixJQUFJLFNBQVMsR0FBc0IsSUFBSSxDQUFBO0lBQ3ZDLElBQUksSUFBSSxHQUF1QixJQUFJLENBQUE7SUFDbkMsSUFBSSxXQUFXLEdBQXVCLElBQUksQ0FBQTtJQUUxQyxNQUFNLGNBQWMsR0FBRyxDQUNyQixHQUFxQixFQUFFLENBQVMsRUFBRSxDQUFTLEVB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QUcsT0FBTyxFQUFFLEVBQUUsRUFBRSxFQUFFLENBQUM7Z0JBQ3BDLE1BQU0sS0FBSyxHQUFHLEVBQUUsR0FBRyxRQUFRLENBQUE7Z0JBRTNCLE1BQU0sQ0FBQyxHQUFHLE1BQU0sQ0FBQyxFQUFFLENBQUMsQ0FBQTtnQkFDcEIsTUFBTSxDQUFDLEdBQUcsTUFBTSxDQUFDLEVBQUUsQ0FBQyxDQUFBO2dCQUNwQixNQUFNLENBQUMsR0FBRyxNQUFNLENBQUMsRUFBRSxDQUFDLENBQUE7Z0JBRXBCLE1BQU0sT0FBTyxHQUFHLGlCQUFpQixDQUFDLE9BQU8sRUFBRSxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQTtnQkFFckQsS0FBSyxDQUFDLEtBQUssQ0FBQyxHQUFHLE9BQU8sQ0FBQTtZQUN4QixDQUFDO1FBQ0gsQ0FBQztJQUNILENBQUM7SUFFRCxPQUFPLEVBQUUsT0FBTyxFQUFFLGFBQWEsRUFBRSxLQUFLLEVBQUUsQ0FBQTtBQUMxQyxDQUFDLENBQUE7QUFFRCxNQUFNLGlCQUFpQixHQUFHLENBQUMsS0FBZ0IsRUFBVSxFQUFFO0lBQ3JELE1BQU0sR0FBRyxHQUFHLElBQUksR0FBRyxFQUFVLENBQUE7SUFFN0IsTUFBTSxTQUFTLEdBQUcsSUFBSSxXQUFXLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQTtJQUVwRCxLQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsU0FBUyxDQUFDLE1BQU0sRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDO1FBQzFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUE7SUFDdkIsQ0FBQztJQUVELE9BQU8sR0FBRyxDQUFDLElBQUksQ0FBQTtBQUNqQixDQUFDLENBQUEiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBjb2xvclRvUmdiLCBjcmVhdGVDb2xvciwgY3JlYXRlQ29sb3IyNCB9IGZyb20gJy4uL2xpYi9pbWFnZS9jb2xvci5qcydcclxuaW1wb3J0IHsgY3JlYXRlSW1hZ2UgfSBmcm9tICcuLi9saWIvaW1hZ2UvY3JlYXRlLmpzJ1xyXG5pbXBvcnQgeyBmaWxsIH0gZnJvbSAnLi4vbGliL2ltYWdlL2ZpbGwuanMnXHJcbmltcG9ydCB7IGxvYWRJbWFnZSB9IGZyb20gJy4uL2xpYi9pbWFnZS9sb2FkLmpzJ1xyXG5pbXBvcnQgeyByZXNpemUgfSBmcm9tICcuLi9saWIvaW1hZ2UvcmVzaXplLmpzJ1xyXG5pbXBvcnQgeyBNYXliZSwgU2NlbmUsIFN0YXRlLCBUMiB9IGZyb20gJy4uL2xpYi90eXBlcy5qcydcclxuaW1wb3J0IHsgbWF5YmUsIHdhaXQgfSBmcm9tICcuLi9saWIvdXRpbC5qcydcclxuXHJcbmltcG9ydCB7XHJcbiAgR2VuZXJhdGVkUGFsZXR0ZSwgZ2VuZXJhdGVQYWxldHRlLFxyXG4gIGluZGV4T2ZDbG9zZXN0UmdiXHJcbn0gZnJvbSAnLi4vc2FuZGJveC9nZW5lcmF0ZS1wYWxldHRlLmpzJ1xyXG5cclxuLy8gZXhwZXJpbWVudGluZyB3aXRoIGluZGV4ZWQgcGFsZXR0ZVxyXG5leHBvcnQgY29uc3QgcGFsZXR0ZVNhbmRib3hTY2VuZSA9ICgpOiBTY2VuZSA9PiB7XHJcbiAgbGV0IHBhbGV0dGU6IE1heWJlPEdlbmVyYXRlZFBhbGV0dGU+ID0gbnVsbFxyXG4gIGxldCB0ZXN0SW1hZ2U6IE1heWJlPEltYWdlRGF0YT4gPSBudWxsXHJcblxyXG4gIC8vIHRoZXNlIG5haXZlIGx1dHMgYXJlIHNsb3cgdG8gZ2VuZXJhdGUgYW5kIHRha2UgYSBsb3Qgb2YgbWVtb3J5LCBidXQgdGhleVxyXG4gIC8vIHNlcnZlIGFzIGEgZ29vZCByZWZlcmVuY2UgaW1wbGVtZW50YXRpb24gYW5kIGJhc2VsaW5lIGZvciBwZXJmb3JtYW5jZVxyXG4gIC8vIGNvbXBhcmlzb25zXHJcbiAgLy9cclxuICAvLyAxNm1iIVxyXG4gIGxldCBuYWl2ZUx1dDogTWF5YmU8VWludDhBcnJheT4gPSBudWxsXHJcbiAgLy8gNjRtYiFcclxuICBsZXQgbmFpdmVMdXQzMjogTWF5YmU8VWludDMyQXJyYXk+ID0gbnVsbFxyXG5cclxuICAvLyB0ZXN0aW5nIGFuIGlkZWFcclxuICAvLyBhbHNvIDE2bWJcclxuICBsZXQgbmFpdmVMdXQyOiBNYXliZTxVaW50OEFycmF5PiA9IG51bGxcclxuICBsZXQgcGFsMjogTWF5YmU8VWludDMyQXJyYXk+ID0gbnVsbFxyXG4gIGxldCBuYWl2ZTJMdXQzMjogTWF5YmU8VWludDMyQXJyYXk+ID0gbnVsbFxyXG5cclxuICBjb25zdCBjcmVhdGVQYWxJbWFnZSA9IChcclxuICAgIHBhbDogR2VuZXJhdGVkUGFsZXR0ZSwgdzogbnVtYmVyLCBoOiBudW1iZXJcclxuICApID0+IHtcclxuICAgIGNvbnN0IHBhbEltYWdlID0gY3JlYXRlSW1hZ2UodywgaClcclxuXHJcbiAgICBmaWxsKHBhbEltYWdlLCBjcmVhdGVDb2xvcigweDAwLCAweGZmLCAweGZmKSlcclxuXHJcbiAgICBmb3IgKGxldCB5ID0gMDsgeSA8IGg7IHkrKykge1xyXG4gICAgICBjb25zdCByb3cgPSB5ICogd1xyXG4gICAgICBmb3IgKGxldCB4ID0gMDsgeCA8IHc7IHgrKykge1xyXG4gICAgICAgIGNvbnN0IGluZGV4ID0gcm93ICsgeFxyXG4gICAgICAgIGNvbnN0IHBhbEluZGV4ID0gaW5kZXggKiAzXHJcblxyXG4gICAgICAgIGlmIChwYWxJbmRleCA+PSBwYWwuZGF0YS5sZW5ndGgpIHtcclxuICAgICAgICAgIGJyZWFrXHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBjb25zdCByID0gcGFsLmRhdGFbcGFsSW5kZXhdXHJcbiAgICAgICAgY29uc3QgZyA9IHBhbC5kYXRhW3BhbEluZGV4ICsgMV1cclxuICAgICAgICBjb25zdCBiID0gcGFsLmRhdGFbcGFsSW5kZXggKyAyXVxyXG5cclxuICAgICAgICBjb25zdCBpbWdJbmRleCA9IGluZGV4ICogNFxyXG5cclxuICAgICAgICBwYWxJbWFnZS5kYXRhW2ltZ0luZGV4XSA9IHJcclxuICAgICAgICBwYWxJbWFnZS5kYXRhW2ltZ0luZGV4ICsgMV0gPSBnXHJcbiAgICAgICAgcGFsSW1hZ2UuZGF0YVtpbWdJbmRleCArIDJdID0gYlxyXG4gICAgICAgIHBhbEltYWdlLmRhdGFbaW1nSW5kZXggKyAzXSA9IDI1NVxyXG4gICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIHBhbEltYWdlXHJcbiAgfVxyXG5cclxuICBjb25zdCBjcmVhdGVQYWwySW1hZ2UgPSAoXHJcbiAgICBwYWw6IFVpbnQzMkFycmF5LCB3OiBudW1iZXIsIGg6IG51bWJlclxyXG4gICkgPT4ge1xyXG4gICAgaWYgKHBhbC5sZW5ndGggPiB3ICogaCkge1xyXG4gICAgICB0aHJvdyBFcnJvcignUGFsZXR0ZSBpcyB0b28gbGFyZ2UgZm9yIGltYWdlJylcclxuICAgIH1cclxuICAgIGNvbnN0IHBhbEltYWdlID0gY3JlYXRlSW1hZ2UodywgaClcclxuXHJcbiAgICBmaWxsKHBhbEltYWdlLCBjcmVhdGVDb2xvcigweDAwLCAweGZmLCAweGZmKSlcclxuXHJcbiAgICBwYWwgPSBwYWwubWFwKGNvbG9yID0+IGNvbG9yIHwgMHhmZjAwMDAwMClcclxuXHJcbiAgICBjb25zdCB2aWV3ID0gbmV3IFVpbnQzMkFycmF5KHBhbEltYWdlLmRhdGEuYnVmZmVyKVxyXG5cclxuICAgIHZpZXcuc2V0KHBhbClcclxuXHJcbiAgICByZXR1cm4gcGFsSW1hZ2VcclxuICB9XHJcblxyXG4gIGNvbnN0IGluaXQgPSBhc3luYyAoc3RhdGU6IFN0YXRlKSA9PiB7XHJcbiAgICBjb25zdCBidWZmZXIgPSBzdGF0ZS52aWV3LmdldEJ1ZmZlcigpXHJcblxyXG4gICAgZmlsbChidWZmZXIsIGNyZWF0ZUNvbG9yKDB4MDAsIDB4MDAsIDB4MDApKVxyXG5cclxuICAgIGNvbnNvbGUubG9nKCdzdGFydGluZyBpbml0JylcclxuXHJcbiAgICBjb25zdCB7IHdpZHRoLCBoZWlnaHQgfSA9IGJ1ZmZlclxyXG5cclxuICAgIGNvbnN0IHByb2dyZXNzQmFyV2lkdGggPSBNYXRoLmZsb29yKHdpZHRoICogMC44KVxyXG4gICAgY29uc3QgcHJvZ3Jlc3NCYXJYID0gTWF0aC5mbG9vcih3aWR0aCAqIDAuMSlcclxuICAgIGNvbnN0IHByb2dyZXNzQmFyWSA9IE1hdGguZmxvb3IoaGVpZ2h0ICogMC41KVxyXG4gICAgY29uc3QgcHJvZ3Jlc3NCYXJIZWlnaHQgPSAyXHJcblxyXG4gICAgY29uc3QgcHJvZ3Jlc3MgPSAodG90YWw6IG51bWJlcikgPT4ge1xyXG4gICAgICBjb25zdCBzdGVwID0gcHJvZ3Jlc3NCYXJXaWR0aCAvIHRvdGFsXHJcblxyXG4gICAgICByZXR1cm4gYXN5bmMgKGk6IG51bWJlcikgPT4ge1xyXG4gICAgICAgIGZpbGwoXHJcbiAgICAgICAgICBidWZmZXIsXHJcbiAgICAgICAgICBjcmVhdGVDb2xvcigweDY2LCAweDY2LCAweDY2KSxcclxuICAgICAgICAgIFtwcm9ncmVzc0JhclgsIHByb2dyZXNzQmFyWSwgcHJvZ3Jlc3NCYXJXaWR0aCwgcHJvZ3Jlc3NCYXJIZWlnaHRdXHJcbiAgICAgICAgKVxyXG5cclxuICAgICAgICBjb25zdCB3aWR0aCA9IE1hdGgucm91bmQoc3RlcCAqIGkpXHJcblxyXG4gICAgICAgIGZpbGwoXHJcbiAgICAgICAgICBidWZmZXIsXHJcbiAgICAgICAgICBjcmVhdGVDb2xvcigweDMzLCAweDk5LCAweGZmKSxcclxuICAgICAgICAgIFtwcm9ncmVzc0JhclgsIHByb2dyZXNzQmFyWSwgd2lkdGgsIHByb2dyZXNzQmFySGVpZ2h0XVxyXG4gICAgICAgIClcclxuXHJcbiAgICAgICAgYXdhaXQgd2FpdCgpXHJcbiAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICAvLyByZXNlcnZlIG9uZSBjb2xvciBmb3IgZWcgdHJhbnNwYXJlbnRcclxuICAgIHBhbGV0dGUgPSBnZW5lcmF0ZVBhbGV0dGUoMjU1LCAxMiwgNCwgNSlcclxuXHJcbiAgICAvLyBqdXN0IGxvZyB0aGUgbWV0YWRhdGFcclxuICAgIGNvbnN0IG5vRW50cmllcyA9IHtcclxuICAgICAgLi4ucGFsZXR0ZSxcclxuICAgICAgZGF0YTogdW5kZWZpbmVkXHJcbiAgICB9XHJcblxyXG4gICAgY29uc29sZS5sb2cobm9FbnRyaWVzKVxyXG5cclxuICAgIHRlc3RJbWFnZSA9IGF3YWl0IGxvYWRJbWFnZSgnc2NlbmVzL3BhbC9jb2xvcnMucG5nJylcclxuXHJcbiAgICBjb25zdCBwYWxDb2xvcnM6IFQyW10gPSBbXVxyXG5cclxuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgcGFsZXR0ZS5lbnRyeUNvdW50OyBpKyspIHtcclxuICAgICAgY29uc3QgciA9IHBhbGV0dGUuZGF0YVtpICogM11cclxuICAgICAgY29uc3QgZyA9IHBhbGV0dGUuZGF0YVtpICogMyArIDFdXHJcbiAgICAgIGNvbnN0IGIgPSBwYWxldHRlLmRhdGFbaSAqIDMgKyAyXVxyXG5cclxuICAgICAgY29uc3QgY29sb3IyNCA9IGNyZWF0ZUNvbG9yMjQociwgZywgYilcclxuXHJcbiAgICAgIHBhbENvbG9ycy5wdXNoKFtjb2xvcjI0LCBpXSlcclxuICAgIH1cclxuXHJcbiAgICBwYWxDb2xvcnMuc29ydCgoYSwgYikgPT4gYVswXSAtIGJbMF0pXHJcblxyXG4gICAgY29uc29sZS5sb2coJ3BhbENvbG9ycycsIHBhbENvbG9ycylcclxuXHJcbiAgICBjb25zdCBwYWxNYXBOZXdUb09sZCA9IEFycmF5PG51bWJlcj4ocGFsZXR0ZS5lbnRyeUNvdW50KVxyXG4gICAgY29uc3QgcGFsTWFwT2xkVG9OZXcgPSBBcnJheTxudW1iZXI+KHBhbGV0dGUuZW50cnlDb3VudClcclxuXHJcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHBhbENvbG9ycy5sZW5ndGg7IGkrKykge1xyXG4gICAgICBjb25zdCBvbGRJbmRleCA9IHBhbENvbG9yc1tpXVsxXVxyXG5cclxuICAgICAgcGFsTWFwTmV3VG9PbGRbaV0gPSBvbGRJbmRleFxyXG4gICAgICBwYWxNYXBPbGRUb05ld1tvbGRJbmRleF0gPSBpXHJcbiAgICB9XHJcblxyXG4gICAgcGFsMiA9IG5ldyBVaW50MzJBcnJheShwYWxldHRlLmVudHJ5Q291bnQpXHJcblxyXG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBwYWxldHRlLmVudHJ5Q291bnQ7IGkrKykge1xyXG4gICAgICBwYWwyW2ldID0gcGFsQ29sb3JzW2ldWzBdXHJcbiAgICB9XHJcblxyXG4gICAgY29uc29sZS5sb2coJ3BhbDInLCBwYWwyKVxyXG5cclxuICAgIG5haXZlMkx1dDMyID0gbmV3IFVpbnQzMkFycmF5KHBhbGV0dGUuZW50cnlDb3VudClcclxuXHJcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHBhbGV0dGUuZW50cnlDb3VudDsgaSsrKSB7XHJcbiAgICAgIGNvbnN0IHIgPSBwYWxldHRlLmRhdGFbaSAqIDNdXHJcbiAgICAgIGNvbnN0IGcgPSBwYWxldHRlLmRhdGFbaSAqIDMgKyAxXVxyXG4gICAgICBjb25zdCBiID0gcGFsZXR0ZS5kYXRhW2kgKiAzICsgMl1cclxuXHJcbiAgICAgIGNvbnN0IGNvbG9yID0gY3JlYXRlQ29sb3IociwgZywgYilcclxuXHJcbiAgICAgIG5haXZlMkx1dDMyW2ldID0gY29sb3JcclxuICAgIH1cclxuXHJcbiAgICAvLyBcclxuXHJcbiAgICBjb25zdCBudW1Db2xvcnMyNCA9IDB4ZmZmZmZmXHJcblxyXG4gICAgY29uc3QgclZhbHVlcyA9IG5ldyBTZXQ8bnVtYmVyPigpXHJcbiAgICBjb25zdCBnVmFsdWVzID0gbmV3IFNldDxudW1iZXI+KClcclxuICAgIGNvbnN0IGJWYWx1ZXMgPSBuZXcgU2V0PG51bWJlcj4oKVxyXG4gICAgY29uc3QgY1ZhbHVlcyA9IG5ldyBTZXQ8bnVtYmVyPigpXHJcblxyXG4gICAgY29uc3Qgc3RlcENvdW50ID0gMTBcclxuXHJcbiAgICBjb25zdCBwID0gcHJvZ3Jlc3Moc3RlcENvdW50KVxyXG5cclxuICAgIGNvbnNvbGUubG9nKCdnZW5lcmF0ZWQgcGFsZXR0ZSBsb29rdXBzJylcclxuXHJcbiAgICBhd2FpdCBwKDApXHJcblxyXG4gICAgY29uc3QgcHN0ZXAgPSBudW1Db2xvcnMyNCAvIHN0ZXBDb3VudFxyXG4gICAgbGV0IGNzdGVwID0gcHN0ZXBcclxuICAgIGxldCBwdmFsID0gMFxyXG5cclxuICAgIGNvbnN0IG5sdXRTdGFydCA9IHBlcmZvcm1hbmNlLm5vdygpXHJcbiAgICBuYWl2ZUx1dCA9IG5ldyBVaW50OEFycmF5KG51bUNvbG9yczI0KVxyXG4gICAgbmFpdmVMdXQzMiA9IG5ldyBVaW50MzJBcnJheShudW1Db2xvcnMyNClcclxuXHJcbiAgICBuYWl2ZUx1dDIgPSBuZXcgVWludDhBcnJheShudW1Db2xvcnMyNClcclxuXHJcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IDB4ZmZmZmZmOyBpKyspIHtcclxuICAgICAgY29uc3QgW3IsIGcsIGJdID0gY29sb3JUb1JnYihpKVxyXG4gICAgICBjb25zdCBpbmRleCA9IGluZGV4T2ZDbG9zZXN0UmdiKHBhbGV0dGUsIFtyLCBnLCBiXSlcclxuICAgICAgbmFpdmVMdXRbaV0gPSBpbmRleFxyXG4gICAgICBuYWl2ZUx1dDJbaV0gPSBwYWxNYXBPbGRUb05ld1tpbmRleF1cclxuXHJcbiAgICAgIGNvbnN0IHBhbFIgPSBwYWxldHRlLmRhdGFbaW5kZXggKiAzXVxyXG4gICAgICBjb25zdCBwYWxHID0gcGFsZXR0ZS5kYXRhW2luZGV4ICogMyArIDFdXHJcbiAgICAgIGNvbnN0IHBhbEIgPSBwYWxldHRlLmRhdGFbaW5kZXggKiAzICsgMl1cclxuXHJcbiAgICAgIHJWYWx1ZXMuYWRkKHBhbFIpXHJcbiAgICAgIGdWYWx1ZXMuYWRkKHBhbEcpXHJcbiAgICAgIGJWYWx1ZXMuYWRkKHBhbEIpXHJcblxyXG4gICAgICBjVmFsdWVzLmFkZChwYWxSKVxyXG4gICAgICBjVmFsdWVzLmFkZChwYWxHKVxyXG4gICAgICBjVmFsdWVzLmFkZChwYWxCKVxyXG5cclxuICAgICAgY29uc3QgY29sb3IgPSBjcmVhdGVDb2xvcihwYWxSLCBwYWxHLCBwYWxCKVxyXG5cclxuICAgICAgbmFpdmVMdXQzMltpXSA9IGNvbG9yXHJcblxyXG4gICAgICBpZiAoaSA+PSBjc3RlcCkge1xyXG4gICAgICAgIGNzdGVwICs9IHBzdGVwXHJcbiAgICAgICAgcHZhbCsrXHJcbiAgICAgICAgYXdhaXQgcChwdmFsKVxyXG4gICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgY29uc3Qgbmx1dEVuZCA9IHBlcmZvcm1hbmNlLm5vdygpXHJcblxyXG4gICAgY29uc29sZS5sb2coJ05haXZlIExVVHMgVGltZTonLCBubHV0RW5kIC0gbmx1dFN0YXJ0KVxyXG5cclxuICAgIGNvbnNvbGUubG9nKCdOYWl2ZSBMVVQnLCBuYWl2ZUx1dClcclxuICAgIGNvbnNvbGUubG9nKCdOYWl2ZSBMVVQgMicsIG5haXZlTHV0MilcclxuXHJcbiAgICAvL1xyXG5cclxuICAgIGNvbnN0IHJBcnIgPSBBcnJheS5mcm9tKHJWYWx1ZXMpXHJcbiAgICBjb25zdCBnQXJyID0gQXJyYXkuZnJvbShnVmFsdWVzKVxyXG4gICAgY29uc3QgYkFyciA9IEFycmF5LmZyb20oYlZhbHVlcylcclxuICAgIGNvbnN0IGNBcnIgPSBBcnJheS5mcm9tKGNWYWx1ZXMpXHJcblxyXG4gICAgckFyci5zb3J0KChhLCBiKSA9PiBhIC0gYilcclxuICAgIGdBcnIuc29ydCgoYSwgYikgPT4gYSAtIGIpXHJcbiAgICBiQXJyLnNvcnQoKGEsIGIpID0+IGEgLSBiKVxyXG4gICAgY0Fyci5zb3J0KChhLCBiKSA9PiBhIC0gYilcclxuXHJcbiAgICBjb25zb2xlLmxvZygnckFycicsIHJBcnIpXHJcbiAgICBjb25zb2xlLmxvZygnZ0FycicsIGdBcnIpXHJcbiAgICBjb25zb2xlLmxvZygnYkFycicsIGJBcnIpXHJcbiAgICBjb25zb2xlLmxvZygnY0FycicsIGNBcnIpXHJcblxyXG4gICAgLy9cclxuXHJcbiAgICAvLyBuYWl2ZUx1dCBpcyBhIG1hcHBpbmcgd2hlcmUgdGhlIGluZGV4IGlzIHRoZSAyNCBiaXQgcmdiIHZhbHVlIGFuZCB0aGVcclxuICAgIC8vIHZhbHVlIGlzIHRoZSBpbmRleCBvZiB0aGUgY2xvc2VzdCBjb2xvciBpbiB0aGUgcGFsZXR0ZVxyXG4gICAgLy9cclxuICAgIC8vIGNvbnNlY3V0aXZlIDI0IGJpdCBpbmRpY2VzIGFsbCBwb2ludCB0byB0aGUgc2FtZSBwYWxldHRlIGluZGV4IGluIHJ1bnNcclxuICAgIC8vIHdlIGNvdWxkIGNvbXByZXNzIHRoZSBzdHJ1Y3R1cmUgbGlrZSBzbzpcclxuICAgIC8vIFxyXG4gICAgLy8gd2UgdXNlIGEgVWludDMyQXJyYXkgdG8gc3RvcmUgdHdvIGZpZWxkczpcclxuICAgIC8vIDEuIHRoZSAyNCBiaXQgdmFsdWUgdGhhdCBpcyB0aGUgKmVuZCogb2YgdGhlIHJvdyBvZiBjb25zZWN1dGl2ZSBpbmRpY2VzXHJcbiAgICAvLyAyLiB0aGUgOCBiaXQgcGFsZXR0ZSBpbmRleFxyXG4gICAgLy9cclxuICAgIC8vIHRoZW4sIHRvIG1hcCByZ2IgdG8gaW5kZXgsIHlvdSBzZWFyY2ggdGhyb3VnaCBlYWNoIGZpZWxkIHRvIGZpbmQgdGhlIFxyXG4gICAgLy8gZmlyc3QgZW5kIG9mIHJvdyB3aGljaCBpcyBncmVhdGVyIHRoYW4gb3IgZXF1YWwgdG8gdGhlIHJnYiB2YWx1ZVxyXG4gICAgLy8gYW5kIHJldHVybiB0aGUgcGFsZXR0ZSBpbmRleFxyXG4gICAgLy8gaXQgd2lsbCBiZSBhIGJpdCBzbG93ZXIgdGhhbiBlZyBuYWl2ZUx1dDMyIHdoaWNoIGlzIHRoZSBmYXN0ZXN0LCBidXQgXHJcbiAgICAvLyB0aGF0IHN0cnVjdHVyZSBpcyB+NjRtYlxyXG5cclxuICAgIGxldCBwcmV2ID0gLTFcclxuICAgIGxldCByb3dDb3VudCA9IDBcclxuXHJcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IG51bUNvbG9yczI0OyBpKyspIHtcclxuICAgICAgY29uc3QgdmFsdWUgPSBuYWl2ZUx1dFtpXVxyXG5cclxuICAgICAgaWYgKHZhbHVlICE9PSBwcmV2KSB7XHJcbiAgICAgICAgcm93Q291bnQrK1xyXG4gICAgICB9XHJcblxyXG4gICAgICBwcmV2ID0gdmFsdWVcclxuICAgIH1cclxuXHJcbiAgICAvLyBpdCB3aWxsIGhhdmUgcm93Q291bnQgcm93c1xyXG5cclxuICAgIGNvbnNvbGUubG9nKCdyb3djb3VudDonLCByb3dDb3VudCwgJ2J5dGVzOicsIHJvd0NvdW50ICogNClcclxuXHJcbiAgICAvL1xyXG5cclxuICAgIGNyZWF0ZU5ld0x1dFRoaW5nKHBhbGV0dGUpXHJcbiAgfVxyXG5cclxuICBsZXQgaXNEaXNhYmxlVXBkYXRlID0gZmFsc2VcclxuXHJcbiAgY29uc3QgdXBkYXRlID0gKHN0YXRlOiBTdGF0ZSkgPT4ge1xyXG4gICAgaWYgKCFtYXliZShwYWxldHRlKSkgdGhyb3cgRXJyb3IoJ1BhbGV0dGUgbm90IGdlbmVyYXRlZCcpXHJcbiAgICBpZiAoIW1heWJlKHRlc3RJbWFnZSkpIHRocm93IEVycm9yKCdUZXN0IGltYWdlIG5vdCBsb2FkZWQnKVxyXG4gICAgaWYgKCFtYXliZShuYWl2ZUx1dCkpIHRocm93IEVycm9yKCdOYWl2ZSBMVVQgbm90IGdlbmVyYXRlZCcpXHJcbiAgICBpZiAoIW1heWJlKG5haXZlTHV0MzIpKSB0aHJvdyBFcnJvcignTmFpdmUgTFVUMzIgbm90IGdlbmVyYXRlZCcpXHJcbiAgICBpZiAoIW1heWJlKG5haXZlTHV0MikpIHRocm93IEVycm9yKCdOYWl2ZSBMVVQyIG5vdCBnZW5lcmF0ZWQnKVxyXG4gICAgaWYgKCFtYXliZShwYWwyKSkgdGhyb3cgRXJyb3IoJ1BhbDIgbm90IGdlbmVyYXRlZCcpXHJcbiAgICBpZiAoIW1heWJlKG5haXZlMkx1dDMyKSkgdGhyb3cgRXJyb3IoJ05haXZlMiBMVVQzMiBub3QgZ2VuZXJhdGVkJylcclxuXHJcbiAgICAvLyB0ZW1wIFxyXG4gICAgaWYgKGlzRGlzYWJsZVVwZGF0ZSkgcmV0dXJuXHJcblxyXG4gICAgLy8gaGFuZGxlIGlvXHJcblxyXG4gICAgY29uc3Qgd2hlZWwgPSBzdGF0ZS5tb3VzZS50YWtlV2hlZWwoKVxyXG4gICAgY29uc3Qgem9vbSA9IHN0YXRlLnZpZXcuZ2V0Wm9vbSgpXHJcblxyXG4gICAgaWYgKHdoZWVsIDwgMCkge1xyXG4gICAgICBzdGF0ZS52aWV3LnNldFpvb20oIHpvb20gKyAxIClcclxuICAgIH0gZWxzZSBpZiAod2hlZWwgPiAwKSB7XHJcbiAgICAgIHN0YXRlLnZpZXcuc2V0Wm9vbSggem9vbSAtIDEgKVxyXG4gICAgfVxyXG5cclxuICAgIGNvbnN0IGtleXMgPSBzdGF0ZS5nZXRLZXlzKClcclxuXHJcbiAgICBpZiAoa2V5c1snRXNjYXBlJ10pIHtcclxuICAgICAgc3RhdGUuc2V0UnVubmluZyhmYWxzZSlcclxuXHJcbiAgICAgIC8vIGNvbnN1bWUgdGhlIGtleVxyXG4gICAgICBrZXlzWydFc2NhcGUnXSA9IGZhbHNlXHJcblxyXG4gICAgICByZXR1cm5cclxuICAgIH1cclxuXHJcbiAgICAvL1xyXG5cclxuICAgIGNvbnN0IGJ1ZmZlciA9IHN0YXRlLnZpZXcuZ2V0QnVmZmVyKClcclxuXHJcbiAgICBmaWxsKGJ1ZmZlciwgY3JlYXRlQ29sb3IoMHgwMCwgMHgwMCwgMHgwMCkpXHJcblxyXG4gICAgbG9nT25jZSgnYnVmZmVyUGl4ZWxzJywgJ0J1ZmZlciBwaXhlbHM6JywgYnVmZmVyLndpZHRoICogYnVmZmVyLmhlaWdodClcclxuXHJcbiAgICAvLyBjb3VsZCBvcHRpbWl6ZSBieSBkb2luZyB0aGlzIGluIGluaXQsIGJ1dCB0aGUgc2NlbmUgZWFzaWx5IGhpdHMgNjBmcHNcclxuICAgIC8vIGFuZCBpdCdzIGp1c3QgYSBzYW5kYm94XHJcblxyXG4gICAgLy8gcGFsZXR0ZSBzdHVmZlxyXG5cclxuICAgIGNvbnN0IG51bVBhbHMgPSAyXHJcblxyXG4gICAgLy9cclxuXHJcbiAgICBjb25zdCBwYWxXaWR0aCA9IHBhbGV0dGUubGlnaHRSYW5nZVxyXG4gICAgY29uc3QgcGFsSGVpZ2h0ID0gTWF0aC5jZWlsKHBhbGV0dGUuZW50cnlDb3VudCAvIHBhbFdpZHRoKVxyXG5cclxuICAgIC8vXHJcblxyXG4gICAgY29uc3QgcGFsSW1hZ2UgPSBjcmVhdGVQYWxJbWFnZShwYWxldHRlLCBwYWxXaWR0aCwgcGFsSGVpZ2h0KVxyXG5cclxuICAgIGNvbnN0IG5ld0hlaWdodCA9IGJ1ZmZlci5oZWlnaHRcclxuICAgIGNvbnN0IHNjYWxlID0gbmV3SGVpZ2h0IC8gcGFsSGVpZ2h0XHJcbiAgICBjb25zdCBuZXdXaWR0aCA9IE1hdGguZmxvb3IocGFsV2lkdGggKiBzY2FsZSlcclxuXHJcbiAgICByZXNpemUoXHJcbiAgICAgIHBhbEltYWdlLCBidWZmZXIsXHJcbiAgICAgIFswLCAwLCBwYWxXaWR0aCwgcGFsSGVpZ2h0XSwgWzAsIDAsIG5ld1dpZHRoLCBuZXdIZWlnaHRdXHJcbiAgICApXHJcblxyXG4gICAgLy9cclxuXHJcbiAgICBjb25zdCBwYWwySW1hZ2UgPSBjcmVhdGVQYWwySW1hZ2UocGFsMiwgcGFsV2lkdGgsIHBhbEhlaWdodClcclxuXHJcbiAgICByZXNpemUoXHJcbiAgICAgIHBhbDJJbWFnZSwgYnVmZmVyLFxyXG4gICAgICBbMCwgMCwgcGFsV2lkdGgsIHBhbEhlaWdodF0sIFtuZXdXaWR0aCwgMCwgbmV3V2lkdGgsIG5ld0hlaWdodF1cclxuICAgIClcclxuXHJcbiAgICAvL1xyXG5cclxuICAgIGNvbnN0IHBhbHNXaWR0aCA9IG5ld1dpZHRoICogbnVtUGFsc1xyXG5cclxuICAgIC8vXHJcblxyXG4gICAgY29uc3QgcmVtYWluaW5nV2lkdGggPSBidWZmZXIud2lkdGggLSBwYWxzV2lkdGhcclxuXHJcbiAgICAvL1xyXG4gICAgY29uc3QgaW1hZ2VDb3VudCA9IDVcclxuXHJcbiAgICAvLyBtYWtlIHNwYWNlIGZvciBpbWFnZXMgc2lkZSBieSBzaWRlXHJcbiAgICBjb25zdCBpbWFnZVdpZHRocyA9IE1hdGguZmxvb3IocmVtYWluaW5nV2lkdGggLyBpbWFnZUNvdW50KVxyXG5cclxuICAgIC8vIG5leHQgd2UnbGwgdHJ5IGNvbnZlcnRpbmcgYW4gaW1hZ2UgdG8gcGFsZXR0ZSBhbmQgc2hvdyB0aGUgb3JpZ2luYWxcclxuICAgIC8vIGFuZCBjb252ZXJ0ZWQgc2lkZSBieSBzaWRlLCB0aGVuIHdlIGNhbiBzdGFydCBleHBlcmltZW50aW5nIHdpdGhcclxuICAgIC8vIGNyZWF0aW5nIGEgTFVUXHJcblxyXG4gICAgY29uc3QgbmV3T3JpZ1dpZHRoID0gaW1hZ2VXaWR0aHNcclxuICAgIGNvbnN0IHNjYWxlT3JpZyA9IG5ld09yaWdXaWR0aCAvIHRlc3RJbWFnZS53aWR0aFxyXG4gICAgY29uc3QgbmV3T3JpZ0hlaWdodCA9IE1hdGguZmxvb3IodGVzdEltYWdlLmhlaWdodCAqIHNjYWxlT3JpZylcclxuXHJcbiAgICByZXNpemUoXHJcbiAgICAgIHRlc3RJbWFnZSwgYnVmZmVyLFxyXG4gICAgICBbMCwgMCwgdGVzdEltYWdlLndpZHRoLCB0ZXN0SW1hZ2UuaGVpZ2h0XSxcclxuICAgICAgW3BhbHNXaWR0aCwgMCwgbmV3T3JpZ1dpZHRoLCBuZXdPcmlnSGVpZ2h0XVxyXG4gICAgKVxyXG5cclxuICAgIGNvbnN0IGNvbG9yc09yaWcgPSBjb3VudFVuaXF1ZUNvbG9ycyh0ZXN0SW1hZ2UpXHJcblxyXG4gICAgbG9nT25jZSgnY29sb3JzT3JpZycsICdVbmlxdWUgY29sb3JzIGluIG9yaWdpbmFsIGltYWdlOicsIGNvbG9yc09yaWcpXHJcblxyXG4gICAgLy8gc2xvdyBpbmRleGVkIGNvbnZlcnNpb24sIGRpcmVjdCBzZWFyY2hcclxuXHJcbiAgICBjb25zdCBzdGFydENvbnYwVGltZSA9IHBlcmZvcm1hbmNlLm5vdygpXHJcbiAgICBjb25zdCBpbmRleGVkID0gdG9QYWxldHRlKHRlc3RJbWFnZSwgcGFsZXR0ZSlcclxuICAgIGNvbnN0IGVuZENvbnYwVGltZSA9IHBlcmZvcm1hbmNlLm5vdygpXHJcblxyXG4gICAgY29uc3QgY29sb3JzSW5kZXhlZCA9IGNvdW50VW5pcXVlQ29sb3JzKGluZGV4ZWQpXHJcblxyXG4gICAgbG9nT25jZShcclxuICAgICAgJ2NvbnYwJyxcclxuICAgICAgJ0NvbnZlcnNpb24gMCB0aW1lOicsIGVuZENvbnYwVGltZSAtIHN0YXJ0Q29udjBUaW1lLFxyXG4gICAgICAnUGl4ZWwgY291bnQ6JywgdGVzdEltYWdlLndpZHRoICogdGVzdEltYWdlLmhlaWdodCxcclxuICAgICAgJ1VuaXF1ZSBjb2xvcnM6JywgY29sb3JzSW5kZXhlZFxyXG4gICAgKVxyXG5cclxuICAgIHJlc2l6ZShcclxuICAgICAgaW5kZXhlZCwgYnVmZmVyLFxyXG4gICAgICBbMCwgMCwgaW5kZXhlZC53aWR0aCwgaW5kZXhlZC5oZWlnaHRdLFxyXG4gICAgICBbcGFsc1dpZHRoICsgbmV3T3JpZ1dpZHRoLCAwLCBuZXdPcmlnV2lkdGgsIG5ld09yaWdIZWlnaHRdXHJcbiAgICApXHJcblxyXG4gICAgLy8gTFVUIGV4cGVyaW1lbnRzXHJcblxyXG4gICAgY29uc3Qgc3RhcnRDb252MVRpbWUgPSBwZXJmb3JtYW5jZS5ub3coKVxyXG4gICAgY29uc3QgaW5kZXhlZEx1dCA9IHRvUGFsZXR0ZUx1dCh0ZXN0SW1hZ2UsIHBhbGV0dGUsIG5haXZlTHV0KVxyXG4gICAgY29uc3QgZW5kQ29udjFUaW1lID0gcGVyZm9ybWFuY2Uubm93KClcclxuXHJcbiAgICBjb25zdCBjb2xvcnNMdXQgPSBjb3VudFVuaXF1ZUNvbG9ycyhpbmRleGVkTHV0KVxyXG5cclxuICAgIGxvZ09uY2UoXHJcbiAgICAgICdjb252MScsXHJcbiAgICAgICdDb252ZXJzaW9uIDEgdGltZTonLCBlbmRDb252MVRpbWUgLSBzdGFydENvbnYxVGltZSxcclxuICAgICAgJ1BpeGVsIGNvdW50OicsIHRlc3RJbWFnZS53aWR0aCAqIHRlc3RJbWFnZS5oZWlnaHQsXHJcbiAgICAgICdVbmlxdWUgY29sb3JzOicsIGNvbG9yc0x1dFxyXG4gICAgKVxyXG5cclxuICAgIHJlc2l6ZShcclxuICAgICAgaW5kZXhlZEx1dCwgYnVmZmVyLFxyXG4gICAgICBbMCwgMCwgaW5kZXhlZEx1dC53aWR0aCwgaW5kZXhlZEx1dC5oZWlnaHRdLFxyXG4gICAgICBbcGFsc1dpZHRoICsgbmV3T3JpZ1dpZHRoICogMiwgMCwgbmV3T3JpZ1dpZHRoLCBuZXdPcmlnSGVpZ2h0XVxyXG4gICAgKVxyXG5cclxuICAgIC8vXHJcblxyXG4gICAgY29uc3Qgc3RhcnRDb252MlRpbWUgPSBwZXJmb3JtYW5jZS5ub3coKVxyXG4gICAgY29uc3QgaW5kZXhlZEx1dDMyID0gdG9QYWxldHRlTHV0MzIodGVzdEltYWdlLCBuYWl2ZUx1dDMyKVxyXG4gICAgY29uc3QgZW5kQ29udjJUaW1lID0gcGVyZm9ybWFuY2Uubm93KClcclxuXHJcbiAgICBjb25zdCBjb2xvcnNMdXQzMiA9IGNvdW50VW5pcXVlQ29sb3JzKGluZGV4ZWRMdXQzMilcclxuXHJcbiAgICBsb2dPbmNlKFxyXG4gICAgICAnY29udjInLFxyXG4gICAgICAnQ29udmVyc2lvbiAyIHRpbWU6JywgZW5kQ29udjJUaW1lIC0gc3RhcnRDb252MlRpbWUsXHJcbiAgICAgICdQaXhlbCBjb3VudDonLCB0ZXN0SW1hZ2Uud2lkdGggKiB0ZXN0SW1hZ2UuaGVpZ2h0LFxyXG4gICAgICAnVW5pcXVlIGNvbG9yczonLCBjb2xvcnNMdXQzMlxyXG4gICAgKVxyXG5cclxuICAgIHJlc2l6ZShcclxuICAgICAgaW5kZXhlZEx1dDMyLCBidWZmZXIsXHJcbiAgICAgIFswLCAwLCBpbmRleGVkTHV0MzIud2lkdGgsIGluZGV4ZWRMdXQzMi5oZWlnaHRdLFxyXG4gICAgICBbcGFsc1dpZHRoICsgbmV3T3JpZ1dpZHRoICogMywgMCwgbmV3T3JpZ1dpZHRoLCBuZXdPcmlnSGVpZ2h0XVxyXG4gICAgKVxyXG4gICAgLy8gXHJcblxyXG4gICAgY29uc3Qgc3RhcnRMdXQyVGltZSA9IHBlcmZvcm1hbmNlLm5vdygpXHJcbiAgICBjb25zdCB7IGNoQ291bnQsIGNoYW5uZWxMb29rdXAsIHRhYmxlIH0gPSBjcmVhdGVOZXdMdXRUaGluZyhwYWxldHRlKVxyXG4gICAgY29uc3QgZW5kTHV0MlRpbWUgPSBwZXJmb3JtYW5jZS5ub3coKVxyXG5cclxuICAgIGxvZ09uY2UoXHJcbiAgICAgICdsdXQyJyxcclxuICAgICAgJ0xVVCAyIHRpbWU6JywgZW5kTHV0MlRpbWUgLSBzdGFydEx1dDJUaW1lLFxyXG4gICAgICAnVGFibGUgc2l6ZTonLCB0YWJsZS5ieXRlTGVuZ3RoXHJcbiAgICApXHJcblxyXG4gICAgY29uc3Qgc3RhcnRDb252M1RpbWUgPSBwZXJmb3JtYW5jZS5ub3coKVxyXG4gICAgY29uc3QgaW5kZXhlZExvb2t1cDIgPSB0b1BhbGV0dGVMb29rdXAzKFxyXG4gICAgICB0ZXN0SW1hZ2UsIG5haXZlMkx1dDMyLFxyXG4gICAgICBjaENvdW50LCBjaGFubmVsTG9va3VwLCB0YWJsZVxyXG4gICAgKVxyXG4gICAgY29uc3QgZW5kQ29udjNUaW1lID0gcGVyZm9ybWFuY2Uubm93KClcclxuXHJcbiAgICBjb25zdCBjb2xvcnNMb29rdXAyID0gY291bnRVbmlxdWVDb2xvcnMoaW5kZXhlZExvb2t1cDIpXHJcblxyXG4gICAgbG9nT25jZShcclxuICAgICAgJ2NvbnYzJyxcclxuICAgICAgJ0NvbnZlcnNpb24gMyB0aW1lOicsIGVuZENvbnYzVGltZSAtIHN0YXJ0Q29udjNUaW1lLFxyXG4gICAgICAnUGl4ZWwgY291bnQ6JywgdGVzdEltYWdlLndpZHRoICogdGVzdEltYWdlLmhlaWdodCxcclxuICAgICAgJ1VuaXF1ZSBjb2xvcnM6JywgY29sb3JzTG9va3VwMlxyXG4gICAgKVxyXG5cclxuICAgIHJlc2l6ZShcclxuICAgICAgaW5kZXhlZExvb2t1cDIsIGJ1ZmZlcixcclxuICAgICAgWzAsIDAsIGluZGV4ZWRMb29rdXAyLndpZHRoLCBpbmRleGVkTG9va3VwMi5oZWlnaHRdLFxyXG4gICAgICBbcGFsc1dpZHRoICsgbmV3T3JpZ1dpZHRoICogNCwgMCwgbmV3T3JpZ1dpZHRoLCBuZXdPcmlnSGVpZ2h0XVxyXG4gICAgKVxyXG4gIH1cclxuXHJcbiAgY29uc3QgcXVpdCA9IGFzeW5jIChfc3RhdGU6IFN0YXRlKSA9PiB7XHJcbiAgICBwYWxldHRlID0gbnVsbFxyXG4gIH1cclxuXHJcbiAgcmV0dXJuIHsgaW5pdCwgdXBkYXRlLCBxdWl0IH1cclxufVxyXG5cclxuY29uc3Qgc2VlbiA9IG5ldyBTZXQ8c3RyaW5nPigpXHJcbmNvbnN0IGxvZ09uY2UgPSAoaWQ6IHN0cmluZywgLi4uYXJnczogYW55W10pID0+IHtcclxuICBpZiAoc2Vlbi5oYXMoaWQpKSByZXR1cm5cclxuICBzZWVuLmFkZChpZClcclxuICBjb25zb2xlLmxvZyguLi5hcmdzKVxyXG59XHJcblxyXG5jb25zdCB0b1BhbGV0dGUgPSAoaW1hZ2U6IEltYWdlRGF0YSwgcGFsZXR0ZTogR2VuZXJhdGVkUGFsZXR0ZSk6IEltYWdlRGF0YSA9PiB7XHJcbiAgY29uc3QgbmV3SW1hZ2UgPSBjcmVhdGVJbWFnZShpbWFnZS53aWR0aCwgaW1hZ2UuaGVpZ2h0KVxyXG5cclxuICAvL1xyXG5cclxuICBmb3IgKGxldCB5ID0gMDsgeSA8IGltYWdlLmhlaWdodDsgeSsrKSB7XHJcbiAgICBjb25zdCByb3cgPSB5ICogaW1hZ2Uud2lkdGhcclxuICAgIGZvciAobGV0IHggPSAwOyB4IDwgaW1hZ2Uud2lkdGg7IHgrKykge1xyXG4gICAgICBjb25zdCBpbmRleCA9IHJvdyArIHhcclxuICAgICAgY29uc3QgZGF0YUluZGV4ID0gaW5kZXggKiA0XHJcblxyXG4gICAgICBjb25zdCBvciA9IGltYWdlLmRhdGFbZGF0YUluZGV4XVxyXG4gICAgICBjb25zdCBvZyA9IGltYWdlLmRhdGFbZGF0YUluZGV4ICsgMV1cclxuICAgICAgY29uc3Qgb2IgPSBpbWFnZS5kYXRhW2RhdGFJbmRleCArIDJdXHJcblxyXG4gICAgICBjb25zdCBwYWxJbmRleCA9IGluZGV4T2ZDbG9zZXN0UmdiKHBhbGV0dGUsIFtvciwgb2csIG9iXSlcclxuXHJcbiAgICAgIGNvbnN0IHByID0gcGFsZXR0ZS5kYXRhW3BhbEluZGV4ICogM11cclxuICAgICAgY29uc3QgcGcgPSBwYWxldHRlLmRhdGFbcGFsSW5kZXggKiAzICsgMV1cclxuICAgICAgY29uc3QgcGIgPSBwYWxldHRlLmRhdGFbcGFsSW5kZXggKiAzICsgMl1cclxuXHJcbiAgICAgIG5ld0ltYWdlLmRhdGFbZGF0YUluZGV4XSA9IHByXHJcbiAgICAgIG5ld0ltYWdlLmRhdGFbZGF0YUluZGV4ICsgMV0gPSBwZ1xyXG4gICAgICBuZXdJbWFnZS5kYXRhW2RhdGFJbmRleCArIDJdID0gcGJcclxuICAgICAgbmV3SW1hZ2UuZGF0YVtkYXRhSW5kZXggKyAzXSA9IDI1NVxyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgLy9cclxuXHJcbiAgcmV0dXJuIG5ld0ltYWdlXHJcbn1cclxuXHJcbmNvbnN0IHRvUGFsZXR0ZUx1dCA9IChcclxuICBpbWFnZTogSW1hZ2VEYXRhLCBwYWxldHRlOiBHZW5lcmF0ZWRQYWxldHRlLCBsdXQ6IFVpbnQ4QXJyYXlcclxuKTogSW1hZ2VEYXRhID0+IHtcclxuICBjb25zdCBuZXdJbWFnZSA9IGNyZWF0ZUltYWdlKGltYWdlLndpZHRoLCBpbWFnZS5oZWlnaHQpXHJcblxyXG4gIC8vXHJcblxyXG4gIGZvciAobGV0IHkgPSAwOyB5IDwgaW1hZ2UuaGVpZ2h0OyB5KyspIHtcclxuICAgIGNvbnN0IHJvdyA9IHkgKiBpbWFnZS53aWR0aFxyXG4gICAgZm9yIChsZXQgeCA9IDA7IHggPCBpbWFnZS53aWR0aDsgeCsrKSB7XHJcbiAgICAgIGNvbnN0IGluZGV4ID0gcm93ICsgeFxyXG4gICAgICBjb25zdCBkYXRhSW5kZXggPSBpbmRleCAqIDRcclxuXHJcbiAgICAgIGNvbnN0IG9yID0gaW1hZ2UuZGF0YVtkYXRhSW5kZXhdXHJcbiAgICAgIGNvbnN0IG9nID0gaW1hZ2UuZGF0YVtkYXRhSW5kZXggKyAxXVxyXG4gICAgICBjb25zdCBvYiA9IGltYWdlLmRhdGFbZGF0YUluZGV4ICsgMl1cclxuXHJcbiAgICAgIGNvbnN0IGx1dEluZGV4ID0gY3JlYXRlQ29sb3IyNChvciwgb2csIG9iKVxyXG4gICAgICBjb25zdCBwYWxJbmRleCA9IGx1dFtsdXRJbmRleF1cclxuXHJcbiAgICAgIGNvbnN0IHByID0gcGFsZXR0ZS5kYXRhW3BhbEluZGV4ICogM11cclxuICAgICAgY29uc3QgcGcgPSBwYWxldHRlLmRhdGFbcGFsSW5kZXggKiAzICsgMV1cclxuICAgICAgY29uc3QgcGIgPSBwYWxldHRlLmRhdGFbcGFsSW5kZXggKiAzICsgMl1cclxuXHJcbiAgICAgIG5ld0ltYWdlLmRhdGFbZGF0YUluZGV4XSA9IHByXHJcbiAgICAgIG5ld0ltYWdlLmRhdGFbZGF0YUluZGV4ICsgMV0gPSBwZ1xyXG4gICAgICBuZXdJbWFnZS5kYXRhW2RhdGFJbmRleCArIDJdID0gcGJcclxuICAgICAgbmV3SW1hZ2UuZGF0YVtkYXRhSW5kZXggKyAzXSA9IDI1NVxyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgLy9cclxuXHJcbiAgcmV0dXJuIG5ld0ltYWdlXHJcbn1cclxuXHJcbmNvbnN0IHRvUGFsZXR0ZUx1dDMyID0gKFxyXG4gIHNyYzogSW1hZ2VEYXRhLCBsdXQ6IFVpbnQzMkFycmF5XHJcbik6IEltYWdlRGF0YSA9PiB7XHJcbiAgY29uc3QgbmV3SW1hZ2UgPSBjcmVhdGVJbWFnZShzcmMud2lkdGgsIHNyYy5oZWlnaHQpXHJcblxyXG4gIGNvbnN0IHNpemUgPSBzcmMud2lkdGggKiBzcmMuaGVpZ2h0XHJcblxyXG4gIGNvbnN0IHNyY1ZpZXcgPSBuZXcgVWludDMyQXJyYXkoc3JjLmRhdGEuYnVmZmVyKVxyXG4gIGNvbnN0IGRlc3RWaWV3ID0gbmV3IFVpbnQzMkFycmF5KG5ld0ltYWdlLmRhdGEuYnVmZmVyKVxyXG5cclxuICAvL1xyXG5cclxuICBmb3IgKGxldCBpID0gMDsgaSA8IHNpemU7IGkrKykge1xyXG4gICAgY29uc3QgcmdiYSA9IHNyY1ZpZXdbaV1cclxuICAgIGNvbnN0IHJnYiA9IHJnYmEgJiAweDAwZmZmZmZmXHJcblxyXG4gICAgZGVzdFZpZXdbaV0gPSBsdXRbcmdiXVxyXG4gIH1cclxuXHJcbiAgLy9cclxuXHJcbiAgcmV0dXJuIG5ld0ltYWdlXHJcbn1cclxuXHJcbi8vIHRoaXMgaXMgdGhlIHdpbm5lciBmb3Igc2V2ZXJhbCByZWFzb25zOlxyXG4vLyBhKSBpdCdzIGJ5IGZhciB0aGUgZmFzdGVzdCBkdWUgdG8gc21hbGwgdGFibGUgc2l6ZSBoZWxwaW5nIHdpdGggY2FjaGUgXHJcbi8vICAgIGxvY2FsaXR5LCBldmVuIHRob3VnaCB0aGUgYXJpdGhtZXRpYyBpcyBtb3JlIGNvbXBsZXggdGhhbiBlZyB0b1BhbGV0dGVMdXQzMlxyXG4vLyBiKSBpdCB1c2VzIHRoZSBsZWFzdCBtZW1vcnksIH42MGtiIGNvbXBhcmVkIHRvIGVnIDE2TUIgb3IgNjRNQiBmb3IgdGhlIG90aGVyXHJcbi8vICAgIGx1dHNcclxuLy8gYykgaXQgcHJvZHVjZXMgc2xpZ2h0bHkgYmV0dGVyIHJlc3VsdHMsIGVnIGxlc3MgaW5mb3JtYXRpb24gaXMgbG9zdCBpbiB0aGUgXHJcbi8vICAgIHJlc3VsdGFudCBvdXRwdXQgaW1hZ2VcclxuY29uc3QgdG9QYWxldHRlTG9va3VwMyA9IChcclxuICBzcmM6IEltYWdlRGF0YSwgY29sb3JzOiBVaW50MzJBcnJheSxcclxuICBjaENvdW50OiBudW1iZXIsIGNoYW5uZWxMb29rdXA6IFVpbnQ4QXJyYXksIHRhYmxlOiBVaW50OEFycmF5XHJcbik6IEltYWdlRGF0YSA9PiB7XHJcbiAgY29uc3QgZGVzdCA9IGNyZWF0ZUltYWdlKHNyYy53aWR0aCwgc3JjLmhlaWdodClcclxuXHJcbiAgY29uc3QgZGVzdFZpZXcgPSBuZXcgVWludDMyQXJyYXkoZGVzdC5kYXRhLmJ1ZmZlcilcclxuXHJcbiAgLy9cclxuXHJcbiAgY29uc3Qgck9mZnNldFNpemUgPSBjaENvdW50ICogY2hDb3VudFxyXG5cclxuICBmb3IgKGxldCB5ID0gMDsgeSA8IHNyYy5oZWlnaHQ7IHkrKykge1xyXG4gICAgY29uc3Qgcm93ID0geSAqIHNyYy53aWR0aFxyXG5cclxuICAgIGZvciAobGV0IHggPSAwOyB4IDwgc3JjLndpZHRoOyB4KyspIHtcclxuICAgICAgY29uc3QgaW5kZXggPSByb3cgKyB4XHJcbiAgICAgIGNvbnN0IGRhdGFJbmRleCA9IGluZGV4ICogNFxyXG5cclxuICAgICAgY29uc3Qgb3IgPSBzcmMuZGF0YVtkYXRhSW5kZXhdXHJcbiAgICAgIGNvbnN0IG9nID0gc3JjLmRhdGFbZGF0YUluZGV4ICsgMV1cclxuICAgICAgY29uc3Qgb2IgPSBzcmMuZGF0YVtkYXRhSW5kZXggKyAyXVxyXG5cclxuICAgICAgY29uc3QgcmkgPSBjaGFubmVsTG9va3VwW29yXVxyXG4gICAgICBjb25zdCBnaSA9IGNoYW5uZWxMb29rdXBbb2ddXHJcbiAgICAgIGNvbnN0IGJpID0gY2hhbm5lbExvb2t1cFtvYl1cclxuXHJcbiAgICAgIGNvbnN0IHJpT2Zmc2V0ID0gcmkgKiByT2Zmc2V0U2l6ZVxyXG4gICAgICBjb25zdCBnaU9mZnNldCA9IGdpICogY2hDb3VudFxyXG4gICAgICBjb25zdCBsb29rdXAgPSBiaSArIGdpT2Zmc2V0ICsgcmlPZmZzZXRcclxuXHJcbiAgICAgIGNvbnN0IGNsb3Nlc3QgPSB0YWJsZVtsb29rdXBdXHJcblxyXG4gICAgICBkZXN0Vmlld1tpbmRleF0gPSBjb2xvcnNbY2xvc2VzdF0gfCAweGZmMDAwMDAwXHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICAvL1xyXG5cclxuICByZXR1cm4gZGVzdFxyXG59XHJcblxyXG4vKlxyXG4gIG9rIG5ldyBzdHJhdGVneVxyXG5cclxuICAxLiBnZW5lcmF0ZSBhIHBhbGV0dGVcclxuICAyLiBmb3IgZXZlcnkgY29sb3IsIGdldCB0aGUgdGhyZWUgY2hhbm5lbHMgYW5kIGFkZCB0aGVpciB2YWx1ZXMgdG8gYSBzZXRcclxuICAzLiBhdCB0aGUgZW5kLCB5b3UgaGF2ZSBhIHNldCBvZiB2YWx1ZXMgZm9yIGV2ZXJ5IHBvc3NpYmxlIGNoYW5uZWwgdmFsdWVcclxuICAgICBlZyBmb3Igb3VyIDEyLzQvNSBodWUgZ2VuZXJhdGVkIHBhbGV0dGUgb2YgMjU1IGNvbG9ycywgdGhlcmUgYXJlIDM4IHVuaXF1ZVxyXG4gICAgIHZhbHVlcyBmb3IgZXZlcnkgY2hhbm5lbFxyXG4gIDQuIGNyZWF0ZSBhIGxvb2t1cCB0YWJsZSB3aXRoIDAuLjI1NSBpbmRpY2VzLCBhbmQgdGhlIG5lYXJlc3QgbWF0Y2ggZnJvbSBvdXJcclxuICAgICBzZXRcclxuICA1LiBleHBlcmltZW50IC0gb25lIHdlIHJlY29uc3RydWN0IGEgY29sb3IgZnJvbSBhbiB1bmluZGV4ZWQgaW1hZ2UsIGlzIGV2ZXJ5XHJcbiAgICAgdmFsdWUgcHJlc2VudCBpbiBvdXIgcGFsZXR0ZT9cclxuXHJcbiAgSW4gb3VyIGV4YW1wbGUgd2l0aCAzOCB1bmlxdWUgdmFsdWVzLCB0aGVyZSBhcmUgMzgqKjMgKDU0LDg3MikgcG9zc2libGUgXHJcbiAgY29sb3JzLCBhIGxvdCBsZXNzIHRoYW4gb3VyIDE2IG1pbGxpb24gY29sb3JzcGFjZSAgIFxyXG5cclxuICBGaXJzdCwgY29udmVydCByYXcgciwgZywgYiBpbnRvIHJhbmdlIDAuLjM3IG1hdGNoaW5nIHRvIGluZGV4IG9mIGNsb3Nlc3QgdmFsdWUgXHJcbiAgaW4gdGhlIHNldFxyXG5cclxuICBTbyB5b3UgY2FuIG1ha2UgYSBsb29rdXAgdGFibGUgd2hpY2ggaXMgYSBVaW50OEFycmF5IG9mIDM4KiozIGVudHJpZXNcclxuXHJcbiAgWW91IGNhbiBpbmRleCBpbnRvIGl0IGJ5OlxyXG5cclxuICByIFswLi4zN11cclxuICBnIFswLi4zN11cclxuICBiIFswLi4zN11cclxuXHJcbiAgY29uc3QgaW5kZXggPSAoIHIgKiAzOCAqIDM4ICkgKyAoIGcgKiAzOCApICsgYlxyXG5cclxuICB3aXRoIGVhY2ggaW5kZXggcG9pbnRpbmcgdG8gYSBwYWxldHRlIGluZGV4XHJcbiovXHJcblxyXG5jb25zdCBuZWFyZXN0TWF0Y2ggPSAodmFsdWVzOiBudW1iZXJbXSwgdmFsdWU6IG51bWJlcikgPT4ge1xyXG4gIGxldCBjbG9zZXN0ID0gdmFsdWVzWzBdXHJcbiAgbGV0IGNsb3Nlc3REaXN0ID0gTWF0aC5hYnModmFsdWUgLSBjbG9zZXN0KVxyXG5cclxuICBmb3IgKGxldCBpID0gMTsgaSA8IHZhbHVlcy5sZW5ndGg7IGkrKykge1xyXG4gICAgY29uc3QgZGlzdCA9IE1hdGguYWJzKHZhbHVlIC0gdmFsdWVzW2ldKVxyXG5cclxuICAgIGlmIChkaXN0IDwgY2xvc2VzdERpc3QpIHtcclxuICAgICAgY2xvc2VzdCA9IHZhbHVlc1tpXVxyXG4gICAgICBjbG9zZXN0RGlzdCA9IGRpc3RcclxuICAgIH1cclxuICB9XHJcblxyXG4gIHJldHVybiBjbG9zZXN0XHJcbn1cclxuXHJcbmNvbnN0IGNyZWF0ZU5ld0x1dFRoaW5nID0gKHBhbGV0dGU6IEdlbmVyYXRlZFBhbGV0dGUpID0+IHtcclxuICBjb25zdCBjaGFubmVsU2V0ID0gbmV3IFNldDxudW1iZXI+KClcclxuXHJcbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBwYWxldHRlLmVudHJ5Q291bnQ7IGkrKykge1xyXG4gICAgY2hhbm5lbFNldC5hZGQocGFsZXR0ZS5kYXRhW2kgKiAzXSlcclxuICAgIGNoYW5uZWxTZXQuYWRkKHBhbGV0dGUuZGF0YVtpICogMyArIDFdKVxyXG4gICAgY2hhbm5lbFNldC5hZGQocGFsZXR0ZS5kYXRhW2kgKiAzICsgMl0pXHJcbiAgfVxyXG5cclxuICBjb25zdCB2YWx1ZXMgPSBBcnJheS5mcm9tKGNoYW5uZWxTZXQpLnNvcnQoKGEsIGIpID0+IGEgLSBiKVxyXG5cclxuICBjb25zdCBjaENvdW50ID0gdmFsdWVzLmxlbmd0aFxyXG5cclxuICBjb25zdCBjaGFubmVsTG9va3VwID0gbmV3IFVpbnQ4QXJyYXkoMjU2KVxyXG5cclxuICBmb3IgKGxldCBpID0gMDsgaSA8IDI1NjsgaSsrKSB7XHJcbiAgICBjb25zdCBjbG9zZXN0ID0gbmVhcmVzdE1hdGNoKHZhbHVlcywgaSlcclxuXHJcbiAgICBjaGFubmVsTG9va3VwW2ldID0gdmFsdWVzLmluZGV4T2YoY2xvc2VzdClcclxuICB9XHJcblxyXG4gIGNvbnN0IHRhYmxlU2l6ZSA9IGNoQ291bnQgKiogM1xyXG5cclxuICBjb25zdCB0YWJsZSA9IG5ldyBVaW50OEFycmF5KHRhYmxlU2l6ZSlcclxuXHJcbiAgY29uc3QgclNpemUgPSBjaENvdW50ICogY2hDb3VudFxyXG5cclxuICBmb3IgKGxldCByaSA9IDA7IHJpIDwgY2hDb3VudDsgcmkrKykge1xyXG4gICAgY29uc3QgcmlPZmZzZXQgPSByaSAqIHJTaXplXHJcbiAgICBmb3IgKGxldCBnaSA9IDA7IGdpIDwgY2hDb3VudDsgZ2krKykge1xyXG4gICAgICBjb25zdCBnaU9mZnNldCA9IGdpICogY2hDb3VudCArIHJpT2Zmc2V0XHJcbiAgICAgIGZvciAobGV0IGJpID0gMDsgYmkgPCBjaENvdW50OyBiaSsrKSB7XHJcbiAgICAgICAgY29uc3QgaW5kZXggPSBiaSArIGdpT2Zmc2V0XHJcblxyXG4gICAgICAgIGNvbnN0IHIgPSB2YWx1ZXNbcmldXHJcbiAgICAgICAgY29uc3QgZyA9IHZhbHVlc1tnaV1cclxuICAgICAgICBjb25zdCBiID0gdmFsdWVzW2JpXVxyXG5cclxuICAgICAgICBjb25zdCBjbG9zZXN0ID0gaW5kZXhPZkNsb3Nlc3RSZ2IocGFsZXR0ZSwgW3IsIGcsIGJdKVxyXG5cclxuICAgICAgICB0YWJsZVtpbmRleF0gPSBjbG9zZXN0XHJcbiAgICAgIH1cclxuICAgIH1cclxuICB9XHJcblxyXG4gIHJldHVybiB7IGNoQ291bnQsIGNoYW5uZWxMb29rdXAsIHRhYmxlIH1cclxufVxyXG5cclxuY29uc3QgY291bnRVbmlxdWVDb2xvcnMgPSAoaW1hZ2U6IEltYWdlRGF0YSk6IG51bWJlciA9PiB7XHJcbiAgY29uc3Qgc2V0ID0gbmV3IFNldDxudW1iZXI+KClcclxuXHJcbiAgY29uc3QgaW1hZ2VWaWV3ID0gbmV3IFVpbnQzMkFycmF5KGltYWdlLmRhdGEuYnVmZmVyKVxyXG5cclxuICBmb3IgKGxldCBpID0gMDsgaSA8IGltYWdlVmlldy5sZW5ndGg7IGkrKykge1xyXG4gICAgc2V0LmFkZChpbWFnZVZpZXdbaV0pXHJcbiAgfVxyXG5cclxuICByZXR1cm4gc2V0LnNpemVcclxufVxyXG4iXX0=