import type { FontAsset } from './types'

// Bundled at public/fonts/PhetsarathOT.ttf and registered via @font-face
// in index.css — the default for any field that has no uploaded font.
export const DEFAULT_FONT_NAME = 'Phetsarath OT'
export const DEFAULT_FONT_FAMILY = `'${DEFAULT_FONT_NAME}', sans-serif`
export const DEFAULT_FONT_URL = `${import.meta.env.BASE_URL}fonts/PhetsarathOT.ttf`

const registered = new Set<string>()
let defaultFontBufferPromise: Promise<ArrayBuffer> | null = null

export function fontFamilyFor(font: FontAsset): string {
  return `uploaded-${font.id}`
}

export async function ensureFontRegistered(font: FontAsset): Promise<string> {
  const family = fontFamilyFor(font)
  if (registered.has(family)) return family

  const buffer = await font.blob.arrayBuffer()
  const face = new FontFace(family, buffer)
  await face.load()
  document.fonts.add(face)
  registered.add(family)
  return family
}

/** Cached fetch of the bundled default font's raw bytes, for embedding in PDFs and print output. */
export function loadDefaultFontBuffer(): Promise<ArrayBuffer> {
  defaultFontBufferPromise ??= fetch(DEFAULT_FONT_URL).then((r) => r.arrayBuffer())
  return defaultFontBufferPromise
}
