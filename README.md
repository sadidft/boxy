# Boxy

<p align="center">
  <img src="public/logo.svg" alt="Boxy Logo" width="120" height="120">
</p>

<p align="center">
  <strong>Your Offline Clipboard Manager</strong>
</p>

<p align="center">
  <a href="#features">Features</a> •
  <a href="#installation">Installation</a> •
  <a href="#usage">Usage</a> •
  <a href="#keyboard-shortcuts">Shortcuts</a> •
  <a href="#tech-stack">Tech Stack</a> •
  <a href="#license">License</a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/version-1.0.23-blue.svg" alt="Version">
  <img src="https://img.shields.io/badge/license-MIT-green.svg" alt="License">
  <img src="https://img.shields.io/badge/PWA-ready-blueviolet.svg" alt="PWA Ready">
  <img src="https://img.shields.io/badge/offline-100%25-success.svg" alt="Offline">
</p>

---

## 🎯 What is Boxy?

**Boxy** is a powerful, offline-first clipboard manager built for power users. It helps you organize text snippets, code templates, and canned responses in a hierarchical structure that's always available—even without an internet connection.

### Why Boxy?

- 🔒 **100% Offline** - Your data never leaves your device. Complete privacy guaranteed.
- ⚡ **Lightning Fast** - Zero network latency. Everything runs locally in your browser.
- 📝 **Markdown Ready** - Full Markdown support for rich text formatting.
- 🎨 **Chrome-like UI** - Familiar tab-based interface that feels native.
- ⌨️ **Keyboard First** - Complete keyboard navigation for power users.
- 📱 **PWA Support** - Install as a standalone app on any device.

---

## ✨ Features

### 📦 Hierarchical Organization

Boxy uses a three-level hierarchy to organize your content:

```
📦 Box (Workspace)
 └── 📁 Tab (Category)
      └── 📄 Card (Content)
```

- **Boxes**: Top-level containers like "Work", "Personal", or "Projects"
- **Tabs**: Categories within a box, like folders
- **Cards**: Individual snippets with Markdown content

### 🎯 Core Features

| Feature | Description |
|---------|-------------|
| **One-Click Copy** | Copy card content instantly with a single click |
| **Template Variables** | Use `{{name}}`, `{{date}}`, `{{time}}` for dynamic content |
| **Custom Variables** | Define your own variables that prompt for input when copying |
| **Search & Filter** | Find cards by text or filter by tags |
| **Tag System** | Organize cards with tags for easy discovery |
| **Pin Cards/Tabs** | Keep important items at the top |
| **Undo/Redo** | 7-step undo history for all actions |
| **Export/Import** | Backup and restore your data as JSON |
| **Dark/Light Theme** | System-aware theme with manual override |
| **Multi-Box View** | View multiple boxes simultaneously |

### 📊 Table Support

Cards can include tables with two modes:

1. **History Table**: Auto-records when a card was created, edited, or copied
2. **Custom Table**: Create your own tables with formula support

### 🧮 Formula System

Custom tables support powerful formulas:

| Category | Formulas |
|----------|----------|
| **Numeric** | `sum//all`, `avg//3`, `max//all`, `min//all`, `cnt//all`, `diff//1` |
| **Time** | `mnt//all`, `hrs//all`, `dur//all` (smart duration) |
| **Date** | `days//all`, `weeks//all` |
| **Special** | `last//1`, `first//1`, `pct//2`, `inc//1`, `streak//all` |

### 🔤 Template Variables

Use variables in your card content for dynamic replacement:

**Built-in Variables:**
- `{{date}}` - Current date (YYYY-MM-DD)
- `{{time}}` - Current time (HH:mm)
- `{{datetime}}` - Date and time combined
- `{{weekday}}` - Day name (Monday, Tuesday, etc.)
- `{{month}}` - Month name
- `{{year}}` - Current year
- `{{timestamp}}` - Unix timestamp
- `{{random}}` - Random 6-digit number
- `{{uuid}}` - Random UUID v4

**Custom Variables:**
Any other `{{variableName}}` will prompt for input when copying.

---

## 🚀 Installation

### Option 1: Use Online (Recommended)

Visit the hosted version and install as a PWA:

1. Open Boxy in your browser
2. Click the install icon in the address bar (or use browser menu)
3. Click "Install" to add Boxy to your device

### Option 2: Self-Host

```bash
# Clone the repository
git clone https://github.com/yourusername/boxy.git
cd boxy

# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

### Option 3: Docker

```bash
# Build and run with Docker
docker build -t boxy .
docker run -p 8080:80 boxy
```

---

## 📖 Usage

### Getting Started

1. **Create a Box**: Click "Create First Box" or press `Ctrl+B`
2. **Add a Tab**: Click the `+` button in the tab bar or press `Ctrl+T`
3. **Create Cards**: Click "New Card" or press `Ctrl+N`
4. **Copy Content**: Click the copy button or press `C` on a selected card

### Managing Content

- **Edit**: Click the edit button or press `E` on a selected card
- **Delete**: Click the trash icon or press `Delete`
- **Pin**: Click the pin icon or press `P` to pin cards/tabs
- **Search**: Press `Ctrl+K` to focus search, type to filter
- **Tags**: Add tags to cards for organization, filter with `tag:tagname`

### Multi-Box View

- **Minimize**: Click `—` to collapse a box to a bar
- **Maximize**: Click `□` to expand a box to full screen
- **Switch**: Click on any box header to make it active

---

## ⌨️ Keyboard Shortcuts

### Global

| Shortcut | Action |
|----------|--------|
| `Ctrl+K` | Focus search |
| `Ctrl+N` | New card |
| `Ctrl+T` | New tab |
| `Ctrl+B` | New box |
| `Ctrl+Z` | Undo |
| `Ctrl+Shift+Z` | Redo |
| `Ctrl+,` | Settings |
| `Escape` | Close modal / Clear search |
| `?` | Show shortcuts |

### Navigation

| Shortcut | Action |
|----------|--------|
| `Ctrl+1-9` | Switch to tab 1-9 |
| `Ctrl+Tab` | Next tab |
| `Ctrl+Shift+Tab` | Previous tab |
| `↑↓←→` | Navigate cards |
| `Tab` | Cycle through cards |
| `Enter` | Copy selected card |

### Card Actions

| Shortcut | Action |
|----------|--------|
| `C` | Copy card |
| `E` | Edit card |
| `P` | Toggle pin |
| `Delete` | Delete card |

---

## 🛠 Tech Stack

- **Frontend**: React 18 + TypeScript
- **Styling**: Tailwind CSS + CSS Variables
- **Build**: Vite
- **Storage**: localStorage (IndexedDB planned)
- **Icons**: Custom SVG (Lucide-style)

### Browser Support

| Browser | Support |
|---------|---------|
| Chrome | ✅ Full |
| Edge | ✅ Full |
| Firefox | ✅ Full |
| Safari | ✅ Full |
| Mobile Chrome | ✅ Responsive |
| Mobile Safari | ✅ Responsive |

---

## 📁 Project Structure

```
boxy/
├── public/
│   ├── logo.svg          # App logo
│   ├── manifest.json     # PWA manifest
│   └── sw.js             # Service worker
├── src/
│   ├── components/
│   │   ├── cards/        # Card components
│   │   ├── icons/        # SVG icons
│   │   ├── layout/       # Layout components
│   │   └── modals/       # Modal dialogs
│   ├── config/           # App configuration
│   ├── store/            # State management
│   ├── types/            # TypeScript types
│   ├── utils/            # Utility functions
│   ├── App.tsx           # Main app component
│   └── main.tsx          # Entry point
├── index.html
├── package.json
├── tailwind.config.js
├── tsconfig.json
└── vite.config.ts
```

---

## 🔐 Privacy

Boxy is designed with privacy as a core principle:

- ✅ **No tracking** - Zero analytics or telemetry
- ✅ **No network requests** - Works 100% offline
- ✅ **Local storage only** - Data stays on your device
- ✅ **No accounts** - No sign-up required
- ✅ **Open source** - Audit the code yourself

---

## 🤝 Contributing

Contributions are welcome! Please read our contributing guidelines before submitting a PR.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📜 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- Icons inspired by [Lucide Icons](https://lucide.dev)
- UI patterns inspired by Google Chrome
- Built with ❤️ for the developer community

---

<p align="center">
  <strong>Boxy</strong> - Your offline clipboard manager
  <br>
  <sub>Made with ❤️ by the community</sub>
</p>
