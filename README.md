# Shark Eagle Sidebar

A sleek, minimalist browser extension sidebar for managing your favorite bookmarks with an intuitive icon-based interface.

![Shark Eagle Sidebar](public/icon/128.png)

## Features

- **60px Compact Sidebar**: Ultra-slim design that doesn't interfere with your browsing
- **Icon-Based Interface**: Visual bookmark management with favicon support
- **Smart Auto-Hide**: Configurable auto-hide with 1-second delay when mouse leaves
- **Pin/Unpin**: Keep the sidebar visible or let it auto-hide
- **Context Menu**: Right-click bookmarks to edit or delete
- **Modal Popups**: Clean, centered modals for adding and editing bookmarks
- **Position Control**: Place sidebar on left or right side of the screen
- **Import/Export**: Backup and restore your bookmarks as JSON
- **Dark Theme**: Easy on the eyes with a modern dark color scheme

## Installation

### Development Mode

1. Clone the repository:
```bash
git clone https://github.com/SharkEagleUS/shark-eagle-sidebar.git
cd shark-eagle-sidebar
```

2. Install dependencies:
```bash
pnpm install
```

3. Start development server:
```bash
pnpm run dev
```

4. Load the extension in your browser:
   - **Chrome/Edge**: 
     - Open `chrome://extensions/`
     - Enable "Developer mode"
     - Click "Load unpacked"
     - Select the `.output/chrome-mv3` directory
   - **Firefox**:
     - Open `about:debugging#/runtime/this-firefox`
     - Click "Load Temporary Add-on"
     - Select any file in the `.output/firefox-mv3` directory

### Production Build

1. Build the extension:
```bash
pnpm run build
```

2. Create a distributable zip file:
```bash
pnpm run zip
```

## Usage

### Basic Operations

#### Accessing the Sidebar
- **Auto-hide mode**: Move mouse to the left edge of the screen (or right if positioned there)
- **Pinned mode**: Click the 📌 pin button to keep sidebar always visible
- **Manual hide**: Sidebar will hide after 1 second when mouse leaves the sidebar area

#### Adding Bookmarks
1. Click the blue **"+"** button at the bottom of the sidebar
2. Enter the bookmark title and URL
3. Click "Add Bookmark" or press Enter

#### Managing Bookmarks
- **Open**: Click on any bookmark icon to open in a new tab
- **Edit**: Right-click bookmark → Select "✏️ Edit"
- **Delete**: Right-click bookmark → Select "🗑️ Delete"

#### Settings
1. Click the ⚙️ settings button at the bottom
2. Configure:
   - **Position**: Left or Right side
   - **Auto-hide**: Toggle automatic hiding behavior
   - **Export Data**: Download bookmarks as JSON
   - **Import Data**: Restore bookmarks from JSON file

### Keyboard Shortcuts
- **Enter**: Submit forms in Add/Edit modals
- **Right-click**: Open context menu on bookmarks

## Configuration

The sidebar can be customized through the settings panel:

- **Position**: `left` (default) or `right`
- **Auto-hide**: `true` (default) or `false`
- **Trigger Width**: 10px edge detection zone

## Data Storage

Bookmarks are stored locally in your browser's storage using the Chrome Storage API. Data structure:

```json
{
  "bookmarks": [
    {
      "id": "unique-id",
      "title": "Example Site",
      "url": "https://example.com",
      "favicon": "https://www.google.com/s2/favicons?domain=example.com&sz=32",
      "createdAt": 1234567890
    }
  ],
  "settings": {
    "position": "left",
    "autoHide": true,
    "triggerWidth": 10
  }
}
```

## Project Structure

```
shark-eagle-sidebar/
├── entrypoints/
│   ├── background.ts      # Background service worker
│   └── content.tsx        # Main sidebar component
├── utils/
│   ├── types.ts          # TypeScript type definitions
│   └── storage.ts        # Storage management utilities
├── public/
│   └── icon/             # Extension icons
├── wxt.config.ts         # WXT configuration
└── package.json          # Project dependencies
```

## Technology Stack

- **Framework**: [WXT](https://wxt.dev/) - Modern web extension framework
- **UI Library**: React 18 with TypeScript
- **Build Tool**: Vite (via WXT)
- **Styling**: Inline CSS-in-JS (no external CSS dependencies)
- **Storage**: Chrome Storage API

## Browser Compatibility

- ✅ Chrome/Chromium (Manifest V3)
- ✅ Edge (Manifest V3)
- ✅ Firefox (Manifest V3)
- ⚠️ Safari (Not tested)

## Development

### Available Scripts

```bash
pnpm dev      # Start development server with hot reload
pnpm build    # Build for production
pnpm zip      # Create distributable zip file
```

### Code Style

- TypeScript strict mode enabled
- React functional components with hooks
- Inline styles for zero CSS bundle overhead
- No external UI libraries for minimal bundle size

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Built with [WXT](https://wxt.dev/)
- Icons from browser favicons API
- Inspired by the need for a minimalist bookmark manager

## Support

If you encounter any issues or have suggestions, please [open an issue](https://github.com/yourusername/shark-eagle-sidebar/issues).

---

Made with ❤️ by the Shark Eagle team
