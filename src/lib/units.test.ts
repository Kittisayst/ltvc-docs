import { describe, expect, it } from 'vitest'
import {
  PAGE_HEIGHT_MM,
  PAGE_WIDTH_MM,
  clampToPage,
  clampZoom,
  fieldBoxWidthMm,
  fitPxPerMm,
  mmToPx,
  pxPerMmFromContainer,
  pxToMm,
  remainingWidthMm,
} from './units'

describe('mmToPx / pxToMm', () => {
  it('converts mm to px using the given scale', () => {
    expect(mmToPx(10, 3)).toBe(30)
  })

  it('converts px back to mm using the given scale', () => {
    expect(pxToMm(30, 3)).toBe(10)
  })

  it('round-trips mm -> px -> mm', () => {
    const pxPerMm = 3.7795
    const original = 42.5
    const roundTripped = pxToMm(mmToPx(original, pxPerMm), pxPerMm)
    expect(roundTripped).toBeCloseTo(original, 6)
  })
})

describe('pxPerMmFromContainer', () => {
  it('derives px-per-mm from a container measured at the A4 landscape width', () => {
    expect(pxPerMmFromContainer(2970)).toBe(10)
  })
})

describe('clampToPage', () => {
  it('leaves in-bounds coordinates untouched', () => {
    expect(clampToPage(100, 50)).toEqual({ xMm: 100, yMm: 50 })
  })

  it('clamps negative coordinates to 0', () => {
    expect(clampToPage(-5, -1)).toEqual({ xMm: 0, yMm: 0 })
  })

  it('clamps coordinates past the page edge to the page size', () => {
    expect(clampToPage(PAGE_WIDTH_MM + 50, PAGE_HEIGHT_MM + 50)).toEqual({
      xMm: PAGE_WIDTH_MM,
      yMm: PAGE_HEIGHT_MM,
    })
  })
})

describe('remainingWidthMm', () => {
  it('returns the space between a field and the right page edge', () => {
    expect(remainingWidthMm(50)).toBe(PAGE_WIDTH_MM - 50)
  })

  it('never returns less than a small usable minimum, even past the edge', () => {
    expect(remainingWidthMm(PAGE_WIDTH_MM + 50)).toBeGreaterThan(0)
  })
})

describe('fitPxPerMm', () => {
  it('picks the width-limited scale when the wrapper is wider than tall relative to A4', () => {
    // A very wide, short wrapper: height is the binding constraint.
    const scale = fitPxPerMm(3000, 210)
    expect(scale).toBeCloseTo(210 / PAGE_HEIGHT_MM, 6)
  })

  it('picks the height-limited scale when the wrapper is taller than wide relative to A4', () => {
    // A narrow, tall wrapper: width is the binding constraint.
    const scale = fitPxPerMm(297, 3000)
    expect(scale).toBeCloseTo(297 / PAGE_WIDTH_MM, 6)
  })

  it('fills the wrapper exactly on both axes when its aspect ratio matches A4', () => {
    const scale = fitPxPerMm(PAGE_WIDTH_MM * 4, PAGE_HEIGHT_MM * 4)
    expect(scale).toBeCloseTo(4, 6)
  })
})

describe('clampZoom', () => {
  it('leaves in-range zoom untouched', () => {
    expect(clampZoom(1.5)).toBe(1.5)
  })

  it('clamps below the minimum zoom', () => {
    expect(clampZoom(0.01)).toBeGreaterThanOrEqual(0.25)
  })

  it('clamps above the maximum zoom', () => {
    expect(clampZoom(100)).toBeLessThanOrEqual(3)
  })
})

describe('fieldBoxWidthMm', () => {
  it('falls back to the remaining page width when no explicit width is set', () => {
    expect(fieldBoxWidthMm(50, null)).toBe(remainingWidthMm(50))
  })

  it('uses the explicit width when one is set', () => {
    expect(fieldBoxWidthMm(50, 80)).toBe(80)
  })
})
