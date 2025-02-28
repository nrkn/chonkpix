export const ensurePointBounds = (rect, mode) => {
    const [rx, ry, rw, rh] = rect;
    const rx2 = rx + rw;
    const ry2 = ry + rh;
    return (pts) => {
        if (mode === 'none')
            return pts;
        if (mode === 'clamp') {
            return pts.filter(([x, y]) => x >= rx && x < rx2 && y >= ry && y < ry2);
        }
        if (mode === 'wrap') {
            return pts.map(([x, y]) => {
                return [
                    (x - rx) % rw + rx,
                    (y - ry) % rh + ry
                ];
            });
        }
        throw Error(`Invalid mode: ${mode}`);
    };
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicG9pbnQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi9zcmMvbGliL2dlb20vcG9pbnQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBR0EsTUFBTSxDQUFDLE1BQU0saUJBQWlCLEdBQUcsQ0FDL0IsSUFBUSxFQUFFLElBQW9CLEVBQzlCLEVBQUU7SUFDRixNQUFNLENBQUMsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxDQUFDLEdBQUcsSUFBSSxDQUFBO0lBRTdCLE1BQU0sR0FBRyxHQUFHLEVBQUUsR0FBRyxFQUFFLENBQUE7SUFDbkIsTUFBTSxHQUFHLEdBQUcsRUFBRSxHQUFHLEVBQUUsQ0FBQTtJQUVuQixPQUFPLENBQUMsR0FBUyxFQUFRLEVBQUU7UUFDekIsSUFBSSxJQUFJLEtBQUssTUFBTTtZQUFFLE9BQU8sR0FBRyxDQUFBO1FBRS9CLElBQUksSUFBSSxLQUFLLE9BQU8sRUFBRSxDQUFDO1lBQ3JCLE9BQU8sR0FBRyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDLElBQUksRUFBRSxJQUFJLENBQUMsR0FBRyxHQUFHLElBQUksQ0FBQyxJQUFJLEVBQUUsSUFBSSxDQUFDLEdBQUcsR0FBRyxDQUFDLENBQUE7UUFDekUsQ0FBQztRQUVELElBQUksSUFBSSxLQUFLLE1BQU0sRUFBRSxDQUFDO1lBQ3BCLE9BQU8sR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxFQUFFLEVBQUU7Z0JBQ3hCLE9BQU87b0JBQ0wsQ0FBQyxDQUFDLEdBQUcsRUFBRSxDQUFDLEdBQUcsRUFBRSxHQUFHLEVBQUU7b0JBQ2xCLENBQUMsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxHQUFHLEVBQUUsR0FBRyxFQUFFO2lCQUNuQixDQUFBO1lBQ0gsQ0FBQyxDQUFDLENBQUE7UUFDSixDQUFDO1FBRUQsTUFBTSxLQUFLLENBQUMsaUJBQWlCLElBQUksRUFBRSxDQUFDLENBQUE7SUFDdEMsQ0FBQyxDQUFBO0FBQ0gsQ0FBQyxDQUFBIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgVDIsIFQ0IH0gZnJvbSAnLi4vdHlwZXMuanMnXHJcbmltcG9ydCB7IEJvdW5kc0hhbmRsaW5nIH0gZnJvbSAnLi90eXBlcy5qcydcclxuXHJcbmV4cG9ydCBjb25zdCBlbnN1cmVQb2ludEJvdW5kcyA9IChcclxuICByZWN0OiBUNCwgbW9kZTogQm91bmRzSGFuZGxpbmdcclxuKSA9PiB7XHJcbiAgY29uc3QgW3J4LCByeSwgcncsIHJoXSA9IHJlY3RcclxuXHJcbiAgY29uc3QgcngyID0gcnggKyByd1xyXG4gIGNvbnN0IHJ5MiA9IHJ5ICsgcmhcclxuXHJcbiAgcmV0dXJuIChwdHM6IFQyW10pOiBUMltdID0+IHtcclxuICAgIGlmIChtb2RlID09PSAnbm9uZScpIHJldHVybiBwdHNcclxuXHJcbiAgICBpZiAobW9kZSA9PT0gJ2NsYW1wJykge1xyXG4gICAgICByZXR1cm4gcHRzLmZpbHRlcigoW3gsIHldKSA9PiB4ID49IHJ4ICYmIHggPCByeDIgJiYgeSA+PSByeSAmJiB5IDwgcnkyKVxyXG4gICAgfVxyXG5cclxuICAgIGlmIChtb2RlID09PSAnd3JhcCcpIHtcclxuICAgICAgcmV0dXJuIHB0cy5tYXAoKFt4LCB5XSkgPT4ge1xyXG4gICAgICAgIHJldHVybiBbXHJcbiAgICAgICAgICAoeCAtIHJ4KSAlIHJ3ICsgcngsXHJcbiAgICAgICAgICAoeSAtIHJ5KSAlIHJoICsgcnlcclxuICAgICAgICBdXHJcbiAgICAgIH0pXHJcbiAgICB9XHJcblxyXG4gICAgdGhyb3cgRXJyb3IoYEludmFsaWQgbW9kZTogJHttb2RlfWApXHJcbiAgfVxyXG59Il19