# KeyAtlas – Shortcut Search Engine

<div align="center">

![KeyAtlas](icons/icon-128.png)

**离线、即时、跨平台的快捷键搜索引擎**

[English](#) · [中文](#)

[![Chrome Web Store](https://img.shields.io/badge/Chrome_Web_Store-4285F4?logo=google-chrome&logoColor=fff)](https://chromewebstore.google.com/detail/keyatlas/bkiplkbfihgaoodnhbpegjanncojhikn)
[![Manifest V3](https://img.shields.io/badge/MV3-FF5722)](#)
[![License: Non-Commercial](https://img.shields.io/badge/License-Non--Commercial-red)](#)

</div>

---

## Overview

**KeyAtlas** is an offline Chrome extension (Manifest V3) for looking up keyboard shortcuts: system, browsers, design tools, IDEs, office suites and more. Everything ships with the extension, so no internet connection and no backend server are involved.

Bilingual (English / 中文). Covers Windows, macOS and Linux.

---

## Features

### 🔍 Search
- Fuzzy, weighted search across **7,900+ shortcuts** (228 apps/systems)
- Matches by: action name, description, keywords, app name, pinyin, key combo
- Cross-language synonym expansion (e.g., "复制" finds "Copy", "screenshot" finds "截图")
- `@appname` syntax to jump directly to an app's shortcuts
- **Omnibox**: type `ka <search>` in the address bar to search instantly
- **Keyboard navigation**: ↑↓ to move, Enter to view details, Esc to clear

### 📂 Browse by Categories
- 9 categories: System, Browser, Design, Development, Productivity, Video, Audio, AI Tools, Other
- Drill down from category → app → specific shortcuts

### ⭐ Favorites & Recent
- Star any shortcut for quick access
- Organize and export favorites as Markdown tables
- Automatic "Recent" history (last 50 items)
- **Incognito mode** to disable history tracking

### 🌐 Bilingual Interface
- Full UI in English and 中文
- Language priority: `?lang=` URL parameter > localStorage > browser language
- Switch the language from Settings

### 🎨 Theme
- Light and dark themes with an OS-preference option
- The same theme system as the web version, applied to every view

### 📋 Quick Copy
- Click a shortcut card to copy the combo for your OS
- The detail drawer lists Windows, macOS and Linux side by side
- Copy any platform's combo from the drawer

---

## Coverage

| Category | Count | Examples |
|----------|-------|---------|
| System | 5 | Windows, macOS, Linux, ChromeOS, iOS/iPadOS |
| Browser | 8 | Chrome, Edge, Firefox, Safari, Brave, Opera, Vivaldi, Arc |
| Development | 49 | VS Code, IntelliJ IDEA, Vim, Git, Docker, Postman, Android Studio, JetBrains ×7 |
| Design | 55 | Photoshop, Figma, Illustrator, Blender, Sketch, Canva, DaVinci Resolve, Affinity ×3 |
| Productivity | 59 | Excel, Word, PowerPoint, Notion, Obsidian, Todoist, Gmail, Google Docs, Slack, Teams, Outlook, 飞书, 钉钉, 企业微信 |
| Video | 16 | Premiere Pro, After Effects, Final Cut Pro, 剪映, OBS Studio |
| Audio | 13 | Ableton Live, Logic Pro, FL Studio, Audition, Audacity, GarageBand, Cubase |
| AI Tools | 20 | ChatGPT, Midjourney |
| Other | 3 | MATLAB, 哔哩哔哩, and more |

> **228 apps, 7,900+ shortcuts** — and growing.

---

## Data Sources

Shortcut data is sourced from official documentation where available, community references, and AI-compiled knowledge bases. Each data file is labeled with its source reliability (`official` / `community` / `ai`). See `data/apps.json` for per-app source annotations.

---

## Install

### Chrome Web Store
👉 [**Install from Chrome Web Store**](https://chromewebstore.google.com/detail/keyatlas/bkiplkbfihgaoodnhbpegjanncojhikn)

### Developer Mode (Manual Load)
1. Clone or download this repository.
2. Open `chrome://extensions`.
3. Enable **Developer mode** (top-right corner).
4. Click **Load unpacked** and select the `KeyAtlas` folder.
5. Pin the KeyAtlas icon to your toolbar.

**Default keyboard shortcut**: `Ctrl+Shift+K` (Windows/Linux) / `⌘+Shift+K` (macOS)

---

## Project Structure

```
KeyAtlas/
├── manifest.json              # MV3 Extension manifest
├── popup.html                 # Popup UI (single-page app)
├── package.json               # Node.js dev scripts
├── css/
│   └── style.css              # Light + Dark theme styles
├── js/
│   ├── i18n.js                # Bilingual strings & language detection
│   ├── storage.js             # chrome.storage.local (with localStorage fallback)
│   ├── data.js                # Data loader & indexer
│   ├── search.js              # Weighted fuzzy search engine
│   ├── app.js                 # Main controller (tabs, events, rendering)
│   └── background.js          # Service Worker (Omnibox support)
├── data/
│   ├── categories.json        # Category definitions
│   ├── apps.json              # App registry (228 entries)
│   ├── search.json            # Precompiled search index
│   └── shortcuts/             # 228 per-app shortcut JSON files
├── _locales/en/               # Chrome Web Store i18n messages
├── icons/                     # Extension icons
├── scripts/
│   ├── gen-pinyin.js          # Generate pinyin index for Chinese search
│   ├── validate-data.js       # Validate data structure integrity
│   └── gen-icons.js           # Generate extension icons
├── web/                       # Public website (Vite + React + TypeScript)
│   ├── src/                   # React app source
│   ├── scripts/               # Static SEO page generation
│   └── dist/                  # Built site (Cloudflare Pages)
├── store-assets/              # Chrome Web Store listing assets
└── LICENSE                    # Non-Commercial License
```

---

## Development

### Prerequisites
- Node.js 18+
- npm

### Setup
```bash
npm install
```

### Scripts
| Command | Description |
|---------|-------------|
| `npm run gen:pinyin` | Generate pinyin index for all shortcut data |
| `npm run validate:data` | Validate all JSON data files |
| `npm run gen:icons` | Generate extension icons from source images |

### Adding Shortcuts
1. Add or edit a JSON file under `data/shortcuts/`.
2. Register the app in `data/apps.json` with its `file`, `category`, and icon.
3. Run `npm run gen:pinyin` to update the search index.

Each shortcut object follows this schema:
```json
{
  "id": "windows-copy",
  "appId": "windows",
  "type": "system",
  "category": "system",
  "name": { "zh": "复制", "en": "Copy" },
  "description": { "zh": "复制选中的内容", "en": "Copy selected content" },
  "windows": "Ctrl+C",
  "mac": "⌘+C",
  "linux": "Ctrl+C",
  "keywords": ["复制", "copy"]
}
```

---

## Public Website

KeyAtlas also has a **public website** at [keyatlas.pages.dev](https://keyatlas.pages.dev), built with:

- **Vite + React + TypeScript**
- **Cloudflare Pages** deployment
- Static SEO pages for every app and category
- Same JSON data backend as the extension

```bash
cd web
npm install
npm run build    # tsc → vite build → static pages generation
npx wrangler pages deploy dist --project-name keyatlas --branch=main
```

---

## Technologies

- **Chrome Extension Manifest V3**
- **Vanilla JavaScript** (extension) / **React + TypeScript** (website)
- **JSON-driven** data architecture (no database, no backend)
- **Cloudflare Pages** for web hosting
- **pinyin-pro** for Chinese search indexing

---

## License

This project is licensed under the **Non-Commercial License**. See [LICENSE](./LICENSE) for details.

For commercial use, please contact the author.

---

## Author

**vaxicy**

- GitHub: [@vaxicy](https://github.com/vaxicy)
- Chrome Web Store: [KeyAtlas](https://chromewebstore.google.com/detail/keyatlas/bkiplkbfihgaoodnhbpegjanncojhikn)

---

*KeyAtlas — an offline shortcut atlas for 228 apps.*
