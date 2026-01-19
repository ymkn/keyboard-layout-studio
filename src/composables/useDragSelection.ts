/**
 * ドラッグ選択機能のComposable
 *
 * SVGキャンバス上でのマウスドラッグによる矩形選択機能を提供します。
 */
import { ref, computed, type Ref, type ComputedRef } from 'vue'
import { RENDERING } from '../constants/rendering'

/**
 * 選択矩形の型
 */
export interface SelectionRect {
  x: number
  y: number
  width: number
  height: number
}

/**
 * キーの境界を表す型
 */
export interface KeyBounds {
  id: string
  x: number
  y: number
  width: number
  height: number
}

/**
 * useDragSelectionの戻り値
 */
export interface UseDragSelectionReturn {
  /** ドラッグ中かどうか */
  isDragging: Ref<boolean>
  /** 選択矩形（ドラッグ中のみ有効） */
  selectionRect: ComputedRef<SelectionRect | null>
  /** ドラッグ直後かどうか（クリックイベント抑制用） */
  justFinishedDrag: Ref<boolean>
  /** マウスダウンハンドラー */
  handleMouseDown: (event: MouseEvent, marginPixels: number) => void
  /** マウスムーブハンドラー */
  handleMouseMove: (event: MouseEvent, marginPixels: number) => void
  /** マウスアップハンドラー - 選択されたキーのID配列を返す */
  handleMouseUp: (keys: KeyBounds[]) => string[]
  /** ドラッグ状態をリセット */
  resetDrag: () => void
}

/**
 * ドラッグ選択機能を提供するComposable
 */
export function useDragSelection(): UseDragSelectionReturn {
  const keyUnit = RENDERING.KEY_UNIT

  // ドラッグ状態
  const isDragging = ref(false)
  const dragStartX = ref(0)
  const dragStartY = ref(0)
  const dragEndX = ref(0)
  const dragEndY = ref(0)
  const justFinishedDrag = ref(false)

  // 選択矩形のcomputed
  const selectionRect = computed((): SelectionRect | null => {
    if (!isDragging.value) return null

    const x = Math.min(dragStartX.value, dragEndX.value)
    const y = Math.min(dragStartY.value, dragEndY.value)
    const width = Math.abs(dragEndX.value - dragStartX.value)
    const height = Math.abs(dragEndY.value - dragStartY.value)

    return { x, y, width, height }
  })

  /**
   * SVGの座標変換を行う
   */
  function getSVGCoordinates(
    event: MouseEvent,
    marginPixels: number
  ): { x: number; y: number } | null {
    const svg = event.currentTarget as SVGSVGElement
    const screenCTM = svg.getScreenCTM()
    if (!screenCTM) {
      console.warn('SVG transformation matrix not available')
      return null
    }

    const pt = svg.createSVGPoint()
    pt.x = event.clientX
    pt.y = event.clientY
    const svgP = pt.matrixTransform(screenCTM.inverse())

    return {
      x: svgP.x - marginPixels,
      y: svgP.y - marginPixels
    }
  }

  /**
   * ドラッグ開始
   */
  function handleMouseDown(event: MouseEvent, marginPixels: number): void {
    const coords = getSVGCoordinates(event, marginPixels)
    if (!coords) return

    isDragging.value = true
    dragStartX.value = coords.x
    dragStartY.value = coords.y
    dragEndX.value = coords.x
    dragEndY.value = coords.y
  }

  /**
   * ドラッグ中
   */
  function handleMouseMove(event: MouseEvent, marginPixels: number): void {
    if (!isDragging.value) return

    const coords = getSVGCoordinates(event, marginPixels)
    if (!coords) return

    dragEndX.value = coords.x
    dragEndY.value = coords.y
  }

  /**
   * ドラッグ終了
   * @returns 選択されたキーのID配列
   */
  function handleMouseUp(keys: KeyBounds[]): string[] {
    if (!isDragging.value) {
      return []
    }

    const rect = selectionRect.value
    const selectedIds: string[] = []

    // 最小限の動きがあった場合のみ選択（クリックと区別）
    if (rect && (rect.width > 1 || rect.height > 1)) {
      for (const key of keys) {
        const keyX = key.x * keyUnit
        const keyY = key.y * keyUnit
        const keyWidth = key.width * keyUnit
        const keyHeight = key.height * keyUnit

        // キーが矩形と交差しているかチェック
        if (
          keyX < rect.x + rect.width &&
          keyX + keyWidth > rect.x &&
          keyY < rect.y + rect.height &&
          keyY + keyHeight > rect.y
        ) {
          selectedIds.push(key.id)
        }
      }
    }

    isDragging.value = false

    // ドラッグ選択が行われた場合、フラグを立てる
    if (selectedIds.length > 0) {
      justFinishedDrag.value = true
    }

    return selectedIds
  }

  /**
   * ドラッグ状態をリセット
   */
  function resetDrag(): void {
    isDragging.value = false
    dragStartX.value = 0
    dragStartY.value = 0
    dragEndX.value = 0
    dragEndY.value = 0
    justFinishedDrag.value = false
  }

  return {
    isDragging,
    selectionRect,
    justFinishedDrag,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    resetDrag
  }
}
