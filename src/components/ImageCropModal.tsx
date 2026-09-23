import { useState } from 'react'
import Cropper, { type Area } from 'react-easy-crop'
import { Button, Modal, Slider, Space } from 'antd'
import { cropImageToBlob } from '../lib/imageCrop'
import { PAGE_HEIGHT_MM, PAGE_WIDTH_MM } from '../lib/units'

interface Props {
  imageUrl: string
  open: boolean
  onCancel: () => void
  onConfirm: (blob: Blob) => void
}

export default function ImageCropModal({ imageUrl, open, onCancel, onConfirm }: Props) {
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [rotation, setRotation] = useState(0)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null)
  const [saving, setSaving] = useState(false)

  async function handleConfirm() {
    if (!croppedAreaPixels) return
    setSaving(true)
    try {
      const blob = await cropImageToBlob(imageUrl, croppedAreaPixels, rotation)
      onConfirm(blob)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      open={open}
      onCancel={onCancel}
      title="ຕັດ/ໝູນຮູບຮ່າງອ້າງອີງ"
      width={720}
      footer={[
        <Button key="cancel" onClick={onCancel}>
          ຍົກເລີກ
        </Button>,
        <Button key="confirm" type="primary" loading={saving} onClick={handleConfirm}>
          ນຳໃຊ້
        </Button>,
      ]}
    >
      <div className="relative h-100 w-full bg-gray-100">
        <Cropper
          image={imageUrl}
          crop={crop}
          zoom={zoom}
          rotation={rotation}
          aspect={PAGE_WIDTH_MM / PAGE_HEIGHT_MM}
          onCropChange={setCrop}
          onZoomChange={setZoom}
          onRotationChange={setRotation}
          onCropComplete={(_, pixels) => setCroppedAreaPixels(pixels)}
        />
      </div>
      <Space direction="vertical" className="mt-4 w-full">
        <label className="flex items-center gap-3 text-sm">
          <span className="w-16 shrink-0">ຊູມ</span>
          <Slider
            className="grow"
            min={1}
            max={3}
            step={0.05}
            value={zoom}
            onChange={setZoom}
          />
        </label>
        <label className="flex items-center gap-3 text-sm">
          <span className="w-16 shrink-0">ໝູນ</span>
          <Slider
            className="grow"
            min={-180}
            max={180}
            step={1}
            value={rotation}
            onChange={setRotation}
          />
        </label>
      </Space>
    </Modal>
  )
}
