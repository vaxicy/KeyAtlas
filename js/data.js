/**
 * KeyAtlas data layer.
 * Loads categories.json, apps.json and every referenced shortcut file,
 * then exposes a normalized in-memory index. JSON-driven so the same
 * data can later power the public website.
 */
const DataStore = {
  categories: [],
  apps: [],
  shortcuts: [],
  byId: new Map(),
  loaded: false,

  async load() {
    if (this.loaded) return;

    const [categories, apps] = await Promise.all([
      fetchJSON("data/categories.json"),
      fetchJSON("data/apps.json")
    ]);
    this.categories = categories || [];
    this.apps = apps || [];

    const files = this.apps.map((a) => `data/shortcuts/${a.file}`);
    const results = await Promise.all(
      files.map((f) => fetchJSON(f).catch(() => []))
    );

    this.shortcuts = results.flat().filter(Boolean);
    this.byId = new Map(this.shortcuts.map((s) => [s.id, s]));
    this.loaded = true;
  },

  getShortcut(id) {
    return this.byId.get(id);
  },
  getShortcutsByIds(ids) {
    return ids.map((id) => this.byId.get(id)).filter(Boolean);
  },
  getApp(id) {
    return this.apps.find((a) => a.id === id);
  },
  getCategory(id) {
    return this.categories.find((c) => c.id === id);
  },
  getShortcutsByApp(appId) {
    return this.shortcuts.filter((s) => s.appId === appId);
  },
  getShortcutsByCategory(catId) {
    return this.shortcuts.filter((s) => s.category === catId);
  }
};

async function fetchJSON(path) {
  const url =
    typeof chrome !== "undefined" && chrome.runtime && chrome.runtime.getURL
      ? chrome.runtime.getURL(path)
      : path;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to load ${path}`);
  return res.json();
}

window.DataStore = DataStore;
