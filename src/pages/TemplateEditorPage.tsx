import { useEffect, useRef, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { Link, useParams } from 'react-router-dom'
import {
  Button,
  ColorPicker,
  Divider,
  Input,
  InputNumber,
  Select,
  Space,
  Switch,
  Typography,
  message,
} from 'antd'
import {
  AlignCenterOutlined,
  AlignLeftOutlined,
  AlignRightOutlined,
  BoldOutlined,
  FormOutlined,
  ItalicOutlined,
  PlusOutlined,
  ScissorOutlined,
  UploadOutlined,
  ZoomInOutlined,
  ZoomOutOutlined,
} from '@ant-design/icons'
import { db, saveTemplate, addFont } from '../lib/db'
import { addField, hasStaticValue, moveField, removeField, updateField } from '../lib/fieldOps'
import { ensureFontRegistered } from '../lib/fonts'
import { PAGE_HEIGHT_MM, PAGE_WIDTH_MM, clampZoom, fitPxPerMm, mmToPx } from '../lib/units'
import DraggableField from '../components/DraggableField'
import ImageCropModal from '../components/ImageCropModal'
import AddFieldModal from '../components/AddFieldModal'
import type { Align } from '../lib/types'

export default function TemplateEditorPage() {
  const { templateId } = useParams<{ templateId: string }>()
  const template = useLiveQuery(
    () => (templateId ? db.templates.get(templateId) : undefined),
    [templateId],
  )
  const fonts = useLiveQuery(() => db.fonts.toArray(), [])

  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [fitScale, setFitScale] = useState(3)
  const [zoom, setZoom] = useState(1)
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null)
  const [fontFamilies, setFontFamilies] = useState<Record<string, string>>({})
  const [cropSource, setCropSource] = useState<{ url: string; revoke: boolean } | null>(null)
  const [addFieldOpen, setAddFieldOpen] = useState(false)
  const pageRef = useRef<HTMLDivElement>(null)
  const pxPerMm = fitScale * zoom

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
      if (pageRef.current) {
        setFitScale(fitPxPerMm(pageRef.current.clientWidth, pageRef.current.clientHeight))
      }
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

  function handleReferenceImage(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setCropSource({ url: URL.createObjectURL(file), revoke: true })
  }

  function openCropForExisting() {
    if (!imageUrl) return
    setCropSource({ url: imageUrl, revoke: false })
  }

  function closeCrop() {
    if (cropSource?.revoke) URL.revokeObjectURL(cropSource.url)
    setCropSource(null)
  }

  async function handleCropConfirm(blob: Blob) {
    if (!template) return
    await saveTemplate({ ...template, referenceImage: blob })
    closeCrop()
  }

  async function handleFontUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    const format = file.name.split('.').pop() ?? 'opentype'
    await addFont(file.name, file, format)
    message.success(`ອັບໂຫລດຟອນ "${file.name}" ສຳເລັດ`)
  }

  async function handleAddField(label: string) {
    if (!template) return
    const fields = addField(template.fields, label)
    await saveTemplate({ ...template, fields })
    setSelectedFieldId(fields[fields.length - 1].id)
    setAddFieldOpen(false)
  }

  async function handleMove(fieldId: string, xMm: number, yMm: number) {
    if (!template) return
    await saveTemplate({ ...template, fields: moveField(template.fields, fieldId, xMm, yMm) })
  }

  async function handleFieldPatch(
    fieldId: string,
    patch: Partial<{
      label: string
      fontSizePt: number
      align: Align
      fontId: string | null
      staticValue: string | null
      widthMm: number | null
      heightMm: number | null
      bold: boolean
      italic: boolean
      color: string
    }>,
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
    <div className="mx-auto max-w-[1800px] p-6">
      <Space className="mb-2">
        <Link to="/">← ແບບຟອມທັງໝົດ</Link>
      </Space>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <Typography.Title level={2} className="m-0!">
          {template.name}
        </Typography.Title>
        <Link to={`/templates/${template.id}/records`}>
          <Button type="primary" icon={<FormOutlined />}>
            ໄປໜ້າປ້ອນຂໍ້ມູນ/ພິມ
          </Button>
        </Link>
      </div>

      <Space wrap className="mb-4">
        <Button icon={<UploadOutlined />}>
          <label className="cursor-pointer">
            ອັບໂຫລດຮູບຮ່າງອ້າງອີງ
            <input type="file" accept="image/*" onChange={handleReferenceImage} hidden />
          </label>
        </Button>
        {imageUrl && (
          <Button icon={<ScissorOutlined />} onClick={openCropForExisting}>
            ຕັດ/ໝູນຮູບ
          </Button>
        )}
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
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setAddFieldOpen(true)}>
          ເພີ່ມຊ່ອງຂໍ້ມູນ
        </Button>
      </Space>

      <div className="flex flex-nowrap items-start gap-6">
        <div className="w-44 shrink-0">
          <Typography.Title level={5} className="mt-0!">
            ຊ່ອງຂໍ້ມູນ
          </Typography.Title>
          <ul className="list-none p-0">
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
            {template.fields.length === 0 && (
              <li className="text-sm text-gray-400">ຍັງບໍ່ມີຊ່ອງຂໍ້ມູນ</li>
            )}
          </ul>
        </div>

        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <Space className="shrink-0">
            <Button
              icon={<ZoomOutOutlined />}
              onClick={() => setZoom((z) => clampZoom(z - 0.1))}
            />
            <span className="w-12 text-center text-sm">{Math.round(zoom * 100)}%</span>
            <Button
              icon={<ZoomInOutlined />}
              onClick={() => setZoom((z) => clampZoom(z + 0.1))}
            />
            <Button onClick={() => setZoom(1)}>ພໍດີກັບໜ້າຈໍ</Button>
          </Space>

          <div
            ref={pageRef}
            className="flex h-[calc(100vh-280px)] min-h-100 items-center justify-center overflow-auto rounded bg-gray-100 p-4"
          >
            <div
              className="relative shrink-0 border border-gray-300 bg-white bg-no-repeat"
              style={{
                width: mmToPx(PAGE_WIDTH_MM, pxPerMm),
                height: mmToPx(PAGE_HEIGHT_MM, pxPerMm),
                backgroundImage: imageUrl ? `url(${imageUrl})` : undefined,
                backgroundSize: '100% 100%',
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
          </div>
        </div>

        <div className="w-85 shrink-0 text-sm">
          <Typography.Title level={5} className="mt-0!">
            ການຕັ້ງຄ່າຊ່ອງຂໍ້ມູນ
          </Typography.Title>

          {!selectedField && (
            <Typography.Text type="secondary">ເລືອກຊ່ອງຂໍ້ມູນທາງຊ້າຍເພື່ອຕັ້ງຄ່າ</Typography.Text>
          )}

          {selectedField && (
            <div className="flex flex-col gap-3">
              <Typography.Text strong>ຂໍ້ມູນ</Typography.Text>
              <label className="flex flex-col gap-1">
                ປ້າຍຊື່
                <Input
                  value={selectedField.label}
                  onChange={(e) => handleFieldPatch(selectedField.id, { label: e.target.value })}
                />
              </label>
              <label className="flex items-center gap-2">
                <Switch
                  checked={hasStaticValue(selectedField)}
                  onChange={(checked) =>
                    handleFieldPatch(selectedField.id, {
                      staticValue: checked ? '' : null,
                    })
                  }
                />
                ຄ່າຄົງທີ່ (ຂໍ້ຄວາມຄືກັນທຸກໃບ)
              </label>
              {hasStaticValue(selectedField) && (
                <label className="flex flex-col gap-1">
                  ຂໍ້ຄວາມ
                  <Input.TextArea
                    value={selectedField.staticValue}
                    onChange={(e) =>
                      handleFieldPatch(selectedField.id, { staticValue: e.target.value })
                    }
                    autoSize={{ minRows: 2, maxRows: 6 }}
                  />
                </label>
              )}

              <Divider className="my-1!" />
              <Typography.Text strong>ຕຳແໜ່ງ ແລະ ຂະໜາດ</Typography.Text>
              <div className="flex gap-2">
                <label className="flex flex-col gap-1 grow">
                  ຕຳແໜ່ງ X (mm)
                  <InputNumber
                    className="w-full"
                    min={0}
                    max={PAGE_WIDTH_MM}
                    step={0.5}
                    value={selectedField.xMm}
                    onChange={(v) => v != null && handleMove(selectedField.id, v, selectedField.yMm)}
                  />
                </label>
                <label className="flex flex-col gap-1 grow">
                  ຕຳແໜ່ງ Y (mm)
                  <InputNumber
                    className="w-full"
                    min={0}
                    max={PAGE_HEIGHT_MM}
                    step={0.5}
                    value={selectedField.yMm}
                    onChange={(v) => v != null && handleMove(selectedField.id, selectedField.xMm, v)}
                  />
                </label>
              </div>
              <div className="flex gap-2">
                <label className="flex flex-col gap-1 grow">
                  ຄວາມກວ້າງ (mm)
                  <InputNumber
                    className="w-full"
                    min={1}
                    max={PAGE_WIDTH_MM}
                    step={0.5}
                    placeholder="ອັດຕະໂນມັດ"
                    value={selectedField.widthMm}
                    onChange={(v) => handleFieldPatch(selectedField.id, { widthMm: v })}
                  />
                </label>
                <label className="flex flex-col gap-1 grow">
                  ຄວາມສູງ (mm)
                  <InputNumber
                    className="w-full"
                    min={1}
                    max={PAGE_HEIGHT_MM}
                    step={0.5}
                    placeholder="ອັດຕະໂນມັດ"
                    value={selectedField.heightMm}
                    onChange={(v) => handleFieldPatch(selectedField.id, { heightMm: v })}
                  />
                </label>
              </div>
              <Typography.Text type="secondary">
                ປ່ອຍຄວາມກວ້າງ/ສູງໃຫ້ຫວ່າງເພື່ອອັດຕະໂນມັດຕາມຂໍ້ຄວາມ. ລາກຂໍ້ຄວາມເທິງຮູບເພື່ອຍ້າຍ, ຫຼືພິມຕຳແໜ່ງເອງຂ້າງເທິງ
              </Typography.Text>

              <Divider className="my-1!" />
              <Typography.Text strong>ການປັບແຕ່ງຂໍ້ຄວາມ</Typography.Text>
              <Space.Compact>
                <Button
                  type={selectedField.bold ? 'primary' : 'default'}
                  icon={<BoldOutlined />}
                  onClick={() => handleFieldPatch(selectedField.id, { bold: !selectedField.bold })}
                />
                <Button
                  type={selectedField.italic ? 'primary' : 'default'}
                  icon={<ItalicOutlined />}
                  onClick={() =>
                    handleFieldPatch(selectedField.id, { italic: !selectedField.italic })
                  }
                />
                <Button
                  type={selectedField.align === 'left' ? 'primary' : 'default'}
                  icon={<AlignLeftOutlined />}
                  onClick={() => handleFieldPatch(selectedField.id, { align: 'left' })}
                />
                <Button
                  type={selectedField.align === 'center' ? 'primary' : 'default'}
                  icon={<AlignCenterOutlined />}
                  onClick={() => handleFieldPatch(selectedField.id, { align: 'center' })}
                />
                <Button
                  type={selectedField.align === 'right' ? 'primary' : 'default'}
                  icon={<AlignRightOutlined />}
                  onClick={() => handleFieldPatch(selectedField.id, { align: 'right' })}
                />
                <ColorPicker
                  value={selectedField.color}
                  onChange={(c) => handleFieldPatch(selectedField.id, { color: c.toHexString() })}
                />
              </Space.Compact>
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
                ຟອນ
                <Select
                  value={selectedField.fontId ?? ''}
                  onChange={(v) => handleFieldPatch(selectedField.id, { fontId: v || null })}
                  options={[
                    { value: '', label: '(ຟອນມາດຕະຖານ — Phetsarath OT)' },
                    ...(fonts?.map((f) => ({ value: f.id, label: f.name })) ?? []),
                  ]}
                />
              </label>
            </div>
          )}
        </div>
      </div>

      {cropSource && (
        <ImageCropModal
          imageUrl={cropSource.url}
          open
          onCancel={closeCrop}
          onConfirm={handleCropConfirm}
        />
      )}

      <AddFieldModal
        open={addFieldOpen}
        onCancel={() => setAddFieldOpen(false)}
        onConfirm={handleAddField}
      />
    </div>
  )
}
