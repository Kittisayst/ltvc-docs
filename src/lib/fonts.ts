import type { FontAsset } from './types'

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
