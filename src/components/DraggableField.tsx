import { useRef } from 'react'
import type { FieldDef } from '../lib/types'
import { DEFAULT_FONT_FAMILY } from '../lib/fonts'
import { clampToPage, mmToPx, pxToMm, remainingWidthMm } from '../lib/units'

interface Props {
  field: FieldDef
  pxPerMm: number
  selected: boolean
  fontFamily: string | null
  onSelect: () => void
  onMove: (xMm: number, yMm: number) => void
}

export default function DraggableField({
  field,
  pxPerMm,
  selected,
  fontFamily,
  onSelect,
  onMove,
}: Props) {
  const dragStart = useRef<{ pointerX: number; pointerY: number; xMm: number; yMm: number } | null>(null)

  function handlePointerDown(e: React.PointerEvent<HTMLDivElement>) {
    e.currentTarget.setPointerCapture(e.pointerId)
    onSelect()
    dragStart.current = {
      pointerX: e.clientX,
      pointerY: e.clientY,
      xMm: field.xMm,
      yMm: field.yMm,
    }
  }

  function handlePointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (!dragStart.current) return
    const dxPx = e.clientX - dragStart.current.pointerX
    const dyPx = e.clientY - dragStart.current.pointerY
    const next = clampToPage(
      dragStart.current.xMm + pxToMm(dxPx, pxPerMm),
      dragStart.current.yMm + pxToMm(dyPx, pxPerMm),
    )
    onMove(next.xMm, next.yMm)
  }

  function handlePointerUp() {
    dragStart.current = null
  }

  return (
    <div
      className={`absolute cursor-move touch-none select-none whitespace-pre-wrap border px-1 py-0.5 text-black ${
        selected ? 'border-dashed border-blue-500 bg-blue-50' : 'border-transparent'
      }`}
      style={{
        left: mmToPx(field.xMm, pxPerMm),
        top: mmToPx(field.yMm, pxPerMm),
        maxWidth: mmToPx(remainingWidthMm(field.xMm), pxPerMm),
        fontSize: field.fontSizePt,
        textAlign: field.align,
        fontFamily: fontFamily ?? DEFAULT_FONT_FAMILY,
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
    >
      {field.staticValue ?? field.label}
    </div>
  )
}
