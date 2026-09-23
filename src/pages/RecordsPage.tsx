import { useEffect, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { Link, useParams } from 'react-router-dom'
import { db, saveRecord, deleteRecord as removeRecordFromDb } from '../lib/db'
import { createDraftRecord, filterRecords, markPrinted } from '../lib/records'
import { ensureFontRegistered } from '../lib/fonts'
import PrintSheets from '../components/PrintSheets'
import type { CertRecord } from '../lib/types'

export default function RecordsPage() {
  const { templateId } = useParams<{ templateId: string }>()
  const template = useLiveQuery(
    () => (templateId ? db.templates.get(templateId) : undefined),
    [templateId],
  )
  const records = useLiveQuery(
    () => (templateId ? db.records.where('templateId').equals(templateId).toArray() : []),
    [templateId],
  )
  const fonts = useLiveQuery(() => db.fonts.toArray(), [])

  const [formValues, setFormValues] = useState<Record<string, string>>({})
  const [editingId, setEditingId] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [printQueue, setPrintQueue] = useState<CertRecord[] | null>(null)
  const [fontFamilies, setFontFamilies] = useState<Record<string, string>>({})

  useEffect(() => {
    if (!fonts) return
    fonts.forEach((f) => {
      ensureFontRegistered(f).then((family) =>
        setFontFamilies((prev) => ({ ...prev, [f.id]: family })),
      )
    })
  }, [fonts])

  useEffect(() => {
    if (!printQueue) return
    const timer = setTimeout(() => window.print(), 100)
    return () => clearTimeout(timer)
  }, [printQueue])

  useEffect(() => {
    function handleAfterPrint() {
      setPrintQueue((queue) => {
        if (queue) {
          Promise.all(queue.map((r) => saveRecord(markPrinted(r))))
        }
        return null
      })
    }
    window.addEventListener('afterprint', handleAfterPrint)
    return () => window.removeEventListener('afterprint', handleAfterPrint)
  }, [])

  if (!template || !records) return <div className="page">ກຳລັງໂຫຼດ...</div>

  const filtered = filterRecords(records, query)

  function handleFieldInput(fieldId: string, value: string) {
    setFormValues((prev) => ({ ...prev, [fieldId]: value }))
  }

  async function handleSaveRecord() {
    if (!template) return
    if (editingId) {
      const existing = records?.find((r) => r.id === editingId)
      if (existing) await saveRecord({ ...existing, values: formValues })
    } else {
      await saveRecord(createDraftRecord(template.id, formValues))
    }
    setFormValues({})
    setEditingId(null)
  }

  function handleEdit(record: CertRecord) {
    setEditingId(record.id)
    setFormValues(record.values)
  }

  async function handleDelete(id: string) {
    if (!confirm('ລຶບລາຍການນີ້?')) return
    await removeRecordFromDb(id)
  }

  function handlePrintOne(record: CertRecord) {
    setPrintQueue([record])
  }

  function handlePrintAll() {
    if (filtered.length === 0) return
    setPrintQueue(filtered)
  }

  return (
    <div className="page">
      <div className="toolbar">
        <Link to="/">← ແບບຟອມທັງໝົດ</Link>
        <h1>{template.name}</h1>
      </div>

      <div className="record-form">
        <h2>{editingId ? 'ແກ້ໄຂລາຍການ' : 'ຕື່ມຂໍ້ມູນໃໝ່'}</h2>
        {template.fields.map((field) => (
          <label key={field.id}>
            {field.label}
            <input
              value={formValues[field.id] ?? ''}
              onChange={(e) => handleFieldInput(field.id, e.target.value)}
            />
          </label>
        ))}
        <div className="toolbar">
          <button type="button" onClick={handleSaveRecord}>
            {editingId ? 'ບັນທຶກການແກ້ໄຂ' : '+ ເພີ່ມລາຍການ'}
          </button>
          {editingId && (
            <button
              type="button"
              onClick={() => {
                setEditingId(null)
                setFormValues({})
              }}
            >
              ຍົກເລີກ
            </button>
          )}
        </div>
      </div>

      <div className="toolbar">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="ຄົ້ນຫາ (ຊື່, ເລກທີ, ...)"
        />
        <button type="button" onClick={handlePrintAll}>
          ພິມທັງໝົດ ({filtered.length})
        </button>
      </div>

      <table className="record-table">
        <thead>
          <tr>
            {template.fields.map((f) => (
              <th key={f.id}>{f.label}</th>
            ))}
            <th>ສະຖານະ</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {filtered.map((r) => (
            <tr key={r.id}>
              {template.fields.map((f) => (
                <td key={f.id}>{r.values[f.id]}</td>
              ))}
              <td>{r.status === 'printed' ? 'ພິມແລ້ວ' : 'ຮ່າງ'}</td>
              <td className="row-actions">
                <button type="button" onClick={() => handlePrintOne(r)}>
                  ພິມ
                </button>
                <button type="button" onClick={() => handleEdit(r)}>
                  ແກ້ໄຂ
                </button>
                <button type="button" onClick={() => handleDelete(r.id)}>
                  ລຶບ
                </button>
              </td>
            </tr>
          ))}
          {filtered.length === 0 && (
            <tr>
              <td colSpan={template.fields.length + 2} className="empty">
                ບໍ່ມີລາຍການ
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {printQueue && (
        <PrintSheets template={template} records={printQueue} fontFamilies={fontFamilies} />
      )}
    </div>
  )
}
