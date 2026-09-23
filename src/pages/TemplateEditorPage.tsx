import { useEffect, useRef, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { Link, useParams } from 'react-router-dom'
import {
  Button,
  Input,
  InputNumber,
  Select,
  Space,
  Typography,
  message,
} from 'antd'
import { PlusOutlined, UploadOutlined } from '@ant-design/icons'
import { db, saveTemplate, addFont } from '../lib/db'
import { addField, moveField, removeField, updateField } from '../lib/fieldOps'
import { ensureFontRegistered } from '../lib/fonts'
import { PAGE_HEIGHT_MM, PAGE_WIDTH_MM, pxPerMmFromContainer } from '../lib/units'
import DraggableField from '../components/DraggableField'
import type { Align } from '../lib/types'

export default function TemplateEditorPage() {
  const { templateId } = useParams<{ templateId: string }>()
  const template = useLiveQuery(
    () => (templateId ? db.templates.get(templateId) : undefined),
    [templateId],
  )
  const fonts = useLiveQuery(() => db.fonts.toArray(), [])

  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [pxPerMm, setPxPerMm] = useState(3)
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null)
  const [fontFamilies, setFontFamilies] = useState<Record<string, string>>({})
  const pageRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!template?.referenceImage) {
      setImageUrl(null)
      return
    }
    const url = URL.createObjectURL(template.referenceImage)
    setImageUrl(url)
    return () => URL.revokeObjectURL(url)
  }, [template?.referenceImage])

  useEffect(() => {
    function updateScale() {
      if (pageRef.current) setPxPerMm(pxPerMmFromContainer(pageRef.current.clientWidth))
    }
    updateScale()
    window.addEventListener('resize', updateScale)
    return () => window.removeEventListener('resize', updateScale)
  }, [])

  useEffect(() => {
    if (!fonts) return
    fonts.forEach((f) => {
      ensureFontRegistered(f).then((family) =>
        setFontFamilies((prev) => ({ ...prev, [f.id]: family })),
      )
    })
  }, [fonts])

  if (!template) return <div className="p-6">ກຳລັງໂຫຼດ...</div>

  async function handleReferenceImage(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file || !template) return
    await saveTemplate({ ...template, referenceImage: file })
  }

  async function handleFontUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    const format = file.name.split('.').pop() ?? 'opentype'
    await addFont(file.name, file, format)
    message.success(`ອັບໂຫລດຟອນ "${file.name}" ສຳເລັດ`)
  }

  async function handleAddField() {
    const label = prompt('ຊື່ຊ່ອງຂໍ້ມູນ (ເຊັ່ນ: ຊື່ ແລະ ນາມສະກຸນ)')
    if (!label || !template) return
    const fields = addField(template.fields, label)
    await saveTemplate({ ...template, fields })
    setSelectedFieldId(fields[fields.length - 1].id)
  }

  async function handleMove(fieldId: string, xMm: number, yMm: number) {
    if (!template) return
    await saveTemplate({ ...template, fields: moveField(template.fields, fieldId, xMm, yMm) })
  }

  async function handleFieldPatch(
    fieldId: string,
    patch: Partial<{ label: string; fontSizePt: number; align: Align; fontId: string | null }>,
  ) {
    if (!template) return
    await saveTemplate({ ...template, fields: updateField(template.fields, fieldId, patch) })
  }

  async function handleRemoveField(fieldId: string) {
    if (!template) return
    await saveTemplate({ ...template, fields: removeField(template.fields, fieldId) })
    if (selectedFieldId === fieldId) setSelectedFieldId(null)
  }

  const selectedField = template.fields.find((f) => f.id === selectedFieldId) ?? null

  return (
    <div className="mx-auto max-w-6xl p-6">
      <Space className="mb-2">
        <Link to="/">← ແບບຟອມທັງໝົດ</Link>
      </Space>
      <Typography.Title level={2}>{template.name}</Typography.Title>

      <Space wrap className="mb-4">
        <Button icon={<UploadOutlined />}>
          <label className="cursor-pointer">
            ອັບໂຫລດຮູບຮ່າງອ້າງອີງ
            <input type="file" accept="image/*" onChange={handleReferenceImage} hidden />
          </label>
        </Button>
        <Button icon={<UploadOutlined />}>
          <label className="cursor-pointer">
            ອັບໂຫລດຟອນ
            <input
              type="file"
              accept=".ttf,.otf,.woff,.woff2"
              onChange={handleFontUpload}
              hidden
            />
          </label>
        </Button>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAddField}>
          ເພີ່ມຊ່ອງຂໍ້ມູນ
        </Button>
      </Space>

      <div className="flex flex-wrap items-start gap-6">
        <div
          ref={pageRef}
          className="relative w-[min(70vw,900px)] shrink-0 border border-gray-300 bg-white bg-cover bg-no-repeat"
          style={{
            aspectRatio: `${PAGE_WIDTH_MM} / ${PAGE_HEIGHT_MM}`,
            backgroundImage: imageUrl ? `url(${imageUrl})` : undefined,
          }}
        >
          {template.fields.map((field) => (
            <DraggableField
              key={field.id}
              field={field}
              pxPerMm={pxPerMm}
              selected={field.id === selectedFieldId}
              fontFamily={field.fontId ? (fontFamilies[field.fontId] ?? null) : null}
              onSelect={() => setSelectedFieldId(field.id)}
              onMove={(xMm, yMm) => handleMove(field.id, xMm, yMm)}
            />
          ))}
        </div>

        <div className="w-70 shrink-0">
          <Typography.Title level={4}>ຊ່ອງຂໍ້ມູນ</Typography.Title>
          <ul className="mb-4 list-none p-0">
            {template.fields.map((f) => (
              <li key={f.id} className="mb-1 flex gap-1">
                <Button
                  type={f.id === selectedFieldId ? 'default' : 'text'}
                  className="grow text-left! justify-start!"
                  onClick={() => setSelectedFieldId(f.id)}
                >
                  {f.label}
                </Button>
                <Button danger type="text" onClick={() => handleRemoveField(f.id)}>
                  ລຶບ
                </Button>
              </li>
            ))}
          </ul>

          {selectedField && (
            <div className="flex flex-col gap-3 border-t border-gray-200 pt-3 text-sm">
              <label className="flex flex-col gap-1">
                ປ້າຍຊື່
                <Input
                  value={selectedField.label}
                  onChange={(e) => handleFieldPatch(selectedField.id, { label: e.target.value })}
                />
              </label>
              <label className="flex flex-col gap-1">
                ຂະໜາດຕົວອັກສອນ (pt)
                <InputNumber
                  className="w-full"
                  min={6}
                  max={72}
                  value={selectedField.fontSizePt}
                  onChange={(v) =>
                    v != null && handleFieldPatch(selectedField.id, { fontSizePt: v })
                  }
                />
              </label>
              <label className="flex flex-col gap-1">
                ການຈັດວາງ
                <Select
                  value={selectedField.align}
                  onChange={(v) => handleFieldPatch(selectedField.id, { align: v })}
                  options={[
                    { value: 'left', label: 'ຊ້າຍ' },
                    { value: 'center', label: 'ກາງ' },
                    { value: 'right', label: 'ຂວາ' },
                  ]}
                />
              </label>
              <label className="flex flex-col gap-1">
                ຟອນ
                <Select
                  value={selectedField.fontId ?? ''}
                  onChange={(v) => handleFieldPatch(selectedField.id, { fontId: v || null })}
                  options={[
                    { value: '', label: '(ຟອນມາດຕະຖານ)' },
                    ...(fonts?.map((f) => ({ value: f.id, label: f.name })) ?? []),
                  ]}
                />
              </label>
              <Typography.Text type="secondary">
                ຕຳແໜ່ງ: {selectedField.xMm.toFixed(1)}mm, {selectedField.yMm.toFixed(1)}mm — ລາກ
                ຂໍ້ຄວາມເທິງຮູບເພື່ອຍ້າຍ
              </Typography.Text>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
