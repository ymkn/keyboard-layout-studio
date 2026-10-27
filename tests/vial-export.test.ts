import { describe, expect, it } from 'vitest'
import type { Key, KeyboardLayout } from '../src/types/keyboard'
import { exportToQMK, exportToVial } from '../src/utils/export'
import { rotateKeyAroundPoint } from '../src/utils/rotation'

interface ExportedVial {
  matrix: { rows: number; cols: number }
  layouts: { keymap: (Record<string, number> | string)[][] }
}

interface DecodedKey {
  label: string
  x: number
  y: number
  width: number
  height: number
  rotation: number
  rx: number
  ry: number
  x2: number
  width2: number
  height2: number
}

function makeKey(id: string, overrides: Partial<Key> = {}): Key {
  return {
    id, x: 0, y: 0, width: 1, height: 1, legend: {},
    matrix: { row: 0, col: Number(id) }, ...overrides
  }
}

function makeLayout(keys: Key[]): KeyboardLayout {
  return { name: 'Vial Export Test', layerCount: 1, keys }
}

function exportLayout(layout: KeyboardLayout): ExportedVial {
  return JSON.parse(exportToVial(layout)) as ExportedVial
}

/** KLEの状態継承・座標リセット規則で出力を読み戻す（アプリのKLEインポーターとは独立）。 */
function decodeLayout(data: ExportedVial): DecodedKey[] {
  const keys: DecodedKey[] = []
  let x = 0, y = 0, width = 1, height = 1, rotation = 0, rx = 0, ry = 0
  let x2 = 0, width2 = 0, height2 = 0

  for (const row of data.layouts.keymap) {
    row.forEach((item, index) => {
      if (typeof item === 'string') {
        keys.push({ label: item, x, y, width, height, rotation, rx, ry, x2,
          width2: width2 || width, height2: height2 || height })
        x += width
        width = height = 1
        x2 = width2 = height2 = 0
        return
      }

      if ('r' in item || 'rx' in item || 'ry' in item) expect(index).toBe(0)
      if ('r' in item) rotation = item.r
      if ('rx' in item) {
        rx = item.rx
        x = rx
        y = ry
      }
      if ('ry' in item) {
        ry = item.ry
        x = rx
        y = ry
      }
      x += item.x ?? 0
      y += item.y ?? 0
      if ('w' in item) width = width2 = item.w
      if ('h' in item) height = height2 = item.h
      if ('x2' in item) x2 = item.x2
      if ('w2' in item) width2 = item.w2
      if ('h2' in item) height2 = item.h2
    })
    y++
    x = rx
  }
  return keys
}

function corners(x: number, y: number, width: number, height: number, angle: number, rx: number, ry: number) {
  const radians = angle * Math.PI / 180
  return [[x, y], [x + width, y], [x + width, y + height], [x, y + height]].map(([px, py]) => ({
    x: rx + (px - rx) * Math.cos(radians) - (py - ry) * Math.sin(radians),
    y: ry + (px - rx) * Math.sin(radians) + (py - ry) * Math.cos(radians)
  }))
}

function expectSameGeometry(actual: DecodedKey, expected: Key) {
  expect(actual.x).toBeCloseTo(expected.x, 10)
  expect(actual.y).toBeCloseTo(expected.y, 10)
  expect(actual.width).toBe(expected.width)
  expect(actual.height).toBe(expected.height)
  expect(actual.rotation).toBe(expected.rotation || 0)
  const actualCorners = corners(actual.x, actual.y, actual.width, actual.height, actual.rotation, actual.rx, actual.ry)
  const expectedCorners = corners(expected.x, expected.y, expected.width, expected.height, expected.rotation || 0,
    expected.x + expected.width / 2, expected.y + expected.height / 2)
  actualCorners.forEach((point, index) => {
    expect(point.x).toBeCloseTo(expectedCorners[index].x, 10)
    expect(point.y).toBeCloseTo(expectedCorners[index].y, 10)
  })
}

describe('Vialエクスポートの座標・回転', () => {
  it('先頭行のオフセット、小数座標、行間、縦長・横長キーを保持する', () => {
    const keys = [
      makeKey('0', { x: 3.125, y: 2.75, height: 2 }),
      makeKey('1', { x: 0.25, y: 6.5, width: 2.25 }),
      makeKey('2', { x: 9.5, y: 6.5 })
    ]
    const decoded = decodeLayout(exportLayout(makeLayout(keys)))
    keys.forEach((key, index) => expectSameGeometry(decoded[index], key))
  })

  it.each([-180, -45, -3, 3, 30, 90, 180])('キー中心での%s度回転をそのまま再現する', rotation => {
    const key = makeKey('0', { x: 7.125, y: 3.75, width: 2.25, height: 1.5, rotation })
    expectSameGeometry(decodeLayout(exportLayout(makeLayout([key])))[0], key)
  })

  it('回転角度が混在していても後続の未回転キーへ角度が引き継がれない', () => {
    const keys = [makeKey('0', { rotation: 30 }), makeKey('1', { x: 2, rotation: -45 }), makeKey('2', { y: 3 })]
    const decoded = decodeLayout(exportLayout(makeLayout(keys)))
    keys.forEach((key, index) => expectSameGeometry(decoded[index], key))
  })

  it('同じ行で重なるキーと同じ中心を持つキーも移動させない', () => {
    const keys = [
      makeKey('0', { x: 3, y: 2, width: 2 }),
      makeKey('1', { x: 3.25, y: 2, width: 1.5, rotation: 15 }),
      makeKey('2', { x: 3.25, y: 2, width: 1.5 })
    ]
    const decoded = decodeLayout(exportLayout(makeLayout(keys)))
    keys.forEach((key, index) => expectSameGeometry(decoded[index], key))
  })

  it.each([-3, 3, 45])('共通中心で%s度回転した結果を二重回転せず出力する', angle => {
    const original = [makeKey('0', { x: 6, y: 5 }), makeKey('1', { x: 8, y: 5, width: 2, rotation: 15 })]
    const keys = original.map(key => rotateKeyAroundPoint(key, { x: 5, y: 5 }, angle)!)
    const layout = { ...makeLayout(keys), rotationCenter: { x: 5, y: 5 } }
    const decoded = decodeLayout(exportLayout(layout))
    for (const key of keys) {
      expectSameGeometry(decoded.find(item => item.label === `0,${key.id}`)!, key)
    }
    layout.rotationCenter = { x: 15, y: 10 }
    expect(decodeLayout(exportLayout(layout))).toEqual(decoded)
  })

  it('原点と上限付近の座標も保持する', () => {
    const keys = [makeKey('0', { rotation: -3 }), makeKey('1', { x: 50, y: 20, width: 2, rotation: 90 })]
    const decoded = decodeLayout(exportLayout(makeLayout(keys)))
    keys.forEach((key, index) => expectSameGeometry(decoded[index], key))
  })

  it.each([0, 30, -45])('ISO Enterの形状と配置を保持する（%s度）', rotation => {
    const key = makeKey('0', { x: 7, y: 3.5, width: 1.5, height: 2, shape: 'iso-enter', rotation })
    const [decoded, following] = decodeLayout(exportLayout(makeLayout([key, makeKey('1', { x: 10, y: 5 })])))
    // 回転なしの場合は行形式（r/rx/ryなし）になるため、回転中心はデコーダ初期値のまま
    const expectedCenter = rotation === 0 ? { rx: 0, ry: 0 } : { rx: 7.75, ry: 4.5 }
    expect(decoded).toMatchObject({ x: 7.75, y: 3.5, width: 1.25, height: 2,
      x2: -0.25, width2: 1.5, height2: 1, rotation, ...expectedCenter })
    expect(decoded.x + decoded.x2).toBe(key.x + 0.5)
    expectSameGeometry(following, makeKey('1', { x: 10, y: 5 }))
  })

  it('マトリクス未設定・一部設定のキーを除外し、割り当てを維持する', () => {
    const data = exportLayout(makeLayout([
      makeKey('0', { matrix: {} }), makeKey('1', { matrix: { row: 1 } }),
      makeKey('2', { matrix: { col: 1 } }), makeKey('3', { matrix: { row: 2, col: 4 }, rotation: 30 })
    ]))
    expect(decodeLayout(data).map(key => key.label)).toEqual(['2,4'])
    expect(data.matrix).toEqual({ rows: 3, cols: 5 })
  })

  it('空のレイアウトでも有効な空配列を出力する', () => {
    expect(exportLayout(makeLayout([]))).toMatchObject({ matrix: { rows: 1, cols: 1 }, layouts: { keymap: [] } })
  })

  it('エクスポートで元のキー・順序・編集用回転中心を変更しない', () => {
    const layout = { ...makeLayout([makeKey('0', { x: 8, y: 3 }), makeKey('1', { rotation: 30 })]), rotationCenter: { x: 3, y: 2 } }
    const original = structuredClone(layout)
    expect(decodeLayout(exportLayout(layout)).map(key => key.label)).toEqual(['0,1', '0,0'])
    expect(layout).toEqual(original)
  })

  it('QMKにも一括回転後の座標をそのまま出力する', () => {
    const key = rotateKeyAroundPoint(makeKey('0', { x: 6, y: 5 }), { x: 5, y: 5 }, 3)!
    const data = JSON.parse(exportToQMK(makeLayout([key]))) as {
      layouts: { LAYOUT: { layout: { x: number; y: number; matrix: number[] }[] } }
    }
    expect(data.layouts.LAYOUT.layout[0]).toMatchObject({ x: key.x, y: key.y, matrix: [0, 0] })
  })
})

describe('Vialエクスポートの行形式（Issue #7）', () => {
  function rawKeymap(keys: Key[]) {
    return exportLayout(makeLayout(keys)).layouts.keymap
  }

  it('回転なしでは r/rx/ry を一切出力しない', () => {
    const keymap = rawKeymap([
      makeKey('0', { x: 3.125, y: 2.75, height: 2 }),
      makeKey('1', { x: 0.25, y: 6.5, width: 2.25 }),
      makeKey('2', { x: 9.5, y: 6.5 })
    ])
    for (const row of keymap) {
      for (const item of row) {
        if (typeof item !== 'string') {
          expect(item).not.toHaveProperty('r')
          expect(item).not.toHaveProperty('rx')
          expect(item).not.toHaveProperty('ry')
        }
      }
    }
  })

  it('連続した標準キーはメタデータなしで物理行にまとめる', () => {
    const keymap = rawKeymap([
      makeKey('0'), makeKey('1', { x: 1 }), makeKey('2', { x: 2 }),
      makeKey('3', { y: 1 }), makeKey('4', { x: 1, y: 1 })
    ])
    expect(keymap).toEqual([
      ['0,0', '0,1', '0,2'],
      ['0,3', '0,4']
    ])
  })

  it('間隔は x、行間は行頭の y、非標準サイズは w/h だけを差分出力する', () => {
    const keymap = rawKeymap([
      makeKey('0', { x: 0.5, width: 2 }),
      makeKey('1', { x: 4, y: 3.5, height: 2 })
    ])
    expect(keymap).toEqual([
      [{ x: 0.5, w: 2 }, '0,0'],
      [{ x: 4, y: 2.5, h: 2 }, '0,1']
    ])
  })

  it('回転キーを含む場合は従来の全キー明示形式を維持する', () => {
    const keymap = rawKeymap([makeKey('0'), makeKey('1', { x: 2, rotation: 15 })])
    expect(keymap).toHaveLength(2)
    for (const row of keymap) {
      expect(row[0]).toMatchObject({ r: expect.any(Number), rx: expect.any(Number), ry: expect.any(Number) })
    }
  })
})
describe('ISO Enterの正規形（Issue #6）', () => {
  it.each([0, 30, -45])('KLSで右へ0.5uずらして描画するISO Enterの位置を保持する（%s度）', rotation => {
    const iso = makeKey('1', { x: 2.5, y: 1, width: 1.5, height: 2, shape: 'iso-enter', rotation })
    const before = makeKey('0', { x: 2, y: 1 })
    const after = makeKey('2', { x: 4.5, y: 1 })
    const decoded = decodeLayout(exportLayout(makeLayout([before, iso, after])))
    const actual = decoded.find(key => key.label === '0,1')!

    // KLSのSVGは上段がx+0.5u、下段がx+0.75uから始まる。
    expect(actual.x + actual.x2).toBe(3)
    expect(actual.x).toBe(3.25)
    expect(actual.x + actual.width).toBe(4.5)
    expectSameGeometry(decoded.find(key => key.label === '0,0')!, before)
    expectSameGeometry(decoded.find(key => key.label === '0,2')!, after)

    const centerX = iso.x + iso.width / 2
    const centerY = iso.y + iso.height / 2
    for (const rectangle of [
      { x: actual.x, width: actual.width, height: actual.height, expectedX: 3.25 },
      { x: actual.x + actual.x2, width: actual.width2, height: actual.height2, expectedX: 3 }
    ]) {
      const actualCorners = corners(rectangle.x, actual.y, rectangle.width, rectangle.height,
        actual.rotation, actual.rx, actual.ry)
      const expectedCorners = corners(rectangle.expectedX, iso.y, rectangle.width, rectangle.height,
        rotation, centerX, centerY)
      actualCorners.forEach((point, index) => {
        expect(point.x).toBeCloseTo(expectedCorners[index].x, 10)
        expect(point.y).toBeCloseTo(expectedCorners[index].y, 10)
      })
    }
  })

  it('回転なしのISO Enterは相対gapと正規の形状値で出力する', () => {
    const data = exportLayout(makeLayout([
      makeKey('0', { x: 13, y: 1 }),
      makeKey('1', { x: 14, y: 1, width: 1.5, height: 2, shape: 'iso-enter' }),
      makeKey('2', { x: 13, y: 2 })
    ]))
    const rows = data.layouts.keymap
    // 同じ物理行で通常キーの直後にあるISO Enterのメタデータを取り出す
    const isoRow = rows.find(row => row.includes('0,1'))!
    const isoMetadata = isoRow[isoRow.indexOf('0,1') - 1] as Record<string, number>
    expect(isoMetadata).toEqual({ x: 0.75, w: 1.25, h: 2, w2: 1.5, h2: 1, x2: -0.25 })
    expect(isoMetadata).not.toHaveProperty('r')
    expect(isoMetadata).not.toHaveProperty('rx')
    expect(isoMetadata).not.toHaveProperty('ry')

    const decoded = decodeLayout(data)
    const iso = decoded.find(key => key.label === '0,1')!
    expect(iso).toMatchObject({ x: 14.75, y: 1, width: 1.25, height: 2, x2: -0.25, width2: 1.5, height2: 1 })
    expect(iso.x + iso.x2).toBe(14.5)
  })
})
