/**
 * KeyAtlas search engine.
 * Lightweight fuzzy/weighted matching over name, description, keywords,
 * app name and key combos in both languages.
 */
const SearchEngine = {
  /**
   * @param {string} query
   * @param {object} opts { category, appId, limit }
   * @returns {Array} sorted shortcuts
   */
  search(query, opts = {}) {
    let pool = DataStore.shortcuts;
    if (opts.category && opts.category !== "all") {
      pool = pool.filter((s) => s.category === opts.category);
    }
    if (opts.appId) {
      pool = pool.filter((s) => s.appId === opts.appId);
    }

    const q = (query || "").trim().toLowerCase();
    if (!q) {
      return opts.limit ? pool.slice(0, opts.limit) : pool;
    }

    const terms = q.split(/\s+/).filter(Boolean);
    const scored = [];

    for (const s of pool) {
      const score = this._score(s, terms);
      if (score > 0) scored.push({ s, score });
    }

    scored.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      const ta = this._typeRank(a.s), tb = this._typeRank(b.s);
      if (ta !== tb) return ta - tb;
      return this._appName(a.s).localeCompare(this._appName(b.s));
    });
    const list = scored.map((x) => x.s);
    return opts.limit ? list.slice(0, opts.limit) : list;
  },

  _score(s, terms) {
    const app = DataStore.getApp(s.appId);
    const haystacks = {
      nameZh: (s.name?.zh || "").toLowerCase(),
      nameEn: (s.name?.en || "").toLowerCase(),
      descZh: (s.description?.zh || "").toLowerCase(),
      descEn: (s.description?.en || "").toLowerCase(),
      keywords: (s.keywords || []).join(" ").toLowerCase(),
      appName: app ? `${app.name?.zh || ""} ${app.name?.en || ""}`.toLowerCase() : "",
      keys: `${s.windows || ""} ${s.mac || ""} ${s.linux || ""}`.toLowerCase().replace(/\s*\+\s*/g, "+")
    };

    let total = 0;
    for (const term of terms) {
      let best = 0;
      if (haystacks.nameZh === term || haystacks.nameEn === term) best = Math.max(best, 100);
      if (haystacks.nameZh.startsWith(term) || haystacks.nameEn.startsWith(term)) best = Math.max(best, 60);
      if (haystacks.nameZh.includes(term) || haystacks.nameEn.includes(term)) best = Math.max(best, 40);
      if (haystacks.keywords.includes(term)) best = Math.max(best, 35);
      if (haystacks.appName.includes(term)) best = Math.max(best, 30);
      if (haystacks.descZh.includes(term) || haystacks.descEn.includes(term)) best = Math.max(best, 20);
      if (haystacks.keys.includes(term)) best = Math.max(best, 25);
      if (best === 0) return 0; // every term must match somewhere
      total += best;
    }
    return total;
  },

  /** Software shortcuts rank above system shortcuts (0 = software, 1 = system). */
  _typeRank(s) {
    const app = DataStore.getApp(s.appId);
    return app && app.type === "software" ? 0 : 1;
  },

  _appName(s) {
    const app = DataStore.getApp(s.appId);
    return app ? `${app.name?.zh || ""} ${app.name?.en || ""}`.toLowerCase() : "";
  }
};

window.SearchEngine = SearchEngine;
