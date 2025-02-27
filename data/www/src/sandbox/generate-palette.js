export const generatePalette = (entryCount, hueRange, satRange, lightRange) => {
    // reserve at least lightRange entries for greys
    const used = hueRange * satRange * lightRange + lightRange;
    if (used > entryCount) {
        throw Error('Not enough entries to generate palette');
    }
    // store as rgb palette
    const size = entryCount * 3;
    const data = new Uint8Array(size);
    let entryIndex = 0;
    // as hue is circular, we exclude the end of the range eg [0..1)
    const hueStep = 1 / hueRange;
    // skip 0 saturation as it's greyscale
    const satStep = 1 / satRange; // if 3, will be 0, 0.5, 1
    // skip 0 lightness as it's black, and 1 as it's white
    const lightStep = 1 / (lightRange + 1);
    for (let h = 0; h < hueRange; h++) {
        for (let s = 0; s < satRange; s++) {
            for (let l = 0; l < lightRange; l++) {
                const index = entryIndex * 3;
                const hue = hueStep * h;
                const sat = satStep * (s + 1);
                const light = lightStep * (l + 1);
                const [r, g, b] = hslToRgb([hue, sat, light]);
                data[index] = r;
                data[index + 1] = g;
                data[index + 2] = b;
                entryIndex++;
            }
        }
    }
    const greyRange = entryCount - entryIndex;
    const greyStep = 1 / (greyRange - 1);
    // greys - produces the values we skipped in the color steps above
    for (let l = 0; l < greyRange; l++) {
        const index = entryIndex * 3;
        const [r, g, b] = hslToRgb([0, 0, l * greyStep]);
        data[index] = r;
        data[index + 1] = g;
        data[index + 2] = b;
        entryIndex++;
    }
    return {
        data,
        entryCount,
        hueRange,
        satRange,
        lightRange,
        greyRange
    };
};
//
export const indexOfClosestHsl = (palette, hsl) => {
    const [h0, s0, l0] = hsl;
    const { hueRange, satRange, lightRange, greyRange } = palette;
    const totalColorEntries = hueRange * satRange * lightRange;
    const greyStartIndex = totalColorEntries;
    // map hue (circular)
    let hCandidate = Math.round(h0 * hueRange);
    if (hCandidate === hueRange)
        hCandidate = 0;
    const hIndex = hCandidate;
    // map sat
    let sCandidate = Math.round(s0 * satRange);
    if (sCandidate < 1 || sCandidate > satRange) {
        // must be grey
        const greyIndexInGreys = Math.round(l0 * (greyRange - 1));
        return greyStartIndex + greyIndexInGreys;
    }
    const sIndex = sCandidate - 1;
    // map lightness
    let lCandidate = Math.round(l0 * (lightRange + 1));
    if (lCandidate < 1 || lCandidate > lightRange) {
        // must be grey
        const greyIndexInGreys = Math.round(l0 * (greyRange - 1));
        return greyStartIndex + greyIndexInGreys;
    }
    const lIndex = lCandidate - 1;
    //valid hIndex, sIndex, and lIndex; color within the ramps
    const colorIndex = (hIndex * (satRange * lightRange) + sIndex * lightRange + lIndex);
    return colorIndex;
};
export const indexOfClosestRgb = (palette, rgb) => indexOfClosestHsl(palette, rgbToHsl(rgb));
//
const { min, max, round } = Math;
export const hslToRgb = ([h, s, l]) => {
    let r;
    let g;
    let b;
    if (s === 0) {
        r = g = b = l; // achromatic
    }
    else {
        const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        const p = 2 * l - q;
        r = hueToRgb(p, q, h + 1 / 3);
        g = hueToRgb(p, q, h);
        b = hueToRgb(p, q, h - 1 / 3);
    }
    return [round(r * 255), round(g * 255), round(b * 255)];
};
const hueToRgb = (p, q, t) => {
    if (t < 0)
        t += 1;
    if (t > 1)
        t -= 1;
    if (t < 1 / 6)
        return p + (q - p) * 6 * t;
    if (t < 1 / 2)
        return q;
    if (t < 2 / 3)
        return p + (q - p) * (2 / 3 - t) * 6;
    return p;
};
export const rgbToHsl = ([r, g, b]) => {
    r /= 255;
    g /= 255;
    b /= 255;
    const vmax = max(r, g, b);
    const vmin = min(r, g, b);
    let h;
    let s;
    let l;
    h = l = (vmax + vmin) / 2;
    if (vmax === vmin) {
        return [0, 0, l]; // achromatic
    }
    const d = vmax - vmin;
    s = l > 0.5 ? d / (2 - vmax - vmin) : d / (vmax + vmin);
    if (vmax === r)
        h = (g - b) / d + (g < b ? 6 : 0);
    if (vmax === g)
        h = (b - r) / d + 2;
    if (vmax === b)
        h = (r - g) / d + 4;
    h /= 6;
    return [h, s, l];
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2VuZXJhdGUtcGFsZXR0ZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy9zYW5kYm94L2dlbmVyYXRlLXBhbGV0dGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBRUEsTUFBTSxDQUFDLE1BQU0sZUFBZSxHQUFHLENBQzdCLFVBQWtCLEVBQ2xCLFFBQWdCLEVBQUUsUUFBZ0IsRUFBRSxVQUFrQixFQUNwQyxFQUFFO0lBQ3BCLGdEQUFnRDtJQUNoRCxNQUFNLElBQUksR0FBRyxRQUFRLEdBQUcsUUFBUSxHQUFHLFVBQVUsR0FBRyxVQUFVLENBQUE7SUFFMUQsSUFBSSxJQUFJLEdBQUcsVUFBVSxFQUFFLENBQUM7UUFDdEIsTUFBTSxLQUFLLENBQUMsd0NBQXdDLENBQUMsQ0FBQTtJQUN2RCxDQUFDO0lBRUQsdUJBQXVCO0lBQ3ZCLE1BQU0sSUFBSSxHQUFHLFVBQVUsR0FBRyxDQUFDLENBQUE7SUFDM0IsTUFBTSxJQUFJLEdBQUcsSUFBSSxVQUFVLENBQUMsSUFBSSxDQUFDLENBQUE7SUFFakMsSUFBSSxVQUFVLEdBQUcsQ0FBQyxDQUFBO0lBRWxCLGdFQUFnRTtJQUNoRSxNQUFNLE9BQU8sR0FBRyxDQUFDLEdBQUcsUUFBUSxDQUFBO0lBQzVCLHNDQUFzQztJQUN0QyxNQUFNLE9BQU8sR0FBRyxDQUFDLEdBQUcsUUFBUSxDQUFBLENBQUMsMEJBQTBCO0lBQ3ZELHNEQUFzRDtJQUN0RCxNQUFNLFNBQVMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxVQUFVLEdBQUcsQ0FBQyxDQUFDLENBQUE7SUFFdEMsS0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLFFBQVEsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDO1FBQ2xDLEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxRQUFRLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQztZQUNsQyxLQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFB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QUFDLEdBQUcsQ0FBQyxHQUFHLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxHQUFHLElBQUksR0FBRyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsSUFBSSxHQUFHLElBQUksQ0FBQyxDQUFBO0lBQ3ZELElBQUksSUFBSSxLQUFLLENBQUM7UUFBRSxDQUFDLEdBQUcsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQTtJQUNqRCxJQUFJLElBQUksS0FBSyxDQUFDO1FBQUUsQ0FBQyxHQUFHLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUE7SUFDbkMsSUFBSSxJQUFJLEtBQUssQ0FBQztRQUFFLENBQUMsR0FBRyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFBO0lBQ25DLENBQUMsSUFBSSxDQUFDLENBQUE7SUFFTixPQUFPLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQTtBQUNsQixDQUFDLENBQUEiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBUMyB9IGZyb20gJy4uL2xpYi90eXBlcy5qcydcclxuXHJcbmV4cG9ydCBjb25zdCBnZW5lcmF0ZVBhbGV0dGUgPSAoXHJcbiAgZW50cnlDb3VudDogbnVtYmVyLFxyXG4gIGh1ZVJhbmdlOiBudW1iZXIsIHNhdFJhbmdlOiBudW1iZXIsIGxpZ2h0UmFuZ2U6IG51bWJlclxyXG4pOiBHZW5lcmF0ZWRQYWxldHRlID0+IHtcclxuICAvLyByZXNlcnZlIGF0IGxlYXN0IGxpZ2h0UmFuZ2UgZW50cmllcyBmb3IgZ3JleXNcclxuICBjb25zdCB1c2VkID0gaHVlUmFuZ2UgKiBzYXRSYW5nZSAqIGxpZ2h0UmFuZ2UgKyBsaWdodFJhbmdlXHJcblxyXG4gIGlmICh1c2VkID4gZW50cnlDb3VudCkge1xyXG4gICAgdGhyb3cgRXJyb3IoJ05vdCBlbm91Z2ggZW50cmllcyB0byBnZW5lcmF0ZSBwYWxldHRlJylcclxuICB9XHJcblxyXG4gIC8vIHN0b3JlIGFzIHJnYiBwYWxldHRlXHJcbiAgY29uc3Qgc2l6ZSA9IGVudHJ5Q291bnQgKiAzXHJcbiAgY29uc3QgZGF0YSA9IG5ldyBVaW50OEFycmF5KHNpemUpXHJcblxyXG4gIGxldCBlbnRyeUluZGV4ID0gMFxyXG5cclxuICAvLyBhcyBodWUgaXMgY2lyY3VsYXIsIHdlIGV4Y2x1ZGUgdGhlIGVuZCBvZiB0aGUgcmFuZ2UgZWcgWzAuLjEpXHJcbiAgY29uc3QgaHVlU3RlcCA9IDEgLyBodWVSYW5nZVxyXG4gIC8vIHNraXAgMCBzYXR1cmF0aW9uIGFzIGl0J3MgZ3JleXNjYWxlXHJcbiAgY29uc3Qgc2F0U3RlcCA9IDEgLyBzYXRSYW5nZSAvLyBpZiAzLCB3aWxsIGJlIDAsIDAuNSwgMVxyXG4gIC8vIHNraXAgMCBsaWdodG5lc3MgYXMgaXQncyBibGFjaywgYW5kIDEgYXMgaXQncyB3aGl0ZVxyXG4gIGNvbnN0IGxpZ2h0U3RlcCA9IDEgLyAobGlnaHRSYW5nZSArIDEpXHJcblxyXG4gIGZvciAobGV0IGggPSAwOyBoIDwgaHVlUmFuZ2U7IGgrKykge1xyXG4gICAgZm9yIChsZXQgcyA9IDA7IHMgPCBzYXRSYW5nZTsgcysrKSB7XHJcbiAgICAgIGZvciAobGV0IGwgPSAwOyBsIDwgbGlnaHRSYW5nZTsgbCsrKSB7XHJcbiAgICAgICAgY29uc3QgaW5kZXggPSBlbnRyeUluZGV4ICogM1xyXG4gICAgICAgIGNvbnN0IGh1ZSA9IGh1ZVN0ZXAgKiBoXHJcbiAgICAgICAgY29uc3Qgc2F0ID0gc2F0U3RlcCAqIChzICsgMSlcclxuICAgICAgICBjb25zdCBsaWdodCA9IGxpZ2h0U3RlcCAqIChsICsgMSlcclxuXHJcbiAgICAgICAgY29uc3QgW3IsIGcsIGJdID0gaHNsVG9SZ2IoW2h1ZSwgc2F0LCBsaWdodF0pXHJcblxyXG4gICAgICAgIGRhdGFbaW5kZXhdID0gclxyXG4gICAgICAgIGRhdGFbaW5kZXggKyAxXSA9IGdcclxuICAgICAgICBkYXRhW2luZGV4ICsgMl0gPSBiXHJcbiAgICAgICAgZW50cnlJbmRleCsrXHJcbiAgICAgIH1cclxuICAgIH1cclxuICB9XHJcblxyXG4gIGNvbnN0IGdyZXlSYW5nZSA9IGVudHJ5Q291bnQgLSBlbnRyeUluZGV4XHJcblxyXG4gIGNvbnN0IGdyZXlTdGVwID0gMSAvIChncmV5UmFuZ2UgLSAxKVxyXG5cclxuICAvLyBncmV5cyAtIHByb2R1Y2VzIHRoZSB2YWx1ZXMgd2Ugc2tpcHBlZCBpbiB0aGUgY29sb3Igc3RlcHMgYWJvdmVcclxuICBmb3IgKGxldCBsID0gMDsgbCA8IGdyZXlSYW5nZTsgbCsrKSB7XHJcbiAgICBjb25zdCBpbmRleCA9IGVudHJ5SW5kZXggKiAzXHJcblxyXG4gICAgY29uc3QgW3IsIGcsIGJdID0gaHNsVG9SZ2IoWzAsIDAsIGwgKiBncmV5U3RlcF0pXHJcblxyXG4gICAgZGF0YVtpbmRleF0gPSByXHJcbiAgICBkYXRhW2luZGV4ICsgMV0gPSBnXHJcbiAgICBkYXRhW2luZGV4ICsgMl0gPSBiXHJcblxyXG4gICAgZW50cnlJbmRleCsrXHJcbiAgfVxyXG5cclxuICByZXR1cm4ge1xyXG4gICAgZGF0YSxcclxuICAgIGVudHJ5Q291bnQsXHJcbiAgICBodWVSYW5nZSxcclxuICAgIHNhdFJhbmdlLFxyXG4gICAgbGlnaHRSYW5nZSxcclxuICAgIGdyZXlSYW5nZVxyXG4gIH1cclxufVxyXG5cclxuZXhwb3J0IHR5cGUgR2VuZXJhdGVkUGFsZXR0ZSA9IHtcclxuICBkYXRhOiBVaW50OEFycmF5XHJcbiAgZW50cnlDb3VudDogbnVtYmVyXHJcbiAgaHVlUmFuZ2U6IG51bWJlclxyXG4gIHNhdFJhbmdlOiBudW1iZXJcclxuICBsaWdodFJhbmdlOiBudW1iZXJcclxuICBncmV5UmFuZ2U6IG51bWJlclxyXG59XHJcblxyXG4vL1xyXG5cclxuZXhwb3J0IGNvbnN0IGluZGV4T2ZDbG9zZXN0SHNsID0gKFxyXG4gIHBhbGV0dGU6IEdlbmVyYXRlZFBhbGV0dGUsIGhzbDogVDNcclxuKTogbnVtYmVyID0+IHtcclxuICBjb25zdCBbaDAsIHMwLCBsMF0gPSBoc2xcclxuICBjb25zdCB7IGh1ZVJhbmdlLCBzYXRSYW5nZSwgbGlnaHRSYW5nZSwgZ3JleVJhbmdlIH0gPSBwYWxldHRlXHJcblxyXG4gIGNvbnN0IHRvdGFsQ29sb3JFbnRyaWVzID0gaHVlUmFuZ2UgKiBzYXRSYW5nZSAqIGxpZ2h0UmFuZ2VcclxuICBjb25zdCBncmV5U3RhcnRJbmRleCA9IHRvdGFsQ29sb3JFbnRyaWVzXHJcblxyXG4gIC8vIG1hcCBodWUgKGNpcmN1bGFyKVxyXG4gIGxldCBoQ2FuZGlkYXRlID0gTWF0aC5yb3VuZChoMCAqIGh1ZVJhbmdlKVxyXG4gIGlmIChoQ2FuZGlkYXRlID09PSBodWVSYW5nZSkgaENhbmRpZGF0ZSA9IDBcclxuICBjb25zdCBoSW5kZXggPSBoQ2FuZGlkYXRlXHJcblxyXG4gIC8vIG1hcCBzYXRcclxuICBsZXQgc0NhbmRpZGF0ZSA9IE1hdGgucm91bmQoczAgKiBzYXRSYW5nZSlcclxuXHJcbiAgaWYgKHNDYW5kaWRhdGUgPCAxIHx8IHNDYW5kaWRhdGUgPiBzYXRSYW5nZSkge1xyXG4gICAgLy8gbXVzdCBiZSBncmV5XHJcbiAgICBjb25zdCBncmV5SW5kZXhJbkdyZXlzID0gTWF0aC5yb3VuZChsMCAqIChncmV5UmFuZ2UgLSAxKSlcclxuXHJcbiAgICByZXR1cm4gZ3JleVN0YXJ0SW5kZXggKyBncmV5SW5kZXhJbkdyZXlzXHJcbiAgfVxyXG5cclxuICBjb25zdCBzSW5kZXggPSBzQ2FuZGlkYXRlIC0gMVxyXG5cclxuICAvLyBtYXAgbGlnaHRuZXNzXHJcbiAgbGV0IGxDYW5kaWRhdGUgPSBNYXRoLnJvdW5kKGwwICogKGxpZ2h0UmFuZ2UgKyAxKSlcclxuICBpZiAobENhbmRpZGF0ZSA8IDEgfHwgbENhbmRpZGF0ZSA+IGxpZ2h0UmFuZ2UpIHtcclxuICAgIC8vIG11c3QgYmUgZ3JleVxyXG4gICAgY29uc3QgZ3JleUluZGV4SW5HcmV5cyA9IE1hdGgucm91bmQobDAgKiAoZ3JleVJhbmdlIC0gMSkpXHJcblxyXG4gICAgcmV0dXJuIGdyZXlTdGFydEluZGV4ICsgZ3JleUluZGV4SW5HcmV5c1xyXG4gIH1cclxuICBjb25zdCBsSW5kZXggPSBsQ2FuZGlkYXRlIC0gMVxyXG5cclxuICAvL3ZhbGlkIGhJbmRleCwgc0luZGV4LCBhbmQgbEluZGV4OyBjb2xvciB3aXRoaW4gdGhlIHJhbXBzXHJcbiAgY29uc3QgY29sb3JJbmRleCA9IChcclxuICAgIGhJbmRleCAqIChzYXRSYW5nZSAqIGxpZ2h0UmFuZ2UpICsgc0luZGV4ICogbGlnaHRSYW5nZSArIGxJbmRleFxyXG4gIClcclxuXHJcbiAgcmV0dXJuIGNvbG9ySW5kZXhcclxufVxyXG5cclxuZXhwb3J0IGNvbnN0IGluZGV4T2ZDbG9zZXN0UmdiID0gKHBhbGV0dGU6IEdlbmVyYXRlZFBhbGV0dGUsIHJnYjogVDMpOiBudW1iZXIgPT5cclxuICBpbmRleE9mQ2xvc2VzdEhzbChwYWxldHRlLCByZ2JUb0hzbChyZ2IpKVxyXG5cclxuLy9cclxuXHJcbmNvbnN0IHsgbWluLCBtYXgsIHJvdW5kIH0gPSBNYXRoXHJcblxyXG5leHBvcnQgY29uc3QgaHNsVG9SZ2IgPSAoW2gsIHMsIGxdOiBUMyk6IFQzID0+IHtcclxuICBsZXQgcjogbnVtYmVyXHJcbiAgbGV0IGc6IG51bWJlclxyXG4gIGxldCBiOiBudW1iZXJcclxuXHJcbiAgaWYgKHMgPT09IDApIHtcclxuICAgIHIgPSBnID0gYiA9IGwgLy8gYWNocm9tYXRpY1xyXG4gIH0gZWxzZSB7XHJcbiAgICBjb25zdCBxID0gbCA8IDAuNSA/IGwgKiAoMSArIHMpIDogbCArIHMgLSBsICogc1xyXG4gICAgY29uc3QgcCA9IDIgKiBsIC0gcVxyXG5cclxuICAgIHIgPSBodWVUb1JnYihwLCBxLCBoICsgMSAvIDMpXHJcbiAgICBnID0gaHVlVG9SZ2IocCwgcSwgaClcclxuICAgIGIgPSBodWVUb1JnYihwLCBxLCBoIC0gMSAvIDMpXHJcbiAgfVxyXG5cclxuICByZXR1cm4gW3JvdW5kKHIgKiAyNTUpLCByb3VuZChnICogMjU1KSwgcm91bmQoYiAqIDI1NSldXHJcbn1cclxuXHJcbmNvbnN0IGh1ZVRvUmdiID0gKHA6IG51bWJlciwgcTogbnVtYmVyLCB0OiBudW1iZXIpID0+IHtcclxuICBpZiAodCA8IDApIHQgKz0gMVxyXG4gIGlmICh0ID4gMSkgdCAtPSAxXHJcbiAgaWYgKHQgPCAxIC8gNikgcmV0dXJuIHAgKyAocSAtIHApICogNiAqIHRcclxuICBpZiAodCA8IDEgLyAyKSByZXR1cm4gcVxyXG4gIGlmICh0IDwgMiAvIDMpIHJldHVybiBwICsgKHEgLSBwKSAqICgyIC8gMyAtIHQpICogNlxyXG5cclxuICByZXR1cm4gcFxyXG59XHJcblxyXG5leHBvcnQgY29uc3QgcmdiVG9Ic2wgPSAoW3IsIGcsIGJdOiBUMyk6IFQzID0+IHtcclxuICByIC89IDI1NVxyXG4gIGcgLz0gMjU1XHJcbiAgYiAvPSAyNTVcclxuXHJcbiAgY29uc3Qgdm1heCA9IG1heChyLCBnLCBiKVxyXG4gIGNvbnN0IHZtaW4gPSBtaW4ociwgZywgYilcclxuICBsZXQgaDogbnVtYmVyXHJcbiAgbGV0IHM6IG51bWJlclxyXG4gIGxldCBsOiBudW1iZXJcclxuXHJcbiAgaCA9IGwgPSAodm1heCArIHZtaW4pIC8gMlxyXG5cclxuICBpZiAodm1heCA9PT0gdm1pbikge1xyXG4gICAgcmV0dXJuIFswLCAwLCBsXSAvLyBhY2hyb21hdGljXHJcbiAgfVxyXG5cclxuICBjb25zdCBkID0gdm1heCAtIHZtaW5cclxuICBzID0gbCA+IDAuNSA/IGQgLyAoMiAtIHZtYXggLSB2bWluKSA6IGQgLyAodm1heCArIHZtaW4pXHJcbiAgaWYgKHZtYXggPT09IHIpIGggPSAoZyAtIGIpIC8gZCArIChnIDwgYiA/IDYgOiAwKVxyXG4gIGlmICh2bWF4ID09PSBnKSBoID0gKGIgLSByKSAvIGQgKyAyXHJcbiAgaWYgKHZtYXggPT09IGIpIGggPSAociAtIGcpIC8gZCArIDRcclxuICBoIC89IDZcclxuXHJcbiAgcmV0dXJuIFtoLCBzLCBsXVxyXG59XHJcbiJdfQ==