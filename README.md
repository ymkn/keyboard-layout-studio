<p align="center">
  <img src="image/kls-logo-bg.png" alt="Keyboard Layout Studio Logo">
</p>

# Keyboard Layout Studio

A modern, web-based keyboard layout editor designed as an alternative to keyboard-layout-editor.com, with a focus on features specifically useful for keyboard developers.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Vue](https://img.shields.io/badge/Vue-3.5-brightgreen.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue.svg)

## Features

- **SVG-based Visual Editor** - Precise keyboard layout design with grid-based positioning
- **Layer Management** - Support for 1-16 layers with per-layer keycode assignment
- **QMK Integration** - Built-in QMK keycode picker and export to QMK `keyboard.json` format
- **Vial Support** - Export layouts to Vial `vial.json` format
- **KLE Import** - Import JSON data exported from keyboard-layout-editor.com
- **Matrix Assignment** - Assign row/column pins for physical keyboard matrix
- **Legend Editing** - 9-position text labels on each keycap (3×3 grid)
- **Undo/Redo** - Full history support with up to 20 states
- **Copy/Paste** - Duplicate keys with relative positioning preserved
- **LocalStorage Persistence** - Save and load multiple layouts locally
- **JSON Editor** - Direct JSON editing with live validation
- **Keyboard Shortcuts** - Efficient workflow with keyboard-first navigation
- **Dark Theme UI** - Modern, clean interface built with Tailwind CSS
- **Client-Side Only** - No server required, suitable for static hosting

## Demo

https://ymkn.github.io/keyboard-layout-studio/

## Getting Started

### Prerequisites

- Node.js 22+ and npm

### Installation

```bash
# Clone the repository
git clone https://github.com/ymkn/keyboard-layout-studio.git
cd keyboard-layout-studio

# Install dependencies
npm install

# Start development server
npm run dev
```

The app will be available at `http://localhost:5173`

### Build for Production

```bash
# Type-check and build
npm run build

# Type-check and run security regression tests
npm test

# Preview production build
npm run preview
```

## Usage

### Basic Editing

1. **Add Keys** - Click "Add Key" or use the property panel
2. **Select Keys** - Click on keys to select, Shift+Click for multi-select
3. **Move Keys** - Use arrow keys (0.25u grid) or edit X/Y values
4. **Resize Keys** - Shift+Arrow keys or edit Width/Height values
5. **Edit Legends** - Select a key and use the legend editor (9 positions)
6. **Assign Matrix** - Set ROW and COL values for physical matrix pins
7. **Set Keycodes** - Choose QMK keycodes for each layer

### Keyboard Shortcuts

- **Arrow Keys** - Move selected keys by 0.25u
- **Shift + Arrow Keys** - Resize selected keys by 0.25u
- **R / Shift + R** - Rotate each selected key around its own center by +3° / -3°
- **Page Up / Page Down** - Rotate selected keys together around the layout rotation center by -3° / +3°
- **Ctrl + C** - Copy selected keys
- **Ctrl + V** - Paste copied keys
- **Ctrl + Z** - Undo
- **Ctrl + Y / Ctrl + Shift + Z** - Redo
- **Tab** - Select next key
- **Delete / Backspace** - Delete selected keys
- **Shift + Click** - Toggle key selection (multi-select)

### Shared Rotation Center

Deselect all keys, then set **Rotation Center (u)** X/Y in the layout properties. Coordinates are measured from the top-left origin and default to (0, 0). The orange cross marks the rotation center, which is saved with the layout.

Select one or more keys and press **Page Up** (counterclockwise) or **Page Down** (clockwise). Each step rotates both the key positions and orientations by 3°, preserving their relative arrangement. Undo/Redo restores the entire operation. Rotation is cancelled if any resulting key position would exceed the existing coordinate limits (X: 0–50u, Y: 0–20u); keys are not individually clamped or snapped to the grid.

### Layout Options (Vial)

The **Layout options** tab in the right sidebar manages alternative physical arrangements, separately from keycode layers. The sidebar opens on **Properties** by default; switching tabs retains the active target, selection, clipboard and each panel's scroll position.

- Keep keys shown in every variation in **Fixed-layout keys**. Add an option such as **Split Backspace** or **Space** for each independent setting.
- Choose **Checkbox** for off/on variants, or **Dropdown** for named choices. Names can be edited in **Option settings**.
- In **Overlay editing**, select a choice to edit its keys and add new keys to it. Eye buttons control visibility; other visible targets are dimmed and cannot be selected.
- Select existing keys and use **Selected keys belong to** in the properties panel to move them to a target or **Duplicate in place**. Duplicates retain geometry and matrix assignments, so alternatives can occupy the same position and reference the same matrix cell.
- To reuse fixed keys in an option, select and copy them, select the destination choice, then paste with the toolbar or **Ctrl+V**. The destination may be empty. Pasting across targets retains the original coordinates and copies the keys without moving the originals; pasting within the same target next to a selected key keeps the existing right-adjacent behavior.
- **Layout preview** opens in **Side-by-side view**: a reference layout and cropped previews of every choice, without expanding all combinations. Numbered outlines locate the cropped regions; disconnected regions are cropped separately. Click a choice to use it in the reference layout. The first choice in each option is used initially. Narrow windows place the crops below the reference instead of beside it.
- **Switch view** shows one complete arrangement at a time. Both preview views disable editing and show the physical arrangement, not a connected Vial device.
- Visibility, preview choices and the editing target are session-only. Saving and Vial export retain all variants, including hidden keys. Removing an option or choice moves its keys to Fixed-layout keys instead of deleting them; the operation can be undone.

### Display Modes

- **Legend Mode** - Show keycap legends
- **Matrix Mode** - Show matrix assignments (R{row}C{col}) (default)

### Layer Management

- Switch between layers (0-15) using the layer tabs
- Add or remove layers with the +/- buttons
- Each key can have different keycodes per layer

### Import/Export

- **Import from KLE** - Load layouts from keyboard-layout-editor.com JSON format
- **Export to QMK** - Generate QMK `keyboard.json` with keymap layers
- **Export to Vial** - Generate Vial `vial.json` format
- **Download KLS** - Save in native `.kls.json` format

### Save/Load

- Layouts are saved to browser LocalStorage when you click "Save"
- The layout title determines the saved filename. Changing the title and saving keeps the previous entry and saves under the new name. For GitHub storage, a new title creates a separate secret Gist; later saves with the same title update that Gist.
- Use the "Open Layout" button to load previously saved layouts
- Layouts are saved with prefix `kls-layout-{name}`

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Inspired by [keyboard-layout-editor.com](http://www.keyboard-layout-editor.com/)
- Built for the mechanical keyboard community
- QMK keycode definitions from [QMK Firmware](https://qmk.fm/)

---

**Note**: Layouts can be stored locally in your browser's LocalStorage. Optional GitHub integration sends authentication requests through a Cloudflare Worker and stores layouts in GitHub Gists. GitHub credentials are kept in sessionStorage for the current tab session, not in LocalStorage. See [Worker deployment and security](doc/WORKERS_DEPLOY.md).
