import { useI18n } from 'vue-i18n'
import type { KeyLayoutOption } from '../types/keyboard'
import type { LayoutOptionChoiceView, LayoutOptionGroupView } from '../utils/layout-options'
import { useEditorStore } from '../stores/editor'

/** 内部番号ではなく、所属先の名前をUIへ表示する。 */
export function useLayoutOptionNames() {
  const { t } = useI18n()
  const editorStore = useEditorStore()

  function groupName(group: LayoutOptionGroupView): string {
    return group.name || t('layoutOptions.unnamedGroup', { number: group.index + 1 })
  }

  function choiceName(group: LayoutOptionGroupView, choice: LayoutOptionChoiceView): string {
    if (group.toggle && choice.index < 2) return t(choice.index === 0 ? 'layoutOptions.off' : 'layoutOptions.on')
    return choice.name || t('layoutOptions.unnamedChoice', { number: choice.index + 1 })
  }

  function targetName(option: KeyLayoutOption | null): string {
    if (!option) return t('layoutOptions.common')
    const group = editorStore.layoutOptionGroups.find(item => item.index === option.group)
    const choice = group?.choices.find(item => item.index === option.choice)
    return group && choice ? `${groupName(group)} / ${choiceName(group, choice)}` : t('layoutOptions.undefined')
  }

  return { groupName, choiceName, targetName }
}
