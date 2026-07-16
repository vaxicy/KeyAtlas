import type { AllData, App, Shortcut } from './types';

let cachedApps: App[] | null = null;
let cachedSearchData: AllData | null = null;
let appsInflight: Promise<App[]> | null = null;
let searchInflight: Promise<AllData> | null = null;
const shortcutCache = new Map<string, Shortcut[]>();
const shortcutInflight = new Map<string, Promise<Shortcut[]>>();

function isValidApps(d: any): d is App[] {
  return Array.isArray(d) && d.length > 0;
}

function isValidShortcuts(d: any): d is Shortcut[] {
  return Array.isArray(d);
}

/** Fetch JSON with timeout + one retry. Browser/CDN cache handles persistence. */
async function fetchJson<T>(url: string, validate: (value: any) => value is T): Promise<T> {
  const attempt = async (): Promise<T> => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 15000);
    try {
      const res = await fetch(url, { signal: controller.signal });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (!validate(data)) throw new Error(`${url} is empty or malformed`);
      return data;
    } finally {
      clearTimeout(timer);
    }
  };

  try {
    return await attempt();
  } catch {
    return await attempt();
  }
}

export async function loadApps(): Promise<App[]> {
  if (cachedApps) return cachedApps;
  if (appsInflight) return appsInflight;

  appsInflight = fetchJson('/data/apps.json', isValidApps).then(apps => {
    cachedApps = apps;
    return apps;
  }).finally(() => {
    appsInflight = null;
  });

  return appsInflight;
}

export async function loadAppShortcuts(appId: string): Promise<Shortcut[]> {
  const cached = shortcutCache.get(appId);
  if (cached) return cached;

  const existing = shortcutInflight.get(appId);
  if (existing) return existing;

  const promise = fetchJson(`/data/shortcuts/${encodeURIComponent(appId)}.json`, isValidShortcuts)
    .then(shortcuts => {
      shortcutCache.set(appId, shortcuts);
      return shortcuts;
    })
    .finally(() => {
      shortcutInflight.delete(appId);
    });
  shortcutInflight.set(appId, promise);
  return promise;
}

export async function loadSearchData(): Promise<AllData> {
  if (cachedSearchData) return cachedSearchData;
  if (searchInflight) return searchInflight;

  searchInflight = (async () => {
    const [apps, searchData] = await Promise.all([
      loadApps(),
      fetchJson<{ shortcuts: Shortcut[] }>('/data/search.json', (d): d is { shortcuts: Shortcut[] } => (
        !!d && isValidShortcuts(d.shortcuts) && d.shortcuts.length > 0
      )),
    ]);
    cachedSearchData = { apps, shortcuts: searchData.shortcuts };
    return cachedSearchData;
  })().finally(() => {
    searchInflight = null;
  });

  return searchInflight;
}

export async function loadData(): Promise<AllData> {
  return loadSearchData();
}

export function getAppById(data: Pick<AllData, 'apps'>, id: string): App | undefined {
  return data.apps.find(a => a.id === id);
}

export function getShortcutsByAppId(data: AllData, appId: string): Shortcut[] {
  return data.shortcuts.filter(s => s.appId === appId);
}

export function getAppsByCategory(data: Pick<AllData, 'apps'>, category: string): App[] {
  return data.apps.filter(a => a.category === category);
}

export function getPopularApps(data: Pick<AllData, 'apps'>): App[] {
  return data.apps.filter(a => a.popular).slice(0, 8);
}

// Get unique categories sorted by count desc
export interface CategoryInfo {
  id: string;
  count: number;
}

export function getCategories(data: Pick<AllData, 'apps'>): CategoryInfo[] {
  const map = new Map<string, number>();
  for (const app of data.apps) {
    map.set(app.category, (map.get(app.category) || 0) + 1);
  }
  return Array.from(map.entries())
    .map(([id, count]) => ({ id, count }))
    .sort((a, b) => b.count - a.count);
}
