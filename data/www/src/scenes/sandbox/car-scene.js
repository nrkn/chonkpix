import { createColor } from '../../lib/image/color.js';
import { loadImage } from '../../lib/image/load.js';
import { resize } from '../../lib/image/resize.js';
import { drawRotatedAndScaled } from '../../lib/image/rotate.js';
import { pset } from '../../lib/image/util.js';
import { debugTextSceneHelper } from '../../lib/scene/debug-text.js';
import { textTable } from '../../lib/text/table-layout.js';
import { maybe } from '../../lib/util.js';
import { createBicycle, updateBicycle } from './car/bicycle.js';
// 2.5m wide - a little wide but needed to fit headlights lol
const carW = 5;
// 4.5m long - about right
const carH = 9;
const carCx = Math.floor(carW / 2);
const carCy = Math.floor(carH / 2);
const carColor = 0xffff9933;
const headlightColor = 0xff00ffff;
const carConfig = {
    wheelBase: 7,
    accel_0_100: 8,
    maxSpeedKmph: 180,
    revSpeedFactor: 0.5,
    brakeFactor: 2,
    frictionFactor: 1,
    turnRate: 0.0005,
    steerReturnSpeed: 0.001,
    maxSteerAngle: 0.5
};
const worldConfig = {
    pixelsPerMeter: 2,
    globalFriction: 5
};
const minZoom = 0.5;
const maxZoom = 2;
const zoomDelta = maxZoom - minZoom;
// derived from car and world config
const deg90 = Math.PI / 2;
const deg270 = 3 * deg90;
const kmphScale = 900 * worldConfig.pixelsPerMeter;
// no rational basis -  just feels *about* right
// worth playing with!
const frictionMps2 = worldConfig.globalFriction * carConfig.frictionFactor; // m/s^2
const friction = frictionMps2 * (worldConfig.pixelsPerMeter / 1e6);
const timeTo100ms = carConfig.accel_0_100 * 1000; // eg 8000ms
// 100kmph in pixels per ms
const speed100 = 100 / kmphScale;
const netAccel = speed100 / timeTo100ms;
const accel = netAccel + friction; // ensure we take friction into account
// again - no rational basis - just feels *about* right
// car specific
const brake = accel * carConfig.brakeFactor;
const maxSpeed = carConfig.maxSpeedKmph / kmphScale;
const minRevSpeed = -(maxSpeed * carConfig.revSpeedFactor);
export const carScene = () => {
    let isActive = false;
    let lastW = 0;
    let lastH = 0;
    let debugHelper;
    let debugText = [];
    let track;
    let carSprite;
    // why bicycle? because it's a simple way to model car physics
    let car;
    //
    const init = async (state) => {
        debugHelper = debugTextSceneHelper(() => debugText);
        await debugHelper.init(state);
        //
        //track = await loadImage('scenes/car/track.png')
        //track = await loadImage('scenes/car/track-huge.png')
        track = await loadImage('scenes/car/track-huge-c2.png');
        // carSprite = createImage(carW, carH)
        // fill(carSprite, carColor)
        // pset(carSprite, 1, 0, headlightColor)
        // pset(carSprite, 3, 0, headlightColor)
        carSprite = await loadImage('scenes/car/car.png');
        //const trackCx = Math.floor(track.width / 2)
        //const trackCy = Math.floor(track.height / 2)
        const trackCx = 5411;
        const trackCy = 14696;
        car = createBicycle([trackCx, trackCy], deg270, 0, 0, carConfig.wheelBase);
        isActive = true;
    };
    let turn = 0;
    let velocity = 0;
    const io = (state) => {
        const keys = state.getKeys();
        turn = 0;
        velocity = 0;
        if (keys['w'] || keys['W']) {
            velocity = 1;
        }
        if (keys['s'] || keys['S']) {
            velocity = -1;
        }
        if (keys['a'] || keys['A']) {
            turn = -1;
        }
        if (keys['d'] || keys['D']) {
            turn = 1;
        }
        // if (zoomOnWheel(state)) {
        //   lastW = 0
        //   lastH = 0
        // }
    };
    let lastZoom = maxZoom;
    const update = (state) => {
        if (!maybe(track))
            throw Error('Expected track');
        if (!maybe(carSprite))
            throw Error('Expected carSprite');
        if (!maybe(car))
            throw Error('Expected car');
        if (isActive)
            io(state);
        const delta = state.time.getFrameTime();
        // adjust car speed and steering angle based on input
        // are we accelerating or braking?
        const a = velocity > 0 && car.speed > 0 ? accel : brake;
        car.speed += velocity * delta * a;
        if (car.speed > 0) {
            // apply friction
            car.speed -= friction * delta;
            // enforce speed limits and ensure friction doesn't make us go backwards
            if (car.speed < 0)
                car.speed = 0;
            if (car.speed > maxSpeed)
                car.speed = maxSpeed;
        }
        else if (car.speed < 0) {
            // apply friction
            car.speed += friction * delta;
            // enforce speed limits and ensure friction doesn't make us go forwards
            if (car.speed > 0)
                car.speed = 0;
            if (car.speed < minRevSpeed)
                car.speed = minRevSpeed;
        }
        if (turn) {
            // the slower we're going, the less we can turn
            // const speedFactor = Math.min(
            //   1, Math.max(0, Math.abs(car.speed) / maxSpeed)
            // )
            car.steerAngle += turn * delta * carConfig.turnRate; // * speedFactor
            // enforce steering limits
            car.steerAngle = Math.max(-carConfig.maxSteerAngle, Math.min(carConfig.maxSteerAngle, car.steerAngle));
        }
        else {
            // return steering to center
            if (car.steerAngle > 0) {
                car.steerAngle = Math.max(0, car.steerAngle - delta * carConfig.steerReturnSpeed);
            }
            else if (car.steerAngle < 0) {
                car.steerAngle = Math.min(0, car.steerAngle + delta * carConfig.steerReturnSpeed);
            }
        }
        const updated = updateBicycle(car, delta);
        // we could check here for collision, that's why it's separate from car
        // todo - collision detection
        // if no collision, update car
        car.location = updated.location;
        car.heading = updated.heading;
        //
        // const zoom = Math.round(
        //   minZoom + (1 - (Math.abs(car.speed) / maxSpeed)) * zoomDelta
        // )
        // if (zoom !== lastZoom) {
        //   state.view.setZoom(zoom)
        //   lastZoom = zoom
        // }
        const zoom = minZoom + (1 - (Math.abs(car.speed) / maxSpeed)) * zoomDelta;
        //
        const buffer = state.view.getBuffer();
        const { width, height } = buffer;
        const vx = Math.floor(width / 2);
        // we place the car down the screen facing up,
        // so we can see more of the road ahead
        const vy = Math.floor(height * 0.875);
        // draw the track, centered on the car, onto the view, rotated by -carHeading
        // and then deg90 to face "up"
        drawRotatedAndScaled(track, car.location[0], car.location[1], buffer, vx, vy, -car.heading - deg90, zoom);
        // draw the car, centered on the car, onto the view
        drawRotatedAndScaled(carSprite, carCx, carCy, buffer, vx, vy, car.steerAngle, zoom);
        // mini map
        const mmHeight = Math.floor(height / 2);
        // scale to track.height
        const mmScale = mmHeight / track.height;
        const mmWidth = Math.floor(track.width * mmScale);
        const mmX = 2;
        const mmY = height - mmHeight - 2;
        resize(track, buffer, [0, 0, track.width, track.height], [mmX, mmY, mmWidth, mmHeight]);
        const mmCarX = Math.floor(car.location[0] * mmScale) + mmX;
        const mmCarY = Math.floor(car.location[1] * mmScale) + mmY;
        const red = createColor(255, 0, 0);
        pset(buffer, mmCarX, mmCarY, red);
        if (!maybe(debugHelper))
            return;
        const kmph = car.speed * kmphScale;
        const fps = Math.round(1000 / delta);
        const fpsText = `${fps} fps (${delta.toFixed(1)}ms)`;
        const table = textTable([
            ['x:', `${car.location[0].toFixed(4)}`],
            ['y:', `${car.location[1].toFixed(4)}`],
            ['heading:', `${car.heading.toFixed(4)}`],
            ['speed:', `${car.speed.toFixed(4)}`],
            ['steer:', `${car.steerAngle.toFixed(4)}`],
            ['kmph:', `${kmph.toFixed(4)}`],
            ['turn:', `${turn}`],
            ['velocity:', `${velocity}`]
        ]);
        debugText = [
            fpsText,
            ...table
        ];
        debugHelper.update(state);
    };
    const quit = async (state) => {
        isActive = false;
        if (maybe(debugHelper))
            await debugHelper.quit(state);
        debugHelper = null;
    };
    const setActive = (active) => {
        isActive = active;
    };
    return { init, update, quit, setActive };
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2FyLXNjZW5lLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vc3JjL3NjZW5lcy9zYW5kYm94L2Nhci1zY2VuZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxPQUFPLEVBQUUsV0FBVyxFQUFFLE1BQU0sMEJBQTBCLENBQUE7QUFHdEQsT0FBTyxFQUFFLFNBQVMsRUFBRSxNQUFNLHlCQUF5QixDQUFBO0FBQ25ELE9BQU8sRUFBRSxNQUFNLEVBQUUsTUFBTSwyQkFBMkIsQ0FBQTtBQUNsRCxPQUFPLEVBQWUsb0JBQW9CLEVBQUUsTUFBTSwyQkFBMkIsQ0FBQTtBQUM3RSxPQUFPLEVBQUUsSUFBSSxFQUFFLE1BQU0seUJBQXlCLENBQUE7QUFDOUMsT0FBTyxFQUFFLG9CQUFvQixFQUFFLE1BQU0sK0JBQStCLENBQUE7QUFFcEUsT0FBTyxFQUFFLFNBQVMsRUFBRSxNQUFNLGdDQUFnQyxDQUFBO0FBRTFELE9BQU8sRUFBRSxLQUFLLEVBQUUsTUFBTSxtQkFBbUIsQ0FBQTtBQUN6QyxPQUFPLEVBQVcsYUFBYSxFQUFFLGFBQWEsRUFBRSxNQUFNLGtCQUFrQixDQUFBO0FBRXhFLDZEQUE2RDtBQUM3RCxNQUFNLElBQUksR0FBRyxDQUFDLENBQUE7QUFDZCwwQkFBMEI7QUFDMUIsTUFBTSxJQUFJLEdBQUcsQ0FBQyxDQUFBO0FBRWQsTUFBTSxLQUFLLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFJLEdBQUcsQ0FBQyxDQUFDLENBQUE7QUFDbEMsTUFBTSxLQUFLLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFJLEdBQUcsQ0FBQyxDQUFDLENBQUE7QUFFbEMsTUFBTSxRQUFRLEdBQUcsVUFBVSxDQUFBO0FBQzNCLE1BQU0sY0FBYyxHQUFHLFVBQVUsQ0FBQTtBQWNqQyxNQUFNLFNBQVMsR0FBYztJQUMzQixTQUFTLEVBQUUsQ0FBQztJQUNaLFdBQVcsRUFBRSxDQUFDO0lBQ2QsWUFBWSxFQUFFLEdBQUc7SUFD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UUFFaEIsSUFBSSxLQUFLLENBQUMsV0FBVyxDQUFDO1lBQUUsTUFBTSxXQUFXLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFBO1FBRXJELFdBQVcsR0FBRyxJQUFJLENBQUE7SUFDcEIsQ0FBQyxDQUFBO0lBRUQsTUFBTSxTQUFTLEdBQUcsQ0FBQyxNQUFlLEVBQUUsRUFBRTtRQUNwQyxRQUFRLEdBQUcsTUFBTSxDQUFBO0lBQ25CLENBQUMsQ0FBQTtJQUVELE9BQU8sRUFBRSxJQUFJLEVBQUUsTUFBTSxFQUFFLElBQUksRUFBRSxTQUFTLEVBQUUsQ0FBQTtBQUMxQyxDQUFDLENBQUEiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBjcmVhdGVDb2xvciB9IGZyb20gJy4uLy4uL2xpYi9pbWFnZS9jb2xvci5qcydcbmltcG9ydCB7IGNyZWF0ZUltYWdlIH0gZnJvbSAnLi4vLi4vbGliL2ltYWdlL2NyZWF0ZS5qcydcbmltcG9ydCB7IGZpbGwgfSBmcm9tICcuLi8uLi9saWIvaW1hZ2UvZmlsbC5qcydcbmltcG9ydCB7IGxvYWRJbWFnZSB9IGZyb20gJy4uLy4uL2xpYi9pbWFnZS9sb2FkLmpzJ1xuaW1wb3J0IHsgcmVzaXplIH0gZnJvbSAnLi4vLi4vbGliL2ltYWdlL3Jlc2l6ZS5qcydcbmltcG9ydCB7IGRyYXdSb3RhdGVkLCBkcmF3Um90YXRlZEFuZFNjYWxlZCB9IGZyb20gJy4uLy4uL2xpYi9pbWFnZS9yb3RhdGUuanMnXG5pbXBvcnQgeyBwc2V0IH0gZnJvbSAnLi4vLi4vbGliL2ltYWdlL3V0aWwuanMnXG5pbXBvcnQgeyBkZWJ1Z1RleHRTY2VuZUhlbHBlciB9IGZyb20gJy4uLy4uL2xpYi9zY2VuZS9kZWJ1Zy10ZXh0LmpzJ1xuaW1wb3J0IHsgem9vbU9uV2hlZWwgfSBmcm9tICcuLi8uLi9saWIvc2NlbmUvaW8uanMnXG5pbXBvcnQgeyB0ZXh0VGFibGUgfSBmcm9tICcuLi8uLi9saWIvdGV4dC90YWJsZS1sYXlvdXQuanMnXG5pbXBvcnQgeyBNYXliZSwgU2NlbmUsIFN0YXRlIH0gZnJvbSAnLi4vLi4vbGliL3R5cGVzLmpzJ1xuaW1wb3J0IHsgbWF5YmUgfSBmcm9tICcuLi8uLi9saWIvdXRpbC5qcydcbmltcG9ydCB7IEJpY3ljbGUsIGNyZWF0ZUJpY3ljbGUsIHVwZGF0ZUJpY3ljbGUgfSBmcm9tICcuL2Nhci9iaWN5Y2xlLmpzJ1xuXG4vLyAyLjVtIHdpZGUgLSBhIGxpdHRsZSB3aWRlIGJ1dCBuZWVkZWQgdG8gZml0IGhlYWRsaWdodHMgbG9sXG5jb25zdCBjYXJXID0gNVxuLy8gNC41bSBsb25nIC0gYWJvdXQgcmlnaHRcbmNvbnN0IGNhckggPSA5XG5cbmNvbnN0IGNhckN4ID0gTWF0aC5mbG9vcihjYXJXIC8gMilcbmNvbnN0IGNhckN5ID0gTWF0aC5mbG9vcihjYXJIIC8gMilcblxuY29uc3QgY2FyQ29sb3IgPSAweGZmZmY5OTMzXG5jb25zdCBoZWFkbGlnaHRDb2xvciA9IDB4ZmYwMGZmZmZcblxudHlwZSBDYXJDb25maWcgPSB7XG4gIHdoZWVsQmFzZTogbnVtYmVyIC8vIHBpeGVscyAtIGRpc3RhbmNlIGJldHdlZW4gZnJvbnQgYW5kIGJhY2sgd2hlZWxzXG4gIGFjY2VsXzBfMTAwOiBudW1iZXIgLy8gc2Vjb25kc1xuICBtYXhTcGVlZEttcGg6IG51bWJlclxuICByZXZTcGVlZEZhY3RvcjogbnVtYmVyXG4gIGJyYWtlRmFjdG9yOiBudW1iZXJcbiAgZnJpY3Rpb25GYWN0b3I6IG51bWJlclxuICB0dXJuUmF0ZTogbnVtYmVyIC8vIHJhZHMgcGVyIG1zXG4gIHN0ZWVyUmV0dXJuU3BlZWQ6IG51bWJlciAvLyByYWRzIHBlciBtc1xuICBtYXhTdGVlckFuZ2xlOiBudW1iZXJcbn1cblxuY29uc3QgY2FyQ29uZmlnOiBDYXJDb25maWcgPSB7XG4gIHdoZWVsQmFzZTogNyxcbiAgYWNjZWxfMF8xMDA6IDgsXG4gIG1heFNwZWVkS21waDogMTgwLFxuICByZXZTcGVlZEZhY3RvcjogMC41LFxuICBicmFrZUZhY3RvcjogMixcbiAgZnJpY3Rpb25GYWN0b3I6IDEsXG4gIHR1cm5SYXRlOiAwLjAwMDUsXG4gIHN0ZWVyUmV0dXJuU3BlZWQ6IDAuMDAxLFxuICBtYXhTdGVlckFuZ2xlOiAwLjVcbn1cblxudHlwZSBXb3JsZENvbmZpZyA9IHtcbiAgcGl4ZWxzUGVyTWV0ZXI6IG51bWJlclxuICBnbG9iYWxGcmljdGlvbjogbnVtYmVyXG59XG5cbmNvbnN0IHdvcmxkQ29uZmlnOiBXb3JsZENvbmZpZyA9IHtcbiAgcGl4ZWxzUGVyTWV0ZXI6IDIsXG4gIGdsb2JhbEZyaWN0aW9uOiA1XG59XG5cbmNvbnN0IG1pblpvb20gPSAwLjVcbmNvbnN0IG1heFpvb20gPSAyXG5cbmNvbnN0IHpvb21EZWx0YSA9IG1heFpvb20gLSBtaW5ab29tXG5cbi8vIGRlcml2ZWQgZnJvbSBjYXIgYW5kIHdvcmxkIGNvbmZpZ1xuY29uc3QgZGVnOTAgPSBNYXRoLlBJIC8gMlxuY29uc3QgZGVnMjcwID0gMyAqIGRlZzkwXG5cbmNvbnN0IGttcGhTY2FsZSA9IDkwMCAqIHdvcmxkQ29uZmlnLnBpeGVsc1Blck1ldGVyXG5cbi8vIG5vIHJhdGlvbmFsIGJhc2lzIC0gIGp1c3QgZmVlbHMgKmFib3V0KiByaWdodFxuLy8gd29ydGggcGxheWluZyB3aXRoIVxuY29uc3QgZnJpY3Rpb25NcHMyID0gd29ybGRDb25maWcuZ2xvYmFsRnJpY3Rpb24gKiBjYXJDb25maWcuZnJpY3Rpb25GYWN0b3IgLy8gbS9zXjJcbmNvbnN0IGZyaWN0aW9uID0gZnJpY3Rpb25NcHMyICogKHdvcmxkQ29uZmlnLnBpeGVsc1Blck1ldGVyIC8gMWU2KVxuXG5jb25zdCB0aW1lVG8xMDBtcyA9IGNhckNvbmZpZy5hY2NlbF8wXzEwMCAqIDEwMDAgLy8gZWcgODAwMG1zXG4vLyAxMDBrbXBoIGluIHBpeGVscyBwZXIgbXNcbmNvbnN0IHNwZWVkMTAwID0gMTAwIC8ga21waFNjYWxlXG5cbmNvbnN0IG5ldEFjY2VsID0gc3BlZWQxMDAgLyB0aW1lVG8xMDBtc1xuY29uc3QgYWNjZWwgPSBuZXRBY2NlbCArIGZyaWN0aW9uIC8vIGVuc3VyZSB3ZSB0YWtlIGZyaWN0aW9uIGludG8gYWNjb3VudFxuLy8gYWdhaW4gLSBubyByYXRpb25hbCBiYXNpcyAtIGp1c3QgZmVlbHMgKmFib3V0KiByaWdodFxuXG4vLyBjYXIgc3BlY2lmaWNcbmNvbnN0IGJyYWtlID0gYWNjZWwgKiBjYXJDb25maWcuYnJha2VGYWN0b3JcblxuY29uc3QgbWF4U3BlZWQgPSBjYXJDb25maWcubWF4U3BlZWRLbXBoIC8ga21waFNjYWxlXG5jb25zdCBtaW5SZXZTcGVlZCA9IC0obWF4U3BlZWQgKiBjYXJDb25maWcucmV2U3BlZWRGYWN0b3IpXG5cbmV4cG9ydCBjb25zdCBjYXJTY2VuZSA9ICgpOiBTY2VuZSA9PiB7XG4gIGxldCBpc0FjdGl2ZSA9IGZhbHNlXG4gIGxldCBsYXN0VyA9IDBcbiAgbGV0IGxhc3RIID0gMFxuXG4gIGxldCBkZWJ1Z0hlbHBlcjogTWF5YmU8U2NlbmU+XG4gIGxldCBkZWJ1Z1RleHQ6IHN0cmluZ1tdID0gW11cblxuICBsZXQgdHJhY2s6IE1heWJlPEltYWdlRGF0YT5cbiAgbGV0IGNhclNwcml0ZTogTWF5YmU8SW1hZ2VEYXRhPlxuXG4gIC8vIHdoeSBiaWN5Y2xlPyBiZWNhdXNlIGl0J3MgYSBzaW1wbGUgd2F5IHRvIG1vZGVsIGNhciBwaHlzaWNzXG4gIGxldCBjYXI6IE1heWJlPEJpY3ljbGU+XG5cbiAgLy9cblxuICBjb25zdCBpbml0ID0gYXN5bmMgKHN0YXRlOiBTdGF0ZSkgPT4ge1xuICAgIGRlYnVnSGVscGVyID0gZGVidWdUZXh0U2NlbmVIZWxwZXIoKCkgPT4gZGVidWdUZXh0KVxuXG4gICAgYXdhaXQgZGVidWdIZWxwZXIuaW5pdChzdGF0ZSlcblxuICAgIC8vXG5cbiAgICAvL3RyYWNrID0gYXdhaXQgbG9hZEltYWdlKCdzY2VuZXMvY2FyL3RyYWNrLnBuZycpXG4gICAgLy90cmFjayA9IGF3YWl0IGxvYWRJbWFnZSgnc2NlbmVzL2Nhci90cmFjay1odWdlLnBuZycpXG4gICAgdHJhY2sgPSBhd2FpdCBsb2FkSW1hZ2UoJ3NjZW5lcy9jYXIvdHJhY2staHVnZS1jMi5wbmcnKVxuXG4gICAgLy8gY2FyU3ByaXRlID0gY3JlYXRlSW1hZ2UoY2FyVywgY2FySClcblxuICAgIC8vIGZpbGwoY2FyU3ByaXRlLCBjYXJDb2xvcilcbiAgICAvLyBwc2V0KGNhclNwcml0ZSwgMSwgMCwgaGVhZGxpZ2h0Q29sb3IpXG4gICAgLy8gcHNldChjYXJTcHJpdGUsIDMsIDAsIGhlYWRsaWdodENvbG9yKVxuICAgIGNhclNwcml0ZSA9IGF3YWl0IGxvYWRJbWFnZSgnc2NlbmVzL2Nhci9jYXIucG5nJylcblxuICAgIC8vY29uc3QgdHJhY2tDeCA9IE1hdGguZmxvb3IodHJhY2sud2lkdGggLyAyKVxuICAgIC8vY29uc3QgdHJhY2tDeSA9IE1hdGguZmxvb3IodHJhY2suaGVpZ2h0IC8gMilcbiAgICBjb25zdCB0cmFja0N4ID0gNTQxMVxuICAgIGNvbnN0IHRyYWNrQ3kgPSAxNDY5NlxuXG4gICAgY2FyID0gY3JlYXRlQmljeWNsZShbdHJhY2tDeCwgdHJhY2tDeV0sIGRlZzI3MCwgMCwgMCwgY2FyQ29uZmlnLndoZWVsQmFzZSlcblxuICAgIGlzQWN0aXZlID0gdHJ1ZVxuICB9XG5cbiAgbGV0IHR1cm4gPSAwXG4gIGxldCB2ZWxvY2l0eSA9IDBcblxuICBjb25zdCBpbyA9IChzdGF0ZTogU3RhdGUpID0+IHtcbiAgICBjb25zdCBrZXlzID0gc3RhdGUuZ2V0S2V5cygpXG5cbiAgICB0dXJuID0gMFxuICAgIHZlbG9jaXR5ID0gMFxuXG4gICAgaWYgKGtleXNbJ3cnXSB8fCBrZXlzWydXJ10pIHtcbiAgICAgIHZlbG9jaXR5ID0gMVxuICAgIH1cblxuICAgIGlmIChrZXlzWydzJ10gfHwga2V5c1snUyddKSB7XG4gICAgICB2ZWxvY2l0eSA9IC0xXG4gICAgfVxuXG4gICAgaWYgKGtleXNbJ2EnXSB8fCBrZXlzWydBJ10pIHtcbiAgICAgIHR1cm4gPSAtMVxuICAgIH1cblxuICAgIGlmIChrZXlzWydkJ10gfHwga2V5c1snRCddKSB7XG4gICAgICB0dXJuID0gMVxuICAgIH1cblxuICAgIC8vIGlmICh6b29tT25XaGVlbChzdGF0ZSkpIHtcbiAgICAvLyAgIGxhc3RXID0gMFxuICAgIC8vICAgbGFzdEggPSAwXG4gICAgLy8gfVxuICB9XG5cbiAgbGV0IGxhc3Rab29tID0gbWF4Wm9vbVxuXG4gIGNvbnN0IHVwZGF0ZSA9IChzdGF0ZTogU3RhdGUpID0+IHtcbiAgICBpZiAoIW1heWJlKHRyYWNrKSkgdGhyb3cgRXJyb3IoJ0V4cGVjdGVkIHRyYWNrJylcbiAgICBpZiAoIW1heWJlKGNhclNwcml0ZSkpIHRocm93IEVycm9yKCdFeHBlY3RlZCBjYXJTcHJpdGUnKVxuICAgIGlmICghbWF5YmUoY2FyKSkgdGhyb3cgRXJyb3IoJ0V4cGVjdGVkIGNhcicpXG5cbiAgICBpZiAoaXNBY3RpdmUpIGlvKHN0YXRlKVxuXG4gICAgY29uc3QgZGVsdGEgPSBzdGF0ZS50aW1lLmdldEZyYW1lVGltZSgpXG5cbiAgICAvLyBhZGp1c3QgY2FyIHNwZWVkIGFuZCBzdGVlcmluZyBhbmdsZSBiYXNlZCBvbiBpbnB1dFxuXG4gICAgLy8gYXJlIHdlIGFjY2VsZXJhdGluZyBvciBicmFraW5nP1xuICAgIGNvbnN0IGEgPSB2ZWxvY2l0eSA+IDAgJiYgY2FyLnNwZWVkID4gMCA/IGFjY2VsIDogYnJha2VcblxuICAgIGNhci5zcGVlZCArPSB2ZWxvY2l0eSAqIGRlbHRhICogYVxuXG4gICAgaWYgKGNhci5zcGVlZCA+IDApIHtcbiAgICAgIC8vIGFwcGx5IGZyaWN0aW9uXG4gICAgICBjYXIuc3BlZWQgLT0gZnJpY3Rpb24gKiBkZWx0YVxuXG4gICAgICAvLyBlbmZvcmNlIHNwZWVkIGxpbWl0cyBhbmQgZW5zdXJlIGZyaWN0aW9uIGRvZXNuJ3QgbWFrZSB1cyBnbyBiYWNrd2FyZHNcbiAgICAgIGlmIChjYXIuc3BlZWQgPCAwKSBjYXIuc3BlZWQgPSAwXG4gICAgICBpZiAoY2FyLnNwZWVkID4gbWF4U3BlZWQpIGNhci5zcGVlZCA9IG1heFNwZWVkXG4gICAgfSBlbHNlIGlmIChjYXIuc3BlZWQgPCAwKSB7XG4gICAgICAvLyBhcHBseSBmcmljdGlvblxuICAgICAgY2FyLnNwZWVkICs9IGZyaWN0aW9uICogZGVsdGFcblxuICAgICAgLy8gZW5mb3JjZSBzcGVlZCBsaW1pdHMgYW5kIGVuc3VyZSBmcmljdGlvbiBkb2Vzbid0IG1ha2UgdXMgZ28gZm9yd2FyZHNcbiAgICAgIGlmIChjYXIuc3BlZWQgPiAwKSBjYXIuc3BlZWQgPSAwXG4gICAgICBpZiAoY2FyLnNwZWVkIDwgbWluUmV2U3BlZWQpIGNhci5zcGVlZCA9IG1pblJldlNwZWVkXG4gICAgfVxuXG4gICAgaWYgKHR1cm4pIHtcbiAgICAgIC8vIHRoZSBzbG93ZXIgd2UncmUgZ29pbmcsIHRoZSBsZXNzIHdlIGNhbiB0dXJuXG4gICAgICAvLyBjb25zdCBzcGVlZEZhY3RvciA9IE1hdGgubWluKFxuICAgICAgLy8gICAxLCBNYXRoLm1heCgwLCBNYXRoLmFicyhjYXIuc3BlZWQpIC8gbWF4U3BlZWQpXG4gICAgICAvLyApXG5cbiAgICAgIGNhci5zdGVlckFuZ2xlICs9IHR1cm4gKiBkZWx0YSAqIGNhckNvbmZpZy50dXJuUmF0ZS8vICogc3BlZWRGYWN0b3JcblxuICAgICAgLy8gZW5mb3JjZSBzdGVlcmluZyBsaW1pdHNcbiAgICAgIGNhci5zdGVlckFuZ2xlID0gTWF0aC5tYXgoXG4gICAgICAgIC1jYXJDb25maWcubWF4U3RlZXJBbmdsZSxcbiAgICAgICAgTWF0aC5taW4oY2FyQ29uZmlnLm1heFN0ZWVyQW5nbGUsIGNhci5zdGVlckFuZ2xlKVxuICAgICAgKVxuICAgIH0gZWxzZSB7XG4gICAgICAvLyByZXR1cm4gc3RlZXJpbmcgdG8gY2VudGVyXG4gICAgICBpZiAoY2FyLnN0ZWVyQW5nbGUgPiAwKSB7XG4gICAgICAgIGNhci5zdGVlckFuZ2xlID0gTWF0aC5tYXgoXG4gICAgICAgICAgMCwgY2FyLnN0ZWVyQW5nbGUgLSBkZWx0YSAqIGNhckNvbmZpZy5zdGVlclJldHVyblNwZWVkXG4gICAgICAgIClcbiAgICAgIH0gZWxzZSBpZiAoY2FyLnN0ZWVyQW5nbGUgPCAwKSB7XG4gICAgICAgIGNhci5zdGVlckFuZ2xlID0gTWF0aC5taW4oXG4gICAgICAgICAgMCwgY2FyLnN0ZWVyQW5nbGUgKyBkZWx0YSAqIGNhckNvbmZpZy5zdGVlclJldHVyblNwZWVkXG4gICAgICAgIClcbiAgICAgIH1cbiAgICB9XG5cbiAgICBjb25zdCB1cGRhdGVkID0gdXBkYXRlQmljeWNsZShjYXIsIGRlbHRhKVxuXG4gICAgLy8gd2UgY291bGQgY2hlY2sgaGVyZSBmb3IgY29sbGlzaW9uLCB0aGF0J3Mgd2h5IGl0J3Mgc2VwYXJhdGUgZnJvbSBjYXJcbiAgICAvLyB0b2RvIC0gY29sbGlzaW9uIGRldGVjdGlvblxuXG4gICAgLy8gaWYgbm8gY29sbGlzaW9uLCB1cGRhdGUgY2FyXG4gICAgY2FyLmxvY2F0aW9uID0gdXBkYXRlZC5sb2NhdGlvblxuICAgIGNhci5oZWFkaW5nID0gdXBkYXRlZC5oZWFkaW5nXG5cbiAgICAvL1xuXG4gICAgLy8gY29uc3Qgem9vbSA9IE1hdGgucm91bmQoXG4gICAgLy8gICBtaW5ab29tICsgKDEgLSAoTWF0aC5hYnMoY2FyLnNwZWVkKSAvIG1heFNwZWVkKSkgKiB6b29tRGVsdGFcbiAgICAvLyApXG5cbiAgICAvLyBpZiAoem9vbSAhPT0gbGFzdFpvb20pIHtcbiAgICAvLyAgIHN0YXRlLnZpZXcuc2V0Wm9vbSh6b29tKVxuXG4gICAgLy8gICBsYXN0Wm9vbSA9IHpvb21cbiAgICAvLyB9XG5cbiAgICBjb25zdCB6b29tID0gbWluWm9vbSArICgxIC0gKE1hdGguYWJzKGNhci5zcGVlZCkgLyBtYXhTcGVlZCkpICogem9vbURlbHRhXG5cblxuXG5cbiAgICAvL1xuXG4gICAgY29uc3QgYnVmZmVyID0gc3RhdGUudmlldy5nZXRCdWZmZXIoKVxuICAgIGNvbnN0IHsgd2lkdGgsIGhlaWdodCB9ID0gYnVmZmVyXG5cbiAgICBjb25zdCB2eCA9IE1hdGguZmxvb3Iod2lkdGggLyAyKVxuICAgIC8vIHdlIHBsYWNlIHRoZSBjYXIgZG93biB0aGUgc2NyZWVuIGZhY2luZyB1cCxcbiAgICAvLyBzbyB3ZSBjYW4gc2VlIG1vcmUgb2YgdGhlIHJvYWQgYWhlYWRcbiAgICBjb25zdCB2eSA9IE1hdGguZmxvb3IoaGVpZ2h0ICogMC44NzUpXG5cbiAgICAvLyBkcmF3IHRoZSB0cmFjaywgY2VudGVyZWQgb24gdGhlIGNhciwgb250byB0aGUgdmlldywgcm90YXRlZCBieSAtY2FySGVhZGluZ1xuICAgIC8vIGFuZCB0aGVuIGRlZzkwIHRvIGZhY2UgXCJ1cFwiXG4gICAgZHJhd1JvdGF0ZWRBbmRTY2FsZWQoXG4gICAgICB0cmFjayxcbiAgICAgIGNhci5sb2NhdGlvblswXSwgY2FyLmxvY2F0aW9uWzFdLFxuICAgICAgYnVmZmVyLCB2eCwgdnksXG4gICAgICAtY2FyLmhlYWRpbmcgLSBkZWc5MCwgem9vbVxuICAgIClcbiAgICAvLyBkcmF3IHRoZSBjYXIsIGNlbnRlcmVkIG9uIHRoZSBjYXIsIG9udG8gdGhlIHZpZXdcbiAgICBkcmF3Um90YXRlZEFuZFNjYWxlZChcbiAgICAgIGNhclNwcml0ZSwgY2FyQ3gsIGNhckN5LCBidWZmZXIsIHZ4LCB2eSwgY2FyLnN0ZWVyQW5nbGUsIHpvb21cbiAgICApXG5cbiAgICAvLyBtaW5pIG1hcFxuXG4gICAgY29uc3QgbW1IZWlnaHQgPSBNYXRoLmZsb29yKGhlaWdodCAvIDIpXG5cbiAgICAvLyBzY2FsZSB0byB0cmFjay5oZWlnaHRcbiAgICBjb25zdCBtbVNjYWxlID0gbW1IZWlnaHQgLyB0cmFjay5oZWlnaHRcblxuICAgIGNvbnN0IG1tV2lkdGggPSBNYXRoLmZsb29yKHRyYWNrLndpZHRoICogbW1TY2FsZSlcblxuICAgIGNvbnN0IG1tWCA9IDJcbiAgICBjb25zdCBtbVkgPSBoZWlnaHQgLSBtbUhlaWdodCAtIDJcblxuICAgIHJlc2l6ZShcbiAgICAgIHRyYWNrLCBidWZmZXIsXG4gICAgICBbMCwgMCwgdHJhY2sud2lkdGgsIHRyYWNrLmhlaWdodF0sXG4gICAgICBbbW1YLCBtbVksIG1tV2lkdGgsIG1tSGVpZ2h0XVxuICAgIClcblxuICAgIGNvbnN0IG1tQ2FyWCA9IE1hdGguZmxvb3IoY2FyLmxvY2F0aW9uWzBdICogbW1TY2FsZSkgKyBtbVhcbiAgICBjb25zdCBtbUNhclkgPSBNYXRoLmZsb29yKGNhci5sb2NhdGlvblsxXSAqIG1tU2NhbGUpICsgbW1ZXG5cbiAgICBjb25zdCByZWQgPSBjcmVhdGVDb2xvcigyNTUsIDAsIDApXG5cbiAgICBwc2V0KGJ1ZmZlciwgbW1DYXJYLCBtbUNhclksIHJlZClcblxuICAgIGlmICghbWF5YmUoZGVidWdIZWxwZXIpKSByZXR1cm5cblxuICAgIGNvbnN0IGttcGggPSBjYXIuc3BlZWQgKiBrbXBoU2NhbGVcblxuICAgIGNvbnN0IGZwcyA9IE1hdGgucm91bmQoMTAwMCAvIGRlbHRhKVxuICAgIGNvbnN0IGZwc1RleHQgPSBgJHtmcHN9IGZwcyAoJHtkZWx0YS50b0ZpeGVkKDEpfW1zKWBcblxuICAgIGNvbnN0IHRhYmxlID0gdGV4dFRhYmxlKFtcbiAgICAgIFsneDonLCBgJHtjYXIubG9jYXRpb25bMF0udG9GaXhlZCg0KX1gXSxcbiAgICAgIFsneTonLCBgJHtjYXIubG9jYXRpb25bMV0udG9GaXhlZCg0KX1gXSxcbiAgICAgIFsnaGVhZGluZzonLCBgJHtjYXIuaGVhZGluZy50b0ZpeGVkKDQpfWBdLFxuICAgICAgWydzcGVlZDonLCBgJHtjYXIuc3BlZWQudG9GaXhlZCg0KX1gXSxcbiAgICAgIFsnc3RlZXI6JywgYCR7Y2FyLnN0ZWVyQW5nbGUudG9GaXhlZCg0KX1gXSxcbiAgICAgIFsna21waDonLCBgJHtrbXBoLnRvRml4ZWQoNCl9YF0sXG4gICAgICBbJ3R1cm46JywgYCR7dHVybn1gXSxcbiAgICAgIFsndmVsb2NpdHk6JywgYCR7dmVsb2NpdHl9YF1cbiAgICBdKVxuXG4gICAgZGVidWdUZXh0ID0gW1xuICAgICAgZnBzVGV4dCxcbiAgICAgIC4uLnRhYmxlXG4gICAgXVxuXG4gICAgZGVidWdIZWxwZXIudXBkYXRlKHN0YXRlKVxuICB9XG5cbiAgY29uc3QgcXVpdCA9IGFzeW5jIChzdGF0ZTogU3RhdGUpID0+IHtcbiAgICBpc0FjdGl2ZSA9IGZhbHNlXG5cbiAgICBpZiAobWF5YmUoZGVidWdIZWxwZXIpKSBhd2FpdCBkZWJ1Z0hlbHBlci5xdWl0KHN0YXRlKVxuXG4gICAgZGVidWdIZWxwZXIgPSBudWxsXG4gIH1cblxuICBjb25zdCBzZXRBY3RpdmUgPSAoYWN0aXZlOiBib29sZWFuKSA9PiB7XG4gICAgaXNBY3RpdmUgPSBhY3RpdmVcbiAgfVxuXG4gIHJldHVybiB7IGluaXQsIHVwZGF0ZSwgcXVpdCwgc2V0QWN0aXZlIH1cbn1cbiJdfQ==