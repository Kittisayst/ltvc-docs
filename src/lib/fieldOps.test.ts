import { describe, expect, it } from 'vitest'
import { addField, moveField, removeField, updateField } from './fieldOps'
import type { FieldDef } from './types'

function makeField(overrides: Partial<FieldDef> = {}): FieldDef {
  return {
    id: 'f1',
    label: 'ຊື່ ແລະ ນາມສະກຸນ',
    xMm: 10,
    yMm: 20,
    fontId: null,
    fontSizePt: 12,
    align: 'left',
    staticValue: null,
    ...overrides,
  }
}

describe('addField', () => {
  it('appends a new field with the given label at the page center', () => {
    const fields = addField([], 'ຕຳແໜ່ງ')
    expect(fields).toHaveLength(1)
    expect(fields[0]).toMatchObject({ label: 'ຕຳແໜ່ງ', fontSizePt: 12, align: 'left' })
    expect(fields[0].id).toBeTruthy()
  })

  it('does not mutate the original array', () => {
    const original: FieldDef[] = []
    addField(original, 'ວັນທີ')
    expect(original).toHaveLength(0)
  })

  it('assigns a unique id to each new field', () => {
    const one = addField([], 'A')
    const two = addField(one, 'B')
    expect(two[0].id).not.toBe(two[1].id)
  })

  it('defaults staticValue to null (a per-record field)', () => {
    const fields = addField([], 'ຊື່')
    expect(fields[0].staticValue).toBeNull()
  })
})

describe('updateField', () => {
  it('patches only the matching field', () => {
    const fields = [makeField({ id: 'a' }), makeField({ id: 'b', label: 'ອື່ນ' })]
    const updated = updateField(fields, 'a', { xMm: 55 })
    expect(updated.find((f) => f.id === 'a')?.xMm).toBe(55)
    expect(updated.find((f) => f.id === 'b')?.xMm).toBe(10)
  })

  it('leaves the array unchanged when the id is not found', () => {
    const fields = [makeField({ id: 'a' })]
    const updated = updateField(fields, 'missing', { xMm: 99 })
    expect(updated).toEqual(fields)
  })

  it('sets a static value, making the field the same on every record', () => {
    const fields = [makeField({ id: 'a' })]
    const updated = updateField(fields, 'a', { staticValue: 'ພະແນກ ວິສະວະກຳຊອບແວ' })
    expect(updated[0].staticValue).toBe('ພະແນກ ວິສະວະກຳຊອບແວ')
  })
})

describe('removeField', () => {
  it('removes the field with the matching id', () => {
    const fields = [makeField({ id: 'a' }), makeField({ id: 'b' })]
    const updated = removeField(fields, 'a')
    expect(updated.map((f) => f.id)).toEqual(['b'])
  })
})

describe('moveField', () => {
  it('clamps the new position to the page bounds', () => {
    const fields = [makeField({ id: 'a' })]
    const updated = moveField(fields, 'a', -10, 500)
    expect(updated[0].xMm).toBe(0)
    expect(updated[0].yMm).toBe(210)
  })
})
