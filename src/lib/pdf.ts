import { jsPDF } from 'jspdf'
import { arrayBufferToBase64 } from './binary'
import { hexToRgb } from './color'
import { loadDefaultFontBuffer } from './fonts'
import { fieldBoxWidthMm, textAnchorXMm } from './units'
import type { CertRecord, FontAsset, Template } from './types'

const PDF_DEFAULT_FONT_NAME = 'PhetsarathOT'
const EMBEDDABLE_FORMATS = new Set(['ttf', 'otf', 'truetype', 'opentype'])

async function embedFont(doc: jsPDF, vfsName: string, pdfFontName: string, buffer: ArrayBuffer) {
  const base64 = arrayBufferToBase64(buffer)
  doc.addFileToVFS(vfsName, base64)
  doc.addFont(vfsName, pdfFontName, 'normal')
}

/**
 * Renders a Template's Records into a downloadable PDF: one A4
 * landscape page per record, fields positioned in mm exactly as in
 * the editor/print preview.
 *
 * Font limitation: PDF embedding uses whatever single weight was
 * uploaded (or the bundled Phetsarath OT for unassigned fields) for
 * every style, so a field's bold/italic flags don't visually change
 * the PDF output the way they do on screen or in the browser print -
 * there's no separate bold/italic font file to embed.
 *
 * Box-height limitation: unlike the editor/print preview, this does
 * not clip text to an explicit heightMm - long text simply overflows
 * downward instead of being cut off.
 */
export async function buildCertificatePdf(
  template: Template,
  records: CertRecord[],
  fonts: FontAsset[],
): Promise<Blob> {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })

  const defaultFontBuffer = await loadDefaultFontBuffer()
  await embedFont(doc, 'PhetsarathOT.ttf', PDF_DEFAULT_FONT_NAME, defaultFontBuffer)

  const pdfFontNameByFieldFontId = new Map<string, string>()
  for (const font of fonts) {
    if (!EMBEDDABLE_FORMATS.has(font.format.toLowerCase())) continue
    try {
      const buffer = await font.blob.arrayBuffer()
      const pdfFontName = `font-${font.id}`
      await embedFont(doc, `${font.id}.ttf`, pdfFontName, buffer)
      pdfFontNameByFieldFontId.set(font.id, pdfFontName)
    } catch {
      // Unembeddable (e.g. woff/woff2) - fields using it fall back to the default font.
    }
  }

  records.forEach((record, index) => {
    if (index > 0) doc.addPage('a4', 'landscape')

    for (const field of template.fields) {
      const text = field.staticValue ?? record.values[field.id] ?? ''
      if (!text) continue

      const fontName =
        (field.fontId && pdfFontNameByFieldFontId.get(field.fontId)) || PDF_DEFAULT_FONT_NAME
      doc.setFont(fontName, 'normal')
      doc.setFontSize(field.fontSizePt)
      doc.setTextColor(...hexToRgb(field.color))

      const boxWidth = fieldBoxWidthMm(field.xMm, field.widthMm)
      const lines = doc.splitTextToSize(text, boxWidth)
      const anchorX = textAnchorXMm(field.xMm, boxWidth, field.align)
      doc.text(lines, anchorX, field.yMm, { align: field.align, baseline: 'top' })
    }
  })

  return doc.output('blob')
}
