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

export function clampToPage(
  xMm: number,
  yMm: number,
): { xMm: number; yMm: number } {
  return {
    xMm: Math.min(Math.max(xMm, 0), PAGE_WIDTH_MM),
    yMm: Math.min(Math.max(yMm, 0), PAGE_HEIGHT_MM),
  }
}
