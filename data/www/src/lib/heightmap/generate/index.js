import { randInt } from '../../random.js';
import { lower, raise } from '../sculpt.js';
export const generateHeightmap = (width, height, times = width * height * 8) => {
    const size = width * height;
    const data = new Uint8ClampedArray(size).fill(127);
    const heightmap = { width, height, data };
    for (let i = 0; i < times; i++) {
        const x = randInt(width);
        const y = randInt(height);
        if (randInt(2)) {
            raise(heightmap, x, y);
        }
        else {
            lower(heightmap, x, y);
        }
    }
    return heightmap;
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi9zcmMvbGliL2hlaWdodG1hcC9nZW5lcmF0ZS9pbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxPQUFPLEVBQUUsT0FBTyxFQUFFLE1BQU0saUJBQWlCLENBQUE7QUFDekMsT0FBTyxFQUFFLEtBQUssRUFBRSxLQUFLLEVBQUUsTUFBTSxjQUFjLENBQUE7QUFHM0MsTUFBTSxDQUFDLE1BQU0saUJBQWlCLEdBQUcsQ0FDL0IsS0FBYSxFQUFFLE1BQWMsRUFBRSxLQUFLLEdBQUcsS0FBSyxHQUFHLE1BQU0sR0FBRyxDQUFDLEVBQ3pELEVBQUU7SUFDRixNQUFNLElBQUksR0FBRyxLQUFLLEdBQUcsTUFBTSxDQUFBO0lBQzNCLE1BQU0sSUFBSSxHQUFHLElBQUksaUJBQWlCLENBQUMsSUFBSSxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFBO0lBQ2xELE1BQU0sU0FBUyxHQUFjLEVBQUUsS0FBSyxFQUFFLE1BQU0sRUFBRSxJQUFJLEVBQUUsQ0FBQTtJQUVwRCxLQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsS0FBSyxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUM7UUFDL0IsTUFBTSxDQUFDLEdBQUcsT0FBTyxDQUFDLEtBQUssQ0FBQyxDQUFBO1FBQ3hCLE1BQU0sQ0FBQyxHQUFHLE9BQU8sQ0FBQyxNQUFNLENBQUMsQ0FBQTtRQUN6QixJQUFJLE9BQU8sQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDO1lBQ2YsS0FBSyxDQUFDLFNBQVMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUE7UUFDeEIsQ0FBQzthQUFNLENBQUM7WUFDTixLQUFLLENBQUMsU0FBUyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQTtRQUN4QixDQUFDO0lBQ0gsQ0FBQztJQUVELE9BQU8sU0FBUyxDQUFBO0FBQ2xCLENBQUMsQ0FBQSIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IHJhbmRJbnQgfSBmcm9tICcuLi8uLi9yYW5kb20uanMnXHJcbmltcG9ydCB7IGxvd2VyLCByYWlzZSB9IGZyb20gJy4uL3NjdWxwdC5qcydcclxuaW1wb3J0IHsgSGVpZ2h0bWFwIH0gZnJvbSAnLi4vdHlwZXMuanMnXHJcblxyXG5leHBvcnQgY29uc3QgZ2VuZXJhdGVIZWlnaHRtYXAgPSAoXHJcbiAgd2lkdGg6IG51bWJlciwgaGVpZ2h0OiBudW1iZXIsIHRpbWVzID0gd2lkdGggKiBoZWlnaHQgKiA4XHJcbikgPT4ge1xyXG4gIGNvbnN0IHNpemUgPSB3aWR0aCAqIGhlaWdodFxyXG4gIGNvbnN0IGRhdGEgPSBuZXcgVWludDhDbGFtcGVkQXJyYXkoc2l6ZSkuZmlsbCgxMjcpXHJcbiAgY29uc3QgaGVpZ2h0bWFwOiBIZWlnaHRtYXAgPSB7IHdpZHRoLCBoZWlnaHQsIGRhdGEgfVxyXG5cclxuICBmb3IgKGxldCBpID0gMDsgaSA8IHRpbWVzOyBpKyspIHtcclxuICAgIGNvbnN0IHggPSByYW5kSW50KHdpZHRoKVxyXG4gICAgY29uc3QgeSA9IHJhbmRJbnQoaGVpZ2h0KVxyXG4gICAgaWYgKHJhbmRJbnQoMikpIHtcclxuICAgICAgcmFpc2UoaGVpZ2h0bWFwLCB4LCB5KVxyXG4gICAgfSBlbHNlIHtcclxuICAgICAgbG93ZXIoaGVpZ2h0bWFwLCB4LCB5KVxyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgcmV0dXJuIGhlaWdodG1hcFxyXG59XHJcbiJdfQ==