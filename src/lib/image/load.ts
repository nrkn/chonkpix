export const loadImage = (src: string) => new Promise<ImageData>(
  (resolve, reject) => {
    const img = new Image()

    img.onload = () => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')

      if (!ctx) {
        reject('Failed to get 2d context')
        return
      }

      canvas.width = img.width
      canvas.height = img.height

      ctx.drawImage(img, 0, 0)

      resolve(ctx.getImageData(0, 0, img.width, img.height))
    }

    img.onerror = reject

    img.src = src
  }
)
