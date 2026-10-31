import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Key, KeyboardLayout } from '../src/types/keyboard'
import { useEditorStore } from '../src/stores/editor'
import { useLayoutStore, cloneLayout } from '../src/stores/layout'
import { useHistoryStore } from '../src/stores/history'
import { useKeyboardStore } from '../src/stores/keyboard'
import { extractPersistedLayout } from '../src/types/persistence'
import { exportToVial } from '../src/utils/export'
import { getLayoutOptionGroups } from '../src/utils/layout-options'

vi.mock('../src/i18n', () => ({ i18n: { global: { t: (key: string) => key } } }))

function key(id: string, layoutOption?: Key['layoutOption']): Key {
  return { id, x: 2, y: 1, width: 1, height: 1, matrix: { row: 0, col: 0 }, legend: { center: id }, keycodes: { 0: 'KC_A' }, layoutOption }
}

function layout(): KeyboardLayout {
  return {
    name: 'Variations', layerCount: 1,
    layoutOptions: ['Split Backspace', ['Space', '6.25u', '7u', 'Split']],
    keys: [key('common'), key('backspace', { group: 0, choice: 0 }), key('split', { group: 0, choice: 1 }),
      key('space', { group: 1, choice: 0 }), key('space7', { group: 1, choice: 1 }), key('splitspace', { group: 1, choice: 2 })]
  }
}

function setup() {
  const store = useLayoutStore()
  store.loadLayout(layout())
  const editor = useEditorStore()
  const history = useHistoryStore()
  history.setupLayoutWatcher()
  history.initializeHistory()
  return { store, editor, history }
}

describe('Layout Optionsの表示・編集対象', () => {
  beforeEach(() => { setActivePinia(createPinia()) })

  it('全選択肢を重ねて表示し、共通キーだけを初期編集対象にする', () => {
    const { editor } = setup()
    expect(editor.visibleKeys).toHaveLength(6)
    expect(editor.editableKeys.map(item => item.id)).toEqual(['common'])
    editor.setActiveLayoutOption({ group: 0, choice: 1 })
    expect(editor.editableKeys.map(item => item.id)).toEqual(['split'])
    expect(editor.renderedKeys.at(-1)?.id).toBe('split')
  })

  it('表示切り替えや編集先の変更は保存データ・履歴・Vial出力を変更しない', () => {
    const { store, editor, history } = setup()
    const original = cloneLayout(store.layout)
    const vial = exportToVial(store.layout)
    editor.setActiveLayoutOption({ group: 0, choice: 1 })
    editor.toggleLayoutOptionVisibility({ group: 0, choice: 0 })
    editor.toggleLayoutOptionVisibility(null)
    expect(editor.visibleKeys.map(item => item.id)).not.toContain('backspace')
    expect(editor.visibleKeys.map(item => item.id)).not.toContain('common')
    expect(store.layout).toEqual(original)
    expect(exportToVial(store.layout)).toBe(vial)
    expect(history.snapshots).toHaveLength(1)
    expect(extractPersistedLayout(store.layout)).not.toHaveProperty('hiddenLayoutOptions')
  })

  it('非編集中・非表示のキーを選択できず、編集先変更や非表示化で選択が解除される', () => {
    const { editor } = setup()
    editor.selectMultipleKeys(['common', 'split'])
    expect(editor.selectedKeyIds).toEqual(['common'])
    editor.setActiveLayoutOption({ group: 0, choice: 1 })
    expect(editor.selectedKeyIds).toEqual([])
    editor.selectKey('split')
    editor.toggleLayoutOptionVisibility({ group: 0, choice: 1 })
    expect(editor.selectedKeyIds).toEqual([])
    editor.toggleKeySelection('split')
    expect(editor.selectedKeyIds).toEqual([])
    editor.setActiveLayoutOption({ group: 0, choice: 1 })
    expect(editor.editableKeys.map(item => item.id)).toEqual(['split'])
  })

  it('完成形は共通キーと各グループの選択肢一つを表示し、編集はできない', () => {
    const { editor } = setup()
    editor.toggleLayoutOptionVisibility(null)
    editor.setLayoutOptionPreview(true)
    expect(editor.visibleKeys.map(item => item.id)).toEqual(['common', 'backspace', 'space'])
    editor.setPreviewChoice(0, 1)
    editor.setPreviewChoice(1, 2)
    expect(editor.visibleKeys.map(item => item.id)).toEqual(['common', 'split', 'splitspace'])
    expect(editor.editableKeys).toEqual([])
    editor.selectKey('common')
    expect(editor.selectedKeyIds).toEqual([])
  })

  it('新規作成・読み込み・Undoで表示状態をリセットする', () => {
    const { store, editor, history } = setup()
    editor.setActiveLayoutOption({ group: 0, choice: 1 })
    editor.toggleLayoutOptionVisibility(null)
    editor.setLayoutOptionPreview(true)
    editor.setLayoutOptionPreviewMode('single')
    store.updateKey('common', { width: 2 })
    history.undo()
    expect(editor.activeLayoutOption).toBeNull()
    expect(editor.hiddenLayoutOptions).toEqual([])
    expect(editor.layoutOptionPreview).toBe(false)
    expect(editor.layoutOptionPreviewMode).toBe('compare')
    editor.setActiveLayoutOption({ group: 1, choice: 2 })
    store.createNewLayout()
    expect(editor.activeLayoutOption).toBeNull()
    expect(editor.layoutOptionGroups).toEqual([])
  })

  it('並べて表示と切り替え表示の変更は保存データや履歴を変更しない', () => {
    const { store, editor, history } = setup()
    const original = cloneLayout(store.layout)
    expect(editor.layoutOptionPreviewMode).toBe('compare')
    editor.setLayoutOptionPreview(true)
    editor.setPreviewChoice(0, 1)
    editor.setLayoutOptionPreviewMode('single')
    editor.setLayoutOptionPreviewMode('compare')
    expect(editor.previewChoices).toEqual({ 0: 1 })
    expect(store.layout).toEqual(original)
    expect(history.snapshots).toHaveLength(1)
  })

  it('Tab移動は編集中の所属先のキーに限定する', () => {
    const { store, editor } = setup()
    store.addKey(3, 1, { group: 0, choice: 1 })
    editor.setActiveLayoutOption({ group: 0, choice: 1 })
    editor.selectKey('split')
    expect(editor.selectNextKey()).toBe(true)
    expect(editor.selectedKey?.layoutOption).toEqual({ group: 0, choice: 1 })
    expect(editor.selectNextKey()).toBe(false)
  })

  it('定義のない所属や選択肢も一覧へ残す', () => {
    const { store, editor } = setup()
    store.addKeys([key('orphan', { group: 9, choice: 12 }), key('extra', { group: 0, choice: 7 })])
    expect(editor.layoutOptionGroups.find(item => item.index === 9)).toMatchObject({ defined: false, choices: [{ index: 12 }] })
    expect(editor.layoutOptionGroups[0].choices.map(item => item.index)).toEqual([0, 1, 7])
    editor.setActiveLayoutOption({ group: 9, choice: 12 })
    editor.selectKey('orphan')
    expect(editor.selectedKey?.id).toBe('orphan')
  })
})

describe('右ペインのタブ', () => {
  beforeEach(() => { setActivePinia(createPinia()) })

  it('初期表示はプロパティで、タブ変更は選択・コピー・所属先・データを変えない', () => {
    const { store, editor, history } = setup()
    expect(editor.sidebarTab).toBe('properties')
    editor.setActiveLayoutOption({ group: 0, choice: 1 })
    editor.selectKey('split')
    editor.copySelectedKeys()
    const original = cloneLayout(store.layout)
    editor.setSidebarTab('layoutOptions')
    editor.setSidebarTab('properties')
    expect(editor.activeLayoutOption).toEqual({ group: 0, choice: 1 })
    expect(editor.selectedKeyIds).toEqual(['split'])
    expect(editor.copiedKeys).toHaveLength(1)
    expect(store.layout).toEqual(original)
    expect(history.snapshots).toHaveLength(1)
  })

  it('タブだけを切り替えてもプレビューと基準の選択肢は変わらない', () => {
    const { editor } = setup()
    editor.setSidebarTab('layoutOptions')
    editor.setLayoutOptionPreview(true)
    editor.setPreviewChoice(0, 1)
    editor.setSidebarTab('properties')
    expect(editor.layoutOptionPreview).toBe(true)
    expect(editor.previewChoices).toEqual({ 0: 1 })
    editor.setSidebarTab('layoutOptions')
    expect(editor.layoutOptionPreview).toBe(true)
  })

  it('Undoではタブを保ち、新規作成・読み込みではプロパティへ戻す', () => {
    const { store, editor, history } = setup()
    const keyboard = useKeyboardStore()
    editor.setSidebarTab('layoutOptions')
    store.updateKey('common', { width: 2 })
    history.undo()
    expect(editor.sidebarTab).toBe('layoutOptions')
    keyboard.createNewLayout()
    expect(editor.sidebarTab).toBe('properties')
    editor.setSidebarTab('layoutOptions')
    keyboard.loadLayout(layout())
    expect(editor.sidebarTab).toBe('properties')
  })
})

describe('Layout Optionsのキー編集と定義削除', () => {
  beforeEach(() => { setActivePinia(createPinia()) })

  it('複数キーの所属変更を一回でUndoでき、座標・行列は変わらない', () => {
    const { store, history } = setup()
    const originals = cloneLayout(store.layout).keys
    store.assignKeysToLayoutOption(['common', 'space'], { group: 0, choice: 1 })
    expect(history.snapshots).toHaveLength(2)
    for (const id of ['common', 'space']) {
      const actual = store.getKeyById(id)!
      expect(actual.layoutOption).toEqual({ group: 0, choice: 1 })
      expect(actual.matrix).toEqual(originals.find(item => item.id === id)?.matrix)
      expect(actual.x).toBe(2)
    }
    history.undo()
    expect(store.layout.keys).toEqual(originals)
    history.redo()
    expect(store.getKeyById('space')?.layoutOption).toEqual({ group: 0, choice: 1 })
  })

  it('同じ座標・行列に複製し、元キーとは独立して編集・Undoできる', () => {
    const { store, history } = setup()
    const ids = store.duplicateKeysToLayoutOption(['common', 'space'], { group: 0, choice: 1 })
    expect(new Set(store.keys.map(item => item.id)).size).toBe(8)
    expect(history.snapshots).toHaveLength(2)
    const duplicate = store.getKeyById(ids[0])!
    expect(duplicate).toMatchObject({ x: 2, y: 1, matrix: { row: 0, col: 0 }, layoutOption: { group: 0, choice: 1 } })
    duplicate.matrix.col = 9
    duplicate.legend.center = 'changed'
    duplicate.keycodes![0] = 'KC_B'
    expect(store.getKeyById('common')).toMatchObject({ matrix: { col: 0 }, legend: { center: 'common' }, keycodes: { 0: 'KC_A' } })
    history.undo()
    expect(store.keys).toHaveLength(6)
  })

  it('グループ削除でキーを失わず、後続グループの番号を補正する', () => {
    const { store, history } = setup()
    store.removeLayoutOptionGroup(0)
    expect(store.layoutOptions).toEqual([['Space', '6.25u', '7u', 'Split']])
    expect(store.getKeyById('backspace')?.layoutOption).toBeUndefined()
    expect(store.getKeyById('split')?.layoutOption).toBeUndefined()
    expect(store.getKeyById('splitspace')?.layoutOption).toEqual({ group: 0, choice: 2 })
    expect(store.keys).toHaveLength(6)
    expect(history.snapshots).toHaveLength(2)
    history.undo()
    expect(store.layoutOptions).toEqual(layout().layoutOptions)
    expect(store.getKeyById('split')?.layoutOption).toEqual({ group: 0, choice: 1 })
  })

  it('選択肢削除でキーを共通へ戻し、後続の番号だけ補正する', () => {
    const { store, history } = setup()
    store.removeLayoutOptionChoice(1, 1)
    expect(store.layoutOptions[1]).toEqual(['Space', '6.25u', 'Split'])
    expect(store.getKeyById('space7')?.layoutOption).toBeUndefined()
    expect(store.getKeyById('splitspace')?.layoutOption).toEqual({ group: 1, choice: 1 })
    expect(store.getKeyById('split')?.layoutOption).toEqual({ group: 0, choice: 1 })
    expect(store.keys).toHaveLength(6)
    history.undo()
    expect(store.getKeyById('space7')?.layoutOption).toEqual({ group: 1, choice: 1 })
  })

  it('不正な削除や同じ所属への移動で履歴を増やさない', () => {
    const { store, history } = setup()
    store.removeLayoutOptionGroup(5)
    store.removeLayoutOptionChoice(0, 0)
    store.removeLayoutOptionChoice(1, 7)
    store.assignKeysToLayoutOption(['common'], null)
    expect(history.snapshots).toHaveLength(1)
  })

  it('空のグループ名でも削除できる', () => {
    const { store } = setup()
    store.setLayoutOptions([''])
    store.removeLayoutOptionGroup(0)
    expect(store.layoutOptions).toEqual([])
  })

  it('キーの追加・ペーストは編集中の所属先を引き継ぐ', () => {
    const { store, editor, history } = setup()
    const keyboard = useKeyboardStore()
    editor.selectKey('common')
    keyboard.copySelectedKeys()
    editor.setActiveLayoutOption({ group: 0, choice: 1 })
    keyboard.addKey()
    expect(editor.selectedKey?.layoutOption).toEqual({ group: 0, choice: 1 })
    expect(history.snapshots).toHaveLength(2)
    keyboard.pasteKeys()
    expect(editor.selectedKeys).toHaveLength(1)
    expect(editor.selectedKey?.layoutOption).toEqual({ group: 0, choice: 1 })
    const count = store.keys.length
    editor.setLayoutOptionPreview(true)
    keyboard.addKey()
    keyboard.pasteKeys()
    expect(store.keys).toHaveLength(count)
  })

  it('グループ一覧の生成は元の定義・割り当てを変更しない', () => {
    const original = layout()
    const copy = structuredClone(original)
    getLayoutOptionGroups(original.layoutOptions!, original.keys)
    expect(original).toEqual(copy)
  })

  it('初期レイアウトへの最初の定義追加もUndoできる', () => {
    useKeyboardStore()
    const store = useLayoutStore()
    const history = useHistoryStore()
    store.setLayoutOptions(['Backspace'])
    expect(history.canUndo).toBe(true)
    history.undo()
    expect(store.layoutOptions).toEqual([])
  })

  it('非表示の編集先へ追加したキーは表示され、そのまま選択される', () => {
    const { editor } = setup()
    const keyboard = useKeyboardStore()
    editor.setActiveLayoutOption({ group: 0, choice: 1 })
    editor.toggleLayoutOptionVisibility({ group: 0, choice: 1 })
    expect(editor.editableKeys).toEqual([])
    keyboard.addKey()
    expect(editor.selectedKey?.layoutOption).toEqual({ group: 0, choice: 1 })
    expect(editor.visibleKeys.some(key => key.id === editor.selectedKey?.id)).toBe(true)
  })

  it('固定側でコピーし、空の選択肢へ元の位置・サイズ・行列のまま貼り付けられる', () => {
    const { store, editor, history } = setup()
    const keyboard = useKeyboardStore()
    store.updateKey('common', { x: 6.25, y: 2.5, width: 2, rotation: 15 })
    store.addKeys([{ ...key('common2'), x: 8.5, y: 3, height: 1.5 }])
    editor.selectMultipleKeys(['common', 'common2'])
    const source = editor.selectedKeys.map(key => ({ ...key }))
    keyboard.copySelectedKeys()
    editor.setActiveLayoutOption({ group: 1, choice: 1 })
    expect(editor.selectedKeyIds).toEqual([])
    const historyLength = history.snapshots.length
    const ids = keyboard.pasteKeys()!
    expect(ids).toHaveLength(2)
    expect(history.snapshots).toHaveLength(historyLength + 1)
    ids.forEach((id, index) => {
      const pasted = store.getKeyById(id)!
      expect(pasted).toMatchObject({ ...source[index], id, layoutOption: { group: 1, choice: 1 } })
      expect(pasted.matrix).not.toBe(source[index].matrix)
      expect(pasted.legend).not.toBe(source[index].legend)
      expect(pasted.keycodes).not.toBe(source[index].keycodes)
      expect(store.getKeyById(source[index].id)?.layoutOption).toBeUndefined()
    })
    expect(editor.selectedKeyIds).toEqual(ids)
    history.undo()
    ids.forEach(id => expect(store.getKeyById(id)).toBeUndefined())
    source.forEach(key => expect(store.getKeyById(key.id)).toEqual(key))
    history.redo()
    ids.forEach(id => expect(store.getKeyById(id)?.layoutOption).toEqual({ group: 1, choice: 1 }))
  })

  it('別の所属先では既にキーを選択していても、コピー元の座標を使う', () => {
    const { store, editor } = setup()
    const keyboard = useKeyboardStore()
    store.updateKey('common', { x: 7.5, y: 2 })
    store.updateKey('split', { x: 20, y: 10 })
    editor.selectKey('common')
    keyboard.copySelectedKeys()
    editor.setActiveLayoutOption({ group: 0, choice: 1 })
    editor.selectKey('split')
    keyboard.pasteKeys()
    expect(editor.selectedKey).toMatchObject({ x: 7.5, y: 2, layoutOption: { group: 0, choice: 1 } })
  })

  it('同じ所属先での選択キー右隣へのペーストは維持する', () => {
    const { store, editor } = setup()
    const keyboard = useKeyboardStore()
    store.updateKey('common', { x: 5, y: 2, width: 2 })
    editor.selectKey('common')
    keyboard.copySelectedKeys()
    keyboard.pasteKeys()
    expect(editor.selectedKey).toMatchObject({ x: 7, y: 2, width: 2 })
    keyboard.pasteKeys()
    expect(editor.selectedKey).toMatchObject({ x: 9, y: 2, width: 2 })
  })

  it('同じ所属先でも選択がなければ元の位置に貼り付ける', () => {
    const { store, editor } = setup()
    const keyboard = useKeyboardStore()
    store.updateKey('common', { x: 5, y: 2 })
    editor.selectKey('common')
    keyboard.copySelectedKeys()
    editor.clearSelection()
    keyboard.pasteKeys()
    expect(editor.selectedKey).toMatchObject({ x: 5, y: 2 })
  })

  it('選択肢から固定側へも元の位置で貼り付けられる', () => {
    const { store, editor } = setup()
    const keyboard = useKeyboardStore()
    store.updateKey('split', { x: 8, y: 3 })
    editor.setActiveLayoutOption({ group: 0, choice: 1 })
    editor.selectKey('split')
    keyboard.copySelectedKeys()
    expect(editor.copiedKeys[0].layoutOption).not.toBe(store.getKeyById('split')?.layoutOption)
    editor.setActiveLayoutOption(null)
    keyboard.pasteKeys()
    expect(editor.selectedKey).toMatchObject({ x: 8, y: 3 })
    expect(editor.selectedKey?.layoutOption).toBeUndefined()
    expect(store.getKeyById('split')?.layoutOption).toEqual({ group: 0, choice: 1 })
  })

  it('コピーが空なら履歴・表示状態・キーを変えない', () => {
    const { store, editor, history } = setup()
    const keyboard = useKeyboardStore()
    editor.toggleLayoutOptionVisibility(null)
    const original = cloneLayout(store.layout)
    expect(keyboard.pasteKeys()).toBeUndefined()
    expect(store.layout).toEqual(original)
    expect(editor.hiddenLayoutOptions).toEqual(['common'])
    expect(history.snapshots).toHaveLength(1)
  })
})
