/**
 * 日本語翻訳メッセージ
 */
export default {
  common: {
    save: '保存',
    cancel: 'キャンセル',
    delete: '削除',
    close: '閉じる',
    open: '開く',
    newLayout: '新規作成',
    loading: '読み込み中...',
    unsaved: '* 未保存',
    apply: '適用',
    reset: 'リセット',
    format: '整形',
    clear: 'クリア',
    copy: 'コピー',
    paste: 'ペースト',
    undo: '元に戻す',
    redo: 'やり直す',
    addKey: 'キーを追加',
    default: 'デフォルト',
  },

  header: {
    layoutType: 'レイアウト:',
    loginWithGitHub: 'GitHubでログイン',
    saveToLocal: 'ローカルに保存',
    saveToGist: 'Gistに保存',
    pleaseLoginGitHub: 'GitHubにログインしてください',
  },

  tabs: {
    layout: 'レイアウト',
    json: 'JSON',
  },

  sidebar: {
    title: '編集パネル',
    previewActive: 'プレビュー中',
    returnToEditing: '編集に戻る',
  },
  layoutOptions: {
    title: 'レイアウトオプション',
    common: 'レイアウト固定のキー',
    editMode: '重ねて編集',
    previewMode: '完成形プレビュー',
    visibility: '{name}の表示切り替え',
    editing: '編集中',
    addTarget: 'キーの追加先：{name}',
    newGroup: 'オプションを追加',
    groupExample: '例：Split Backspace、Space',
    controlType: 'Vialでの選択方法',
    checkbox: 'チェックボックス',
    dropdown: 'ドロップダウン',
    add: '追加',
    off: 'オフ',
    on: 'オン',
    settings: 'オプションの設定',
    groupName: 'オプション名',
    choiceName: '選択肢{number}の名前',
    addChoice: '選択肢を追加',
    newChoice: '選択肢{number}',
    removeChoice: '「{name}」を削除',
    convertToDropdown: '名前付きの選択肢に変更',
    removeGroup: 'オプションを削除',
    removeHint: '所属するキーは削除せず、レイアウト固定へ移します',
    unnamedGroup: 'オプション{number}（名前未設定）',
    unnamedChoice: '選択肢{number}（名前未設定）',
    undefined: '未定義の所属先',
    membership: '選択キーの所属先',
    moveSelection: 'この所属先へ移動',
    copySelection: '同じ位置に複製',
    assignmentHint: '移動は所属だけを変更します。複製は元のキーを残し、座標・サイズ・行列割り当てを引き継ぎます。',
    singlePreview: '切り替え表示',
    comparePreview: '並べて表示',
    previewDisplay: 'プレビューの表示方法',
    singlePreviewShort: '切り替え',
    comparePreviewShort: '並べて',
    referenceLayout: '基準配置',
    useAsReference: '「{name}」を基準配置にする',
    noKeys: 'キーなし',
    region: '範囲{number}',
  },
  canvas: {
    screenshotMode: '撮影モード',
    legend: 'レジェンド',
    matrixKeycode: '行列・キーコード',
    layer: 'レイヤー:',
    addLayer: 'レイヤーを追加',
    deleteLayer: 'レイヤーを削除',
    rotationOutOfBounds: '回転後のキー位置が座標の範囲外になるため、回転を中止しました。キーの位置や回転中心を調整してください。',
  },

  propertyPanel: {
    properties: 'プロパティ',
    layoutInfo: 'レイアウト全体の情報',
    selectKeyToEdit: 'キーを選択してプロパティを編集します',
    keysSelected: '{count} 個のキーが選択されています',
    multiSelectInfo: '複数選択時はプロパティの編集はできません。',
    multiSelectHint: 'カーソルキー: 移動\nShift+カーソルキー: サイズ変更\nR / Shift+R: 各キーの中心で回転\nPgUp / PgDn: 共通の回転中心で回転（-3° / +3°）\n回転中心は選択解除後、レイアウト全体のプロパティで設定します。',

    // メタデータ
    title: 'タイトル',
    titlePlaceholder: '例: My Custom Keyboard Layout',
    author: '作者名',
    authorPlaceholder: '例: John Doe',
    description: '説明',
    descriptionPlaceholder: '例: 60%キーボード用のカスタムレイアウト',
    rotationCenter: '回転中心（u）',
    rotationCenterHint: '左上の原点からの座標です（初期値: X=0、Y=0）。\nキー選択後、PgUp: 反時計回り3° / PgDn: 時計回り3°。\nキーの位置と向きをまとめて回転します。',
    rotationCenterInvalid: '回転中心の{axis}座標は0〜{max}の有限の数値で指定してください。',
    layoutOptions: 'レイアウトオプション（Vial）',
    layoutOptionsHint: 'VialのLayout Options定義（layouts.labels）です。グループごとに選択肢名をカンマ区切りで指定します。選択肢名を空にすると選択肢名なしのグループになります。',
    layoutOptionGroupName: 'グループ名',
    layoutOptionChoices: '選択肢名（カンマ区切り）',
    layoutOptionAddGroup: 'グループを追加',
    layoutOptionRemoveGroup: '削除',
    layoutOption: 'レイアウトオプション（Vial）',
    layoutOptionGroup: 'グループ',
    layoutOptionChoice: '選択肢',
    layoutOptionHint: '未割り当てのキーは常時表示されます。番号は0始まりです。',
    layoutOptionClear: '割り当てを解除',
    legendFont: 'レジェンドフォント',
    fontPreview: 'プレビュー: あいうえお ABCDE 12345',

    // フォントグループ
    fontGroupGothic: 'ゴシック系',
    fontGroupRounded: '丸ゴシック系',
    fontGroupMincho: '明朝系',

    // 追加情報
    additionalInfo: '追加情報',
    createdAt: '作成日時:',
    modifiedAt: '最終更新:',
    keyCount: 'キー数:',
    keys: 'keys',
    sizeBreakdown: '幅別内訳:',
    notSet: '未設定',
    invalidDate: '無効な日付',

    // キープロパティ
    shape: '形状',
    shapeRectangle: '長方形',
    shapeIsoEnter: 'ISO Enter',
    shapeBigAssEnter: 'Big Ass Enter',
    shapeCircle: '円形',
    fixedSizeShape: 'この形状は固定サイズです',

    position: '位置',
    size: 'サイズ',
    width: '幅',
    height: '高さ',

    rotation: '回転',
    degrees: '度',
    rotationHint: 'R: +3° / Shift+R: -3°（キー自身の中心）\nPgUp: -3° / PgDn: +3°（共通の回転中心）',

    legends: 'レジェンド',
    legendTopLeft: '左上',
    legendTopCenter: '中上',
    legendTopRight: '右上',
    legendCenterLeft: '左中',
    legendCenter: '中央',
    legendCenterRight: '右中',
    legendBottomLeft: '左下',
    legendBottomCenter: '中下',
    legendBottomRight: '右下',

    keyMatrix: 'キーマトリクス',

    keycode: 'キーコード',
    keycodePlaceholder: 'KC_A, MO(1), etc...',
    selectKeycode: 'キーコードを選択',
  },

  dialogs: {
    // 新規作成
    newLayout: {
      title: '新規作成',
      message: '現在のレイアウトを破棄して、新しいレイアウトを作成しますか？この操作は取り消せません。',
      confirm: '新規作成',
    },

    // レイアウトを開く
    openLayout: {
      title: 'レイアウトを開く',
      tabLocal: 'ローカル',
      tabGist: 'Gist',
      tabPreset: 'プリセット',
      noPresets: 'プリセットがありません',
      template: 'テンプレート',
      noLocalLayouts: '保存されたレイアウトがありません',
      noGistLayouts: 'Gistにレイアウトがありません',
      updatedAt: '更新日時:',
      gistLoginRequired: 'Gistからレイアウトを読み込むには\nGitHubにログインしてください',
      gistFetchError: 'Gistの取得に失敗しました。ローカル保存のみ表示しています。',
    },

    // 削除確認
    deleteLayout: {
      title: 'レイアウトを削除',
      message: '「{name}」を削除しますか？この操作は取り消せません。',
      confirm: '削除',
    },

    // 開く確認
    openConfirm: {
      title: 'レイアウトを開く',
      message: '現在のレイアウトへの変更が破棄されます。よろしいですか？',
      confirm: '開く',
    },

    // GitHub ログイン
    githubLogin: {
      title: 'GitHubでログイン',
      description: 'GitHubアカウントでログインすると、レイアウトをGistに保存できます。',
      loginButton: 'GitHubでログイン',
      authenticating: '認証中...',
      oauthNote: 'GitHubのOAuth認証を使用し、Gistの読み書き権限のみをリクエストします。認証情報はタブのセッション内だけ保持します。',
      oauthError: 'OAuth認証の開始に失敗しました',
    },

    // バージョン情報
    about: {
      version: 'バージョン',
    },

    // スクリーンショット
    screenshot: {
      title: '撮影モード',
      showTitle: 'タイトル表示',
      hint: 'スクリーンショットツールを使用して撮影してください',
    },

    // キーコードピッカー
    keycodePicker: {
      title: 'QMK キーコード選択',
      searchPlaceholder: 'キーコードを検索...',
      noResults: 'キーコードが見つかりません',
      keycodeCount: '{count} 件のキーコード',
    },
  },

  jsonEditor: {
    jsonError: 'JSONエラー',
    resetTooltip: '編集内容を破棄してレイアウト画面の状態に戻す',
    lines: '行',
    chars: '文字',
    keyCount: 'キー数:',

    // インポート/エクスポート
    import: 'インポート',
    importDescription: 'KLE形式のJSONをインポート',
    importKLE: 'KLE形式のJSONをインポート',

    export: 'エクスポート',
    exportDescription: 'QMK/Vial用のフォーマットでエクスポート',
    exportQMK: 'QMK keyboard.json としてエクスポート',
    exportVial: 'Vial vial.json としてエクスポート',
    exportKeymapC: 'QMK keymap.c としてエクスポート',

    // エラーメッセージ
    invalidJson: 'JSON形式が不正です',
    rootObjectRequired: 'ルートオブジェクトが必要です',
    keysArrayRequired: 'keysプロパティが配列である必要があります',
    keyIdRequired: 'keys[{index}]: idが必要です',
    keyXNumber: 'keys[{index}]: xは数値である必要があります',
    keyYNumber: 'keys[{index}]: yは数値である必要があります',
    keyWidthNumber: 'keys[{index}]: widthは数値である必要があります',
    keyHeightNumber: 'keys[{index}]: heightは数値である必要があります',
    keyLegendObject: 'keys[{index}]: legendがオブジェクトである必要があります',
    keyMatrixObject: 'keys[{index}]: matrixがオブジェクトである必要があります',
    keyKeycodeString: 'keys[{index}]: keycodeは文字列である必要があります',
    keyKeycodesObject: 'keys[{index}]: keycodesはオブジェクトである必要があります',
    applyFailed: 'JSONの適用に失敗しました',
    kleImportError: 'KLEインポートエラー: {message}',
    kleReadFailed: 'KLE JSONの読み込みに失敗しました',
    fileReadFailed: 'ファイルの読み込みに失敗しました',
    qmkExportError: 'QMKエクスポート中にエラーが発生しました',
    vialExportError: 'Vialエクスポート中にエラーが発生しました',
    keymapExportError: 'keymap.cエクスポート中にエラーが発生しました',
  },

  toast: {
    saved: '保存しました',
    savedToGist: 'Gistに保存しました',
    saveFailed: '保存に失敗しました: {error}',
    localStorageError: 'ローカルストレージへの保存に失敗しました。容量不足の可能性があります。ブラウザの設定から不要なデータを削除するか、プライベートブラウジングモードを解除してください。',
    deleteFailed: '削除に失敗しました: {error}',
    loadFailed: 'レイアウトの読み込みに失敗しました',
    layoutNotFound: 'レイアウトが見つかりません',
    fileNotFound: 'ファイルが見つかりません',
    fileContentEmpty: 'ファイル内容を取得できませんでした',
    valuesCorrected: '一部の値が自動修正されました',
    listFetchFailed: 'レイアウト一覧の取得に失敗しました',
    authenticatedAs: '{username}として認証されました',
    authError: '認証エラー: {error}',
    authStorageError: '認証情報の保存・削除に失敗しました。ブラウザのストレージ設定を確認してください。',
    githubAuthError: 'GitHub認証エラー: {error}',
    clientIdNotSet: 'VITE_GITHUB_CLIENT_IDが設定されていません',
  },

  validation: {
    xOutOfRange: 'X座標は0〜{max}の範囲である必要があります',
    yOutOfRange: 'Y座標は0〜{max}の範囲である必要があります',
    widthOutOfRange: '幅は{min}〜{max}の範囲である必要があります',
    heightOutOfRange: '高さは{min}〜{max}の範囲である必要があります',
    rowOutOfRange: 'ROWは0〜{max}の範囲である必要があります',
    colOutOfRange: 'COLは0〜{max}の範囲である必要があります',
    legendTooLong: 'レジェンドは{max}文字以内である必要があります',
    layoutNameTooLong: 'レイアウト名は{max}文字以内である必要があります',
    authorTooLong: '作者名は{max}文字以内である必要があります',
    descriptionTooLong: '説明は{max}文字以内である必要があります',
    invalidValue: '{field}の値が不正です',
  },

  github: {
    notConfigured: 'GitHub連携機能はこのインスタンスでは利用できません。ご自身でデプロイする場合は、環境変数（VITE_GITHUB_CLIENT_ID, VITE_OAUTH_WORKER_URL）を設定してください。',
    invalidToken: 'トークンが無効です。正しいトークンを入力してください。',
    accessDenied: 'アクセスが拒否されました。トークンの権限を確認してください。',
    notFound: 'リソースが見つかりません。',
    invalidData: '無効なデータです。',
    apiError: 'APIエラーが発生しました: {message}',
    networkError: 'ネットワークエラーが発生しました。接続を確認してください。',
    unexpectedError: '予期しないエラーが発生しました。',
  },

  shapes: {
    'rectangle': '長方形',
    'rectangle-desc': '標準の長方形キー',
    'iso-enter': 'ISO Enter',
    'iso-enter-desc': 'L字型のEnterキー（欧州配列）',
    'big-ass-enter': 'Big Ass Enter',
    'big-ass-enter-desc': '逆L字型の大型Enterキー（レトロ配列）',
    'circle': '円形',
    'circle-desc': '円形キー（ロータリーエンコーダなど）',
  },

  language: {
    ja: '日本語',
    en: 'English',
  },
}
