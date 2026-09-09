"""
KeyAtlas — Chrome Web Store Screenshot Generator (style-matched to popup UI)
Outputs 10 screenshots: 5 Chinese (zh) + 5 English (en), each 1280×800.
Visual language mirrors css/style.css:
  bg #f5f6f8 · surface #fff · border #e5e8ec · text #1a1d21 · sub #5a6675
  primary #6366f1 · grad 135deg #4F46E5→#7C3AED · accent #ffb020
  key badge: #f5f3ff bg / #ddd6fe border / #5b21b6 text (monospace)

FIXES v3:
  - Logo brand↔tagline: +6px gap (was touching)
  - Category bar↔text: +6px gap (was overlapping)
  - Kbd badge↔action text: +6px total gap (was cramped)
  - Status bar: more inner padding, smaller font for EN long text
  - Toggle button: smaller font, true centering
  - All internal spacing reviewed for breathing room
"""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
OUT_ZH = ROOT / "store-assets" / "screenshots" / "zh"
OUT_EN = ROOT / "store-assets" / "screenshots" / "en"
OUT_ZH.mkdir(parents=True, exist_ok=True)
OUT_EN.mkdir(parents=True, exist_ok=True)

W, H = 1280, 800

# ── Palette (verbatim from css/style.css) ──────────────────────
COLORS = {
    "bg": "#f5f6f8",
    "surface": "#ffffff",
    "surface2": "#f0f2f5",
    "border": "#e5e8ec",
    "text": "#1a1d21",
    "sub": "#5a6675",
    "primary": "#6366f1",
    "primary_strong": "#4F46E5",
    "primary_soft": "#ede9fe",
    "violet": "#8b5cf6",
    "purple": "#7c3aed",
    "accent": "#ffb020",
    "key_bg": "#f5f3ff",
    "key_border": "#ddd6fe",
    "key_text": "#5b21b6",
    "grad1": "#4F46E5",
    "grad2": "#7C3AED",
    "shadow": "#e7e9ee",
    "white": "#ffffff",
}

# On-brand category accents (indigo/purple/amber family only)
CAT = {
    "设计": ("#7c3aed", "Design"),
    "开发": ("#6366f1", "Dev"),
    "效率": ("#8b5cf6", "Productivity"),
    "浏览器": ("#4f46e5", "Browser"),
    "视频": ("#a855f7", "Video"),
    "音频": ("#ffb020", "Audio"),
    "系统": ("#5a6675", "System"),
}


def hex2rgb(h):
    h = h.lstrip("#")
    return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4))


def lerp(a, b, t):
    return tuple(int(a[i] + (b[i] - a[i]) * t) for i in range(3))


def font(size, bold=False):
    cands = []
    if bold:
        cands += [Path("C:/Windows/Fonts/msyhbd.ttc"), Path("C:/Windows/Fonts/simhei.ttf")]
    cands += [
        Path("C:/Windows/Fonts/msyh.ttc"),
        Path("C:/Windows/Fonts/simhei.ttf"),
        Path("C:/Windows/Fonts/simsun.ttc"),
    ]
    for c in cands:
        if c.exists():
            return ImageFont.truetype(str(c), size)
    return ImageFont.load_default()


def mono(size, bold=True):
    cands = []
    if bold:
        cands += [Path("C:/Windows/Fonts/consolab.ttf")]
    cands += [
        Path("C:/Windows/Fonts/consola.ttf"),
        Path("C:/Windows/Fonts/consolab.ttf"),
    ]
    for c in cands:
        if c.exists():
            return ImageFont.truetype(str(c), size)
    return font(size, bold)


F = {
    "h1": font(46, bold=True),
    "h2": font(32, bold=True),
    "h3": font(24, bold=True),
    "h4": font(20, bold=True),
    "body": font(20),
    "small": font(16),
    "tiny": font(13),
    "mono": mono(18, bold=True),
}


def text(draw, xy, value, fill=COLORS["text"], f=None, anchor=None):
    draw.text(xy, value, fill=fill, font=f or F["body"], anchor=anchor)


def wrap(draw, value, max_width, f):
    lines, current = [], ""
    for char in value:
        test = current + char
        if draw.textlength(test, font=f) <= max_width or not current:
            current = test
        else:
            lines.append(current)
            current = char
    if current:
        lines.append(current)
    return lines


def paragraph(draw, xy, value, max_width, f=None, fill=COLORS["sub"], leading=8):
    f = f or F["body"]
    x, y = xy
    for line in wrap(draw, value, max_width, f):
        text(draw, (x, y), line, fill=fill, f=f)
        y += f.size + leading
    return y


def shadow_rect(draw, xy, radius=14, color=COLORS["shadow"], off=(0, 6)):
    x0, y0, x1, y1 = xy
    draw.rounded_rectangle((x0 + off[0], y0 + off[1], x1 + off[0], x1 + off[1]),
                            radius=radius, fill=color)


def card(draw, xy, fill=COLORS["surface"], radius=14, border=COLORS["border"],
         width=1, shadow=True):
    if shadow:
        shadow_rect(draw, xy, radius=radius)
    draw.rounded_rectangle(xy, radius=radius, fill=fill, outline=border, width=width)


def gradient_rect(img, draw, xy, c1, c2, radius=14, vertical=True):
    x0, y0, x1, y1 = xy
    w = max(1, x1 - x0)
    h = max(1, y1 - y0)
    grad = Image.new("RGB", (w, h))
    gd = ImageDraw.Draw(grad)
    steps = h if vertical else w
    a, b = hex2rgb(c1), hex2rgb(c2)
    for i in range(steps):
        t = i / max(1, steps - 1)
        gd.line([(0, i), (w, i)] if vertical else [(i, 0), (i, h)], fill=lerp(a, b, t))
    mask = Image.new("L", (w, h), 0)
    ImageDraw.Draw(mask).rounded_rectangle([0, 0, w - 1, h - 1], radius=radius, fill=255)
    img.paste(grad, (x0, y0), mask)


def kbd_badge(draw, x, y, value, h, f=None):
    f = f or F["mono"]
    pad = 10
    w = draw.textlength(value, font=f) + pad * 2
    r = min(7, h // 2)
    draw.rounded_rectangle((x, y, x + w, y + h), radius=r,
                           fill=COLORS["key_bg"], outline=COLORS["key_border"], width=1)
    draw.text((x + w // 2, y + h // 2), value, fill=COLORS["key_text"], font=f, anchor="mm")
    return w


def base_bg():
    img = Image.new("RGB", (W, H), COLORS["bg"])
    d = ImageDraw.Draw(img)
    return img, d


def hero_banner(img, draw, title, subtitle):
    """Top banner with the brand indigo→purple gradient."""
    gradient_rect(img, draw, (48, 44, W - 48, 176), COLORS["grad1"], COLORS["grad2"], radius=16)
    text(draw, (84, 76), title, fill="white", f=F["h1"])
    text(draw, (86, 136), subtitle, fill="#e9e7ff", f=F["body"])


def popup_mock(draw, img, x, y, scale=1.0, lang="zh"):
    """Faithful mock of the KeyAtlas popup (see popup.html + css/style.css)."""
    pw, ph = int(380 * scale), int(540 * scale)
    card(draw, (x, y, x + pw, y + ph), fill=COLORS["surface"], radius=14)

    # header: gradient logo + brand + tagline
    lx, ly = x + int(16 * scale), y + int(16 * scale)
    ls = int(30 * scale)
    gradient_rect(img, draw, (lx, ly, lx + ls, ly + ls), COLORS["grad1"], COLORS["grad2"], radius=int(7 * scale))
    bn, bt = int(16 * scale), int(10 * scale)
    brand_x = lx + ls + int(12 * scale)
    brand_y = ly + int(2 * scale)
    text(draw, (brand_x, brand_y), "KeyAtlas",
         fill=COLORS["text"], f=font(bn, bold=True))
    # FIX v3: tagline +6px extra gap below brand name (was touching)
    tag = "快捷键搜索引擎" if lang == "zh" else "Shortcut Search Engine"
    text(draw, (brand_x, brand_y + bn + int(6 * scale)), tag,
         fill=COLORS["sub"], f=font(bt))

    # search bar
    sb_y = ly + ls + int(16 * scale)   # +2px more below logo
    sb_h = int(40 * scale)
    card(draw, (x + int(16 * scale), sb_y, x + pw - int(16 * scale), sb_y + sb_h),
         fill=COLORS["surface2"], radius=int(12 * scale), shadow=False)
    stxt = "搜索快捷键..." if lang == "zh" else "Search shortcuts..."
    text(draw, (x + int(30 * scale), sb_y + sb_h // 2), stxt,
         fill=COLORS["sub"], f=font(int(14 * scale)), anchor="lm")

    # capsule tabs (active = gradient)
    tab_y = sb_y + sb_h + int(12 * scale)
    tab_h = int(30 * scale)
    tabs = ["全部", "收藏", "最近", "系统"] if lang == "zh" else ["All", "Favs", "Recent", "System"]
    tw = (pw - int(32 * scale)) // 4
    for i, t in enumerate(tabs):
        tx = x + int(16 * scale) + i * tw
        if i == 0:
            gradient_rect(img, draw, (tx, tab_y, tx + tw - int(8 * scale), tab_y + tab_h),
                          COLORS["grad1"], COLORS["grad2"], radius=int(9 * scale))
            tf = COLORS["white"]
        else:
            card(draw, (tx, tab_y, tx + tw - int(8 * scale), tab_y + tab_h),
                 fill=COLORS["surface2"], radius=int(9 * scale), shadow=False)
            tf = COLORS["sub"]
        text(draw, (tx + (tw - int(8 * scale)) // 2, tab_y + tab_h // 2), t,
             fill=tf, f=font(int(12 * scale), bold=(i == 0)), anchor="mm")

    # category tiles (2×2) — NO emoji, colored left bar + translated names
    cy0 = tab_y + tab_h + int(14 * scale)
    if lang == "zh":
        cats = [("设计", "55"), ("开发", "49"), ("效率", "59"), ("视频", "16")]
    else:
        cats = [("Design", "55"), ("Dev", "49"), ("Productivity", "59"), ("Video", "16")]
    cat_colors = [COLORS["purple"], COLORS["primary"], COLORS["violet"], COLORS["violet"]]
    cw = (pw - int(36 * scale)) // 2
    ch = int(54 * scale)
    for i, (nm, cnt) in enumerate(cats):
        col, row = i % 2, i // 2
        cx = x + int(16 * scale) + col * (cw + int(8 * scale))
        cyy = cy0 + row * (ch + int(8 * scale))
        card(draw, (cx, cyy, cx + cw, cyy + ch), fill=COLORS["surface"],
             radius=int(10 * scale), shadow=False)
        # colored left accent bar (skip if too small to draw)
        bar_top = cyy + max(4, int(10 * scale))
        bar_bot = cyy + ch - max(4, int(10 * scale))
        if bar_bot > bar_top + 2:
            clr = cat_colors[i]
            draw.rounded_rectangle((cx + 8, bar_top, cx + 14, bar_bot), radius=2, fill=clr)
        # FIX v3: text x offset increased from 22 → 28 scale (bar was overlapping text)
        txt_x = cx + int(28 * scale)
        text(draw, (txt_x, cyy + int(10 * scale)), nm,
             fill=COLORS["text"], f=font(int(13 * scale), bold=True))
        text(draw, (txt_x, cyy + ch - int(18 * scale)),
             (f"{cnt} 款" if lang == "zh" else f"{cnt} apps"),
             fill=COLORS["sub"], f=font(int(10 * scale)))

    # shortcut cards with lavender key badges — FIX v3: more spacing after badge
    sy0 = cy0 + 2 * (ch + int(8 * scale)) + int(8 * scale)   # +2px more
    if lang == "zh":
        items = [("Ctrl+S", "保存", "VS Code"), ("⌘+N", "新建", "macOS")]
    else:
        items = [("Ctrl+S", "Save", "VS Code"), ("Cmd+N", "New", "macOS")]
    ih = int(40 * scale)
    for i, (k, act, src) in enumerate(items):
        iy = sy0 + i * (ih + int(8 * scale))   # +2px more gap between rows
        card(draw, (x + int(12 * scale), iy, x + pw - int(12 * scale), iy + ih),
             fill=COLORS["surface"], radius=int(10 * scale), shadow=False)
        kw = kbd_badge(draw, x + int(18 * scale), iy + int(6 * scale), k, ih - int(12 * scale),
                       f=mono(int(13 * scale)))
        # FIX v3: +10px total gap after kbd badge (was +4px, text was touching badge)
        text(draw, (x + int(18 * scale) + kw + int(10 * scale), iy + int(8 * scale)), act,
             fill=COLORS["text"], f=font(int(13 * scale), bold=True))
        text(draw, (x + int(18 * scale) + kw + int(10 * scale), iy + ih - int(16 * scale)), src,
             fill=COLORS["sub"], f=font(int(10 * scale)))

    # bottom status bar — FIX v3: more padding, smaller font for EN long text
    bb = y + ph - int(36 * scale)   # 2px taller
    card(draw, (x + int(14 * scale), bb, x + pw - int(14 * scale), y + ph - int(10 * scale)),
         fill=COLORS["surface"], radius=int(10 * scale), shadow=False)
    stat = "200+ 应用 · 离线可用" if lang == "zh" else "Apps · Shortcuts · Cats · Systems · Offline"
    text(draw, (x + pw // 2, bb + int(13 * scale)), stat,
         fill=COLORS["sub"], f=font(int(10 * scale)), anchor="mm")


# ── Chinese Screenshots ───────────────────────────────────────

def zh_01_hero():
    img, d = base_bg()
    hero_banner(img, d, "KeyAtlas — 快捷键搜索引擎", "覆盖 200+ 款应用与操作系统，7900+ 条快捷键，即时搜索")
    popup_mock(d, img, 72, 210, scale=0.95, lang="zh")

    rx = 480
    features = [
        ("即时搜索", "输入操作或应用名，结果实时呈现", COLORS["primary"]),
        ("系统偏好", "设置 Windows / macOS / Linux 键位优先显示", COLORS["violet"]),
        ("深浅主题", "浅色 / 深色，扩展端与网页端统一", COLORS["purple"]),
        ("完全离线", "安装后无需联网，零追踪无注册", COLORS["accent"]),
    ]
    for i, (title, desc, clr) in enumerate(features):
        fy = 230 + i * 118
        card(d, (rx, fy, W - 60, fy + 100), radius=14, shadow=False)
        d.rounded_rectangle((rx + 18, fy + 18, rx + 50, fy + 50), radius=8, fill=clr)
        text(d, (rx + 68, fy + 22), title, f=F["h3"])
        paragraph(d, (rx + 68, fy + 58), desc, W - rx - 90, f=F["small"], fill=COLORS["sub"])

    img.save(OUT_ZH / "screenshot-01-hero.png")


def zh_02_search():
    img, d = base_bg()
    hero_banner(img, d, "强大的搜索功能", "模糊匹配、拼音搜索、跨平台一键切换")
    popup_mock(d, img, 60, 210, scale=0.95, lang="zh")

    px = 460
    card(d, (px, 210, W - 60, 700), radius=14, shadow=False)
    text(d, (px + 32, 240), "搜索示例", f=F["h3"])

    searches = [
        ("ps 保存", "Photoshop → 保存文档 → Ctrl+S / ⌘+S"),
        ("vscode 格式化", "VS Code → 格式化文档 → Shift+Alt+F"),
        ("复制粘贴", "通用 → 复制 → Ctrl+C  |  粘贴 → Ctrl+V"),
        ("mac 截图", "macOS → 截全屏 → ⌘+Ctrl+Shift+3"),
    ]
    sy = 296
    for q, result in searches:
        card(d, (px + 24, sy, W - 84, sy + 82), fill=COLORS["surface"], radius=10, shadow=False)
        text(d, (px + 40, sy + 12), f'"{q}"', f=F["h4"], fill=COLORS["primary"])
        paragraph(d, (px + 40, sy + 44), result, W - 160, f=F["small"], fill=COLORS["sub"], leading=4)
        sy += 96

    img.save(OUT_ZH / "screenshot-02-search.png")


def zh_03_categories():
    img, d = base_bg()
    hero_banner(img, d, "按分类浏览", "9 大类别，200+ 款应用一目了然")

    categories = [
        ("设计", "55", "Photoshop / Figma / Blender / Sketch / Illustrator ...", COLORS["purple"]),
        ("开发", "49", "VS Code / IntelliJ / Vim / Git / Chrome DevTools ...", COLORS["primary"]),
        ("效率", "59", "Notion / Slack / Outlook / Todoist / Obsidian ...", COLORS["violet"]),
        ("浏览器", "8", "Chrome / Edge / Firefox / Safari / Arc ...", COLORS["primary_strong"]),
        ("AI", "20", "ChatGPT / Claude / Midjourney / Copilot ...", COLORS["violet"]),
        ("视频", "16", "Premiere / DaVinci / Final Cut / CapCut / Vegas ...", COLORS["violet"]),
        ("音频", "13", "Audition / Audacity / FL Studio / Logic Pro ...", COLORS["accent"]),
        ("系统", "5", "Windows / macOS / Linux / ChromeOS / iOS", COLORS["sub"]),
        ("其他", "3", "更多应用持续更新中 ...", COLORS["sub"]),
    ]

    cols, card_w, card_h = 2, 550, 100
    gap_x, gap_y = 20, 12
    start_x, start_y = 60, 200

    for i, (name, count, examples, clr) in enumerate(categories):
        col, row = i % cols, i // cols
        cx = start_x + col * (card_w + gap_x)
        cy = start_y + row * (card_h + gap_y)
        card(d, (cx, cy, cx + card_w, cy + card_h), radius=14, shadow=False)
        d.rounded_rectangle((cx, cy, cx + 8, cy + card_h), radius=3, fill=clr)
        text(d, (cx + 32, cy + 12), name, f=F["h3"])
        text(d, (cx + 32, cy + 44), f"{count} 款应用", fill=COLORS["sub"], f=F["body"])
        paragraph(d, (cx + 32, cy + 70), examples, card_w - 60, f=F["tiny"], fill=COLORS["sub"], leading=3)

    img.save(OUT_ZH / "screenshot-03-categories.png")


def zh_04_os_shortcuts():
    img, d = base_bg()
    hero_banner(img, d, "系统级快捷键", "Windows / macOS / Linux / ChromeOS / iOS 全收录")

    os_data = [
        ("Windows", ["Win+E", "打开资源管理器", "Win+D", "显示桌面", "Win+L", "锁定电脑", "Ctrl+Shift+Esc", "任务管理器"], COLORS["primary_strong"]),
        ("macOS", ["⌘+Space", "Spotlight 搜索", "⌘+Tab", "切换应用", "⌘+H", "隐藏当前应用", "⌘+Shift+4", "区域截屏"], COLORS["sub"]),
        ("Linux", ["Ctrl+Alt+T", "打开终端", "Super", "活动概览", "Ctrl+Alt+方向键", "切换工作区", "Print Screen", "截图"], COLORS["accent"]),
    ]

    ox = 60
    ow = (W - 120) // 3
    oh = 500
    for i, (os_name, items, clr) in enumerate(os_data):
        bx = ox + i * (ow + 20)
        card(d, (bx, 210, bx + ow, 210 + oh), radius=14, shadow=False)
        gradient_rect(img, d, (bx, 210, bx + ow, 260), COLORS["grad1"], COLORS["grad2"], radius=14)
        d.rectangle((bx, 245, bx + ow, 260), fill=COLORS["grad2"])
        text(d, (bx + ow // 2, 222), os_name, fill="white", f=F["h4"], anchor="ma")
        iy = 282
        for j in range(0, len(items), 2):
            key, desc = items[j], items[j + 1]
            card(d, (bx + 16, iy, bx + ow - 16, iy + 52), fill=COLORS["surface"], radius=10, shadow=False)
            sc = 0.85 if len(key) > 8 else 1.0
            kw = kbd_badge(d, bx + 24, iy + 10, key, 32, f=mono(int(15 * sc)))
            # FIX v3: +4px more after kbd badge (was 34, now 38)
            text(d, (bx + 38 + kw, iy + 14), desc, f=F["small"])
            iy += 62

    img.save(OUT_ZH / "screenshot-04-os-shortcuts.png")


def zh_05_offline_bilingual():
    img, d = base_bg()
    hero_banner(img, d, "离线可用 · 中英双语", "安装即用、无需联网、零追踪、完全免费")

    card(d, (60, 220, 600, 520), radius=14, shadow=False)
    text(d, (96, 260), "完全离线", f=F["h2"])
    paragraph(d, (96, 320), "所有数据打包在扩展内，安装后断网也能正常使用。不发送任何数据到外部服务器，不追踪用户行为。", 460, f=F["body"], leading=6)

    badges = [
        ("零网络请求", COLORS["primary"]),
        ("零追踪代码", COLORS["violet"]),
        ("无需注册登录", COLORS["purple"]),
        ("免费使用", COLORS["accent"]),
    ]
    by = 430
    for i, (label, clr) in enumerate(badges):
        bx = 96 + i * 122
        d.rounded_rectangle((bx, by, bx + 110, by + 54), radius=10, fill=clr)
        text(d, (bx + 55, by + 16), label, fill="white", f=font(14, bold=True), anchor="ma")

    card(d, (640, 220, W - 60, 520), radius=14, shadow=False)
    text(d, (676, 260), "中英双语", f=F["h2"])
    paragraph(d, (676, 320), "完整支持简体中文和 English。点击即可切换语言，所有界面文本、应用名称、快捷键说明同步更新。", 460, f=F["body"], leading=6)

    # FIX v3: toggle button — wider + smaller font for true centering
    gradient_rect(img, d, (676, 420, 820, 466), COLORS["grad1"], COLORS["grad2"], radius=12)
    text(d, (748, 433), "EN / 中文 切换", fill="white", f=font(14, bold=True), anchor="ma")
    card(d, (834, 420, 1150, 466), fill=COLORS["surface"], radius=12, shadow=False)
    # FIX v3: smaller font so text doesn't touch button edges
    text(d, (992, 433), "当前：简体中文", fill=COLORS["sub"], f=font(15), anchor="ma")

    card(d, (60, 560, W - 60, 700), fill=COLORS["surface"], radius=14, shadow=False)
    stats = [("200+", "款应用"), ("7900+", "条快捷键"), ("9", "大分类"), ("5", "个操作系统"), ("0", "联网依赖")]
    for i, (num, label) in enumerate(stats):
        sx_pos = 100 + i * 210
        text(d, (sx_pos, 590), num, f=F["h1"], fill=COLORS["primary"])
        text(d, (sx_pos, 646), label, fill=COLORS["sub"], f=F["body"])

    img.save(OUT_ZH / "screenshot-05-offline-bilingual.png")


# ── English Screenshots ──────────────────────────────────────

def en_01_hero():
    img, d = base_bg()
    hero_banner(img, d, "KeyAtlas — Shortcut Search Engine", "200+ apps & OS, 7,900+ shortcuts, instant search")
    popup_mock(d, img, 72, 210, scale=0.95, lang="en")

    rx = 480
    features = [
        ("Instant Search", "Type any action or app name, results appear as you type", COLORS["primary"]),
        ("OS Preference", "Prioritize Windows / macOS / Linux keys in Settings", COLORS["violet"]),
        ("Light & Dark Theme", "Unified across extension and web app", COLORS["purple"]),
        ("100% Offline", "No internet needed after install. Zero tracking, no sign-up.", COLORS["accent"]),
    ]
    for i, (title, desc, clr) in enumerate(features):
        fy = 230 + i * 118
        card(d, (rx, fy, W - 60, fy + 100), radius=14, shadow=False)
        d.rounded_rectangle((rx + 18, fy + 18, rx + 50, fy + 50), radius=8, fill=clr)
        text(d, (rx + 68, fy + 22), title, f=F["h3"])
        paragraph(d, (rx + 68, fy + 58), desc, W - rx - 90, f=F["small"], fill=COLORS["sub"])

    img.save(OUT_EN / "screenshot-01-hero.png")


def en_02_search():
    img, d = base_bg()
    hero_banner(img, d, "Powerful Search", "Fuzzy match, pinyin search, cross-platform switching")
    popup_mock(d, img, 60, 210, scale=0.95, lang="en")

    px = 460
    card(d, (px, 210, W - 60, 700), radius=14, shadow=False)
    text(d, (px + 32, 240), "Search Examples", f=F["h3"])

    searches = [
        ("ps save", "Photoshop -> Save Document -> Ctrl+S / Cmd+S"),
        ("vscode format", "VS Code -> Format Document -> Shift+Alt+F"),
        ("copy paste", "Universal -> Copy -> Ctrl+C  |  Paste -> Ctrl+V"),
        ("mac screenshot", "macOS -> Full Screenshot -> Cmd+Ctrl+Shift+3"),
    ]
    sy = 296
    for q, result in searches:
        card(d, (px + 24, sy, W - 84, sy + 82), fill=COLORS["surface"], radius=10, shadow=False)
        text(d, (px + 40, sy + 12), f'"{q}"', f=F["h4"], fill=COLORS["primary"])
        paragraph(d, (px + 40, sy + 44), result, W - 160, f=F["small"], fill=COLORS["sub"], leading=4)
        sy += 96

    img.save(OUT_EN / "screenshot-02-search.png")


def en_03_categories():
    img, d = base_bg()
    hero_banner(img, d, "Browse by Category", "9 categories, 200+ apps at a glance")

    categories = [
        ("Design", "55", "Photoshop / Figma / Blender / Sketch / Illustrator ...", COLORS["purple"]),
        ("Dev", "49", "VS Code / IntelliJ / Vim / Git / Chrome DevTools ...", COLORS["primary"]),
        ("Productivity", "59", "Notion / Slack / Outlook / Todoist / Obsidian ...", COLORS["violet"]),
        ("Browser", "8", "Chrome / Edge / Firefox / Safari / Arc ...", COLORS["primary_strong"]),
        ("AI", "20", "ChatGPT / Claude / Midjourney / Copilot ...", COLORS["violet"]),
        ("Video", "16", "Premiere / DaVinci / Final Cut / CapCut / Vegas ...", COLORS["violet"]),
        ("Audio", "13", "Audition / Audacity / FL Studio / Logic Pro ...", COLORS["accent"]),
        ("System", "5", "Windows / macOS / Linux / ChromeOS / iOS", COLORS["sub"]),
        ("Other", "3", "More apps added regularly ...", COLORS["sub"]),
    ]

    cols, card_w, card_h = 2, 550, 100
    gap_x, gap_y = 20, 12
    start_x, start_y = 60, 200

    for i, (name, count, examples, clr) in enumerate(categories):
        col, row = i % cols, i // cols
        cx = start_x + col * (card_w + gap_x)
        cy = start_y + row * (card_h + gap_y)
        card(d, (cx, cy, cx + card_w, cy + card_h), radius=14, shadow=False)
        d.rounded_rectangle((cx, cy, cx + 8, cy + card_h), radius=3, fill=clr)
        text(d, (cx + 32, cy + 12), name, f=F["h3"])
        text(d, (cx + 32, cy + 44), f"{count} apps", fill=COLORS["sub"], f=F["body"])
        paragraph(d, (cx + 32, cy + 70), examples, card_w - 60, f=F["tiny"], fill=COLORS["sub"], leading=3)

    img.save(OUT_EN / "screenshot-03-categories.png")


def en_04_os_shortcuts():
    img, d = base_bg()
    hero_banner(img, d, "OS-Level Shortcuts", "Full coverage for Windows / macOS / Linux / ChromeOS / iOS")

    os_data = [
        ("Windows", ["Win+E", "File Explorer", "Win+D", "Show Desktop", "Win+L", "Lock PC", "Ctrl+Shift+Esc", "Task Mgr"], COLORS["primary_strong"]),
        ("macOS", ["Cmd+Space", "Spotlight Search", "Cmd+Tab", "Switch App", "Cmd+H", "Hide App", "Cmd+Shift+4", "Area Screenshot"], COLORS["sub"]),
        ("Linux", ["Ctrl+Alt+T", "Open Terminal", "Super", "Activities Overview", "Ctrl+Alt+Arrow", "Switch Workspace", "PrtSc", "Screenshot"], COLORS["accent"]),
    ]

    ox = 60
    ow = (W - 120) // 3
    oh = 500
    for i, (os_name, items, clr) in enumerate(os_data):
        bx = ox + i * (ow + 20)
        card(d, (bx, 210, bx + ow, 210 + oh), radius=14, shadow=False)
        gradient_rect(img, d, (bx, 210, bx + ow, 260), COLORS["grad1"], COLORS["grad2"], radius=14)
        d.rectangle((bx, 245, bx + ow, 260), fill=COLORS["grad2"])
        text(d, (bx + ow // 2, 222), os_name, fill="white", f=F["h4"], anchor="ma")
        iy = 282
        for j in range(0, len(items), 2):
            key, desc = items[j], items[j + 1]
            card(d, (bx + 16, iy, bx + ow - 16, iy + 52), fill=COLORS["surface"], radius=10, shadow=False)
            sc = 0.85 if len(key) > 8 else 1.0
            kw = kbd_badge(d, bx + 24, iy + 10, key, 32, f=mono(int(15 * sc)))
            text(d, (bx + 38 + kw, iy + 14), desc, f=F["small"])   # FIX v3: +4px
            iy += 62

    img.save(OUT_EN / "screenshot-04-os-shortcuts.png")


def en_05_offline_bilingual():
    img, d = base_bg()
    hero_banner(img, d, "Offline & Bilingual", "Works offline after install, zero tracking, completely free")

    card(d, (60, 220, 600, 520), radius=14, shadow=False)
    text(d, (96, 260), "100% Offline", f=F["h2"])
    paragraph(d, (96, 320), "All data is bundled inside the extension. Works without internet. No data sent to external servers, no user tracking whatsoever.", 460, f=F["body"], leading=6)

    badges = [
        ("No Network", COLORS["primary"]),
        ("No Tracking", COLORS["violet"]),
        ("No Sign-Up", COLORS["purple"]),
        ("Free Forever", COLORS["accent"]),
    ]
    by = 430
    for i, (label, clr) in enumerate(badges):
        bx = 96 + i * 122
        d.rounded_rectangle((bx, by, bx + 110, by + 54), radius=10, fill=clr)
        text(d, (bx + 55, by + 16), label, fill="white", f=font(14, bold=True), anchor="ma")

    card(d, (640, 220, W - 60, 520), radius=14, shadow=False)
    text(d, (676, 260), "Bilingual UI", f=F["h2"])
    paragraph(d, (676, 320), "Full Simplified Chinese and English support. One click to switch. All interface text, app names, and shortcut descriptions update together.", 460, f=F["body"], leading=6)

    # FIX v3: toggle — wider + smaller font
    gradient_rect(img, d, (676, 420, 830, 466), COLORS["grad1"], COLORS["grad2"], radius=12)
    text(d, (753, 433), "EN / 中文 Toggle", fill="white", f=font(14, bold=True), anchor="ma")
    card(d, (844, 420, 1150, 466), fill=COLORS["surface"], radius=12, shadow=False)
    text(d, (997, 433), "Current: English", fill=COLORS["sub"], f=font(15), anchor="ma")   # FIX v3: smaller font

    card(d, (60, 560, W - 60, 700), fill=COLORS["surface"], radius=14, shadow=False)
    stats = [("200+", "Apps"), ("7,900+", "Shortcuts"), ("9", "Categories"), ("5", "Operating Systems"), ("0", "Network Dep.")]
    for i, (num, label) in enumerate(stats):
        sx_pos = 100 + i * 210
        text(d, (sx_pos, 590), num, f=F["h1"], fill=COLORS["primary"])
        text(d, (sx_pos, 646), label, fill=COLORS["sub"], f=F["body"])

    img.save(OUT_EN / "screenshot-05-offline-bilingual.png")


if __name__ == "__main__":
    print("Generating Chinese screenshots...")
    zh_01_hero()
    zh_02_search()
    zh_03_categories()
    zh_04_os_shortcuts()
    zh_05_offline_bilingual()

    print("Generating English screenshots...")
    en_01_hero()
    en_02_search()
    en_03_categories()
    en_04_os_shortcuts()
    en_05_offline_bilingual()

    print(f"\nDone! ZH screenshots: {OUT_ZH}")
    print(f"EN screenshots: {OUT_EN}")
