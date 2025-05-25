import { SizeSlug, T2 } from './types.js'

export const parseSizeSlug = (slug: SizeSlug): T2 => {
  const [width, height] = slug.split('x').map(Number)

  return [width, height]
}

export const createSizeSlug = (width: number, height: number): SizeSlug =>
  `${width}x${height}`

export const sizeToSlug = (size: T2) => createSizeSlug(...size)

// the first size slug found in the string, or null if none found
export const findSizeSlug = (text: string): SizeSlug | null => {
  const match = text.match(/\d+x\d+/)

  return match ? match[0] as SizeSlug : null
}
