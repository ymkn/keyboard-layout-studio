import type { KeyboardLayout } from '../types/keyboard'
import type { GitHubService } from './github'

export interface LayoutGistTarget {
  gistId: string
  fileKey: string | null
}

export interface SavedLayoutGist {
  gistId: string
  fileKey: string
}

/** 同名は現在のファイルを更新し、別名は元を残して独立したGistへ保存する。 */
export async function saveLayoutToGist(
  service: GitHubService, layout: KeyboardLayout, target?: LayoutGistTarget
): Promise<SavedLayoutGist> {
  const filename = `${layout.name || 'untitled'}.kls.json`
  const content = JSON.stringify(layout, null, 2)
  const description = layout.metadata?.description || ''
  const gist = target?.fileKey === filename
    ? await service.updateGist(target.gistId, filename, content, description)
    : await service.createGist(filename, content, description, false)
  return { gistId: gist.id, fileKey: filename }
}
