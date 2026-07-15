export interface Shortcut {
  id: string;
  appId: string;
  type: string;
  category: string;
  name: { zh: string; en: string };
  description: { zh: string; en: string };
  windows?: string | null;
  mac?: string | null;
  linux?: string | null;
  keywords?: string[];
  /** Pinyin index — data ships it as a single space-joined string, older data may use array. */
  pinyin?: string | string[];
}

export interface App {
  id: string;
  name: { zh: string; en: string };
  category: string;
  icon: string;
  type: string;
  popular?: boolean;
  file: string;
  source: string;
}

export interface AllData {
  apps: App[];
  shortcuts: Shortcut[];
}

export type Lang = 'en' | 'zh';

export type Platform = 'windows' | 'mac' | 'linux';
