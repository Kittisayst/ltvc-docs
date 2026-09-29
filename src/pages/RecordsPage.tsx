import { useEffect, useRef, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { useReactToPrint, type UseReactToPrintOptions } from 'react-to-print'
import { Link, useParams } from 'react-router-dom'
import {
  Button,
  Checkbox,
  Input,
  Popconfirm,
  Segmented,
  Space,
  Table,
  Typography,
  message,
} from 'antd'
import {
  ClearOutlined,
  EditOutlined,
  FilePdfOutlined,
  PlusOutlined,
  PrinterOutlined,
  SearchOutlined,
} from '@ant-design/icons'
import { db, saveRecord, deleteRecord as removeRecordFromDb } from '../lib/db'
import { hasStaticValue } from '../lib/fieldOps'
import {
  createDraftRecord,
  filterByStatus,
  filterRecords,
  markPrinted,
  unmarkPrinted,
  type StatusFilter,
} from '../lib/records'
import { arrayBufferToBase64 } from '../lib/binary'
import { DEFAULT_FONT_NAME, fontFamilyFor, loadDefaultFontBuffer } from '../lib/fonts'
import { buildCertificatePdf } from '../lib/pdf'
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
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [printQueue, setPrintQueue] = useState<CertRecord[] | null>(null)
  const [printFonts, setPrintFonts] = useState<UseReactToPrintOptions['fonts']>([])
  const [pdfLoading, setPdfLoading] = useState(false)
  const printRef = useRef<HTMLDivElement>(null)

  // Font faces for the print iframe react-to-print spins up: it's a fresh
  // document, so it doesn't inherit fonts registered on window.document via
  // ensureFontRegistered (used for the on-screen editor canvas) - these are
  // handed to the hook instead, which registers them inside that iframe.
  useEffect(() => {
    let cancelled = false
    function toFontSource(buffer: ArrayBuffer) {
      return `url(data:font/ttf;base64,${arrayBufferToBase64(buffer)})`
    }
    async function loadFonts() {
      const defaultBuffer = await loadDefaultFontBuffer()
      const uploaded = await Promise.all(
        (fonts ?? []).map(async (f) => ({
          family: fontFamilyFor(f),
          source: toFontSource(await f.blob.arrayBuffer()),
        })),
      )
      if (!cancelled) {
        setPrintFonts([
          { family: DEFAULT_FONT_NAME, source: toFontSource(defaultBuffer) },
          ...uploaded,
        ])
      }
    }
    loadFonts()
    return () => {
      cancelled = true
    }
  }, [fonts])

  const triggerPrint = useReactToPrint({
    contentRef: printRef,
    fonts: printFonts,
    documentTitle: template?.name ?? 'certificate',
    onAfterPrint: () => {
      setPrintQueue((queue) => {
        if (queue) {
          Promise.all(queue.map((r) => saveRecord(markPrinted(r))))
        }
        return null
      })
    },
  })

  useEffect(() => {
    if (printQueue) triggerPrint()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [printQueue])

  if (!template || !records) return <div className="p-6">ກຳລັງໂຫຼດ...</div>

  const filtered = filterByStatus(filterRecords(records, query), statusFilter)

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

  async function handleToggleStatus(record: CertRecord, printed: boolean) {
    await saveRecord(printed ? markPrinted(record) : unmarkPrinted(record))
  }

  async function handleClearStatus() {
    await Promise.all(filtered.map((r) => saveRecord(unmarkPrinted(r))))
  }

  async function handleDownloadPdf() {
    if (!template || filtered.length === 0) return
    setPdfLoading(true)
    try {
      const blob = await buildCertificatePdf(template, filtered, fonts ?? [])
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${template.name}.pdf`
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      message.error('ສ້າງ PDF ບໍ່ສຳເລັດ')
    } finally {
      setPdfLoading(false)
    }
  }

  const editableFields = template.fields.filter((f) => !hasStaticValue(f))
  const fontFamilies = Object.fromEntries((fonts ?? []).map((f) => [f.id, fontFamilyFor(f)]))

  const columns = [
    ...template.fields.map((f) => ({
      title: f.label,
      key: f.id,
      render: (_: unknown, r: CertRecord) => f.staticValue ?? r.values[f.id],
    })),
    {
      title: 'ພິມແລ້ວ',
      key: 'status',
      render: (_: unknown, r: CertRecord) => (
        <Checkbox
          checked={r.status === 'printed'}
          onChange={(e) => handleToggleStatus(r, e.target.checked)}
        />
      ),
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
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <Typography.Title level={2} className="m-0!">
          {template.name}
        </Typography.Title>
        <Link to={`/templates/${template.id}/edit`}>
          <Button icon={<EditOutlined />}>ໄປໜ້າອອກແບບ</Button>
        </Link>
      </div>

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
        <Button icon={<FilePdfOutlined />} loading={pdfLoading} onClick={handleDownloadPdf}>
          ດາວໂຫລດ PDF
        </Button>
        <Popconfirm
          title={`ລ້າງສະຖານະ "ພິມແລ້ວ" ຂອງ ${filtered.length} ລາຍການນີ້?`}
          okText="ລ້າງ"
          cancelText="ຍົກເລີກ"
          onConfirm={handleClearStatus}
        >
          <Button icon={<ClearOutlined />}>ລ້າງທັງໝົດ</Button>
        </Popconfirm>
      </Space>

      <Segmented
        className="mb-3"
        value={statusFilter}
        onChange={(v) => setStatusFilter(v as StatusFilter)}
        options={[
          { label: 'ສະແດງທັງໝົດ', value: 'all' },
          { label: 'ຍັງບໍ່ໄດ້ພິມ', value: 'draft' },
        ]}
      />

      <Table
        rowKey="id"
        columns={columns}
        dataSource={filtered}
        pagination={false}
      />

      <div style={{ display: 'none' }}>
        <div ref={printRef}>
          <PrintSheets template={template} records={printQueue ?? []} fontFamilies={fontFamilies} />
        </div>
      </div>
    </div>
  )
}
