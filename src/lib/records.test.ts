import { describe, expect, it } from 'vitest'
import {
  createDraftRecord,
  filterByStatus,
  filterRecords,
  markPrinted,
  unmarkPrinted,
} from './records'
import type { CertRecord } from './types'

describe('createDraftRecord', () => {
  it('creates a draft record with no printedAt', () => {
    const record = createDraftRecord('tpl-1', { f1: 'ສົມຊາຍ' })
    expect(record.templateId).toBe('tpl-1')
    expect(record.status).toBe('draft')
    expect(record.printedAt).toBeNull()
    expect(record.values).toEqual({ f1: 'ສົມຊາຍ' })
    expect(record.id).toBeTruthy()
  })
})

describe('markPrinted', () => {
  it('transitions a draft record to printed with a timestamp', () => {
    const draft = createDraftRecord('tpl-1', {})
    const printed = markPrinted(draft)
    expect(printed.status).toBe('printed')
    expect(printed.printedAt).toEqual(expect.any(Number))
  })

  it('does not mutate the original record', () => {
    const draft = createDraftRecord('tpl-1', {})
    markPrinted(draft)
    expect(draft.status).toBe('draft')
    expect(draft.printedAt).toBeNull()
  })
})

describe('unmarkPrinted', () => {
  it('reverts a printed record back to draft, clearing printedAt', () => {
    const printed = markPrinted(createDraftRecord('tpl-1', {}))
    const reverted = unmarkPrinted(printed)
    expect(reverted.status).toBe('draft')
    expect(reverted.printedAt).toBeNull()
  })

  it('does not mutate the original record', () => {
    const printed = markPrinted(createDraftRecord('tpl-1', {}))
    unmarkPrinted(printed)
    expect(printed.status).toBe('printed')
  })
})

describe('filterByStatus', () => {
  const base: CertRecord = {
    id: '1',
    templateId: 'tpl-1',
    values: {},
    status: 'printed',
    createdAt: 1000,
    printedAt: 1000,
  }
  const records: CertRecord[] = [
    base,
    { ...base, id: '2', status: 'draft', printedAt: null },
    { ...base, id: '3', status: 'draft', printedAt: null },
  ]

  it('returns every record for "all"', () => {
    expect(filterByStatus(records, 'all')).toHaveLength(3)
  })

  it('returns only printed records for "printed"', () => {
    expect(filterByStatus(records, 'printed').map((r) => r.id)).toEqual(['1'])
  })

  it('returns only draft records for "draft"', () => {
    expect(filterByStatus(records, 'draft').map((r) => r.id)).toEqual(['2', '3'])
  })
})

describe('filterRecords', () => {
  const base: CertRecord = {
    id: '1',
    templateId: 'tpl-1',
    values: { name: 'ສົມຊາຍ', no: '001' },
    status: 'printed',
    createdAt: 1000,
    printedAt: 1000,
  }
  const records: CertRecord[] = [
    base,
    { ...base, id: '2', values: { name: 'ສົມຫຍິງ', no: '002' } },
    { ...base, id: '3', status: 'draft', printedAt: null, values: { name: 'ບຸນມີ', no: '003' } },
  ]

  it('returns all records when the query is empty', () => {
    expect(filterRecords(records, '')).toHaveLength(3)
  })

  it('matches a query against any field value, case-insensitively', () => {
    const result = filterRecords(records, 'ສົມຊາຍ')
    expect(result.map((r) => r.id)).toEqual(['1'])
  })

  it('matches a partial value across fields', () => {
    const result = filterRecords(records, '00')
    expect(result.map((r) => r.id)).toEqual(['1', '2', '3'])
  })

  it('matches nothing when no field contains the query', () => {
    expect(filterRecords(records, 'ບໍ່ມີ')).toHaveLength(0)
  })
})
