import { describe, expect, it, vi } from 'vitest'
import { APP_CONFIG } from '../src/constants/app-config'
import { createShortcuts, handleKeyboardEvent } from '../src/composables/useKeyboardShortcuts'

function makeActions() {
  return {
    undo: vi.fn(), redo: vi.fn(), moveSelectedKeys: vi.fn(), resizeSelectedKeys: vi.fn(),
    deleteSelectedKeys: vi.fn(), copySelectedKeys: vi.fn(), pasteKeys: vi.fn(),
    rotateSelectedKeys: vi.fn(), rotateSelectedKeysAroundCenter: vi.fn()
  }
}

function makeEvent(key: string, modifiers: Partial<Pick<KeyboardEvent, 'ctrlKey' | 'metaKey' | 'shiftKey' | 'altKey'>> = {}): KeyboardEvent {
  return Object.assign(new Event('keydown', { cancelable: true }), {
    key, ctrlKey: false, metaKey: false, shiftKey: false, altKey: false, ...modifiers
  }) as KeyboardEvent
}

describe('回転ショートカット', () => {
  it.each([['PageUp', -APP_CONFIG.ROTATION_STEP], ['PageDown', APP_CONFIG.ROTATION_STEP]])(
    '%sでKLEと同じ方向に共通中心で回転し、ページスクロールを防ぐ', (key, angle) => {
      const actions = makeActions()
      const event = makeEvent(key)
      expect(handleKeyboardEvent(event, createShortcuts(actions), true)).toBe(true)
      expect(actions.rotateSelectedKeysAroundCenter).toHaveBeenCalledExactlyOnceWith(angle)
      expect(actions.rotateSelectedKeys).not.toHaveBeenCalled()
      expect(event.defaultPrevented).toBe(true)
    }
  )

  it.each(['PageUp', 'PageDown'])('選択なしでは%sを処理しない', key => {
    const actions = makeActions()
    const event = makeEvent(key)
    expect(handleKeyboardEvent(event, createShortcuts(actions), false)).toBe(false)
    expect(actions.rotateSelectedKeysAroundCenter).not.toHaveBeenCalled()
    expect(event.defaultPrevented).toBe(false)
  })

  it.each([{ ctrlKey: true }, { metaKey: true }, { shiftKey: true }, { altKey: true }])('修飾キー付きのPgUpは奪わない: %j', modifiers => {
    const actions = makeActions()
    const event = makeEvent('PageUp', modifiers)
    expect(handleKeyboardEvent(event, createShortcuts(actions), true)).toBe(false)
    expect(actions.rotateSelectedKeysAroundCenter).not.toHaveBeenCalled()
    expect(event.defaultPrevented).toBe(false)
  })

  it.each([['r', false, APP_CONFIG.ROTATION_STEP], ['R', true, -APP_CONFIG.ROTATION_STEP]] as const)(
    '従来の%s（shift=%s）はキー自身の中心で回転する', (key, shiftKey, angle) => {
      const actions = makeActions()
      expect(handleKeyboardEvent(makeEvent(key, { shiftKey }), createShortcuts(actions), true)).toBe(true)
      expect(actions.rotateSelectedKeys).toHaveBeenCalledExactlyOnceWith(angle)
      expect(actions.rotateSelectedKeysAroundCenter).not.toHaveBeenCalled()
    }
  )
})

describe('コピー・ペーストのショートカット', () => {
  it.each([{ ctrlKey: true }, { metaKey: true }])('選択キーがなくても貼り付けを呼べる: %j', modifiers => {
    const actions = makeActions()
    const event = makeEvent('v', modifiers)
    expect(handleKeyboardEvent(event, createShortcuts(actions), false)).toBe(true)
    expect(actions.pasteKeys).toHaveBeenCalledOnce()
    expect(event.defaultPrevented).toBe(true)
  })

  it('選択キーがない場合にコピーは呼ばない', () => {
    const actions = makeActions()
    const event = makeEvent('c', { ctrlKey: true })
    expect(handleKeyboardEvent(event, createShortcuts(actions), false)).toBe(false)
    expect(actions.copySelectedKeys).not.toHaveBeenCalled()
    expect(event.defaultPrevented).toBe(false)
  })
})
