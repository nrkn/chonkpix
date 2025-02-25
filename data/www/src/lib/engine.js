import { createImage } from './image/create.js';
// chonkpix
// a stupidly simple chonky pixel engine
// private state:
let currentScene;
// misc 
let running = false;
let rafId;
// io
const keys = {};
let keyPresses = [];
let viewMouseX = 0;
let viewMouseY = 0;
let useSystemMouse = true;
let cursorInBounds = true;
let frameMouseX = 0;
let frameMouseY = 0;
let mouseWheelDelta = 0;
const mouseButtons = {};
// sound
// todo - plug in a small sound library like ZzFX or similar
// time
let startTime = null;
let lastTime;
let elapsed;
let frameTime;
// view
const minZoom = 2;
const maxZoom = 16;
let zoom = 5;
let frameW;
let frameH;
let frameBuffer;
let frameCanvas;
let frameCtx;
// public state
const state = {
    // expose keys directly, that way the consumer can make decisions like
    // clearing the key state after reading etc
    getKeys: () => keys,
    getKeyPresses: () => keyPresses,
    mouse: {
        getButtons: () => mouseButtons,
        getX: () => frameMouseX,
        getY: () => frameMouseY,
        getWheel: () => {
            // destructive read
            // otherwise the delta is retained from frame to frame
            // we could have made it so the consumer can explicitly clear it after use
            // or choose to use it, but we have no use case for
            const value = mouseWheelDelta;
            mouseWheelDelta = 0;
            return value;
        },
        isInBounds: () => cursorInBounds
    },
    time: {
        getElapsed: () => elapsed,
        getFrameTime: () => frameTime
    },
    view: {
        getZoom: () => zoom,
        setZoom: (value) => {
            zoom = Math.max(minZoom, Math.min(maxZoom, value));
            resize();
        },
        getBuffer: () => frameBuffer
    },
    getRunning: () => running,
    setRunning: (value) => {
        running = value;
    }
};
// event handlers:
const preventDefaults = new Set(['Tab']);
const keyDown = (event) => {
    keys[event.key] = true;
    if (preventDefaults.has(event.key)) {
        event.preventDefault();
        return false;
    }
};
const keyUp = (event) => {
    keys[event.key] = false;
    // forward non-printable keys to keyPress
    if (event.key === 'Backspace') {
        keyPress(event);
        return;
    }
    // any others in future
    // 
    if (preventDefaults.has(event.key)) {
        event.preventDefault();
        return false;
    }
};
const keyPress = (event) => {
    keyPresses.push(event.key);
    if (preventDefaults.has(event.key)) {
        event.preventDefault();
        return false;
    }
};
const mouseMove = (event) => {
    viewMouseX = event.clientX;
    viewMouseY = event.clientY;
    frameMouseX = Math.floor(viewMouseX / zoom);
    frameMouseY = Math.floor(viewMouseY / zoom);
};
const mouseWheel = (event) => {
    mouseWheelDelta = event.deltaY;
    if (!useSystemMouse) {
        event.preventDefault();
        return false;
    }
};
const mouseButtonDown = (event) => {
    mouseButtons[event.button] = true;
    if (!useSystemMouse) {
        event.preventDefault();
        return false;
    }
};
const mouseButtonUp = (event) => {
    mouseButtons[event.button] = false;
    if (!useSystemMouse) {
        event.preventDefault();
        return false;
    }
};
const preventContextDefault = (event) => {
    if (!useSystemMouse) {
        event.preventDefault();
        return false;
    }
};
const mouseLeave = () => {
    cursorInBounds = false;
};
const mouseEnter = () => {
    cursorInBounds = true;
};
const resize = () => {
    frameW = Math.floor(innerWidth / zoom);
    frameH = Math.floor(innerHeight / zoom);
    frameBuffer = createImage(frameW, frameH);
    frameCanvas.width = frameW;
    frameCanvas.height = frameH;
};
// mouse control:
export const releaseMouse = () => {
    useSystemMouse = true;
    frameCanvas.classList.toggle('hide-cursor', false);
};
export const takeMouse = () => {
    useSystemMouse = false;
    frameCanvas.classList.toggle('hide-cursor', true);
};
// runner:
// initialise the engine with a scene
export const start = async (scene) => {
    // if it already has a scene, halt it first
    if (currentScene)
        halt();
    currentScene = scene;
    frameCanvas = document.createElement('canvas');
    frameCanvas.id = 'viewport';
    frameCanvas.tabIndex = 0;
    document.body.append(frameCanvas);
    frameCanvas.focus();
    frameCtx = frameCanvas.getContext('2d');
    resize();
    addEventListener('resize', resize);
    frameCanvas.addEventListener('keydown', keyDown);
    frameCanvas.addEventListener('keyup', keyUp);
    frameCanvas.addEventListener('keypress', keyPress);
    frameCanvas.addEventListener('mousemove', mouseMove);
    frameCanvas.addEventListener('wheel', mouseWheel);
    frameCanvas.addEventListener('mousedown', mouseButtonDown);
    frameCanvas.addEventListener('mouseup', mouseButtonUp);
    frameCanvas.addEventListener('contextmenu', preventContextDefault);
    frameCanvas.addEventListener('mouseleave', mouseLeave);
    frameCanvas.addEventListener('mouseenter', mouseEnter);
    running = true;
    await scene.init(state);
    rafId = requestAnimationFrame(tick);
};
// tidy everything up
const halt = () => {
    running = false;
    cancelAnimationFrame(rafId);
    removeEventListener('resize', resize);
    frameCanvas.removeEventListener('keydown', keyDown);
    frameCanvas.removeEventListener('keyup', keyUp);
    frameCanvas.removeEventListener('keypress', keyPress);
    frameCanvas.removeEventListener('mousemove', mouseMove);
    frameCanvas.removeEventListener('wheel', mouseWheel);
    frameCanvas.removeEventListener('mousedown', mouseButtonDown);
    frameCanvas.removeEventListener('mouseup', mouseButtonUp);
    frameCanvas.removeEventListener('contextmenu', preventContextDefault);
    frameCanvas.removeEventListener('mouseleave', mouseLeave);
    frameCanvas.removeEventListener('mouseenter', mouseEnter);
    frameCanvas.remove();
    startTime = null;
    releaseMouse();
    if (currentScene) {
        currentScene.quit(state).catch(console.error);
        currentScene = null;
    }
};
const initTick = (time) => {
    if (startTime !== null)
        return startTime;
    // first tick
    startTime = time;
    elapsed = 0;
    frameTime = 0;
    lastTime = time;
    return startTime;
};
const tick = (time) => {
    if (!running)
        return;
    startTime = initTick(time);
    elapsed = time - startTime;
    frameTime = time - lastTime;
    lastTime = time;
    if (currentScene)
        currentScene.update(state);
    // scene may have sent a quit signal
    if (!running) {
        halt();
        return;
    }
    // render
    frameCtx.putImageData(frameBuffer, 0, 0);
    //
    rafId = requestAnimationFrame(tick);
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZW5naW5lLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vc3JjL2xpYi9lbmdpbmUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsT0FBTyxFQUFFLFdBQVcsRUFBRSxNQUFNLG1CQUFtQixDQUFBO0FBRy9DLFdBQVc7QUFDWCx3Q0FBd0M7QUFFeEMsaUJBQWlCO0FBRWpCLElBQUksWUFBMEIsQ0FBQTtBQUU5QixRQUFRO0FBRVIsSUFBSSxPQUFPLEdBQUcsS0FBSyxDQUFBO0FBQ25CLElBQUksS0FBYSxDQUFBO0FBRWpCLEtBQUs7QUFFTCxNQUFNLElBQUksR0FBNEIsRUFBRSxDQUFBO0FBQ3hDLElBQUksVUFBVSxHQUFhLEVBQUUsQ0FBQTtBQUU3QixJQUFJLFVBQVUsR0FBRyxDQUFDLENBQUE7QUFDbEIsSUFBSSxVQUFVLEdBQUcsQ0FBQyxDQUFBO0FBRWxCLElBQUksY0FBYyxHQUFHLElBQUksQ0FBQTtBQUN6QixJQUFJLGNBQWMsR0FBRyxJQUFJLENBQUE7QUFDekIsSUFBSSxXQUFXLEdBQUcsQ0FBQyxDQUFBO0FBQ25CLElBQUksV0FBVyxHQUFHLENBQUMsQ0FBQTtBQUVuQixJQUFJLGVBQWUsR0FBRyxDQUFDLENBQUE7QUFFdkIsTUFBTSxZQUFZLEdBQTRCLEVBQUUsQ0FBQTtBQUVoRCxRQUFRO0FBQ1IsNERBQTREO0FBRTVELE9BQU87QUFFUCxJQUFJLFNBQVMsR0FBa0IsSUFBSSxDQUFBO0FBQ25DLElBQUksUUFBZ0IsQ0FBQTtBQUNwQixJQUFJLE9BQWUsQ0FBQTtBQUNuQixJQUFJLFNBQWlCLENBQUE7QUFFckIsT0FBTztBQUVQLE1BQU0sT0FBTyxHQUFHLENBQUMsQ0FBQTtBQUNqQixNQUFNLE9BQU8sR0FBRyxFQUFFLENBQUE7QUFFbEIsSUFBSSxJQUFJLEdBQUcsQ0FBQyxDQUFBO0FBRVosSUFBSSxNQUFjLENBQUE7QUFDbEIsSUFBSSxNQUFjLENBQUE7QUFDbEIsSUFBSSxXQUFzQixDQUFBO0FBQzFC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QXFCLENBQUMsSUFBSSxDQUFDLENBQUE7QUFDckMsQ0FBQyxDQUFBIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgY3JlYXRlSW1hZ2UgfSBmcm9tICcuL2ltYWdlL2NyZWF0ZS5qcydcclxuaW1wb3J0IHsgTWF5YmUsIFNjZW5lLCBTdGF0ZSB9IGZyb20gJy4vdHlwZXMuanMnXHJcblxyXG4vLyBjaG9ua3BpeFxyXG4vLyBhIHN0dXBpZGx5IHNpbXBsZSBjaG9ua3kgcGl4ZWwgZW5naW5lXHJcblxyXG4vLyBwcml2YXRlIHN0YXRlOlxyXG5cclxubGV0IGN1cnJlbnRTY2VuZTogTWF5YmU8U2NlbmU+XHJcblxyXG4vLyBtaXNjIFxyXG5cclxubGV0IHJ1bm5pbmcgPSBmYWxzZVxyXG5sZXQgcmFmSWQ6IG51bWJlclxyXG5cclxuLy8gaW9cclxuXHJcbmNvbnN0IGtleXM6IFJlY29yZDxzdHJpbmcsIGJvb2xlYW4+ID0ge31cclxubGV0IGtleVByZXNzZXM6IHN0cmluZ1tdID0gW11cclxuXHJcbmxldCB2aWV3TW91c2VYID0gMFxyXG5sZXQgdmlld01vdXNlWSA9IDBcclxuXHJcbmxldCB1c2VTeXN0ZW1Nb3VzZSA9IHRydWVcclxubGV0IGN1cnNvckluQm91bmRzID0gdHJ1ZVxyXG5sZXQgZnJhbWVNb3VzZVggPSAwXHJcbmxldCBmcmFtZU1vdXNlWSA9IDBcclxuXHJcbmxldCBtb3VzZVdoZWVsRGVsdGEgPSAwXHJcblxyXG5jb25zdCBtb3VzZUJ1dHRvbnM6IFJlY29yZDxudW1iZXIsIGJvb2xlYW4+ID0ge31cclxuXHJcbi8vIHNvdW5kXHJcbi8vIHRvZG8gLSBwbHVnIGluIGEgc21hbGwgc291bmQgbGlicmFyeSBsaWtlIFp6Rlggb3Igc2ltaWxhclxyXG5cclxuLy8gdGltZVxyXG5cclxubGV0IHN0YXJ0VGltZTogbnVtYmVyIHwgbnVsbCA9IG51bGxcclxubGV0IGxhc3RUaW1lOiBudW1iZXJcclxubGV0IGVsYXBzZWQ6IG51bWJlclxyXG5sZXQgZnJhbWVUaW1lOiBudW1iZXJcclxuXHJcbi8vIHZpZXdcclxuXHJcbmNvbnN0IG1pblpvb20gPSAyXHJcbmNvbnN0IG1heFpvb20gPSAxNlxyXG5cclxubGV0IHpvb20gPSA1XHJcblxyXG5sZXQgZnJhbWVXOiBudW1iZXJcclxubGV0IGZyYW1lSDogbnVtYmVyXHJcbmxldCBmcmFtZUJ1ZmZlcjogSW1hZ2VEYXRhXHJcbmxldCBmcmFtZUNhbnZhczogSFRNTENhbnZhc0VsZW1lbnRcclxubGV0IGZyYW1lQ3R4OiBDYW52YXNSZW5kZXJpbmdDb250ZXh0MkRcclxuXHJcbi8vIHB1YmxpYyBzdGF0ZVxyXG5cclxuY29uc3Qgc3RhdGU6IFN0YXRlID0ge1xyXG4gIC8vIGV4cG9zZSBrZXlzIGRpcmVjdGx5LCB0aGF0IHdheSB0aGUgY29uc3VtZXIgY2FuIG1ha2UgZGVjaXNpb25zIGxpa2VcclxuICAvLyBjbGVhcmluZyB0aGUga2V5IHN0YXRlIGFmdGVyIHJlYWRpbmcgZXRjXHJcbiAgZ2V0S2V5czogKCkgPT4ga2V5cyxcclxuICBnZXRLZXlQcmVzc2VzOiAoKSA9PiBrZXlQcmVzc2VzLFxyXG5cclxuICBtb3VzZToge1xyXG4gICAgZ2V0QnV0dG9uczogKCkgPT4gbW91c2VCdXR0b25zLFxyXG4gICAgZ2V0WDogKCkgPT4gZnJhbWVNb3VzZVgsXHJcbiAgICBnZXRZOiAoKSA9PiBmcmFtZU1vdXNlWSxcclxuICAgIGdldFdoZWVsOiAoKSA9PiB7XHJcbiAgICAgIC8vIGRlc3RydWN0aXZlIHJlYWRcclxuICAgICAgLy8gb3RoZXJ3aXNlIHRoZSBkZWx0YSBpcyByZXRhaW5lZCBmcm9tIGZyYW1lIHRvIGZyYW1lXHJcbiAgICAgIC8vIHdlIGNvdWxkIGhhdmUgbWFkZSBpdCBzbyB0aGUgY29uc3VtZXIgY2FuIGV4cGxpY2l0bHkgY2xlYXIgaXQgYWZ0ZXIgdXNlXHJcbiAgICAgIC8vIG9yIGNob29zZSB0byB1c2UgaXQsIGJ1dCB3ZSBoYXZlIG5vIHVzZSBjYXNlIGZvclxyXG4gICAgICBjb25zdCB2YWx1ZSA9IG1vdXNlV2hlZWxEZWx0YVxyXG5cclxuICAgICAgbW91c2VXaGVlbERlbHRhID0gMFxyXG5cclxuICAgICAgcmV0dXJuIHZhbHVlXHJcbiAgICB9LFxyXG4gICAgaXNJbkJvdW5kczogKCkgPT4gY3Vyc29ySW5Cb3VuZHNcclxuICB9LFxyXG5cclxuICB0aW1lOiB7XHJcbiAgICBnZXRFbGFwc2VkOiAoKSA9PiBlbGFwc2VkLFxyXG4gICAgZ2V0RnJhbWVUaW1lOiAoKSA9PiBmcmFtZVRpbWVcclxuICB9LFxyXG5cclxuICB2aWV3OiB7XHJcbiAgICBnZXRab29tOiAoKSA9PiB6b29tLFxyXG4gICAgc2V0Wm9vbTogKHZhbHVlOiBudW1iZXIpID0+IHtcclxuICAgICAgem9vbSA9IE1hdGgubWF4KG1pblpvb20sIE1hdGgubWluKG1heFpvb20sIHZhbHVlKSlcclxuICAgICAgcmVzaXplKClcclxuICAgIH0sXHJcbiAgICBnZXRCdWZmZXI6ICgpID0+IGZyYW1lQnVmZmVyXHJcbiAgfSxcclxuXHJcbiAgZ2V0UnVubmluZzogKCkgPT4gcnVubmluZyxcclxuICBzZXRSdW5uaW5nOiAodmFsdWU6IGJvb2xlYW4pID0+IHtcclxuICAgIHJ1bm5pbmcgPSB2YWx1ZVxyXG4gIH1cclxufVxyXG5cclxuLy8gZXZlbnQgaGFuZGxlcnM6XHJcblxyXG5jb25zdCBwcmV2ZW50RGVmYXVsdHMgPSBuZXcgU2V0PHN0cmluZz4oWydUYWInXSlcclxuXHJcbmNvbnN0IGtleURvd24gPSAoZXZlbnQ6IEtleWJvYXJkRXZlbnQpID0+IHtcclxuICBrZXlzW2V2ZW50LmtleV0gPSB0cnVlXHJcblxyXG4gIGlmIChwcmV2ZW50RGVmYXVsdHMuaGFzKGV2ZW50LmtleSkpIHtcclxuICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KClcclxuXHJcbiAgICByZXR1cm4gZmFsc2VcclxuICB9XHJcbn1cclxuXHJcbmNvbnN0IGtleVVwID0gKGV2ZW50OiBLZXlib2FyZEV2ZW50KSA9PiB7XHJcbiAga2V5c1tldmVudC5rZXldID0gZmFsc2VcclxuXHJcbiAgLy8gZm9yd2FyZCBub24tcHJpbnRhYmxlIGtleXMgdG8ga2V5UHJlc3NcclxuICBpZiAoZXZlbnQua2V5ID09PSAnQmFja3NwYWNlJykge1xyXG4gICAga2V5UHJlc3MoZXZlbnQpXHJcblxyXG4gICAgcmV0dXJuXHJcbiAgfVxyXG5cclxuICAvLyBhbnkgb3RoZXJzIGluIGZ1dHVyZVxyXG5cclxuICAvLyBcclxuXHJcbiAgaWYgKHByZXZlbnREZWZhdWx0cy5oYXMoZXZlbnQua2V5KSkge1xyXG4gICAgZXZlbnQucHJldmVudERlZmF1bHQoKVxyXG5cclxuICAgIHJldHVybiBmYWxzZVxyXG4gIH1cclxufVxyXG5cclxuY29uc3Qga2V5UHJlc3MgPSAoZXZlbnQ6IEtleWJvYXJkRXZlbnQpID0+IHtcclxuICBrZXlQcmVzc2VzLnB1c2goZXZlbnQua2V5KVxyXG5cclxuICBpZiAocHJldmVudERlZmF1bHRzLmhhcyhldmVudC5rZXkpKSB7XHJcbiAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpXHJcblxyXG4gICAgcmV0dXJuIGZhbHNlXHJcbiAgfVxyXG59XHJcblxyXG5jb25zdCBtb3VzZU1vdmUgPSAoZXZlbnQ6IE1vdXNlRXZlbnQpID0+IHtcclxuICB2aWV3TW91c2VYID0gZXZlbnQuY2xpZW50WFxyXG4gIHZpZXdNb3VzZVkgPSBldmVudC5jbGllbnRZXHJcblxyXG4gIGZyYW1lTW91c2VYID0gTWF0aC5mbG9vcih2aWV3TW91c2VYIC8gem9vbSlcclxuICBmcmFtZU1vdXNlWSA9IE1hdGguZmxvb3Iodmlld01vdXNlWSAvIHpvb20pXHJcbn1cclxuXHJcbmNvbnN0IG1vdXNlV2hlZWwgPSAoZXZlbnQ6IFdoZWVsRXZlbnQpID0+IHtcclxuICBtb3VzZVdoZWVsRGVsdGEgPSBldmVudC5kZWx0YVlcclxuXHJcbiAgaWYgKCF1c2VTeXN0ZW1Nb3VzZSkge1xyXG4gICAgZXZlbnQucHJldmVudERlZmF1bHQoKVxyXG5cclxuICAgIHJldHVybiBmYWxzZVxyXG4gIH1cclxufVxyXG5cclxuY29uc3QgbW91c2VCdXR0b25Eb3duID0gKGV2ZW50OiBNb3VzZUV2ZW50KSA9PiB7XHJcbiAgbW91c2VCdXR0b25zW2V2ZW50LmJ1dHRvbl0gPSB0cnVlXHJcblxyXG4gIGlmICghdXNlU3lzdGVtTW91c2UpIHtcclxuICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KClcclxuXHJcbiAgICByZXR1cm4gZmFsc2VcclxuICB9XHJcbn1cclxuXHJcbmNvbnN0IG1vdXNlQnV0dG9uVXAgPSAoZXZlbnQ6IE1vdXNlRXZlbnQpID0+IHtcclxuICBtb3VzZUJ1dHRvbnNbZXZlbnQuYnV0dG9uXSA9IGZhbHNlXHJcblxyXG4gIGlmICghdXNlU3lzdGVtTW91c2UpIHtcclxuICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KClcclxuXHJcbiAgICByZXR1cm4gZmFsc2VcclxuICB9XHJcbn1cclxuXHJcbmNvbnN0IHByZXZlbnRDb250ZXh0RGVmYXVsdCA9IChldmVudDogRXZlbnQpID0+IHtcclxuICBpZiAoIXVzZVN5c3RlbU1vdXNlKSB7XHJcbiAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpXHJcblxyXG4gICAgcmV0dXJuIGZhbHNlXHJcbiAgfVxyXG59XHJcblxyXG5jb25zdCBtb3VzZUxlYXZlID0gKCkgPT4ge1xyXG4gIGN1cnNvckluQm91bmRzID0gZmFsc2VcclxufVxyXG5cclxuY29uc3QgbW91c2VFbnRlciA9ICgpID0+IHtcclxuICBjdXJzb3JJbkJvdW5kcyA9IHRydWVcclxufVxyXG5cclxuY29uc3QgcmVzaXplID0gKCkgPT4ge1xyXG4gIGZyYW1lVyA9IE1hdGguZmxvb3IoaW5uZXJXaWR0aCAvIHpvb20pXHJcbiAgZnJhbWVIID0gTWF0aC5mbG9vcihpbm5lckhlaWdodCAvIHpvb20pXHJcblxyXG4gIGZyYW1lQnVmZmVyID0gY3JlYXRlSW1hZ2UoZnJhbWVXLCBmcmFtZUgpXHJcblxyXG4gIGZyYW1lQ2FudmFzLndpZHRoID0gZnJhbWVXXHJcbiAgZnJhbWVDYW52YXMuaGVpZ2h0ID0gZnJhbWVIXHJcbn1cclxuXHJcbi8vIG1vdXNlIGNvbnRyb2w6XHJcblxyXG5leHBvcnQgY29uc3QgcmVsZWFzZU1vdXNlID0gKCkgPT4ge1xyXG4gIHVzZVN5c3RlbU1vdXNlID0gdHJ1ZVxyXG4gIGZyYW1lQ2FudmFzLmNsYXNzTGlzdC50b2dnbGUoJ2hpZGUtY3Vyc29yJywgZmFsc2UpXHJcbn1cclxuXHJcbmV4cG9ydCBjb25zdCB0YWtlTW91c2UgPSAoKSA9PiB7XHJcbiAgdXNlU3lzdGVtTW91c2UgPSBmYWxzZVxyXG4gIGZyYW1lQ2FudmFzLmNsYXNzTGlzdC50b2dnbGUoJ2hpZGUtY3Vyc29yJywgdHJ1ZSlcclxufVxyXG5cclxuLy8gcnVubmVyOlxyXG5cclxuLy8gaW5pdGlhbGlzZSB0aGUgZW5naW5lIHdpdGggYSBzY2VuZVxyXG5leHBvcnQgY29uc3Qgc3RhcnQgPSBhc3luYyAoc2NlbmU6IFNjZW5lKSA9PiB7XHJcbiAgLy8gaWYgaXQgYWxyZWFkeSBoYXMgYSBzY2VuZSwgaGFsdCBpdCBmaXJzdFxyXG4gIGlmKCBjdXJyZW50U2NlbmUgKSBoYWx0KClcclxuXHJcbiAgY3VycmVudFNjZW5lID0gc2NlbmVcclxuXHJcbiAgZnJhbWVDYW52YXMgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdjYW52YXMnKVxyXG4gIGZyYW1lQ2FudmFzLmlkID0gJ3ZpZXdwb3J0J1xyXG4gIGZyYW1lQ2FudmFzLnRhYkluZGV4ID0gMFxyXG5cclxuICBkb2N1bWVudC5ib2R5LmFwcGVuZChmcmFtZUNhbnZhcylcclxuXHJcbiAgZnJhbWVDYW52YXMuZm9jdXMoKVxyXG5cclxuICBmcmFtZUN0eCA9IGZyYW1lQ2FudmFzLmdldENvbnRleHQoJzJkJykhXHJcblxyXG4gIHJlc2l6ZSgpXHJcblxyXG4gIGFkZEV2ZW50TGlzdGVuZXIoJ3Jlc2l6ZScsIHJlc2l6ZSlcclxuXHJcbiAgZnJhbWVDYW52YXMuYWRkRXZlbnRMaXN0ZW5lcigna2V5ZG93bicsIGtleURvd24pXHJcbiAgZnJhbWVDYW52YXMuYWRkRXZlbnRMaXN0ZW5lcigna2V5dXAnLCBrZXlVcClcclxuICBmcmFtZUNhbnZhcy5hZGRFdmVudExpc3RlbmVyKCdrZXlwcmVzcycsIGtleVByZXNzKVxyXG5cclxuICBmcmFtZUNhbnZhcy5hZGRFdmVudExpc3RlbmVyKCdtb3VzZW1vdmUnLCBtb3VzZU1vdmUpXHJcbiAgZnJhbWVDYW52YXMuYWRkRXZlbnRMaXN0ZW5lcignd2hlZWwnLCBtb3VzZVdoZWVsKVxyXG4gIGZyYW1lQ2FudmFzLmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNlZG93bicsIG1vdXNlQnV0dG9uRG93bilcclxuICBmcmFtZUNhbnZhcy5hZGRFdmVudExpc3RlbmVyKCdtb3VzZXVwJywgbW91c2VCdXR0b25VcClcclxuICBmcmFtZUNhbnZhcy5hZGRFdmVudExpc3RlbmVyKCdjb250ZXh0bWVudScsIHByZXZlbnRDb250ZXh0RGVmYXVsdClcclxuICBmcmFtZUNhbnZhcy5hZGRFdmVudExpc3RlbmVyKCdtb3VzZWxlYXZlJywgbW91c2VMZWF2ZSlcclxuICBmcmFtZUNhbnZhcy5hZGRFdmVudExpc3RlbmVyKCdtb3VzZWVudGVyJywgbW91c2VFbnRlcilcclxuXHJcbiAgcnVubmluZyA9IHRydWVcclxuXHJcbiAgYXdhaXQgc2NlbmUuaW5pdChzdGF0ZSlcclxuXHJcbiAgcmFmSWQgPSByZXF1ZXN0QW5pbWF0aW9uRnJhbWUodGljaylcclxufVxyXG5cclxuLy8gdGlkeSBldmVyeXRoaW5nIHVwXHJcbmNvbnN0IGhhbHQgPSAoKSA9PiB7XHJcbiAgcnVubmluZyA9IGZhbHNlXHJcbiAgY2FuY2VsQW5pbWF0aW9uRnJhbWUocmFmSWQpXHJcblxyXG4gIHJlbW92ZUV2ZW50TGlzdGVuZXIoJ3Jlc2l6ZScsIHJlc2l6ZSlcclxuXHJcbiAgZnJhbWVDYW52YXMucmVtb3ZlRXZlbnRMaXN0ZW5lcigna2V5ZG93bicsIGtleURvd24pXHJcbiAgZnJhbWVDYW52YXMucmVtb3ZlRXZlbnRMaXN0ZW5lcigna2V5dXAnLCBrZXlVcClcclxuICBmcmFtZUNhbnZhcy5yZW1vdmVFdmVudExpc3RlbmVyKCdrZXlwcmVzcycsIGtleVByZXNzKVxyXG5cclxuICBmcmFtZUNhbnZhcy5yZW1vdmVFdmVudExpc3RlbmVyKCdtb3VzZW1vdmUnLCBtb3VzZU1vdmUpXHJcbiAgZnJhbWVDYW52YXMucmVtb3ZlRXZlbnRMaXN0ZW5lcignd2hlZWwnLCBtb3VzZVdoZWVsKVxyXG4gIGZyYW1lQ2FudmFzLnJlbW92ZUV2ZW50TGlzdGVuZXIoJ21vdXNlZG93bicsIG1vdXNlQnV0dG9uRG93bilcclxuICBmcmFtZUNhbnZhcy5yZW1vdmVFdmVudExpc3RlbmVyKCdtb3VzZXVwJywgbW91c2VCdXR0b25VcClcclxuICBmcmFtZUNhbnZhcy5yZW1vdmVFdmVudExpc3RlbmVyKCdjb250ZXh0bWVudScsIHByZXZlbnRDb250ZXh0RGVmYXVsdClcclxuICBmcmFtZUNhbnZhcy5yZW1vdmVFdmVudExpc3RlbmVyKCdtb3VzZWxlYXZlJywgbW91c2VMZWF2ZSlcclxuICBmcmFtZUNhbnZhcy5yZW1vdmVFdmVudExpc3RlbmVyKCdtb3VzZWVudGVyJywgbW91c2VFbnRlcilcclxuXHJcbiAgZnJhbWVDYW52YXMucmVtb3ZlKClcclxuXHJcbiAgc3RhcnRUaW1lID0gbnVsbFxyXG5cclxuICByZWxlYXNlTW91c2UoKVxyXG5cclxuICBpZiAoY3VycmVudFNjZW5lKXtcclxuICAgIGN1cnJlbnRTY2VuZS5xdWl0KHN0YXRlKS5jYXRjaChjb25zb2xlLmVycm9yKVxyXG5cclxuICAgIGN1cnJlbnRTY2VuZSA9IG51bGxcclxuICB9XHJcbn1cclxuXHJcbmNvbnN0IGluaXRUaWNrID0gKHRpbWU6IG51bWJlcikgPT4ge1xyXG4gIGlmIChzdGFydFRpbWUgIT09IG51bGwpIHJldHVybiBzdGFydFRpbWVcclxuXHJcbiAgLy8gZmlyc3QgdGlja1xyXG5cclxuICBzdGFydFRpbWUgPSB0aW1lXHJcblxyXG4gIGVsYXBzZWQgPSAwXHJcbiAgZnJhbWVUaW1lID0gMFxyXG4gIGxhc3RUaW1lID0gdGltZVxyXG5cclxuICByZXR1cm4gc3RhcnRUaW1lXHJcbn1cclxuXHJcbmNvbnN0IHRpY2sgPSAodGltZTogbnVtYmVyKSA9PiB7XHJcbiAgaWYgKCFydW5uaW5nKSByZXR1cm5cclxuXHJcbiAgc3RhcnRUaW1lID0gaW5pdFRpY2sodGltZSlcclxuICBlbGFwc2VkID0gdGltZSAtIHN0YXJ0VGltZVxyXG4gIGZyYW1lVGltZSA9IHRpbWUgLSBsYXN0VGltZVxyXG4gIGxhc3RUaW1lID0gdGltZVxyXG5cclxuICBpZiggY3VycmVudFNjZW5lICkgY3VycmVudFNjZW5lLnVwZGF0ZShzdGF0ZSlcclxuICBcclxuICAvLyBzY2VuZSBtYXkgaGF2ZSBzZW50IGEgcXVpdCBzaWduYWxcclxuICBpZiAoIXJ1bm5pbmcpIHtcclxuICAgIGhhbHQoKVxyXG5cclxuICAgIHJldHVyblxyXG4gIH1cclxuXHJcbiAgLy8gcmVuZGVyXHJcblxyXG4gIGZyYW1lQ3R4LnB1dEltYWdlRGF0YShmcmFtZUJ1ZmZlciwgMCwgMClcclxuXHJcbiAgLy9cclxuXHJcbiAgcmFmSWQgPSByZXF1ZXN0QW5pbWF0aW9uRnJhbWUodGljaylcclxufVxyXG4iXX0=