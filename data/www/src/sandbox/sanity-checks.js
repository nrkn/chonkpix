"use strict";
const createColor = (r, g, b, a = 255) => (a << 24) | (b << 16) | (g << 8) | r;
const colorToRgba = (color) => [
    color & 0xFF, (color >> 8) & 0xFF, (color >> 16) & 0xFF, color >>> 24
];
const r0 = 0x33;
const g0 = 0x99;
const b0 = 0xff;
const a0 = 0x80;
const color0 = createColor(r0, g0, b0, a0);
const rgba0 = colorToRgba(color0);
console.log(color0.toString(16), rgba0, [r0, g0, b0, a0]);
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2FuaXR5LWNoZWNrcy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy9zYW5kYm94L3Nhbml0eS1jaGVja3MudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBLE1BQU0sV0FBVyxHQUFHLENBQUMsQ0FBUyxFQUFFLENBQVMsRUFBRSxDQUFTLEVBQUUsQ0FBQyxHQUFHLEdBQUcsRUFBRSxFQUFFLENBQy9ELENBQUMsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxHQUFHLENBQUMsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQTtBQUV0QyxNQUFNLFdBQVcsR0FBRyxDQUFDLEtBQWEsRUFBRSxFQUFFLENBQUM7SUFDckMsS0FBSyxHQUFHLElBQUksRUFBRSxDQUFDLEtBQUssSUFBSSxDQUFDLENBQUMsR0FBRyxJQUFJLEVBQUUsQ0FBQyxLQUFLLElBQUksRUFBRSxDQUFDLEdBQUcsSUFBSSxFQUFFLEtBQUssS0FBSyxFQUFFO0NBQ3RFLENBQUE7QUFFRCxNQUFNLEVBQUUsR0FBRyxJQUFJLENBQUE7QUFDZixNQUFNLEVBQUUsR0FBRyxJQUFJLENBQUE7QUFDZixNQUFNLEVBQUUsR0FBRyxJQUFJLENBQUE7QUFDZixNQUFNLEVBQUUsR0FBRyxJQUFJLENBQUE7QUFFZixNQUFNLE1BQU0sR0FBRyxXQUFXLENBQUMsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxDQUFDLENBQUE7QUFDMUMsTUFBTSxLQUFLLEdBQUcsV0FBVyxDQUFDLE1BQU0sQ0FBQyxDQUFBO0FBRWpDLE9BQU8sQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLFFBQVEsQ0FBQyxFQUFFLENBQUMsRUFBRSxLQUFLLEVBQUUsQ0FBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLENBQUMsQ0FBQyxDQUFBIiwic291cmNlc0NvbnRlbnQiOlsiY29uc3QgY3JlYXRlQ29sb3IgPSAocjogbnVtYmVyLCBnOiBudW1iZXIsIGI6IG51bWJlciwgYSA9IDI1NSkgPT5cclxuICAoYSA8PCAyNCkgfCAoYiA8PCAxNikgfCAoZyA8PCA4KSB8IHJcclxuXHJcbmNvbnN0IGNvbG9yVG9SZ2JhID0gKGNvbG9yOiBudW1iZXIpID0+IFtcclxuICBjb2xvciAmIDB4RkYsIChjb2xvciA+PiA4KSAmIDB4RkYsIChjb2xvciA+PiAxNikgJiAweEZGLCBjb2xvciA+Pj4gMjRcclxuXVxyXG5cclxuY29uc3QgcjAgPSAweDMzXHJcbmNvbnN0IGcwID0gMHg5OVxyXG5jb25zdCBiMCA9IDB4ZmZcclxuY29uc3QgYTAgPSAweDgwXHJcblxyXG5jb25zdCBjb2xvcjAgPSBjcmVhdGVDb2xvcihyMCwgZzAsIGIwLCBhMClcclxuY29uc3QgcmdiYTAgPSBjb2xvclRvUmdiYShjb2xvcjApXHJcblxyXG5jb25zb2xlLmxvZyhjb2xvcjAudG9TdHJpbmcoMTYpLCByZ2JhMCwgWyByMCwgZzAsIGIwLCBhMF0pXHJcbiJdfQ==