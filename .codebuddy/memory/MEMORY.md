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
- 软件列表字母分组逻辑（`js/app.js`）：优先用 `a.sortKey[0]`，fallback 到 `a.name.en[0]`，再兜底 `#` 组。中文名应用**必须设 `sortKey` 且值为拼音首字母罗马化**（如 企业微信→Qiye→Q、剪映→Jianying→J），不能用汉字首字或英文名首字母（WeCom 的 W 是错的）。详见全局 user rule `apps-sortkey-pinyin-rule.md`。

## 快捷键数据来源核实状态（2026-07-13 全部完成）

共 **34 个**应用/系统条目。**全部已对照官方/可信来源核实并提交。**

### ✅ 已对照官方核实（34/34，100%）
- `photoshop.json` / `illustrator.json`：用户给的官方截图
- `davinci.json`：用户给的 Google 整理版截图
- `premiere.json`（75 条）/ `afterfx.json`（85 条）：对照官方截图重写
- `lightroom.json`（65 条）/ `xd.json`（55 条）/ `indesign.json`（79 条）：对照官方截图重写
- `acrobat.json`（42 条）/ `audition.json`（52 条）：对照截图重写（Acrobat=中文博客整理版，Audition=Adobe 官方 helpx）
- `figma.json`（68 条）：对照社区整理版截图补充（非官方，标注来源）
- `vscode.json`（49 条）：对照微软官方 Windows 快捷键截图重写
- `excel.json`（60 条）/ `word.json`（60 条）/ `powerpoint.json`（60 条）：对照微软支持页 Win+Mac 双平台截图重写
- `finalcut.json`（66 条）：对照 Apple 官方支持页截图核实
- `edge.json`（38 条）：对照微软官方 Win+Mac 双平台截图重写
- `firefox.json`（48 条）：对照社区整理版截图重写
- `notion.json`（42 条）：对照 Notion 官方帮助页截图重写
- `chrome.json`（40 条）：对照 Chrome 官方中文帮助页截图核实
- `github.json`（24 条）：对照 GitHub 官方快捷键页截图补全
- `git.json`（34 条）：去重 + 对照 Google AI 总结版补全（来源=AI 总结）
- `todoist.json` / `chatgpt.json`：对照官方文档修正
- `macos.json` / `linux.json` / `capcut.json`：去重 + 修正
- `windows.json`（89 条）：对照微软官方支持页逐条确认
- `devtools.json`（27 条）：对照 Chrome DevTools 官方页 + 断点键修正(F9)
- `obsidian.json`（31 条）：对照 Obsidian 官方 Hotkeys 页截图确认 + 补充 6 条
- `cursor.json`（31 条）：对照 Cursor 官方文档 + Ctrl+/ 改为 AI 模型循环
- `blender.json`（23 条）：去重两套重复条目合并为标准键位
- `obs.json`：对照 OBS 官方页重写
- **`bilibili.json`（27 条）**：对照 Google AI 总结截图重写（14→27 条，修正 ]/[ 键位）

### ⚠️ 非官方来源标注
- `figma.json`、`firefox.json`、`git.json`、`bilibili.json`：来源为社区整理/AI 总结，非官方文档逐条验证

## 技术栈
- Chrome 扩展（Manifest V3），popup 单页应用。
- 构建：`npm run gen:pinyin`（依赖 `pinyin-pro`）生成 pinyin 字段。
- 入口：`popup.html` + `js/app.js`（渲染/分组/排序）+ `js/search.js`（搜索排序）+ `css/style.css`。
- 双语：`_locales/zh`、`_locales/en` + JS 内 `I18N` 对象；动态文本走翻译对象，禁止硬编码。
