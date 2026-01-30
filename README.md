# Boxy - Your Offline Clipboard Manager

![Boxy Logo](https://img.shields.io/badge/Boxy-1.0.23-blue)
![License](https://img.shields.io/badge/License-MIT-green)
![Offline](https://img.shields.io/badge/100%25-Offline-red)
![Size](https://img.shields.io/badge/Single%20File-~300KB-purple)

**Boxy** adalah aplikasi manajemen clipboard berbasis Markdown yang berjalan 100% offline dalam satu file HTML. Dirancang untuk power users, developers, dan penulis teknis yang membutuhkan akses cepat ke snippet dan teks yang sering digunakan.

---

## 🚀 Fitur Utama

### 📁 Hierarki Organisasi yang Intuitif
```
BOXY = Lemari Arsip Digital
│
├── BOX = Profil / Workspace (seperti Chrome Profile)
│   │
│   ├── TAB = Kategori dalam profil (seperti Chrome Tab)
│   │   │
│   │   ├── CARD = Konten/Snippet
│   │   ├── CARD
│   │   └── CARD
│   │
│   ├── TAB
│   └── TAB
│
├── BOX
└── BOX
```

### ✨ Fitur Unggulan
- **100% Offline** - Semua data disimpan di `localStorage` browser Anda
- **Single File** - Seluruh aplikasi dalam 1 file HTML (~300KB)
- **Zero Dependencies** - Murni Vanilla JS, CSS3, HTML5
- **Privacy by Design** - Data tidak pernah keluar dari browser Anda
- **Chrome-like UI** - 89% mirip Chrome browser untuk familiarity maksimal
- **Keyboard-First UX** - Shortcut keyboard untuk semua aksi utama

---

## 🎨 UI & UX

### Tampilan Utama
```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│  ┌─────────────────────────────────────────────────────────┬─────────────┐  │
│  │                        TAB BAR                          │   WINDOW    │  │
│  │  [icon Tab1] [icon Tab2] [icon Tab3] [icon Tab4] [+]   │   CONTROLS  │  │
│  │                                                         │  [—] [□] [×]│  │
│  └─────────────────────────────────────────────────────────┴─────────────┘  │
│                                                                             │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │                          ADDRESS BAR                                  │  │
│  │  [◄] [►]  │  Box Name > Tab Name          │  [⭐]  [●]  [⋮]         │  │
│  │           │  🔍 Search cards...            │                          │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │                                                                       │  │
│  │                         CONTENT AREA                                  │  │
│  │                        (Cards Grid - Masonry)                         │  │
│  │                                                                       │  │
│  │                                                                       │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Sistem Tema
- **Dark Mode** (Default) - Warna gelap yang nyaman di mata
- **Light Mode** - Alternatif terang
- **System Detection** - Otomatis mengikuti tema sistem operasi

### Responsive Design
- **Mobile** (< 640px) - 1 kolom kartu
- **Tablet** (640-1024px) - 2 kolom kartu
- **Desktop** (1024-1440px) - 3 kolom kartu
- **Wide** (> 1440px) - 4 kolom kartu

---

## 🃏 Sistem Kartu (Cards)

### Anatomi Kartu
```
┌────────────────────────────────────────────────────────────────┐
│                                                                │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ [drag]  Email Template                            [pin] │  │ ← HEADER
│  └──────────────────────────────────────────────────────────┘  │
│                                                                │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ Dear {{name}},                                          │  │ ← CONTENT
│  │ Thank you for **reaching out**.                         │  │   (markdown)
│  └──────────────────────────────────────────────────────────┘  │
│                                                                │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ [#work]  [#email]  [#template]                          │  │ ← TAGS
│  └──────────────────────────────────────────────────────────┘  │
│                                                                │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ [Copy] [Edit] [Delete]                                  │  │ ← ACTIONS
│  │ 42× copied • 2 hours ago                                │  │ ← STATS
│  └──────────────────────────────────────────────────────────┘  │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

### Fitur Kartu
- **Markdown Support** - Format teks lengkap
- **Variable Templates** - `{{name}}`, `{{date}}`, `{{clipboard}}`, dll
- **Tabel dalam Kartu** - Mode history otomatis atau custom table
- **Formula** - `sum//all`, `avg//3`, `mnt//2`, dll
- **Pin System** - Kartu penting selalu di atas
- **Drag & Drop** - Urutkan kartu dengan drag
- **Copy Count** - Lacak berapa kali dicopy
- **History** - Catat perubahan (max 4 entri)

---

## ⌨️ Keyboard Shortcuts

### Global Shortcuts
| Shortcut | Action |
|----------|--------|
| `Ctrl/Cmd + K` | Fokus ke search bar |
| `Ctrl/Cmd + N` | Buat kartu baru |
| `Ctrl/Cmd + T` | Buat tab baru |
| `Ctrl/Cmd + B` | Buat box baru |
| `Ctrl/Cmd + Z` | Undo |
| `Ctrl/Cmd + Shift + Z` | Redo |
| `Ctrl/Cmd + ,` | Buka settings |
| `Escape` | Tutup modal / Clear search |
| `?` | Tampilkan semua shortcuts |

### Navigation
| Shortcut | Action |
|----------|--------|
| `Ctrl/Cmd + 1-9` | Pindah ke tab 1-9 |
| `Ctrl/Cmd + Tab` | Tab berikutnya |
| `Ctrl/Cmd + Shift + Tab` | Tab sebelumnya |
| `Arrow Up/Down` | Navigasi kartu (saat search) |
| `Enter` | Copy kartu yang di-highlight |

### Card Actions
| Shortcut | Action |
|----------|--------|
| `C` | Copy kartu terpilih |
| `E` | Edit kartu terpilih |
| `Delete` | Hapus kartu terpilih |
| `P` | Toggle pin kartu |

---

## 🔢 Formula System

### Format
```
type//range

Contoh:
├── sum//all   → jumlah semua nilai di kolom
├── sum//3     → jumlah 3 nilai terakhir
├── avg//all   → rata-rata semua
├── mnt//2     → selisih menit dari 2 baris di atas
└── dur//all   → total durasi semua
```

### Kategori Formula
1. **Time Formulas** - `mnt//N`, `hrs//N`, `sec//N`, `dur//N`
2. **Numeric Formulas** - `sum//N`, `avg//N`, `max//all`, `min//all`
3. **Date Formulas** - `days//N`, `weeks//all`
4. **Special Formulas** - `last//N`, `first//N`, `pct//N`, `streak//all`

---

## 📋 Variable Templates

### Built-in Variables (Auto-replaced)
| Variable | Output | Contoh |
|----------|--------|---------|
| `{{date}}` | Tanggal saat ini (YYYY-MM-DD) | 2024-01-26 |
| `{{time}}` | Waktu saat ini (HH:mm) | 14:30 |
| `{{datetime}}` | Tanggal + waktu | 2024-01-26 14:30 |
| `{{random}}` | 6 digit acak | 847291 |
| `{{uuid}}` | Random UUID | a1b2c3d4-e5f6-... |
| `{{clipboard}}` | Isi clipboard saat ini | (bervariasi) |

### Custom Variables (Memerlukan Input User)
```
Konten: "Dear {{name}}, your order {{order_id}} is ready."

Saat copy:
├── Detect custom variables: name, order_id
├── Tampilkan Variable Input Modal
├── User mengisi: name = "John", order_id = "12345"
└── Output: "Dear John, your order 12345 is ready."
```

---

## 🔍 Search & Filter

### Fitur Pencarian
- **Full-text search** - Cari di title dan content
- **Tag filtering** - `[tag:work ×]` untuk filter berdasarkan tag
- **Highlight results** - Hasil pencarian di-highlight
- **Live search** - Hasil update real-time

### Contoh Pencarian
```
Search: "email template"
Results: Kartu yang mengandung "email" atau "template"

Search: "email [tag:work]"
Results: Kartu dengan "email" DAN tag "work"
```

---

## ⚙️ Settings & Limits

### Default Limits
| Entity | Default Limit | Bypass? |
|--------|---------------|---------|
| Box | 10 | Ya |
| Tab per Box | 12 | Ya |
| Card per Tab | 50 | Ya |
| Column per Table | 10 | Ya |
| History per Card | 4 | Tidak |
| Undo Steps | 7 | Tidak |

### Bypass Mechanism
User dapat mengaktifkan bypass semua limit melalui Settings → Advanced Settings.

**Warning:** Bypassing limits may cause performance issues.

---

## 📁 Struktur Data

### Model Data Utama
```
STATE (Global Container)
├── settings          → Pengaturan aplikasi
├── boxes[]           → Array of Box entities
├── tabs[]            → Array of Tab entities  
├── cards[]           → Array of Card entities
├── allTags[]         → Registry semua tag yang ada
├── actionHistory[]   → Undo stack (max 7 actions)
└── actionFuture[]    → Redo stack
```

### Relasi Entity
```
                    ┌───────────┐
                    │  SETTINGS │
                    └───────────┘
                          │
                    (app-level)
                          │
    ┌─────────────────────┼─────────────────────┐
    │                     │                     │
    ▼                     ▼                     ▼
┌───────┐  1      *  ┌───────┐  1      *  ┌───────┐
│  BOX  │───────────▶│  TAB  │───────────▶│ CARD  │
└───────┘            └───────┘            └───────┘
    │                    │                    │
    │                    │                    ├── history[]
    │                    │                    └── table{}
    │                    │
    │                    └── pinned tabs muncul di awal
    │
    └── active box menentukan tabs yang tampil
```

---

## 🗃️ Export & Import

### Format Export
```
File: boxy_export_2024-01-26.json
{
  "_meta": { "app": "Boxy", "version": "1.0.23", ... },
  "settings": { ... },
  "boxes": [ ... ],
  "tabs": [ ... ],
  "cards": [ ... ],
  "allTags": [ ... ]
}
```

### Opsi Export
1. **Export All Data** - Semua boxes, tabs, cards, dan settings
2. **Current Box Only** - Hanya box aktif beserta tabs dan cards-nya

### Import Validation
1. Validasi format JSON
2. Cek versi kompatibilitas
3. Validasi integritas data
4. Konfirmasi user
5. Eksekusi import

---

## 🎯 Arsitektur Teknis

### 4-Layer System
```
LAYER 1: PRESENTATION
├── Tab Bar, Address Bar, Content Area
├── Modals, Tooltips, Toast Notifications
└── UI Components

LAYER 2: APPLICATION
├── Event Dispatcher, State Machine
├── Modal Controller, Keyboard Handler
├── Drag & Drop Coordinator
└── Undo/Redo Manager

LAYER 3: DOMAIN
├── CRUD Operations (Box, Tab, Card)
├── Markdown Parser, Formula Evaluator
├── Variable Template Processor
├── Search & Filter Engine
└── Tag Manager

LAYER 4: PERSISTENCE
├── localStorage Adapter
├── JSON Serialization/Deserialization
├── Schema Versioning & Migration
└── Export/Import Handler
```

### Struktur File
```
boxy.html (single file)
│
├── <head>
│   ├── Meta tags
│   ├── <style> ─── All CSS (embedded)
│   └── Favicon (inline SVG/base64)
│
├── <body>
│   ├── #app ─── Main container
│   │   ├── .tab-bar
│   │   ├── .address-bar
│   │   └── .content-area
│   │
│   ├── #modal-container ─── Modal portal
│   ├── #toast-container ─── Toast portal
│   └── #tooltip-container ─── Tooltip portal
│
└── <script> ─── All JavaScript (embedded)
    │
    ├── // ===== CONFIG & CONSTANTS =====
    ├── // ===== STATE MANAGEMENT =====
    ├── // ===== UTILITIES =====
    ├── // ===== CRUD OPERATIONS =====
    ├── // ===== PARSERS =====
    ├── // ===== RENDER FUNCTIONS =====
    ├── // ===== UI COMPONENTS =====
    ├── // ===== EVENT HANDLERS =====
    ├── // ===== UNDO/REDO =====
    ├── // ===== EXPORT/IMPORT =====
    └── // ===== INIT =====
```

---

## 🚀 Cara Menggunakan

### 1. Memulai
1. Buka `boxy.html` di browser
2. Aplikasi langsung berjalan (tidak perlu instalasi)
3. Data otomatis tersimpan di localStorage browser

### 2. Membuat Struktur Pertama
1. Klik **Create Box** (atau tekan `Ctrl/Cmd + B`)
2. Pilih icon dan beri nama (misal: "Work")
3. Klik **Create Tab** (atau tekan `Ctrl/Cmd + T`) di dalam box
4. Beri nama tab (misal: "Code Snippets")
5. Klik **Create Card** (atau tekan `Ctrl/Cmd + N`) di dalam tab

### 3. Workflow Umum
1. **Menambahkan konten** - Buat card baru, isi dengan markdown
2. **Menggunakan variable** - Gunakan `{{date}}`, `{{name}}`, dll
3. **Menambahkan tag** - Gunakan format `#tagname` untuk organisasi
4. **Mencari konten** - Tekan `Ctrl/Cmd + K` untuk fokus search
5. **Copy ke clipboard** - Klik tombol Copy atau tekan `C`
6. **Mengedit konten** - Klik Edit atau tekan `E`

### 4. Tips Produktivitas
- Gunakan **keyboard shortcuts** untuk aksi cepat
- **Pin** tab/kartu penting untuk akses cepat
- Gunakan **table formulas** untuk tracking data
- Ekspor data reguler sebagai **backup**
- Atur **limits** sesuai kebutuhan

---

## 🔧 Development Notes

### Teknologi yang Digunakan
- **Frontend**: Vanilla JavaScript, CSS3, HTML5
- **Storage**: localStorage dengan JSON serialization
- **Icons**: 200+ inline SVG icons (Lucide/Feather style)
- **Markdown**: Custom parser (mendukung semua fitur umum)
- **Build**: Vite dengan vite-plugin-singlefile

### Browser Compatibility
- Chrome/Edge (last 2 versions) ✓ Full support
- Firefox (last 2 versions) ✓ Full support
- Safari (last 2 versions) ✓ Full support
- Mobile Chrome/Safari ✓ Responsive support

### Performance Optimizations
- Selective rendering (hanya komponen yang berubah)
- Debouncing untuk search dan resize
- Lazy operations untuk heavy computations
- Memory management dengan limits
- Selective serialization untuk storage

---

## 📞 Support & Feedback

### Issue Reporting
Jika menemukan bug atau memiliki saran fitur:
1. Cek apakah issue sudah ada di daftar
2. Jelaskan dengan detail (browser, OS, steps to reproduce)
3. Sertakan screenshots jika memungkinkan

### Feature Requests
Boxy dirancang untuk tetap sederhana dan fokus. Fitur yang TIDAK akan ditambahkan:
- Diagram/Mermaid support
- Cross-container drag & drop
- Cloud sync
- Real-time collaboration
- External dependencies

---

## 📄 License

MIT License - Bebas digunakan, dimodifikasi, dan didistribusikan.

---

## 🔮 Roadmap (Potential Future Features)

### Prioritized
1. Card templates (reusable card structures)
2. Advanced search operators (AND, OR, NOT)
3. Bulk operations (select multiple cards)
4. Card linking/references

### Under Consideration
1. Local file attachment support
2. Advanced statistics/analytics
3. Plugin system (very lightweight)
4. Custom CSS themes

### Not Planned
1. Cloud sync/backup
2. Real-time collaboration
3. External integrations
4. Mobile apps (tetap berbasis web)

---

## 🎉 Credits

Dibuat dengan ❤️ untuk komunitas power users, developers, dan penulis teknis yang menghargai privasi, kemandirian, dan efisiensi.

**Boxy** - Your offline clipboard manager. Simple, fast, and always there when you need it.

---

```
╔═══════════════════════════════════════════════════════════════════╗
║                                                                   ║
║                    BOXY v1.0.23                                   ║
║                                                                   ║
║              Your Offline Clipboard Manager                       ║
║                                                                   ║
║            Ready to boost your productivity!                      ║
║                                                                   ║
╚═══════════════════════════════════════════════════════════════════╝
```

---

**Mulai menggunakan Boxy sekarang:** Buka `boxy.html` di browser favorit Anda!
