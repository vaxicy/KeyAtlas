"""
KeyAtlas — Chrome Web Store Promo Tile Generator (bilingual + style-matched)
Outputs BILINGUAL (zh + en together) tiles:
  promo-small-bilingual-440x280.png
  promo-large-bilingual-1400x560.png
Visual language mirrors css/style.css:
  bg #f5f6f8 · surface #fff · border #e5e8ec · text #1a1d21 · sub #5a6675
  primary #6366f1 · grad 135deg #4F46E5→#7C3AED · accent #ffb020
  key badge: #f5f3ff bg / #ddd6fe border / #5b21b6 text (monospace)

FIXES v3:
  - Small promo: complete layout restructure — fewer bigger cards, breathing room
  - Large promo: popup internal spacing fixed (same as screenshots v3)
  - Category grid: more padding, text safe from edges
  - CTA / status pills: smaller font, no edge-touching
  - All element spacing: minimum 8px gaps enforced
"""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "store-assets"
OUT.mkdir(parents=True, exist_ok=True)

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
    cands += [Path("C:/Windows/Fonts/consola.ttf"), Path("C:/Windows/Fonts/consolab.ttf")]
    for c in cands:
        if c.exists():
            return ImageFont.truetype(str(c), size)
    return font(size, bold)


F = {
    "h1": font(40, bold=True),
    "h2": font(28, bold=True),
    "h3": font(20, bold=True),
    "h4": font(17, bold=True),
    "body": font(16),
    "small": font(13),
    "tiny": font(11),
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


def paragraph(draw, xy, value, max_width, f=None, fill=COLORS["sub"], leading=6):
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
    f = f or mono(18, bold=True)
    pad = 10
    w = draw.textlength(value, font=f) + pad * 2
    r = min(7, h // 2)
    draw.rounded_rectangle((x, y, x + w, y + h), radius=r,
                           fill=COLORS["key_bg"], outline=COLORS["key_border"], width=1)
    draw.text((x + w // 2, y + h // 2), value, fill=COLORS["key_text"], font=f, anchor="mm")
    return w


def popup_mock(draw, img, x, y, scale=1.0, lang="zh"):
    """Faithful mock of the KeyAtlas popup (see popup.html + css/style.css)."""
    pw, ph = int(380 * scale), int(540 * scale)
    card(draw, (x, y, x + pw, y + ph), fill=COLORS["surface"], radius=14)

    # header: gradient logo + brand + tagline
    lx, ly = x + int(16 * scale), y + int(16 * scale)
    ls = int(30 * scale)
    gradient_rect(img, draw, (lx, ly, lx + ls, ly + ls), COLORS["grad1"], COLORS["grad2"], radius=int(7 * scale))
    bn, bt = max(9, int(16 * scale)), max(7, int(10 * scale))
    brand_x = lx + ls + int(12 * scale)
    brand_y = ly + int(2 * scale)
    text(draw, (brand_x, brand_y), "KeyAtlas",
         fill=COLORS["text"], f=font(bn, bold=True))
    # FIX v3: tagline +6px extra gap below brand name
    tag = "快捷键搜索引擎" if lang == "zh" else "Shortcut Search Engine"
    text(draw, (brand_x, brand_y + bn + int(6 * scale)), tag,
         fill=COLORS["sub"], f=font(bt))

    sb_y = ly + ls + int(16 * scale)
    sb_h = int(40 * scale)
    card(draw, (x + int(16 * scale), sb_y, x + pw - int(16 * scale), sb_y + sb_h),
         fill=COLORS["surface"], radius=int(12 * scale), shadow=False)
    stxt = "搜索快捷键..." if lang == "zh" else "Search shortcuts..."
    text(draw, (x + int(30 * scale), sb_y + sb_h // 2), stxt,
         fill=COLORS["sub"], f=font(max(9, int(14 * scale))), anchor="lm")

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
                 fill=COLORS["surface"], radius=int(9 * scale), shadow=False)
            tf = COLORS["sub"]
        text(draw, (tx + (tw - int(8 * scale)) // 2, tab_y + tab_h // 2), t,
             fill=tf, f=font(max(9, int(12 * scale)), bold=(i == 0)), anchor="mm")

    # category tiles — NO emoji, colored left bar + translated names
    cy0 = tab_y + tab_h + int(14 * scale)
    if lang == "zh":
        cats = [("设计", "40"), ("开发", "26"), ("效率", "28"), ("视频", "10")]
    else:
        cats = [("Design", "40"), ("Dev", "26"), ("Productivity", "28"), ("Video", "10")]
    cat_colors = [COLORS["purple"], COLORS["primary"], COLORS["violet"], COLORS["violet"]]
    cw = (pw - int(36 * scale)) // 2
    ch = int(54 * scale)
    for i, (nm, cnt) in enumerate(cats):
        col, row = i % 2, i // 2
        cx = x + int(16 * scale) + col * (cw + int(8 * scale))
        cyy = cy0 + row * (ch + int(8 * scale))
        card(draw, (cx, cyy, cx + cw, cyy + ch), fill=COLORS["surface"],
             radius=int(10 * scale), shadow=False)
        bar_top = cyy + max(4, int(10 * scale))
        bar_bot = cyy + ch - max(4, int(10 * scale))
        if bar_bot > bar_top + 2:
            clr = cat_colors[i]
            draw.rounded_rectangle((cx + 8, bar_top, cx + 14, bar_bot), radius=2, fill=clr)
        # FIX v3: text x offset 28 (was 22) — bar no longer overlaps text
        txt_x = cx + int(28 * scale)
        text(draw, (txt_x, cyy + int(10 * scale)), nm,
             fill=COLORS["text"], f=font(max(10, int(13 * scale)), bold=True))
        text(draw, (txt_x, cyy + ch - int(18 * scale)),
             (f"{cnt} 款" if lang == "zh" else f"{cnt} apps"),
             fill=COLORS["sub"], f=font(max(9, int(10 * scale))))

    # shortcut cards — FIX v3: more spacing after kbd badge
    sy0 = cy0 + 2 * (ch + int(8 * scale)) + int(8 * scale)
    if lang == "zh":
        items = [("Ctrl+S", "保存", "VS Code"), ("⌘+N", "新建", "macOS")]
    else:
        items = [("Ctrl+S", "Save", "VS Code"), ("Cmd+N", "New", "macOS")]
    ih = int(40 * scale)
    for i, (k, act, src) in enumerate(items):
        iy = sy0 + i * (ih + int(8 * scale))
        card(draw, (x + int(12 * scale), iy, x + pw - int(12 * scale), iy + ih),
             fill=COLORS["surface"], radius=int(10 * scale), shadow=False)
        kw = kbd_badge(draw, x + int(18 * scale), iy + int(6 * scale), k, ih - int(12 * scale),
                       f=mono(max(10, int(13 * scale))))
        # FIX v3: +10px after badge (was cramped at +4px)
        text(draw, (x + int(18 * scale) + kw + int(10 * scale), iy + int(8 * scale)), act,
             fill=COLORS["text"], f=font(max(10, int(13 * scale)), bold=True))
        text(draw, (x + int(18 * scale) + kw + int(10 * scale), iy + ih - int(16 * scale)), src,
             fill=COLORS["sub"], f=font(max(9, int(10 * scale))))

    # bottom status bar — FIX v3: more padding, smaller font
    bb = y + ph - int(36 * scale)
    card(draw, (x + int(14 * scale), bb, x + pw - int(14 * scale), y + ph - int(10 * scale)),
         fill=COLORS["surface"], radius=int(10 * scale), shadow=False)
    stat = "129 应用 · 离线可用" if lang == "zh" else "Apps · Offline"
    text(draw, (x + pw // 2, bb + int(13 * scale)), stat,
         fill=COLORS["sub"], f=font(max(9, int(10 * scale))), anchor="mm")


# ── Small Promo Tile (440 × 280) — BILINGUAL ─────────────────
# FIX v5: Ultra-clean mini-popup (no noisy category/shortcut internals),
#   better spacing, crisper visual hierarchy.

def small_promo_bilingual():
    W, H = 440, 280
    img = Image.new("RGB", (W, H), COLORS["bg"])
    d = ImageDraw.Draw(img)

    # ── banner (compact gradient) ──
    bh = 42
    gradient_rect(img, d, (10, 8, W - 10, 8 + bh), COLORS["grad1"], COLORS["grad2"], radius=12)
    text(d, (20, 14), "KeyAtlas", fill="white", f=font(15, bold=True))
    text(d, (20, 32), "快捷键搜索引擎 · Shortcut Search Engine", fill="#e9e7ff", f=font(9))

    # ── ultra-clean mini popup (left side) — only recognizable shell ──
    # No category grid, no shortcut cards — just header + search + tabs + status
    px, py, pscale = 10, 56, 0.32   # 122 × 173 px — slightly larger but cleaner inside
    pw, ph = int(380 * pscale), int(540 * pscale)
    # outer shell
    card(d, (px, py, px + pw, py + ph), radius=14, shadow=False)

    # logo block (gradient square)
    lx, ly = px + int(16 * pscale), py + int(14 * pscale)
    ls = int(28 * pscale)
    gradient_rect(img, d, (lx, ly, lx + ls, ly + ls), COLORS["grad1"], COLORS["grad2"],
                  radius=int(6 * pscale))
    # brand name + tagline
    bn = max(9, int(15 * pscale))
    bt = max(7, int(9 * pscale))
    text(d, (lx + ls + int(10 * pscale), ly + int(2 * pscale)), "KeyAtlas",
         f=font(bn, bold=True))
    text(d, (lx + ls + int(10 * pscale), ly + bn + int(4 * pscale)),
         "快捷键搜索引擎", fill=COLORS["sub"], f=font(bt))

    # search bar
    sby = ly + ls + int(12 * pscale)
    sbh = int(34 * pscale)
    card(d, (px + int(14 * pscale), sby, px + pw - int(14 * pscale), sby + sbh),
         fill=COLORS["surface"], radius=int(10 * pscale), shadow=False)
    text(d, (px + int(24 * pscale), sby + sbh // 2), "搜索快捷键...",
         fill=COLORS["sub"], f=font(max(8, int(12 * pscale))), anchor="lm")

    # tab row (just 2 visible tabs to avoid crowding)
    ty = sby + sbh + int(8 * pscale)
    th = int(26 * pscale)
    tw_tab = (pw - int(28 * pscale)) // 2
    # active tab (gradient)
    gradient_rect(img, d, (px + int(14 * pscale), ty,
                           px + int(14 * pscale) + tw_tab - int(6 * pscale), ty + th),
                  COLORS["grad1"], COLORS["grad2"], radius=int(8 * pscale))
    text(d, (px + int(14 * pscale) + (tw_tab - int(6 * pscale)) // 2, ty + th // 2),
         "全部", fill="white", f=font(max(8, int(11 * pscale)), bold=True), anchor="mm")
    # inactive tab
    card(d, (px + int(14 * pscale) + tw_tab + int(2 * pscale), ty,
             px + pw - int(14 * pscale), ty + th),
         fill=COLORS["surface"], radius=int(8 * pscale), shadow=False)
    text(d, (px + int(14 * pscale) + tw_tab + int(2 * pscale) + (pw - int(28 * pscale) - tw_tab) // 2,
             ty + th // 2),
         "收藏", fill=COLORS["sub"], f=font(max(8, int(11 * pscale))), anchor="mm")

    # status bar at bottom
    bby = py + ph - int(30 * pscale)
    card(d, (px + int(12 * pscale), bby, px + pw - int(12 * pscale), py + ph - int(8 * pscale)),
         fill=COLORS["surface"], radius=int(8 * pscale), shadow=False)
    text(d, (px + pw // 2, bby + int(10 * pscale)), "129 应用 · 离线可用",
         fill=COLORS["sub"], f=font(max(8, int(9 * pscale))), anchor="mm")

    # ── feature bullets (right of popup) — plain text lines, NO card wrappers ──
    rx = px + pw + 12   # 12px gap after popup
    features = [
        ("即时搜索", "Instant Search", COLORS["primary"]),
        ("129 应用 · 离线", "129 Apps · Offline", COLORS["violet"]),
        ("免费 · 中英双语", "Free · Bilingual EN/中文", COLORS["accent"]),
    ]
    line_h = 38
    gap = 8
    for i, (cn, en, clr) in enumerate(features):
        fy = py + 4 + i * (line_h + gap)
        if fy + line_h > H - 40:
            break
        # colored dot indicator
        d.ellipse((rx + 4, fy + 12, rx + 18, fy + 26), fill=clr)
        text(d, (rx + 28, fy + 3), cn, f=font(12, bold=True))
        text(d, (rx + 28, fy + 19), en, fill=COLORS["sub"], f=font(10))

    # ── bottom CTA strip ──
    cta_y = H - 36
    cta_h = 30
    gradient_rect(img, d, (rx, cta_y, W - 10, cta_y + cta_h), COLORS["grad1"], COLORS["grad2"], radius=14)
    cta_cx = (rx + W - 10) // 2
    text(d, (cta_cx, cta_y + cta_h // 2), "免费安装 / Free · Install",
         fill="white", f=font(12, bold=True), anchor="mm")

    img.save(OUT / "promo-small-bilingual-440x280.png")


# ── Large Promo Tile (1400 × 560) — BILINGUAL ────────────────

def large_promo_bilingual():
    W, H = 1400, 560
    img = Image.new("RGB", (W, H), COLORS["bg"])
    d = ImageDraw.Draw(img)

    # banner (gradient) — title + bilingual subtitle
    gradient_rect(img, d, (32, 20, W - 32, 100), COLORS["grad1"], COLORS["grad2"], radius=16)
    text(d, (60, 32), "KeyAtlas — 快捷键搜索引擎", fill="white", f=font(32, bold=True))
    text(d, (62, 76), "Shortcut Search Engine · 129 应用 · 5374 快捷键 · 7 分类 · 5 系统 · 离线 · 中英双语",
         fill="#e9e7ff", f=font(14))

    # Col 1: popup mock (left)
    popup_mock(d, img, 36, 114, scale=0.70, lang="zh")

    # Col 2: feature highlights (center-left)
    cx = 310
    cy = 126
    text(d, (cx, cy), "即时搜索，一秒找到", f=font(22, bold=True))
    text(d, (cx, cy + 30), "Find any shortcut instantly", fill=COLORS["sub"], f=font(14))
    paragraph(d, (cx, cy + 56),
              "输入操作名称或应用名，结果实时呈现。支持模糊匹配与拼音搜索。",
              470, f=font(14), leading=4)
    paragraph(d, (cx, cy + 104),
              "Type any action or app name — results appear as you type. Fuzzy & pinyin search.",
              470, f=font(12), fill=COLORS["sub"], leading=3)

    # key demo panel
    dp_y = cy + 152
    card(d, (cx, dp_y, cx + 480, dp_y + 56), radius=12, shadow=False)
    kbd_badge(d, cx + 18, dp_y + 12, "Ctrl+S", 32, f=mono(18))
    text(d, (cx + 118, dp_y + 12), "保存文档 / Save", f=font(15, bold=True))
    text(d, (cx + 118, dp_y + 34), "VS Code · Photoshop · Word …", fill=COLORS["sub"], f=font(12))

    # quick stats badges
    bd_y = dp_y + 70
    badges = [("129 应用", COLORS["primary"]), ("5374 快捷键", COLORS["violet"]),
              ("7 分类", COLORS["purple"]), ("5 系统", COLORS["accent"]), ("离线", COLORS["primary_strong"])]
    bw = 88
    for i, (label, clr) in enumerate(badges):
        bx = cx + i * (bw + 10)
        d.rounded_rectangle((bx, bd_y, bx + bw, bd_y + 34), radius=8, fill=clr)
        text(d, (bx + bw // 2, bd_y + 9), label, fill="white", f=font(11, bold=True), anchor="ma")
    text(d, (cx, bd_y + 42), "Apps · Shortcuts · Categories · Systems · Offline",
         fill=COLORS["sub"], f=font(11))

    # Col 3: category grid (right) — 2 columns × 3 rows, NO emoji
    rx = 850
    text(d, (rx, 120), "按分类浏览", f=font(17, bold=True))
    text(d, (rx, 144), "Browse by Category", fill=COLORS["sub"], f=font(12))

    categories = [
        ("设计 Design", "40", COLORS["purple"]),
        ("开发 Dev", "26", COLORS["primary"]),
        ("效率 Productivity", "28", COLORS["violet"]),
        ("浏览器 Browser", "8", COLORS["primary_strong"]),
        ("视频 Video", "10", COLORS["violet"]),
        ("音频 Audio", "11", COLORS["accent"]),
    ]
    ew, eh = 140, 58   # FIX v3: slightly wider cards
    gap_x, gap_y = 14, 10
    for i, (nm, cnt, clr) in enumerate(categories):
        col, row = i % 2, i // 2
        ex = rx + col * (ew + gap_x)
        ey = 172 + row * (eh + gap_y)
        card(d, (ex, ey, ex + ew, ey + eh), radius=10, shadow=False)
        # colored square indicator (no emoji)
        d.rounded_rectangle((ex + 10, ey + 10, ex + 32, ey + 32), radius=5, fill=clr)
        # FIX v3: more padding, slightly smaller font to prevent edge-touching
        text(d, (ex + 42, ey + 10), nm, f=font(11, bold=True))
        text(d, (ex + 12, ey + eh - 14), f"{cnt} 款/apps", fill=COLORS["sub"], f=font(9))

    # CTA block (bottom-right) — safe bottom margin: 560 - 12 = 548
    pro_x, pro_y = 850, 384
    pro_h = 156  # 384 + 156 = 540 < 548 ✓
    card(d, (pro_x, pro_y, W - 32, pro_y + pro_h), radius=14, shadow=False)

    gradient_rect(img, d, (pro_x + 16, pro_y + 14, pro_x + 80, pro_y + 36), COLORS["grad1"], COLORS["grad2"], radius=8)
    text(d, (pro_x + 48, pro_y + 15), "FREE", fill="white", f=font(11, bold=True), anchor="ma")
    text(d, (pro_x + 88, pro_y + 14), "免费使用 / Free", f=font(16, bold=True))

    text(d, (pro_x + 16, pro_y + 48), "零网络依赖 · 零追踪 · 中英双语切换",
         fill=COLORS["sub"], f=font(12))
    text(d, (pro_x + 16, pro_y + 66), "No network · No tracking · Bilingual EN / 中文",
         fill=COLORS["sub"], f=font(11))

    # FIX v3: CTA button — smaller font so text doesn't touch edges
    cta_w, cta_h = 190, 38
    gradient_rect(img, d, (pro_x + 16, pro_y + 96, pro_x + 16 + cta_w, pro_y + 96 + cta_h),
                  COLORS["grad1"], COLORS["grad2"], radius=20)
    text(d, (pro_x + 16 + cta_w // 2, pro_y + 96 + cta_h // 2), "立即安装 / Install Now",
         fill="white", f=font(13, bold=True), anchor="mm")   # FIX v3: 13 (was 15), mm anchor for true center

    img.save(OUT / "promo-large-bilingual-1400x560.png")


if __name__ == "__main__":
    print("Generating bilingual small promo tile...")
    small_promo_bilingual()
    print(f"  {OUT / 'promo-small-bilingual-440x280.png'}")

    print("Generating bilingual large promo tile...")
    large_promo_bilingual()
    print(f"  {OUT / 'promo-large-bilingual-1400x560.png'}")
