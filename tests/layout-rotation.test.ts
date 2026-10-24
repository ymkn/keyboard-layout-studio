import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Key, KeyboardLayout } from '../src/types/keyboard'
import { APP_CONFIG } from '../src/constants/app-config'
import { useLayoutStore, cloneLayout } from '../src/stores/layout'
import { useHistoryStore } from '../src/stores/history'
import { extractPersistedLayout } from '../src/types/persistence'
import { sanitizeRotationCenter } from '../src/utils/rotation'

function makeKey(id: string, overrides: Partial<Key> = {}): Key {
  return {
    id, x: 5, y: 4, width: 1, height: 1,
    legend: {}, matrix: {}, keycodes: {},
    ...overrides
  }
}

function makeLayout(keys: Key[]): KeyboardLayout {
  return {
    name: 'Rotation Test', keys, layerCount: 1,
    rotationCenter: { x: 4, y: 4 },
    metadata: { created: '2026-01-01T00:00:00.000Z', modified: '2026-01-01T00:00:00.000Z' }
  }
}

describe('共通の回転中心', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('旧形式では原点を使用し、新規レイアウトでも中心をリセットする', () => {
    const store = useLayoutStore()
    const layout = makeLayout([])
    delete layout.rotationCenter
    expect(store.loadLayout(layout)).toBe(false)
    expect(store.rotationCenter).toEqual({ x: 0, y: 0 })
    store.setRotationCenter({ x: 8, y: 6 })
    store.createNewLayout()
    expect(store.rotationCenter).toEqual({ x: 0, y: 0 })
  })

  it.each([
    [undefined, { x: 0, y: 0 }],
    [null, { x: 0, y: 0 }],
    ['invalid', { x: 0, y: 0 }],
    [{ x: '2', y: NaN }, { x: 0, y: 0 }],
    [{ x: Infinity, y: -Infinity }, { x: 0, y: 0 }],
    [{ x: -2, y: 100 }, { x: 0, y: APP_CONFIG.MAX_KEY_Y }],
    [{ x: 100, y: 2.125 }, { x: APP_CONFIG.MAX_KEY_X, y: 2.125 }]
  ])('不正な回転中心を補正する: %j', (value, expected) => {
    expect(sanitizeRotationCenter(value)).toEqual(expected)
  })

  it('読み込み時の補正を通知し、元データは変更しない', () => {
    const store = useLayoutStore()
    const layout = makeLayout([])
    layout.rotationCenter = { x: -1, y: Infinity }
    expect(store.loadLayout(layout)).toBe(true)
    expect(store.rotationCenter).toEqual({ x: 0, y: 0 })
    expect(layout.rotationCenter).toEqual({ x: -1, y: Infinity })
  })

  it('nullの回転中心も読み込み時に補正する', () => {
    const store = useLayoutStore()
    const layout = JSON.parse(JSON.stringify({ ...makeLayout([]), rotationCenter: null })) as KeyboardLayout
    expect(store.loadLayout(layout)).toBe(true)
    expect(store.rotationCenter).toEqual({ x: 0, y: 0 })
  })

  it('回転中心の更新を履歴に一度だけ通知する', () => {
    const store = useLayoutStore()
    store.setLayout(makeLayout([]))
    const onChange = vi.fn()
    store.setOnLayoutChange(onChange)
    store.setRotationCenter({ x: 8.125, y: 6.5 })
    expect(store.layout.rotationCenter).toEqual({ x: 8.125, y: 6.5 })
    expect(store.layout.metadata?.modified).not.toBe('2026-01-01T00:00:00.000Z')
    store.setRotationCenter({ x: 8.125, y: 6.5 })
    expect(onChange).toHaveBeenCalledTimes(1)
  })

  it('メタデータなしのレイアウトでも更新できる', () => {
    const store = useLayoutStore()
    const layout = makeLayout([])
    delete layout.metadata
    store.loadLayout(layout)
    store.setRotationCenter({ x: 3, y: 2 })
    expect(store.layout.metadata?.modified).toBeDefined()
  })

  it('履歴クローンと永続化データに回転中心を独立して保持する', () => {
    const layout = makeLayout([])
    const snapshot = cloneLayout(layout)
    const persisted = extractPersistedLayout(layout)
    layout.rotationCenter!.x = 9
    expect(snapshot.rotationCenter).toEqual({ x: 4, y: 4 })
    expect(persisted.rotationCenter).toEqual({ x: 4, y: 4 })

    const store = useLayoutStore()
    const restored = JSON.parse(JSON.stringify(persisted)) as KeyboardLayout
    expect(store.loadLayout(restored)).toBe(false)
    expect(store.rotationCenter).toEqual({ x: 4, y: 4 })
  })
})

describe('選択キーの一括回転移動', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('大きさや角度が違うキーを共通の中心で回し、未選択キーは変えない', () => {
    const store = useLayoutStore()
    const untouched = makeKey('c')
    store.setLayout(makeLayout([
      makeKey('a', { width: 2, rotation: 175 }),
      makeKey('b', { x: 7, y: 5, height: 2, rotation: -30 }),
      untouched
    ]))
    const onChange = vi.fn()
    store.setOnLayoutChange(onChange)

    expect(store.rotateKeysAroundCenter(['a', 'b'], 90)).toBe(true)
    const a = store.getKeyById('a')!
    const b = store.getKeyById('b')!
    expect(a.x).toBeCloseTo(2.5)
    expect(a.y).toBeCloseTo(5.5)
    expect(a.rotation).toBe(-95)
    expect(b.x).toBeCloseTo(1.5)
    expect(b.y).toBeCloseTo(6.5)
    expect(b.rotation).toBe(60)
    expect(store.getKeyById('c')).toEqual(untouched)
    expect(onChange).toHaveBeenCalledTimes(1)
  })

  it('キー中心間の距離と相対角度を保ち、逆回転で元の位置に戻る', () => {
    const store = useLayoutStore()
    const original = [makeKey('a', { width: 2, rotation: 20 }), makeKey('b', { x: 7, y: 5, rotation: -10 })]
    store.setLayout(makeLayout(original.map(key => ({ ...key }))))
    const distance = (a: Key, b: Key) => Math.hypot(
      a.x + a.width / 2 - b.x - b.width / 2,
      a.y + a.height / 2 - b.y - b.height / 2
    )
    expect(store.rotateKeysAroundCenter(['a', 'b'], 3)).toBe(true)
    const [a, b] = store.keys
    expect(distance(a, b)).toBeCloseTo(distance(original[0], original[1]), 10)
    expect(a.rotation! - b.rotation!).toBe(30)
    expect(a.x % APP_CONFIG.MOVE_STEP).not.toBeCloseTo(0)
    expect(store.rotateKeysAroundCenter(['a', 'b'], -3)).toBe(true)
    store.keys.forEach((key, index) => {
      expect(key.x).toBeCloseTo(original[index].x, 10)
      expect(key.y).toBeCloseTo(original[index].y, 10)
      expect(key.rotation).toBe(original[index].rotation)
    })
  })

  it('一周しても配置を保つ', () => {
    const store = useLayoutStore()
    store.setLayout({ ...makeLayout([makeKey('a', { x: 11, y: 10 })]), rotationCenter: { x: 10, y: 10 } })
    for (let step = 0; step < 120; step++) {
      expect(store.rotateKeysAroundCenter(['a'], 3)).toBe(true)
    }
    expect(store.keys[0].x).toBeCloseTo(11, 10)
    expect(store.keys[0].y).toBeCloseTo(10, 10)
    expect(store.keys[0].rotation).toBe(0)
  })

  it('回転中心にあるキーは位置を変えず向きだけ変える', () => {
    const store = useLayoutStore()
    store.setLayout(makeLayout([makeKey('a', { x: 3.5, y: 3.5 })]))
    expect(store.rotateKeysAroundCenter(['a'], -3)).toBe(true)
    expect(store.keys[0]).toMatchObject({ x: 3.5, y: 3.5, rotation: -3 })
  })

  it('いずれかのキーが負座標になる場合は全キーを変更せず履歴にも残さない', () => {
    const store = useLayoutStore()
    store.setLayout({ ...makeLayout([makeKey('a'), makeKey('b', { x: 0, y: 0 })]), rotationCenter: { x: 0, y: 0 } })
    const original = cloneLayout(store.layout)
    const onChange = vi.fn()
    store.setOnLayoutChange(onChange)
    expect(store.rotateKeysAroundCenter(['a', 'b'], 3)).toBe(false)
    expect(store.layout).toEqual(original)
    expect(onChange).not.toHaveBeenCalled()
  })

  it.each([
    { center: { x: 50, y: 10 }, key: makeKey('a', { x: 49, y: 8 }), angle: 90 },
    { center: { x: 10, y: 20 }, key: makeKey('a', { x: 11, y: 19 }), angle: 90 }
  ])('座標の上限を超える回転も中止する: %j', ({ center, key, angle }) => {
    const store = useLayoutStore()
    store.setLayout({ ...makeLayout([key]), rotationCenter: center })
    expect(store.rotateKeysAroundCenter(['a'], angle)).toBe(false)
    expect(store.keys[0]).toEqual(key)
  })

  it('境界上の浮動小数点誤差は許容する', () => {
    const store = useLayoutStore()
    store.setLayout({ ...makeLayout([makeKey('a', { x: 0, y: 0 })]), rotationCenter: { x: 0.5, y: 0.5 } })
    expect(store.rotateKeysAroundCenter(['a'], 90)).toBe(true)
    expect(store.keys[0]).toMatchObject({ x: 0, y: 0, rotation: 90 })
  })

  it.each([NaN, Infinity, -Infinity])('有限でない角度を拒否する: %s', angle => {
    const store = useLayoutStore()
    store.setLayout(makeLayout([makeKey('a')]))
    const original = cloneLayout(store.layout)
    expect(store.rotateKeysAroundCenter(['a'], angle)).toBe(false)
    expect(store.layout).toEqual(original)
  })

  it('未選択・未知ID・ゼロ回転では履歴を増やさず、重複IDは一度だけ回す', () => {
    const store = useLayoutStore()
    store.setLayout(makeLayout([makeKey('a')]))
    const onChange = vi.fn()
    store.setOnLayoutChange(onChange)
    expect(store.rotateKeysAroundCenter([], 3)).toBe(true)
    expect(store.rotateKeysAroundCenter(['unknown'], 3)).toBe(true)
    expect(store.rotateKeysAroundCenter(['a'], 360)).toBe(true)
    expect(onChange).not.toHaveBeenCalled()
    store.rotateKeysAroundCenter(['a', 'a', 'unknown'], 3)
    expect(store.keys[0].rotation).toBe(3)
    expect(onChange).toHaveBeenCalledTimes(1)
  })

  it('Undo/Redoで位置・向き・回転中心を復元できる', () => {
    const store = useLayoutStore()
    const history = useHistoryStore()
    store.setLayout(makeLayout([makeKey('a'), makeKey('b', { x: 7 })]))
    history.setupLayoutWatcher()
    history.initializeHistory()
    store.setRotationCenter({ x: 5, y: 5 })
    const beforeRotation = cloneLayout(store.layout)
    store.rotateKeysAroundCenter(['a', 'b'], 3)
    const afterRotation = cloneLayout(store.layout)
    expect(history.snapshots).toHaveLength(3)
    expect(history.undo()).toBe(true)
    expect(store.layout).toEqual(beforeRotation)
    expect(history.undo()).toBe(true)
    expect(store.rotationCenter).toEqual({ x: 4, y: 4 })
    expect(history.redo()).toBe(true)
    expect(store.rotationCenter).toEqual({ x: 5, y: 5 })
    expect(history.redo()).toBe(true)
    expect(store.layout).toEqual(afterRotation)
  })

  it('従来のRによる回転ではキー位置を変えない', () => {
    const store = useLayoutStore()
    store.setLayout(makeLayout([makeKey('a'), makeKey('b', { x: 7, rotation: 179 })]))
    store.rotateKeys(['a', 'b'], 3)
    expect(store.keys[0]).toMatchObject({ x: 5, y: 4, rotation: 3 })
    expect(store.keys[1]).toMatchObject({ x: 7, y: 4, rotation: -178 })
  })
})
