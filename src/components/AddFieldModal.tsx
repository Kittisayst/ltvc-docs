import { useState } from 'react'
import { Input, Modal } from 'antd'

interface Props {
  open: boolean
  onCancel: () => void
  onConfirm: (label: string) => void
}

export default function AddFieldModal({ open, onCancel, onConfirm }: Props) {
  const [label, setLabel] = useState('')

  function handleOk() {
    const trimmed = label.trim()
    if (!trimmed) return
    onConfirm(trimmed)
  }

  return (
    <Modal
      open={open}
      title="ເພີ່ມຊ່ອງຂໍ້ມູນ"
      onCancel={onCancel}
      onOk={handleOk}
      okText="ເພີ່ມ"
      cancelText="ຍົກເລີກ"
      okButtonProps={{ disabled: !label.trim() }}
      destroyOnHidden
    >
      <label className="flex flex-col gap-1 text-sm">
        ຊື່ຊ່ອງຂໍ້ມູນ
        <Input
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          onPressEnter={handleOk}
          placeholder="ເຊັ່ນ: ຊື່ ແລະ ນາມສະກຸນ"
          autoFocus
        />
      </label>
    </Modal>
  )
}
