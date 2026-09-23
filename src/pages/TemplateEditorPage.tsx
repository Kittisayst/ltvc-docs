import { useEffect, useRef, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { Link, useParams } from 'react-router-dom'
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

  if (!template) return <div className="page">ກຳລັງໂຫຼດ...</div>

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

  async function handleFieldPatch(fieldId: string, patch: Partial<{ label: string; fontSizePt: number; align: Align; fontId: string | null }>) {
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
    <div className="page editor-page">
      <div className="toolbar">
        <Link to="/">← ແບບຟອມທັງໝົດ</Link>
        <h1>{template.name}</h1>
      </div>

      <div className="toolbar">
        <label className="import-label">
          ອັບໂຫລດຮູບຮ່າງອ້າງອີງ
          <input type="file" accept="image/*" onChange={handleReferenceImage} hidden />
        </label>
        <label className="import-label">
          ອັບໂຫລດຟອນ
          <input type="file" accept=".ttf,.otf,.woff,.woff2" onChange={handleFontUpload} hidden />
        </label>
        <button type="button" onClick={handleAddField}>
          + ເພີ່ມຊ່ອງຂໍ້ມູນ
        </button>
      </div>

      <div className="editor-body">
        <div
          ref={pageRef}
          className="page-canvas"
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

        <div className="field-panel">
          <h2>ຊ່ອງຂໍ້ມູນ</h2>
          <ul className="field-list">
            {template.fields.map((f) => (
              <li key={f.id} className={f.id === selectedFieldId ? 'selected' : ''}>
                <button type="button" onClick={() => setSelectedFieldId(f.id)}>
                  {f.label}
                </button>
                <button type="button" onClick={() => handleRemoveField(f.id)}>
                  ລຶບ
                </button>
              </li>
            ))}
          </ul>

          {selectedField && (
            <div className="field-settings">
              <label>
                ປ້າຍຊື່
                <input
                  value={selectedField.label}
                  onChange={(e) => handleFieldPatch(selectedField.id, { label: e.target.value })}
                />
              </label>
              <label>
                ຂະໜາດຕົວອັກສອນ (pt)
                <input
                  type="number"
                  min={6}
                  max={72}
                  value={selectedField.fontSizePt}
                  onChange={(e) =>
                    handleFieldPatch(selectedField.id, { fontSizePt: Number(e.target.value) })
                  }
                />
              </label>
              <label>
                ການຈັດວາງ
                <select
                  value={selectedField.align}
                  onChange={(e) =>
                    handleFieldPatch(selectedField.id, { align: e.target.value as Align })
                  }
                >
                  <option value="left">ຊ້າຍ</option>
                  <option value="center">ກາງ</option>
                  <option value="right">ຂວາ</option>
                </select>
              </label>
              <label>
                ຟອນ
                <select
                  value={selectedField.fontId ?? ''}
                  onChange={(e) =>
                    handleFieldPatch(selectedField.id, { fontId: e.target.value || null })
                  }
                >
                  <option value="">(ຟອນມາດຕະຖານ)</option>
                  {fonts?.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name}
                    </option>
                  ))}
                </select>
              </label>
              <p className="hint">
                ຕຳແໜ່ງ: {selectedField.xMm.toFixed(1)}mm, {selectedField.yMm.toFixed(1)}mm — ລາກຂໍ້ຄວາມເທິງຮູບເພື່ອຍ້າຍ
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
