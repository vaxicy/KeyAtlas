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
    linux: { icon: "🐧", key: "os_linux" }
  };

  const VERSION = "1.0.0";

  // Cached DOM
  const el = {
    content: document.getElementById("content"),
    searchInput: document.getElementById("searchInput"),
    clearSearch: document.getElementById("clearSearch"),
    tabs: document.getElementById("tabs"),
    // settings overlay
    settingsBtn: document.getElementById("settingsBtn"),
    settingsPanel: document.getElementById("settingsPanel"),
    settingsBackdrop: document.getElementById("settingsBackdrop"),
    closeSettings: document.getElementById("closeSettings"),
    setLang: document.getElementById("setLang"),
    setTheme: document.getElementById("setTheme"),
    incognitoToggle: document.getElementById("incognitoToggle"),
    aboutVersion: document.getElementById("aboutVersion"),
    toast: document.getElementById("toast")
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
    el.settingsBtn.title = t.settings;
    el.settingsBtn.setAttribute("aria-label", t.settings);
    document.documentElement.lang = i18n.lang;
    if (el.aboutVersion) el.aboutVersion.textContent = i18n.format(t.aboutVersion, { n: VERSION });
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
  function keyForOS(s) {
    const p = state.filterOS && state.filterOS !== "all" ? state.filterOS : state.os;
    return s[p] || s.windows || s.mac || s.linux || "—";
  }
  function renderKeys(combo) {
    return combo
      .split(/\s*\+\s*/)
      .map((k) => k.trim())
      .filter(Boolean)
      .map((k) => `<span class="kbd">${escapeHTML(k)}</span>`)
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
  function platformTagsHTML(s) {
    const t = i18n.t;
    const present = ["windows", "mac", "linux"].filter((p) => {
      const v = s[p];
      return v && v !== "—";
    });
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
    const osTag = isSystem ? "" : platformTagsHTML(s);
    const delBtn = opts.del
      ? `<button class="del-btn" data-del="${s.id}" title="${t.removeRecentOne}" aria-label="${t.removeRecentOne}">🗑️</button>`
      : "";
    return `
      <div class="card" data-id="${s.id}">
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
    if (state.detail) return renderDetail(state.detail);
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
    let results = SearchEngine.search(q);
    if (state.filterOS && state.filterOS !== "all") {
      results = results.filter((s) => {
        const v = s[state.filterOS];
        return v && v !== "—";
      });
    }
    if (!results.length) {
      const chips = exampleChips()
        .map((e) => `<button class="pill pill-ghost" data-example="${escapeHTML(e.term)}">${escapeHTML(e.label)}</button>`)
        .join("");
      el.content.innerHTML =
        osFilterBarHTML() +
        emptyHTML("🤔", i18n.format(t.noResultsQuery, { q }), t.noResultsHint) +
        `<div class="suggest"><div class="suggest-title">${t.suggestTitle}</div><div class="pills">${chips}</div></div>`;
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
        // Prefer the OS-level shortcut so Quick Start shows the native key
        // (e.g. Ctrl+C on Windows, ⌘+C on macOS) as in the product spec.
        const sys =
          list.find((s) => {
            const a = DataStore.getApp(s.appId);
            return a && a.type === "system";
          }) || list[0];
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
      </div>`;
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
          return a && a.type === "system" && s[id];
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
      const tiles = ["windows", "mac", "linux"]
        .map((id) => {
          const m = OS_META[id];
          return `<div class="cat-tile" data-drill="os:${id}"><span class="cat-emoji">${m.icon}</span><div class="cat-info"><span class="cat-name">${t[m.key]}</span></div></div>`;
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
        const sortKey = a.sortKey || name;
        const letter = (sortKey[0] || "#").toUpperCase();
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
    el.content.innerHTML = `
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

  function gotoApp(id) {
    state.tab = "categories";
    state.catView = null;
    state.catDrill = "app:" + id;
    syncTabs();
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
      const id = star.dataset.star;
      const nowFav = await store.toggleFavorite(id);
      if (nowFav) state.favSet.add(id);
      else state.favSet.delete(id);
      toast(nowFav ? i18n.t.addFav : i18n.t.removeFav);
      if (state.tab === "favorites") renderFavorites();
      else render();
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
      gotoApp(appPill.dataset.app);
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
      render();
      return;
    }

    // Categories (software): jump to a letter group via the index bar
    const alpha = e.target.closest("[data-alpha]");
    if (alpha) {
      const target = el.content.querySelector(`[data-alpha-group="${alpha.dataset.alpha}"]`);
      if (target) target.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }

    const card = e.target.closest(".card");
    if (card) {
      showDetail(card.dataset.id);
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
    if (raw === "—") return;
    copyToClipboard(raw);
    toast(i18n.t.copied);
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
    render();
  }

  function closeDetail() {
    state.detail = null;
    render();
  }

  function onKeydown(e) {
    // Settings overlay open: only Esc closes it
    if (!el.settingsPanel.hidden) {
      if (e.key === "Escape") closeSettings();
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

  function applyTheme(theme) {
    document.documentElement.setAttribute("data-theme", theme);
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
    });
  }
  function closeSettings() {
    el.settingsBackdrop.classList.remove("show");
    el.settingsPanel.classList.remove("open");
    el.settingsPanel.setAttribute("aria-hidden", "true");
    setTimeout(() => {
      el.settingsBackdrop.hidden = true;
      el.settingsPanel.hidden = true;
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

    // incognito mode
    state.incognito = await store.getIncognito();
    if (el.incognitoToggle) {
      el.incognitoToggle.setAttribute("aria-checked", String(!!state.incognito));
    }

    // segmented bindings (settings panel)
    bindSegment(el.setTheme, "theme", pickTheme);
    bindSegment(el.setLang, "lang", pickLang);

    // OS (auto-detect, no manual selector)
    state.os = detectOS();

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

    el.content.addEventListener("click", onContentClick);
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
