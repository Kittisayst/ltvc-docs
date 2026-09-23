import { useEffect, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { Link, useParams } from 'react-router-dom'
import {
  Button,
  Input,
  Popconfirm,
  Space,
  Table,
  Tag,
  Typography,
} from 'antd'
import { PlusOutlined, PrinterOutlined, SearchOutlined } from '@ant-design/icons'
import { db, saveRecord, deleteRecord as removeRecordFromDb } from '../lib/db'
import { hasStaticValue } from '../lib/fieldOps'
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

  if (!template || !records) return <div className="p-6">ກຳລັງໂຫຼດ...</div>

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
    await removeRecordFromDb(id)
  }

  function handlePrintOne(record: CertRecord) {
    setPrintQueue([record])
  }

  function handlePrintAll() {
    if (filtered.length === 0) return
    setPrintQueue(filtered)
  }

  const editableFields = template.fields.filter((f) => !hasStaticValue(f))

  const columns = [
    ...template.fields.map((f) => ({
      title: f.label,
      key: f.id,
      render: (_: unknown, r: CertRecord) => f.staticValue ?? r.values[f.id],
    })),
    {
      title: 'ສະຖານະ',
      key: 'status',
      render: (_: unknown, r: CertRecord) =>
        r.status === 'printed' ? <Tag color="green">ພິມແລ້ວ</Tag> : <Tag>ຮ່າງ</Tag>,
    },
    {
      title: '',
      key: 'actions',
      render: (_: unknown, r: CertRecord) => (
        <Space>
          <Button size="small" icon={<PrinterOutlined />} onClick={() => handlePrintOne(r)}>
            ພິມ
          </Button>
          <Button size="small" onClick={() => handleEdit(r)}>
            ແກ້ໄຂ
          </Button>
          <Popconfirm title="ລຶບລາຍການນີ້?" okText="ລຶບ" cancelText="ຍົກເລີກ" onConfirm={() => handleDelete(r.id)}>
            <Button size="small" danger>
              ລຶບ
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  return (
    <div className="mx-auto max-w-6xl p-6">
      <Space className="mb-2">
        <Link to="/">← ແບບຟອມທັງໝົດ</Link>
      </Space>
      <Typography.Title level={2}>{template.name}</Typography.Title>

      <div className="mb-4 flex flex-col gap-3 rounded-lg border border-gray-200 p-4">
        <Typography.Title level={4} className="m-0!">
          {editingId ? 'ແກ້ໄຂລາຍການ' : 'ຕື່ມຂໍ້ມູນໃໝ່'}
        </Typography.Title>
        {editableFields.map((field) => (
          <label key={field.id} className="flex flex-col gap-1 text-sm">
            {field.label}
            <Input
              value={formValues[field.id] ?? ''}
              onChange={(e) => handleFieldInput(field.id, e.target.value)}
            />
          </label>
        ))}
        {template.fields.length > editableFields.length && (
          <Typography.Text type="secondary">
            ຊ່ອງທີ່ເປັນຄ່າຄົງທີ່ຈະຖືກຕື່ມໃຫ້ອັດຕະໂນມັດຕອນພິມ, ບໍ່ຕ້ອງພິມຊ້ຳ.
          </Typography.Text>
        )}
        <Space>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleSaveRecord}>
            {editingId ? 'ບັນທຶກການແກ້ໄຂ' : 'ເພີ່ມລາຍການ'}
          </Button>
          {editingId && (
            <Button
              onClick={() => {
                setEditingId(null)
                setFormValues({})
              }}
            >
              ຍົກເລີກ
            </Button>
          )}
        </Space>
      </div>

      <Space className="mb-4" wrap>
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="ຄົ້ນຫາ (ຊື່, ເລກທີ, ...)"
          prefix={<SearchOutlined />}
          className="w-64"
        />
        <Button type="primary" icon={<PrinterOutlined />} onClick={handlePrintAll}>
          ພິມທັງໝົດ ({filtered.length})
        </Button>
      </Space>

      <Table
        rowKey="id"
        columns={columns}
        dataSource={filtered}
        pagination={false}
      />

      {printQueue && (
        <PrintSheets template={template} records={printQueue} fontFamilies={fontFamilies} />
      )}
    </div>
  )
}
