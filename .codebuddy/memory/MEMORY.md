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

共 **102 个**应用/系统条目。

| 来源 | 数量 | 说明 |
|------|------|------|
| `official` | 80 | 对照官方文档/截图逐条核实 |
| `community` | 10 | 社区整理版，非官方逐条验证 |
| `ai` | 12 | AI 专业知识库编写，未经官网逐条核实（见下方） |

分类分布：系统 3 / 浏览器 5 / 开发 19 / 设计 34 / 效率 27 / 视频 9 / 音频 4 / 其他 1

> 分类表 `data/categories.json` 含 8 类：system / browser / development / design / productivity / video / audio / ai / other。

### ✅ 官方核实（79 个）

**第一批（原 34 个，2026-07-13 逐条核实）：**
- `photoshop.json` / `illustrator.json`：用户给的官方截图
- `davinci.json`：用户给的 Google 整理版截图
- `premiere.json`（75 条）/ `afterfx.json`（85 条）：对照官方截图重写
- `lightroom.json`（65 条）/ `xd.json`（55 条）/ `indesign.json`（79 条）：对照官方截图重写
- `acrobat.json`（42 条）/ `audition.json`（52 条）：对照截图重写
- `vscode.json`（49 条）：对照微软官方 Windows 快捷键截图重写
- `excel.json`（60 条）/ `word.json`（60 条）/ `powerpoint.json`（60 条）：对照微软支持页核实
- `finalcut.json`（66 条）：对照 Apple 官方支持页截图核实
- `edge.json`（38 条）：对照微软官方双平台截图重写
- `notion.json`（42 条）：对照 Notion 官方帮助页核实
- `chrome.json`（40 条）：对照 Chrome 官方中文帮助页核实
- `github.json`（24 条）：对照 GitHub 官方快捷键页补全
- `todoist.json` / `chatgpt.json`：对照官方文档修正
- `macos.json` / `linux.json` / `capcut.json`：去重 + 修正
- `windows.json`（89 条）：对照微软官方支持页逐条确认
- `devtools.json`（27 条）：对照 Chrome DevTools 官方页
- `obsidian.json`（31 条）：对照 Obsidian 官方 Hotkeys 页
- `cursor.json`（31 条）：对照 Cursor 官方文档
- `blender.json`（23 条）：去重合并为标准键位
- `obs.json`：对照 OBS 官方页重写

**第二批（2026-07-14 web_fetch 官方文档）：**
- `gimp.json` / `inkscape.json` / `procreate.json` / `safari.json` / `androidstudio.json`
- `spotify.json` / `raycast.json` / `audacity.json` / `teams.json` / `alfred.json`
- `sketch.json` / `framer.json` / `canva.json` / `miro.json` / `mural.json` / `axure.json`
- `invision.json` / `zeplin.json` / `principle.json` / `protopie.json` / `whimsical.json`
- `lucidchart.json` / `abstract.json` / `jsdesign.json` / `mastergo.json`
- `affinityphoto.json` / `affinitydesigner.json` / `affinitypublisher.json`
- `intellij.json` / `webstorm.json` / `slack.json`
- `outlook.json` / `gmail.json` / `googledocs.json` / `googlesheets.json` / `googleslides.json`
- `feishu.json` / `dingtalk.json` / `wecom.json`

**第三批（2026-07-14 web_fetch 官方文档核实）：**
- `pycharm.json` / `goland.json` / `clion.json` / `phpstorm.json` / `rider.json`（JetBrains 全家桶）
- `vim.json` / `neovim.json` / `emacs.json` / `helix.json`（vimhelp.org / neovim doc / GNU 参考卡 / Helix 官方 keymap）
- `keynote.json` / `pages.json` / `numbers.json`（Apple iWork 标准，Mac-only）

### ⚠️ 非官方来源标注（22 个）

| 来源类型 | 应用 |
|----------|------|
| `community`（10） | figma, firefox, acrobat, sublimetext, krita, clipstudio, xcode, arc, linear, figjam |
| `ai`（12） | git, bilibili, **cinema4d, maya, zbrush, logicpro, abletonlive, garageband, reaper, jira, trello, onenote** |

> `ai` 来源的应用（含 2026-07-14 新增的 10 个：Cinema 4D / Maya / ZBrush / Logic Pro / Ableton Live / GarageBand / REAPER / Jira / Trello / OneNote）由 AI 专业知识库编写，**未经官网逐条核实**（当时网络受限，官方正文页全部超时/仅返回目录）。键位大概率正确但建议后续 web_fetch 官方页复核。Logic Pro / GarageBand 为 Mac 独占（windows/linux 设为 "—"）。

## 技术栈
- Chrome 扩展（Manifest V3），popup 单页应用。
- 构建：`npm run gen:pinyin`（依赖 `pinyin-pro`）生成 pinyin 字段。
- 入口：`popup.html` + `js/app.js`（渲染/分组/排序）+ `js/search.js`（搜索排序）+ `css/style.css`。
- 双语：`_locales/zh`、`_locales/en` + JS 内 `I18N` 对象；动态文本走翻译对象，禁止硬编码。
