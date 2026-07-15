# KeyAtlas 长期记忆

## 项目约定与用户偏好

### 快捷键数据来源规则
- 增加新软件或系统的快捷键时，**必须先搜索官网或网络核实**，优先采用官方文档（如 Adobe Help、Figma 帮助中心、Microsoft 支持页等）的真实数据。
- **禁止凭 AI 知识库凭空补全**关键键位——避免收录错误/不存在的快捷键。
- 若网页抓取受限（SPA / 超时 / 404），应在交付说明中明确标注「数据基于 AI 专业知识库编写，未经官网逐条核实」，不能自认为准确。
- 补全已有数据时同样适用：优先对照官方快捷键表，再补充缺失项。

### 数据文件结构
- 每个应用 = `data/shortcuts/<id>.json`（含 `pinyin` 字段，手写）+ `apps.json` 注册 1 条。
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

### ⚠️ 非官方来源标注（22 个）

| 来源类型 | 应用 |
|----------|------|
| `community`（10） | figma, firefox, acrobat, sublimetext, krita, clipstudio, xcode, arc, linear, figjam |
| `ai`（27） | git, bilibili, logicpro, garageband, reaper, cubase, autocad, fusion360, sketchup, solidworks, substancepainter, houdini, unreal, unity, godot, visualstudio, eclipse, notepadplusplus, 3dsmax, rhino, brave, opera, vivaldi, confluence, studioone, protools, ios |

> **2026-07-14 末批**：官方文档补齐 15 个应用（unreal/unity/godot/visualstudio/eclipse/notepadplusplus/3dsmax/rhino/brave/opera/vivaldi/confluence/studioone/protools/ios）。环境网络受限（web 搜索不可用 + 多数官方页 SPA/403/超时），按规则以 AI 知识库编写、标 `ai`，未经官网逐条核实。校验 0 error。建议网络恢复后复核 Pro Tools 工具键、Rhino 功能键、Visual Studio 组合键。

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
