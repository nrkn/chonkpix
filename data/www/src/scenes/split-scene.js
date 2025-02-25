import { blit } from '../lib/image/blit.js';
import { createColor } from '../lib/image/color.js';
import { createImage } from '../lib/image/create.js';
import { fill } from '../lib/image/fill.js';
import { strokeRect } from '../lib/image/stroke.js';
// renders two scenes side by side
// tab to switch between scenes
// escape to quit
//
// contains the requisite patterns for more complex composite scenes
export const splitScene = (left, right, bgColor = createColor(0x00, 0x00, 0x00), activeBorderColor = createColor(0xff, 0xd7, 0x00), padding = 1) => {
    let active = 0;
    let leftBuffer;
    let rightBuffer;
    let leftState;
    let rightState;
    let lastW = 0;
    let lastH = 0;
    // enable key/mouse handling for the active scene
    // disable key/mouse handling for the inactive scene
    const onSwitch = (state) => {
        if (active === 0) {
            enableIo(leftState, state);
            disableIo(rightState);
            if (left.setActive)
                left.setActive(true);
            if (right.setActive)
                right.setActive(false);
        }
        else {
            enableIo(rightState, state);
            disableIo(leftState);
            if (right.setActive)
                right.setActive(true);
            if (left.setActive)
                left.setActive(false);
        }
    };
    // get the rects for the left and right scenes taking into account padding
    const getRects = () => {
        const w = lastW - padding * 3;
        const h = lastH - padding * 2;
        const halfW = Math.floor(w / 2);
        const leftR = [padding, padding, halfW, h];
        const rightR = [halfW + padding * 2, padding, halfW, h];
        return [leftR, rightR];
    };
    const resized = (state) => {
        const buffer = state.view.getBuffer();
        lastW = buffer.width;
        lastH = buffer.height;
        const [leftR, rightR] = getRects();
        leftBuffer = createImage(leftR[2], leftR[3]);
        rightBuffer = createImage(rightR[2], rightR[3]);
        updateSize(leftState, state, leftR);
        updateSize(rightState, state, rightR);
        leftState.view.getBuffer = () => leftBuffer;
        rightState.view.getBuffer = () => rightBuffer;
    };
    const init = async (state) => {
        const buffer = state.view.getBuffer();
        lastW = buffer.width;
        lastH = buffer.height;
        leftState = wrapState(state, leftBuffer);
        rightState = wrapState(state, rightBuffer);
        resized(state);
        await left.init(leftState);
        await right.init(rightState);
        onSwitch(state);
    };
    const update = (state) => {
        // note that capturing and consuming the keys here means that child scenes
        // won't be able to see them - in this case, it is intentional, but keep
        // that in mind!
        //
        // if we find a use case for *not* doing this we can add options to the 
        // splitScene factory function
        const keys = state.getKeys();
        if (keys['Escape']) {
            //state.running = false
            state.setRunning(false);
            keys['Escape'] = false;
            return;
        }
        if (keys['Tab']) {
            active = active === 0 ? 1 : 0;
            keys['Tab'] = false;
            onSwitch(state);
        }
        const buffer = state.view.getBuffer();
        const { width, height } = buffer;
        if (width !== lastW || height !== lastH) {
            resized(state);
        }
        // update the child scenes
        left.update(leftState);
        right.update(rightState);
        // draw the split view
        const leftBorderRect = [
            0, 0,
            leftBuffer.width + padding * 2, leftBuffer.height + padding * 2
        ];
        const rightBorderRect = [
            leftBuffer.width + padding * 2 - 1, 0,
            rightBuffer.width + padding * 2, rightBuffer.height + padding * 2
        ];
        const activeRect = active === 0 ? leftBorderRect : rightBorderRect;
        const inactiveRect = active === 0 ? rightBorderRect : leftBorderRect;
        fill(buffer, bgColor);
        strokeRect(buffer, inactiveRect, bgColor);
        strokeRect(buffer, activeRect, activeBorderColor);
        blit(leftBuffer, buffer, [
            0, 0, leftBuffer.width, leftBuffer.height,
            padding, padding
        ]);
        blit(rightBuffer, buffer, [
            0, 0, rightBuffer.width, rightBuffer.height,
            leftBuffer.width + padding * 2, padding
        ]);
    };
    const quit = async (state) => {
        await left.quit(state);
        await right.quit(state);
    };
    return { init, update, quit };
};
// overwrite mouseX, mouseY and inBounds for new size
const updateSize = (state, parentState, rect) => {
    state.mouse.getX = () => parentState.mouse.getX() - rect[0];
    state.mouse.getY = () => parentState.mouse.getY() - rect[1];
    state.mouse.isInBounds = () => {
        const [_x, _y, w, h] = rect;
        return (parentState.mouse.isInBounds() &&
            state.mouse.getX() >= 0 && state.mouse.getX() < w &&
            state.mouse.getY() >= 0 && state.mouse.getY() < h);
    };
};
// this state will no longer see or modify the parent state's io
const disableIo = (state) => {
    state.getKeys = () => ({});
    state.getKeyPresses = () => [];
    state.mouse.getButtons = () => ({});
    state.mouse.getWheel = () => 0;
};
// reattaches the parent state's io to the child state
const enableIo = (state, parentState) => {
    state.getKeys = parentState.getKeys;
    state.getKeyPresses = parentState.getKeyPresses;
    state.mouse.getButtons = parentState.mouse.getButtons;
    state.mouse.getWheel = parentState.mouse.getWheel;
};
// create a new wrapped state object with its own buffer
const wrapState = (state, buffer) => {
    const { getKeys, getKeyPresses, mouse, time, view, getRunning, setRunning } = state;
    const wrapped = {
        getKeys,
        getKeyPresses,
        mouse: { ...mouse },
        time: { ...time },
        view: {
            ...view,
            getBuffer: () => buffer
        },
        getRunning,
        setRunning
    };
    return wrapped;
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3BsaXQtc2NlbmUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi9zcmMvc2NlbmVzL3NwbGl0LXNjZW5lLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLE9BQU8sRUFBRSxJQUFJLEVBQUUsTUFBTSxzQkFBc0IsQ0FBQTtBQUMzQyxPQUFPLEVBQUUsV0FBVyxFQUFFLE1BQU0sdUJBQXVCLENBQUE7QUFDbkQsT0FBTyxFQUFFLFdBQVcsRUFBRSxNQUFNLHdCQUF3QixDQUFBO0FBQ3BELE9BQU8sRUFBRSxJQUFJLEVBQUUsTUFBTSxzQkFBc0IsQ0FBQTtBQUMzQyxPQUFPLEVBQUUsVUFBVSxFQUFFLE1BQU0sd0JBQXdCLENBQUE7QUFHbkQsa0NBQWtDO0FBQ2xDLCtCQUErQjtBQUMvQixpQkFBaUI7QUFDakIsRUFBRTtBQUNGLG9FQUFvRTtBQUNwRSxNQUFNLENBQUMsTUFBTSxVQUFVLEdBQUcsQ0FDeEIsSUFBVyxFQUFFLEtBQVksRUFDekIsT0FBTyxHQUFHLFdBQVcsQ0FBQyxJQUFJLEVBQUUsSUFBSSxFQUFFLElBQUksQ0FBQyxFQUN2QyxpQkFBaUIsR0FBRyxXQUFXLENBQUMsSUFBSSxFQUFFLElBQUksRUFBRSxJQUFJLENBQUMsRUFDakQsT0FBTyxHQUFHLENBQUMsRUFDSixFQUFFO0lBQ1QsSUFBSSxNQUFNLEdBQVUsQ0FBQyxDQUFBO0lBRXJCLElBQUksVUFBcUIsQ0FBQTtJQUN6QixJQUFJLFdBQXNCLENBQUE7SUFFMUIsSUFBSSxTQUFnQixDQUFBO0lBQ3BCLElBQUksVUFBaUIsQ0FBQTtJQUVyQixJQUFJLEtBQUssR0FBRyxDQUFDLENBQUE7SUFDYixJQUFJLEtBQUssR0FBRyxDQUFDLENBQUE7SUFFYixpREFBaUQ7SUFDakQsb0RBQW9EO0lBQ3BELE1BQU0sUUFBUSxHQUFHLENBQUMsS0FBWSxFQUFFLEVBQUU7UUFDaEMsSUFBSSxNQUFNLEtBQUssQ0FBQyxFQUFFLENBQUM7WUFDakIsUUFBUSxDQUFDLFNBQVMsRUFBRSxLQUFLLENBQUMsQ0FBQTtZQUMxQixTQUFTLENBQUMsVUFBVSxDQUFDLENBQUE7WUFDckIsSUFBSSxJQUFJLENBQUMsU0FBUztnQkFBRyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxDQUFBO1lBQ3pDLElBQUksS0FBSyxDQUFDLFNBQVM7Z0JBQUcsS0FBSyxDQUFDLFNBQVMsQ0FBQyxLQUFLLENBQUMsQ0FBQTtRQUM5QyxDQUFDO2FBQU0sQ0FBQztZQUNOLFFBQVEsQ0FBQyxVQUFVLEVBQUUsS0FBSyxDQUFDLENBQUE7WUFDM0IsU0FBUyxDQUFDLFNBQVMsQ0FBQyxDQUFBO1lBQ3BCLElBQUksS0FBSyxDQUFDLFNBQVM7Z0JBQUcsS0FBSyxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsQ0FBQTtZQUMzQyxJQUFJLElBQUksQ0FBQyxTQUFTO2dCQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsS0FBSyxDQUFDLENBQUE7UUFDNUMsQ0FBQztJQUNILENBQUMsQ0FBQTtJQUVELDBFQUEwRTtJQUMxRSxNQUFNLFFBQVEsR0FBRyxHQUFXLEVBQUU7UUFDNUIsTUFBTSxDQUFDLEdBQUcsS0FBSyxHQUFHLE9BQU8sR0FBRyxDQUFDLENBQUE7UUFDN0IsTUFBTSxDQUFDLEdBQUcsS0FBSyxHQUFHLE9BQU8sR0FBRyxDQUFDLENBQUE7UUFFN0IsTUFBTSxLQUFLLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUE7UUFFL0IsTUFBTSxLQUFLLEdBQU8sQ0FBQyxPQUFPLEVBQUUsT0FBTyxFQUFFLEtBQUssRUFBRSxDQUFDLENBQUMsQ0FBQTtRQUM5QyxNQUFNLE1BQU0sR0FBTyxDQUFDLEtBQUssR0FBRyxPQUFPLEdBQUcsQ0FBQyxFQUFFLE9BQU8sRUFBRSxLQUFLLEVBQUUsQ0FBQyxDQUFDLENBQUE7UUFFM0QsT0FBTyxDQUFDLEtBQUssRUFBRSxNQUFNLENBQUMsQ0FBQTtJQUN4QixDQUFDLENBQUE7SUFFRCxNQUFNLE9BQU8sR0FBRyxDQUFDLEtBQVksRUFBRSxFQUFFO1FBQy9CLE1BQU0sTUFBTSxHQUFHLEtBQUssQ0FBQyxJQUFJLENBQUMsU0FBUyxFQUFFLENBQUE7UUFFckMsS0FBSyxHQUFHLE1BQU0sQ0FBQyxLQUFLLENBQUE7UUFDcEIsS0FBSyxHQUFHLE1BQU0sQ0FBQyxNQUFNLENBQUE7UUFFckIsTUFBTSxDQUFDLEtBQUssRUFBRSxNQUFNLENBQUMsR0FBRyxRQUFRLEVBQUUsQ0FBQTtRQUVsQyxVQUFVLEdBQUcsV0FBVyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsRUFBRSxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQTtRQUM1QyxXQUFXLEdBQUcsV0FBVyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsRUFBRSxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQTtRQUUvQyxVQUFVLENBQUMsU0FBUyxFQUFFLEtBQUssRUFBRSxLQUFLLENBQUMsQ0FBQTtRQUNuQyxVQUFVLENBQUMsVUFBVSxFQUFFLEtBQUssRUFBRSxNQUFNLENBQUMsQ0FBQTtRQUVyQyxTQUFTLENBQUMsSUFBSSxDQUFDLFNBQVMsR0FBRyxHQUFHLEVBQUUsQ0FBQyxVQUFVLENBQUE7UUFDM0MsVUFBVSxDQUFDLElBQUksQ0FBQyxTQUFTLEdBQUcsR0FBRyxFQUFFLENBQUMsV0FBVyxDQUFBO0lBQy9DLENBQUMsQ0FBQTtJQUVELE1BQU0sSUFBSSxHQUFHLEtBQUssRUFBRSxLQUFZLEVBQUUsRUFBRTtRQUNsQyxNQUFNLE1BQU0sR0FBRyxLQUFLLENBQUMsSUFBSSxDQUFDLFNBQVMsRUFBRSxDQUFBO1FBRXJDLEtBQUssR0FBRyxNQUFNLENBQUMsS0FBSyxDQUFBO1FBQ3BCLEtBQUssR0FBRyxNQUFNLENBQUMsTUFBTSxDQUFBO1FBRXJCLFNBQVMsR0FBRyxTQUFTLENBQUMsS0FBSyxFQUFFLFVBQVUsQ0FBQyxDQUFBO1FBQ3hDLFVBQVUsR0FBRyxTQUFTLENBQUMsS0FBSyxFQUFFLFdBQVcsQ0FBQyxDQUFBO1FBRTFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsQ0FB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QixPQUFPO1FBQ1AsYUFBYTtRQUNiLEtBQUssRUFBRSxFQUFFLEdBQUcsS0FBSyxFQUFFO1FBQ25CLElBQUksRUFBRSxFQUFFLEdBQUcsSUFBSSxFQUFFO1FBQ2pCLElBQUksRUFBRTtZQUNKLEdBQUcsSUFBSTtZQUNQLFNBQVMsRUFBRSxHQUFHLEVBQUUsQ0FBQyxNQUFNO1NBQ3hCO1FBQ0QsVUFBVTtRQUNWLFVBQVU7S0FDWCxDQUFBO0lBRUQsT0FBTyxPQUFPLENBQUE7QUFDaEIsQ0FBQyxDQUFBIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgYmxpdCB9IGZyb20gJy4uL2xpYi9pbWFnZS9ibGl0LmpzJ1xyXG5pbXBvcnQgeyBjcmVhdGVDb2xvciB9IGZyb20gJy4uL2xpYi9pbWFnZS9jb2xvci5qcydcclxuaW1wb3J0IHsgY3JlYXRlSW1hZ2UgfSBmcm9tICcuLi9saWIvaW1hZ2UvY3JlYXRlLmpzJ1xyXG5pbXBvcnQgeyBmaWxsIH0gZnJvbSAnLi4vbGliL2ltYWdlL2ZpbGwuanMnXHJcbmltcG9ydCB7IHN0cm9rZVJlY3QgfSBmcm9tICcuLi9saWIvaW1hZ2Uvc3Ryb2tlLmpzJ1xyXG5pbXBvcnQgeyBTY2VuZSwgU3RhdGUsIFQyLCBUNCB9IGZyb20gJy4uL2xpYi90eXBlcy5qcydcclxuXHJcbi8vIHJlbmRlcnMgdHdvIHNjZW5lcyBzaWRlIGJ5IHNpZGVcclxuLy8gdGFiIHRvIHN3aXRjaCBiZXR3ZWVuIHNjZW5lc1xyXG4vLyBlc2NhcGUgdG8gcXVpdFxyXG4vL1xyXG4vLyBjb250YWlucyB0aGUgcmVxdWlzaXRlIHBhdHRlcm5zIGZvciBtb3JlIGNvbXBsZXggY29tcG9zaXRlIHNjZW5lc1xyXG5leHBvcnQgY29uc3Qgc3BsaXRTY2VuZSA9IChcclxuICBsZWZ0OiBTY2VuZSwgcmlnaHQ6IFNjZW5lLCBcclxuICBiZ0NvbG9yID0gY3JlYXRlQ29sb3IoMHgwMCwgMHgwMCwgMHgwMCksXHJcbiAgYWN0aXZlQm9yZGVyQ29sb3IgPSBjcmVhdGVDb2xvcigweGZmLCAweGQ3LCAweDAwKSxcclxuICBwYWRkaW5nID0gMVxyXG4pOiBTY2VuZSA9PiB7XHJcbiAgbGV0IGFjdGl2ZTogMCB8IDEgPSAwXHJcblxyXG4gIGxldCBsZWZ0QnVmZmVyOiBJbWFnZURhdGFcclxuICBsZXQgcmlnaHRCdWZmZXI6IEltYWdlRGF0YVxyXG5cclxuICBsZXQgbGVmdFN0YXRlOiBTdGF0ZVxyXG4gIGxldCByaWdodFN0YXRlOiBTdGF0ZVxyXG5cclxuICBsZXQgbGFzdFcgPSAwXHJcbiAgbGV0IGxhc3RIID0gMFxyXG5cclxuICAvLyBlbmFibGUga2V5L21vdXNlIGhhbmRsaW5nIGZvciB0aGUgYWN0aXZlIHNjZW5lXHJcbiAgLy8gZGlzYWJsZSBrZXkvbW91c2UgaGFuZGxpbmcgZm9yIHRoZSBpbmFjdGl2ZSBzY2VuZVxyXG4gIGNvbnN0IG9uU3dpdGNoID0gKHN0YXRlOiBTdGF0ZSkgPT4ge1xyXG4gICAgaWYgKGFjdGl2ZSA9PT0gMCkge1xyXG4gICAgICBlbmFibGVJbyhsZWZ0U3RhdGUsIHN0YXRlKVxyXG4gICAgICBkaXNhYmxlSW8ocmlnaHRTdGF0ZSlcclxuICAgICAgaWYoIGxlZnQuc2V0QWN0aXZlICkgbGVmdC5zZXRBY3RpdmUodHJ1ZSlcclxuICAgICAgaWYoIHJpZ2h0LnNldEFjdGl2ZSApIHJpZ2h0LnNldEFjdGl2ZShmYWxzZSlcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIGVuYWJsZUlvKHJpZ2h0U3RhdGUsIHN0YXRlKVxyXG4gICAgICBkaXNhYmxlSW8obGVmdFN0YXRlKVxyXG4gICAgICBpZiggcmlnaHQuc2V0QWN0aXZlICkgcmlnaHQuc2V0QWN0aXZlKHRydWUpXHJcbiAgICAgIGlmKCBsZWZ0LnNldEFjdGl2ZSApIGxlZnQuc2V0QWN0aXZlKGZhbHNlKVxyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgLy8gZ2V0IHRoZSByZWN0cyBmb3IgdGhlIGxlZnQgYW5kIHJpZ2h0IHNjZW5lcyB0YWtpbmcgaW50byBhY2NvdW50IHBhZGRpbmdcclxuICBjb25zdCBnZXRSZWN0cyA9ICgpOiBUMjxUND4gPT4ge1xyXG4gICAgY29uc3QgdyA9IGxhc3RXIC0gcGFkZGluZyAqIDNcclxuICAgIGNvbnN0IGggPSBsYXN0SCAtIHBhZGRpbmcgKiAyXHJcblxyXG4gICAgY29uc3QgaGFsZlcgPSBNYXRoLmZsb29yKHcgLyAyKVxyXG5cclxuICAgIGNvbnN0IGxlZnRSOiBUNCA9IFtwYWRkaW5nLCBwYWRkaW5nLCBoYWxmVywgaF1cclxuICAgIGNvbnN0IHJpZ2h0UjogVDQgPSBbaGFsZlcgKyBwYWRkaW5nICogMiwgcGFkZGluZywgaGFsZlcsIGhdXHJcblxyXG4gICAgcmV0dXJuIFtsZWZ0UiwgcmlnaHRSXVxyXG4gIH1cclxuXHJcbiAgY29uc3QgcmVzaXplZCA9IChzdGF0ZTogU3RhdGUpID0+IHtcclxuICAgIGNvbnN0IGJ1ZmZlciA9IHN0YXRlLnZpZXcuZ2V0QnVmZmVyKClcclxuXHJcbiAgICBsYXN0VyA9IGJ1ZmZlci53aWR0aFxyXG4gICAgbGFzdEggPSBidWZmZXIuaGVpZ2h0XHJcblxyXG4gICAgY29uc3QgW2xlZnRSLCByaWdodFJdID0gZ2V0UmVjdHMoKVxyXG5cclxuICAgIGxlZnRCdWZmZXIgPSBjcmVhdGVJbWFnZShsZWZ0UlsyXSwgbGVmdFJbM10pXHJcbiAgICByaWdodEJ1ZmZlciA9IGNyZWF0ZUltYWdlKHJpZ2h0UlsyXSwgcmlnaHRSWzNdKVxyXG5cclxuICAgIHVwZGF0ZVNpemUobGVmdFN0YXRlLCBzdGF0ZSwgbGVmdFIpXHJcbiAgICB1cGRhdGVTaXplKHJpZ2h0U3RhdGUsIHN0YXRlLCByaWdodFIpXHJcblxyXG4gICAgbGVmdFN0YXRlLnZpZXcuZ2V0QnVmZmVyID0gKCkgPT4gbGVmdEJ1ZmZlclxyXG4gICAgcmlnaHRTdGF0ZS52aWV3LmdldEJ1ZmZlciA9ICgpID0+IHJpZ2h0QnVmZmVyXHJcbiAgfVxyXG5cclxuICBjb25zdCBpbml0ID0gYXN5bmMgKHN0YXRlOiBTdGF0ZSkgPT4ge1xyXG4gICAgY29uc3QgYnVmZmVyID0gc3RhdGUudmlldy5nZXRCdWZmZXIoKVxyXG5cclxuICAgIGxhc3RXID0gYnVmZmVyLndpZHRoXHJcbiAgICBsYXN0SCA9IGJ1ZmZlci5oZWlnaHRcclxuXHJcbiAgICBsZWZ0U3RhdGUgPSB3cmFwU3RhdGUoc3RhdGUsIGxlZnRCdWZmZXIpXHJcbiAgICByaWdodFN0YXRlID0gd3JhcFN0YXRlKHN0YXRlLCByaWdodEJ1ZmZlcilcclxuXHJcbiAgICByZXNpemVkKHN0YXRlKVxyXG5cclxuICAgIGF3YWl0IGxlZnQuaW5pdChsZWZ0U3RhdGUpXHJcbiAgICBhd2FpdCByaWdodC5pbml0KHJpZ2h0U3RhdGUpXHJcblxyXG4gICAgb25Td2l0Y2goc3RhdGUpXHJcbiAgfVxyXG5cclxuICBjb25zdCB1cGRhdGUgPSAoc3RhdGU6IFN0YXRlKSA9PiB7XHJcbiAgICAvLyBub3RlIHRoYXQgY2FwdHVyaW5nIGFuZCBjb25zdW1pbmcgdGhlIGtleXMgaGVyZSBtZWFucyB0aGF0IGNoaWxkIHNjZW5lc1xyXG4gICAgLy8gd29uJ3QgYmUgYWJsZSB0byBzZWUgdGhlbSAtIGluIHRoaXMgY2FzZSwgaXQgaXMgaW50ZW50aW9uYWwsIGJ1dCBrZWVwXHJcbiAgICAvLyB0aGF0IGluIG1pbmQhXHJcbiAgICAvL1xyXG4gICAgLy8gaWYgd2UgZmluZCBhIHVzZSBjYXNlIGZvciAqbm90KiBkb2luZyB0aGlzIHdlIGNhbiBhZGQgb3B0aW9ucyB0byB0aGUgXHJcbiAgICAvLyBzcGxpdFNjZW5lIGZhY3RvcnkgZnVuY3Rpb25cclxuICAgIGNvbnN0IGtleXMgPSBzdGF0ZS5nZXRLZXlzKClcclxuXHJcbiAgICBpZiAoa2V5c1snRXNjYXBlJ10pIHtcclxuICAgICAgLy9zdGF0ZS5ydW5uaW5nID0gZmFsc2VcclxuICAgICAgc3RhdGUuc2V0UnVubmluZyhmYWxzZSlcclxuXHJcbiAgICAgIGtleXNbJ0VzY2FwZSddID0gZmFsc2VcclxuXHJcbiAgICAgIHJldHVyblxyXG4gICAgfVxyXG5cclxuICAgIGlmIChrZXlzWydUYWInXSkge1xyXG4gICAgICBhY3RpdmUgPSBhY3RpdmUgPT09IDAgPyAxIDogMFxyXG4gICAgICBrZXlzWydUYWInXSA9IGZhbHNlXHJcblxyXG4gICAgICBvblN3aXRjaChzdGF0ZSlcclxuICAgIH1cclxuXHJcbiAgICBjb25zdCBidWZmZXIgPSBzdGF0ZS52aWV3LmdldEJ1ZmZlcigpXHJcbiAgICBjb25zdCB7IHdpZHRoLCBoZWlnaHQgfSA9IGJ1ZmZlclxyXG5cclxuICAgIGlmICh3aWR0aCAhPT0gbGFzdFcgfHwgaGVpZ2h0ICE9PSBsYXN0SCkge1xyXG4gICAgICByZXNpemVkKHN0YXRlKVxyXG4gICAgfVxyXG5cclxuICAgIC8vIHVwZGF0ZSB0aGUgY2hpbGQgc2NlbmVzXHJcblxyXG4gICAgbGVmdC51cGRhdGUobGVmdFN0YXRlKVxyXG4gICAgcmlnaHQudXBkYXRlKHJpZ2h0U3RhdGUpXHJcblxyXG4gICAgLy8gZHJhdyB0aGUgc3BsaXQgdmlld1xyXG5cclxuICAgIGNvbnN0IGxlZnRCb3JkZXJSZWN0OiBUNCA9IFtcclxuICAgICAgMCwgMCxcclxuICAgICAgbGVmdEJ1ZmZlci53aWR0aCArIHBhZGRpbmcgKiAyLCBsZWZ0QnVmZmVyLmhlaWdodCArIHBhZGRpbmcgKiAyXHJcbiAgICBdXHJcblxyXG4gICAgY29uc3QgcmlnaHRCb3JkZXJSZWN0OiBUNCA9IFtcclxuICAgICAgbGVmdEJ1ZmZlci53aWR0aCArIHBhZGRpbmcgKiAyIC0gMSwgMCxcclxuICAgICAgcmlnaHRCdWZmZXIud2lkdGggKyBwYWRkaW5nICogMiwgcmlnaHRCdWZmZXIuaGVpZ2h0ICsgcGFkZGluZyAqIDJcclxuICAgIF1cclxuXHJcbiAgICBjb25zdCBhY3RpdmVSZWN0ID0gYWN0aXZlID09PSAwID8gbGVmdEJvcmRlclJlY3QgOiByaWdodEJvcmRlclJlY3RcclxuICAgIGNvbnN0IGluYWN0aXZlUmVjdCA9IGFjdGl2ZSA9PT0gMCA/IHJpZ2h0Qm9yZGVyUmVjdCA6IGxlZnRCb3JkZXJSZWN0XHJcblxyXG4gICAgZmlsbChidWZmZXIsIGJnQ29sb3IpXHJcblxyXG4gICAgc3Ryb2tlUmVjdChidWZmZXIsIGluYWN0aXZlUmVjdCwgYmdDb2xvcilcclxuICAgIHN0cm9rZVJlY3QoYnVmZmVyLCBhY3RpdmVSZWN0LCBhY3RpdmVCb3JkZXJDb2xvcilcclxuXHJcbiAgICBibGl0KFxyXG4gICAgICBsZWZ0QnVmZmVyLCBidWZmZXIsXHJcbiAgICAgIFtcclxuICAgICAgICAwLCAwLCBsZWZ0QnVmZmVyLndpZHRoLCBsZWZ0QnVmZmVyLmhlaWdodCxcclxuICAgICAgICBwYWRkaW5nLCBwYWRkaW5nXHJcbiAgICAgIF1cclxuICAgIClcclxuXHJcbiAgICBibGl0KFxyXG4gICAgICByaWdodEJ1ZmZlciwgYnVmZmVyLFxyXG4gICAgICBbXHJcbiAgICAgICAgMCwgMCwgcmlnaHRCdWZmZXIud2lkdGgsIHJpZ2h0QnVmZmVyLmhlaWdodCxcclxuICAgICAgICBsZWZ0QnVmZmVyLndpZHRoICsgcGFkZGluZyAqIDIsIHBhZGRpbmdcclxuICAgICAgXVxyXG4gICAgKVxyXG4gIH1cclxuXHJcbiAgY29uc3QgcXVpdCA9IGFzeW5jIChzdGF0ZTogU3RhdGUpID0+IHtcclxuICAgIGF3YWl0IGxlZnQucXVpdChzdGF0ZSlcclxuICAgIGF3YWl0IHJpZ2h0LnF1aXQoc3RhdGUpXHJcbiAgfVxyXG5cclxuICByZXR1cm4geyBpbml0LCB1cGRhdGUsIHF1aXQgfVxyXG59XHJcblxyXG4vLyBvdmVyd3JpdGUgbW91c2VYLCBtb3VzZVkgYW5kIGluQm91bmRzIGZvciBuZXcgc2l6ZVxyXG5jb25zdCB1cGRhdGVTaXplID0gKHN0YXRlOiBTdGF0ZSwgcGFyZW50U3RhdGU6IFN0YXRlLCByZWN0OiBUNCkgPT4ge1xyXG4gIHN0YXRlLm1vdXNlLmdldFggPSAoKSA9PiBwYXJlbnRTdGF0ZS5tb3VzZS5nZXRYKCkgLSByZWN0WzBdXHJcbiAgc3RhdGUubW91c2UuZ2V0WSA9ICgpID0+IHBhcmVudFN0YXRlLm1vdXNlLmdldFkoKSAtIHJlY3RbMV1cclxuXHJcbiAgc3RhdGUubW91c2UuaXNJbkJvdW5kcyA9ICgpID0+IHtcclxuICAgIGNvbnN0IFtfeCwgX3ksIHcsIGhdID0gcmVjdFxyXG5cclxuICAgIHJldHVybiAoXHJcbiAgICAgIHBhcmVudFN0YXRlLm1vdXNlLmlzSW5Cb3VuZHMoKSAmJlxyXG4gICAgICBzdGF0ZS5tb3VzZS5nZXRYKCkgPj0gMCAmJiBzdGF0ZS5tb3VzZS5nZXRYKCkgPCB3ICYmXHJcbiAgICAgIHN0YXRlLm1vdXNlLmdldFkoKSA+PSAwICYmIHN0YXRlLm1vdXNlLmdldFkoKSA8IGhcclxuICAgIClcclxuICB9XHJcbn1cclxuXHJcbi8vIHRoaXMgc3RhdGUgd2lsbCBubyBsb25nZXIgc2VlIG9yIG1vZGlmeSB0aGUgcGFyZW50IHN0YXRlJ3MgaW9cclxuY29uc3QgZGlzYWJsZUlvID0gKHN0YXRlOiBTdGF0ZSkgPT4ge1xyXG4gIHN0YXRlLmdldEtleXMgPSAoKSA9PiAoe30pXHJcbiAgc3RhdGUuZ2V0S2V5UHJlc3NlcyA9ICgpID0+IFtdXHJcbiAgc3RhdGUubW91c2UuZ2V0QnV0dG9ucyA9ICgpID0+ICh7fSlcclxuICBzdGF0ZS5tb3VzZS5nZXRXaGVlbCA9ICgpID0+IDBcclxufVxyXG5cclxuLy8gcmVhdHRhY2hlcyB0aGUgcGFyZW50IHN0YXRlJ3MgaW8gdG8gdGhlIGNoaWxkIHN0YXRlXHJcbmNvbnN0IGVuYWJsZUlvID0gKHN0YXRlOiBTdGF0ZSwgcGFyZW50U3RhdGU6IFN0YXRlKSA9PiB7XHJcbiAgc3RhdGUuZ2V0S2V5cyA9IHBhcmVudFN0YXRlLmdldEtleXNcclxuICBzdGF0ZS5nZXRLZXlQcmVzc2VzID0gcGFyZW50U3RhdGUuZ2V0S2V5UHJlc3Nlc1xyXG4gIHN0YXRlLm1vdXNlLmdldEJ1dHRvbnMgPSBwYXJlbnRTdGF0ZS5tb3VzZS5nZXRCdXR0b25zXHJcbiAgc3RhdGUubW91c2UuZ2V0V2hlZWwgPSBwYXJlbnRTdGF0ZS5tb3VzZS5nZXRXaGVlbFxyXG59XHJcblxyXG4vLyBjcmVhdGUgYSBuZXcgd3JhcHBlZCBzdGF0ZSBvYmplY3Qgd2l0aCBpdHMgb3duIGJ1ZmZlclxyXG5jb25zdCB3cmFwU3RhdGUgPSAoc3RhdGU6IFN0YXRlLCBidWZmZXI6IEltYWdlRGF0YSk6IFN0YXRlID0+IHtcclxuICBjb25zdCB7IFxyXG4gICAgZ2V0S2V5cywgZ2V0S2V5UHJlc3NlcywgbW91c2UsIHRpbWUsIHZpZXcsIGdldFJ1bm5pbmcsIHNldFJ1bm5pbmcgXHJcbiAgfSA9IHN0YXRlXHJcbiAgXHJcbiAgY29uc3Qgd3JhcHBlZDogU3RhdGUgPSB7XHJcbiAgICBnZXRLZXlzLFxyXG4gICAgZ2V0S2V5UHJlc3NlcyxcclxuICAgIG1vdXNlOiB7IC4uLm1vdXNlIH0sXHJcbiAgICB0aW1lOiB7IC4uLnRpbWUgfSxcclxuICAgIHZpZXc6IHsgXHJcbiAgICAgIC4uLnZpZXcsXHJcbiAgICAgIGdldEJ1ZmZlcjogKCkgPT4gYnVmZmVyXHJcbiAgICB9LFxyXG4gICAgZ2V0UnVubmluZyxcclxuICAgIHNldFJ1bm5pbmdcclxuICB9XHJcblxyXG4gIHJldHVybiB3cmFwcGVkXHJcbn0iXX0=