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

- Node.js 16+ and npm

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
- **Ctrl + C** - Copy selected keys
- **Ctrl + V** - Paste copied keys
- **Ctrl + Z** - Undo
- **Ctrl + Y / Ctrl + Shift + Z** - Redo
- **Tab** - Select next key
- **Delete / Backspace** - Delete selected keys
- **Shift + Click** - Toggle key selection (multi-select)

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
- Use the "Open Layout" button to load previously saved layouts
- Layouts are saved with prefix `kls-layout-{name}`

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Inspired by [keyboard-layout-editor.com](http://www.keyboard-layout-editor.com/)
- Built for the mechanical keyboard community
- QMK keycode definitions from [QMK Firmware](https://qmk.fm/)

---

**Note**: This is a client-side application. All data is stored locally in your browser's LocalStorage. No data is sent to external servers.
