import { T2, T3, T8 } from '../lib/types.js'

export const boxOcts = (box: T2<T3>): T8<T2<T3>> => {
  const [xmin, ymin, zmin] = box[0]
  const [xmax, ymax, zmax] = box[1]

  // center
  const xcen = (xmin + xmax) / 2
  const ycen = (ymin + ymax) / 2
  const zcen = (zmin + zmax) / 2

  return [
    [[xmin, ymin, zmin], [xcen, ycen, zcen]],
    [[xcen, ymin, zmin], [xmax, ycen, zcen]],
    [[xmin, ycen, zmin], [xcen, ymax, zcen]],
    [[xcen, ycen, zmin], [xmax, ymax, zcen]],

    [[xmin, ymin, zcen], [xcen, ycen, zmax]],
    [[xcen, ymin, zcen], [xmax, ycen, zmax]],
    [[xmin, ycen, zcen], [xcen, ymax, zmax]],
    [[xcen, ycen, zcen], [xmax, ymax, zmax]]
  ]
}

export type Octant = {
  children: T8<Octant>
  aabb: T2<T3>
  isLeaf: boolean
  solid: boolean
  width: number // always cubic
}

export const createOct = (box: T2<T3>): Octant => ({
  children: Array(8) as T8<Octant>,
  aabb: box,
  isLeaf: true,
  solid: false,
  width: Math.abs(box[0][0] - box[1][0])
})

export const octSubdivide = (octant: Octant) => {
  const x = boxOcts(octant.aabb)

  for (let i = 0; i < x.length; i++) {
    octant.children[i] = createOct(x[i])
  }

  octant.isLeaf = false
  octant.solid = false
}

export const octInsert = (octant: Octant, point: T3, width: number) => {
  const inside = boxContainsP3(octant.aabb, point)
  const tooBig = octant.width > width

  if (inside && tooBig) {
    if (octant.isLeaf) {
      octSubdivide(octant)
    }

    for (let i = 0; i < octant.children.length; i++) {
      octInsert(octant.children[i], point, width)
    }
  }
  else if (inside && !tooBig) {
    octant.solid = true
  }
}

export type OctIntersects = (box: T2<T3>) => boolean

export const octIntersects = (
  root: Octant, isInter: OctIntersects
) => {
  const stack = [root]

  while (stack.length) {
    const octant = stack.pop()!

    if (!isInter(octant.aabb)) continue

    if (octant.isLeaf) {
      if (octant.solid) return true
    } else {
      for (let i = 0; i < octant.children.length; i++) {
        const child = octant.children[i]

        if (child.isLeaf && !child.solid) continue

        stack.push(child)
      }
    }
  }

  return false
}

export const boxContainsP3 = (box: T2<T3>, p3: T3) => (
  (p3[0] >= box[0][0] && p3[0] <= box[1][0]) &&
  (p3[1] >= box[0][1] && p3[1] <= box[1][1]) &&
  (p3[2] >= box[0][2] && p3[2] <= box[1][2])
)
