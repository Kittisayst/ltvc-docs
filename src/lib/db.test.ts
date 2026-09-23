import { beforeEach, describe, expect, it } from 'vitest'
import {
  addFont,
  createTemplate,
  db,
  deleteFont,
  deleteTemplate,
  recordsForTemplate,
  saveRecord,
  saveTemplate,
} from './db'
import { createDraftRecord } from './records'

beforeEach(async () => {
  await db.templates.clear()
  await db.fonts.clear()
  await db.records.clear()
})

describe('templates', () => {
  it('creates and persists a template', async () => {
    const template = await createTemplate('ໃບຍ້ອງຍໍ ພະນັກງານດີເດັ່ນ')
    const stored = await db.templates.get(template.id)
    expect(stored?.name).toBe('ໃບຍ້ອງຍໍ ພະນັກງານດີເດັ່ນ')
    expect(stored?.fields).toEqual([])
  })

  it('saves updates and bumps updatedAt', async () => {
    const template = await createTemplate('T1')
    const before = template.updatedAt
    await new Promise((r) => setTimeout(r, 2))
    await saveTemplate({ ...template, name: 'T1 renamed' })
    const stored = await db.templates.get(template.id)
    expect(stored?.name).toBe('T1 renamed')
    expect(stored?.updatedAt).toBeGreaterThan(before)
  })

  it('deleting a template also deletes its records', async () => {
    const template = await createTemplate('T1')
    const record = createDraftRecord(template.id, { name: 'ສົມຊາຍ' })
    await saveRecord(record)

    await deleteTemplate(template.id)

    expect(await db.templates.get(template.id)).toBeUndefined()
    expect(await recordsForTemplate(template.id)).toHaveLength(0)
  })
})

describe('fonts', () => {
  it('adds and deletes a font asset', async () => {
    const blob = new Blob(['fake font bytes'])
    const font = await addFont('Phetsarath OT', blob, 'opentype')
    expect(await db.fonts.get(font.id)).toMatchObject({ name: 'Phetsarath OT' })

    await deleteFont(font.id)
    expect(await db.fonts.get(font.id)).toBeUndefined()
  })
})

describe('records', () => {
  it('lists only records belonging to the given template', async () => {
    const t1 = await createTemplate('T1')
    const t2 = await createTemplate('T2')
    await saveRecord(createDraftRecord(t1.id, { name: 'A' }))
    await saveRecord(createDraftRecord(t1.id, { name: 'B' }))
    await saveRecord(createDraftRecord(t2.id, { name: 'C' }))

    const t1Records = await recordsForTemplate(t1.id)
    expect(t1Records).toHaveLength(2)
    expect(t1Records.every((r) => r.templateId === t1.id)).toBe(true)
  })
})
