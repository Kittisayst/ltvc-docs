import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { Link } from 'react-router-dom'
import { Button, Empty, Input, List, Modal, Space, Typography, message } from 'antd'
import { DeleteOutlined, DownloadOutlined, PlusOutlined, UploadOutlined } from '@ant-design/icons'
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

  function handleDelete(id: string, name: string) {
    Modal.confirm({
      title: `ລຶບແບບຟອມ "${name}"?`,
      content: 'ປະຫວັດການພິມທັງໝົດຂອງແບບຟອມນີ້ຈະຖືກລຶບໄປນຳ.',
      okText: 'ລຶບ',
      okButtonProps: { danger: true },
      cancelText: 'ຍົກເລີກ',
      onOk: () => deleteTemplate(id),
    })
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
    message.success('ນຳເຂົ້າ backup ສຳເລັດ')
  }

  return (
    <div className="mx-auto max-w-3xl p-6">
      <div className="mb-4 flex items-center gap-3">
        <img src={`${import.meta.env.BASE_URL}ltvc_logo.png`} alt="" className="h-14 w-14" />
        <Typography.Title level={2} className="m-0!">
          ແບບຟອມໃບຍ້ອງຍໍ
        </Typography.Title>
      </div>

      <Space.Compact className="mb-4 w-full max-w-md">
        <Input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="ຊື່ແບບຟອມໃໝ່"
          onPressEnter={handleCreate}
        />
        <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
          ສ້າງແບບຟອມ
        </Button>
      </Space.Compact>

      <List
        bordered
        dataSource={templates ?? []}
        locale={{ emptyText: <Empty description="ຍັງບໍ່ມີແບບຟອມ" /> }}
        renderItem={(t) => (
          <List.Item
            actions={[
              <Link key="edit" to={`/templates/${t.id}/edit`}>
                ອອກແບບ
              </Link>,
              <Link key="records" to={`/templates/${t.id}/records`}>
                ຕື່ມຂໍ້ມູນ/ພິມ
              </Link>,
              <Button
                key="delete"
                type="text"
                danger
                icon={<DeleteOutlined />}
                onClick={() => handleDelete(t.id, t.name)}
              />,
            ]}
          >
            <span className="font-medium">{t.name}</span>
          </List.Item>
        )}
      />

      <Space className="mt-6">
        <Button icon={<DownloadOutlined />} onClick={handleExport}>
          ສົ່ງອອກ backup (JSON)
        </Button>
        <Button icon={<UploadOutlined />}>
          <label className="cursor-pointer">
            ນຳເຂົ້າ backup
            <input type="file" accept="application/json" onChange={handleImport} hidden />
          </label>
        </Button>
      </Space>
    </div>
  )
}
