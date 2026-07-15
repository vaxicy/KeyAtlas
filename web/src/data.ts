import type { AllData, App, Shortcut } from './types';

// Bump this whenever data schema/content changes to invalidate stale localStorage caches.
const DATA_VERSION = 'v2';
const CACHE_KEY = `keyatlas-data-${DATA_VERSION}`;

let cachedData: AllData | null = null;
let inflight: Promise<AllData> | null = null;

/** Validate that a parsed object is complete, non-empty data. */
function isValidData(d: any): d is AllData {
  return !!d
    && Array.isArray(d.apps) && d.apps.length > 0
    && Array.isArray(d.shortcuts) && d.shortcuts.length > 0;
}

/** Remove any old-version caches so they don't linger in localStorage. */
function clearStaleCaches() {
  try {
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const k = localStorage.key(i);
      if (k && k.startsWith('keyatlas-data') && k !== CACHE_KEY) {
        localStorage.removeItem(k);
      }
    }
  } catch {}
}

/** Fetch JSON with timeout + one retry. */
async function fetchData(): Promise<AllData> {
  const attempt = async (): Promise<AllData> => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 15000);
    try {
      const res = await fetch('/data/all.json', {
        signal: controller.signal,
        cache: 'no-cache',
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (!isValidData(data)) throw new Error('Data is empty or malformed');
      return data;
    } finally {
      clearTimeout(timer);
    }
  };

  try {
    return await attempt();
  } catch (e) {
    // Retry once on failure (network hiccup / truncated response)
    return await attempt();
  }
}

export async function loadData(): Promise<AllData> {
  if (cachedData) return cachedData;
  if (inflight) return inflight;

  inflight = (async () => {
    clearStaleCaches();

    // Try localStorage cache first — but validate it.
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (isValidData(parsed)) {
          cachedData = parsed;
          return cachedData!;
        }
        localStorage.removeItem(CACHE_KEY); // drop corrupted cache
      }
    } catch {
      try { localStorage.removeItem(CACHE_KEY); } catch {}
    }

    // Fetch fresh
    const data = await fetchData();
    cachedData = data;

    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify(data));
    } catch {}

    return data;
  })();

  try {
    return await inflight;
  } finally {
    inflight = null;
  }
}

export function getAppById(data: AllData, id: string): App | undefined {
  return data.apps.find(a => a.id === id);
}

export function getShortcutsByAppId(data: AllData, appId: string): Shortcut[] {
  return data.shortcuts.filter(s => s.appId === appId);
}

export function getAppsByCategory(data: AllData, category: string): App[] {
  return data.apps.filter(a => a.category === category);
}

export function getPopularApps(data: AllData): App[] {
  return data.apps.filter(a => a.popular).slice(0, 8);
}

// Get unique categories sorted by count desc
export interface CategoryInfo {
  id: string;
  count: number;
}

export function getCategories(data: AllData): CategoryInfo[] {
  const map = new Map<string, number>();
  for (const app of data.apps) {
    map.set(app.category, (map.get(app.category) || 0) + 1);
  }
  return Array.from(map.entries())
    .map(([id, count]) => ({ id, count }))
    .sort((a, b) => b.count - a.count);
}
