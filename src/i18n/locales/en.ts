/**
 * English translation messages
 */
export default {
  common: {
    save: 'Save',
    cancel: 'Cancel',
    delete: 'Delete',
    close: 'Close',
    open: 'Open',
    newLayout: 'New',
    loading: 'Loading...',
    unsaved: '* Unsaved',
    apply: 'Apply',
    reset: 'Reset',
    format: 'Format',
    clear: 'Clear',
    copy: 'Copy',
    paste: 'Paste',
    undo: 'Undo',
    redo: 'Redo',
    addKey: 'Add Key',
    default: 'Default',
  },

  header: {
    layoutType: 'Layout:',
    loginWithGitHub: 'Login with GitHub',
    saveToLocal: 'Save to local',
    saveToGist: 'Save to Gist',
    pleaseLoginGitHub: 'Please login to GitHub',
  },

  tabs: {
    layout: 'Layout',
    json: 'JSON',
  },

  canvas: {
    screenshotMode: 'Screenshot Mode',
    legend: 'Legend',
    matrixKeycode: 'Matrix/Keycode',
    layer: 'Layer:',
    addLayer: 'Add layer',
    deleteLayer: 'Delete layer',
  },

  propertyPanel: {
    properties: 'Properties',
    layoutInfo: 'Layout Information',
    selectKeyToEdit: 'Select a key to edit properties',
    keysSelected: '{count} keys selected',
    multiSelectInfo: 'Cannot edit properties with multiple selection.',
    multiSelectHint: 'Arrow keys: Move\nShift+Arrow keys: Resize',

    // Metadata
    title: 'Title',
    titlePlaceholder: 'e.g., My Custom Keyboard Layout',
    author: 'Author',
    authorPlaceholder: 'e.g., John Doe',
    description: 'Description',
    descriptionPlaceholder: 'e.g., Custom layout for 60% keyboard',
    legendFont: 'Legend Font',
    fontPreview: 'Preview: ABCDE 12345',

    // Font groups
    fontGroupGothic: 'Gothic',
    fontGroupRounded: 'Rounded',
    fontGroupMincho: 'Mincho',

    // Additional info
    additionalInfo: 'Additional Info',
    createdAt: 'Created:',
    modifiedAt: 'Modified:',
    keyCount: 'Key count:',
    keys: 'keys',
    sizeBreakdown: 'Size breakdown:',
    notSet: 'Not set',
    invalidDate: 'Invalid date',

    // Key properties
    shape: 'Shape',
    shapeRectangle: 'Rectangle',
    shapeIsoEnter: 'ISO Enter',
    shapeBigAssEnter: 'Big Ass Enter',
    shapeCircle: 'Circle',
    fixedSizeShape: 'This shape has a fixed size',

    position: 'Position',
    size: 'Size',
    width: 'Width',
    height: 'Height',

    rotation: 'Rotation',
    degrees: 'deg',
    rotationHint: 'R: +3° / Shift+R: -3°',

    legends: 'Legends',
    legendTopLeft: 'Top Left',
    legendTopCenter: 'Top Center',
    legendTopRight: 'Top Right',
    legendCenterLeft: 'Center Left',
    legendCenter: 'Center',
    legendCenterRight: 'Center Right',
    legendBottomLeft: 'Bottom Left',
    legendBottomCenter: 'Bottom Center',
    legendBottomRight: 'Bottom Right',

    keyMatrix: 'Key Matrix',

    keycode: 'Keycode',
    keycodePlaceholder: 'KC_A, MO(1), etc...',
    selectKeycode: 'Select keycode',
  },

  dialogs: {
    // New layout
    newLayout: {
      title: 'New Layout',
      message: 'Discard current layout and create a new one? This action cannot be undone.',
      confirm: 'Create New',
    },

    // Open layout
    openLayout: {
      title: 'Open Layout',
      tabLocal: 'Local',
      tabGist: 'Gist',
      tabPreset: 'Preset',
      noPresets: 'No presets available',
      template: 'Template',
      noLocalLayouts: 'No saved layouts',
      noGistLayouts: 'No layouts in Gist',
      updatedAt: 'Updated:',
      gistLoginRequired: 'Login to GitHub to load\nlayouts from Gist',
      gistFetchError: 'Failed to fetch Gists. Showing local layouts only.',
    },

    // Delete confirmation
    deleteLayout: {
      title: 'Delete Layout',
      message: 'Delete "{name}"? This action cannot be undone.',
      confirm: 'Delete',
    },

    // Open confirmation
    openConfirm: {
      title: 'Open Layout',
      message: 'Changes to current layout will be discarded. Continue?',
      confirm: 'Open',
    },

    // GitHub login
    githubLogin: {
      title: 'Login with GitHub',
      description: 'Login with your GitHub account to save layouts to Gist.',
      loginButton: 'Login with GitHub',
      authenticating: 'Authenticating...',
      oauthNote: 'Uses GitHub OAuth. Only requests read/write access to Gists.',
      oauthError: 'Failed to start OAuth authentication',
    },

    // About
    about: {
      version: 'Version',
    },

    // Screenshot
    screenshot: {
      title: 'Screenshot Mode',
      showTitle: 'Show title',
      hint: 'Use your screenshot tool to capture the layout',
    },

    // Keycode picker
    keycodePicker: {
      title: 'QMK Keycode Selection',
      searchPlaceholder: 'Search keycodes...',
      noResults: 'No keycodes found',
      keycodeCount: '{count} keycodes',
    },
  },

  jsonEditor: {
    jsonError: 'JSON Error',
    resetTooltip: 'Discard changes and restore layout state',
    lines: 'lines',
    chars: 'chars',
    keyCount: 'Keys:',

    // Import/Export
    import: 'Import',
    importDescription: 'Import KLE format JSON',
    importKLE: 'Import KLE JSON',

    export: 'Export',
    exportDescription: 'Export for QMK/Vial',
    exportQMK: 'Export as QMK keyboard.json',
    exportVial: 'Export as Vial vial.json',
    exportKeymapC: 'Export as QMK keymap.c',

    // Error messages
    invalidJson: 'Invalid JSON format',
    rootObjectRequired: 'Root object is required',
    keysArrayRequired: '"keys" property must be an array',
    keyIdRequired: 'keys[{index}]: id is required',
    keyXNumber: 'keys[{index}]: x must be a number',
    keyYNumber: 'keys[{index}]: y must be a number',
    keyWidthNumber: 'keys[{index}]: width must be a number',
    keyHeightNumber: 'keys[{index}]: height must be a number',
    keyLegendObject: 'keys[{index}]: legend must be an object',
    keyMatrixObject: 'keys[{index}]: matrix must be an object',
    keyKeycodeString: 'keys[{index}]: keycode must be a string',
    keyKeycodesObject: 'keys[{index}]: keycodes must be an object',
    applyFailed: 'Failed to apply JSON',
    kleImportError: 'KLE import error: {message}',
    kleReadFailed: 'Failed to read KLE JSON',
    fileReadFailed: 'Failed to read file',
    qmkExportError: 'Error during QMK export',
    vialExportError: 'Error during Vial export',
    keymapExportError: 'Error during keymap.c export',
  },

  toast: {
    saved: 'Saved',
    savedToGist: 'Saved to Gist',
    saveFailed: 'Save failed: {error}',
    localStorageError: 'Failed to save to local storage. This may be due to insufficient space. Please clear unnecessary data in your browser settings or disable private browsing mode.',
    deleteFailed: 'Delete failed: {error}',
    loadFailed: 'Failed to load layout',
    layoutNotFound: 'Layout not found',
    fileNotFound: 'File not found',
    fileContentEmpty: 'Could not retrieve file content',
    valuesCorrected: 'Some values were automatically corrected',
    listFetchFailed: 'Failed to fetch layout list',
    authenticatedAs: 'Authenticated as {username}',
    authError: 'Authentication error: {error}',
    githubAuthError: 'GitHub authentication error: {error}',
    clientIdNotSet: 'VITE_GITHUB_CLIENT_ID is not set',
  },

  validation: {
    xOutOfRange: 'X must be between 0 and {max}',
    yOutOfRange: 'Y must be between 0 and {max}',
    widthOutOfRange: 'Width must be between {min} and {max}',
    heightOutOfRange: 'Height must be between {min} and {max}',
    rowOutOfRange: 'ROW must be between 0 and {max}',
    colOutOfRange: 'COL must be between 0 and {max}',
    legendTooLong: 'Legend must be {max} characters or less',
    layoutNameTooLong: 'Layout name must be {max} characters or less',
    authorTooLong: 'Author must be {max} characters or less',
    descriptionTooLong: 'Description must be {max} characters or less',
    invalidValue: 'Invalid value for {field}',
  },

  github: {
    notConfigured: 'GitHub integration is not available on this instance. To self-deploy, set environment variables (VITE_GITHUB_CLIENT_ID, VITE_OAUTH_WORKER_URL).',
    invalidToken: 'Invalid token. Please enter a valid token.',
    accessDenied: 'Access denied. Please check token permissions.',
    notFound: 'Resource not found.',
    invalidData: 'Invalid data.',
    apiError: 'API error occurred: {message}',
    networkError: 'Network error. Please check your connection.',
    unexpectedError: 'An unexpected error occurred.',
  },

  shapes: {
    'rectangle': 'Rectangle',
    'rectangle-desc': 'Standard rectangular key',
    'iso-enter': 'ISO Enter',
    'iso-enter-desc': 'L-shaped Enter key (European layout)',
    'big-ass-enter': 'Big Ass Enter',
    'big-ass-enter-desc': 'Reverse L-shaped large Enter key (Retro layout)',
    'circle': 'Circle',
    'circle-desc': 'Circular key (rotary encoder, etc.)',
  },

  language: {
    ja: '日本語',
    en: 'English',
  },
}
