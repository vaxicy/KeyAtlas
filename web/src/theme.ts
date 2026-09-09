import { useEffect, useState } from 'react';

export type ThemeMode = 'light' | 'dark' | 'system';

const STORAGE_KEY = 'keyatlas-theme';
const VALID_MODES: ThemeMode[] = ['light', 'dark', 'system'];

function prefersDark(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false;
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

/** 计算某个模式下是否应呈现深色 */
export function resolveDark(mode: ThemeMode): boolean {
  return mode === 'dark' || (mode === 'system' && prefersDark());
}

/** 把模式应用到 <html data-theme>，颜色全部由 CSS 变量接管 */
export function applyThemeMode(mode: ThemeMode): void {
  if (typeof document === 'undefined') return;
  document.documentElement.setAttribute('data-theme', resolveDark(mode) ? 'dark' : 'light');
}

export function getStoredTheme(): ThemeMode {
  try {
    const raw = localStorage.getItem(STORAGE_KEY) as ThemeMode | null;
    if (raw && VALID_MODES.includes(raw)) return raw;
  } catch {
    // localStorage 不可用（隐私模式 / 禁用 Cookie）时静默降级为跟随系统
  }
  return 'system';
}

export function setStoredTheme(mode: ThemeMode): void {
  try {
    localStorage.setItem(STORAGE_KEY, mode);
  } catch {
    // ignore
  }
  applyThemeMode(mode);
}

/** 主题状态：持久化到 localStorage，并在“跟随系统”下实时响应系统切换 */
export function useThemeState(): [ThemeMode, (mode: ThemeMode) => void] {
  const [mode, setMode] = useState<ThemeMode>(getStoredTheme);

  useEffect(() => {
    applyThemeMode(mode);
  }, [mode]);

  // 系统深/浅色变化时，若仍处于 system 模式则自动跟随
  useEffect(() => {
    if (typeof window.matchMedia !== 'function') return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => {
      setMode((prev) => {
        applyThemeMode(prev);
        return prev;
      });
    };
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  const update = (next: ThemeMode) => {
    setStoredTheme(next);
    setMode(next);
  };

  return [mode, update];
}
