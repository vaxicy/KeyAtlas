# KeyAtlas 快捷键数据补全 — 待办续做文档

> 生成时间：2026-07-14（用户睡前留档，明天继续）
> 目标：把剩余 11 个应用的官方快捷键数据补齐，写入 `data/shortcuts/*.json` 并注册到 `apps.json`。

---

## 一、当前进度概览

- 已提交（git）：共 **71 个**应用/系统条目，全部对照官方/可信来源核实。
  - 最近两次提交：`cfd2e11`（Spotify/Raycast/Audacity/Teams/Alfred）、`bfeffb8`（Inkscape/Procreate/Safari/Android Studio）。
- **剩余 11 个应用**尚未写入（见下表）。
- 磁盘上已有素材：`gimp-keys.txt`（GIMP 官方 Quickreference PDF 提取文本，已就绪，但仅为「工具箱+少量菜单」快捷键，需补完整菜单列表）。
- 一次性生成脚本已清理，目录 `scripts/` 仅留 `gen-pinyin.js` / `gen-icons.js` / `gen-icons-preview.js` / `validate-data.js`。

---

## 二、剩余应用清单（11 个）

| # | 应用 | id | category | 官方数据状态 | 官方来源 URL |
|---|------|----|----------|--------------|--------------|
| 1 | Krita | `krita` | design | 待抓（官方文档为设置页，需合并工具+菜单） | https://docs.krita.org/en/reference_manual/preferences/shortcut_settings.html （必要时搜 "Krita default keyboard shortcuts"） |
| 2 | GIMP | `gimp` | design | ✅ PDF 已提取到 `gimp-keys.txt`，但仅工具箱+少量菜单，需补完整菜单列表 | 补全：https://docs.gimp.org/3.0/en/gimp-help-keyboard-shortcuts.html |
| 3 | Sublime Text | `sublimetext` | development | 待抓 | https://www.sublimetext.com/docs/key_bindings.html （Default (Windows).sublime-keymap / Default (OSX)） |
| 4 | Clip Studio Paint | `clipstudio` | design | 待抓（索引页+子页） | https://help.clip-studio.com/en-us/manual_en/780_shortcuts/780_shortcuts.htm （含 tool / command 等子页） |
| 5 | IntelliJ IDEA | `intellij` | development | ⚠️ 之前抓过 win+mac，但未持久化，需重抓 | win: https://www.jetbrains.com/help/idea/reference-keymap-win-default.html ／ mac: https://www.jetbrains.com/help/idea/reference-keymap-mac-default.html |
| 6 | WebStorm | `webstorm` | development | ⚠️ 部分抓过，可与 IntelliJ 同平台键位复用 | win: https://www.jetbrains.com/help/webstorm/reference-keymap-win-default.html ／ mac: .../reference-keymap-mac-default.html （WebStorm 特有 JS/TS/重构键位单独补） |
| 7 | Xcode | `xcode` | development | 待抓（macOS only） | https://help.apple.com/xcode/mac/current/#/devd4e4e1c8e （搜 "Xcode keyboard shortcuts help.apple.com"） |
| 8 | Arc | `arc` | browser | 待抓（macOS 为主） | https://resources.arc.net/hc/en-us/articles/20595231349911-Keyboard-Shortcuts |
| 9 | Linear | `linear` | productivity | 待抓 | https://linear.app/help/article/keyboard-shortcuts （搜 "Linear keyboard shortcuts"） |
| 10 | Slack | `slack` | productivity | ⚠️ 之前抓过 win+mac，未持久化，需重抓 | https://slack.com/help/articles/201374536-Slack-keyboard-shortcuts |
| 11 | FigJam | `figjam` | design | 待抓（Figma 同源，单独一套） | https://help.figma.com/hc/en-us/articles/360040451754-FigJam-keyboard-shortcuts |

> 注：`intellij` / `slack` 标 ⚠️ 表示之前已成功抓取但本轮对话上下文未保留原始数据，明天用上方 URL 重新 `web_fetch` 即可，URL 已验证可用。

---

## 三、标准作业流程（SOP，机械重复即可）

每补一个应用，按以下顺序执行（参考已成功的 batch1/batch2）：

1. **抓取官方数据**
   - 网页：`web_fetch` 上方对应 URL，要求「返回 动作 + 键位 表格，逐行列出」。
   - PDF（如 GIMP）：`python3 -c "from pypdf import PdfReader; r=PdfReader('xxx.pdf'); open('xxx.txt','w',encoding='utf-8').write('\n'.join(p.extract_text() for p in r.pages))"`（pypdf 已装）。
   - 若页面为 SPA/超时/404 → 在交付说明标注「基于 AI 专业知识库，未经官网逐条核实」，**禁止**凭空编造关键键位。

2. **写一次性生成脚本** `scripts/gen-<id>.js`，输出 `data/shortcuts/<id>.json`。
   - 数据结构见第四节。
   - ⚠️ **必坑**：`appId` 必须等于文件名（即应用 id），不要从条目 id 前缀推导（之前 batch2 踩过：`alf`/`aud`/`spot` 前缀错误）。在写文件前 `arr.forEach(s => s.appId = file)`。

3. **运行生成** `node scripts/gen-<id>.js`，并校验 JSON 合法：
   `node -e "const d=require('./data/shortcuts/<id>.json'); console.log('<id> OK:', d.length)"`

4. **注册到 `apps.json`**（在 `alfred` 条目后追加，注意逗号）：
   ```json
   { "id": "<id>", "name": { "zh": "<中文名>", "en": "<英文名>" }, "category": "<category>", "icon": "🅰️", "type": "software", "file": "<id>.json" }
   ```
   - 中文名应用需加 `"sortKey": "<拼音首字母罗马化>"`（如 剪映→`Jianying`），见全局 user rule `apps-sortkey-pinyin-rule.md`。
   - icon 用 emoji 占位即可。

5. **生成拼音** `npm run gen:pinyin`（读取所有 json，写入 `pinyin` 字段；不依赖 apps.json）。

6. **校验数据** `node scripts/validate-data.js`，确认无 `ERROR`（尤其检查 appId 匹配、必填字段）。

7. **清理** 删除 `scripts/gen-<id>.js`。

8. **提交**
   ```
   git add -A
   git commit -m "新增 <应用名> 官方快捷键（来源：<官方出处>）"
   ```

---

## 四、快捷键条目数据结构（模板）

`data/shortcuts/<id>.json` 为数组，每条：

```json
{
  "id": "<id>-<动作短标识>",
  "appId": "<id>",
  "type": "software",
  "category": "<category>",
  "name": { "zh": "中文动作名", "en": "English action" },
  "description": { "zh": "补充说明（可含键位）", "en": "desc" },
  "windows": "Ctrl+Shift+P",
  "mac": "⌘ Shift P",
  "linux": "Ctrl+Shift+P",
  "keywords": ["中文别名", "english alias"],
  "pinyin": "..."          // 由 gen:pinyin 自动生成，手写脚本无需填
}
```

约定：
- 平台键位用顶层字段 `windows` / `mac` / `linux`；不适用填 `"—"`。
- macOS 多修饰键顺序：`⌥ ⌘` / `⌃ ⌘` / `⌘ ⇧`（参考 `finalcut.json` / `premiere.json`）。
- 仅单平台应用（如 Arc/Xcode 仅 macOS）：`mac` 填键位，`windows`/`linux` 填 `"—"`（参考 `safari.json`）。
- `keywords` 含中文会被 `gen:pinyin` 纳入拼音搜索；建议补中文别名提升搜索命中。

---

## 五、收尾 / 清理项

- [ ] `apps.json` 第 36 行有一条空行（chatgpt 与 outlook 之间），不影响解析但建议删除保持整洁。
- [ ] 全部 11 个应用补完后，跑一次 `node scripts/validate-data.js` 全量校验 + 浏览器加载扩展自测（搜索/分类/语言切换）。
- [ ] 完成后按全局 Git 习惯询问用户是否提交（本任务已逐应用提交，无需额外大提交）。

---

## 六、建议执行顺序（按数据就绪度）

1. **GIMP**（PDF 已提取，补菜单即可）→ 2. **IntelliJ IDEA**（重抓 win+mac）→ 3. **WebStorm**（复用 IntelliJ）→ 4. **Slack**（重抓 win+mac）→ 5. **Sublime Text** → 6. **Krita** → 7. **Clip Studio Paint** → 8. **Xcode** → 9. **Arc** → 10. **Linear** → 11. **FigJam**。

> 标 ⚠️ 的 3 个（GIMP/IntelliJ/Slack/WebStorm）优先做，因为其官方数据已部分就绪或 URL 已验证，阻力最小。
