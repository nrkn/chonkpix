export const createHeightmap = (width, height, data) => {
    const size = width * height;
    if (data === undefined) {
        data = new Uint8ClampedArray(size);
    }
    else if (data.length !== size) {
        throw Error(`Expected data length to be ${size}, got ${data.length}`);
    }
    return { width, height, data };
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY3JlYXRlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vc3JjL2xpYi9oZWlnaHRtYXAvY3JlYXRlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUVBLE1BQU0sQ0FBQyxNQUFNLGVBQWUsR0FBRyxDQUM3QixLQUFhLEVBQUUsTUFBYyxFQUFFLElBQXdCLEVBQzVDLEVBQUU7SUFDYixNQUFNLElBQUksR0FBRyxLQUFLLEdBQUcsTUFBTSxDQUFBO0lBRTNCLElBQUksSUFBSSxLQUFLLFNBQVMsRUFBRSxDQUFDO1FBQ3ZCLElBQUksR0FBRyxJQUFJLGlCQUFpQixDQUFDLElBQUksQ0FBQyxDQUFBO0lBQ3BDLENBQUM7U0FBTSxJQUFJLElBQUksQ0FBQyxNQUFNLEtBQUssSUFBSSxFQUFFLENBQUM7UUFDaEMsTUFBTSxLQUFLLENBQUMsOEJBQThCLElBQUksU0FBUyxJQUFJLENBQUMsTUFBTSxFQUFFLENBQUMsQ0FBQTtJQUN2RSxDQUFDO0lBRUQsT0FBTyxFQUFFLEtBQUssRUFBRSxNQUFNLEVBQUUsSUFBSSxFQUFFLENBQUE7QUFDaEMsQ0FBQyxDQUFBIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgSGVpZ2h0bWFwIH0gZnJvbSAnLi90eXBlcy5qcydcclxuXHJcbmV4cG9ydCBjb25zdCBjcmVhdGVIZWlnaHRtYXAgPSAoXHJcbiAgd2lkdGg6IG51bWJlciwgaGVpZ2h0OiBudW1iZXIsIGRhdGE/OiBVaW50OENsYW1wZWRBcnJheVxyXG4pOiBIZWlnaHRtYXAgPT4ge1xyXG4gIGNvbnN0IHNpemUgPSB3aWR0aCAqIGhlaWdodFxyXG5cclxuICBpZiAoZGF0YSA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICBkYXRhID0gbmV3IFVpbnQ4Q2xhbXBlZEFycmF5KHNpemUpXHJcbiAgfSBlbHNlIGlmIChkYXRhLmxlbmd0aCAhPT0gc2l6ZSkge1xyXG4gICAgdGhyb3cgRXJyb3IoYEV4cGVjdGVkIGRhdGEgbGVuZ3RoIHRvIGJlICR7c2l6ZX0sIGdvdCAke2RhdGEubGVuZ3RofWApXHJcbiAgfVxyXG5cclxuICByZXR1cm4geyB3aWR0aCwgaGVpZ2h0LCBkYXRhIH1cclxufVxyXG4iXX0=