export interface PixelCrop {
  x: number
  y: number
  width: number
  height: number
}

export function rotatedBoundingBox(
  width: number,
  height: number,
  rotationDeg: number,
): { width: number; height: number } {
  const theta = (rotationDeg * Math.PI) / 180
  return {
    width: Math.abs(width * Math.cos(theta)) + Math.abs(height * Math.sin(theta)),
    height: Math.abs(width * Math.sin(theta)) + Math.abs(height * Math.cos(theta)),
  }
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.addEventListener('load', () => resolve(image))
    image.addEventListener('error', (e) => reject(e))
    image.crossOrigin = 'anonymous'
    image.src = src
  })
}

/**
 * Rotates the source image, then crops to the given pixel rectangle
 * (in the rotated image's coordinate space, as produced by
 * react-easy-crop's onCropComplete). Browser-only: relies on Canvas 2D,
 * not exercised by the unit test suite (jsdom has no canvas backend).
 */
export async function cropImageToBlob(
  imageSrc: string,
  crop: PixelCrop,
  rotationDeg: number,
): Promise<Blob> {
  const image = await loadImage(imageSrc)
  const rotatedSize = rotatedBoundingBox(image.width, image.height, rotationDeg)

  const rotateCanvas = document.createElement('canvas')
  rotateCanvas.width = rotatedSize.width
  rotateCanvas.height = rotatedSize.height
  const rotateCtx = rotateCanvas.getContext('2d')
  if (!rotateCtx) throw new Error('Canvas 2D context unavailable')

  rotateCtx.translate(rotatedSize.width / 2, rotatedSize.height / 2)
  rotateCtx.rotate((rotationDeg * Math.PI) / 180)
  rotateCtx.drawImage(image, -image.width / 2, -image.height / 2)

  const cropCanvas = document.createElement('canvas')
  cropCanvas.width = crop.width
  cropCanvas.height = crop.height
  const cropCtx = cropCanvas.getContext('2d')
  if (!cropCtx) throw new Error('Canvas 2D context unavailable')

  cropCtx.drawImage(
    rotateCanvas,
    crop.x,
    crop.y,
    crop.width,
    crop.height,
    0,
    0,
    crop.width,
    crop.height,
  )

  return new Promise((resolve, reject) => {
    cropCanvas.toBlob((blob) => {
      if (blob) resolve(blob)
      else reject(new Error('Failed to encode cropped image'))
    }, 'image/png')
  })
}
