import Dexie, { type Table } from 'dexie'
import type { CertRecord, FontAsset, Template } from './types'

class AppDatabase extends Dexie {
  templates!: Table<Template, string>
  fonts!: Table<FontAsset, string>
  records!: Table<CertRecord, string>

  constructor() {
    super('ltvc-docs-certificates')
    this.version(1).stores({
      templates: 'id, name, updatedAt',
      fonts: 'id, name',
      records: 'id, templateId, status, createdAt',
    })
  }
}

export const db = new AppDatabase()

export async function createTemplate(name: string): Promise<Template> {
  const template: Template = {
    id: crypto.randomUUID(),
    name,
    referenceImage: null,
    fields: [],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  }
  await db.templates.add(template)
  return template
}

export async function saveTemplate(template: Template): Promise<void> {
  await db.templates.put({ ...template, updatedAt: Date.now() })
}

export async function deleteTemplate(id: string): Promise<void> {
  await db.transaction('rw', db.templates, db.records, async () => {
    await db.templates.delete(id)
    await db.records.where('templateId').equals(id).delete()
  })
}

export async function addFont(
  name: string,
  blob: Blob,
  format: string,
): Promise<FontAsset> {
  const font: FontAsset = { id: crypto.randomUUID(), name, blob, format }
  await db.fonts.add(font)
  return font
}

export async function deleteFont(id: string): Promise<void> {
  await db.fonts.delete(id)
}

export async function saveRecord(record: CertRecord): Promise<void> {
  await db.records.put(record)
}

export async function deleteRecord(id: string): Promise<void> {
  await db.records.delete(id)
}

export async function recordsForTemplate(
  templateId: string,
): Promise<CertRecord[]> {
  return db.records.where('templateId').equals(templateId).toArray()
}
