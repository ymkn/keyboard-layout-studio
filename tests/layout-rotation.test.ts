import { beforeEach, describe, expect, it } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useLayoutStore } from '../src/stores/layout'
import type { Key, KeyboardLayout } from '../src/types/keyboard'

function makeKey(id: string, rotation = 0): Key {
  return {
    id,
    x: 0,
    y: 0,
    width: 1,
    height: 1,
    legend: {},
    matrix: {},
    keycodes: {},
    shape: 'rectangle',
    rotation
  }
}

function makeLayout(keys: Key[]): KeyboardLayout {
  return {
    name: 'Rotation Test',
    keys,
    layerCount: 1,
    metadata: {
      created: '2026-01-01T00:00:00.000Z',
      modified: '2026-01-01T00:00:00.000Z'
    }
  }
}

describe('layout store rotation', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('rotates multiple keys by a delta angle', () => {
    const store = useLayoutStore()
    store.setLayout(makeLayout([makeKey('a'), makeKey('b', 10), makeKey('c')]))

    store.rotateKeys(['a', 'b'], 15)

    expect(store.getKeyById('a')?.rotation).toBe(15)
    expect(store.getKeyById('b')?.rotation).toBe(25)
    expect(store.getKeyById('c')?.rotation).toBe(0)
  })

  it('normalizes the delta rotation into the -180..180 range', () => {
    const store = useLayoutStore()
    store.setLayout(makeLayout([makeKey('a', 170), makeKey('b', -170)]))

    store.rotateKeys(['a', 'b'], 15)

    expect(store.getKeyById('a')?.rotation).toBe(-175)
    expect(store.getKeyById('b')?.rotation).toBe(-155)
  })

  it('sets an absolute rotation on multiple keys at once', () => {
    const store = useLayoutStore()
    store.setLayout(makeLayout([makeKey('a', 5), makeKey('b', -30), makeKey('c', 90)]))

    store.setKeysRotation(['a', 'b'], 45)

    expect(store.getKeyById('a')?.rotation).toBe(45)
    expect(store.getKeyById('b')?.rotation).toBe(45)
    expect(store.getKeyById('c')?.rotation).toBe(90)
  })

  it('normalizes an absolute rotation into the -180..180 range', () => {
    const store = useLayoutStore()
    store.setLayout(makeLayout([makeKey('a'), makeKey('b')]))

    store.setKeysRotation(['a', 'b'], 190)

    expect(store.getKeyById('a')?.rotation).toBe(-170)
    expect(store.getKeyById('b')?.rotation).toBe(-170)
  })

  it('ignores unknown key ids', () => {
    const store = useLayoutStore()
    store.setLayout(makeLayout([makeKey('a')]))

    expect(() => store.rotateKeys(['missing'], 15)).not.toThrow()
    expect(() => store.setKeysRotation(['missing'], 45)).not.toThrow()
    expect(store.getKeyById('a')?.rotation).toBe(0)
  })
})
