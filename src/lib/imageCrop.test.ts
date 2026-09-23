import { describe, expect, it } from 'vitest'
import { rotatedBoundingBox } from './imageCrop'

describe('rotatedBoundingBox', () => {
  it('returns the original size when rotation is 0', () => {
    expect(rotatedBoundingBox(400, 200, 0)).toEqual({ width: 400, height: 200 })
  })

  it('swaps width and height at a 90 degree rotation', () => {
    const { width, height } = rotatedBoundingBox(400, 200, 90)
    expect(width).toBeCloseTo(200, 6)
    expect(height).toBeCloseTo(400, 6)
  })

  it('is symmetric for negative and positive rotation of the same magnitude', () => {
    const positive = rotatedBoundingBox(400, 200, 30)
    const negative = rotatedBoundingBox(400, 200, -30)
    expect(positive).toEqual(negative)
  })

  it('grows the bounding box for a 45 degree rotation', () => {
    const { width, height } = rotatedBoundingBox(200, 200, 45)
    expect(width).toBeCloseTo(200 * Math.SQRT2, 6)
    expect(height).toBeCloseTo(200 * Math.SQRT2, 6)
  })
})
