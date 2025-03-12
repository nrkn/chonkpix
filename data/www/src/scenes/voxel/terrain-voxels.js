import { generateHeightmap } from '../../lib/heightmap/generate/index.js';
import { raiseRect, lowerRect, flattenRect } from '../../lib/heightmap/sculpt.js';
import { normalizeHeightmap, heightmapToPoint3, minHeight, maxHeight } from '../../lib/heightmap/util.js';
import { randInt } from '../../lib/random.js';
import { createWall, createPlane } from '../../lib/voxel/generate/create.js';
const mapW = 192;
const mapH = 192;
export const generateTerrainVoxels = async (state) => {
    const buffer = state.view.getBuffer();
    const { width, height } = buffer;
    // 100 ticks for hm generation
    // 1 tick for sculpting
    // 10 ticks for converting
    // 10 ticks for sorting
    const startHmTime = performance.now();
    let hm = generateHeightmap(mapW, mapH, mapW * mapH * 8);
    hm = normalizeHeightmap(hm);
    const endHmTime = performance.now();
    console.log(`heightmap generation took ${endHmTime - startHmTime}ms`);
    // sculpt the heightmap
    const startSculptTime = performance.now();
    const raisedHeight = raiseRect(hm, 96, 80, 16, 12);
    // x0,z0,x1,z1,y0,h - 3d coordinate system of voxel space
    const rTopWall = createWall(97, 111, 110, 111, raisedHeight, 8);
    const rBottomWall = createWall(97, 101, 110, 101, raisedHeight, 8);
    const rLeftWall = createWall(97, 110, 97, 102, raisedHeight, 8);
    const rRightWall = createWall(110, 110, 110, 102, raisedHeight, 8);
    const rRoof = createPlane(97, raisedHeight + 8, 101, 14, 10);
    const rWalls = [
        ...rTopWall,
        ...rBottomWall,
        ...rLeftWall,
        ...rRightWall,
        ...rRoof
    ];
    const loweredHeight = lowerRect(hm, 32, 48, 12, 16);
    const flattenedHeight = flattenRect(hm, 64, 64, 16, 24);
    const endSculptTime = performance.now();
    console.log(`sculpting took ${endSculptTime - startSculptTime}ms`);
    // convert the buildings
    const startConvertTime = performance.now();
    const rWallsVox = rWalls.map(([x, y, z]) => {
        let fcolor = 0;
        let tcolor = 0;
        const d = mapH * 2;
        const darken = 1 - z / d;
        const v = randInt(32) - 16;
        const grey = (v + 128 + y * 0.5) * darken;
        const darkGrey = grey * 0.75;
        fcolor = 0xff000000 | (grey << 16) | (grey << 8) | grey;
        tcolor = 0xff000000 | (darkGrey << 16) | (darkGrey << 8) | darkGrey;
        return [x, y, z, tcolor, fcolor];
    });
    // convert the hm
    const hmP3s = heightmapToPoint3(hm);
    const hmMin = minHeight(hm);
    const hmMax = maxHeight(hm);
    const hmDelta = hmMax - hmMin;
    const greenRange = mapH;
    const greenStep = greenRange / hmDelta;
    const hmP3sVox = hmP3s.map(([x, y, z]) => {
        let hmTopColor = 0;
        let hmFrontColor = 0;
        // darken slightly as z increases
        // lower d numbers = more dark, higher = less dark
        const d = mapH * 2;
        const darken = 1 - z / d;
        // add a little randomness to the green color by using small red/blue values
        const red = (randInt(32) + 16); //* darken
        const darkRed = red * 0.75;
        const blue = (randInt(32) + 16); //* darken
        const darkBlue = blue * 0.75;
        // top should gets brighter as y increases
        // front should be top but darkened a bit
        //
        // make it a little random so it looks more interesting
        const g = randInt(32) - 16;
        // then apply a gradient based on height
        const green = (g + 64 + y * greenStep) * darken;
        const darkGreen = green * 0.75;
        hmTopColor = 0xff000000 | (blue << 16) | (green << 8) | red;
        hmFrontColor = 0xff000000 | (darkBlue << 16) | (darkGreen << 8) | darkRed;
        return [x, y, z, hmTopColor, hmFrontColor];
    });
    const endConvertTime = performance.now();
    console.log(`converting took ${endConvertTime - startConvertTime}ms`);
    // create and sort voxels
    const startVoxTime = performance.now();
    const voxels = [];
    voxels.push(...rWallsVox);
    voxels.push(...hmP3sVox);
    voxels.sort((a, b) => {
        // sort on z - bigger is further away
        const zDelta = b[2] - a[2];
        if (zDelta !== 0) {
            return zDelta;
        }
        // tie break on y - we want to sort smaller y first
        // so that the "tops" of voxels overlay correctly
        return a[1] - b[1];
    });
    const endVoxTime = performance.now();
    console.log(`voxel creation took ${endVoxTime - startVoxTime}ms`);
    console.log(`total time: ${endVoxTime - startHmTime}ms`);
    console.log(`voxel count: ${voxels.length}`);
    return voxels;
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVycmFpbi12b3hlbHMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi9zcmMvc2NlbmVzL3ZveGVsL3RlcnJhaW4tdm94ZWxzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLE9BQU8sRUFBRSxpQkFBaUIsRUFBRSxNQUFNLHVDQUF1QyxDQUFBO0FBQ3pFLE9BQU8sRUFBRSxTQUFTLEVBQUUsU0FBUyxFQUFFLFdBQVcsRUFBRSxNQUFNLCtCQUErQixDQUFBO0FBQ2pGLE9BQU8sRUFBRSxrQkFBa0IsRUFBRSxpQkFBaUIsRUFBRSxTQUFTLEVBQUUsU0FBUyxFQUFFLE1BQU0sNkJBQTZCLENBQUE7QUFDekcsT0FBTyxFQUFFLE9BQU8sRUFBRSxNQUFNLHFCQUFxQixDQUFBO0FBRTdDLE9BQU8sRUFBRSxVQUFVLEVBQUUsV0FBVyxFQUFFLE1BQU0sb0NBQW9DLENBQUE7QUFHNUUsTUFBTSxJQUFJLEdBQUcsR0FBRyxDQUFBO0FBQ2hCLE1BQU0sSUFBSSxHQUFHLEdBQUcsQ0FBQTtBQUVoQixNQUFNLENBQUMsTUFBTSxxQkFBcUIsR0FBRyxLQUFLLEVBQUUsS0FBWSxFQUFFLEVBQUU7SUFDMUQsTUFBTSxNQUFNLEdBQUcsS0FBSyxDQUFDLElBQUksQ0FBQyxTQUFTLEVBQUUsQ0FBQTtJQUNyQyxNQUFNLEVBQUUsS0FBSyxFQUFFLE1BQU0sRUFBRSxHQUFHLE1BQU0sQ0FBQTtJQUVoQyw4QkFBOEI7SUFDOUIsdUJBQXVCO0lBQ3ZCLDBCQUEwQjtJQUMxQix1QkFBdUI7SUFFdkIsTUFBTSxXQUFXLEdBQUcsV0FBVyxDQUFDLEdBQUcsRUFBRSxDQUFBO0lBRXJDLElBQUksRUFBRSxHQUFHLGlCQUFpQixDQUFDLElBQUksRUFBRSxJQUFJLEVBQUUsSUFBSSxHQUFHLElBQUksR0FBRyxDQUFDLENBQUMsQ0FBQTtJQUV2RCxFQUFFLEdBQUcsa0JBQWtCLENBQUMsRUFBRSxDQUFDLENBQUE7SUFFM0IsTUFBTSxTQUFTLEdBQUcsV0FBVyxDQUFDLEdBQUcsRUFBRSxDQUFBO0lBRW5DLE9BQU8sQ0FBQyxHQUFHLENBQUMsNkJBQTZCLFNBQVMsR0FBRyxXQUFXLElBQUksQ0FBQyxDQUFBO0lBRXJFLHVCQUF1QjtJQUV2QixNQUFNLGVBQWUsR0FBRyxXQUFXLENBQUMsR0FBRyxFQUFFLENBQUE7SUFFekMsTUFBTSxZQUFZLEdBQUcsU0FBUyxDQUFDLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLENBQUMsQ0FBQTtJQUVsRCx5REFBeUQ7SUFDekQsTUFBTSxRQUFRLEdBQUcsVUFBVSxDQUFDLEVBQUUsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxZQUFZLEVBQUUsQ0FBQyxDQUFDLENBQUE7SUFDL0QsTUFBTSxXQUFXLEdBQUcsVUFBVSxDQUFDLEVBQUUsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxZQUFZLEVBQUUsQ0FBQyxDQUFDLENBQUE7SUFDbEUsTUFBTSxTQUFTLEdBQUcsVUFBVSxDQUFDLEVBQUUsRUFBRSxHQUFHLEVBQUUsRUFBRSxFQUFFLEdBQUcsRUFBRSxZQUFZLEVBQUUsQ0FBQyxDQUFDLENBQUE7SUFDL0QsTUFBTSxVQUFVLEdBQUcsVUFBVSxDQUFDLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxZQUFZLEVBQUUsQ0FBQyxDQUFDLENBQUE7SUFFbEUsTUFBTSxLQUFLLEdBQUcsV0FBVyxDQUFDLEVBQUUsRUFBRSxZQUFZLEdBQUcsQ0FBQyxFQUFFLEdBQUcsRUFBRSxFQUFFLEVBQUUsRUFBRSxDQUFDLENBQUE7SUFFNUQsTUFBTSxNQUFNLEdBQUc7UUFDYixHQUFHLFFBQVE7UUFDWCxHQUFHLFdBQVc7UUFDZCxHQUFHLFNBQVM7UUFDWixHQUFHLFVBQVU7UUFDYixHQUFHLEtBQUs7S0FDVCxDQUFBO0lBRUQsTUFBTSxhQUFhLEdBQUcsU0FBUyxDQUFDLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLENBQUMsQ0FBQTtJQUVuRCxNQUFNLGVBQWUsR0FBRyxXQUFXLENBQUMsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsQ0FBQyxDQUFBO0lBRXZELE1BQU0sYUFBYSxHQUFHLFdBQVcsQ0FBQyxHQUFHLEVBQUUsQ0FBQTtJQUV2QyxPQUFPLENBQUMsR0FBRyxDQUFDLGtCQUFrQixhQUFhLEdBQUcsZUFBZSxJQUFJLENBQUMsQ0FBQTtJQUVsRSx3QkFBd0I7SUFFeEIsTUFBTSxnQkFBZ0IsR0FBRyxXQUFXLENBQUMsR0FBRyxFQUFFLENBQUE7SUFFMUMsTUFBTSxTQUFTLEdBQUcsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsRUFBRSxFQUFFO1FBQ3pDLElBQUksTUFBTSxHQUFHLENBQUMsQ0FBQTtRQUNkLElBQUksTUFBTSxHQUFHLENBQUMsQ0FBQTtRQUVkLE1BQU0sQ0FBQyxHQUFHLElBQUksR0FBRyxDQUFDLENBQUE7UUFDbEIsTUFBTSxNQUFNLEdBQUcsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUE7UUFFeEIsTUFBTSxDQUFDLEdBQUcsT0FBTyxDQUFDLEVBQUUsQ0FBQyxHQUFHLEVBQUUsQ0FBQTtRQUUxQixNQUFNLElBQUksR0FBRyxDQUFDLENBQUMsR0FBRyxHQUFHLEdBQUcsQ0FBQyxHQUFHLEdBQUcsQ0FBQyxHQUFHLE1BQU0sQ0FBQTtRQUN6QyxNQUFNLFFBQVEsR0FBRyxJQUFJLEdBQUcsSUFBSSxDQUFBO1FBRTVCLE1BQU0sR0FBRyxVQUFVLEdBQUcsQ0FBQyxJQUFJLElBQUksRUFBRSxDQUFDLEdBQUcsQ0FBQyxJQUFJLElBQUksQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFBO1FBQ3ZELE1BQU0sR0FBRyxVQUFVLEdBQUcsQ0FBQyxRQUFRLElBQUksRUFBRSxDQUFDLEdBQUcsQ0FBQyxRQUFRLElBQUksQ0FBQyxDQUFDLEdBQUcsUUFBUSxDQUFBO1FBRW5FLE9BQU8sQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxNQUFNLEVBQUUsTUFBTSxDQUFRLENBQUE7SUFDekMsQ0FBQyxDQUFDLENBQUE7SUFFRixpQkFBaUI7SUFFakIsTUFBTSxLQUFLLEdBQUcsaUJBQWlCLENBQUMsRUFBRSxDQUFDLENBQUE7SUFFbkMsTUFBTSxLQUFLLEdBQUcsU0FBUyxDQUFDLEVBQUUsQ0FBQyxDQUFBO0lBQzNCLE1BQU0sS0FBSyxHQUFHLFNBQVMsQ0FBQyxFQUFFLENBQUMsQ0FBQTtJQUUzQixNQUFNLE9BQU8sR0FBRyxLQUFLLEdBQUcsS0FBSyxDQUFBO0lBRTdCLE1BQU0sVUFBVSxHQUFHLElBQUksQ0FBQTtJQUV2QixNQUFNLFNBQVMsR0FBRyxVQUFVLEdBQUcsT0FBTyxDQUFBO0lBRXRDLE1BQU0sUUFBUSxHQUFHLEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLEVBQUUsRUFBRTtRQUN2QyxJQUFJLFVBQVUsR0FBRyxDQUFDLENBQUE7UUFDbEIsSUFBSSxZQUFZLEdBQUcsQ0FBQyxDQUFBO1FBRXBCLGlDQUFpQztRQUNqQyxrREFBa0Q7UUFDbEQsTUFBTSxDQUFDLEdBQUcsSUFBSSxHQUFHLENBQUMsQ0FBQTtRQUNsQixNQUFNLE1BQU0sR0FBRyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQTtRQUV4Qiw0RUFBNEU7UUFDNUUsTUFBTSxHQUFHLEdBQUcsQ0FBQyxPQUFPLENBQUMsRUFBRSxDQUFDLEdBQUcsRUFBRSxDQUFDLENBQUEsQ0FBQyxVQUFVO1FBQ3pDLE1BQU0sT0FBTyxHQUFHLEdBQUcsR0FBRyxJQUFJLENBQUE7UUFDMUIsTUFBTSxJQUFJLEdBQUcsQ0FBQyxPQUFPLENBQUMsRUFBRSxDQUFDLEdBQUcsRUFBRSxDQUFDLENBQUEsQ0FBQyxVQUFVO1FBQzFDLE1BQU0sUUFBUSxHQUFHLElBQUksR0FBRyxJQUFJLENBQUE7UUFFNUIsMENBQTBDO1FBQzFDLHlDQUF5QztRQUN6QyxFQUFFO1FBQ0YsdURBQXVEO1FBQ3ZELE1BQU0sQ0FBQyxHQUFHLE9BQU8sQ0FBQyxFQUFFLENBQUMsR0FBRyxFQUFFLENBQUE7UUFDMUIsd0NBQXdDO1FBQ3hDLE1BQU0sS0FBSyxHQUFHLENBQUMsQ0FBQyxHQUFHLEVBQUUsR0FBRyxDQUFDLEdBQUcsU0FBUyxDQUFDLEdBQUcsTUFBTSxDQUFBO1FBQy9DLE1BQU0sU0FBUyxHQUFHLEtBQUssR0FBRyxJQUFJLENBQUE7UUFFOUIsVUFBVSxHQUFHLFVBQVUsR0FBRyxDQUFDLElBQUksSUFBSSxFQUFFLENBQUMsR0FBRyxDQUFDLEtBQUssSUFBSSxDQUFDLENBQUMsR0FBRyxHQUFHLENBQUE7UUFDM0QsWUFBWSxHQUFHLFVBQVUsR0FBRyxDQUFDLFFBQVEsSUFBSSxFQUFFLENBQUMsR0FBRyxDQUFDLFNBQVMsSUFBSSxDQUFDLENBQUMsR0FBRyxPQUFPLENBQUE7UUFFekUsT0FBTyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLFVBQVUsRUFBRSxZQUFZLENBQVEsQ0FBQTtJQUNuRCxDQUFDLENBQUMsQ0FBQTtJQUVGLE1BQU0sY0FBYyxHQUFHLFdBQVcsQ0FBQyxHQUFHLEVBQUUsQ0FBQTtJQUV4QyxPQUFPLENBQUMsR0FBRyxDQUFDLG1CQUFtQixjQUFjLEdBQUcsZ0JBQWdCLElBQUksQ0FBQyxDQUFBO0lBRXJFLHlCQUF5QjtJQUV6QixNQUFNLFlBQVksR0FBRyxXQUFXLENBQUMsR0FBRyxFQUFFLENBQUE7SUFFdEMsTUFBTSxNQUFNLEdBQVUsRUFBRSxDQUFBO0lBRXhCLE1BQU0sQ0FBQyxJQUFJLENBQUMsR0FBRyxTQUFTLENBQUMsQ0FBQTtJQUN6QixNQUFNLENBQUMsSUFBSSxDQUFDLEdBQUcsUUFBUSxDQUFDLENBQUE7SUFFeEIsTUFBTSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsRUFBRTtRQUNuQixxQ0FBcUM7UUFDckMsTUFBTSxNQUFNLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQTtRQUUxQixJQUFJLE1BQU0sS0FBSyxDQUFDLEVBQUUsQ0FBQztZQUNqQixPQUFPLE1BQU0sQ0FBQTtRQUNmLENBQUM7UUFFRCxtREFBbUQ7UUFDbkQsaURBQWlEO1FBQ2pELE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQTtJQUNwQixDQUFDLENBQUMsQ0FBQTtJQUVGLE1BQU0sVUFBVSxHQUFHLFdBQVcsQ0FBQyxHQUFHLEVBQUUsQ0FBQTtJQUVwQyxPQUFPLENBQUMsR0FBRyxDQUFDLHVCQUF1QixVQUFVLEdBQUcsWUFBWSxJQUFJLENBQUMsQ0FBQTtJQUVqRSxPQUFPLENBQUMsR0FBRyxDQUFDLGVBQWUsVUFBVSxHQUFHLFdBQVcsSUFBSSxDQUFDLENBQUE7SUFDeEQsT0FBTyxDQUFDLEdBQUcsQ0FBQyxnQkFBZ0IsTUFBTSxDQUFDLE1BQU0sRUFBRSxDQUFDLENBQUE7SUFFNUMsT0FBTyxNQUFNLENBQUE7QUFDZixDQUFDLENBQUEiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBnZW5lcmF0ZUhlaWdodG1hcCB9IGZyb20gJy4uLy4uL2xpYi9oZWlnaHRtYXAvZ2VuZXJhdGUvaW5kZXguanMnXHJcbmltcG9ydCB7IHJhaXNlUmVjdCwgbG93ZXJSZWN0LCBmbGF0dGVuUmVjdCB9IGZyb20gJy4uLy4uL2xpYi9oZWlnaHRtYXAvc2N1bHB0LmpzJ1xyXG5pbXBvcnQgeyBub3JtYWxpemVIZWlnaHRtYXAsIGhlaWdodG1hcFRvUG9pbnQzLCBtaW5IZWlnaHQsIG1heEhlaWdodCB9IGZyb20gJy4uLy4uL2xpYi9oZWlnaHRtYXAvdXRpbC5qcydcclxuaW1wb3J0IHsgcmFuZEludCB9IGZyb20gJy4uLy4uL2xpYi9yYW5kb20uanMnXHJcbmltcG9ydCB7IFN0YXRlIH0gZnJvbSAnLi4vLi4vbGliL3R5cGVzLmpzJ1xyXG5pbXBvcnQgeyBjcmVhdGVXYWxsLCBjcmVhdGVQbGFuZSB9IGZyb20gJy4uLy4uL2xpYi92b3hlbC9nZW5lcmF0ZS9jcmVhdGUuanMnXHJcbmltcG9ydCB7IFZveCB9IGZyb20gJy4uLy4uL2xpYi92b3hlbC90eXBlcy5qcydcclxuXHJcbmNvbnN0IG1hcFcgPSAxOTJcclxuY29uc3QgbWFwSCA9IDE5MlxyXG5cclxuZXhwb3J0IGNvbnN0IGdlbmVyYXRlVGVycmFpblZveGVscyA9IGFzeW5jIChzdGF0ZTogU3RhdGUpID0+IHtcclxuICBjb25zdCBidWZmZXIgPSBzdGF0ZS52aWV3LmdldEJ1ZmZlcigpXHJcbiAgY29uc3QgeyB3aWR0aCwgaGVpZ2h0IH0gPSBidWZmZXJcclxuXHJcbiAgLy8gMTAwIHRpY2tzIGZvciBobSBnZW5lcmF0aW9uXHJcbiAgLy8gMSB0aWNrIGZvciBzY3VscHRpbmdcclxuICAvLyAxMCB0aWNrcyBmb3IgY29udmVydGluZ1xyXG4gIC8vIDEwIHRpY2tzIGZvciBzb3J0aW5nXHJcblxyXG4gIGNvbnN0IHN0YXJ0SG1UaW1lID0gcGVyZm9ybWFuY2Uubm93KClcclxuXHJcbiAgbGV0IGhtID0gZ2VuZXJhdGVIZWlnaHRtYXAobWFwVywgbWFwSCwgbWFwVyAqIG1hcEggKiA4KVxyXG5cclxuICBobSA9IG5vcm1hbGl6ZUhlaWdodG1hcChobSlcclxuXHJcbiAgY29uc3QgZW5kSG1UaW1lID0gcGVyZm9ybWFuY2Uubm93KClcclxuXHJcbiAgY29uc29sZS5sb2coYGhlaWdodG1hcCBnZW5lcmF0aW9uIHRvb2sgJHtlbmRIbVRpbWUgLSBzdGFydEhtVGltZX1tc2ApXHJcblxyXG4gIC8vIHNjdWxwdCB0aGUgaGVpZ2h0bWFwXHJcblxyXG4gIGNvbnN0IHN0YXJ0U2N1bHB0VGltZSA9IHBlcmZvcm1hbmNlLm5vdygpXHJcblxyXG4gIGNvbnN0IHJhaXNlZEhlaWdodCA9IHJhaXNlUmVjdChobSwgOTYsIDgwLCAxNiwgMTIpXHJcblxyXG4gIC8vIHgwLHowLHgxLHoxLHkwLGggLSAzZCBjb29yZGluYXRlIHN5c3RlbSBvZiB2b3hlbCBzcGFjZVxyXG4gIGNvbnN0IHJUb3BXYWxsID0gY3JlYXRlV2FsbCg5NywgMTExLCAxMTAsIDExMSwgcmFpc2VkSGVpZ2h0LCA4KVxyXG4gIGNvbnN0IHJCb3R0b21XYWxsID0gY3JlYXRlV2FsbCg5NywgMTAxLCAxMTAsIDEwMSwgcmFpc2VkSGVpZ2h0LCA4KVxyXG4gIGNvbnN0IHJMZWZ0V2FsbCA9IGNyZWF0ZVdhbGwoOTcsIDExMCwgOTcsIDEwMiwgcmFpc2VkSGVpZ2h0LCA4KVxyXG4gIGNvbnN0IHJSaWdodFdhbGwgPSBjcmVhdGVXYWxsKDExMCwgMTEwLCAxMTAsIDEwMiwgcmFpc2VkSGVpZ2h0LCA4KVxyXG5cclxuICBjb25zdCByUm9vZiA9IGNyZWF0ZVBsYW5lKDk3LCByYWlzZWRIZWlnaHQgKyA4LCAxMDEsIDE0LCAxMClcclxuXHJcbiAgY29uc3QgcldhbGxzID0gW1xyXG4gICAgLi4uclRvcFdhbGwsXHJcbiAgICAuLi5yQm90dG9tV2FsbCxcclxuICAgIC4uLnJMZWZ0V2FsbCxcclxuICAgIC4uLnJSaWdodFdhbGwsXHJcbiAgICAuLi5yUm9vZlxyXG4gIF1cclxuXHJcbiAgY29uc3QgbG93ZXJlZEhlaWdodCA9IGxvd2VyUmVjdChobSwgMzIsIDQ4LCAxMiwgMTYpXHJcblxyXG4gIGNvbnN0IGZsYXR0ZW5lZEhlaWdodCA9IGZsYXR0ZW5SZWN0KGhtLCA2NCwgNjQsIDE2LCAyNClcclxuXHJcbiAgY29uc3QgZW5kU2N1bHB0VGltZSA9IHBlcmZvcm1hbmNlLm5vdygpXHJcblxyXG4gIGNvbnNvbGUubG9nKGBzY3VscHRpbmcgdG9vayAke2VuZFNjdWxwdFRpbWUgLSBzdGFydFNjdWxwdFRpbWV9bXNgKVxyXG5cclxuICAvLyBjb252ZXJ0IHRoZSBidWlsZGluZ3NcclxuXHJcbiAgY29uc3Qgc3RhcnRDb252ZXJ0VGltZSA9IHBlcmZvcm1hbmNlLm5vdygpXHJcblxyXG4gIGNvbnN0IHJXYWxsc1ZveCA9IHJXYWxscy5tYXAoKFt4LCB5LCB6XSkgPT4ge1xyXG4gICAgbGV0IGZjb2xvciA9IDBcclxuICAgIGxldCB0Y29sb3IgPSAwXHJcblxyXG4gICAgY29uc3QgZCA9IG1hcEggKiAyXHJcbiAgICBjb25zdCBkYXJrZW4gPSAxIC0geiAvIGRcclxuXHJcbiAgICBjb25zdCB2ID0gcmFuZEludCgzMikgLSAxNlxyXG5cclxuICAgIGNvbnN0IGdyZXkgPSAodiArIDEyOCArIHkgKiAwLjUpICogZGFya2VuXHJcbiAgICBjb25zdCBkYXJrR3JleSA9IGdyZXkgKiAwLjc1XHJcblxyXG4gICAgZmNvbG9yID0gMHhmZjAwMDAwMCB8IChncmV5IDw8IDE2KSB8IChncmV5IDw8IDgpIHwgZ3JleVxyXG4gICAgdGNvbG9yID0gMHhmZjAwMDAwMCB8IChkYXJrR3JleSA8PCAxNikgfCAoZGFya0dyZXkgPDwgOCkgfCBkYXJrR3JleVxyXG5cclxuICAgIHJldHVybiBbeCwgeSwgeiwgdGNvbG9yLCBmY29sb3JdIGFzIFZveFxyXG4gIH0pXHJcblxyXG4gIC8vIGNvbnZlcnQgdGhlIGhtXHJcblxyXG4gIGNvbnN0IGhtUDNzID0gaGVpZ2h0bWFwVG9Qb2ludDMoaG0pXHJcblxyXG4gIGNvbnN0IGhtTWluID0gbWluSGVpZ2h0KGhtKVxyXG4gIGNvbnN0IGhtTWF4ID0gbWF4SGVpZ2h0KGhtKVxyXG5cclxuICBjb25zdCBobURlbHRhID0gaG1NYXggLSBobU1pblxyXG5cclxuICBjb25zdCBncmVlblJhbmdlID0gbWFwSFxyXG5cclxuICBjb25zdCBncmVlblN0ZXAgPSBncmVlblJhbmdlIC8gaG1EZWx0YVxyXG5cclxuICBjb25zdCBobVAzc1ZveCA9IGhtUDNzLm1hcCgoW3gsIHksIHpdKSA9PiB7XHJcbiAgICBsZXQgaG1Ub3BDb2xvciA9IDBcclxuICAgIGxldCBobUZyb250Q29sb3IgPSAwXHJcblxyXG4gICAgLy8gZGFya2VuIHNsaWdodGx5IGFzIHogaW5jcmVhc2VzXHJcbiAgICAvLyBsb3dlciBkIG51bWJlcnMgPSBtb3JlIGRhcmssIGhpZ2hlciA9IGxlc3MgZGFya1xyXG4gICAgY29uc3QgZCA9IG1hcEggKiAyXHJcbiAgICBjb25zdCBkYXJrZW4gPSAxIC0geiAvIGRcclxuXHJcbiAgICAvLyBhZGQgYSBsaXR0bGUgcmFuZG9tbmVzcyB0byB0aGUgZ3JlZW4gY29sb3IgYnkgdXNpbmcgc21hbGwgcmVkL2JsdWUgdmFsdWVzXHJcbiAgICBjb25zdCByZWQgPSAocmFuZEludCgzMikgKyAxNikgLy8qIGRhcmtlblxyXG4gICAgY29uc3QgZGFya1JlZCA9IHJlZCAqIDAuNzVcclxuICAgIGNvbnN0IGJsdWUgPSAocmFuZEludCgzMikgKyAxNikgLy8qIGRhcmtlblxyXG4gICAgY29uc3QgZGFya0JsdWUgPSBibHVlICogMC43NVxyXG5cclxuICAgIC8vIHRvcCBzaG91bGQgZ2V0cyBicmlnaHRlciBhcyB5IGluY3JlYXNlc1xyXG4gICAgLy8gZnJvbnQgc2hvdWxkIGJlIHRvcCBidXQgZGFya2VuZWQgYSBiaXRcclxuICAgIC8vXHJcbiAgICAvLyBtYWtlIGl0IGEgbGl0dGxlIHJhbmRvbSBzbyBpdCBsb29rcyBtb3JlIGludGVyZXN0aW5nXHJcbiAgICBjb25zdCBnID0gcmFuZEludCgzMikgLSAxNlxyXG4gICAgLy8gdGhlbiBhcHBseSBhIGdyYWRpZW50IGJhc2VkIG9uIGhlaWdodFxyXG4gICAgY29uc3QgZ3JlZW4gPSAoZyArIDY0ICsgeSAqIGdyZWVuU3RlcCkgKiBkYXJrZW5cclxuICAgIGNvbnN0IGRhcmtHcmVlbiA9IGdyZWVuICogMC43NVxyXG5cclxuICAgIGhtVG9wQ29sb3IgPSAweGZmMDAwMDAwIHwgKGJsdWUgPDwgMTYpIHwgKGdyZWVuIDw8IDgpIHwgcmVkXHJcbiAgICBobUZyb250Q29sb3IgPSAweGZmMDAwMDAwIHwgKGRhcmtCbHVlIDw8IDE2KSB8IChkYXJrR3JlZW4gPDwgOCkgfCBkYXJrUmVkXHJcblxyXG4gICAgcmV0dXJuIFt4LCB5LCB6LCBobVRvcENvbG9yLCBobUZyb250Q29sb3JdIGFzIFZveFxyXG4gIH0pXHJcblxyXG4gIGNvbnN0IGVuZENvbnZlcnRUaW1lID0gcGVyZm9ybWFuY2Uubm93KClcclxuXHJcbiAgY29uc29sZS5sb2coYGNvbnZlcnRpbmcgdG9vayAke2VuZENvbnZlcnRUaW1lIC0gc3RhcnRDb252ZXJ0VGltZX1tc2ApXHJcblxyXG4gIC8vIGNyZWF0ZSBhbmQgc29ydCB2b3hlbHNcclxuXHJcbiAgY29uc3Qgc3RhcnRWb3hUaW1lID0gcGVyZm9ybWFuY2Uubm93KClcclxuXHJcbiAgY29uc3Qgdm94ZWxzOiBWb3hbXSA9IFtdXHJcblxyXG4gIHZveGVscy5wdXNoKC4uLnJXYWxsc1ZveClcclxuICB2b3hlbHMucHVzaCguLi5obVAzc1ZveClcclxuXHJcbiAgdm94ZWxzLnNvcnQoKGEsIGIpID0+IHtcclxuICAgIC8vIHNvcnQgb24geiAtIGJpZ2dlciBpcyBmdXJ0aGVyIGF3YXlcclxuICAgIGNvbnN0IHpEZWx0YSA9IGJbMl0gLSBhWzJdXHJcblxyXG4gICAgaWYgKHpEZWx0YSAhPT0gMCkge1xyXG4gICAgICByZXR1cm4gekRlbHRhXHJcbiAgICB9XHJcblxyXG4gICAgLy8gdGllIGJyZWFrIG9uIHkgLSB3ZSB3YW50IHRvIHNvcnQgc21hbGxlciB5IGZpcnN0XHJcbiAgICAvLyBzbyB0aGF0IHRoZSBcInRvcHNcIiBvZiB2b3hlbHMgb3ZlcmxheSBjb3JyZWN0bHlcclxuICAgIHJldHVybiBhWzFdIC0gYlsxXVxyXG4gIH0pXHJcblxyXG4gIGNvbnN0IGVuZFZveFRpbWUgPSBwZXJmb3JtYW5jZS5ub3coKVxyXG5cclxuICBjb25zb2xlLmxvZyhgdm94ZWwgY3JlYXRpb24gdG9vayAke2VuZFZveFRpbWUgLSBzdGFydFZveFRpbWV9bXNgKVxyXG5cclxuICBjb25zb2xlLmxvZyhgdG90YWwgdGltZTogJHtlbmRWb3hUaW1lIC0gc3RhcnRIbVRpbWV9bXNgKVxyXG4gIGNvbnNvbGUubG9nKGB2b3hlbCBjb3VudDogJHt2b3hlbHMubGVuZ3RofWApXHJcblxyXG4gIHJldHVybiB2b3hlbHNcclxufSJdfQ==