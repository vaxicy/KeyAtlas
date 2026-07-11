# KeyAtlas – Shortcut Search Engine

A lightweight Manifest V3 Chrome extension that lets you instantly find
keyboard shortcuts for your OS and popular apps. Bilingual (English / 中文),
fully offline, JSON-driven, no backend, no login.

## Features

- **Search** – fuzzy, weighted search over action name, description, keywords,
  app name and the key combos themselves (both languages).
- **Categories** – browse System / Browser / Design / Development /
  Productivity / Video / AI / Other, then drill into apps.
- **Favorites** – star any shortcut; stored in `chrome.storage.local`.
- **Recent** – last 50 viewed shortcuts.
- **Auto OS detection** – automatically shows Windows / macOS / Linux keys,
  switchable in Settings.
- **Bilingual** – EN / 中文, priority: `?lang=` URL param > localStorage >
  browser language.
- **Light / Dark theme**.
- Click a card to copy its shortcut to the clipboard.

## Load the extension

1. Open `chrome://extensions`.
2. Enable **Developer mode** (top-right).
3. Click **Load unpacked** and select this `KeyAtlas` folder.
4. Pin the KeyAtlas icon and open the popup.

## Project structure

```
manifest.json          # MV3 manifest
popup.html             # popup UI
css/style.css          # styles (light + dark)
js/
  i18n.js              # bilingual strings + language detection
  storage.js           # chrome.storage.local wrapper (localStorage fallback)
  data.js              # loads & indexes JSON data
  search.js            # weighted search engine
  app.js               # main controller (tabs, events, rendering)
data/
  categories.json
  apps.json
  shortcuts/           # one JSON file per app/system
    windows.json macos.json linux.json chrome.json devtools.json
    figma.json photoshop.json illustrator.json blender.json
    vscode.json git.json github.json excel.json word.json
    powerpoint.json notion.json
icons/                 # 16 / 48 / 128 px icons
```

## Adding shortcuts

1. Add (or edit) a file under `data/shortcuts/`.
2. Register the app in `data/apps.json` with its `file`, `category` and icon.

Each shortcut object:

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

The same JSON data is designed to be reused by the future public website.
