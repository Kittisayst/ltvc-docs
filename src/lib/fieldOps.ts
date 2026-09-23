import { PAGE_HEIGHT_MM, PAGE_WIDTH_MM, clampToPage } from './units'
import type { FieldDef } from './types'

export function addField(fields: FieldDef[], label: string): FieldDef[] {
  const field: FieldDef = {
    id: crypto.randomUUID(),
    label,
    xMm: PAGE_WIDTH_MM / 2,
    yMm: PAGE_HEIGHT_MM / 2,
    fontId: null,
    fontSizePt: 12,
    align: 'left',
    staticValue: null,
  }
  return [...fields, field]
}

export function updateField(
  fields: FieldDef[],
  id: string,
  patch: Partial<Omit<FieldDef, 'id'>>,
): FieldDef[] {
  return fields.map((f) => (f.id === id ? { ...f, ...patch } : f))
}

export function removeField(fields: FieldDef[], id: string): FieldDef[] {
  return fields.filter((f) => f.id !== id)
}

export function moveField(
  fields: FieldDef[],
  id: string,
  xMm: number,
  yMm: number,
): FieldDef[] {
  const clamped = clampToPage(xMm, yMm)
  return updateField(fields, id, clamped)
}
