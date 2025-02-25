// why wrap and not use the ImageData constructor directly?
// so that it's easy to swap out if porting to a non-browser environment
export const createImage = (width, height, data) => {
    if (data) {
        return new ImageData(data, width, height);
    }
    return new ImageData(width, height);
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY3JlYXRlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vc3JjL2xpYi9pbWFnZS9jcmVhdGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsMkRBQTJEO0FBQzNELHdFQUF3RTtBQUN4RSxNQUFNLENBQUMsTUFBTSxXQUFXLEdBQUcsQ0FDekIsS0FBYSxFQUFFLE1BQWMsRUFBRSxJQUF3QixFQUM1QyxFQUFFO0lBQ2IsSUFBSSxJQUFJLEVBQUUsQ0FBQztRQUNULE9BQU8sSUFBSSxTQUFTLENBQUMsSUFBSSxFQUFFLEtBQUssRUFBRSxNQUFNLENBQUMsQ0FBQTtJQUMzQyxDQUFDO0lBRUQsT0FBTyxJQUFJLFNBQVMsQ0FBQyxLQUFLLEVBQUUsTUFBTSxDQUFDLENBQUE7QUFDckMsQ0FBQyxDQUFBIiwic291cmNlc0NvbnRlbnQiOlsiLy8gd2h5IHdyYXAgYW5kIG5vdCB1c2UgdGhlIEltYWdlRGF0YSBjb25zdHJ1Y3RvciBkaXJlY3RseT9cclxuLy8gc28gdGhhdCBpdCdzIGVhc3kgdG8gc3dhcCBvdXQgaWYgcG9ydGluZyB0byBhIG5vbi1icm93c2VyIGVudmlyb25tZW50XHJcbmV4cG9ydCBjb25zdCBjcmVhdGVJbWFnZSA9IChcclxuICB3aWR0aDogbnVtYmVyLCBoZWlnaHQ6IG51bWJlciwgZGF0YT86IFVpbnQ4Q2xhbXBlZEFycmF5IFxyXG4pOiBJbWFnZURhdGEgPT4ge1xyXG4gIGlmIChkYXRhKSB7XHJcbiAgICByZXR1cm4gbmV3IEltYWdlRGF0YShkYXRhLCB3aWR0aCwgaGVpZ2h0KVxyXG4gIH1cclxuXHJcbiAgcmV0dXJuIG5ldyBJbWFnZURhdGEod2lkdGgsIGhlaWdodClcclxufVxyXG4iXX0=