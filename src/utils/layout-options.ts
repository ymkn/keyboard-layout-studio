import type { Key, KeyLayoutOption, LayoutOptionDefinition } from '../types/keyboard'

export interface LayoutOptionChoiceView {
  index: number
  name?: string
}

export interface LayoutOptionGroupView {
  index: number
  name?: string
  defined: boolean
  toggle: boolean
  choices: LayoutOptionChoiceView[]
}

/** 共通キーも含めた、表示・編集対象の識別子を返す。 */
export function layoutOptionId(option?: KeyLayoutOption | null): string {
  return option ? `${option.group}:${option.choice}` : 'common'
}

/** 定義のない割り当ても一覧へ残し、読み込んだキーが編集不能になることを防ぐ。 */
export function getLayoutOptionGroups(definitions: LayoutOptionDefinition[], keys: Key[]): LayoutOptionGroupView[] {
  const groups = new Map<number, LayoutOptionGroupView>()
  definitions.forEach((definition, index) => {
    const toggle = typeof definition === 'string'
    groups.set(index, {
      index, name: toggle ? definition : definition[0], defined: true, toggle,
      choices: toggle
        ? [{ index: 0 }, { index: 1 }]
        : definition.slice(1).map((name, choice) => ({ index: choice, name }))
    })
  })
  for (const key of keys) {
    if (!key.layoutOption) continue
    const { group, choice } = key.layoutOption
    if (!groups.has(group)) {
      groups.set(group, { index: group, defined: false, toggle: false, choices: [] })
    }
    const view = groups.get(group)!
    if (!view.choices.some(item => item.index === choice)) view.choices.push({ index: choice })
  }
  return [...groups.values()].sort((a, b) => a.index - b.index).map(group => ({
    ...group, choices: group.choices.sort((a, b) => a.index - b.index)
  }))
}
