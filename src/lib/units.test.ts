import { describe, expect, it } from 'vitest'
import {
  PAGE_HEIGHT_MM,
  PAGE_WIDTH_MM,
  clampToPage,
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
