/**
 * QMK Keycode データ
 * QMK公式ドキュメントに基づくキーコード定義
 */

export interface Keycode {
  code: string
  label: string
  description?: string
}

export interface KeycodeCategory {
  name: string
  label: string
  keycodes: Keycode[]
}

export const keycodeCategories: KeycodeCategory[] = [
  {
    name: 'basic',
    label: 'Basic',
    keycodes: [
      // Letters
      { code: 'KC_A', label: 'A', description: 'a and A' },
      { code: 'KC_B', label: 'B', description: 'b and B' },
      { code: 'KC_C', label: 'C', description: 'c and C' },
      { code: 'KC_D', label: 'D', description: 'd and D' },
      { code: 'KC_E', label: 'E', description: 'e and E' },
      { code: 'KC_F', label: 'F', description: 'f and F' },
      { code: 'KC_G', label: 'G', description: 'g and G' },
      { code: 'KC_H', label: 'H', description: 'h and H' },
      { code: 'KC_I', label: 'I', description: 'i and I' },
      { code: 'KC_J', label: 'J', description: 'j and J' },
      { code: 'KC_K', label: 'K', description: 'k and K' },
      { code: 'KC_L', label: 'L', description: 'l and L' },
      { code: 'KC_M', label: 'M', description: 'm and M' },
      { code: 'KC_N', label: 'N', description: 'n and N' },
      { code: 'KC_O', label: 'O', description: 'o and O' },
      { code: 'KC_P', label: 'P', description: 'p and P' },
      { code: 'KC_Q', label: 'Q', description: 'q and Q' },
      { code: 'KC_R', label: 'R', description: 'r and R' },
      { code: 'KC_S', label: 'S', description: 's and S' },
      { code: 'KC_T', label: 'T', description: 't and T' },
      { code: 'KC_U', label: 'U', description: 'u and U' },
      { code: 'KC_V', label: 'V', description: 'v and V' },
      { code: 'KC_W', label: 'W', description: 'w and W' },
      { code: 'KC_X', label: 'X', description: 'x and X' },
      { code: 'KC_Y', label: 'Y', description: 'y and Y' },
      { code: 'KC_Z', label: 'Z', description: 'z and Z' },
      // Numbers
      { code: 'KC_1', label: '1', description: '1 and !' },
      { code: 'KC_2', label: '2', description: '2 and @' },
      { code: 'KC_3', label: '3', description: '3 and #' },
      { code: 'KC_4', label: '4', description: '4 and $' },
      { code: 'KC_5', label: '5', description: '5 and %' },
      { code: 'KC_6', label: '6', description: '6 and ^' },
      { code: 'KC_7', label: '7', description: '7 and &' },
      { code: 'KC_8', label: '8', description: '8 and *' },
      { code: 'KC_9', label: '9', description: '9 and (' },
      { code: 'KC_0', label: '0', description: '0 and )' },
      // Punctuation
      { code: 'KC_MINS', label: '-', description: '- and _' },
      { code: 'KC_EQL', label: '=', description: '= and +' },
      { code: 'KC_LBRC', label: '[', description: '[ and {' },
      { code: 'KC_RBRC', label: ']', description: '] and }' },
      { code: 'KC_BSLS', label: '\\', description: '\\ and |' },
      { code: 'KC_SCLN', label: ';', description: '; and :' },
      { code: 'KC_QUOT', label: "'", description: "' and \"" },
      { code: 'KC_GRV', label: '`', description: '` and ~' },
      { code: 'KC_COMM', label: ',', description: ', and <' },
      { code: 'KC_DOT', label: '.', description: '. and >' },
      { code: 'KC_SLSH', label: '/', description: '/ and ?' },
    ],
  },
  {
    name: 'special',
    label: 'Special',
    keycodes: [
      { code: 'KC_ESC', label: 'Esc', description: 'Escape' },
      { code: 'KC_ENT', label: 'Enter', description: 'Enter' },
      { code: 'KC_SPC', label: 'Space', description: 'Space' },
      { code: 'KC_TAB', label: 'Tab', description: 'Tab' },
      { code: 'KC_BSPC', label: 'Backspace', description: 'Backspace' },
      { code: 'KC_DEL', label: 'Delete', description: 'Delete' },
      { code: 'KC_INS', label: 'Insert', description: 'Insert' },
      { code: 'KC_CAPS', label: 'Caps Lock', description: 'Caps Lock' },
      { code: 'KC_PSCR', label: 'Print Screen', description: 'Print Screen' },
      { code: 'KC_SCRL', label: 'Scroll Lock', description: 'Scroll Lock' },
      { code: 'KC_PAUS', label: 'Pause', description: 'Pause' },
      { code: 'KC_APP', label: 'Menu', description: 'Application (Menu)' },
    ],
  },
  {
    name: 'navigation',
    label: 'Navigation',
    keycodes: [
      { code: 'KC_HOME', label: 'Home', description: 'Home' },
      { code: 'KC_END', label: 'End', description: 'End' },
      { code: 'KC_PGUP', label: 'Page Up', description: 'Page Up' },
      { code: 'KC_PGDN', label: 'Page Down', description: 'Page Down' },
      { code: 'KC_UP', label: '↑', description: 'Up Arrow' },
      { code: 'KC_DOWN', label: '↓', description: 'Down Arrow' },
      { code: 'KC_LEFT', label: '←', description: 'Left Arrow' },
      { code: 'KC_RGHT', label: '→', description: 'Right Arrow' },
    ],
  },
  {
    name: 'international',
    label: 'International',
    keycodes: [
      { code: 'KC_INT1', label: 'INT1', description: 'JIS Ro / Underscore (無変換)' },
      { code: 'KC_INT2', label: 'INT2', description: 'JIS Katakana/Hiragana (カナ/かな)' },
      { code: 'KC_INT3', label: 'INT3', description: 'JIS Yen (¥)' },
      { code: 'KC_INT4', label: 'INT4', description: 'JIS Henkan (変換)' },
      { code: 'KC_INT5', label: 'INT5', description: 'JIS Muhenkan (無変換)' },
      { code: 'KC_INT6', label: 'INT6', description: 'International 6' },
      { code: 'KC_INT7', label: 'INT7', description: 'International 7' },
      { code: 'KC_INT8', label: 'INT8', description: 'International 8' },
      { code: 'KC_INT9', label: 'INT9', description: 'International 9' },
    ],
  },
  {
    name: 'modifiers',
    label: 'Modifiers',
    keycodes: [
      { code: 'KC_LCTL', label: 'Left Ctrl', description: 'Left Control' },
      { code: 'KC_LSFT', label: 'Left Shift', description: 'Left Shift' },
      { code: 'KC_LALT', label: 'Left Alt', description: 'Left Alt' },
      { code: 'KC_LGUI', label: 'Left GUI', description: 'Left GUI (Win/Cmd)' },
      { code: 'KC_RCTL', label: 'Right Ctrl', description: 'Right Control' },
      { code: 'KC_RSFT', label: 'Right Shift', description: 'Right Shift' },
      { code: 'KC_RALT', label: 'Right Alt', description: 'Right Alt' },
      { code: 'KC_RGUI', label: 'Right GUI', description: 'Right GUI (Win/Cmd)' },
    ],
  },
  {
    name: 'function',
    label: 'Function Keys',
    keycodes: [
      { code: 'KC_F1', label: 'F1', description: 'F1' },
      { code: 'KC_F2', label: 'F2', description: 'F2' },
      { code: 'KC_F3', label: 'F3', description: 'F3' },
      { code: 'KC_F4', label: 'F4', description: 'F4' },
      { code: 'KC_F5', label: 'F5', description: 'F5' },
      { code: 'KC_F6', label: 'F6', description: 'F6' },
      { code: 'KC_F7', label: 'F7', description: 'F7' },
      { code: 'KC_F8', label: 'F8', description: 'F8' },
      { code: 'KC_F9', label: 'F9', description: 'F9' },
      { code: 'KC_F10', label: 'F10', description: 'F10' },
      { code: 'KC_F11', label: 'F11', description: 'F11' },
      { code: 'KC_F12', label: 'F12', description: 'F12' },
      { code: 'KC_F13', label: 'F13', description: 'F13' },
      { code: 'KC_F14', label: 'F14', description: 'F14' },
      { code: 'KC_F15', label: 'F15', description: 'F15' },
      { code: 'KC_F16', label: 'F16', description: 'F16' },
      { code: 'KC_F17', label: 'F17', description: 'F17' },
      { code: 'KC_F18', label: 'F18', description: 'F18' },
      { code: 'KC_F19', label: 'F19', description: 'F19' },
      { code: 'KC_F20', label: 'F20', description: 'F20' },
      { code: 'KC_F21', label: 'F21', description: 'F21' },
      { code: 'KC_F22', label: 'F22', description: 'F22' },
      { code: 'KC_F23', label: 'F23', description: 'F23' },
      { code: 'KC_F24', label: 'F24', description: 'F24' },
    ],
  },
  {
    name: 'numpad',
    label: 'Numpad',
    keycodes: [
      { code: 'KC_NUM', label: 'Num Lock', description: 'Num Lock' },
      { code: 'KC_P1', label: 'Num 1', description: 'Numpad 1' },
      { code: 'KC_P2', label: 'Num 2', description: 'Numpad 2' },
      { code: 'KC_P3', label: 'Num 3', description: 'Numpad 3' },
      { code: 'KC_P4', label: 'Num 4', description: 'Numpad 4' },
      { code: 'KC_P5', label: 'Num 5', description: 'Numpad 5' },
      { code: 'KC_P6', label: 'Num 6', description: 'Numpad 6' },
      { code: 'KC_P7', label: 'Num 7', description: 'Numpad 7' },
      { code: 'KC_P8', label: 'Num 8', description: 'Numpad 8' },
      { code: 'KC_P9', label: 'Num 9', description: 'Numpad 9' },
      { code: 'KC_P0', label: 'Num 0', description: 'Numpad 0' },
      { code: 'KC_PDOT', label: 'Num .', description: 'Numpad .' },
      { code: 'KC_PPLS', label: 'Num +', description: 'Numpad +' },
      { code: 'KC_PMNS', label: 'Num -', description: 'Numpad -' },
      { code: 'KC_PAST', label: 'Num *', description: 'Numpad *' },
      { code: 'KC_PSLS', label: 'Num /', description: 'Numpad /' },
      { code: 'KC_PENT', label: 'Num Enter', description: 'Numpad Enter' },
      { code: 'KC_PEQL', label: 'Num =', description: 'Numpad =' },
    ],
  },
  {
    name: 'media',
    label: 'Media',
    keycodes: [
      { code: 'KC_MUTE', label: 'Mute', description: 'Mute' },
      { code: 'KC_VOLU', label: 'Vol +', description: 'Volume Up' },
      { code: 'KC_VOLD', label: 'Vol -', description: 'Volume Down' },
      { code: 'KC_MNXT', label: 'Next', description: 'Next Track' },
      { code: 'KC_MPRV', label: 'Previous', description: 'Previous Track' },
      { code: 'KC_MPLY', label: 'Play/Pause', description: 'Play/Pause' },
      { code: 'KC_MSTP', label: 'Stop', description: 'Stop' },
      { code: 'KC_MSEL', label: 'Select', description: 'Media Select' },
      { code: 'KC_EJCT', label: 'Eject', description: 'Eject' },
      { code: 'KC_CALC', label: 'Calculator', description: 'Calculator' },
      { code: 'KC_MYCM', label: 'My Computer', description: 'My Computer' },
      { code: 'KC_WSCH', label: 'Search', description: 'Web Search' },
      { code: 'KC_WHOM', label: 'Home', description: 'Web Home' },
      { code: 'KC_WBAK', label: 'Back', description: 'Web Back' },
      { code: 'KC_WFWD', label: 'Forward', description: 'Web Forward' },
      { code: 'KC_WSTP', label: 'Stop', description: 'Web Stop' },
      { code: 'KC_WREF', label: 'Refresh', description: 'Web Refresh' },
      { code: 'KC_WFAV', label: 'Favorites', description: 'Web Favorites' },
    ],
  },
  {
    name: 'layer',
    label: 'Layer',
    keycodes: [
      { code: 'MO(0)', label: 'MO(0)', description: 'Momentary Layer 0' },
      { code: 'MO(1)', label: 'MO(1)', description: 'Momentary Layer 1' },
      { code: 'MO(2)', label: 'MO(2)', description: 'Momentary Layer 2' },
      { code: 'MO(3)', label: 'MO(3)', description: 'Momentary Layer 3' },
      { code: 'TG(0)', label: 'TG(0)', description: 'Toggle Layer 0' },
      { code: 'TG(1)', label: 'TG(1)', description: 'Toggle Layer 1' },
      { code: 'TG(2)', label: 'TG(2)', description: 'Toggle Layer 2' },
      { code: 'TG(3)', label: 'TG(3)', description: 'Toggle Layer 3' },
      { code: 'TO(0)', label: 'TO(0)', description: 'Switch to Layer 0' },
      { code: 'TO(1)', label: 'TO(1)', description: 'Switch to Layer 1' },
      { code: 'TO(2)', label: 'TO(2)', description: 'Switch to Layer 2' },
      { code: 'TO(3)', label: 'TO(3)', description: 'Switch to Layer 3' },
      { code: 'DF(0)', label: 'DF(0)', description: 'Set Default Layer 0' },
      { code: 'DF(1)', label: 'DF(1)', description: 'Set Default Layer 1' },
      { code: 'DF(2)', label: 'DF(2)', description: 'Set Default Layer 2' },
      { code: 'DF(3)', label: 'DF(3)', description: 'Set Default Layer 3' },
    ],
  },
  {
    name: 'quantum',
    label: 'Quantum',
    keycodes: [
      { code: 'QK_BOOT', label: 'RESET', description: 'Enter bootloader mode' },
      { code: 'EE_CLR', label: 'EE_CLR', description: 'Clear EEPROM' },
      { code: 'KC_TRNS', label: '▽', description: 'Transparent (Pass through)' },
      { code: 'KC_NO', label: '✕', description: 'No action' },
      { code: 'RGB_TOG', label: 'RGB Toggle', description: 'Toggle RGB' },
      { code: 'RGB_MOD', label: 'RGB Mode+', description: 'Next RGB mode' },
      { code: 'RGB_RMOD', label: 'RGB Mode-', description: 'Previous RGB mode' },
      { code: 'RGB_HUI', label: 'RGB Hue+', description: 'Increase Hue' },
      { code: 'RGB_HUD', label: 'RGB Hue-', description: 'Decrease Hue' },
      { code: 'RGB_SAI', label: 'RGB Sat+', description: 'Increase Saturation' },
      { code: 'RGB_SAD', label: 'RGB Sat-', description: 'Decrease Saturation' },
      { code: 'RGB_VAI', label: 'RGB Bri+', description: 'Increase Brightness' },
      { code: 'RGB_VAD', label: 'RGB Bri-', description: 'Decrease Brightness' },
      { code: 'BL_TOGG', label: 'BL Toggle', description: 'Toggle Backlight' },
      { code: 'BL_STEP', label: 'BL Step', description: 'Backlight Step' },
      { code: 'BL_BRTG', label: 'BL Breathe', description: 'Backlight Breathing' },
    ],
  },
  {
    name: 'modtap',
    label: 'Mod-Tap',
    keycodes: [
      { code: 'MT(MOD_LCTL, KC_ESC)', label: 'Ctrl/Esc', description: 'Ctrl when held, Esc when tapped' },
      { code: 'MT(MOD_LSFT, KC_ENT)', label: 'Shift/Enter', description: 'Shift when held, Enter when tapped' },
      { code: 'MT(MOD_LGUI, KC_SPC)', label: 'GUI/Space', description: 'GUI when held, Space when tapped' },
      { code: 'LT(1, KC_SPC)', label: 'LT(1)/Space', description: 'Layer 1 when held, Space when tapped' },
      { code: 'LT(2, KC_ENT)', label: 'LT(2)/Enter', description: 'Layer 2 when held, Enter when tapped' },
    ],
  },
]

/**
 * クエリ文字列でキーコードを全カテゴリから検索
 */
export function searchKeycodes(query: string): Keycode[] {
  const q = query.toLowerCase().trim()
  if (!q) return []
  return keycodeCategories
    .flatMap(category => category.keycodes)
    .filter(keycode =>
      keycode.code.toLowerCase().includes(q) ||
      keycode.label.toLowerCase().includes(q) ||
      (keycode.description?.toLowerCase().includes(q) ?? false)
    )
}

/**
 * キーコードを検索
 */
export function findKeycode(code: string): Keycode | undefined {
  for (const category of keycodeCategories) {
    const found = category.keycodes.find(k => k.code === code)
    if (found) return found
  }
  return undefined
}

/**
 * キーコードのラベルを取得
 */
export function getKeycodeLabel(code: string): string {
  const keycode = findKeycode(code)
  return keycode?.label || code
}
