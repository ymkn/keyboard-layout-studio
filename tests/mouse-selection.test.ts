import { describe, expect, it } from 'vitest'
import {
  DRAG_ACTIVATION_THRESHOLD_PX,
  computeMarqueeSelectedIds,
  exceedsDragThreshold,
  type KeyBounds,
  type SelectionRect
} from '../src/composables/useDragSelection'
import { beginKeyPress, resolveKeyPress } from '../src/utils/mouse-selection'

describe('マウスダウン選択（Issue #4）', () => {
  it('マウスダウンの時点で未選択キーを即時選択する', () => {
    const session = beginKeyPress(['a'], 'b', false)
    expect(session.immediateSelectedIds).toEqual(['b'])
    // リリース（ドラッグなし）では暫定選択を維持する
    expect(resolveKeyPress(session, false, [])).toEqual({ type: 'keep' })
  })

  it('既に選択済みの単独キーはそのまま維持する', () => {
    const session = beginKeyPress(['a'], 'a', false)
    expect(session.immediateSelectedIds).toEqual(['a'])
    expect(resolveKeyPress(session, false, [])).toEqual({ type: 'keep' })
  })

  it('複数選択に含まれるキーはマウスダウンで畳まず、クリック確定時に単独化する', () => {
    const session = beginKeyPress(['a', 'b', 'c'], 'b', false)
    expect(session.immediateSelectedIds).toBeNull()
    expect(resolveKeyPress(session, false, [])).toEqual({ type: 'collapse', keyId: 'b' })
  })

  it('Shiftはマウスダウンでトグルせず、クリック確定時にトグルする', () => {
    const session = beginKeyPress(['a'], 'b', true)
    expect(session.immediateSelectedIds).toBeNull()
    expect(resolveKeyPress(session, false, [])).toEqual({ type: 'toggle', keyId: 'b' })
  })

  it('ドラッグした場合は矩形選択の結果で暫定選択を置き換える', () => {
    const session = beginKeyPress(['a'], 'b', false)
    expect(session.immediateSelectedIds).toEqual(['b'])
    expect(resolveKeyPress(session, true, ['c', 'd'])).toEqual({
      type: 'marquee',
      selectedIds: ['c', 'd']
    })
  })

  it('キー上からドラッグして何も含まない矩形だった場合は選択を解除する', () => {
    const session = beginKeyPress(['a'], 'b', false)
    expect(resolveKeyPress(session, true, [])).toEqual({ type: 'marquee', selectedIds: [] })
  })

  it('Shift+ドラッグはドラッグ前の選択へ矩形選択を加算する（重複なし）', () => {
    const session = beginKeyPress(['a', 'c'], 'b', true)
    expect(resolveKeyPress(session, true, ['c', 'd'])).toEqual({
      type: 'marquee',
      selectedIds: ['a', 'c', 'd']
    })
  })
})

describe('ドラッグ成立の閾値と矩形選択', () => {
  it('閾値以下の移動はドラッグとして成立しない', () => {
    expect(exceedsDragThreshold(0, 0)).toBe(false)
    expect(exceedsDragThreshold(DRAG_ACTIVATION_THRESHOLD_PX, 0)).toBe(false)
    expect(exceedsDragThreshold(DRAG_ACTIVATION_THRESHOLD_PX + 1, 0)).toBe(true)
    expect(exceedsDragThreshold(0, DRAG_ACTIVATION_THRESHOLD_PX + 1)).toBe(true)
  })

  it('矩形と交差するキーだけを返す', () => {
    const keys: KeyBounds[] = [
      { id: 'inside', x: 1, y: 1, width: 1, height: 1 },
      { id: 'partial', x: 2.5, y: 1, width: 1, height: 1 },
      { id: 'outside', x: 5, y: 5, width: 1, height: 1 }
    ]
    const rect: SelectionRect = { x: 54, y: 54, width: 108, height: 54 }
    expect(computeMarqueeSelectedIds(rect, keys, 54)).toEqual(['inside', 'partial'])
  })
})
