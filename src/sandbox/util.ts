import { T2, T3, T5 } from '../lib/types.js'
import { t2N, t3Factory, t5Factory } from '../lib/util.js'

const createPt = t2N
const emptyPoint = createPt()
const createTri = t3Factory(emptyPoint)
const emptyTri = createTri()
const createPentagon = t5Factory(emptyTri)

export const createPentagonTriangles = (
  cx: number, cy: number, radius: number, angleOffset = 0
): T5<T3<T2>> => {
  const tris = createPentagon()

  //

  const vertices = polygonPoints(5, cx, cy, radius, angleOffset)

  for (let i = 0; i < 5; i++) {
    const nextIndex = (i + 1) % 5

    tris[i] = [vertices[i], vertices[nextIndex], [cx, cy]]
  }

  //

  return tris
}

export const polygonPoints = (
  sides: number,
  cx: number,
  cy: number,
  radius: number,
  radianOffset: number = 0
): T2[] => {
  const points: T2[] = []

  for (let i = 0; i < sides; i++) {
    const angle = (2 * Math.PI * i) / sides + radianOffset
    const x = cx + radius * Math.cos(angle)
    const y = cy + radius * Math.sin(angle)

    points.push([x, y])
  }

  return points
}

export const polygonTriangles = (
  sides: number,
  cx: number,
  cy: number,
  radius: number,
  radianOffset: number = 0
): T3<T2>[] => {
  const points = polygonPoints(sides, cx, cy, radius, radianOffset)
  const triangles: T3<T2>[] = []

  for (let i = 0; i < sides; i++) {
    const nextIndex = (i + 1) % sides

    triangles.push([points[i], points[nextIndex], [cx, cy]])
  }

  return triangles
}