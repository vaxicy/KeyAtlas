# KeyAtlas 长期记忆

## 项目约定与用户偏好

### 快捷键数据来源规则
- 增加新软件或系统的快捷键时，**必须先搜索官网或网络核实**，优先采用官方文档（如 Adobe Help、Figma 帮助中心、Microsoft 支持页等）的真实数据。
- **禁止凭 AI 知识库凭空补全**关键键位——避免收录错误/不存在的快捷键。
- 若网页抓取受限（SPA / 超时 / 404），应在交付说明中明确标注「数据基于 AI 专业知识库编写，未经官网逐条核实」，不能自认为准确。
- 补全已有数据时同样适用：优先对照官方快捷键表，再补充缺失项。

### 数据文件结构
- 每个应用 = `data/shortcuts/<id>.json`（含 `pinyin` 字段，手写）+ `apps.json` 注册 1 条。
- **截图用完即删**：临时截图（CaptureX 等）完成核验/参考后立即删除，不留在项目目录里。
- `pinyin` 字段由 `npm run gen:pinyin`（`scripts/gen-pinyin.js`，依赖 `pinyin-pro`）自动生成，写入所有 shortcut JSON 文件。新增/修改 shortcut 数据后运行一次即可。
- 软件列表字母分组逻辑（`js/app.js`）：优先用 `a.sortKey[0]`，fallback 到 `a.name.en[0]`，再兜底 `#` 组。中文名应用**必须设 `sortKey` 且值为拼音首字母罗马化**（如 企业微信→Qiye→Q、剪映→Jianying→J），不能用汉字首字或英文名首字母（WeCom 的 W 是错的）。详见全局 user rule `apps-sortkey-pinyin-rule.md`。

## 快捷键数据来源核实状态（2026-07-14 更新）

共 **120 个**应用/系统条目。

| 来源 | 数量 | 说明 |
|------|------|------|
| `official` | 83 | 对照官方文档/截图逐条核实 |
| `community` | 10 | 社区整理版，非官方逐条验证 |
| `ai` | 27 | AI 专业知识库编写，未经官网逐条核实 |

分类分布：系统 4 / 浏览器 8 / 开发 25 / 设计 39 / 效率 26 / 视频 9 / 音频 8 / 其他 1

> 分类表 `data/categories.json` 含 8 类：system / browser / development / design / productivity / video / audio / ai / other。

### ✅ 官方核实（82 个）

**第一~三批（同前，79 个）：**（photoshop / illustrator / davinci / premiere / afterfx / lightroom / xd / indesign / acrobat / audition / vscode / excel / word / powerpoint / finalcut / edge / notion / chrome / github / todoist / chatgpt / macos / linux / capcut / windows / devtools / obsidian / cursor / blender / obs + gimp / inkscape / procreate / safari / androidstudio / spotify / raycast / audacity / teams / alfred / sketch / framer / canva / miro / mural / axure / invision / zeplin / principle / protopie / whimsical / lucidchart / abstract / jsdesign / mastergo / affinityphoto / affinitydesigner / affinitypublisher / intellij / webstorm / slack / outlook / gmail / googledocs / googlesheets / googleslides / feishu / dingtalk / wecom + pycharm / goland / clion / phpstorm / rider + vim / neovim / emacs / helix + keynote / pages / numbers）

**第四批（2026-07-14 联网复核 / 用户截图核验）：**
- `abletonlive.json`：web_fetch Ableton Live 12 官方手册 Section 41 全表，修正 3 处错误后升级
- `onenote.json`：对照用户提供的 Microsoft 365 官方截图（OneNote-1.png / OneNote-2.png）完全重写（55 条）
- `flstudio.json`：web_fetch FL Studio 官方快捷键页（image-line.com）逐条核实（19 条，official）

**第五批（2026-07-15 联网抓取，用户点名的高价值应用）**
- `airtable.json`：web_fetch 官方 support.airtable.com 逐条核实（34 条，**official**）。
- `webflow.json`：官方帮助中心 403 拦截，转 shortcutref（引官方），26 条，**community**。
- `datagrip.json` / `rubymine.json`：JetBrains 官方页只给 Windows/Linux 且不完整，转 shortcutref/keycombiner（均引官方 JetBrains keymap），32 / 79 条，**community**。
- `clickup.json`：官方 403，转 tutorialtactic 社区，33 条，**community**。
- `midjourney.json`：官方 Editor 页 403，转 shortcut-tools 社区（命令式：/imagine 等斜杠命令 + U/V 按钮 + 参数），15 条，**community**。
- 6 文件由 `scripts/import-batch-20260715.js` 生成后已删除脚本；`apps.json` 注册 6 条（airtable=official，其余=community）；`npm run gen:pinyin` 校验通过（6192 条）。

### ⚠️ 非官方来源标注（22 个）

| 来源类型 | 应用 |
|----------|------|
| `community`（18） | figma, firefox, acrobat, sublimetext, krita, clipstudio, xcode, arc, linear, figjam, discord, zoom, postman, webflow, midjourney, clickup, datagrip, rubymine |
| `ai`（27） | git, bilibili, logicpro, garageband, reaper, cubase, autocad, fusion360, sketchup, solidworks, substancepainter, houdini, unreal, unity, godot, visualstudio, eclipse, notepadplusplus, 3dsmax, rhino, brave, opera, vivaldi, confluence, studioone, protools, ios |

> **2026-07-14 末批**：官方文档补齐 15 个应用（unreal/unity/godot/visualstudio/eclipse/notepadplusplus/3dsmax/rhino/brave/opera/vivaldi/confluence/studioone/protools/ios）。环境网络受限（web 搜索不可用 + 多数官方页 SPA/403/超时），按规则以 AI 知识库编写、标 `ai`，未经官网逐条核实。校验 0 error。建议网络恢复后复核 Pro Tools 工具键、Rhino 功能键、Visual Studio 组合键。

> **2026-07-15 联网抓取批（6 个）**：用户要求补「有官方文档支持」的高价值应用。逐个尝试官方页均失败——Discord 官方 403、Zoom/Figma/Linear JS 渲染、Postman/Figma 404 改版、Xcode 官方存档仅目录页。转用社区整理源（tutorialtactic 的 Discord/Figma、shortcutref 的 Zoom/Postman/Linear、idevebi + Apple archive 的 Xcode），按规则统一标 `community`（非官方逐条核实）。其中 discord/zoom/postman 为新增（之前缺失），figma/linear/xcode 维持原 community。数据文件已存在（discord 26 / zoom 30 / postman 19 / figma 68 / linear 35 / xcode 41 条），apps.json 三处 source 由 official 降为 community，已跑 `npm run gen:pinyin` 校验通过。

> **2026-07-15 用户截图复核**：用户提供 13 张截图（Apple 官方 GarageBand / 知乎 REAPER / toopoo Fusion 360 / SolidWorks 表格 / SketchUp 文章 / Substance Painter 知乎 / Houdini 知乎 / AutoCAD 官方长表 / Autodesk 页面），对照后大幅补充修正：
> - **GarageBand**：+Stop(.) / Delete / Escape / Open Project，Apple 官方页核实
> - **REAPER**：+合并(Ctrl+J) / 垂直缩放(Page Up/Down) / 跳转位置(Ctrl+J)，知乎截图核实
> - **Fusion 360**：+Sketch/Dimension/Trim/Project/Hole/Joint/As-built/Inspect/ToggleVis/NormalConstruction/ComputeAll 共 12 项，Fit 改 Shift+F
> - **AutoCAD**：+Arc/Rectangle/Chamfer/Array/Stretch/ZoomAll/Open/Text/MText/Explode/MatchProp/SnapTrack/Grid 共 13 项
> - **SolidWorks**：+CutExtrude/Fillet/Shell/LinearPattern/CircularPattern/Loft/Revolve/Rib/HoleWizard/Sketch/Measure 共 11 项
> - **SketchUp**：+Arc/Polygon/Freehand 共 3 项
> - **Substance Painter**：+Eraser/Fill/LayerAdd 共 3 项
> - **Houdini**：+NetworkEditor/ParamEditor/DisplayFlag/RenderFlag/Layout 共 5 项
> - **Logic Pro / Cubase**：大截图超出内存未读入，保持原有数据不变
> 总快捷键数从 4960 增至 **5013**（+53 条）。校验 0 error。
> 这 10 个仍标 `source: ai`（截图含社区/知乎内容，非纯官方文档），但已比纯 AI 编写更可靠。
> 仍为删除状态（无官方文档、用户确认不可信）：Cinema 4D / Maya / ZBrush / Jira / Trello。

## 技术栈
- Chrome 扩展（Manifest V3），popup 单页应用。
- **预览方式**：可直接在 `chrome://extensions` 开启开发者模式 → 加载已解压的扩展程序，指向项目根目录预览，无需打包。
- 构建：`npm run gen:pinyin`（依赖 `pinyin-pro`）生成 pinyin 字段。
- 入口：`popup.html` + `js/app.js`（渲染/分组/排序）+ `js/search.js`（搜索排序）+ `css/style.css`。
- 双语：`_locales/zh`、`_locales/en` + JS 内 `I18N` 对象；动态文本走翻译对象，禁止硬编码。

### Web 端（Cloudflare Pages，Vite + React + TS）
- 源码 `web/src/`，构建在 `web/` 下 `npm run build`（tsc -b && vite build && node scripts/gen-static-pages.ts）。
- **数据架构（codex 2026-07-17 改）**：原单一 `web/public/data/all.json` 已拆分为 `web/public/data/shortcuts/<id>.json`（153 个应用各一文件）+ `apps.json` + `search.json`。改 shortcut 数据后需重新 `npm run build` 才会重新生成静态页与 `all.json` 等价产物。
- 静态 SEO 页由 `web/scripts/gen-static-pages.ts` 在 build 时生成（153 apps + 9 categories），输出到 `web/dist`。
- 部署：`cd web && npx wrangler pages deploy dist --project-name keyatlas`，免费子域 `keyatlas.pages.dev`（用户决定暂不上自定义域名）。
- **前端 hover/focus 视觉一律用纯 CSS**（见全局 user rule `hover-use-css-not-js-RULE.md`），禁止用 JS state 切换 inline style。

### 版本号同步规则（2026-07-17 确认）
- **更新版本号时必须同步修改以下 4 处**，缺一不可：
  1. `manifest.json` → `"version": "x.y.z"`（Chrome 商店识别）
  2. `package.json` → `"version": "x.y.z"`（npm 包版本）
  3. `js/app.js` → `const VERSION = "x.y.z";`（扩展内「关于」弹窗引用此常量显示版本号）
  4. `popup.html` → `<span id="aboutVersion">Version x.y.z</span>`（关于弹窗 fallback 文本，与 app.js VERSION 保持一致）
- 当前版本：**1.1.0**（2026-07-17 升级，用于首次上架 Chrome 商店）

### 自动部署规则
- **每次代码改动后必须自动 deploy 到 Cloudflare Pages**，否则用户在网页端看不到最新改动。
- **生产域名是 `keyatlas.pages.dev`**，部署命令必须带 `--branch=main`：
  ```
  cd web && npx wrangler pages deploy dist --project-name keyatlas --branch=main --commit-dirty=true
  ```
- 不带 `--branch=main` 只会部署到预览分支（`master.keyatlas.pages.dev`），用户访问的生产域名不会更新！

### 网页端-扩展端语言同步约定（2026-07-17 确认）
- **两端默认语言检测均为 `navigator.language`（浏览器语言 = 第一语言）**，仅当用户显式更改后才用 localStorage 存储值。
- **网页端语言跟随扩展端**：因扩展与网页不同源、无法共享 localStorage，采用「打开链接带 `?lang=`」方案——
  - 扩展 `js/app.js` 打开网页版时：`chrome.tabs.create({ url: \`https://keyatlas.pages.dev/?lang=${i18n.lang}\` })`。
  - 网页端 `web/src/i18n.ts` `detectLang()` 读到有效 `?lang=` 时写回 `localStorage('keyatlas-lang')`，使跟随持久化。
- 限制：仅在「从扩展打开网页」时跟随；用户直接在浏览器访问 `keyatlas.pages.dev` 仍按网页自身逻辑（浏览器语言 / 网页端已存设置）。跨源无法做到扩展改语言后已打开网页实时自动同步（需 chrome.runtime 通信，过重，不采用）。
