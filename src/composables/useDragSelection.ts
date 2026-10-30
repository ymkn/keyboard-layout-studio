/**
 * ドラッグ選択機能のComposable
 *
 * SVGキャンバス上でのマウスドラッグによる矩形選択機能を提供します。
 */
import { ref, computed, type Ref, type ComputedRef } from 'vue'
import { RENDERING } from '../constants/rendering'

/** ドラッグとして成立するまでの移動量（px）。これ以下はクリックとして扱う */
export const DRAG_ACTIVATION_THRESHOLD_PX = 4

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
 * ドラッグ終了時の結果
 */
export interface DragSelectionResult {
  /** 矩形と交差したキーのID（ドラッグ不成立時は空） */
  selectedIds: string[]
  /** 閾値を超えてドラッグとして成立したかどうか */
  dragged: boolean
}

/**
 * 矩形の大きさがドラッグ成立の閾値を超えたかどうか
 */
export function exceedsDragThreshold(width: number, height: number): boolean {
  return width > DRAG_ACTIVATION_THRESHOLD_PX || height > DRAG_ACTIVATION_THRESHOLD_PX
}

/**
 * 選択矩形と交差するキーのIDを返す
 */
export function computeMarqueeSelectedIds(
  rect: SelectionRect,
  keys: KeyBounds[],
  keyUnit: number
): string[] {
  const selectedIds: string[] = []

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

  return selectedIds
}

/**
 * useDragSelectionの戻り値
 */
export interface UseDragSelectionReturn {
  /** ドラッグ中かどうか */
  isDragging: Ref<boolean>
  /** 選択矩形（ドラッグ成立中のみ有効） */
  selectionRect: ComputedRef<SelectionRect | null>
  /** ドラッグ直後かどうか（クリックイベント抑制用） */
  justFinishedDrag: Ref<boolean>
  /** マウスダウンハンドラー */
  handleMouseDown: (event: MouseEvent, marginPixels: number) => void
  /** マウスムーブハンドラー */
  handleMouseMove: (event: MouseEvent, marginPixels: number) => void
  /** マウスアップハンドラー - ドラッグ結果を返す */
  handleMouseUp: (keys: KeyBounds[]) => DragSelectionResult
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

  // 現在の矩形（内部用。閾値判定前のものも含む）
  const currentRect = computed((): SelectionRect | null => {
    if (!isDragging.value) return null

    const x = Math.min(dragStartX.value, dragEndX.value)
    const y = Math.min(dragStartY.value, dragEndY.value)
    const width = Math.abs(dragEndX.value - dragStartX.value)
    const height = Math.abs(dragEndY.value - dragStartY.value)

    return { x, y, width, height }
  })

  // 選択矩形のcomputed（ドラッグとして成立した場合のみ表示する）
  const selectionRect = computed((): SelectionRect | null => {
    const rect = currentRect.value
    if (!rect || !exceedsDragThreshold(rect.width, rect.height)) return null

    return rect
  })

  /**
   * SVGの座標変換を行う
   *
   * キー上の要素からイベントが伝播してきた場合にも対応するため、
   * currentTargetではなくイベント発生要素に最も近いSVG要素を使う。
   */
  function getSVGCoordinates(
    event: MouseEvent,
    marginPixels: number
  ): { x: number; y: number } | null {
    const target = event.target as Element | null
    const svg = (target?.closest?.('svg') ?? event.currentTarget) as SVGSVGElement | null
    if (!svg || typeof svg.getScreenCTM !== 'function') {
      console.warn('SVG element not available')
      return null
    }

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
   * @returns ドラッグとして成立したかと、矩形で選択されたキーのID
   */
  function handleMouseUp(keys: KeyBounds[]): DragSelectionResult {
    if (!isDragging.value) {
      return { selectedIds: [], dragged: false }
    }

    const rect = currentRect.value
    const dragged = rect !== null && exceedsDragThreshold(rect.width, rect.height)
    const selectedIds = dragged && rect ? computeMarqueeSelectedIds(rect, keys, keyUnit) : []

    isDragging.value = false

    // ドラッグとして成立した場合、後続のクリックイベントを抑制する
    if (dragged) {
      justFinishedDrag.value = true
    }

    return { selectedIds, dragged }
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
