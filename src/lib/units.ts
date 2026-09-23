export const PAGE_WIDTH_MM = 297
export const PAGE_HEIGHT_MM = 210

export function mmToPx(mm: number, pxPerMm: number): number {
  return mm * pxPerMm
}

export function pxToMm(px: number, pxPerMm: number): number {
  return px / pxPerMm
}

export function pxPerMmFromContainer(containerWidthPx: number): number {
  return containerWidthPx / PAGE_WIDTH_MM
}

/** The px-per-mm scale that fits the whole A4 page inside a box of this size, on both axes. */
export function fitPxPerMm(wrapperWidthPx: number, wrapperHeightPx: number): number {
  return Math.min(wrapperWidthPx / PAGE_WIDTH_MM, wrapperHeightPx / PAGE_HEIGHT_MM)
}

const MIN_ZOOM = 0.25
const MAX_ZOOM = 3

export function clampZoom(zoom: number): number {
  return Math.min(Math.max(zoom, MIN_ZOOM), MAX_ZOOM)
}

const MIN_FIELD_WIDTH_MM = 10

/** Space available for a field's text before it runs off the right page edge. */
export function remainingWidthMm(xMm: number): number {
  return Math.max(PAGE_WIDTH_MM - xMm, MIN_FIELD_WIDTH_MM)
}

/** A field's box width: its explicit width if set, else shrink-to-fit up to the page edge. */
export function fieldBoxWidthMm(xMm: number, widthMm: number | null): number {
  return widthMm ?? remainingWidthMm(xMm)
}

export function clampToPage(
  xMm: number,
  yMm: number,
): { xMm: number; yMm: number } {
  return {
    xMm: Math.min(Math.max(xMm, 0), PAGE_WIDTH_MM),
    yMm: Math.min(Math.max(yMm, 0), PAGE_HEIGHT_MM),
  }
}
