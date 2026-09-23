export type Align = 'left' | 'center' | 'right'

export interface FieldDef {
  id: string
  label: string
  xMm: number
  yMm: number
  fontId: string | null
  fontSizePt: number
  align: Align
  /**
   * When set, this field's text is the same on every certificate: it
   * lives on the Template, not per Record. Data entry skips it and
   * printing reads straight from here instead of the Record's values.
   */
  staticValue: string | null
  /**
   * Explicit box size in mm. Null means auto: width shrinks to fit the
   * text (capped at the remaining page width) and height grows with it.
   * Set, they pin the field to a fixed box (and clip overflow) instead.
   */
  widthMm: number | null
  heightMm: number | null
}

export interface Template {
  id: string
  name: string
  referenceImage: Blob | null
  fields: FieldDef[]
  createdAt: number
  updatedAt: number
}

export interface FontAsset {
  id: string
  name: string
  blob: Blob
  format: string
}

export type RecordStatus = 'draft' | 'printed'

export interface CertRecord {
  id: string
  templateId: string
  values: Record<string, string>
  status: RecordStatus
  createdAt: number
  printedAt: number | null
}
