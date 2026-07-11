# KeyAtlas PRD (MVP)

## Product Positioning

**KeyAtlas** is a cross-platform shortcut search engine that helps users
instantly find keyboard shortcuts for operating systems and popular
software.

### Platforms

-   Chrome Extension (Popup)
-   Public Website (future)

## Goals

-   Search shortcuts in seconds
-   Support Windows, macOS and common software
-   Bilingual (Chinese / English)
-   Lightweight, modern UI

## MVP Features

### 1. Search

Search by: - Action (Copy, Paste, Screenshot...) - Software (Figma, VS
Code...) - Keywords (duplicate, undo...)

### 2. Categories

-   System
-   Browser
-   Design
-   Development
-   Productivity
-   Video
-   AI Tools
-   Other

### 3. Systems

Priority: - Windows - macOS - Linux (basic)

### 4. Software (Phase 1)

-   Chrome
-   Figma
-   Photoshop
-   Illustrator
-   Blender
-   VS Code
-   Git
-   GitHub
-   Chrome DevTools
-   Excel
-   Word
-   PowerPoint
-   Notion

### 5. Popup

Top: - Logo - Search - Settings

Tabs: - Search - Categories - Favorites - Recent

### 6. Favorites

Store in chrome.storage.local

### 7. Recent

Store latest 50 viewed shortcuts.

### 8. Auto Detect

Detect current OS and prioritize corresponding shortcut.

### 9. UI

-   Modern
-   Minimal
-   Rounded cards
-   Soft shadow
-   Flat design
-   Popup width 360--400px

### 10. Data Structure

    data/
      apps.json
      categories.json
      shortcuts/
        windows.json
        macos.json
        chrome.json
        figma.json
        vscode.json

Each shortcut:

``` json
{
  "id":"windows-copy",
  "appId":"windows",
  "type":"system",
  "name":{"zh":"复制","en":"Copy"},
  "description":{
    "zh":"复制当前内容",
    "en":"Copy selected content"
  },
  "windows":"Ctrl+C",
  "mac":"⌘+C",
  "linux":"Ctrl+C",
  "keywords":["复制","copy"]
}
```

## Future Website

-   SEO pages
-   Public shortcut library
-   AdSense
-   Same JSON data shared with extension

## Future Features

-   Cloud sync
-   User accounts
-   Custom shortcut collections
-   Learning mode
-   Team workspace

## AI Development Prompt (Summary)

Build a Manifest V3 Chrome Extension called **KeyAtlas**.

Requirements: - Vanilla JS - HTML/CSS - No backend - No login -
Bilingual - Modular architecture - JSON-driven shortcut data - Search
engine experience - Favorites & Recent using chrome.storage.local - Auto
OS detection - Ready to share data with future website.
