# KeyAtlas 长期记忆

## 项目约定与用户偏好

### 快捷键数据来源规则
- 增加新软件或系统的快捷键时，**必须先搜索官网或网络核实**，优先采用官方文档（如 Adobe Help、Figma 帮助中心、Microsoft 支持页等）的真实数据。
- **禁止凭 AI 知识库凭空补全**关键键位——避免收录错误/不存在的快捷键。
- 若网页抓取受限（SPA / 超时 / 404），应在交付说明中明确标注「数据基于 AI 专业知识库编写，未经官网逐条核实」，不能自认为准确。
- 补全已有数据时同样适用：优先对照官方快捷键表，再补充缺失项。

### 数据文件结构
- 每个应用 = `data/shortcuts/<id>.json`（含 `pinyin` 字段，手写）+ `apps.json` 注册 1 条。
- `pinyin` 字段目前无生成脚本，需手动补，否则拼音搜索命中不了。
- 软件列表字母分组逻辑（`js/app.js`）：优先用 `a.sortKey[0]`，fallback 到 `name[0]`；中文名应用（如 bilibili「哔哩哔哩」）需加 `sortKey` 才能正确归到拼音首字母组。

## 快捷键数据来源核实状态（2026-07-13 盘点）

共 35 个软件/系统条目。仅 5 个已对照官方核实，其余 30 个缺逐条来源记录、需用户逐个核对。

### ✅ 已对照官方核实
- `photoshop.json` / `illustrator.json`：用户给的官方截图
- `davinci.json`：用户给的 Google 整理版截图
- `premiere.json`（75 条）/ `afterfx.json`（85 条）：2026-07-13 对照官方截图重写
- `lightroom.json`（65 条）/ `xd.json`（55 条）/ `indesign.json`（79 条）：2026-07-13 对照官方截图重写
- `acrobat.json`（42 条）/ `audition.json`（52 条）：2026-07-13 对照截图重写（Acrobat=中文博客整理版，Audition=Adobe 官方 helpx）
- `figma.json`（68 条）：2026-07-13 对照**社区整理版**截图补充（非官方，标注来源）
- `vscode.json`（49 条）：2026-07-13 对照微软官方 Windows 快捷键截图重写（去重 + 覆盖全部 11 大类）
- `excel.json`（60 条）：2026-07-13 对照微软支持页 Win+Mac 双平台截图重写（含 Mac 专用键）
- `finalcut.json`（66 条）：2026-07-13 对照 Apple 官方支持页截图核实补充
- `edge.json`（38 条）：2026-07-13 对照微软官方 Win+Mac 双平台截图重写
- `firefox.json`（48 条）：2026-07-13 对照社区整理版截图重写
- `notion.json`（42 条）：2026-07-13 对照 Notion 官方帮助页截图重写（去重 5 对重复条目）
- `chrome.json`（40 条）：2026-07-13 对照 Chrome 官方中文帮助页截图核实补充
- `github.json`（24 条）：2026-07-13 对照 GitHub 官方快捷键页截图补全（12→24）
- `git.json`（34 条）：2026-07-13 去重 13 对重复 + 对照 Google AI 总结版补全至 34 条（来源=AI 总结，非官方）

### 「软件清单」定义（用户 2026-07-13 明确）
指**没有官方文档支持、或未经用户网上搜寻系统整理**的软件/系统快捷键数据。后续每次给用户的「待核实清单」即此类，需用户提供官方截图/网址后逐条核对。

### ⚠️ 待核实清单（缺官方文档 / 疑似 AI 或 Google 搜集，用户计划次日补）
按优先级：
1. **Adobe 剩余 0**：全部已完成 ✅（PS/Ill/LR/XD/ID/PR/AE/Acrobat/Audition）
2. **高频官方页齐全**：`word.json` `powerpoint.json` `finalcut.json`
3. **其余**：`devtools.json` `cursor.json` `obsidian.json` `todoist.json` `chatgpt.json` `windows.json` `macos.json` `linux.json` `capcut.json` `obs.json` `bilibili.json`

> 国内/社区软件（剪映、OBS、bilibili）官方快捷键页零散，优先级放后。

## 技术栈
- Chrome 扩展（Manifest V3），popup 单页应用。
- 构建：`npm run gen:pinyin`（依赖 `pinyin-pro`）生成 pinyin 字段。
- 入口：`popup.html` + `js/app.js`（渲染/分组/排序）+ `js/search.js`（搜索排序）+ `css/style.css`。
- 双语：`_locales/zh`、`_locales/en` + JS 内 `I18N` 对象；动态文本走翻译对象，禁止硬编码。
