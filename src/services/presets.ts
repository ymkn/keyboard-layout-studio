import type { KeyboardLayout } from '../types/keyboard'

export interface PresetInfo {
  id: string
  name: string
  description: string
  layout: KeyboardLayout
}

// ビルド時に src/presets/*.kls.json を自動スキャン
const presetModules = import.meta.glob<KeyboardLayout>('../presets/*.kls.json', {
  eager: true,
  import: 'default'
})

export function getPresets(): PresetInfo[] {
  return Object.entries(presetModules).map(([path, layout]) => {
    // パスからIDを抽出（例: '../presets/60-percent.kls.json' → '60-percent'）
    const filename = path.split('/').pop() || ''
    const id = filename.replace('.kls.json', '')

    return {
      id,
      name: layout.name || id,
      description: layout.metadata?.description || '',
      layout
    }
  })
}
