/**
 * KeyAtlas main controller.
 * Wires up tabs, search, categories, favorites, recent, settings and
 * OS auto-detection. All dynamic text goes through i18n so switching
 * language re-renders every dynamic region.
 */
(function () {
  "use strict";

  const state = {
    tab: "search",
    query: "",
    os: "windows",
    catView: null, // categories home group: 'system' | 'software' | 'scenes' | null
    catDrill: null, // drilled target: 'os:windows' | 'app:chrome' | 'cat:design' | null
    detail: null, // shortcut id currently shown in detail view, or null
    activeIdx: -1, // keyboard-nav highlighted card index
    filterOS: "all", // OS filter for search results: 'all' | 'windows' | 'mac' | 'linux'
    favSet: new Set(),
    incognito: false // when true, do not record recently viewed shortcuts
  };

  const OS_META = {
    windows: { icon: "🪟", key: "os_windows" },
    mac: { icon: "🍎", key: "os_mac" },
    linux: { icon: "🐧", key: "os_linux" },
    chromeos: { icon: "🖥️", key: "os_chromeos" },
    ios: { icon: "📱", key: "os_ios" }
  };

  const VERSION = "1.1.0";
  const PAYPAL_URL = "https://www.paypal.com/ncp/payment/BGHTVB7ZG3XPC";
  let currentTheme = "light";

  // Cached DOM
  const el = {
    content: document.getElementById("content"),
    searchInput: document.getElementById("searchInput"),
    clearSearch: document.getElementById("clearSearch"),
    tabs: document.getElementById("tabs"),
    // settings overlay
    webBtn: document.getElementById("webBtn"),
    settingsBtn: document.getElementById("settingsBtn"),
    settingsPanel: document.getElementById("settingsPanel"),
    settingsBackdrop: document.getElementById("settingsBackdrop"),
    closeSettings: document.getElementById("closeSettings"),
    setLang: document.getElementById("setLang"),
    setTheme: document.getElementById("setTheme"),
    incognitoToggle: document.getElementById("incognitoToggle"),
    aboutVersion: document.getElementById("aboutVersion"),
    paypalBtn: document.getElementById("paypalBtn"),
    wechatBtn: document.getElementById("wechatBtn"),
    wechatLightbox: document.getElementById("wechatLightbox"),
    toast: document.getElementById("toast"),
    detailDrawer: document.getElementById("detailDrawer"),
    detailPanel: document.getElementById("detailPanel")
  };

  /* ---------- OS detection ---------- */
  function detectOS() {
    const p = (navigator.userAgentData?.platform || navigator.platform || navigator.userAgent).toLowerCase();
    if (p.includes("mac")) return "mac";
    if (p.includes("linux") && !p.includes("android")) return "linux";
    return "windows";
  }

  /* ---------- Static i18n ---------- */
  function applyStaticI18n() {
    const t = i18n.t;
    document.querySelectorAll("[data-i18n]").forEach((node) => {
      const key = node.getAttribute("data-i18n");
      if (t[key] != null) node.textContent = t[key];
    });
    el.searchInput.placeholder = t.searchPlaceholder;
    el.settingsBtn.setAttribute("data-tooltip", t.settings);
    el.settingsBtn.setAttribute("aria-label", t.settings);
    el.webBtn.setAttribute("data-tooltip", t.openWeb);
    el.webBtn.setAttribute("aria-label", t.openWeb);
    document.documentElement.lang = i18n.lang;
    if (el.aboutVersion) el.aboutVersion.textContent = i18n.format(t.aboutVersion, { n: VERSION });
  }
  function renderKeyLegend() {
    const t = i18n.t;
    const items = [
      { sym: "⌘", word: t.legCommand },
      { sym: "⌥", word: t.legOption },
      { sym: "⇧", word: t.legShift },
      { sym: "⌃", word: t.legCtrl },
      { sym: "⊞", word: t.legWin },
    ];
    return items
      .map((it) => `<span class="leg-item"><span class="leg-sym">${it.sym}</span>= ${escapeHTML(it.word)}</span>`)
      .join("");
  }

  /* ---------- Toast ---------- */
  let toastTimer;
  function toast(msg) {
    el.toast.textContent = msg;
    el.toast.hidden = false;
    requestAnimationFrame(() => el.toast.classList.add("show"));
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      el.toast.classList.remove("show");
      setTimeout(() => (el.toast.hidden = true), 220);
    }, 1400);
  }

  /* ---------- Key rendering ---------- */
  // Resolve the effective OS for key display.
  // When drilling into "os:mac" / "os:linux" category, show that OS's keys;
  // otherwise fall back to filterOS > auto-detected state.os.
  function effectiveOS() {
    if (state.catDrill && state.catDrill.startsWith("os:")) return state.catDrill.split(":")[1];
    return (state.filterOS && state.filterOS !== "all") ? state.filterOS : state.os;
  }
  function keyForOS(s) {
    const p = effectiveOS();
    return s[p] || s.windows || s.mac || s.linux || "—";
  }
  function renderKeys(combo) {
    // Take only the primary combo when alternatives are listed with "/" or "或"
    const primary = String(combo).split(/\s*(?:\/|或)\s*/)[0].trim();
    // Entries like "无默认(Alt+点击图标)" contain CJK → render as plain text, not badges
    if (/[一-鿿]/.test(primary)) {
      return `<span class="kbd-none">${escapeHTML(primary)}</span>`;
    }
    const MOD = {
      Ctrl: "⌃", Command: "⌘", Cmd: "⌘", "⌘": "⌘",
      Alt: "⌥", Option: "⌥", "⌥": "⌥",
      Shift: "⇧", Win: "⊞", "⊞": "⊞",
    };
    return primary
      .split(/\s*\+\s*/)
      .map((k) => k.trim())
      .filter(Boolean)
      .map((k) => {
        // strip trailing "(...)" annotations like "(盖印图层)"
        const raw = k.replace(/\([^)]*\)/g, "").trim() || k;
        const label = MOD[raw] || raw;
        const long = raw.length > 8 ? " long" : "";
        return `<span class="kbd${long}">${escapeHTML(label)}</span>`;
      })
      .join('<span class="kbd-plus">+</span>');
  }

  function escapeHTML(str) {
    return String(str).replace(/[&<>"']/g, (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])
    );
  }

  // Escape text, then wrap case-insensitive matches of `q` in <mark>.
  function highlight(text, q) {
    const safe = escapeHTML(text);
    const term = String(q || "").trim();
    if (!term) return safe;
    const re = new RegExp("(" + term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + ")", "ig");
    return safe.replace(re, "<mark>$1</mark>");
  }

  /* ---------- Shortcut card ---------- */
  // Returns the platform tag(s) for a card. A shortcut covering all three OSes
  // shows a single "通用/Universal" badge; two OSes show both; one shows that one.
  function platformTagsHTML(s, overrideOS) {
    const t = i18n.t;
    const ctx = overrideOS || null;
    const present = ["windows", "mac", "linux"].filter((p) => {
      const v = s[p];
      return v && v !== "—";
    });
    // When viewing inside a specific OS drill-down, highlight that OS as the primary tag
    if (ctx && present.includes(ctx)) {
      const m = OS_META[ctx];
      return `<span class="card-os">${m.icon} ${t[m.key]}</span>`;
    }
    if (present.length >= 3) {
      return `<span class="card-os card-os-universal">🌐 ${t.os_universal}</span>`;
    }
    if (present.length === 2) {
      return present
        .map((p) => {
          const m = OS_META[p];
          return `<span class="card-os">${m.icon} ${t[m.key]}</span>`;
        })
        .join("");
    }
    const only = present[0] ? OS_META[present[0]] : OS_META[state.os];
    return `<span class="card-os">${only.icon} ${t[only.key]}</span>`;
  }

  function cardHTML(s, q, opts) {
    opts = opts || {};
    const app = DataStore.getApp(s.appId);
    const appName = app ? escapeHTML(i18n.pick(app.name)) : "";
    const isSystem = app && app.type === "system";
    const fav = state.favSet.has(s.id);
    const t = i18n.t;
    // System shortcuts already carry the OS in their app label, so we skip the
    // redundant OS tag there; software shortcuts show which OS the key is for.
    const osTag = isSystem ? "" : platformTagsHTML(s, state.catDrill && state.catDrill.startsWith("os:") ? state.catDrill.split(":")[1] : null);
    const delBtn = opts.del
      ? `<button class="del-btn" data-del="${s.id}" title="${t.removeRecentOne}" aria-label="${t.removeRecentOne}">🗑️</button>`
      : "";
    return `
      <div class="card" data-id="${s.id}" role="button" tabindex="0" aria-label="${escapeHTML(i18n.pick(s.name))}">
        <div class="card-main">
          <div class="card-title-row">
            <span class="card-title">${highlight(i18n.pick(s.name), q)}</span>
            ${appName ? `<span class="card-app">${appName}</span>` : ""}
          </div>
          <div class="card-meta">
            ${osTag}
            <span class="card-desc">${highlight(i18n.pick(s.description), q)}</span>
          </div>
        </div>
        <div class="card-keys">${renderKeys(keyForOS(s))}</div>
        ${delBtn}
        <button class="copy-btn" data-copycard="${s.id}" title="${t.copyTitle}" aria-label="${t.copyTitle}">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="9" y="9" width="11" height="11" rx="2"></rect>
            <path d="M5 15V5a2 2 0 0 1 2-2h10"></path>
          </svg>
        </button>
        <button class="star-btn ${fav ? "active" : ""}" data-star="${s.id}"
          title="${fav ? t.removeFav : t.addFav}" aria-label="${fav ? t.removeFav : t.addFav}">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="${fav ? "currentColor" : "none"}"
            stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
          </svg>
        </button>
      </div>`;
  }

  function listHTML(items, q) {
    const t = i18n.t;
    return (
      `<div class="section-title">${i18n.format(t.resultsCount, { n: items.length })}</div>` +
      (q ? `<div class="kbd-hint" data-i18n="kbdHint">${t.kbdHint}</div>` : "") +
      items.map((s) => cardHTML(s, q)).join("")
    );
  }

  /* ---------- OS filter bar (search results) ---------- */
  function osFilterBarHTML() {
    const t = i18n.t;
    const opts = [
      { id: "all", icon: "🌐", key: "all" },
      { id: "windows", icon: "🪟", key: "os_windows" },
      { id: "mac", icon: "🍎", key: "os_mac" },
      { id: "linux", icon: "🐧", key: "os_linux" }
    ];
    return (
      `<div class="os-filter segmented" role="group" aria-label="${t.filterLabel}">` +
      opts
        .map(
          (o) =>
            `<button class="${state.filterOS === o.id ? "active" : ""}" data-osfilter="${o.id}" aria-pressed="${state.filterOS === o.id}">${o.icon} ${t[o.key]}</button>`
        )
        .join("") +
      `</div>`
    );
  }

  function emptyHTML(emoji, title, hint) {
    return `<div class="empty"><span class="empty-emoji">${emoji}</span>
      <div class="empty-title">${title}</div>
      <div class="empty-hint">${hint}</div></div>`;
  }

  /* ---------- Renderers per tab ---------- */
  function render() {
    clearActiveCard();
    if (state.detail) closeDetail();
    if (state.tab === "search") return renderSearch();
    if (state.tab === "categories") return renderCategories();
    if (state.tab === "favorites") return renderFavorites();
    if (state.tab === "recent") return renderRecent();
  }

  function renderSearch() {
    const t = i18n.t;
    const q = state.query.trim();
    if (!q) {
      renderHomepage();
      return;
    }
    // "@keyword" jumps straight to the matching app's shortcuts (less drilling).
    if (q.startsWith("@")) {
      const term = q.slice(1).trim();
      if (term) {
        const matched = DataStore.apps.filter((a) => {
          const n = i18n.pick(a.name).toLowerCase();
          return n.includes(term) || (a.name.en || "").toLowerCase().includes(term) || (a.name.zh || "").toLowerCase().includes(term);
        });
        if (matched.length) {
          const groups = matched
            .map((a) => {
              const items = DataStore.getShortcutsByApp(a.id);
              if (!items.length) return "";
              return `<div class="section-title">${a.icon || ""} ${escapeHTML(i18n.pick(a.name))}</div>` +
                items.map((s) => cardHTML(s, "")).join("");
            })
            .join("");
          if (groups) {
            el.content.innerHTML = osFilterBarHTML() + groups;
            return;
          }
        }
      }
    }
    const baseResults = SearchEngine.search(q);
    let results = baseResults;
    const filteredOut = state.filterOS && state.filterOS !== "all";
    if (filteredOut) {
      results = baseResults.filter((s) => {
        const v = s[state.filterOS];
        return v && v !== "—";
      });
    }
    if (!results.length) {
      const chips = exampleChips()
        .map((e) => `<button class="pill pill-ghost" data-example="${escapeHTML(e.term)}">${escapeHTML(e.label)}</button>`)
        .join("");
      const resetBtn = filteredOut && baseResults.length
        ? `<div class="suggest" style="margin-top:14px"><button class="empty-action" data-resetfilter="1">${t.showAllPlatforms}</button></div>`
        : "";
      el.content.innerHTML =
        osFilterBarHTML() +
        emptyHTML("🤔", i18n.format(t.noResultsQuery, { q }), t.noResultsHint) +
        `<div class="suggest"><div class="suggest-title">${t.suggestTitle}</div><div class="pills">${chips}</div></div>` +
        resetBtn;
      return;
    }
    el.content.innerHTML = osFilterBarHTML() + listHTML(results, q);
  }

  /* ---------- Homepage (search-first landing) ---------- */
  function quickStartItems() {
    const terms = i18n.lang === "zh"
      ? ["复制", "粘贴", "撤销", "截图"]
      : ["copy", "paste", "undo", "screenshot"];
    const seen = new Set();
    const out = [];
    for (const term of terms) {
      const list = SearchEngine.search(term);
      if (list.length) {
        // Prefer the OS-level shortcut matching the user's OS so Quick Start
        // shows the native key (e.g. Ctrl+C for Windows, ⌘+C for macOS).
        const preferredAppId = state.os;
        let sys = list.find((s) => {
          const a = DataStore.getApp(s.appId);
          return a && a.type === "system" && s.appId === preferredAppId;
        });
        if (!sys) {
          sys = list.find((s) => {
            const a = DataStore.getApp(s.appId);
            return a && a.type === "system";
          }) || list[0];
        }
        if (!seen.has(sys.id)) {
          seen.add(sys.id);
          out.push(sys);
        }
      }
    }
    return out;
  }

  function exampleChips() {
    const zh = i18n.lang === "zh";
    return [
      { label: zh ? "复制" : "Copy", term: zh ? "复制" : "copy" },
      { label: zh ? "截图" : "Screenshot", term: zh ? "截图" : "screenshot" },
      { label: zh ? "刷新页面" : "Refresh page", term: zh ? "刷新页面" : "refresh" },
      { label: "Ctrl + C", term: "ctrl+c" },
      { label: "Figma", term: "Figma" },
      { label: "VS Code", term: "VS Code" }
    ];
  }

  function renderHomepage() {
    const t = i18n.t;
    const qsCards = quickStartItems().map(cardHTML).join("");
    const popApps = DataStore.apps.filter((a) => a.popular).map((a) => a.id);
    const popChips = popApps
      .map((id) => {
        const a = DataStore.getApp(id);
        if (!a) return "";
        return `<button class="pill" data-app="${id}">${a.icon || ""} ${escapeHTML(i18n.pick(a.name))}</button>`;
      })
      .join("");
    const exChips = exampleChips()
      .map((e) => `<button class="pill pill-ghost" data-example="${escapeHTML(e.term)}">${escapeHTML(e.label)}</button>`)
      .join("");
    el.content.innerHTML = `
      <div class="home">
        <div class="home-section">
          <div class="home-title">${t.quickStart}</div>
          <div class="home-cards">${qsCards}</div>
        </div>
        <div class="home-section">
          <div class="home-title">${t.popularApps}</div>
          <div class="pills">${popChips}</div>
        </div>
        <div class="home-section">
          <div class="home-title">${t.trySearch}</div>
          <div class="pills">${exChips}</div>
        </div>
      </div>
      <div class="key-legend">${renderKeyLegend()}</div>`;
  }

  function renderCategories() {
    const t = i18n.t;
    const d = state.catDrill;

    // Drilled into a concrete target
    if (d) {
      const [kind, id] = d.split(":");
      if (kind === "os") {
        const items = DataStore.shortcuts.filter((s) => {
          const a = DataStore.getApp(s.appId);
          // Only show shortcuts belonging to this OS app (e.g. os:linux → appId=linux)
          // so the card label correctly shows the OS name, not a different OS.
          return a && a.type === "system" && s[id] && s.appId === id;
        });
        const m = OS_META[id] || OS_META.windows;
        el.content.innerHTML = subheadHTML(`${m.icon} ${t[m.key]}`) + listHTML(items);
        return;
      }
      if (kind === "app") {
        const app = DataStore.getApp(id);
        const items = DataStore.getShortcutsByApp(id);
        el.content.innerHTML =
          subheadHTML(`${app.icon || ""} ${escapeHTML(i18n.pick(app.name))}`) + listHTML(items);
        return;
      }
      if (kind === "cat") {
        const cat = DataStore.getCategory(id);
        const apps = DataStore.apps.filter((a) => a.category === id);
        const items = DataStore.getShortcutsByCategory(id);
        const chips = apps
          .map(
            (a) =>
              `<button class="chip" data-drill="app:${a.id}">${a.icon || ""} ${escapeHTML(i18n.pick(a.name))}</button>`
          )
          .join("");
        el.content.innerHTML =
          subheadHTML(`${cat.icon || ""} ${escapeHTML(i18n.pick(cat.name))}`) +
          (chips ? `<div class="chips">${chips}</div>` : "") +
          listHTML(items);
        return;
      }
    }

    // Group views
    if (state.catView === "system") {
      const sysApps = DataStore.apps.filter((a) => a.type === "system");
      const tiles = sysApps
        .map((a) => {
          // 三大桌面 OS 走 os: 下钻（按平台字段过滤），其余系统应用（ChromeOS/iOS）走 app: 下钻（显示全部快捷键）
          const isPlatformOS = ["windows", "mac", "linux"].includes(a.id);
          const drill = isPlatformOS ? `os:${a.id}` : `app:${a.id}`;
          const m = OS_META[a.id] || { icon: a.icon, key: null };
          const label = m.key ? t[m.key] : i18n.pick(a.name);
          return `<div class="cat-tile" data-drill="${drill}"><span class="cat-emoji">${m.icon || a.icon}</span><div class="cat-info"><span class="cat-name">${label}</span></div></div>`;
        })
        .join("");
      el.content.innerHTML = subheadHTML(t.grpSystem) + `<div class="cat-list">${tiles}</div>`;
      return;
    }
    if (state.catView === "software") {
      const apps = DataStore.apps.filter((a) => a.type === "software");
      // Group apps by first letter for quick scanning
      const groups = new Map();
      for (const a of apps) {
        const name = i18n.pick(a.name);
        // 分组键优先用 sortKey（约定为拼音首字母，如 Feishu/Qiye/Jishi）；
        // 若未设 sortKey 且显示名为中文，回退到英文名首字母，避免以汉字作分组标题。
        const sortKey = a.sortKey || a.name.en || name;
        let letter = (sortKey[0] || "#").toUpperCase();
        // 防御：万一首字符仍是中文（漏设 sortKey 且英文名也是中文），归入 # 组
        if (/[一-鿿]/.test(letter)) letter = "#";
        if (!groups.has(letter)) groups.set(letter, []);
        groups.get(letter).push(a);
      }
      const letters = Array.from(groups.keys()).sort((a, b) => a.localeCompare(b));
      const indexBar = `<div class="alpha-index">${letters
        .map((l) => `<button class="alpha-link" data-alpha="${l}" title="${l}">${l}</button>`)
        .join("")}</div>`;
      let body = "";
      for (const l of letters) {
        const chips = groups
          .get(l)
          .map(
            (a) =>
              `<button class="chip" data-drill="app:${a.id}">${a.icon || ""} ${escapeHTML(i18n.pick(a.name))}</button>`
          )
          .join("");
        body += `<div class="alpha-group" data-alpha-group="${l}">
          <div class="alpha-letter">${l}</div>
          <div class="chips">${chips}</div>
        </div>`;
      }
      el.content.innerHTML = subheadHTML(t.grpSoftware) + indexBar + body;
      return;
    }
    if (state.catView === "scenes") {
      const tiles = DataStore.categories
        .filter((c) => DataStore.getShortcutsByCategory(c.id).length > 0)
        .map((c) => {
          const count = DataStore.getShortcutsByCategory(c.id).length;
          return `<div class="cat-tile" data-drill="cat:${c.id}"><span class="cat-emoji">${c.icon || "📁"}</span><div class="cat-info"><span class="cat-name">${escapeHTML(i18n.pick(c.name))}</span><span class="cat-count">${i18n.format(t.resultsCount, { n: count })}</span></div></div>`;
        })
        .join("");
      el.content.innerHTML = subheadHTML(t.grpScenes) + `<div class="cat-grid">${tiles}</div>`;
      return;
    }

    // Categories home: three entry groups
    const groups = [
      { icon: "🖥️", label: t.grpSystem, view: "system" },
      { icon: "🧩", label: t.grpSoftware, view: "software" },
      { icon: "🗂️", label: t.grpScenes, view: "scenes" }
    ];
    const tiles = groups
      .map(
        (g) =>
          `<div class="cat-tile" data-catview="${g.view}"><span class="cat-emoji">${g.icon}</span><div class="cat-info"><span class="cat-name">${g.label}</span></div></div>`
      )
      .join("");
    el.content.innerHTML = `<div class="cat-grid">${tiles}</div>`;
  }

  function subheadHTML(title) {
    return `<div class="subhead">
      <button class="back-btn" data-back="1" aria-label="${i18n.t.back}">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
      </button>
      <span class="subhead-title">${title}</span>
    </div>`;
  }

  async function renderFavorites() {
    const t = i18n.t;
    const ids = await store.getFavorites();
    const items = DataStore.getShortcutsByIds(ids);
    if (!items.length) {
      el.content.innerHTML = `
        <div class="empty">
          <span class="empty-emoji">⭐</span>
          <div class="empty-title">${t.emptyFavorites}</div>
          <div class="empty-hint">${t.emptyFavoritesHint}</div>
          <button class="empty-action" data-browse="categories">${t.emptyFavoritesAction}</button>
        </div>`;
      return;
    }
    // Group by app for easier scanning
    const groups = new Map();
    for (const s of items) {
      if (!groups.has(s.appId)) groups.set(s.appId, []);
      groups.get(s.appId).push(s);
    }
    let html =
      `<div class="section-title">${i18n.format(t.resultsCount, { n: items.length })}
        <button class="link-btn" data-export="favorites" title="${t.export}" aria-label="${t.export}">${t.export}</button></div>`;
    for (const [appId, list] of groups) {
      const app = DataStore.getApp(appId);
      const appName = app ? escapeHTML(i18n.pick(app.name)) : "";
      const icon = app && app.icon ? app.icon + " " : "";
      html += `<div class="fav-group">
        <div class="fav-group-title">${icon}${appName}<span class="fav-group-count">${list.length}</span></div>
        ${list.map((s) => cardHTML(s, "")).join("")}
      </div>`;
    }
    el.content.innerHTML = html;
  }

  async function renderRecent() {
    const t = i18n.t;
    const ids = await store.getRecent();
    const items = DataStore.getShortcutsByIds(ids);
    if (!items.length) {
      el.content.innerHTML = `
        <div class="empty">
          <span class="empty-emoji">🕘</span>
          <div class="empty-title">${t.emptyRecent}</div>
          <div class="empty-hint">${t.emptyRecentHint}</div>
          <button class="empty-action" data-browse="categories">${t.emptyRecentAction}</button>
        </div>`;
      return;
    }
    el.content.innerHTML =
      `<div class="section-title">${i18n.format(t.resultsCount, { n: items.length })}
        <button class="link-btn" id="clearRecent">${t.clear}</button></div>` +
      items.map((s) => cardHTML(s, "", { del: true })).join("");
  }

  /* ---------- Detail view (click / Enter on a card) ---------- */
  function renderDetail(id) {
    const t = i18n.t;
    const s = DataStore.getShortcut(id);
    if (!s) { state.detail = null; return render(); }
    const app = DataStore.getApp(s.appId);
    const appName = app ? escapeHTML(i18n.pick(app.name)) : "";
    const fav = state.favSet.has(s.id);
    const platforms = ["windows", "mac", "linux"];
    const rows = platforms.map((p) => {
      const raw = s[p] || "—";
      const isCurrent = p === state.os;
      const disabled = raw === "—";
      return `
        <div class="detail-row ${isCurrent ? "current" : ""}">
          <span class="detail-os">${OS_META[p].icon} ${t[OS_META[p].key]}${isCurrent ? " ·" : ""}</span>
          <span class="detail-keys">${disabled ? "—" : renderKeys(raw)}</span>
          <button class="detail-copy ${disabled ? "disabled" : ""}" data-copy="${p}" ${disabled ? "disabled" : ""}>
            ${t.copyKey}
          </button>
        </div>`;
    }).join("");
    el.detailPanel.innerHTML = `
      ${subheadHTML(i18n.pick(s.name))}
      <div class="detail-body">
        <div class="detail-head">
          <span class="detail-app">${appName}</span>
          <button class="star-btn ${fav ? "active" : ""}" data-star="${s.id}"
            title="${fav ? t.removeFav : t.addFav}" aria-label="${fav ? t.removeFav : t.addFav}">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="${fav ? "currentColor" : "none"}"
              stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
            </svg>
          </button>
        </div>
        <p class="detail-desc">${escapeHTML(i18n.pick(s.description))}</p>
        <div class="detail-keys-wrap">
          <div class="detail-section-label">${t.shortcutLabel}</div>
          ${rows}
        </div>
      </div>`;
  }

  /* ---------- Events ---------- */
  function getCards() {
    return Array.from(el.content.querySelectorAll(".card"));
  }
  function setActiveCard(idx) {
    const cards = getCards();
    if (!cards.length) return;
    if (idx < 0) idx = 0;
    if (idx >= cards.length) idx = cards.length - 1;
    state.activeIdx = idx;
    cards.forEach((c, i) => c.classList.toggle("card-active", i === idx));
    cards[idx].focus({ preventScroll: true });
    cards[idx].scrollIntoView({ block: "nearest", behavior: "smooth" });
  }
  function clearActiveCard() {
    state.activeIdx = -1;
    el.content.querySelectorAll(".card-active").forEach((c) => c.classList.remove("card-active"));
  }

  function syncTabs() {
    document.querySelectorAll(".tab").forEach((b) =>
      b.classList.toggle("active", b.dataset.tab === state.tab)
    );
  }

  function setTab(tab) {
    state.tab = tab;
    state.detail = null;
    state.catView = null;
    state.catDrill = null;
    el.searchInput.value = state.query;
    el.clearSearch.hidden = !state.query;
    syncTabs();
    render();
  }

  async function gotoApp(id) {
    state.tab = "categories";
    state.catView = null;
    state.catDrill = "app:" + id;
    syncTabs();
    await DataStore.loadAppShortcuts(id);
    render();
  }

  async function onContentClick(e) {
    const osFilter = e.target.closest("[data-osfilter]");
    if (osFilter) {
      e.stopPropagation();
      state.filterOS = osFilter.dataset.osfilter;
      renderSearch();
      return;
    }

    const exportBtn = e.target.closest("[data-export]");
    if (exportBtn) {
      e.stopPropagation();
      exportScope(exportBtn.dataset.export);
      return;
    }

    const star = e.target.closest("[data-star]");
    if (star) {
      e.stopPropagation();
      await toggleFav(star);
      // Only re-render when not in the detail drawer and favorites needs to
      // add/remove the card; otherwise the in-place update keeps list context.
      if (!state.detail && state.tab === "favorites") renderFavorites();
      return;
    }

    // Card copy button: copy the key for the current display OS directly.
    const copyCard = e.target.closest("[data-copycard]");
    if (copyCard) {
      e.stopPropagation();
      const s = DataStore.getShortcut(copyCard.dataset.copycard);
      if (s) {
        const raw = keyForOS(s);
        if (!raw || raw === "—") toast(i18n.t.noKey);
        else {
          copyToClipboard(raw);
          toast(i18n.format(i18n.t.copiedOS, { os: i18n.t[OS_META[effectiveOS()].key] }));
        }
      }
      return;
    }

    // OS filter removed every result: let the user jump back to all platforms.
    const resetFilter = e.target.closest("[data-resetfilter]");
    if (resetFilter) {
      state.filterOS = "all";
      renderSearch();
      return;
    }

    if (e.target.closest("#clearRecent")) {
      await store.clearRecent();
      renderRecent();
      return;
    }

    const del = e.target.closest("[data-del]");
    if (del) {
      e.stopPropagation();
      await store.removeRecent(del.dataset.del);
      renderRecent();
      return;
    }


    const browse = e.target.closest("[data-browse]");
    if (browse) {
      setTab(browse.dataset.browse);
      return;
    }

    const back = e.target.closest("[data-back]");
    if (back) {
      if (state.detail) { closeDetail(); return; }
      if (state.catDrill) state.catDrill = null;
      else       if (state.catView) state.catView = null;
      render();
      return;
    }

    // Detail view: copy a specific platform's key
    const copyBtn = e.target.closest("[data-copy]");
    if (copyBtn && state.detail) {
      const s = DataStore.getShortcut(state.detail);
      if (s) copyOS(s, copyBtn.dataset.copy);
      return;
    }

    // Homepage: popular app -> open its shortcuts under Categories
    const appPill = e.target.closest("[data-app]");
    if (appPill) {
      await gotoApp(appPill.dataset.app);
      return;
    }

    // Homepage: example chip -> fill search and run
    const example = e.target.closest("[data-example]");
    if (example) {
      const term = example.dataset.example;
      el.searchInput.value = term;
      state.query = term;
      el.clearSearch.hidden = false;
      setTab("search");
      el.searchInput.focus();
      return;
    }

    // Categories: open a group
    const catView = e.target.closest("[data-catview]");
    if (catView) {
      state.catView = catView.dataset.catview;
      render();
      return;
    }

    // Categories: drill into os / app / category
    const drill = e.target.closest("[data-drill]");
    if (drill) {
      state.catDrill = drill.dataset.drill;
      if (state.catDrill.startsWith("app:")) {
        await DataStore.loadAppShortcuts(state.catDrill.split(":")[1]);
      }
      render();
      return;
    }

    // Categories (software): jump to a letter group via the index bar
    const alpha = e.target.closest("[data-alpha]");
    if (alpha) {
      const target = el.content.querySelector(`[data-alpha-group="${alpha.dataset.alpha}"]`);
      if (target) {
        // 计算偏移，避开粘性字母导航栏（.alpha-index）的遮挡
        const bar = el.content.querySelector(".alpha-index");
        const offset = (bar ? bar.offsetHeight : 0) + 8;
        const cRect = el.content.getBoundingClientRect();
        const tRect = target.getBoundingClientRect();
        el.content.scrollTo({
          top: el.content.scrollTop + (tRect.top - cRect.top) - offset,
          behavior: "smooth",
        });
      }
      return;
    }

    const card = e.target.closest(".card");
    if (card) {
      showDetail(card.dataset.id);
    }
  }

  async function onDrawerClick(e) {
    if (e.target.closest("[data-backdrop]") || e.target.closest("[data-back]")) {
      closeDetail();
      return;
    }
    const copyBtn = e.target.closest("[data-copy]");
    if (copyBtn && state.detail) {
      const s = DataStore.getShortcut(state.detail);
      if (s) copyOS(s, copyBtn.dataset.copy);
      return;
    }
    const star = e.target.closest("[data-star]");
    if (star) {
      e.stopPropagation();
      await toggleFav(star);
      return;
    }
  }

  function copyToClipboard(text) {
    try {
      navigator.clipboard.writeText(text);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand("copy"); } catch {}
      document.body.removeChild(ta);
    }
  }

  function copyOS(s, platform) {
    const raw = s[platform] || "—";
    if (raw === "—") { toast(i18n.t.noKey); return; }
    copyToClipboard(raw);
    toast(i18n.format(i18n.t.copiedOS, { os: i18n.t[OS_META[platform].key] }));
  }

  /* ---------- Export (Markdown) ---------- */
  function buildMarkdown(items, title) {
    const head = `## ${title}\n\n`;
    const thead = "| 操作 | Windows | macOS | Linux |\n|------|---------|-------|-------|\n";
    const rows = items
      .map((s) => {
        const name = i18n.pick(s.name);
        const w = s.windows || "—";
        const m = s.mac || "—";
        const l = s.linux || "—";
        return `| ${name} | ${w} | ${m} | ${l} |`;
      })
      .join("\n");
    return head + thead + rows + "\n";
  }

  async function exportScope(attr) {
    const t = i18n.t;
    const [kind, id] = (attr || "").split(":");
    let items = [];
    let title = "";
    if (kind === "detail") {
      const s = DataStore.getShortcut(state.detail);
      if (!s) return;
      items = [s];
      const app = DataStore.getApp(s.appId);
      title = i18n.pick(s.name) + (app ? ` (${i18n.pick(app.name)})` : "");
    } else if (kind === "favorites") {
      const favIds = await store.getFavorites();
      items = DataStore.getShortcutsByIds(favIds);
      title = t.favExportTitle;
    } else if (kind === "app") {
      const app = DataStore.getApp(id);
      items = DataStore.getShortcutsByApp(id);
      title = app ? i18n.pick(app.name) : id;
    } else if (kind === "cat") {
      const cat = DataStore.getCategory(id);
      items = DataStore.getShortcutsByCategory(id);
      title = cat ? i18n.pick(cat.name) : id;
    } else if (kind === "os") {
      items = DataStore.shortcuts.filter((s) => {
        const a = DataStore.getApp(s.appId);
        return a && a.type === "system" && s[id];
      });
      title = t[OS_META[id].key];
    }
    if (!items.length) return;
    copyToClipboard(buildMarkdown(items, title));
    toast(t.exportCopied);
  }

  function showDetail(id) {
    state.detail = id;
    if (!state.incognito) store.pushRecent(id);
    renderDetail(id);
    openDetailDrawer();
  }

  function openDetailDrawer() {
    el.detailDrawer.hidden = false;
    el.detailDrawer.setAttribute("aria-hidden", "false");
    requestAnimationFrame(() => {
      el.detailDrawer.classList.add("open");
      const focusTarget = el.detailPanel.querySelector("button");
      if (focusTarget) focusTarget.focus();
    });
  }

  function closeDetail() {
    if (!state.detail && el.detailDrawer.hidden) return;
    state.detail = null;
    el.detailDrawer.classList.remove("open");
    el.detailDrawer.setAttribute("aria-hidden", "true");
    setTimeout(() => { el.detailDrawer.hidden = true; }, 220);
    // Return focus to the search box so the user can keep querying (Item 3).
    if (state.tab === "search") {
      el.searchInput.focus();
      if (state.activeIdx >= 0) setActiveCard(state.activeIdx);
    }
  }

  // Toggle favorite for a star button; update every matching star in place
  // (drawer + list) without a full re-render so list scroll/context is kept.
  async function toggleFav(btn) {
    const id = btn.dataset.star;
    const nowFav = await store.toggleFavorite(id);
    if (nowFav) state.favSet.add(id);
    else state.favSet.delete(id);
    toast(nowFav ? i18n.t.addFav : i18n.t.removeFav);
    updateStarButtons(id, nowFav);
    return nowFav;
  }

  function updateStarButtons(id, nowFav) {
    document.querySelectorAll(`[data-star="${id}"]`).forEach((b) => {
      b.classList.toggle("active", nowFav);
      const svg = b.querySelector("svg");
      if (svg) svg.setAttribute("fill", nowFav ? "currentColor" : "none");
      const label = nowFav ? i18n.t.removeFav : i18n.t.addFav;
      b.title = label;
      b.setAttribute("aria-label", label);
    });
  }

  function onKeydown(e) {
    // Settings overlay open: only Esc closes it
    if (!el.settingsPanel.hidden) {
      if (e.key === "Escape") closeSettings();
      if (e.key === "Tab") {
        const focusables = Array.from(el.settingsPanel.querySelectorAll("button, [href], input, select, textarea, [tabindex]:not([tabindex='-1'])"))
          .filter((node) => !node.disabled && node.offsetParent !== null);
        if (focusables.length) {
          const first = focusables[0];
          const last = focusables[focusables.length - 1];
          if (e.shiftKey && document.activeElement === first) {
            e.preventDefault();
            last.focus();
          } else if (!e.shiftKey && document.activeElement === last) {
            e.preventDefault();
            first.focus();
          }
        }
      }
      return;
    }
    // Detail view: Enter copies current-OS key, Esc returns to list
    if (state.detail) {
      if (e.key === "Enter") {
        e.preventDefault();
        const s = DataStore.getShortcut(state.detail);
        if (s) copyOS(s, state.os);
      } else if (e.key === "Escape") {
        e.preventDefault();
        closeDetail();
      } else if (e.key === "Tab") {
        const focusables = Array.from(el.detailPanel.querySelectorAll("button, [href], input, select, textarea, [tabindex]:not([tabindex='-1'])"))
          .filter((node) => !node.disabled && node.offsetParent !== null);
        if (focusables.length) {
          const first = focusables[0];
          const last = focusables[focusables.length - 1];
          if (e.shiftKey && document.activeElement === first) {
            e.preventDefault();
            last.focus();
          } else if (!e.shiftKey && document.activeElement === last) {
            e.preventDefault();
            first.focus();
          }
        }
      }
      return;
    }
    const cards = getCards();
    if (!cards.length) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveCard(state.activeIdx < 0 ? 0 : state.activeIdx + 1);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveCard(state.activeIdx < 0 ? 0 : state.activeIdx - 1);
    } else if (e.key === "Enter") {
      if (state.activeIdx >= 0 && cards[state.activeIdx]) {
        e.preventDefault();
        showDetail(cards[state.activeIdx].dataset.id);
      }
    } else if (e.key === "Escape") {
      if (state.query) {
        el.searchInput.value = "";
        state.query = "";
        el.clearSearch.hidden = true;
        renderSearch();
      }
    }
  }

  function debounce(fn, ms) {
    let tmr;
    return (...args) => {
      clearTimeout(tmr);
      tmr = setTimeout(() => fn(...args), ms);
    };
  }

  function setActiveSegment(container, attr, value) {
    if (!container) return;
    container.querySelectorAll("button").forEach((b) =>
      b.classList.toggle("active", b.dataset[attr] === value)
    );
  }

  function resolveTheme(theme) {
    if (theme === "system") {
      return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    }
    return theme;
  }

  function applyTheme(theme) {
    currentTheme = theme;
    document.documentElement.setAttribute("data-theme", resolveTheme(theme));
    setActiveSegment(el.setTheme, "theme", theme);
  }

  function bindSegment(container, attr, onPick) {
    if (!container) return;
    container.addEventListener("click", (e) => {
      const btn = e.target.closest(`[data-${attr}]`);
      if (!btn) return;
      onPick(btn.dataset[attr]);
    });
  }

  function pickTheme(theme) {
    applyTheme(theme);
    store.setTheme(theme);
  }

  function pickLang(lang) {
    i18n.setLang(lang);
    setActiveSegment(el.setLang, "lang", lang);
    applyStaticI18n();
    render();
  }

  /* ---------- Settings overlay ---------- */
  function openSettings() {
    el.settingsBackdrop.hidden = false;
    el.settingsPanel.hidden = false;
    el.settingsPanel.setAttribute("aria-hidden", "false");
    requestAnimationFrame(() => {
      el.settingsBackdrop.classList.add("show");
      el.settingsPanel.classList.add("open");
      el.closeSettings.focus();
    });
  }
  function closeSettings() {
    el.settingsBackdrop.classList.remove("show");
    el.settingsPanel.classList.remove("open");
    el.settingsPanel.setAttribute("aria-hidden", "true");
    setTimeout(() => {
      el.settingsBackdrop.hidden = true;
      el.settingsPanel.hidden = true;
      el.settingsBtn.focus();
    }, 220);
  }

  /* ---------- Init ---------- */
  async function init() {
    // language
    setActiveSegment(el.setLang, "lang", i18n.lang);
    applyStaticI18n();

    // theme
    const theme = await store.getTheme();
    applyTheme(theme);
    // Live-follow the OS color scheme while "System" is selected.
    if (window.matchMedia) {
      const mq = window.matchMedia("(prefers-color-scheme: dark)");
      const onScheme = () => { if (currentTheme === "system") applyTheme("system"); };
      if (mq.addEventListener) mq.addEventListener("change", onScheme);
      else if (mq.addListener) mq.addListener(onScheme);
    }

    // incognito mode
    state.incognito = await store.getIncognito();
    if (el.incognitoToggle) {
      el.incognitoToggle.setAttribute("aria-checked", String(!!state.incognito));
    }

    // segmented bindings (settings panel)
    bindSegment(el.setTheme, "theme", pickTheme);
    bindSegment(el.setLang, "lang", pickLang);

    // Default display OS: auto-detect (mac shows mac keys, others show Windows
    // keys; Linux shares the same Ctrl-based keys as Windows).
    state.os = detectOS() === "mac" ? "mac" : "windows";

    // Load data
    try {
      await DataStore.load();
    } catch (err) {
      el.content.innerHTML = emptyHTML("⚠️", "Failed to load data", String(err.message || err));
      return;
    }

    // favorites set for quick lookup
    state.favSet = new Set(await store.getFavorites());

    // events
    el.tabs.addEventListener("click", (e) => {
      const btn = e.target.closest(".tab");
      if (btn) setTab(btn.dataset.tab);
    });

    el.searchInput.addEventListener(
      "input",
      debounce((e) => {
        state.query = e.target.value;
        el.clearSearch.hidden = !state.query;
        if (state.tab !== "search") setTab("search");
        else renderSearch();
      }, 120)
    );

    el.clearSearch.addEventListener("click", () => {
      el.searchInput.value = "";
      state.query = "";
      el.clearSearch.hidden = true;
      el.searchInput.focus();
      renderSearch();
    });

    // settings overlay
    el.webBtn.addEventListener("click", () => {
      chrome.tabs.create({ url: "https://keyatlas.pages.dev" });
    });
    el.settingsBtn.addEventListener("click", openSettings);
    el.closeSettings.addEventListener("click", closeSettings);
    el.settingsBackdrop.addEventListener("click", closeSettings);
    if (el.incognitoToggle) {
      el.incognitoToggle.addEventListener("click", async () => {
        state.incognito = !state.incognito;
        el.incognitoToggle.setAttribute("aria-checked", String(state.incognito));
        await store.setIncognito(state.incognito);
        if (state.incognito) {
          await store.clearRecent();
          if (state.tab === "recent") renderRecent();
        }
      });
    }
    if (el.paypalBtn) {
      el.paypalBtn.addEventListener("click", () => window.open(PAYPAL_URL, "_blank", "noopener"));
    }
    if (el.wechatBtn && el.wechatLightbox) {
      const openWechat = () => {
        el.wechatLightbox.style.display = "flex";
        el.wechatLightbox.hidden = false;
        el.wechatLightbox.setAttribute("aria-hidden", "false");
      };
      const closeWechat = () => {
        el.wechatLightbox.style.display = "none";
        el.wechatLightbox.hidden = true;
        el.wechatLightbox.setAttribute("aria-hidden", "true");
      };
      el.wechatBtn.addEventListener("click", openWechat);
      // 点击卡片内部不关闭（阻止冒泡到遮罩）
      el.wechatLightbox.querySelector(".wechat-lightbox-inner").addEventListener("click", (e) => {
        e.stopPropagation();
      });
      // 点遮罩背景 = 关闭
      el.wechatLightbox.addEventListener("click", () => closeWechat());
      document.addEventListener("keydown", (e) => {
        if (e.key === "Escape" && !el.wechatLightbox.hidden) closeWechat();
      });
    }


    el.content.addEventListener("click", onContentClick);
    el.detailDrawer.addEventListener("click", onDrawerClick);
    document.addEventListener("keydown", onKeydown);

    // Omnibox / deep-link: ?q= pre-fills the search.
    const urlQ = new URLSearchParams(location.search).get("q");
    if (urlQ) {
      el.searchInput.value = urlQ;
      state.query = urlQ;
      el.clearSearch.hidden = false;
      state.tab = "search";
      syncTabs();
    }

    el.searchInput.focus();
    render();
  }

  document.addEventListener("DOMContentLoaded", init);
})();
