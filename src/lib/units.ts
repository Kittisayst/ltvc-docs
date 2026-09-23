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
