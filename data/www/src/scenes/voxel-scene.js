import { debugTextSceneHelper } from '../lib/scene/debug-text.js';
import { exitOnEscape, zoomOnWheel } from '../lib/scene/io.js';
import { maybe } from '../lib/util.js';
import { blitVoxels } from '../lib/voxel/blit.js';
const mapW = 192;
const mapH = 192;
const mapCx = mapW / 2;
const mapCy = mapH / 2;
// todo - set up some guide lines so we can try to sample some of the 3d voxels 
// and drawing into a fixed rect on the buffer
// try using the center of the dest rect as the point to normalize the heightmap
// to, eg if it's height 64, we want that point drawn at the exact center of
// the fixed rect, not 64 pixels up
export const voxelScene = () => {
    let isActive = false;
    let voxels;
    let dirty = true;
    let debugHelper;
    let debugText = [];
    const init = async (state) => {
        voxels = [];
        debugHelper = debugTextSceneHelper(() => debugText);
        await debugHelper.init(state);
        isActive = true;
    };
    const io = (state) => {
        if (exitOnEscape(state))
            return;
        if (zoomOnWheel(state)) {
            dirty = true;
        }
    };
    const update = (state) => {
        if (!maybe(voxels))
            throw Error('voxels not initialized');
        if (!maybe(debugHelper))
            throw Error('debugHelper not initialized');
        if (isActive)
            io(state);
        if (!dirty)
            return;
        const buffer = state.view.getBuffer();
        const { width, height } = buffer;
        blitVoxels(buffer, voxels);
        dirty = false;
        const frameTime = state.time.getFrameTime();
        const fps = Math.round(1000 / frameTime);
        const fpsText = `${fps} fps (${frameTime.toFixed(1)}ms)`;
        debugText = [fpsText];
        debugHelper.update(state);
    };
    const quit = async (_state) => {
        isActive = false;
        voxels = null;
    };
    const setActive = (active) => {
        isActive = active;
    };
    return { init, update, quit, setActive };
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidm94ZWwtc2NlbmUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi9zcmMvc2NlbmVzL3ZveGVsLXNjZW5lLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLE9BQU8sRUFBRSxvQkFBb0IsRUFBRSxNQUFNLDRCQUE0QixDQUFBO0FBQ2pFLE9BQU8sRUFBRSxZQUFZLEVBQUUsV0FBVyxFQUFFLE1BQU0sb0JBQW9CLENBQUE7QUFFOUQsT0FBTyxFQUFFLEtBQUssRUFBRSxNQUFNLGdCQUFnQixDQUFBO0FBQ3RDLE9BQU8sRUFBRSxVQUFVLEVBQUUsTUFBTSxzQkFBc0IsQ0FBQTtBQUdqRCxNQUFNLElBQUksR0FBRyxHQUFHLENBQUE7QUFDaEIsTUFBTSxJQUFJLEdBQUcsR0FBRyxDQUFBO0FBRWhCLE1BQU0sS0FBSyxHQUFHLElBQUksR0FBRyxDQUFDLENBQUE7QUFDdEIsTUFBTSxLQUFLLEdBQUcsSUFBSSxHQUFHLENBQUMsQ0FBQTtBQUV0QixnRkFBZ0Y7QUFDaEYsOENBQThDO0FBQzlDLGdGQUFnRjtBQUNoRiw0RUFBNEU7QUFDNUUsbUNBQW1DO0FBRW5DLE1BQU0sQ0FBQyxNQUFNLFVBQVUsR0FBRyxHQUFVLEVBQUU7SUFDcEMsSUFBSSxRQUFRLEdBQUcsS0FBSyxDQUFBO0lBQ3BCLElBQUksTUFBb0IsQ0FBQTtJQUN4QixJQUFJLEtBQUssR0FBRyxJQUFJLENBQUE7SUFDaEIsSUFBSSxXQUF5QixDQUFBO0lBQzdCLElBQUksU0FBUyxHQUFhLEVBQUUsQ0FBQTtJQUU1QixNQUFNLElBQUksR0FBRyxLQUFLLEVBQUUsS0FBWSxFQUFFLEVBQUU7UUFDbEMsTUFBTSxHQUFHLEVBQUUsQ0FBQTtRQUNYLFdBQVcsR0FBRyxvQkFBb0IsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxTQUFTLENBQUMsQ0FBQTtRQUVuRCxNQUFNLFdBQVcsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUE7UUFFN0IsUUFBUSxHQUFHLElBQUksQ0FBQTtJQUNqQixDQUFDLENBQUE7SUFFRCxNQUFNLEVBQUUsR0FBRyxDQUFDLEtBQVksRUFBRSxFQUFFO1FBQzFCLElBQUksWUFBWSxDQUFDLEtBQUssQ0FBQztZQUFFLE9BQU07UUFFL0IsSUFBSSxXQUFXLENBQUMsS0FBSyxDQUFDLEVBQUUsQ0FBQztZQUN2QixLQUFLLEdBQUcsSUFBSSxDQUFBO1FBQ2QsQ0FBQztJQUNILENBQUMsQ0FBQTtJQUVELE1BQU0sTUFBTSxHQUFHLENBQUMsS0FBWSxFQUFFLEVBQUU7UUFDOUIsSUFBSSxDQUFDLEtBQUssQ0FBQyxNQUFNLENBQUM7WUFBRSxNQUFNLEtBQUssQ0FBQyx3QkFBd0IsQ0FBQyxDQUFBO1FBQ3pELElBQUksQ0FBQyxLQUFLLENBQUMsV0FBVyxDQUFDO1lBQUUsTUFBTSxLQUFLLENBQUMsNkJBQTZCLENBQUMsQ0FBQTtRQUVuRSxJQUFJLFFBQVE7WUFBRSxFQUFFLENBQUMsS0FBSyxDQUFDLENBQUE7UUFFdkIsSUFBSSxDQUFDLEtBQUs7WUFBRSxPQUFNO1FBRWxCLE1BQU0sTUFBTSxHQUFHLEtBQUssQ0FBQyxJQUFJLENBQUMsU0FBUyxFQUFFLENBQUE7UUFDckMsTUFBTSxFQUFFLEtBQUssRUFBRSxNQUFNLEVBQUUsR0FBRyxNQUFNLENBQUE7UUFFaEMsVUFBVSxDQUFDLE1BQU0sRUFBRSxNQUFNLENBQUMsQ0FBQTtRQUUxQixLQUFLLEdBQUcsS0FBSyxDQUFBO1FBRWIsTUFBTSxTQUFTLEdBQUcsS0FBSyxDQUFDLElBQUksQ0FBQyxZQUFZLEVBQUUsQ0FBQTtRQUMzQyxNQUFNLEdBQUcsR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLElBQUksR0FBRyxTQUFTLENBQUMsQ0FBQTtRQUN4QyxNQUFNLE9BQU8sR0FBRyxHQUFHLEdBQUcsU0FBUyxTQUFTLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUE7UUFFeEQsU0FBUyxHQUFHLENBQUMsT0FBTyxDQUFDLENBQUE7UUFFckIsV0FBVyxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsQ0FBQTtJQUMzQixDQUFDLENBQUE7SUFFRCxNQUFNLElBQUksR0FBRyxLQUFLLEVBQUUsTUFBYSxFQUFFLEVBQUU7UUFDbkMsUUFBUSxHQUFHLEtBQUssQ0FBQTtRQUNoQixNQUFNLEdBQUcsSUFBSSxDQUFBO0lBQ2YsQ0FBQyxDQUFBO0lBRUQsTUFBTSxTQUFTLEdBQUcsQ0FBQyxNQUFlLEVBQUUsRUFBRTtRQUNwQyxRQUFRLEdBQUcsTUFBTSxDQUFBO0lBQ25CLENBQUMsQ0FBQTtJQUVELE9BQU8sRUFBRSxJQUFJLEVBQUUsTUFBTSxFQUFFLElBQUksRUFBRSxTQUFTLEVBQUUsQ0FBQTtBQUMxQyxDQUFDLENBQUEiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBkZWJ1Z1RleHRTY2VuZUhlbHBlciB9IGZyb20gJy4uL2xpYi9zY2VuZS9kZWJ1Zy10ZXh0LmpzJ1xyXG5pbXBvcnQgeyBleGl0T25Fc2NhcGUsIHpvb21PbldoZWVsIH0gZnJvbSAnLi4vbGliL3NjZW5lL2lvLmpzJ1xyXG5pbXBvcnQgeyBNYXliZSwgU2NlbmUsIFN0YXRlIH0gZnJvbSAnLi4vbGliL3R5cGVzLmpzJ1xyXG5pbXBvcnQgeyBtYXliZSB9IGZyb20gJy4uL2xpYi91dGlsLmpzJ1xyXG5pbXBvcnQgeyBibGl0Vm94ZWxzIH0gZnJvbSAnLi4vbGliL3ZveGVsL2JsaXQuanMnXHJcbmltcG9ydCB7IFZveCB9IGZyb20gJy4uL2xpYi92b3hlbC90eXBlcy5qcydcclxuXHJcbmNvbnN0IG1hcFcgPSAxOTJcclxuY29uc3QgbWFwSCA9IDE5MlxyXG5cclxuY29uc3QgbWFwQ3ggPSBtYXBXIC8gMlxyXG5jb25zdCBtYXBDeSA9IG1hcEggLyAyXHJcblxyXG4vLyB0b2RvIC0gc2V0IHVwIHNvbWUgZ3VpZGUgbGluZXMgc28gd2UgY2FuIHRyeSB0byBzYW1wbGUgc29tZSBvZiB0aGUgM2Qgdm94ZWxzIFxyXG4vLyBhbmQgZHJhd2luZyBpbnRvIGEgZml4ZWQgcmVjdCBvbiB0aGUgYnVmZmVyXHJcbi8vIHRyeSB1c2luZyB0aGUgY2VudGVyIG9mIHRoZSBkZXN0IHJlY3QgYXMgdGhlIHBvaW50IHRvIG5vcm1hbGl6ZSB0aGUgaGVpZ2h0bWFwXHJcbi8vIHRvLCBlZyBpZiBpdCdzIGhlaWdodCA2NCwgd2Ugd2FudCB0aGF0IHBvaW50IGRyYXduIGF0IHRoZSBleGFjdCBjZW50ZXIgb2ZcclxuLy8gdGhlIGZpeGVkIHJlY3QsIG5vdCA2NCBwaXhlbHMgdXBcclxuXHJcbmV4cG9ydCBjb25zdCB2b3hlbFNjZW5lID0gKCk6IFNjZW5lID0+IHtcclxuICBsZXQgaXNBY3RpdmUgPSBmYWxzZVxyXG4gIGxldCB2b3hlbHM6IE1heWJlPFZveFtdPlxyXG4gIGxldCBkaXJ0eSA9IHRydWVcclxuICBsZXQgZGVidWdIZWxwZXI6IE1heWJlPFNjZW5lPlxyXG4gIGxldCBkZWJ1Z1RleHQ6IHN0cmluZ1tdID0gW11cclxuXHJcbiAgY29uc3QgaW5pdCA9IGFzeW5jIChzdGF0ZTogU3RhdGUpID0+IHtcclxuICAgIHZveGVscyA9IFtdXHJcbiAgICBkZWJ1Z0hlbHBlciA9IGRlYnVnVGV4dFNjZW5lSGVscGVyKCgpID0+IGRlYnVnVGV4dClcclxuXHJcbiAgICBhd2FpdCBkZWJ1Z0hlbHBlci5pbml0KHN0YXRlKVxyXG5cclxuICAgIGlzQWN0aXZlID0gdHJ1ZVxyXG4gIH1cclxuXHJcbiAgY29uc3QgaW8gPSAoc3RhdGU6IFN0YXRlKSA9PiB7XHJcbiAgICBpZiAoZXhpdE9uRXNjYXBlKHN0YXRlKSkgcmV0dXJuXHJcblxyXG4gICAgaWYgKHpvb21PbldoZWVsKHN0YXRlKSkge1xyXG4gICAgICBkaXJ0eSA9IHRydWVcclxuICAgIH1cclxuICB9XHJcblxyXG4gIGNvbnN0IHVwZGF0ZSA9IChzdGF0ZTogU3RhdGUpID0+IHtcclxuICAgIGlmICghbWF5YmUodm94ZWxzKSkgdGhyb3cgRXJyb3IoJ3ZveGVscyBub3QgaW5pdGlhbGl6ZWQnKVxyXG4gICAgaWYgKCFtYXliZShkZWJ1Z0hlbHBlcikpIHRocm93IEVycm9yKCdkZWJ1Z0hlbHBlciBub3QgaW5pdGlhbGl6ZWQnKVxyXG5cclxuICAgIGlmIChpc0FjdGl2ZSkgaW8oc3RhdGUpXHJcblxyXG4gICAgaWYgKCFkaXJ0eSkgcmV0dXJuXHJcblxyXG4gICAgY29uc3QgYnVmZmVyID0gc3RhdGUudmlldy5nZXRCdWZmZXIoKVxyXG4gICAgY29uc3QgeyB3aWR0aCwgaGVpZ2h0IH0gPSBidWZmZXJcclxuXHJcbiAgICBibGl0Vm94ZWxzKGJ1ZmZlciwgdm94ZWxzKVxyXG5cclxuICAgIGRpcnR5ID0gZmFsc2VcclxuXHJcbiAgICBjb25zdCBmcmFtZVRpbWUgPSBzdGF0ZS50aW1lLmdldEZyYW1lVGltZSgpXHJcbiAgICBjb25zdCBmcHMgPSBNYXRoLnJvdW5kKDEwMDAgLyBmcmFtZVRpbWUpXHJcbiAgICBjb25zdCBmcHNUZXh0ID0gYCR7ZnBzfSBmcHMgKCR7ZnJhbWVUaW1lLnRvRml4ZWQoMSl9bXMpYFxyXG5cclxuICAgIGRlYnVnVGV4dCA9IFtmcHNUZXh0XVxyXG5cclxuICAgIGRlYnVnSGVscGVyLnVwZGF0ZShzdGF0ZSlcclxuICB9XHJcblxyXG4gIGNvbnN0IHF1aXQgPSBhc3luYyAoX3N0YXRlOiBTdGF0ZSkgPT4ge1xyXG4gICAgaXNBY3RpdmUgPSBmYWxzZVxyXG4gICAgdm94ZWxzID0gbnVsbFxyXG4gIH1cclxuXHJcbiAgY29uc3Qgc2V0QWN0aXZlID0gKGFjdGl2ZTogYm9vbGVhbikgPT4ge1xyXG4gICAgaXNBY3RpdmUgPSBhY3RpdmVcclxuICB9XHJcblxyXG4gIHJldHVybiB7IGluaXQsIHVwZGF0ZSwgcXVpdCwgc2V0QWN0aXZlIH1cclxufVxyXG4iXX0=