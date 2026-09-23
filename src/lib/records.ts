import type { CertRecord } from './types'

export function createDraftRecord(
  templateId: string,
  values: Record<string, string>,
): CertRecord {
  return {
    id: crypto.randomUUID(),
    templateId,
    values,
    status: 'draft',
    createdAt: Date.now(),
    printedAt: null,
  }
}

export function markPrinted(record: CertRecord): CertRecord {
  return { ...record, status: 'printed', printedAt: Date.now() }
}

export function filterRecords(
  records: CertRecord[],
  query: string,
): CertRecord[] {
  const q = query.trim().toLowerCase()
  if (!q) return records
  return records.filter((r) =>
    Object.values(r.values).some((v) => v.toLowerCase().includes(q)),
  )
}
