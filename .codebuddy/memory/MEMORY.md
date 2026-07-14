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

共 **94 个**应用/系统条目。

| 来源 | 数量 | 说明 |
|------|------|------|
| `official` | 82 | 对照官方文档/截图逐条核实 |
| `community` | 10 | 社区整理版，非官方逐条验证 |
| `ai` | 2 | AI 专业知识库编写，未经官网逐条核实（git, bilibili） |

分类分布：系统 3 / 浏览器 5 / 开发 19 / 设计 31 / 效率 25 / 视频 9 / 音频 1 / 其他 1

> 分类表 `data/categories.json` 含 8 类：system / browser / development / design / productivity / video / audio / ai / other。audio 分类保留（Ableton Live 唯一成员）。

### ✅ 官方核实（82 个）

**第一~三批（同前，79 个）：**（photoshop / illustrator / davinci / premiere / afterfx / lightroom / xd / indesign / acrobat / audition / vscode / excel / word / powerpoint / finalcut / edge / notion / chrome / github / todoist / chatgpt / macos / linux / capcut / windows / devtools / obsidian / cursor / blender / obs + gimp / inkscape / procreate / safari / androidstudio / spotify / raycast / audacity / teams / alfred / sketch / framer / canva / miro / mural / axure / invision / zeplin / principle / protopie / whimsical / lucidchart / abstract / jsdesign / mastergo / affinityphoto / affinitydesigner / affinitypublisher / intellij / webstorm / slack / outlook / gmail / googledocs / googlesheets / googleslides / feishu / dingtalk / wecom + pycharm / goland / clion / phpstorm / rider + vim / neovim / emacs / helix + keynote / pages / numbers）

**第四批（2026-07-14 联网复核 / 用户截图核验）：**
- `abletonlive.json`：web_fetch Ableton Live 12 官方手册 Section 41 全表，修正 3 处错误后升级
- `onenote.json`：对照用户提供的 Microsoft 365 官方截图（OneNote-1.png / OneNote-2.png）完全重写（55 条）

### ⚠️ 非官方来源标注（12 个）

| 来源类型 | 应用 |
|----------|------|
| `community`（10） | figma, firefox, acrobat, sublimetext, krita, clipstudio, xcode, arc, linear, figjam |
| `ai`（2） | git, bilibili |

> **2026-07-14 清理操作**：删除了 8 个无官方文档支持的 AI 应用（Cinema 4D / Maya / ZBrush / Logic Pro / GarageBand / REAPER / Jira / Trello）。这些应用因网络受限无法抓取官方文档，且用户确认不可信则删掉。如后续找到官方文档可重新添加。

## 技术栈
- Chrome 扩展（Manifest V3），popup 单页应用。
- 构建：`npm run gen:pinyin`（依赖 `pinyin-pro`）生成 pinyin 字段。
- 入口：`popup.html` + `js/app.js`（渲染/分组/排序）+ `js/search.js`（搜索排序）+ `css/style.css`。
- 双语：`_locales/zh`、`_locales/en` + JS 内 `I18N` 对象；动态文本走翻译对象，禁止硬编码。
