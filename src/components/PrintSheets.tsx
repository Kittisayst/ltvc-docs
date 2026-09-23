import { DEFAULT_FONT_FAMILY } from '../lib/fonts'
import { remainingWidthMm } from '../lib/units'
import type { CertRecord, Template } from '../lib/types'

interface Props {
  template: Template
  records: CertRecord[]
  fontFamilies: Record<string, string>
}

export default function PrintSheets({ template, records, fontFamilies }: Props) {
  return (
    <div className="print-area">
      {records.map((record) => (
        <div key={record.id} className="print-sheet">
          {template.fields.map((field) => (
            <div
              key={field.id}
              className="print-field"
              style={{
                left: `${field.xMm}mm`,
                top: `${field.yMm}mm`,
                maxWidth: `${remainingWidthMm(field.xMm)}mm`,
                whiteSpace: 'pre-wrap',
                fontSize: `${field.fontSizePt}pt`,
                textAlign: field.align,
                fontFamily: field.fontId ? fontFamilies[field.fontId] : DEFAULT_FONT_FAMILY,
              }}
            >
              {field.staticValue ?? record.values[field.id] ?? ''}
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}
