import { clampRect } from './util.js';
// nearest neighbor scaling
export const resize = (src, dest, srcRect = [0, 0, src.width, src.height], destRect = [0, 0, dest.width, dest.height]) => {
    const [sx, sy, sw, sh] = clampRect(src.width, src.height, srcRect);
    const [dx, dy, dw, dh] = clampRect(dest.width, dest.height, destRect);
    const scaleW = sw / dw;
    const scaleH = sh / dh;
    const srcData = new Uint32Array(src.data.buffer);
    const destData = new Uint32Array(dest.data.buffer);
    for (let y = 0; y < dh; y++) {
        const srcY = Math.floor(y * scaleH) + sy;
        for (let x = 0; x < dw; x++) {
            const srcX = Math.floor(x * scaleW) + sx;
            const srcIndex = srcY * src.width + srcX;
            const destIndex = (y + dy) * dest.width + (x + dx);
            destData[destIndex] = srcData[srcIndex];
        }
    }
    return dest;
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVzaXplLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vc3JjL2xpYi9pbWFnZS9yZXNpemUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQ0EsT0FBTyxFQUFFLFNBQVMsRUFBRSxNQUFNLFdBQVcsQ0FBQTtBQUVyQywyQkFBMkI7QUFDM0IsTUFBTSxDQUFDLE1BQU0sTUFBTSxHQUFHLENBQ3BCLEdBQWMsRUFBRSxJQUFlLEVBQy9CLFVBQWMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLEdBQUcsQ0FBQyxLQUFLLEVBQUUsR0FBRyxDQUFDLE1BQU0sQ0FBQyxFQUMzQyxXQUFlLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxJQUFJLENBQUMsS0FBSyxFQUFFLElBQUksQ0FBQyxNQUFNLENBQUMsRUFDOUMsRUFBRTtJQUNGLE1BQU0sQ0FBQyxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLENBQUMsR0FBRyxTQUFTLENBQUMsR0FBRyxDQUFDLEtBQUssRUFBRSxHQUFHLENBQUMsTUFBTSxFQUFFLE9BQU8sQ0FBQyxDQUFBO0lBQ2xFLE1BQU0sQ0FBQyxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLENBQUMsR0FBRyxTQUFTLENBQUMsSUFBSSxDQUFDLEtBQUssRUFBRSxJQUFJLENBQUMsTUFBTSxFQUFFLFFBQVEsQ0FBQyxDQUFBO0lBRXJFLE1BQU0sTUFBTSxHQUFHLEVBQUUsR0FBRyxFQUFFLENBQUE7SUFDdEIsTUFBTSxNQUFNLEdBQUcsRUFBRSxHQUFHLEVBQUUsQ0FBQTtJQUV0QixNQUFNLE9BQU8sR0FBRyxJQUFJLFdBQVcsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFBO0lBQ2hELE1BQU0sUUFBUSxHQUFHLElBQUksV0FBVyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUE7SUFFbEQsS0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLEVBQUUsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDO1FBQzVCLE1BQU0sSUFBSSxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxHQUFHLE1BQU0sQ0FBQyxHQUFHLEVBQUUsQ0FBQTtRQUV4QyxLQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsRUFBRSxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUM7WUFDNUIsTUFBTSxJQUFJLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDLEdBQUcsTUFBTSxDQUFDLEdBQUcsRUFBRSxDQUFBO1lBRXhDLE1BQU0sUUFBUSxHQUFHLElBQUksR0FBRyxHQUFHLENBQUMsS0FBSyxHQUFHLElBQUksQ0FBQTtZQUN4QyxNQUFNLFNBQVMsR0FBRyxDQUFDLENBQUMsR0FBRyxFQUFFLENBQUMsR0FBRyxJQUFJLENBQUMsS0FBSyxHQUFHLENBQUMsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxDQUFBO1lBRWxELFFBQVEsQ0FBQyxTQUFTLENBQUMsR0FBRyxPQUFPLENBQUMsUUFBUSxDQUFDLENBQUE7UUFDekMsQ0FBQztJQUNILENBQUM7SUFFRCxPQUFPLElBQUksQ0FBQTtBQUNiLENBQUMsQ0FBQSIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IFQ0IH0gZnJvbSAnLi4vdHlwZXMuanMnXHJcbmltcG9ydCB7IGNsYW1wUmVjdCB9IGZyb20gJy4vdXRpbC5qcydcclxuXHJcbi8vIG5lYXJlc3QgbmVpZ2hib3Igc2NhbGluZ1xyXG5leHBvcnQgY29uc3QgcmVzaXplID0gKFxyXG4gIHNyYzogSW1hZ2VEYXRhLCBkZXN0OiBJbWFnZURhdGEsXHJcbiAgc3JjUmVjdDogVDQgPSBbMCwgMCwgc3JjLndpZHRoLCBzcmMuaGVpZ2h0XSxcclxuICBkZXN0UmVjdDogVDQgPSBbMCwgMCwgZGVzdC53aWR0aCwgZGVzdC5oZWlnaHRdXHJcbikgPT4ge1xyXG4gIGNvbnN0IFtzeCwgc3ksIHN3LCBzaF0gPSBjbGFtcFJlY3Qoc3JjLndpZHRoLCBzcmMuaGVpZ2h0LCBzcmNSZWN0KVxyXG4gIGNvbnN0IFtkeCwgZHksIGR3LCBkaF0gPSBjbGFtcFJlY3QoZGVzdC53aWR0aCwgZGVzdC5oZWlnaHQsIGRlc3RSZWN0KVxyXG5cclxuICBjb25zdCBzY2FsZVcgPSBzdyAvIGR3XHJcbiAgY29uc3Qgc2NhbGVIID0gc2ggLyBkaFxyXG5cclxuICBjb25zdCBzcmNEYXRhID0gbmV3IFVpbnQzMkFycmF5KHNyYy5kYXRhLmJ1ZmZlcilcclxuICBjb25zdCBkZXN0RGF0YSA9IG5ldyBVaW50MzJBcnJheShkZXN0LmRhdGEuYnVmZmVyKVxyXG5cclxuICBmb3IgKGxldCB5ID0gMDsgeSA8IGRoOyB5KyspIHtcclxuICAgIGNvbnN0IHNyY1kgPSBNYXRoLmZsb29yKHkgKiBzY2FsZUgpICsgc3lcclxuXHJcbiAgICBmb3IgKGxldCB4ID0gMDsgeCA8IGR3OyB4KyspIHtcclxuICAgICAgY29uc3Qgc3JjWCA9IE1hdGguZmxvb3IoeCAqIHNjYWxlVykgKyBzeFxyXG5cclxuICAgICAgY29uc3Qgc3JjSW5kZXggPSBzcmNZICogc3JjLndpZHRoICsgc3JjWFxyXG4gICAgICBjb25zdCBkZXN0SW5kZXggPSAoeSArIGR5KSAqIGRlc3Qud2lkdGggKyAoeCArIGR4KVxyXG5cclxuICAgICAgZGVzdERhdGFbZGVzdEluZGV4XSA9IHNyY0RhdGFbc3JjSW5kZXhdXHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICByZXR1cm4gZGVzdFxyXG59XHJcbiJdfQ==