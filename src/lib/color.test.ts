import { describe, expect, it } from 'vitest'
import { hexToRgb } from './color'

describe('hexToRgb', () => {
  it('converts a 6-digit hex color to an [r, g, b] tuple', () => {
    expect(hexToRgb('#000000')).toEqual([0, 0, 0])
    expect(hexToRgb('#ffffff')).toEqual([255, 255, 255])
    expect(hexToRgb('#2f5597')).toEqual([47, 85, 151])
  })

  it('works without the leading #', () => {
    expect(hexToRgb('ff0000')).toEqual([255, 0, 0])
  })
})
