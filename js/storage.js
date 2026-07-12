/**
 * KeyAtlas storage module.
 * Wraps chrome.storage.local with a localStorage fallback (so it also
 * works when previewed outside the extension / on the future website).
 */
const KEYS = {
  favorites: "keyatlas_favorites",
  recent: "keyatlas_recent",
  theme: "keyatlas_theme",
  incognito: "keyatlas_incognito"
};

const RECENT_LIMIT = 50;

const hasChrome = typeof chrome !== "undefined" && chrome.storage && chrome.storage.local;

function get(key) {
  return new Promise((resolve) => {
    if (hasChrome) {
      chrome.storage.local.get([key], (res) => resolve(res[key]));
    } else {
      try {
        const raw = localStorage.getItem(key);
        resolve(raw ? JSON.parse(raw) : undefined);
      } catch {
        resolve(undefined);
      }
    }
  });
}

function set(key, value) {
  return new Promise((resolve) => {
    if (hasChrome) {
      chrome.storage.local.set({ [key]: value }, () => resolve());
    } else {
      try {
        localStorage.setItem(key, JSON.stringify(value));
      } catch {}
      resolve();
    }
  });
}

const store = {
  async getFavorites() {
    return (await get(KEYS.favorites)) || [];
  },
  async isFavorite(id) {
    const favs = await this.getFavorites();
    return favs.includes(id);
  },
  async toggleFavorite(id) {
    const favs = await this.getFavorites();
    const idx = favs.indexOf(id);
    if (idx >= 0) favs.splice(idx, 1);
    else favs.unshift(id);
    await set(KEYS.favorites, favs);
    return idx < 0; // true if now favorited
  },
  async getRecent() {
    return (await get(KEYS.recent)) || [];
  },
  async pushRecent(id) {
    let recent = await this.getRecent();
    recent = recent.filter((x) => x !== id);
    recent.unshift(id);
    if (recent.length > RECENT_LIMIT) recent = recent.slice(0, RECENT_LIMIT);
    await set(KEYS.recent, recent);
  },
  async clearRecent() {
    await set(KEYS.recent, []);
  },
  async removeRecent(id) {
    let recent = await this.getRecent();
    recent = recent.filter((x) => x !== id);
    await set(KEYS.recent, recent);
  },
  async getTheme() {
    return (await get(KEYS.theme)) || "light";
  },
  async setTheme(theme) {
    await set(KEYS.theme, theme);
  },
  async getIncognito() {
    return Boolean(await get(KEYS.incognito));
  },
  async setIncognito(val) {
    await set(KEYS.incognito, Boolean(val));
  }
};

window.store = store;
