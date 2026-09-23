export type Align = 'left' | 'center' | 'right'

export interface FieldDef {
  id: string
  label: string
  xMm: number
  yMm: number
  fontId: string | null
  fontSizePt: number
  align: Align
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
