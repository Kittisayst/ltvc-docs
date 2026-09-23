import { db } from './db'
import type { CertRecord, FontAsset, Template } from './types'

interface SerializedBlob {
  base64: string
  type: string
}

interface BackupFile {
  version: 1
  templates: Array<Omit<Template, 'referenceImage'> & {
    referenceImage: SerializedBlob | null
  }>
  fonts: Array<Omit<FontAsset, 'blob'> & { blob: SerializedBlob }>
  records: CertRecord[]
}

export function blobToSerialized(blob: Blob): Promise<SerializedBlob> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const buffer = reader.result as ArrayBuffer
      let binary = ''
      for (const byte of new Uint8Array(buffer)) {
        binary += String.fromCharCode(byte)
      }
      resolve({ base64: btoa(binary), type: blob.type })
    }
    reader.onerror = () => reject(reader.error)
    reader.readAsArrayBuffer(blob)
  })
}

export function serializedToBlob(serialized: SerializedBlob): Blob {
  const binary = atob(serialized.base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  return new Blob([bytes], { type: serialized.type })
}

export async function exportBackup(): Promise<string> {
  const [templates, fonts, records] = await Promise.all([
    db.templates.toArray(),
    db.fonts.toArray(),
    db.records.toArray(),
  ])

  const file: BackupFile = {
    version: 1,
    templates: await Promise.all(
      templates.map(async (t) => ({
        ...t,
        referenceImage: t.referenceImage
          ? await blobToSerialized(t.referenceImage)
          : null,
      })),
    ),
    fonts: await Promise.all(
      fonts.map(async (f) => ({ ...f, blob: await blobToSerialized(f.blob) })),
    ),
    records,
  }

  return JSON.stringify(file)
}

export async function importBackup(json: string): Promise<void> {
  const file = JSON.parse(json) as BackupFile

  await db.transaction('rw', db.templates, db.fonts, db.records, async () => {
    for (const t of file.templates) {
      await db.templates.put({
        ...t,
        referenceImage: t.referenceImage
          ? serializedToBlob(t.referenceImage)
          : null,
      })
    }
    for (const f of file.fonts) {
      await db.fonts.put({ ...f, blob: serializedToBlob(f.blob) })
    }
    for (const r of file.records) {
      await db.records.put(r)
    }
  })
}
