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
    category: null, // when drilled into a category
    app: null, // when drilled into an app
    favSet: new Set()
  };

  // Cached DOM
  const el = {
    content: document.getElementById("content"),
    searchInput: document.getElementById("searchInput"),
    clearSearch: document.getElementById("clearSearch"),
    tabs: document.getElementById("tabs"),
    settingsBtn: document.getElementById("settingsBtn"),
    settingsPanel: document.getElementById("settingsPanel"),
    langToggle: document.getElementById("langToggle"),
    themeToggle: document.getElementById("themeToggle"),
    osToggle: document.getElementById("osToggle"),
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
    document.documentElement.lang = i18n.lang;
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
    return s[state.os] || s.windows || s.mac || s.linux || "—";
  }
  function renderKeys(combo) {
    // Split on + but keep multi-word tokens; also handle " / " alternatives.
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

  /* ---------- Shortcut card ---------- */
  function cardHTML(s) {
    const app = DataStore.getApp(s.appId);
    const appName = app ? escapeHTML(i18n.pick(app.name)) : "";
    const fav = state.favSet.has(s.id);
    const t = i18n.t;
    return `
      <div class="card" data-id="${s.id}">
        <div class="card-main">
          <div class="card-title-row">
            <span class="card-title">${escapeHTML(i18n.pick(s.name))}</span>
            ${appName ? `<span class="card-app">${appName}</span>` : ""}
          </div>
          <div class="card-desc">${escapeHTML(i18n.pick(s.description))}</div>
        </div>
        <div class="card-keys">${renderKeys(keyForOS(s))}</div>
        <button class="star-btn ${fav ? "active" : ""}" data-star="${s.id}"
          title="${fav ? t.removeFav : t.addFav}" aria-label="${fav ? t.removeFav : t.addFav}">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="${fav ? "currentColor" : "none"}"
            stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
          </svg>
        </button>
      </div>`;
  }

  function listHTML(items) {
    const t = i18n.t;
    return (
      `<div class="section-title">${i18n.format(t.resultsCount, { n: items.length })}</div>` +
      items.map(cardHTML).join("")
    );
  }

  function emptyHTML(emoji, title, hint) {
    return `<div class="empty"><span class="empty-emoji">${emoji}</span>
      <div class="empty-title">${title}</div>
      <div class="empty-hint">${hint}</div></div>`;
  }

  /* ---------- Renderers per tab ---------- */
  function render() {
    if (state.tab === "search") return renderSearch();
    if (state.tab === "categories") return renderCategories();
    if (state.tab === "favorites") return renderFavorites();
    if (state.tab === "recent") return renderRecent();
  }

  function renderSearch() {
    const t = i18n.t;
    const q = state.query.trim();
    if (!q) {
      el.content.innerHTML = emptyHTML("🔍", t.startTyping, t.startTypingHint);
      return;
    }
    const results = SearchEngine.search(q);
    if (!results.length) {
      el.content.innerHTML = emptyHTML("🤔", t.noResults, t.noResultsHint);
      return;
    }
    el.content.innerHTML = listHTML(results);
  }

  function renderCategories() {
    const t = i18n.t;
    // Drilled into an app
    if (state.app) {
      const app = DataStore.getApp(state.app);
      const items = DataStore.getShortcutsByApp(state.app);
      el.content.innerHTML =
        subheadHTML(`${app.icon || ""} ${escapeHTML(i18n.pick(app.name))}`) + listHTML(items);
      return;
    }
    // Drilled into a category -> show app chips + all shortcuts
    if (state.category) {
      const cat = DataStore.getCategory(state.category);
      const apps = DataStore.apps.filter((a) => a.category === state.category);
      const items = DataStore.getShortcutsByCategory(state.category);
      const chips = apps
        .map(
          (a) =>
            `<button class="chip" data-app="${a.id}">${a.icon || ""} ${escapeHTML(i18n.pick(a.name))}</button>`
        )
        .join("");
      el.content.innerHTML =
        subheadHTML(`${cat.icon || ""} ${escapeHTML(i18n.pick(cat.name))}`) +
        (chips ? `<div class="chips">${chips}</div>` : "") +
        listHTML(items);
      return;
    }
    // Category grid
    const grid = DataStore.categories
      .map((c) => {
        const count = DataStore.getShortcutsByCategory(c.id).length;
        return `
          <div class="cat-tile" data-cat="${c.id}">
            <span class="cat-emoji">${c.icon || "📁"}</span>
            <div class="cat-info">
              <span class="cat-name">${escapeHTML(i18n.pick(c.name))}</span>
              <span class="cat-count">${i18n.format(t.resultsCount, { n: count })}</span>
            </div>
          </div>`;
      })
      .join("");
    el.content.innerHTML = `<div class="cat-grid">${grid}</div>`;
  }

  function subheadHTML(title) {
    return `<div class="subhead">
      <button class="back-btn" data-back="1" aria-label="${i18n.t.back}">←</button>
      <span class="subhead-title">${title}</span>
    </div>`;
  }

  async function renderFavorites() {
    const t = i18n.t;
    const ids = await store.getFavorites();
    const items = DataStore.getShortcutsByIds(ids);
    if (!items.length) {
      el.content.innerHTML = emptyHTML("⭐", t.emptyFavorites, t.emptyFavoritesHint);
      return;
    }
    el.content.innerHTML = listHTML(items);
  }

  async function renderRecent() {
    const t = i18n.t;
    const ids = await store.getRecent();
    const items = DataStore.getShortcutsByIds(ids);
    if (!items.length) {
      el.content.innerHTML = emptyHTML("🕘", t.emptyRecent, t.emptyRecentHint);
      return;
    }
    el.content.innerHTML =
      `<div class="section-title">${i18n.format(t.resultsCount, { n: items.length })}
        <button class="link-btn" id="clearRecent">${t.clear}</button></div>` +
      items.map(cardHTML).join("");
  }

  /* ---------- Events ---------- */
  function setTab(tab) {
    state.tab = tab;
    state.category = null;
    state.app = null;
    document.querySelectorAll(".tab").forEach((b) =>
      b.classList.toggle("active", b.dataset.tab === tab)
    );
    render();
  }

  async function onContentClick(e) {
    const star = e.target.closest("[data-star]");
    if (star) {
      e.stopPropagation();
      const id = star.dataset.star;
      const nowFav = await store.toggleFavorite(id);
      if (nowFav) state.favSet.add(id);
      else state.favSet.delete(id);
      toast(nowFav ? i18n.t.addFav : i18n.t.removeFav);
      // Re-render current view to reflect state
      if (state.tab === "favorites") renderFavorites();
      else render();
      return;
    }

    if (e.target.closest("#clearRecent")) {
      await store.clearRecent();
      renderRecent();
      return;
    }

    const back = e.target.closest("[data-back]");
    if (back) {
      state.category = null;
      state.app = null;
      render();
      return;
    }

    const catTile = e.target.closest("[data-cat]");
    if (catTile) {
      state.category = catTile.dataset.cat;
      render();
      return;
    }

    const chip = e.target.closest("[data-app]");
    if (chip) {
      state.app = chip.dataset.app;
      render();
      return;
    }

    const card = e.target.closest(".card");
    if (card) {
      const id = card.dataset.id;
      await store.pushRecent(id);
      const s = DataStore.getShortcut(id);
      if (s) {
        copyToClipboard(keyForOS(s));
        toast(i18n.t.copied);
      }
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

  function debounce(fn, ms) {
    let tmr;
    return (...args) => {
      clearTimeout(tmr);
      tmr = setTimeout(() => fn(...args), ms);
    };
  }

  function setActiveSegment(container, attr, value) {
    container.querySelectorAll("button").forEach((b) =>
      b.classList.toggle("active", b.dataset[attr] === value)
    );
  }

  function applyTheme(theme) {
    document.documentElement.setAttribute("data-theme", theme);
    setActiveSegment(el.themeToggle, "theme", theme);
  }

  /* ---------- Init ---------- */
  async function init() {
    // language buttons
    setActiveSegment(el.langToggle, "lang", i18n.lang);
    applyStaticI18n();

    // theme
    const theme = await store.getTheme();
    applyTheme(theme);

    // OS
    state.os = detectOS();
    setActiveSegment(el.osToggle, "os", state.os);

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

    el.settingsBtn.addEventListener("click", () => {
      const willShow = el.settingsPanel.hidden;
      el.settingsPanel.hidden = !willShow;
      el.settingsBtn.classList.toggle("active", willShow);
    });

    el.langToggle.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-lang]");
      if (!btn) return;
      i18n.setLang(btn.dataset.lang);
      setActiveSegment(el.langToggle, "lang", i18n.lang);
      applyStaticI18n();
      render(); // refresh dynamic region
    });

    el.themeToggle.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-theme]");
      if (!btn) return;
      applyTheme(btn.dataset.theme);
      store.setTheme(btn.dataset.theme);
    });

    el.osToggle.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-os]");
      if (!btn) return;
      state.os = btn.dataset.os;
      setActiveSegment(el.osToggle, "os", state.os);
      render(); // key display depends on OS
    });

    el.content.addEventListener("click", onContentClick);

    el.searchInput.focus();
    render();
  }

  document.addEventListener("DOMContentLoaded", init);
})();
