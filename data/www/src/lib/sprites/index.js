import { countCells, generateGridLayout } from '../grid/index.js';
import { assrt } from '../util.js';
// for sheets where all sprites are same size and laid out uniformly.
// otherwise, write a custom function for the use case
export const createSpriteSheet = (image, cellW, cellH, names = [], gap = 0, padding = 0) => {
    const cols = countCells(image.width, cellW, gap, padding);
    const rows = countCells(image.height, cellH, gap, padding);
    const spriteCount = cols * rows;
    const grid = generateGridLayout(cellW, cellH, cols, rows, gap, padding);
    const sheet = {
        image,
        rects: Array(spriteCount),
        names: new Map()
    };
    for (let i = 0; i < spriteCount; i++) {
        const cell = grid.cells[i];
        sheet.rects[i] = [...cell, cellW, cellH];
        if (names[i]) {
            sheet.names.set(names[i], i);
        }
    }
    return sheet;
};
export const getSpriteIndex = (sheet, spriteName) => assrt(sheet.names.get(spriteName), `Sprite ${spriteName} not found`);
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi9zcmMvbGliL3Nwcml0ZXMvaW5kZXgudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsT0FBTyxFQUFFLFVBQVUsRUFBRSxrQkFBa0IsRUFBRSxNQUFNLGtCQUFrQixDQUFBO0FBRWpFLE9BQU8sRUFBRSxLQUFLLEVBQUUsTUFBTSxZQUFZLENBQUE7QUFHbEMscUVBQXFFO0FBQ3JFLHNEQUFzRDtBQUN0RCxNQUFNLENBQUMsTUFBTSxpQkFBaUIsR0FBRyxDQUMvQixLQUFnQixFQUFFLEtBQWEsRUFBRSxLQUFhLEVBQzlDLFFBQWtCLEVBQUUsRUFBRSxHQUFHLEdBQUcsQ0FBQyxFQUFFLE9BQU8sR0FBRyxDQUFDLEVBQzFDLEVBQUU7SUFDRixNQUFNLElBQUksR0FBRyxVQUFVLENBQUMsS0FBSyxDQUFDLEtBQUssRUFBRSxLQUFLLEVBQUUsR0FBRyxFQUFFLE9BQU8sQ0FBQyxDQUFBO0lBQ3pELE1BQU0sSUFBSSxHQUFHLFVBQVUsQ0FBQyxLQUFLLENBQUMsTUFBTSxFQUFFLEtBQUssRUFBRSxHQUFHLEVBQUUsT0FBTyxDQUFDLENBQUE7SUFDMUQsTUFBTSxXQUFXLEdBQUcsSUFBSSxHQUFHLElBQUksQ0FBQTtJQUUvQixNQUFNLElBQUksR0FBRyxrQkFBa0IsQ0FBQyxLQUFLLEVBQUUsS0FBSyxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUUsR0FBRyxFQUFFLE9BQU8sQ0FBQyxDQUFBO0lBRXZFLE1BQU0sS0FBSyxHQUFnQjtRQUN6QixLQUFLO1FBQ0wsS0FBSyxFQUFFLEtBQUssQ0FBSyxXQUFXLENBQUM7UUFDN0IsS0FBSyxFQUFFLElBQUksR0FBRyxFQUFrQjtLQUNqQyxDQUFBO0lBRUQsS0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLFdBQVcsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDO1FBQ3JDLE1BQU0sSUFBSSxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUE7UUFFMUIsS0FBSyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLEdBQUcsSUFBSSxFQUFFLEtBQUssRUFBRSxLQUFLLENBQUMsQ0FBQTtRQUV4QyxJQUFJLEtBQUssQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDO1lBQ2IsS0FBSyxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFBO1FBQzlCLENBQUM7SUFDSCxDQUFDO0lBRUQsT0FBTyxLQUFLLENBQUE7QUFDZCxDQUFDLENBQUE7QUFFRCxNQUFNLENBQUMsTUFBTSxjQUFjLEdBQUcsQ0FBQyxLQUFrQixFQUFFLFVBQWtCLEVBQUUsRUFBRSxDQUN2RSxLQUFLLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsVUFBVSxDQUFDLEVBQUUsVUFBVSxVQUFVLFlBQVksQ0FBQyxDQUFBIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgY291bnRDZWxscywgZ2VuZXJhdGVHcmlkTGF5b3V0IH0gZnJvbSAnLi4vZ3JpZC9pbmRleC5qcydcclxuaW1wb3J0IHsgVDQgfSBmcm9tICcuLi90eXBlcy5qcydcclxuaW1wb3J0IHsgYXNzcnQgfSBmcm9tICcuLi91dGlsLmpzJ1xyXG5pbXBvcnQgeyBTcHJpdGVzaGVldCB9IGZyb20gJy4vdHlwZXMuanMnXHJcblxyXG4vLyBmb3Igc2hlZXRzIHdoZXJlIGFsbCBzcHJpdGVzIGFyZSBzYW1lIHNpemUgYW5kIGxhaWQgb3V0IHVuaWZvcm1seS5cclxuLy8gb3RoZXJ3aXNlLCB3cml0ZSBhIGN1c3RvbSBmdW5jdGlvbiBmb3IgdGhlIHVzZSBjYXNlXHJcbmV4cG9ydCBjb25zdCBjcmVhdGVTcHJpdGVTaGVldCA9IChcclxuICBpbWFnZTogSW1hZ2VEYXRhLCBjZWxsVzogbnVtYmVyLCBjZWxsSDogbnVtYmVyLFxyXG4gIG5hbWVzOiBzdHJpbmdbXSA9IFtdLCBnYXAgPSAwLCBwYWRkaW5nID0gMFxyXG4pID0+IHtcclxuICBjb25zdCBjb2xzID0gY291bnRDZWxscyhpbWFnZS53aWR0aCwgY2VsbFcsIGdhcCwgcGFkZGluZylcclxuICBjb25zdCByb3dzID0gY291bnRDZWxscyhpbWFnZS5oZWlnaHQsIGNlbGxILCBnYXAsIHBhZGRpbmcpXHJcbiAgY29uc3Qgc3ByaXRlQ291bnQgPSBjb2xzICogcm93c1xyXG5cclxuICBjb25zdCBncmlkID0gZ2VuZXJhdGVHcmlkTGF5b3V0KGNlbGxXLCBjZWxsSCwgY29scywgcm93cywgZ2FwLCBwYWRkaW5nKVxyXG5cclxuICBjb25zdCBzaGVldDogU3ByaXRlc2hlZXQgPSB7XHJcbiAgICBpbWFnZSxcclxuICAgIHJlY3RzOiBBcnJheTxUND4oc3ByaXRlQ291bnQpLFxyXG4gICAgbmFtZXM6IG5ldyBNYXA8c3RyaW5nLCBudW1iZXI+KClcclxuICB9XHJcblxyXG4gIGZvciAobGV0IGkgPSAwOyBpIDwgc3ByaXRlQ291bnQ7IGkrKykge1xyXG4gICAgY29uc3QgY2VsbCA9IGdyaWQuY2VsbHNbaV1cclxuXHJcbiAgICBzaGVldC5yZWN0c1tpXSA9IFsuLi5jZWxsLCBjZWxsVywgY2VsbEhdXHJcblxyXG4gICAgaWYgKG5hbWVzW2ldKSB7XHJcbiAgICAgIHNoZWV0Lm5hbWVzLnNldChuYW1lc1tpXSwgaSlcclxuICAgIH1cclxuICB9XHJcblxyXG4gIHJldHVybiBzaGVldFxyXG59XHJcblxyXG5leHBvcnQgY29uc3QgZ2V0U3ByaXRlSW5kZXggPSAoc2hlZXQ6IFNwcml0ZXNoZWV0LCBzcHJpdGVOYW1lOiBzdHJpbmcpID0+XHJcbiAgYXNzcnQoc2hlZXQubmFtZXMuZ2V0KHNwcml0ZU5hbWUpLCBgU3ByaXRlICR7c3ByaXRlTmFtZX0gbm90IGZvdW5kYClcclxuIl19