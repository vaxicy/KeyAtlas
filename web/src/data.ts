import type { AllData, App, Shortcut } from './types';

const CACHE_KEY = 'keyatlas-data';

let cachedData: AllData | null = null;

export async function loadData(): Promise<AllData> {
  if (cachedData) return cachedData;

  // Try cache first
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      cachedData = JSON.parse(cached);
      return cachedData!;
    }
  } catch {}

  // Fetch from public/data/all.json
  const res = await fetch('/data/all.json');
  if (!res.ok) throw new Error(`Failed to load data: ${res.status}`);
  const data: AllData = await res.json();
  cachedData = data;

  // Cache to localStorage
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(data));
  } catch {}

  return data;
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
