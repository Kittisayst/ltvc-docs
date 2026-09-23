import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { Link } from 'react-router-dom'
import { createTemplate, db, deleteTemplate } from '../lib/db'
import { exportBackup, importBackup } from '../lib/backup'

export default function TemplatesPage() {
  const templates = useLiveQuery(() => db.templates.toArray(), [])
  const [newName, setNewName] = useState('')

  async function handleCreate() {
    const name = newName.trim()
    if (!name) return
    await createTemplate(name)
    setNewName('')
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`ລຶບແບບຟອມ "${name}" ແລະ ປະຫວັດການພິມທັງໝົດຂອງມັນ?`)) return
    await deleteTemplate(id)
  }

  async function handleExport() {
    const json = await exportBackup()
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `ltvc-docs-backup-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    const text = await file.text()
    await importBackup(text)
  }

  return (
    <div className="page">
      <h1>ແບບຟອມໃບຍ້ອງຍໍ</h1>

      <div className="toolbar">
        <input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="ຊື່ແບບຟອມໃໝ່"
          onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
        />
        <button type="button" onClick={handleCreate}>
          + ສ້າງແບບຟອມ
        </button>
      </div>

      <ul className="template-list">
        {templates?.map((t) => (
          <li key={t.id}>
            <span className="template-name">{t.name}</span>
            <Link to={`/templates/${t.id}/edit`}>ອອກແບບ</Link>
            <Link to={`/templates/${t.id}/records`}>ຕື່ມຂໍ້ມູນ/ພິມ</Link>
            <button type="button" onClick={() => handleDelete(t.id, t.name)}>
              ລຶບ
            </button>
          </li>
        ))}
        {templates?.length === 0 && <li className="empty">ຍັງບໍ່ມີແບບຟອມ</li>}
      </ul>

      <div className="toolbar">
        <button type="button" onClick={handleExport}>
          ສົ່ງອອກ backup (JSON)
        </button>
        <label className="import-label">
          ນຳເຂົ້າ backup
          <input type="file" accept="application/json" onChange={handleImport} hidden />
        </label>
      </div>
    </div>
  )
}
