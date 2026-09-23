import type { FontAsset } from './types'

// Bundled at public/fonts/PhetsarathOT.ttf and registered via @font-face
// in index.css — the default for any field that has no uploaded font.
export const DEFAULT_FONT_FAMILY = "'Phetsarath OT', sans-serif"

const registered = new Set<string>()

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
