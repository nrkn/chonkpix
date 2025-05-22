import { colorToRgb, createColor, createColor24 } from '../../lib/image/color.js';
import { createImage } from '../../lib/image/create.js';
import { fill } from '../../lib/image/fill.js';
import { loadImage } from '../../lib/image/load.js';
import { resize } from '../../lib/image/resize.js';
import { maybe, wait } from '../../lib/util.js';
import { generatePalette, indexOfClosestRgb } from '../../sandbox/generate-palette.js';
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicGFsZXR0ZS1zY2VuZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uL3NyYy9zY2VuZXMvc2FuZGJveC9wYWxldHRlLXNjZW5lLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLE9BQU8sRUFBRSxVQUFVLEVBQUUsV0FBVyxFQUFFLGFBQWEsRUFBRSxNQUFNLDBCQUEwQixDQUFBO0FBQ2pGLE9BQU8sRUFBRSxXQUFXLEVBQUUsTUFBTSwyQkFBMkIsQ0FBQTtBQUN2RCxPQUFPLEVBQUUsSUFBSSxFQUFFLE1BQU0seUJBQXlCLENBQUE7QUFDOUMsT0FBTyxFQUFFLFNBQVMsRUFBRSxNQUFNLHlCQUF5QixDQUFBO0FBQ25ELE9BQU8sRUFBRSxNQUFNLEVBQUUsTUFBTSwyQkFBMkIsQ0FBQTtBQUVsRCxPQUFPLEVBQUUsS0FBSyxFQUFFLElBQUksRUFBRSxNQUFNLG1CQUFtQixDQUFBO0FBRS9DLE9BQU8sRUFDYSxlQUFlLEVBQ2pDLGlCQUFpQixFQUNsQixNQUFNLG1DQUFtQyxDQUFBO0FBRTFDLHFDQUFxQztBQUNyQyxNQUFNLENBQUMsTUFBTSxtQkFBbUIsR0FBRyxHQUFVLEVBQUU7SUFDN0MsSUFBSSxPQUFPLEdBQTRCLElBQUksQ0FBQTtJQUMzQyxJQUFJLFNBQVMsR0FBcUIsSUFBSSxDQUFBO0lBRXRDLDJFQUEyRTtJQUMzRSx3RUFBd0U7SUFDeEUsY0FBYztJQUNkLEVBQUU7SUFDRixRQUFRO0lBQ1IsSUFBSSxRQUFRLEdBQXNCLElBQUksQ0FBQTtJQUN0QyxRQUFRO0lBQ1IsSUFBSSxVQUFVLEdBQXVCLElBQUksQ0FBQTtJQUV6QyxrQkFBa0I7SUFDbEIsWUFBWTtJQUNaLElBQUksU0FBUyxHQUFzQixJQUFJLENBQUE7SUFDdkMsSUFBSSxJQUFJLEdBQXVCLElBQUksQ0FBQTtJQUNuQyxJQUFJLFdBQVcsR0FBdUIsSUFBSSxDQUFBO0lBRTFDLE1BQU0sY0FBYyxHQUFHLENBQ3JCLEdBQXFCLEVBQUUsQ0FBUyxF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QUFFLEVBQUUsR0FBRyxPQUFPLEVBQUUsRUFBRSxFQUFFLEVBQUUsQ0FBQztnQkFDcEMsTUFBTSxLQUFLLEdBQUcsRUFBRSxHQUFHLFFBQVEsQ0FBQTtnQkFFM0IsTUFBTSxDQUFDLEdBQUcsTUFBTSxDQUFDLEVBQUUsQ0FBQyxDQUFBO2dCQUNwQixNQUFNLENBQUMsR0FBRyxNQUFNLENBQUMsRUFBRSxDQUFDLENBQUE7Z0JBQ3BCLE1BQU0sQ0FBQyxHQUFHLE1BQU0sQ0FBQyxFQUFFLENBQUMsQ0FBQTtnQkFFcEIsTUFBTSxPQUFPLEdBQUcsaUJBQWlCLENBQUMsT0FBTyxFQUFFLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFBO2dCQUVyRCxLQUFLLENBQUMsS0FBSyxDQUFDLEdBQUcsT0FBTyxDQUFBO1lBQ3hCLENBQUM7UUFDSCxDQUFDO0lBQ0gsQ0FBQztJQUVELE9BQU8sRUFBRSxPQUFPLEVBQUUsYUFBYSxFQUFFLEtBQUssRUFBRSxDQUFBO0FBQzFDLENBQUMsQ0FBQTtBQUVELE1BQU0saUJBQWlCLEdBQUcsQ0FBQyxLQUFnQixFQUFVLEVBQUU7SUFDckQsTUFBTSxHQUFHLEdBQUcsSUFBSSxHQUFHLEVBQVUsQ0FBQTtJQUU3QixNQUFNLFNBQVMsR0FBRyxJQUFJLFdBQVcsQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFBO0lBRXBELEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxTQUFTLENBQUMsTUFBTSxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUM7UUFDMUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQTtJQUN2QixDQUFDO0lBRUQsT0FBTyxHQUFHLENBQUMsSUFBSSxDQUFBO0FBQ2pCLENBQUMsQ0FBQSIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IGNvbG9yVG9SZ2IsIGNyZWF0ZUNvbG9yLCBjcmVhdGVDb2xvcjI0IH0gZnJvbSAnLi4vLi4vbGliL2ltYWdlL2NvbG9yLmpzJ1xuaW1wb3J0IHsgY3JlYXRlSW1hZ2UgfSBmcm9tICcuLi8uLi9saWIvaW1hZ2UvY3JlYXRlLmpzJ1xuaW1wb3J0IHsgZmlsbCB9IGZyb20gJy4uLy4uL2xpYi9pbWFnZS9maWxsLmpzJ1xuaW1wb3J0IHsgbG9hZEltYWdlIH0gZnJvbSAnLi4vLi4vbGliL2ltYWdlL2xvYWQuanMnXG5pbXBvcnQgeyByZXNpemUgfSBmcm9tICcuLi8uLi9saWIvaW1hZ2UvcmVzaXplLmpzJ1xuaW1wb3J0IHsgTWF5YmUsIFNjZW5lLCBTdGF0ZSwgVDIgfSBmcm9tICcuLi8uLi9saWIvdHlwZXMuanMnXG5pbXBvcnQgeyBtYXliZSwgd2FpdCB9IGZyb20gJy4uLy4uL2xpYi91dGlsLmpzJ1xuXG5pbXBvcnQge1xuICBHZW5lcmF0ZWRQYWxldHRlLCBnZW5lcmF0ZVBhbGV0dGUsXG4gIGluZGV4T2ZDbG9zZXN0UmdiXG59IGZyb20gJy4uLy4uL3NhbmRib3gvZ2VuZXJhdGUtcGFsZXR0ZS5qcydcblxuLy8gZXhwZXJpbWVudGluZyB3aXRoIGluZGV4ZWQgcGFsZXR0ZVxuZXhwb3J0IGNvbnN0IHBhbGV0dGVTYW5kYm94U2NlbmUgPSAoKTogU2NlbmUgPT4ge1xuICBsZXQgcGFsZXR0ZTogTWF5YmU8R2VuZXJhdGVkUGFsZXR0ZT4gPSBudWxsXG4gIGxldCB0ZXN0SW1hZ2U6IE1heWJlPEltYWdlRGF0YT4gPSBudWxsXG5cbiAgLy8gdGhlc2UgbmFpdmUgbHV0cyBhcmUgc2xvdyB0byBnZW5lcmF0ZSBhbmQgdGFrZSBhIGxvdCBvZiBtZW1vcnksIGJ1dCB0aGV5XG4gIC8vIHNlcnZlIGFzIGEgZ29vZCByZWZlcmVuY2UgaW1wbGVtZW50YXRpb24gYW5kIGJhc2VsaW5lIGZvciBwZXJmb3JtYW5jZVxuICAvLyBjb21wYXJpc29uc1xuICAvL1xuICAvLyAxNm1iIVxuICBsZXQgbmFpdmVMdXQ6IE1heWJlPFVpbnQ4QXJyYXk+ID0gbnVsbFxuICAvLyA2NG1iIVxuICBsZXQgbmFpdmVMdXQzMjogTWF5YmU8VWludDMyQXJyYXk+ID0gbnVsbFxuXG4gIC8vIHRlc3RpbmcgYW4gaWRlYVxuICAvLyBhbHNvIDE2bWJcbiAgbGV0IG5haXZlTHV0MjogTWF5YmU8VWludDhBcnJheT4gPSBudWxsXG4gIGxldCBwYWwyOiBNYXliZTxVaW50MzJBcnJheT4gPSBudWxsXG4gIGxldCBuYWl2ZTJMdXQzMjogTWF5YmU8VWludDMyQXJyYXk+ID0gbnVsbFxuXG4gIGNvbnN0IGNyZWF0ZVBhbEltYWdlID0gKFxuICAgIHBhbDogR2VuZXJhdGVkUGFsZXR0ZSwgdzogbnVtYmVyLCBoOiBudW1iZXJcbiAgKSA9PiB7XG4gICAgY29uc3QgcGFsSW1hZ2UgPSBjcmVhdGVJbWFnZSh3LCBoKVxuXG4gICAgZmlsbChwYWxJbWFnZSwgY3JlYXRlQ29sb3IoMHgwMCwgMHhmZiwgMHhmZikpXG5cbiAgICBmb3IgKGxldCB5ID0gMDsgeSA8IGg7IHkrKykge1xuICAgICAgY29uc3Qgcm93ID0geSAqIHdcbiAgICAgIGZvciAobGV0IHggPSAwOyB4IDwgdzsgeCsrKSB7XG4gICAgICAgIGNvbnN0IGluZGV4ID0gcm93ICsgeFxuICAgICAgICBjb25zdCBwYWxJbmRleCA9IGluZGV4ICogM1xuXG4gICAgICAgIGlmIChwYWxJbmRleCA+PSBwYWwuZGF0YS5sZW5ndGgpIHtcbiAgICAgICAgICBicmVha1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgciA9IHBhbC5kYXRhW3BhbEluZGV4XVxuICAgICAgICBjb25zdCBnID0gcGFsLmRhdGFbcGFsSW5kZXggKyAxXVxuICAgICAgICBjb25zdCBiID0gcGFsLmRhdGFbcGFsSW5kZXggKyAyXVxuXG4gICAgICAgIGNvbnN0IGltZ0luZGV4ID0gaW5kZXggKiA0XG5cbiAgICAgICAgcGFsSW1hZ2UuZGF0YVtpbWdJbmRleF0gPSByXG4gICAgICAgIHBhbEltYWdlLmRhdGFbaW1nSW5kZXggKyAxXSA9IGdcbiAgICAgICAgcGFsSW1hZ2UuZGF0YVtpbWdJbmRleCArIDJdID0gYlxuICAgICAgICBwYWxJbWFnZS5kYXRhW2ltZ0luZGV4ICsgM10gPSAyNTVcbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gcGFsSW1hZ2VcbiAgfVxuXG4gIGNvbnN0IGNyZWF0ZVBhbDJJbWFnZSA9IChcbiAgICBwYWw6IFVpbnQzMkFycmF5LCB3OiBudW1iZXIsIGg6IG51bWJlclxuICApID0+IHtcbiAgICBpZiAocGFsLmxlbmd0aCA+IHcgKiBoKSB7XG4gICAgICB0aHJvdyBFcnJvcignUGFsZXR0ZSBpcyB0b28gbGFyZ2UgZm9yIGltYWdlJylcbiAgICB9XG4gICAgY29uc3QgcGFsSW1hZ2UgPSBjcmVhdGVJbWFnZSh3LCBoKVxuXG4gICAgZmlsbChwYWxJbWFnZSwgY3JlYXRlQ29sb3IoMHgwMCwgMHhmZiwgMHhmZikpXG5cbiAgICBwYWwgPSBwYWwubWFwKGNvbG9yID0+IGNvbG9yIHwgMHhmZjAwMDAwMClcblxuICAgIGNvbnN0IHZpZXcgPSBuZXcgVWludDMyQXJyYXkocGFsSW1hZ2UuZGF0YS5idWZmZXIpXG5cbiAgICB2aWV3LnNldChwYWwpXG5cbiAgICByZXR1cm4gcGFsSW1hZ2VcbiAgfVxuXG4gIGNvbnN0IGluaXQgPSBhc3luYyAoc3RhdGU6IFN0YXRlKSA9PiB7XG4gICAgY29uc3QgYnVmZmVyID0gc3RhdGUudmlldy5nZXRCdWZmZXIoKVxuXG4gICAgZmlsbChidWZmZXIsIGNyZWF0ZUNvbG9yKDB4MDAsIDB4MDAsIDB4MDApKVxuXG4gICAgY29uc29sZS5sb2coJ3N0YXJ0aW5nIGluaXQnKVxuXG4gICAgY29uc3QgeyB3aWR0aCwgaGVpZ2h0IH0gPSBidWZmZXJcblxuICAgIGNvbnN0IHByb2dyZXNzQmFyV2lkdGggPSBNYXRoLmZsb29yKHdpZHRoICogMC44KVxuICAgIGNvbnN0IHByb2dyZXNzQmFyWCA9IE1hdGguZmxvb3Iod2lkdGggKiAwLjEpXG4gICAgY29uc3QgcHJvZ3Jlc3NCYXJZID0gTWF0aC5mbG9vcihoZWlnaHQgKiAwLjUpXG4gICAgY29uc3QgcHJvZ3Jlc3NCYXJIZWlnaHQgPSAyXG5cbiAgICBjb25zdCBwcm9ncmVzcyA9ICh0b3RhbDogbnVtYmVyKSA9PiB7XG4gICAgICBjb25zdCBzdGVwID0gcHJvZ3Jlc3NCYXJXaWR0aCAvIHRvdGFsXG5cbiAgICAgIHJldHVybiBhc3luYyAoaTogbnVtYmVyKSA9PiB7XG4gICAgICAgIGZpbGwoXG4gICAgICAgICAgYnVmZmVyLFxuICAgICAgICAgIGNyZWF0ZUNvbG9yKDB4NjYsIDB4NjYsIDB4NjYpLFxuICAgICAgICAgIFtwcm9ncmVzc0JhclgsIHByb2dyZXNzQmFyWSwgcHJvZ3Jlc3NCYXJXaWR0aCwgcHJvZ3Jlc3NCYXJIZWlnaHRdXG4gICAgICAgIClcblxuICAgICAgICBjb25zdCB3aWR0aCA9IE1hdGgucm91bmQoc3RlcCAqIGkpXG5cbiAgICAgICAgZmlsbChcbiAgICAgICAgICBidWZmZXIsXG4gICAgICAgICAgY3JlYXRlQ29sb3IoMHgzMywgMHg5OSwgMHhmZiksXG4gICAgICAgICAgW3Byb2dyZXNzQmFyWCwgcHJvZ3Jlc3NCYXJZLCB3aWR0aCwgcHJvZ3Jlc3NCYXJIZWlnaHRdXG4gICAgICAgIClcblxuICAgICAgICBhd2FpdCB3YWl0KClcbiAgICAgIH1cbiAgICB9XG5cbiAgICAvLyByZXNlcnZlIG9uZSBjb2xvciBmb3IgZWcgdHJhbnNwYXJlbnRcbiAgICBwYWxldHRlID0gZ2VuZXJhdGVQYWxldHRlKDI1NSwgMTIsIDQsIDUpXG5cbiAgICAvLyBqdXN0IGxvZyB0aGUgbWV0YWRhdGFcbiAgICBjb25zdCBub0VudHJpZXMgPSB7XG4gICAgICAuLi5wYWxldHRlLFxuICAgICAgZGF0YTogdW5kZWZpbmVkXG4gICAgfVxuXG4gICAgY29uc29sZS5sb2cobm9FbnRyaWVzKVxuXG4gICAgdGVzdEltYWdlID0gYXdhaXQgbG9hZEltYWdlKCdzY2VuZXMvcGFsL2NvbG9ycy5wbmcnKVxuXG4gICAgY29uc3QgcGFsQ29sb3JzOiBUMltdID0gW11cblxuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgcGFsZXR0ZS5lbnRyeUNvdW50OyBpKyspIHtcbiAgICAgIGNvbnN0IHIgPSBwYWxldHRlLmRhdGFbaSAqIDNdXG4gICAgICBjb25zdCBnID0gcGFsZXR0ZS5kYXRhW2kgKiAzICsgMV1cbiAgICAgIGNvbnN0IGIgPSBwYWxldHRlLmRhdGFbaSAqIDMgKyAyXVxuXG4gICAgICBjb25zdCBjb2xvcjI0ID0gY3JlYXRlQ29sb3IyNChyLCBnLCBiKVxuXG4gICAgICBwYWxDb2xvcnMucHVzaChbY29sb3IyNCwgaV0pXG4gICAgfVxuXG4gICAgcGFsQ29sb3JzLnNvcnQoKGEsIGIpID0+IGFbMF0gLSBiWzBdKVxuXG4gICAgY29uc29sZS5sb2coJ3BhbENvbG9ycycsIHBhbENvbG9ycylcblxuICAgIGNvbnN0IHBhbE1hcE5ld1RvT2xkID0gQXJyYXk8bnVtYmVyPihwYWxldHRlLmVudHJ5Q291bnQpXG4gICAgY29uc3QgcGFsTWFwT2xkVG9OZXcgPSBBcnJheTxudW1iZXI+KHBhbGV0dGUuZW50cnlDb3VudClcblxuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgcGFsQ29sb3JzLmxlbmd0aDsgaSsrKSB7XG4gICAgICBjb25zdCBvbGRJbmRleCA9IHBhbENvbG9yc1tpXVsxXVxuXG4gICAgICBwYWxNYXBOZXdUb09sZFtpXSA9IG9sZEluZGV4XG4gICAgICBwYWxNYXBPbGRUb05ld1tvbGRJbmRleF0gPSBpXG4gICAgfVxuXG4gICAgcGFsMiA9IG5ldyBVaW50MzJBcnJheShwYWxldHRlLmVudHJ5Q291bnQpXG5cbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHBhbGV0dGUuZW50cnlDb3VudDsgaSsrKSB7XG4gICAgICBwYWwyW2ldID0gcGFsQ29sb3JzW2ldWzBdXG4gICAgfVxuXG4gICAgY29uc29sZS5sb2coJ3BhbDInLCBwYWwyKVxuXG4gICAgbmFpdmUyTHV0MzIgPSBuZXcgVWludDMyQXJyYXkocGFsZXR0ZS5lbnRyeUNvdW50KVxuXG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBwYWxldHRlLmVudHJ5Q291bnQ7IGkrKykge1xuICAgICAgY29uc3QgciA9IHBhbGV0dGUuZGF0YVtpICogM11cbiAgICAgIGNvbnN0IGcgPSBwYWxldHRlLmRhdGFbaSAqIDMgKyAxXVxuICAgICAgY29uc3QgYiA9IHBhbGV0dGUuZGF0YVtpICogMyArIDJdXG5cbiAgICAgIGNvbnN0IGNvbG9yID0gY3JlYXRlQ29sb3IociwgZywgYilcblxuICAgICAgbmFpdmUyTHV0MzJbaV0gPSBjb2xvclxuICAgIH1cblxuICAgIC8vIFxuXG4gICAgY29uc3QgbnVtQ29sb3JzMjQgPSAweGZmZmZmZlxuXG4gICAgY29uc3QgclZhbHVlcyA9IG5ldyBTZXQ8bnVtYmVyPigpXG4gICAgY29uc3QgZ1ZhbHVlcyA9IG5ldyBTZXQ8bnVtYmVyPigpXG4gICAgY29uc3QgYlZhbHVlcyA9IG5ldyBTZXQ8bnVtYmVyPigpXG4gICAgY29uc3QgY1ZhbHVlcyA9IG5ldyBTZXQ8bnVtYmVyPigpXG5cbiAgICBjb25zdCBzdGVwQ291bnQgPSAxMFxuXG4gICAgY29uc3QgcCA9IHByb2dyZXNzKHN0ZXBDb3VudClcblxuICAgIGNvbnNvbGUubG9nKCdnZW5lcmF0ZWQgcGFsZXR0ZSBsb29rdXBzJylcblxuICAgIGF3YWl0IHAoMClcblxuICAgIGNvbnN0IHBzdGVwID0gbnVtQ29sb3JzMjQgLyBzdGVwQ291bnRcbiAgICBsZXQgY3N0ZXAgPSBwc3RlcFxuICAgIGxldCBwdmFsID0gMFxuXG4gICAgY29uc3Qgbmx1dFN0YXJ0ID0gcGVyZm9ybWFuY2Uubm93KClcbiAgICBuYWl2ZUx1dCA9IG5ldyBVaW50OEFycmF5KG51bUNvbG9yczI0KVxuICAgIG5haXZlTHV0MzIgPSBuZXcgVWludDMyQXJyYXkobnVtQ29sb3JzMjQpXG5cbiAgICBuYWl2ZUx1dDIgPSBuZXcgVWludDhBcnJheShudW1Db2xvcnMyNClcblxuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgMHhmZmZmZmY7IGkrKykge1xuICAgICAgY29uc3QgW3IsIGcsIGJdID0gY29sb3JUb1JnYihpKVxuICAgICAgY29uc3QgaW5kZXggPSBpbmRleE9mQ2xvc2VzdFJnYihwYWxldHRlLCBbciwgZywgYl0pXG4gICAgICBuYWl2ZUx1dFtpXSA9IGluZGV4XG4gICAgICBuYWl2ZUx1dDJbaV0gPSBwYWxNYXBPbGRUb05ld1tpbmRleF1cblxuICAgICAgY29uc3QgcGFsUiA9IHBhbGV0dGUuZGF0YVtpbmRleCAqIDNdXG4gICAgICBjb25zdCBwYWxHID0gcGFsZXR0ZS5kYXRhW2luZGV4ICogMyArIDFdXG4gICAgICBjb25zdCBwYWxCID0gcGFsZXR0ZS5kYXRhW2luZGV4ICogMyArIDJdXG5cbiAgICAgIHJWYWx1ZXMuYWRkKHBhbFIpXG4gICAgICBnVmFsdWVzLmFkZChwYWxHKVxuICAgICAgYlZhbHVlcy5hZGQocGFsQilcblxuICAgICAgY1ZhbHVlcy5hZGQocGFsUilcbiAgICAgIGNWYWx1ZXMuYWRkKHBhbEcpXG4gICAgICBjVmFsdWVzLmFkZChwYWxCKVxuXG4gICAgICBjb25zdCBjb2xvciA9IGNyZWF0ZUNvbG9yKHBhbFIsIHBhbEcsIHBhbEIpXG5cbiAgICAgIG5haXZlTHV0MzJbaV0gPSBjb2xvclxuXG4gICAgICBpZiAoaSA+PSBjc3RlcCkge1xuICAgICAgICBjc3RlcCArPSBwc3RlcFxuICAgICAgICBwdmFsKytcbiAgICAgICAgYXdhaXQgcChwdmFsKVxuICAgICAgfVxuICAgIH1cblxuICAgIGNvbnN0IG5sdXRFbmQgPSBwZXJmb3JtYW5jZS5ub3coKVxuXG4gICAgY29uc29sZS5sb2coJ05haXZlIExVVHMgVGltZTonLCBubHV0RW5kIC0gbmx1dFN0YXJ0KVxuXG4gICAgY29uc29sZS5sb2coJ05haXZlIExVVCcsIG5haXZlTHV0KVxuICAgIGNvbnNvbGUubG9nKCdOYWl2ZSBMVVQgMicsIG5haXZlTHV0MilcblxuICAgIC8vXG5cbiAgICBjb25zdCByQXJyID0gQXJyYXkuZnJvbShyVmFsdWVzKVxuICAgIGNvbnN0IGdBcnIgPSBBcnJheS5mcm9tKGdWYWx1ZXMpXG4gICAgY29uc3QgYkFyciA9IEFycmF5LmZyb20oYlZhbHVlcylcbiAgICBjb25zdCBjQXJyID0gQXJyYXkuZnJvbShjVmFsdWVzKVxuXG4gICAgckFyci5zb3J0KChhLCBiKSA9PiBhIC0gYilcbiAgICBnQXJyLnNvcnQoKGEsIGIpID0+IGEgLSBiKVxuICAgIGJBcnIuc29ydCgoYSwgYikgPT4gYSAtIGIpXG4gICAgY0Fyci5zb3J0KChhLCBiKSA9PiBhIC0gYilcblxuICAgIGNvbnNvbGUubG9nKCdyQXJyJywgckFycilcbiAgICBjb25zb2xlLmxvZygnZ0FycicsIGdBcnIpXG4gICAgY29uc29sZS5sb2coJ2JBcnInLCBiQXJyKVxuICAgIGNvbnNvbGUubG9nKCdjQXJyJywgY0FycilcblxuICAgIC8vXG5cbiAgICAvLyBuYWl2ZUx1dCBpcyBhIG1hcHBpbmcgd2hlcmUgdGhlIGluZGV4IGlzIHRoZSAyNCBiaXQgcmdiIHZhbHVlIGFuZCB0aGVcbiAgICAvLyB2YWx1ZSBpcyB0aGUgaW5kZXggb2YgdGhlIGNsb3Nlc3QgY29sb3IgaW4gdGhlIHBhbGV0dGVcbiAgICAvL1xuICAgIC8vIGNvbnNlY3V0aXZlIDI0IGJpdCBpbmRpY2VzIGFsbCBwb2ludCB0byB0aGUgc2FtZSBwYWxldHRlIGluZGV4IGluIHJ1bnNcbiAgICAvLyB3ZSBjb3VsZCBjb21wcmVzcyB0aGUgc3RydWN0dXJlIGxpa2Ugc286XG4gICAgLy8gXG4gICAgLy8gd2UgdXNlIGEgVWludDMyQXJyYXkgdG8gc3RvcmUgdHdvIGZpZWxkczpcbiAgICAvLyAxLiB0aGUgMjQgYml0IHZhbHVlIHRoYXQgaXMgdGhlICplbmQqIG9mIHRoZSByb3cgb2YgY29uc2VjdXRpdmUgaW5kaWNlc1xuICAgIC8vIDIuIHRoZSA4IGJpdCBwYWxldHRlIGluZGV4XG4gICAgLy9cbiAgICAvLyB0aGVuLCB0byBtYXAgcmdiIHRvIGluZGV4LCB5b3Ugc2VhcmNoIHRocm91Z2ggZWFjaCBmaWVsZCB0byBmaW5kIHRoZSBcbiAgICAvLyBmaXJzdCBlbmQgb2Ygcm93IHdoaWNoIGlzIGdyZWF0ZXIgdGhhbiBvciBlcXVhbCB0byB0aGUgcmdiIHZhbHVlXG4gICAgLy8gYW5kIHJldHVybiB0aGUgcGFsZXR0ZSBpbmRleFxuICAgIC8vIGl0IHdpbGwgYmUgYSBiaXQgc2xvd2VyIHRoYW4gZWcgbmFpdmVMdXQzMiB3aGljaCBpcyB0aGUgZmFzdGVzdCwgYnV0IFxuICAgIC8vIHRoYXQgc3RydWN0dXJlIGlzIH42NG1iXG5cbiAgICBsZXQgcHJldiA9IC0xXG4gICAgbGV0IHJvd0NvdW50ID0gMFxuXG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBudW1Db2xvcnMyNDsgaSsrKSB7XG4gICAgICBjb25zdCB2YWx1ZSA9IG5haXZlTHV0W2ldXG5cbiAgICAgIGlmICh2YWx1ZSAhPT0gcHJldikge1xuICAgICAgICByb3dDb3VudCsrXG4gICAgICB9XG5cbiAgICAgIHByZXYgPSB2YWx1ZVxuICAgIH1cblxuICAgIC8vIGl0IHdpbGwgaGF2ZSByb3dDb3VudCByb3dzXG5cbiAgICBjb25zb2xlLmxvZygncm93Y291bnQ6Jywgcm93Q291bnQsICdieXRlczonLCByb3dDb3VudCAqIDQpXG5cbiAgICAvL1xuXG4gICAgY3JlYXRlTmV3THV0VGhpbmcocGFsZXR0ZSlcbiAgfVxuXG4gIGxldCBpc0Rpc2FibGVVcGRhdGUgPSBmYWxzZVxuXG4gIGNvbnN0IHVwZGF0ZSA9IChzdGF0ZTogU3RhdGUpID0+IHtcbiAgICBpZiAoIW1heWJlKHBhbGV0dGUpKSB0aHJvdyBFcnJvcignUGFsZXR0ZSBub3QgZ2VuZXJhdGVkJylcbiAgICBpZiAoIW1heWJlKHRlc3RJbWFnZSkpIHRocm93IEVycm9yKCdUZXN0IGltYWdlIG5vdCBsb2FkZWQnKVxuICAgIGlmICghbWF5YmUobmFpdmVMdXQpKSB0aHJvdyBFcnJvcignTmFpdmUgTFVUIG5vdCBnZW5lcmF0ZWQnKVxuICAgIGlmICghbWF5YmUobmFpdmVMdXQzMikpIHRocm93IEVycm9yKCdOYWl2ZSBMVVQzMiBub3QgZ2VuZXJhdGVkJylcbiAgICBpZiAoIW1heWJlKG5haXZlTHV0MikpIHRocm93IEVycm9yKCdOYWl2ZSBMVVQyIG5vdCBnZW5lcmF0ZWQnKVxuICAgIGlmICghbWF5YmUocGFsMikpIHRocm93IEVycm9yKCdQYWwyIG5vdCBnZW5lcmF0ZWQnKVxuICAgIGlmICghbWF5YmUobmFpdmUyTHV0MzIpKSB0aHJvdyBFcnJvcignTmFpdmUyIExVVDMyIG5vdCBnZW5lcmF0ZWQnKVxuXG4gICAgLy8gdGVtcCBcbiAgICBpZiAoaXNEaXNhYmxlVXBkYXRlKSByZXR1cm5cblxuICAgIC8vIGhhbmRsZSBpb1xuXG4gICAgY29uc3Qgd2hlZWwgPSBzdGF0ZS5tb3VzZS50YWtlV2hlZWwoKVxuICAgIGNvbnN0IHpvb20gPSBzdGF0ZS52aWV3LmdldFpvb20oKVxuXG4gICAgaWYgKHdoZWVsIDwgMCkge1xuICAgICAgc3RhdGUudmlldy5zZXRab29tKCB6b29tICsgMSApXG4gICAgfSBlbHNlIGlmICh3aGVlbCA+IDApIHtcbiAgICAgIHN0YXRlLnZpZXcuc2V0Wm9vbSggem9vbSAtIDEgKVxuICAgIH1cblxuICAgIGNvbnN0IGtleXMgPSBzdGF0ZS5nZXRLZXlzKClcblxuICAgIGlmIChrZXlzWydFc2NhcGUnXSkge1xuICAgICAgc3RhdGUuc2V0UnVubmluZyhmYWxzZSlcblxuICAgICAgLy8gY29uc3VtZSB0aGUga2V5XG4gICAgICBrZXlzWydFc2NhcGUnXSA9IGZhbHNlXG5cbiAgICAgIHJldHVyblxuICAgIH1cblxuICAgIC8vXG5cbiAgICBjb25zdCBidWZmZXIgPSBzdGF0ZS52aWV3LmdldEJ1ZmZlcigpXG5cbiAgICBmaWxsKGJ1ZmZlciwgY3JlYXRlQ29sb3IoMHgwMCwgMHgwMCwgMHgwMCkpXG5cbiAgICBsb2dPbmNlKCdidWZmZXJQaXhlbHMnLCAnQnVmZmVyIHBpeGVsczonLCBidWZmZXIud2lkdGggKiBidWZmZXIuaGVpZ2h0KVxuXG4gICAgLy8gY291bGQgb3B0aW1pemUgYnkgZG9pbmcgdGhpcyBpbiBpbml0LCBidXQgdGhlIHNjZW5lIGVhc2lseSBoaXRzIDYwZnBzXG4gICAgLy8gYW5kIGl0J3MganVzdCBhIHNhbmRib3hcblxuICAgIC8vIHBhbGV0dGUgc3R1ZmZcblxuICAgIGNvbnN0IG51bVBhbHMgPSAyXG5cbiAgICAvL1xuXG4gICAgY29uc3QgcGFsV2lkdGggPSBwYWxldHRlLmxpZ2h0UmFuZ2VcbiAgICBjb25zdCBwYWxIZWlnaHQgPSBNYXRoLmNlaWwocGFsZXR0ZS5lbnRyeUNvdW50IC8gcGFsV2lkdGgpXG5cbiAgICAvL1xuXG4gICAgY29uc3QgcGFsSW1hZ2UgPSBjcmVhdGVQYWxJbWFnZShwYWxldHRlLCBwYWxXaWR0aCwgcGFsSGVpZ2h0KVxuXG4gICAgY29uc3QgbmV3SGVpZ2h0ID0gYnVmZmVyLmhlaWdodFxuICAgIGNvbnN0IHNjYWxlID0gbmV3SGVpZ2h0IC8gcGFsSGVpZ2h0XG4gICAgY29uc3QgbmV3V2lkdGggPSBNYXRoLmZsb29yKHBhbFdpZHRoICogc2NhbGUpXG5cbiAgICByZXNpemUoXG4gICAgICBwYWxJbWFnZSwgYnVmZmVyLFxuICAgICAgWzAsIDAsIHBhbFdpZHRoLCBwYWxIZWlnaHRdLCBbMCwgMCwgbmV3V2lkdGgsIG5ld0hlaWdodF1cbiAgICApXG5cbiAgICAvL1xuXG4gICAgY29uc3QgcGFsMkltYWdlID0gY3JlYXRlUGFsMkltYWdlKHBhbDIsIHBhbFdpZHRoLCBwYWxIZWlnaHQpXG5cbiAgICByZXNpemUoXG4gICAgICBwYWwySW1hZ2UsIGJ1ZmZlcixcbiAgICAgIFswLCAwLCBwYWxXaWR0aCwgcGFsSGVpZ2h0XSwgW25ld1dpZHRoLCAwLCBuZXdXaWR0aCwgbmV3SGVpZ2h0XVxuICAgIClcblxuICAgIC8vXG5cbiAgICBjb25zdCBwYWxzV2lkdGggPSBuZXdXaWR0aCAqIG51bVBhbHNcblxuICAgIC8vXG5cbiAgICBjb25zdCByZW1haW5pbmdXaWR0aCA9IGJ1ZmZlci53aWR0aCAtIHBhbHNXaWR0aFxuXG4gICAgLy9cbiAgICBjb25zdCBpbWFnZUNvdW50ID0gNVxuXG4gICAgLy8gbWFrZSBzcGFjZSBmb3IgaW1hZ2VzIHNpZGUgYnkgc2lkZVxuICAgIGNvbnN0IGltYWdlV2lkdGhzID0gTWF0aC5mbG9vcihyZW1haW5pbmdXaWR0aCAvIGltYWdlQ291bnQpXG5cbiAgICAvLyBuZXh0IHdlJ2xsIHRyeSBjb252ZXJ0aW5nIGFuIGltYWdlIHRvIHBhbGV0dGUgYW5kIHNob3cgdGhlIG9yaWdpbmFsXG4gICAgLy8gYW5kIGNvbnZlcnRlZCBzaWRlIGJ5IHNpZGUsIHRoZW4gd2UgY2FuIHN0YXJ0IGV4cGVyaW1lbnRpbmcgd2l0aFxuICAgIC8vIGNyZWF0aW5nIGEgTFVUXG5cbiAgICBjb25zdCBuZXdPcmlnV2lkdGggPSBpbWFnZVdpZHRoc1xuICAgIGNvbnN0IHNjYWxlT3JpZyA9IG5ld09yaWdXaWR0aCAvIHRlc3RJbWFnZS53aWR0aFxuICAgIGNvbnN0IG5ld09yaWdIZWlnaHQgPSBNYXRoLmZsb29yKHRlc3RJbWFnZS5oZWlnaHQgKiBzY2FsZU9yaWcpXG5cbiAgICByZXNpemUoXG4gICAgICB0ZXN0SW1hZ2UsIGJ1ZmZlcixcbiAgICAgIFswLCAwLCB0ZXN0SW1hZ2Uud2lkdGgsIHRlc3RJbWFnZS5oZWlnaHRdLFxuICAgICAgW3BhbHNXaWR0aCwgMCwgbmV3T3JpZ1dpZHRoLCBuZXdPcmlnSGVpZ2h0XVxuICAgIClcblxuICAgIGNvbnN0IGNvbG9yc09yaWcgPSBjb3VudFVuaXF1ZUNvbG9ycyh0ZXN0SW1hZ2UpXG5cbiAgICBsb2dPbmNlKCdjb2xvcnNPcmlnJywgJ1VuaXF1ZSBjb2xvcnMgaW4gb3JpZ2luYWwgaW1hZ2U6JywgY29sb3JzT3JpZylcblxuICAgIC8vIHNsb3cgaW5kZXhlZCBjb252ZXJzaW9uLCBkaXJlY3Qgc2VhcmNoXG5cbiAgICBjb25zdCBzdGFydENvbnYwVGltZSA9IHBlcmZvcm1hbmNlLm5vdygpXG4gICAgY29uc3QgaW5kZXhlZCA9IHRvUGFsZXR0ZSh0ZXN0SW1hZ2UsIHBhbGV0dGUpXG4gICAgY29uc3QgZW5kQ29udjBUaW1lID0gcGVyZm9ybWFuY2Uubm93KClcblxuICAgIGNvbnN0IGNvbG9yc0luZGV4ZWQgPSBjb3VudFVuaXF1ZUNvbG9ycyhpbmRleGVkKVxuXG4gICAgbG9nT25jZShcbiAgICAgICdjb252MCcsXG4gICAgICAnQ29udmVyc2lvbiAwIHRpbWU6JywgZW5kQ29udjBUaW1lIC0gc3RhcnRDb252MFRpbWUsXG4gICAgICAnUGl4ZWwgY291bnQ6JywgdGVzdEltYWdlLndpZHRoICogdGVzdEltYWdlLmhlaWdodCxcbiAgICAgICdVbmlxdWUgY29sb3JzOicsIGNvbG9yc0luZGV4ZWRcbiAgICApXG5cbiAgICByZXNpemUoXG4gICAgICBpbmRleGVkLCBidWZmZXIsXG4gICAgICBbMCwgMCwgaW5kZXhlZC53aWR0aCwgaW5kZXhlZC5oZWlnaHRdLFxuICAgICAgW3BhbHNXaWR0aCArIG5ld09yaWdXaWR0aCwgMCwgbmV3T3JpZ1dpZHRoLCBuZXdPcmlnSGVpZ2h0XVxuICAgIClcblxuICAgIC8vIExVVCBleHBlcmltZW50c1xuXG4gICAgY29uc3Qgc3RhcnRDb252MVRpbWUgPSBwZXJmb3JtYW5jZS5ub3coKVxuICAgIGNvbnN0IGluZGV4ZWRMdXQgPSB0b1BhbGV0dGVMdXQodGVzdEltYWdlLCBwYWxldHRlLCBuYWl2ZUx1dClcbiAgICBjb25zdCBlbmRDb252MVRpbWUgPSBwZXJmb3JtYW5jZS5ub3coKVxuXG4gICAgY29uc3QgY29sb3JzTHV0ID0gY291bnRVbmlxdWVDb2xvcnMoaW5kZXhlZEx1dClcblxuICAgIGxvZ09uY2UoXG4gICAgICAnY29udjEnLFxuICAgICAgJ0NvbnZlcnNpb24gMSB0aW1lOicsIGVuZENvbnYxVGltZSAtIHN0YXJ0Q29udjFUaW1lLFxuICAgICAgJ1BpeGVsIGNvdW50OicsIHRlc3RJbWFnZS53aWR0aCAqIHRlc3RJbWFnZS5oZWlnaHQsXG4gICAgICAnVW5pcXVlIGNvbG9yczonLCBjb2xvcnNMdXRcbiAgICApXG5cbiAgICByZXNpemUoXG4gICAgICBpbmRleGVkTHV0LCBidWZmZXIsXG4gICAgICBbMCwgMCwgaW5kZXhlZEx1dC53aWR0aCwgaW5kZXhlZEx1dC5oZWlnaHRdLFxuICAgICAgW3BhbHNXaWR0aCArIG5ld09yaWdXaWR0aCAqIDIsIDAsIG5ld09yaWdXaWR0aCwgbmV3T3JpZ0hlaWdodF1cbiAgICApXG5cbiAgICAvL1xuXG4gICAgY29uc3Qgc3RhcnRDb252MlRpbWUgPSBwZXJmb3JtYW5jZS5ub3coKVxuICAgIGNvbnN0IGluZGV4ZWRMdXQzMiA9IHRvUGFsZXR0ZUx1dDMyKHRlc3RJbWFnZSwgbmFpdmVMdXQzMilcbiAgICBjb25zdCBlbmRDb252MlRpbWUgPSBwZXJmb3JtYW5jZS5ub3coKVxuXG4gICAgY29uc3QgY29sb3JzTHV0MzIgPSBjb3VudFVuaXF1ZUNvbG9ycyhpbmRleGVkTHV0MzIpXG5cbiAgICBsb2dPbmNlKFxuICAgICAgJ2NvbnYyJyxcbiAgICAgICdDb252ZXJzaW9uIDIgdGltZTonLCBlbmRDb252MlRpbWUgLSBzdGFydENvbnYyVGltZSxcbiAgICAgICdQaXhlbCBjb3VudDonLCB0ZXN0SW1hZ2Uud2lkdGggKiB0ZXN0SW1hZ2UuaGVpZ2h0LFxuICAgICAgJ1VuaXF1ZSBjb2xvcnM6JywgY29sb3JzTHV0MzJcbiAgICApXG5cbiAgICByZXNpemUoXG4gICAgICBpbmRleGVkTHV0MzIsIGJ1ZmZlcixcbiAgICAgIFswLCAwLCBpbmRleGVkTHV0MzIud2lkdGgsIGluZGV4ZWRMdXQzMi5oZWlnaHRdLFxuICAgICAgW3BhbHNXaWR0aCArIG5ld09yaWdXaWR0aCAqIDMsIDAsIG5ld09yaWdXaWR0aCwgbmV3T3JpZ0hlaWdodF1cbiAgICApXG4gICAgLy8gXG5cbiAgICBjb25zdCBzdGFydEx1dDJUaW1lID0gcGVyZm9ybWFuY2Uubm93KClcbiAgICBjb25zdCB7IGNoQ291bnQsIGNoYW5uZWxMb29rdXAsIHRhYmxlIH0gPSBjcmVhdGVOZXdMdXRUaGluZyhwYWxldHRlKVxuICAgIGNvbnN0IGVuZEx1dDJUaW1lID0gcGVyZm9ybWFuY2Uubm93KClcblxuICAgIGxvZ09uY2UoXG4gICAgICAnbHV0MicsXG4gICAgICAnTFVUIDIgdGltZTonLCBlbmRMdXQyVGltZSAtIHN0YXJ0THV0MlRpbWUsXG4gICAgICAnVGFibGUgc2l6ZTonLCB0YWJsZS5ieXRlTGVuZ3RoXG4gICAgKVxuXG4gICAgY29uc3Qgc3RhcnRDb252M1RpbWUgPSBwZXJmb3JtYW5jZS5ub3coKVxuICAgIGNvbnN0IGluZGV4ZWRMb29rdXAyID0gdG9QYWxldHRlTG9va3VwMyhcbiAgICAgIHRlc3RJbWFnZSwgbmFpdmUyTHV0MzIsXG4gICAgICBjaENvdW50LCBjaGFubmVsTG9va3VwLCB0YWJsZVxuICAgIClcbiAgICBjb25zdCBlbmRDb252M1RpbWUgPSBwZXJmb3JtYW5jZS5ub3coKVxuXG4gICAgY29uc3QgY29sb3JzTG9va3VwMiA9IGNvdW50VW5pcXVlQ29sb3JzKGluZGV4ZWRMb29rdXAyKVxuXG4gICAgbG9nT25jZShcbiAgICAgICdjb252MycsXG4gICAgICAnQ29udmVyc2lvbiAzIHRpbWU6JywgZW5kQ29udjNUaW1lIC0gc3RhcnRDb252M1RpbWUsXG4gICAgICAnUGl4ZWwgY291bnQ6JywgdGVzdEltYWdlLndpZHRoICogdGVzdEltYWdlLmhlaWdodCxcbiAgICAgICdVbmlxdWUgY29sb3JzOicsIGNvbG9yc0xvb2t1cDJcbiAgICApXG5cbiAgICByZXNpemUoXG4gICAgICBpbmRleGVkTG9va3VwMiwgYnVmZmVyLFxuICAgICAgWzAsIDAsIGluZGV4ZWRMb29rdXAyLndpZHRoLCBpbmRleGVkTG9va3VwMi5oZWlnaHRdLFxuICAgICAgW3BhbHNXaWR0aCArIG5ld09yaWdXaWR0aCAqIDQsIDAsIG5ld09yaWdXaWR0aCwgbmV3T3JpZ0hlaWdodF1cbiAgICApXG4gIH1cblxuICBjb25zdCBxdWl0ID0gYXN5bmMgKF9zdGF0ZTogU3RhdGUpID0+IHtcbiAgICBwYWxldHRlID0gbnVsbFxuICB9XG5cbiAgcmV0dXJuIHsgaW5pdCwgdXBkYXRlLCBxdWl0IH1cbn1cblxuY29uc3Qgc2VlbiA9IG5ldyBTZXQ8c3RyaW5nPigpXG5jb25zdCBsb2dPbmNlID0gKGlkOiBzdHJpbmcsIC4uLmFyZ3M6IGFueVtdKSA9PiB7XG4gIGlmIChzZWVuLmhhcyhpZCkpIHJldHVyblxuICBzZWVuLmFkZChpZClcbiAgY29uc29sZS5sb2coLi4uYXJncylcbn1cblxuY29uc3QgdG9QYWxldHRlID0gKGltYWdlOiBJbWFnZURhdGEsIHBhbGV0dGU6IEdlbmVyYXRlZFBhbGV0dGUpOiBJbWFnZURhdGEgPT4ge1xuICBjb25zdCBuZXdJbWFnZSA9IGNyZWF0ZUltYWdlKGltYWdlLndpZHRoLCBpbWFnZS5oZWlnaHQpXG5cbiAgLy9cblxuICBmb3IgKGxldCB5ID0gMDsgeSA8IGltYWdlLmhlaWdodDsgeSsrKSB7XG4gICAgY29uc3Qgcm93ID0geSAqIGltYWdlLndpZHRoXG4gICAgZm9yIChsZXQgeCA9IDA7IHggPCBpbWFnZS53aWR0aDsgeCsrKSB7XG4gICAgICBjb25zdCBpbmRleCA9IHJvdyArIHhcbiAgICAgIGNvbnN0IGRhdGFJbmRleCA9IGluZGV4ICogNFxuXG4gICAgICBjb25zdCBvciA9IGltYWdlLmRhdGFbZGF0YUluZGV4XVxuICAgICAgY29uc3Qgb2cgPSBpbWFnZS5kYXRhW2RhdGFJbmRleCArIDFdXG4gICAgICBjb25zdCBvYiA9IGltYWdlLmRhdGFbZGF0YUluZGV4ICsgMl1cblxuICAgICAgY29uc3QgcGFsSW5kZXggPSBpbmRleE9mQ2xvc2VzdFJnYihwYWxldHRlLCBbb3IsIG9nLCBvYl0pXG5cbiAgICAgIGNvbnN0IHByID0gcGFsZXR0ZS5kYXRhW3BhbEluZGV4ICogM11cbiAgICAgIGNvbnN0IHBnID0gcGFsZXR0ZS5kYXRhW3BhbEluZGV4ICogMyArIDFdXG4gICAgICBjb25zdCBwYiA9IHBhbGV0dGUuZGF0YVtwYWxJbmRleCAqIDMgKyAyXVxuXG4gICAgICBuZXdJbWFnZS5kYXRhW2RhdGFJbmRleF0gPSBwclxuICAgICAgbmV3SW1hZ2UuZGF0YVtkYXRhSW5kZXggKyAxXSA9IHBnXG4gICAgICBuZXdJbWFnZS5kYXRhW2RhdGFJbmRleCArIDJdID0gcGJcbiAgICAgIG5ld0ltYWdlLmRhdGFbZGF0YUluZGV4ICsgM10gPSAyNTVcbiAgICB9XG4gIH1cblxuICAvL1xuXG4gIHJldHVybiBuZXdJbWFnZVxufVxuXG5jb25zdCB0b1BhbGV0dGVMdXQgPSAoXG4gIGltYWdlOiBJbWFnZURhdGEsIHBhbGV0dGU6IEdlbmVyYXRlZFBhbGV0dGUsIGx1dDogVWludDhBcnJheVxuKTogSW1hZ2VEYXRhID0+IHtcbiAgY29uc3QgbmV3SW1hZ2UgPSBjcmVhdGVJbWFnZShpbWFnZS53aWR0aCwgaW1hZ2UuaGVpZ2h0KVxuXG4gIC8vXG5cbiAgZm9yIChsZXQgeSA9IDA7IHkgPCBpbWFnZS5oZWlnaHQ7IHkrKykge1xuICAgIGNvbnN0IHJvdyA9IHkgKiBpbWFnZS53aWR0aFxuICAgIGZvciAobGV0IHggPSAwOyB4IDwgaW1hZ2Uud2lkdGg7IHgrKykge1xuICAgICAgY29uc3QgaW5kZXggPSByb3cgKyB4XG4gICAgICBjb25zdCBkYXRhSW5kZXggPSBpbmRleCAqIDRcblxuICAgICAgY29uc3Qgb3IgPSBpbWFnZS5kYXRhW2RhdGFJbmRleF1cbiAgICAgIGNvbnN0IG9nID0gaW1hZ2UuZGF0YVtkYXRhSW5kZXggKyAxXVxuICAgICAgY29uc3Qgb2IgPSBpbWFnZS5kYXRhW2RhdGFJbmRleCArIDJdXG5cbiAgICAgIGNvbnN0IGx1dEluZGV4ID0gY3JlYXRlQ29sb3IyNChvciwgb2csIG9iKVxuICAgICAgY29uc3QgcGFsSW5kZXggPSBsdXRbbHV0SW5kZXhdXG5cbiAgICAgIGNvbnN0IHByID0gcGFsZXR0ZS5kYXRhW3BhbEluZGV4ICogM11cbiAgICAgIGNvbnN0IHBnID0gcGFsZXR0ZS5kYXRhW3BhbEluZGV4ICogMyArIDFdXG4gICAgICBjb25zdCBwYiA9IHBhbGV0dGUuZGF0YVtwYWxJbmRleCAqIDMgKyAyXVxuXG4gICAgICBuZXdJbWFnZS5kYXRhW2RhdGFJbmRleF0gPSBwclxuICAgICAgbmV3SW1hZ2UuZGF0YVtkYXRhSW5kZXggKyAxXSA9IHBnXG4gICAgICBuZXdJbWFnZS5kYXRhW2RhdGFJbmRleCArIDJdID0gcGJcbiAgICAgIG5ld0ltYWdlLmRhdGFbZGF0YUluZGV4ICsgM10gPSAyNTVcbiAgICB9XG4gIH1cblxuICAvL1xuXG4gIHJldHVybiBuZXdJbWFnZVxufVxuXG5jb25zdCB0b1BhbGV0dGVMdXQzMiA9IChcbiAgc3JjOiBJbWFnZURhdGEsIGx1dDogVWludDMyQXJyYXlcbik6IEltYWdlRGF0YSA9PiB7XG4gIGNvbnN0IG5ld0ltYWdlID0gY3JlYXRlSW1hZ2Uoc3JjLndpZHRoLCBzcmMuaGVpZ2h0KVxuXG4gIGNvbnN0IHNpemUgPSBzcmMud2lkdGggKiBzcmMuaGVpZ2h0XG5cbiAgY29uc3Qgc3JjVmlldyA9IG5ldyBVaW50MzJBcnJheShzcmMuZGF0YS5idWZmZXIpXG4gIGNvbnN0IGRlc3RWaWV3ID0gbmV3IFVpbnQzMkFycmF5KG5ld0ltYWdlLmRhdGEuYnVmZmVyKVxuXG4gIC8vXG5cbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBzaXplOyBpKyspIHtcbiAgICBjb25zdCByZ2JhID0gc3JjVmlld1tpXVxuICAgIGNvbnN0IHJnYiA9IHJnYmEgJiAweDAwZmZmZmZmXG5cbiAgICBkZXN0Vmlld1tpXSA9IGx1dFtyZ2JdXG4gIH1cblxuICAvL1xuXG4gIHJldHVybiBuZXdJbWFnZVxufVxuXG4vLyB0aGlzIGlzIHRoZSB3aW5uZXIgZm9yIHNldmVyYWwgcmVhc29uczpcbi8vIGEpIGl0J3MgYnkgZmFyIHRoZSBmYXN0ZXN0IGR1ZSB0byBzbWFsbCB0YWJsZSBzaXplIGhlbHBpbmcgd2l0aCBjYWNoZSBcbi8vICAgIGxvY2FsaXR5LCBldmVuIHRob3VnaCB0aGUgYXJpdGhtZXRpYyBpcyBtb3JlIGNvbXBsZXggdGhhbiBlZyB0b1BhbGV0dGVMdXQzMlxuLy8gYikgaXQgdXNlcyB0aGUgbGVhc3QgbWVtb3J5LCB+NjBrYiBjb21wYXJlZCB0byBlZyAxNk1CIG9yIDY0TUIgZm9yIHRoZSBvdGhlclxuLy8gICAgbHV0c1xuLy8gYykgaXQgcHJvZHVjZXMgc2xpZ2h0bHkgYmV0dGVyIHJlc3VsdHMsIGVnIGxlc3MgaW5mb3JtYXRpb24gaXMgbG9zdCBpbiB0aGUgXG4vLyAgICByZXN1bHRhbnQgb3V0cHV0IGltYWdlXG5jb25zdCB0b1BhbGV0dGVMb29rdXAzID0gKFxuICBzcmM6IEltYWdlRGF0YSwgY29sb3JzOiBVaW50MzJBcnJheSxcbiAgY2hDb3VudDogbnVtYmVyLCBjaGFubmVsTG9va3VwOiBVaW50OEFycmF5LCB0YWJsZTogVWludDhBcnJheVxuKTogSW1hZ2VEYXRhID0+IHtcbiAgY29uc3QgZGVzdCA9IGNyZWF0ZUltYWdlKHNyYy53aWR0aCwgc3JjLmhlaWdodClcblxuICBjb25zdCBkZXN0VmlldyA9IG5ldyBVaW50MzJBcnJheShkZXN0LmRhdGEuYnVmZmVyKVxuXG4gIC8vXG5cbiAgY29uc3Qgck9mZnNldFNpemUgPSBjaENvdW50ICogY2hDb3VudFxuXG4gIGZvciAobGV0IHkgPSAwOyB5IDwgc3JjLmhlaWdodDsgeSsrKSB7XG4gICAgY29uc3Qgcm93ID0geSAqIHNyYy53aWR0aFxuXG4gICAgZm9yIChsZXQgeCA9IDA7IHggPCBzcmMud2lkdGg7IHgrKykge1xuICAgICAgY29uc3QgaW5kZXggPSByb3cgKyB4XG4gICAgICBjb25zdCBkYXRhSW5kZXggPSBpbmRleCAqIDRcblxuICAgICAgY29uc3Qgb3IgPSBzcmMuZGF0YVtkYXRhSW5kZXhdXG4gICAgICBjb25zdCBvZyA9IHNyYy5kYXRhW2RhdGFJbmRleCArIDFdXG4gICAgICBjb25zdCBvYiA9IHNyYy5kYXRhW2RhdGFJbmRleCArIDJdXG5cbiAgICAgIGNvbnN0IHJpID0gY2hhbm5lbExvb2t1cFtvcl1cbiAgICAgIGNvbnN0IGdpID0gY2hhbm5lbExvb2t1cFtvZ11cbiAgICAgIGNvbnN0IGJpID0gY2hhbm5lbExvb2t1cFtvYl1cblxuICAgICAgY29uc3QgcmlPZmZzZXQgPSByaSAqIHJPZmZzZXRTaXplXG4gICAgICBjb25zdCBnaU9mZnNldCA9IGdpICogY2hDb3VudFxuICAgICAgY29uc3QgbG9va3VwID0gYmkgKyBnaU9mZnNldCArIHJpT2Zmc2V0XG5cbiAgICAgIGNvbnN0IGNsb3Nlc3QgPSB0YWJsZVtsb29rdXBdXG5cbiAgICAgIGRlc3RWaWV3W2luZGV4XSA9IGNvbG9yc1tjbG9zZXN0XSB8IDB4ZmYwMDAwMDBcbiAgICB9XG4gIH1cblxuICAvL1xuXG4gIHJldHVybiBkZXN0XG59XG5cbi8qXG4gIG9rIG5ldyBzdHJhdGVneVxuXG4gIDEuIGdlbmVyYXRlIGEgcGFsZXR0ZVxuICAyLiBmb3IgZXZlcnkgY29sb3IsIGdldCB0aGUgdGhyZWUgY2hhbm5lbHMgYW5kIGFkZCB0aGVpciB2YWx1ZXMgdG8gYSBzZXRcbiAgMy4gYXQgdGhlIGVuZCwgeW91IGhhdmUgYSBzZXQgb2YgdmFsdWVzIGZvciBldmVyeSBwb3NzaWJsZSBjaGFubmVsIHZhbHVlXG4gICAgIGVnIGZvciBvdXIgMTIvNC81IGh1ZSBnZW5lcmF0ZWQgcGFsZXR0ZSBvZiAyNTUgY29sb3JzLCB0aGVyZSBhcmUgMzggdW5pcXVlXG4gICAgIHZhbHVlcyBmb3IgZXZlcnkgY2hhbm5lbFxuICA0LiBjcmVhdGUgYSBsb29rdXAgdGFibGUgd2l0aCAwLi4yNTUgaW5kaWNlcywgYW5kIHRoZSBuZWFyZXN0IG1hdGNoIGZyb20gb3VyXG4gICAgIHNldFxuICA1LiBleHBlcmltZW50IC0gb25lIHdlIHJlY29uc3RydWN0IGEgY29sb3IgZnJvbSBhbiB1bmluZGV4ZWQgaW1hZ2UsIGlzIGV2ZXJ5XG4gICAgIHZhbHVlIHByZXNlbnQgaW4gb3VyIHBhbGV0dGU/XG5cbiAgSW4gb3VyIGV4YW1wbGUgd2l0aCAzOCB1bmlxdWUgdmFsdWVzLCB0aGVyZSBhcmUgMzgqKjMgKDU0LDg3MikgcG9zc2libGUgXG4gIGNvbG9ycywgYSBsb3QgbGVzcyB0aGFuIG91ciAxNiBtaWxsaW9uIGNvbG9yc3BhY2UgICBcblxuICBGaXJzdCwgY29udmVydCByYXcgciwgZywgYiBpbnRvIHJhbmdlIDAuLjM3IG1hdGNoaW5nIHRvIGluZGV4IG9mIGNsb3Nlc3QgdmFsdWUgXG4gIGluIHRoZSBzZXRcblxuICBTbyB5b3UgY2FuIG1ha2UgYSBsb29rdXAgdGFibGUgd2hpY2ggaXMgYSBVaW50OEFycmF5IG9mIDM4KiozIGVudHJpZXNcblxuICBZb3UgY2FuIGluZGV4IGludG8gaXQgYnk6XG5cbiAgciBbMC4uMzddXG4gIGcgWzAuLjM3XVxuICBiIFswLi4zN11cblxuICBjb25zdCBpbmRleCA9ICggciAqIDM4ICogMzggKSArICggZyAqIDM4ICkgKyBiXG5cbiAgd2l0aCBlYWNoIGluZGV4IHBvaW50aW5nIHRvIGEgcGFsZXR0ZSBpbmRleFxuKi9cblxuY29uc3QgbmVhcmVzdE1hdGNoID0gKHZhbHVlczogbnVtYmVyW10sIHZhbHVlOiBudW1iZXIpID0+IHtcbiAgbGV0IGNsb3Nlc3QgPSB2YWx1ZXNbMF1cbiAgbGV0IGNsb3Nlc3REaXN0ID0gTWF0aC5hYnModmFsdWUgLSBjbG9zZXN0KVxuXG4gIGZvciAobGV0IGkgPSAxOyBpIDwgdmFsdWVzLmxlbmd0aDsgaSsrKSB7XG4gICAgY29uc3QgZGlzdCA9IE1hdGguYWJzKHZhbHVlIC0gdmFsdWVzW2ldKVxuXG4gICAgaWYgKGRpc3QgPCBjbG9zZXN0RGlzdCkge1xuICAgICAgY2xvc2VzdCA9IHZhbHVlc1tpXVxuICAgICAgY2xvc2VzdERpc3QgPSBkaXN0XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIGNsb3Nlc3Rcbn1cblxuY29uc3QgY3JlYXRlTmV3THV0VGhpbmcgPSAocGFsZXR0ZTogR2VuZXJhdGVkUGFsZXR0ZSkgPT4ge1xuICBjb25zdCBjaGFubmVsU2V0ID0gbmV3IFNldDxudW1iZXI+KClcblxuICBmb3IgKGxldCBpID0gMDsgaSA8IHBhbGV0dGUuZW50cnlDb3VudDsgaSsrKSB7XG4gICAgY2hhbm5lbFNldC5hZGQocGFsZXR0ZS5kYXRhW2kgKiAzXSlcbiAgICBjaGFubmVsU2V0LmFkZChwYWxldHRlLmRhdGFbaSAqIDMgKyAxXSlcbiAgICBjaGFubmVsU2V0LmFkZChwYWxldHRlLmRhdGFbaSAqIDMgKyAyXSlcbiAgfVxuXG4gIGNvbnN0IHZhbHVlcyA9IEFycmF5LmZyb20oY2hhbm5lbFNldCkuc29ydCgoYSwgYikgPT4gYSAtIGIpXG5cbiAgY29uc3QgY2hDb3VudCA9IHZhbHVlcy5sZW5ndGhcblxuICBjb25zdCBjaGFubmVsTG9va3VwID0gbmV3IFVpbnQ4QXJyYXkoMjU2KVxuXG4gIGZvciAobGV0IGkgPSAwOyBpIDwgMjU2OyBpKyspIHtcbiAgICBjb25zdCBjbG9zZXN0ID0gbmVhcmVzdE1hdGNoKHZhbHVlcywgaSlcblxuICAgIGNoYW5uZWxMb29rdXBbaV0gPSB2YWx1ZXMuaW5kZXhPZihjbG9zZXN0KVxuICB9XG5cbiAgY29uc3QgdGFibGVTaXplID0gY2hDb3VudCAqKiAzXG5cbiAgY29uc3QgdGFibGUgPSBuZXcgVWludDhBcnJheSh0YWJsZVNpemUpXG5cbiAgY29uc3QgclNpemUgPSBjaENvdW50ICogY2hDb3VudFxuXG4gIGZvciAobGV0IHJpID0gMDsgcmkgPCBjaENvdW50OyByaSsrKSB7XG4gICAgY29uc3QgcmlPZmZzZXQgPSByaSAqIHJTaXplXG4gICAgZm9yIChsZXQgZ2kgPSAwOyBnaSA8IGNoQ291bnQ7IGdpKyspIHtcbiAgICAgIGNvbnN0IGdpT2Zmc2V0ID0gZ2kgKiBjaENvdW50ICsgcmlPZmZzZXRcbiAgICAgIGZvciAobGV0IGJpID0gMDsgYmkgPCBjaENvdW50OyBiaSsrKSB7XG4gICAgICAgIGNvbnN0IGluZGV4ID0gYmkgKyBnaU9mZnNldFxuXG4gICAgICAgIGNvbnN0IHIgPSB2YWx1ZXNbcmldXG4gICAgICAgIGNvbnN0IGcgPSB2YWx1ZXNbZ2ldXG4gICAgICAgIGNvbnN0IGIgPSB2YWx1ZXNbYmldXG5cbiAgICAgICAgY29uc3QgY2xvc2VzdCA9IGluZGV4T2ZDbG9zZXN0UmdiKHBhbGV0dGUsIFtyLCBnLCBiXSlcblxuICAgICAgICB0YWJsZVtpbmRleF0gPSBjbG9zZXN0XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIHsgY2hDb3VudCwgY2hhbm5lbExvb2t1cCwgdGFibGUgfVxufVxuXG5jb25zdCBjb3VudFVuaXF1ZUNvbG9ycyA9IChpbWFnZTogSW1hZ2VEYXRhKTogbnVtYmVyID0+IHtcbiAgY29uc3Qgc2V0ID0gbmV3IFNldDxudW1iZXI+KClcblxuICBjb25zdCBpbWFnZVZpZXcgPSBuZXcgVWludDMyQXJyYXkoaW1hZ2UuZGF0YS5idWZmZXIpXG5cbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBpbWFnZVZpZXcubGVuZ3RoOyBpKyspIHtcbiAgICBzZXQuYWRkKGltYWdlVmlld1tpXSlcbiAgfVxuXG4gIHJldHVybiBzZXQuc2l6ZVxufVxuIl19