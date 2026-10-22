import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { STORAGE_KEYS } from '../src/constants/storage'
import { useAuthStore } from '../src/stores/auth'
import { MemoryStorage } from './helpers/storage'

vi.mock('../src/i18n', () => ({ i18n: { global: { t: (key: string) => key } } }))
vi.mock('../src/composables/useToast', () => ({ showToast: vi.fn() }))

const AUTH = { token: 'test-only-token', username: 'test-user', avatarUrl: 'https://avatars.example/user.png' }

describe('認証情報の保存', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.stubGlobal('sessionStorage', new MemoryStorage())
    vi.stubGlobal('localStorage', new MemoryStorage())
  })

  it('認証情報をlocalStorageではなくsessionStorageだけに保存する', () => {
    const store = useAuthStore()
    store.setGitHubAuth(AUTH)
    expect(JSON.parse(sessionStorage.getItem(STORAGE_KEYS.GITHUB_AUTH)!)).toEqual(AUTH)
    expect(localStorage.getItem(STORAGE_KEYS.GITHUB_AUTH)).toBeNull()
    expect(store.isLoggedIn).toBe(true)
  })

  it('タブ内での再読み込み時はセッションから復元する', () => {
    sessionStorage.setItem(STORAGE_KEYS.GITHUB_AUTH, JSON.stringify(AUTH))
    const store = useAuthStore()
    store.loadGitHubAuth()
    expect(store.githubAuth).toEqual(AUTH)
  })

  it('旧localStorageのトークンは復元も移行もせず削除する', () => {
    localStorage.setItem(STORAGE_KEYS.GITHUB_AUTH, JSON.stringify(AUTH))
    const store = useAuthStore()
    store.loadGitHubAuth()
    expect(localStorage.getItem(STORAGE_KEYS.GITHUB_AUTH)).toBeNull()
    expect(sessionStorage.getItem(STORAGE_KEYS.GITHUB_AUTH)).toBeNull()
    expect(store.isLoggedIn).toBe(false)
  })

  it.each(['{', 'null', '[]', '{}', '{"token":123,"username":"user"}'])('壊れた保存データを認証済みとして扱わない: %s', stored => {
    sessionStorage.setItem(STORAGE_KEYS.GITHUB_AUTH, stored)
    const store = useAuthStore()
    expect(() => store.loadGitHubAuth()).not.toThrow()
    expect(store.isLoggedIn).toBe(false)
  })

  it('ストレージへのアクセスが拒否されても復元で例外を投げない', () => {
    vi.spyOn(localStorage, 'removeItem').mockImplementation(() => { throw new Error('blocked') })
    const store = useAuthStore()
    expect(() => store.loadGitHubAuth()).not.toThrow()
    expect(store.isLoggedIn).toBe(false)
  })

  it('ログアウトはメモリと両ストレージの認証情報を削除する', () => {
    const store = useAuthStore()
    store.setGitHubAuth(AUTH)
    localStorage.setItem(STORAGE_KEYS.GITHUB_AUTH, JSON.stringify(AUTH))
    store.logoutGitHub()
    expect(store.isLoggedIn).toBe(false)
    expect(sessionStorage.getItem(STORAGE_KEYS.GITHUB_AUTH)).toBeNull()
    expect(localStorage.getItem(STORAGE_KEYS.GITHUB_AUTH)).toBeNull()
  })
})
