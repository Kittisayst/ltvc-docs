import { beforeEach, describe, expect, it } from 'vitest'
import { createTemplate, db, saveRecord, saveTemplate } from './db'
import { createDraftRecord } from './records'
import {
  blobToSerialized,
  exportBackup,
  importBackup,
  serializedToBlob,
} from './backup'

beforeEach(async () => {
  await db.templates.clear()
  await db.fonts.clear()
  await db.records.clear()
})

describe('blobToSerialized / serializedToBlob', () => {
  it('round-trips arbitrary bytes through base64', async () => {
    const original = new Blob(['fake-font-bytes'], { type: 'font/otf' })
    const serialized = await blobToSerialized(original)
    const restored = serializedToBlob(serialized)

    expect(restored.type).toBe('font/otf')
    expect(await restored.text()).toBe('fake-font-bytes')
  })
})

describe('exportBackup / importBackup', () => {
  // Note: this environment's IndexedDB double (fake-indexeddb) hands back
  // Blobs that jsdom's FileReader won't recognize across the realm boundary
  // — a quirk of the test double, not of real browsers, where IndexedDB
  // and FileReader share a single native Blob class. Blob-content fidelity
  // itself is covered by the isolated round-trip test above; this test
  // covers the structural (non-blob) round-trip through export/import.
  it('round-trips template fields and record values through JSON', async () => {
    const template = await createTemplate('ໃບຍ້ອງຍໍ')
    await saveTemplate({
      ...template,
      fields: [
        {
          id: 'f1',
          label: 'ຊື່',
          xMm: 10,
          yMm: 20,
          fontId: null,
          fontSizePt: 14,
          align: 'left',
          staticValue: null,
          widthMm: null,
          heightMm: null,
        },
      ],
    })
    await saveRecord(createDraftRecord(template.id, { f1: 'ສົມຊາຍ' }))

    const json = await exportBackup()

    await db.templates.clear()
    await db.records.clear()

    await importBackup(json)

    const templates = await db.templates.toArray()
    const records = await db.records.toArray()

    expect(templates).toHaveLength(1)
    expect(templates[0].fields).toHaveLength(1)
    expect(templates[0].referenceImage).toBeNull()

    expect(records).toHaveLength(1)
    expect(records[0].values).toEqual({ f1: 'ສົມຊາຍ' })
  })
})
