import type { CertRecord, RecordStatus } from './types'

export type StatusFilter = 'all' | RecordStatus

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

export function unmarkPrinted(record: CertRecord): CertRecord {
  return { ...record, status: 'draft', printedAt: null }
}

export function filterByStatus(
  records: CertRecord[],
  status: StatusFilter,
): CertRecord[] {
  if (status === 'all') return records
  return records.filter((r) => r.status === status)
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
