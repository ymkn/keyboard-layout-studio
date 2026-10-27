/**
 * キーのマウスダウン選択に関する純粋ロジック
 *
 * 選択はマウスダウンで即時に行い（暫定選択）、一定距離以上ドラッグした
 * 場合は矩形選択の結果で置き換える。クリックとして確定した場合のみ
 * Shiftトグルと複数選択の単独化を行う。
 */

/**
 * キーのマウスダウンで開始する選択セッション
 */
export interface KeyPressSession {
  /** 押されたキーのID */
  keyId: string
  /** マウスダウン時にShiftが押されていたか */
  shiftKey: boolean
  /** マウスダウン直前の選択状態 */
  baseSelectedIds: string[]
  /** マウスダウン時に即時適用する選択（nullの場合は変更しない） */
  immediateSelectedIds: string[] | null
}

/**
 * マウスアップ時に行う選択の確定処理
 */
export type KeyPressResolution =
  | { type: 'marquee'; selectedIds: string[] }
  | { type: 'toggle'; keyId: string }
  | { type: 'collapse'; keyId: string }
  | { type: 'keep' }

/**
 * キーのマウスダウン時にセッションを開始し、即時適用すべき選択を返す
 *
 * - Shift押下時: トグルはクリック確定まで行わないため即時変更なし
 * - 複数選択に含まれるキー: グループ選択を維持するため即時変更なし
 * - それ以外: そのキーを即時に単独選択する
 */
export function beginKeyPress(
  selectedIds: string[],
  keyId: string,
  shiftKey: boolean
): KeyPressSession {
  const baseSelectedIds = [...selectedIds]

  let immediateSelectedIds: string[] | null = null
  if (!shiftKey && !(baseSelectedIds.includes(keyId) && baseSelectedIds.length > 1)) {
    immediateSelectedIds = [keyId]
  }

  return { keyId, shiftKey, baseSelectedIds, immediateSelectedIds }
}

/**
 * マウスアップ時に選択をどう確定するかを決める
 *
 * @param session beginKeyPressで開始したセッション
 * @param dragged ドラッグとして成立した（閾値を超えた）かどうか
 * @param marqueeSelectedIds 矩形選択で得られたキーID（ドラッグ時のみ有効）
 */
export function resolveKeyPress(
  session: KeyPressSession,
  dragged: boolean,
  marqueeSelectedIds: string[]
): KeyPressResolution {
  if (dragged) {
    // ドラッグ時は矩形選択の結果で置き換える（Shift時はドラッグ前の選択へ加算）
    const selectedIds = session.shiftKey
      ? Array.from(new Set([...session.baseSelectedIds, ...marqueeSelectedIds]))
      : [...marqueeSelectedIds]
    return { type: 'marquee', selectedIds }
  }

  // クリックとして確定した場合
  if (session.shiftKey) {
    return { type: 'toggle', keyId: session.keyId }
  }
  if (session.baseSelectedIds.includes(session.keyId) && session.baseSelectedIds.length > 1) {
    return { type: 'collapse', keyId: session.keyId }
  }
  return { type: 'keep' }
}
