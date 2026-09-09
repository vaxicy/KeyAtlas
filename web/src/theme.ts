import { useEffect, useState } from 'react';

export type ThemeMode = 'light' | 'dark';

const STORAGE_KEY = 'keyatlas-theme';

function readUrlTheme(): ThemeMode | null {
  if (typeof window === 'undefined') return null;
  const v = new URLSearchParams(window.location.search).get('theme');
  return v === 'dark' || v === 'light' ? v : null;
}

/** 把模式应用到 <html data-theme>，颜色全部由 CSS 变量接管 */
export function applyThemeMode(mode: ThemeMode): void {
  if (typeof document === 'undefined') return;
  document.documentElement.setAttribute('data-theme', mode);
}

export function getStoredTheme(): ThemeMode {
  try {
    const raw = localStorage.getItem(STORAGE_KEY) as ThemeMode | null;
    if (raw === 'light' || raw === 'dark') return raw;
  } catch {
    // localStorage 不可用（隐私模式 / 禁用 Cookie）时静默降级
  }
  return 'light';
}

export function setStoredTheme(mode: ThemeMode): void {
  try {
    localStorage.setItem(STORAGE_KEY, mode);
  } catch {
    // ignore
  }
  applyThemeMode(mode);
}

/** 主题状态：持久化到 localStorage，并支持从 URL ?theme= 初始化 */
export function useThemeState(): [ThemeMode, (mode: ThemeMode) => void] {
  const [mode, setMode] = useState<ThemeMode>(() => readUrlTheme() ?? getStoredTheme());

  useEffect(() => {
    applyThemeMode(mode);
  }, [mode]);

  const update = (next: ThemeMode) => {
    setStoredTheme(next);
    setMode(next);
  };

  return [mode, update];
}
