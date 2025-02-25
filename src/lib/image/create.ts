// why wrap and not use the ImageData constructor directly?
// so that it's easy to swap out if porting to a non-browser environment
export const createImage = (
  width: number, height: number, data?: Uint8ClampedArray 
): ImageData => {
  if (data) {
    return new ImageData(data, width, height)
  }

  return new ImageData(width, height)
}
