import type { App } from './types';

const FAVORITES_KEY = 'keyatlas-web-favorite-apps';
const RECENT_APPS_KEY = 'keyatlas-web-recent-apps';
const RECENT_LIMIT = 50;

function readArray(key: string): string[] {
  try {
    const value = localStorage.getItem(key);
    if (!value) return [];
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === 'string') : [];
  } catch {
    return [];
  }
}

function writeArray(key: string, value: string[]) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {}
}

export function getFavoriteAppIds(): string[] {
  return readArray(FAVORITES_KEY);
}

export function isFavoriteApp(appId: string): boolean {
  return getFavoriteAppIds().includes(appId);
}

export function toggleFavoriteApp(appId: string): boolean {
  const current = getFavoriteAppIds();
  const exists = current.includes(appId);
  writeArray(FAVORITES_KEY, exists ? current.filter(id => id !== appId) : [appId, ...current]);
  return !exists;
}

export function recordRecentApp(appId: string) {
  const next = [appId, ...readArray(RECENT_APPS_KEY).filter(id => id !== appId)].slice(0, RECENT_LIMIT);
  writeArray(RECENT_APPS_KEY, next);
}

export function getRecentApps(apps: App[], limit = 6): App[] {
  return readArray(RECENT_APPS_KEY)
    .map(id => apps.find(app => app.id === id))
    .filter(Boolean)
    .slice(0, limit) as App[];
}

export function clearRecentApps() {
  try {
    localStorage.removeItem(RECENT_APPS_KEY);
  } catch {}
}

export function removeRecentApp(appId: string) {
  writeArray(RECENT_APPS_KEY, readArray(RECENT_APPS_KEY).filter(id => id !== appId));
}

export function getFavoriteApps(apps: App[], limit = 6): App[] {
  return getFavoriteAppIds()
    .map(id => apps.find(app => app.id === id))
    .filter(Boolean)
    .slice(0, limit) as App[];
}
