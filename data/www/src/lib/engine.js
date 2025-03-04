import { createImage } from './image/create.js';
// chonkpix
// a stupidly simple chonky pixel engine
// private state:
let currentScene;
// misc 
let running = false;
let rafId;
let isReady = false;
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
const minZoom = 1;
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
        takeWheel: () => {
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
            resized();
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
    keyPresses.push(event.key);
    if (preventDefaults.has(event.key)) {
        event.preventDefault();
        return false;
    }
};
const keyUp = (event) => {
    keys[event.key] = false;
    // any others in future
    // 
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
const resized = () => {
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
    if (frameCanvas)
        frameCanvas.remove();
    frameCanvas = document.createElement('canvas');
    frameCanvas.id = 'viewport';
    frameCanvas.tabIndex = 0;
    document.body.append(frameCanvas);
    frameCanvas.focus();
    frameCtx = frameCanvas.getContext('2d');
    resized();
    addEventListener('resize', resized);
    frameCanvas.addEventListener('keydown', keyDown);
    frameCanvas.addEventListener('keyup', keyUp);
    frameCanvas.addEventListener('mousemove', mouseMove);
    frameCanvas.addEventListener('wheel', mouseWheel);
    frameCanvas.addEventListener('mousedown', mouseButtonDown);
    frameCanvas.addEventListener('mouseup', mouseButtonUp);
    frameCanvas.addEventListener('contextmenu', preventContextDefault);
    frameCanvas.addEventListener('mouseleave', mouseLeave);
    frameCanvas.addEventListener('mouseenter', mouseEnter);
    running = true;
    rafId = requestAnimationFrame(tick);
    await scene.init(state);
    isReady = true;
};
// tidy everything up
const halt = () => {
    running = false;
    isReady = false;
    cancelAnimationFrame(rafId);
    removeEventListener('resize', resized);
    frameCanvas.removeEventListener('keydown', keyDown);
    frameCanvas.removeEventListener('keyup', keyUp);
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
    if (currentScene && isReady)
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZW5naW5lLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vc3JjL2xpYi9lbmdpbmUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsT0FBTyxFQUFFLFdBQVcsRUFBRSxNQUFNLG1CQUFtQixDQUFBO0FBRy9DLFdBQVc7QUFDWCx3Q0FBd0M7QUFFeEMsaUJBQWlCO0FBRWpCLElBQUksWUFBMEIsQ0FBQTtBQUU5QixRQUFRO0FBRVIsSUFBSSxPQUFPLEdBQUcsS0FBSyxDQUFBO0FBQ25CLElBQUksS0FBYSxDQUFBO0FBQ2pCLElBQUksT0FBTyxHQUFHLEtBQUssQ0FBQTtBQUVuQixLQUFLO0FBRUwsTUFBTSxJQUFJLEdBQTRCLEVBQUUsQ0FBQTtBQUN4QyxJQUFJLFVBQVUsR0FBYSxFQUFFLENBQUE7QUFFN0IsSUFBSSxVQUFVLEdBQUcsQ0FBQyxDQUFBO0FBQ2xCLElBQUksVUFBVSxHQUFHLENBQUMsQ0FBQTtBQUVsQixJQUFJLGNBQWMsR0FBRyxJQUFJLENBQUE7QUFDekIsSUFBSSxjQUFjLEdBQUcsSUFBSSxDQUFBO0FBQ3pCLElBQUksV0FBVyxHQUFHLENBQUMsQ0FBQTtBQUNuQixJQUFJLFdBQVcsR0FBRyxDQUFDLENBQUE7QUFFbkIsSUFBSSxlQUFlLEdBQUcsQ0FBQyxDQUFBO0FBRXZCLE1BQU0sWUFBWSxHQUE0QixFQUFFLENBQUE7QUFFaEQsUUFBUTtBQUNSLDREQUE0RDtBQUU1RCxPQUFPO0FBRVAsSUFBSSxTQUFTLEdBQWtCLElBQUksQ0FBQTtBQUNuQyxJQUFJLFFBQWdCLENBQUE7QUFDcEIsSUFBSSxPQUFlLENBQUE7QUFDbkIsSUFBSSxTQUFpQixDQUFBO0FBRXJCLE9BQU87QUFFUCxNQUFNLE9BQU8sR0FBRyxDQUFDLENBQUE7QUFDakIsTUFBTSxPQUFPLEdBQUcsRUFBRSxDQUFBO0FBRWxCLElBQUksSUFBSSxHQUFHLENBQUMsQ0FBQTtBQUVaLElBQUksTUFBYyxDQUFBO0FBQ2xCLElBQUksTUFBYyxD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QUksU0FBUyxLQUFLLElBQUk7UUFBRSxPQUFPLFNBQVMsQ0FBQTtJQUV4QyxhQUFhO0lBRWIsU0FBUyxHQUFHLElBQUksQ0FBQTtJQUVoQixPQUFPLEdBQUcsQ0FBQyxDQUFBO0lBQ1gsU0FBUyxHQUFHLENBQUMsQ0FBQTtJQUNiLFFBQVEsR0FBRyxJQUFJLENBQUE7SUFFZixPQUFPLFNBQVMsQ0FBQTtBQUNsQixDQUFDLENBQUE7QUFFRCxNQUFNLElBQUksR0FBRyxDQUFDLElBQVksRUFBRSxFQUFFO0lBQzVCLElBQUksQ0FBQyxPQUFPO1FBQUUsT0FBTTtJQUVwQixTQUFTLEdBQUcsUUFBUSxDQUFDLElBQUksQ0FBQyxDQUFBO0lBQzFCLE9BQU8sR0FBRyxJQUFJLEdBQUcsU0FBUyxDQUFBO0lBQzFCLFNBQVMsR0FBRyxJQUFJLEdBQUcsUUFBUSxDQUFBO0lBQzNCLFFBQVEsR0FBRyxJQUFJLENBQUE7SUFFZixJQUFJLFlBQVksSUFBSSxPQUFPO1FBQUUsWUFBWSxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsQ0FBQTtJQUV2RCxvQ0FBb0M7SUFDcEMsSUFBSSxDQUFDLE9BQU8sRUFBRSxDQUFDO1FBQ2IsSUFBSSxFQUFFLENBQUE7UUFFTixPQUFNO0lBQ1IsQ0FBQztJQUVELFNBQVM7SUFFVCxRQUFRLENBQUMsWUFBWSxDQUFDLFdBQVcsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUE7SUFFeEMsRUFBRTtJQUVGLEtBQUssR0FBRyxxQkFBcUIsQ0FBQyxJQUFJLENBQUMsQ0FBQTtBQUNyQyxDQUFDLENBQUEiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBjcmVhdGVJbWFnZSB9IGZyb20gJy4vaW1hZ2UvY3JlYXRlLmpzJ1xyXG5pbXBvcnQgeyBNYXliZSwgU2NlbmUsIFN0YXRlIH0gZnJvbSAnLi90eXBlcy5qcydcclxuXHJcbi8vIGNob25rcGl4XHJcbi8vIGEgc3R1cGlkbHkgc2ltcGxlIGNob25reSBwaXhlbCBlbmdpbmVcclxuXHJcbi8vIHByaXZhdGUgc3RhdGU6XHJcblxyXG5sZXQgY3VycmVudFNjZW5lOiBNYXliZTxTY2VuZT5cclxuXHJcbi8vIG1pc2MgXHJcblxyXG5sZXQgcnVubmluZyA9IGZhbHNlXHJcbmxldCByYWZJZDogbnVtYmVyXHJcbmxldCBpc1JlYWR5ID0gZmFsc2VcclxuXHJcbi8vIGlvXHJcblxyXG5jb25zdCBrZXlzOiBSZWNvcmQ8c3RyaW5nLCBib29sZWFuPiA9IHt9XHJcbmxldCBrZXlQcmVzc2VzOiBzdHJpbmdbXSA9IFtdXHJcblxyXG5sZXQgdmlld01vdXNlWCA9IDBcclxubGV0IHZpZXdNb3VzZVkgPSAwXHJcblxyXG5sZXQgdXNlU3lzdGVtTW91c2UgPSB0cnVlXHJcbmxldCBjdXJzb3JJbkJvdW5kcyA9IHRydWVcclxubGV0IGZyYW1lTW91c2VYID0gMFxyXG5sZXQgZnJhbWVNb3VzZVkgPSAwXHJcblxyXG5sZXQgbW91c2VXaGVlbERlbHRhID0gMFxyXG5cclxuY29uc3QgbW91c2VCdXR0b25zOiBSZWNvcmQ8bnVtYmVyLCBib29sZWFuPiA9IHt9XHJcblxyXG4vLyBzb3VuZFxyXG4vLyB0b2RvIC0gcGx1ZyBpbiBhIHNtYWxsIHNvdW5kIGxpYnJhcnkgbGlrZSBaekZYIG9yIHNpbWlsYXJcclxuXHJcbi8vIHRpbWVcclxuXHJcbmxldCBzdGFydFRpbWU6IG51bWJlciB8IG51bGwgPSBudWxsXHJcbmxldCBsYXN0VGltZTogbnVtYmVyXHJcbmxldCBlbGFwc2VkOiBudW1iZXJcclxubGV0IGZyYW1lVGltZTogbnVtYmVyXHJcblxyXG4vLyB2aWV3XHJcblxyXG5jb25zdCBtaW5ab29tID0gMVxyXG5jb25zdCBtYXhab29tID0gMTZcclxuXHJcbmxldCB6b29tID0gNVxyXG5cclxubGV0IGZyYW1lVzogbnVtYmVyXHJcbmxldCBmcmFtZUg6IG51bWJlclxyXG5sZXQgZnJhbWVCdWZmZXI6IEltYWdlRGF0YVxyXG5sZXQgZnJhbWVDYW52YXM6IEhUTUxDYW52YXNFbGVtZW50XHJcbmxldCBmcmFtZUN0eDogQ2FudmFzUmVuZGVyaW5nQ29udGV4dDJEXHJcblxyXG4vLyBwdWJsaWMgc3RhdGVcclxuXHJcbmNvbnN0IHN0YXRlOiBTdGF0ZSA9IHtcclxuICAvLyBleHBvc2Uga2V5cyBkaXJlY3RseSwgdGhhdCB3YXkgdGhlIGNvbnN1bWVyIGNhbiBtYWtlIGRlY2lzaW9ucyBsaWtlXHJcbiAgLy8gY2xlYXJpbmcgdGhlIGtleSBzdGF0ZSBhZnRlciByZWFkaW5nIGV0Y1xyXG4gIGdldEtleXM6ICgpID0+IGtleXMsXHJcbiAgZ2V0S2V5UHJlc3NlczogKCkgPT4ga2V5UHJlc3NlcyxcclxuXHJcbiAgbW91c2U6IHtcclxuICAgIGdldEJ1dHRvbnM6ICgpID0+IG1vdXNlQnV0dG9ucyxcclxuICAgIGdldFg6ICgpID0+IGZyYW1lTW91c2VYLFxyXG4gICAgZ2V0WTogKCkgPT4gZnJhbWVNb3VzZVksXHJcbiAgICB0YWtlV2hlZWw6ICgpID0+IHtcclxuICAgICAgLy8gZGVzdHJ1Y3RpdmUgcmVhZFxyXG4gICAgICAvLyBvdGhlcndpc2UgdGhlIGRlbHRhIGlzIHJldGFpbmVkIGZyb20gZnJhbWUgdG8gZnJhbWVcclxuICAgICAgLy8gd2UgY291bGQgaGF2ZSBtYWRlIGl0IHNvIHRoZSBjb25zdW1lciBjYW4gZXhwbGljaXRseSBjbGVhciBpdCBhZnRlciB1c2VcclxuICAgICAgLy8gb3IgY2hvb3NlIHRvIHVzZSBpdCwgYnV0IHdlIGhhdmUgbm8gdXNlIGNhc2UgZm9yXHJcbiAgICAgIGNvbnN0IHZhbHVlID0gbW91c2VXaGVlbERlbHRhXHJcblxyXG4gICAgICBtb3VzZVdoZWVsRGVsdGEgPSAwXHJcblxyXG4gICAgICByZXR1cm4gdmFsdWVcclxuICAgIH0sXHJcbiAgICBpc0luQm91bmRzOiAoKSA9PiBjdXJzb3JJbkJvdW5kc1xyXG4gIH0sXHJcblxyXG4gIHRpbWU6IHtcclxuICAgIGdldEVsYXBzZWQ6ICgpID0+IGVsYXBzZWQsXHJcbiAgICBnZXRGcmFtZVRpbWU6ICgpID0+IGZyYW1lVGltZVxyXG4gIH0sXHJcblxyXG4gIHZpZXc6IHtcclxuICAgIGdldFpvb206ICgpID0+IHpvb20sXHJcbiAgICBzZXRab29tOiAodmFsdWU6IG51bWJlcikgPT4ge1xyXG4gICAgICB6b29tID0gTWF0aC5tYXgobWluWm9vbSwgTWF0aC5taW4obWF4Wm9vbSwgdmFsdWUpKVxyXG4gICAgICByZXNpemVkKClcclxuICAgIH0sXHJcbiAgICBnZXRCdWZmZXI6ICgpID0+IGZyYW1lQnVmZmVyXHJcbiAgfSxcclxuXHJcbiAgZ2V0UnVubmluZzogKCkgPT4gcnVubmluZyxcclxuICBzZXRSdW5uaW5nOiAodmFsdWU6IGJvb2xlYW4pID0+IHtcclxuICAgIHJ1bm5pbmcgPSB2YWx1ZVxyXG4gIH1cclxufVxyXG5cclxuLy8gZXZlbnQgaGFuZGxlcnM6XHJcblxyXG5jb25zdCBwcmV2ZW50RGVmYXVsdHMgPSBuZXcgU2V0PHN0cmluZz4oWydUYWInXSlcclxuXHJcbmNvbnN0IGtleURvd24gPSAoZXZlbnQ6IEtleWJvYXJkRXZlbnQpID0+IHtcclxuICBrZXlzW2V2ZW50LmtleV0gPSB0cnVlXHJcbiAga2V5UHJlc3Nlcy5wdXNoKGV2ZW50LmtleSlcclxuXHJcbiAgaWYgKHByZXZlbnREZWZhdWx0cy5oYXMoZXZlbnQua2V5KSkge1xyXG4gICAgZXZlbnQucHJldmVudERlZmF1bHQoKVxyXG5cclxuICAgIHJldHVybiBmYWxzZVxyXG4gIH1cclxufVxyXG5cclxuY29uc3Qga2V5VXAgPSAoZXZlbnQ6IEtleWJvYXJkRXZlbnQpID0+IHtcclxuICBrZXlzW2V2ZW50LmtleV0gPSBmYWxzZVxyXG5cclxuICAvLyBhbnkgb3RoZXJzIGluIGZ1dHVyZVxyXG5cclxuICAvLyBcclxuXHJcbiAgaWYgKHByZXZlbnREZWZhdWx0cy5oYXMoZXZlbnQua2V5KSkge1xyXG4gICAgZXZlbnQucHJldmVudERlZmF1bHQoKVxyXG5cclxuICAgIHJldHVybiBmYWxzZVxyXG4gIH1cclxufVxyXG5cclxuY29uc3QgbW91c2VNb3ZlID0gKGV2ZW50OiBNb3VzZUV2ZW50KSA9PiB7XHJcbiAgdmlld01vdXNlWCA9IGV2ZW50LmNsaWVudFhcclxuICB2aWV3TW91c2VZID0gZXZlbnQuY2xpZW50WVxyXG5cclxuICBmcmFtZU1vdXNlWCA9IE1hdGguZmxvb3Iodmlld01vdXNlWCAvIHpvb20pXHJcbiAgZnJhbWVNb3VzZVkgPSBNYXRoLmZsb29yKHZpZXdNb3VzZVkgLyB6b29tKVxyXG59XHJcblxyXG5jb25zdCBtb3VzZVdoZWVsID0gKGV2ZW50OiBXaGVlbEV2ZW50KSA9PiB7XHJcbiAgbW91c2VXaGVlbERlbHRhID0gZXZlbnQuZGVsdGFZXHJcblxyXG4gIGlmICghdXNlU3lzdGVtTW91c2UpIHtcclxuICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KClcclxuXHJcbiAgICByZXR1cm4gZmFsc2VcclxuICB9XHJcbn1cclxuXHJcbmNvbnN0IG1vdXNlQnV0dG9uRG93biA9IChldmVudDogTW91c2VFdmVudCkgPT4ge1xyXG4gIG1vdXNlQnV0dG9uc1tldmVudC5idXR0b25dID0gdHJ1ZVxyXG5cclxuICBpZiAoIXVzZVN5c3RlbU1vdXNlKSB7XHJcbiAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpXHJcblxyXG4gICAgcmV0dXJuIGZhbHNlXHJcbiAgfVxyXG59XHJcblxyXG5jb25zdCBtb3VzZUJ1dHRvblVwID0gKGV2ZW50OiBNb3VzZUV2ZW50KSA9PiB7XHJcbiAgbW91c2VCdXR0b25zW2V2ZW50LmJ1dHRvbl0gPSBmYWxzZVxyXG5cclxuICBpZiAoIXVzZVN5c3RlbU1vdXNlKSB7XHJcbiAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpXHJcblxyXG4gICAgcmV0dXJuIGZhbHNlXHJcbiAgfVxyXG59XHJcblxyXG5jb25zdCBwcmV2ZW50Q29udGV4dERlZmF1bHQgPSAoZXZlbnQ6IEV2ZW50KSA9PiB7XHJcbiAgaWYgKCF1c2VTeXN0ZW1Nb3VzZSkge1xyXG4gICAgZXZlbnQucHJldmVudERlZmF1bHQoKVxyXG5cclxuICAgIHJldHVybiBmYWxzZVxyXG4gIH1cclxufVxyXG5cclxuY29uc3QgbW91c2VMZWF2ZSA9ICgpID0+IHtcclxuICBjdXJzb3JJbkJvdW5kcyA9IGZhbHNlXHJcbn1cclxuXHJcbmNvbnN0IG1vdXNlRW50ZXIgPSAoKSA9PiB7XHJcbiAgY3Vyc29ySW5Cb3VuZHMgPSB0cnVlXHJcbn1cclxuXHJcbmNvbnN0IHJlc2l6ZWQgPSAoKSA9PiB7XHJcbiAgZnJhbWVXID0gTWF0aC5mbG9vcihpbm5lcldpZHRoIC8gem9vbSlcclxuICBmcmFtZUggPSBNYXRoLmZsb29yKGlubmVySGVpZ2h0IC8gem9vbSlcclxuXHJcbiAgZnJhbWVCdWZmZXIgPSBjcmVhdGVJbWFnZShmcmFtZVcsIGZyYW1lSClcclxuXHJcbiAgZnJhbWVDYW52YXMud2lkdGggPSBmcmFtZVdcclxuICBmcmFtZUNhbnZhcy5oZWlnaHQgPSBmcmFtZUhcclxufVxyXG5cclxuLy8gbW91c2UgY29udHJvbDpcclxuXHJcbmV4cG9ydCBjb25zdCByZWxlYXNlTW91c2UgPSAoKSA9PiB7XHJcbiAgdXNlU3lzdGVtTW91c2UgPSB0cnVlXHJcbiAgZnJhbWVDYW52YXMuY2xhc3NMaXN0LnRvZ2dsZSgnaGlkZS1jdXJzb3InLCBmYWxzZSlcclxufVxyXG5cclxuZXhwb3J0IGNvbnN0IHRha2VNb3VzZSA9ICgpID0+IHtcclxuICB1c2VTeXN0ZW1Nb3VzZSA9IGZhbHNlXHJcbiAgZnJhbWVDYW52YXMuY2xhc3NMaXN0LnRvZ2dsZSgnaGlkZS1jdXJzb3InLCB0cnVlKVxyXG59XHJcblxyXG4vLyBydW5uZXI6XHJcblxyXG4vLyBpbml0aWFsaXNlIHRoZSBlbmdpbmUgd2l0aCBhIHNjZW5lXHJcbmV4cG9ydCBjb25zdCBzdGFydCA9IGFzeW5jIChzY2VuZTogU2NlbmUpID0+IHtcclxuICAvLyBpZiBpdCBhbHJlYWR5IGhhcyBhIHNjZW5lLCBoYWx0IGl0IGZpcnN0XHJcbiAgaWYgKGN1cnJlbnRTY2VuZSkgaGFsdCgpXHJcblxyXG4gIGN1cnJlbnRTY2VuZSA9IHNjZW5lXHJcblxyXG4gIGlmIChmcmFtZUNhbnZhcykgZnJhbWVDYW52YXMucmVtb3ZlKClcclxuXHJcbiAgZnJhbWVDYW52YXMgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdjYW52YXMnKVxyXG4gIGZyYW1lQ2FudmFzLmlkID0gJ3ZpZXdwb3J0J1xyXG4gIGZyYW1lQ2FudmFzLnRhYkluZGV4ID0gMFxyXG5cclxuICBkb2N1bWVudC5ib2R5LmFwcGVuZChmcmFtZUNhbnZhcylcclxuXHJcbiAgZnJhbWVDYW52YXMuZm9jdXMoKVxyXG5cclxuICBmcmFtZUN0eCA9IGZyYW1lQ2FudmFzLmdldENvbnRleHQoJzJkJykhXHJcblxyXG4gIHJlc2l6ZWQoKVxyXG5cclxuICBhZGRFdmVudExpc3RlbmVyKCdyZXNpemUnLCByZXNpemVkKVxyXG5cclxuICBmcmFtZUNhbnZhcy5hZGRFdmVudExpc3RlbmVyKCdrZXlkb3duJywga2V5RG93bilcclxuICBmcmFtZUNhbnZhcy5hZGRFdmVudExpc3RlbmVyKCdrZXl1cCcsIGtleVVwKVxyXG5cclxuICBmcmFtZUNhbnZhcy5hZGRFdmVudExpc3RlbmVyKCdtb3VzZW1vdmUnLCBtb3VzZU1vdmUpXHJcbiAgZnJhbWVDYW52YXMuYWRkRXZlbnRMaXN0ZW5lcignd2hlZWwnLCBtb3VzZVdoZWVsKVxyXG4gIGZyYW1lQ2FudmFzLmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNlZG93bicsIG1vdXNlQnV0dG9uRG93bilcclxuICBmcmFtZUNhbnZhcy5hZGRFdmVudExpc3RlbmVyKCdtb3VzZXVwJywgbW91c2VCdXR0b25VcClcclxuICBmcmFtZUNhbnZhcy5hZGRFdmVudExpc3RlbmVyKCdjb250ZXh0bWVudScsIHByZXZlbnRDb250ZXh0RGVmYXVsdClcclxuICBmcmFtZUNhbnZhcy5hZGRFdmVudExpc3RlbmVyKCdtb3VzZWxlYXZlJywgbW91c2VMZWF2ZSlcclxuICBmcmFtZUNhbnZhcy5hZGRFdmVudExpc3RlbmVyKCdtb3VzZWVudGVyJywgbW91c2VFbnRlcilcclxuXHJcbiAgcnVubmluZyA9IHRydWVcclxuXHJcbiAgcmFmSWQgPSByZXF1ZXN0QW5pbWF0aW9uRnJhbWUodGljaylcclxuXHJcbiAgYXdhaXQgc2NlbmUuaW5pdChzdGF0ZSlcclxuXHJcbiAgaXNSZWFkeSA9IHRydWVcclxufVxyXG5cclxuLy8gdGlkeSBldmVyeXRoaW5nIHVwXHJcbmNvbnN0IGhhbHQgPSAoKSA9PiB7XHJcbiAgcnVubmluZyA9IGZhbHNlXHJcbiAgaXNSZWFkeSA9IGZhbHNlXHJcblxyXG4gIGNhbmNlbEFuaW1hdGlvbkZyYW1lKHJhZklkKVxyXG5cclxuICByZW1vdmVFdmVudExpc3RlbmVyKCdyZXNpemUnLCByZXNpemVkKVxyXG5cclxuICBmcmFtZUNhbnZhcy5yZW1vdmVFdmVudExpc3RlbmVyKCdrZXlkb3duJywga2V5RG93bilcclxuICBmcmFtZUNhbnZhcy5yZW1vdmVFdmVudExpc3RlbmVyKCdrZXl1cCcsIGtleVVwKVxyXG5cclxuICBmcmFtZUNhbnZhcy5yZW1vdmVFdmVudExpc3RlbmVyKCdtb3VzZW1vdmUnLCBtb3VzZU1vdmUpXHJcbiAgZnJhbWVDYW52YXMucmVtb3ZlRXZlbnRMaXN0ZW5lcignd2hlZWwnLCBtb3VzZVdoZWVsKVxyXG4gIGZyYW1lQ2FudmFzLnJlbW92ZUV2ZW50TGlzdGVuZXIoJ21vdXNlZG93bicsIG1vdXNlQnV0dG9uRG93bilcclxuICBmcmFtZUNhbnZhcy5yZW1vdmVFdmVudExpc3RlbmVyKCdtb3VzZXVwJywgbW91c2VCdXR0b25VcClcclxuICBmcmFtZUNhbnZhcy5yZW1vdmVFdmVudExpc3RlbmVyKCdjb250ZXh0bWVudScsIHByZXZlbnRDb250ZXh0RGVmYXVsdClcclxuICBmcmFtZUNhbnZhcy5yZW1vdmVFdmVudExpc3RlbmVyKCdtb3VzZWxlYXZlJywgbW91c2VMZWF2ZSlcclxuICBmcmFtZUNhbnZhcy5yZW1vdmVFdmVudExpc3RlbmVyKCdtb3VzZWVudGVyJywgbW91c2VFbnRlcilcclxuXHJcbiAgZnJhbWVDYW52YXMucmVtb3ZlKClcclxuXHJcbiAgc3RhcnRUaW1lID0gbnVsbFxyXG5cclxuICByZWxlYXNlTW91c2UoKVxyXG5cclxuICBpZiAoY3VycmVudFNjZW5lKSB7XHJcbiAgICBjdXJyZW50U2NlbmUucXVpdChzdGF0ZSkuY2F0Y2goY29uc29sZS5lcnJvcilcclxuXHJcbiAgICBjdXJyZW50U2NlbmUgPSBudWxsXHJcbiAgfVxyXG59XHJcblxyXG5jb25zdCBpbml0VGljayA9ICh0aW1lOiBudW1iZXIpID0+IHtcclxuICBpZiAoc3RhcnRUaW1lICE9PSBudWxsKSByZXR1cm4gc3RhcnRUaW1lXHJcblxyXG4gIC8vIGZpcnN0IHRpY2tcclxuXHJcbiAgc3RhcnRUaW1lID0gdGltZVxyXG5cclxuICBlbGFwc2VkID0gMFxyXG4gIGZyYW1lVGltZSA9IDBcclxuICBsYXN0VGltZSA9IHRpbWVcclxuXHJcbiAgcmV0dXJuIHN0YXJ0VGltZVxyXG59XHJcblxyXG5jb25zdCB0aWNrID0gKHRpbWU6IG51bWJlcikgPT4ge1xyXG4gIGlmICghcnVubmluZykgcmV0dXJuXHJcblxyXG4gIHN0YXJ0VGltZSA9IGluaXRUaWNrKHRpbWUpXHJcbiAgZWxhcHNlZCA9IHRpbWUgLSBzdGFydFRpbWVcclxuICBmcmFtZVRpbWUgPSB0aW1lIC0gbGFzdFRpbWVcclxuICBsYXN0VGltZSA9IHRpbWVcclxuXHJcbiAgaWYgKGN1cnJlbnRTY2VuZSAmJiBpc1JlYWR5KSBjdXJyZW50U2NlbmUudXBkYXRlKHN0YXRlKVxyXG5cclxuICAvLyBzY2VuZSBtYXkgaGF2ZSBzZW50IGEgcXVpdCBzaWduYWxcclxuICBpZiAoIXJ1bm5pbmcpIHtcclxuICAgIGhhbHQoKVxyXG5cclxuICAgIHJldHVyblxyXG4gIH1cclxuXHJcbiAgLy8gcmVuZGVyXHJcblxyXG4gIGZyYW1lQ3R4LnB1dEltYWdlRGF0YShmcmFtZUJ1ZmZlciwgMCwgMClcclxuXHJcbiAgLy9cclxuXHJcbiAgcmFmSWQgPSByZXF1ZXN0QW5pbWF0aW9uRnJhbWUodGljaylcclxufVxyXG4iXX0=