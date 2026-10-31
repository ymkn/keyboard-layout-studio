import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { Gist } from '../src/types/github'
import type { KeyboardLayout } from '../src/types/keyboard'
import { GitHubService } from '../src/services/github'
import { saveLayoutToGist } from '../src/services/layout-save'

function layout(name = 'Original'): KeyboardLayout {
  return {
    name, layerCount: 1,
    layoutOptions: ['Split Backspace'],
    keys: [{ id: '1', x: 4, y: 2, width: 2, height: 1, legend: {}, matrix: { row: 0, col: 1 }, layoutOption: { group: 0, choice: 0 } }],
    metadata: { description: 'Layout description' }
  }
}

function gist(id: string, filename: string, content: string): Gist {
  return {
    id, url: `https://api.github.com/gists/${id}`, html_url: `https://gist.github.com/${id}`,
    description: 'Layout description', public: false,
    created_at: '2026-01-01T00:00:00.000Z', updated_at: '2026-01-01T00:00:00.000Z',
    files: { [filename]: { filename, type: 'application/json', language: 'JSON', raw_url: '', size: content.length, content } }
  }
}

describe('レイアウトのGist保存名', () => {
  const fetchMock = vi.fn<typeof fetch>()
  const service = new GitHubService('test-only-token')

  beforeEach(() => {
    fetchMock.mockReset()
    fetchMock.mockImplementation(async (url, options) => {
      const body = JSON.parse(options?.body as string) as { files: Record<string, { content: string }> }
      const [filename, file] = Object.entries(body.files)[0]
      const id = options?.method === 'PATCH' ? String(url).split('/').at(-1)! : 'new-gist'
      return Response.json(gist(id, filename, file.content))
    })
    vi.stubGlobal('fetch', fetchMock)
  })

  afterEach(() => { vi.unstubAllGlobals() })

  it('初回はタイトルからファイル名を作り、secret Gistへ保存する', async () => {
    const data = layout()
    expect(await saveLayoutToGist(service, data)).toEqual({ gistId: 'new-gist', fileKey: 'Original.kls.json' })
    const [url, options] = fetchMock.mock.calls[0]
    expect(url).toBe('https://api.github.com/gists')
    expect(options?.method).toBe('POST')
    const body = JSON.parse(options?.body as string) as { public: boolean; description: string; files: Record<string, { content: string }> }
    expect(body.public).toBe(false)
    expect(body.description).toBe('Layout description')
    expect(JSON.parse(body.files['Original.kls.json'].content)).toEqual(data)
  })

  it('同じタイトルでの保存は同じGist・ファイルを更新する', async () => {
    const target = { gistId: 'original-gist', fileKey: 'Original.kls.json' }
    expect(await saveLayoutToGist(service, layout(), target)).toEqual(target)
    const [url, options] = fetchMock.mock.calls[0]
    expect(url).toBe('https://api.github.com/gists/original-gist')
    expect(options?.method).toBe('PATCH')
    const body = JSON.parse(options?.body as string) as { files: Record<string, unknown> }
    expect(Object.keys(body.files)).toEqual(['Original.kls.json'])
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('タイトル変更時は元のGistに手を付けず、新しい名前のGistへ保存する', async () => {
    const target = { gistId: 'original-gist', fileKey: 'Original.kls.json' }
    const data = layout('Renamed')
    const original = structuredClone(data)
    expect(await saveLayoutToGist(service, data, target)).toEqual({ gistId: 'new-gist', fileKey: 'Renamed.kls.json' })
    const [url, options] = fetchMock.mock.calls[0]
    expect(url).toBe('https://api.github.com/gists')
    expect(options?.method).toBe('POST')
    expect(Object.keys(JSON.parse(options?.body as string).files)).toEqual(['Renamed.kls.json'])
    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(target).toEqual({ gistId: 'original-gist', fileKey: 'Original.kls.json' })
    expect(data).toEqual(original)
  })

  it('別名保存後の次の保存は、新しい保存先を更新する', async () => {
    const saved = await saveLayoutToGist(service, layout('Renamed'), { gistId: 'original-gist', fileKey: 'Original.kls.json' })
    expect(await saveLayoutToGist(service, layout('Renamed'), saved)).toEqual(saved)
    const [url, options] = fetchMock.mock.calls[1]
    expect(url).toBe('https://api.github.com/gists/new-gist')
    expect(options?.method).toBe('PATCH')
    expect(Object.keys(JSON.parse(options?.body as string).files)).toEqual(['Renamed.kls.json'])
  })

  it('空タイトルではローカルと同じuntitledを使用する', async () => {
    const saved = await saveLayoutToGist(service, layout(''))
    expect(saved.fileKey).toBe('untitled.kls.json')
  })

  it('ファイル名不明の保存元は、元データを保護して新規保存する', async () => {
    await saveLayoutToGist(service, layout(), { gistId: 'original-gist', fileKey: null })
    expect(fetchMock.mock.calls[0][1]?.method).toBe('POST')
  })

  it('保存失敗時はエラーを返し、入力された保存元を変更しない', async () => {
    const target = { gistId: 'original-gist', fileKey: 'Original.kls.json' }
    fetchMock.mockResolvedValue(Response.json({ message: 'Save failed' }, { status: 500 }))
    await expect(saveLayoutToGist(service, layout('Renamed'), target)).rejects.toThrow('Save failed')
    expect(target).toEqual({ gistId: 'original-gist', fileKey: 'Original.kls.json' })
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })
})
