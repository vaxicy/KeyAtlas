import type { Lang } from './types';

const translations = {
  en: {
    appName: 'KeyAtlas',
    tagline: 'Shortcut Search Engine',
    searchPlaceholder: 'Search actions, apps or shortcuts…',
    tabSearch: 'Search',
    tabCategories: 'Categories',
    tabFavorites: 'Favorites',
    tabRecent: 'Recent',
    settings: 'Settings',
    openWeb: 'Open Web Version',
    langLabel: 'Language',
    themeLabel: 'Theme',
    themeLight: 'Light',
    themeDark: 'Dark',
    themeSystem: 'System',
    loading: 'Loading…',
    popularApps: 'Popular Apps',
    popularCategories: 'Categories',
    quickStart: 'Quick Start',
    shortcutsCount: '{count} shortcuts',
    platformAll: 'All',
    platformWindows: 'Windows',
    platformMac: 'macOS',
    platformLinux: 'Linux',
    sourceOfficial: 'Official',
    sourceCommunity: 'Community',
    copy: 'Copy',
    copied: 'Copied!',
    toastCopied: 'Copied: {keys}',
    recentSearches: 'Recent searches',
    clearRecent: 'Clear',
    allPlatforms: 'All platforms',
    noResults: 'No results found',
    tryDifferent: 'Try different keywords or browse categories.',
    hotSearches: 'Popular searches',
    recommendedApps: 'Recommended apps',
    resultsFor: '{count} results for',
    resultForOne: '{count} result for',
    goBack: 'Go back',
    back: 'Back',
    notFoundTitle: 'Page not found',
    notFoundDesc: 'This page may have moved, or the shortcut collection does not exist yet.',
    notFoundSearch: 'Search shortcuts',
    notFoundHome: 'Back to home',
    notFoundBrowse: 'Browse categories',
    viewAllShortcuts: 'View all {name} shortcuts',
    searchInApp: 'Search in {name}…',
    categoryDesign: 'Design',
    categoryDevelopment: 'Development',
    categoryProductivity: 'Productivity',
    categoryVideo: 'Video',
    categoryAudio: 'Audio',
    categorySystem: 'System',
    categoryBrowser: 'Browser',
    categoryAI: 'AI',
    categoryAi: 'AI',
    categoryOther: 'Other',
    footerText: 'KeyAtlas — The shortcut search engine for your OS and favorite apps.',
    footerBuiltWith: 'Built with care for efficiency enthusiasts.',
    footerReport: 'Report missing shortcut / Suggest an app',
    addFavorite: 'Add favorite',
    removeFavorite: 'Remove favorite',
    viewCards: 'Cards',
    viewCompare: 'Compare',
    compareAction: 'Action',
    statApps: '{count} apps',
    statShortcuts: '{count} shortcuts',
    metaHomeTitle: 'KeyAtlas — Shortcut Search Engine for Every App & OS',
    metaHomeDesc: 'Search keyboard shortcuts for 150+ apps across Windows, macOS, Linux. Fast, free, open data.',
    metaAppTitle: '{app} Keyboard Shortcuts — KeyAtlas',
    metaAppDesc: 'Complete {app} keyboard shortcut list for Windows and Mac. {count} shortcuts verified from official docs.',
    metaCategoryTitle: '{category} Keyboard Shortcuts — KeyAtlas',
    metaCategoryDesc: 'Browse keyboard shortcuts for all {category} tools. Find shortcuts for every app in this category.',
    navHome: 'Home',
    navSearch: 'Search',
    navCategories: 'Categories',
  },
  zh: {
    appName: 'KeyAtlas',
    tagline: '快捷键搜索引擎',
    searchPlaceholder: '搜索操作、软件或快捷键…',
    tabSearch: '搜索',
    tabCategories: '分类',
    tabFavorites: '收藏',
    tabRecent: '最近',
    settings: '设置',
    openWeb: '打开网页版',
    langLabel: '语言',
    themeLabel: '主题',
    themeLight: '浅色',
    themeDark: '深色',
    themeSystem: '跟随系统',
    loading: '加载中…',
    popularApps: '热门软件',
    popularCategories: '分类浏览',
    quickStart: '快速开始',
    shortcutsCount: '{count} 条快捷键',
    platformAll: '全部',
    platformWindows: 'Windows',
    platformMac: 'macOS',
    platformLinux: 'Linux',
    sourceOfficial: '官方',
    sourceCommunity: '社区',
    copy: '复制',
    copied: '已复制！',
    toastCopied: '已复制：{keys}',
    recentSearches: '最近搜索',
    clearRecent: '清空',
    allPlatforms: '全平台对比',
    noResults: '未找到结果',
    tryDifferent: '试试其他关键词，或按分类浏览。',
    hotSearches: '热门搜索',
    recommendedApps: '推荐应用',
    resultsFor: '{count} 条结果，关键词',
    resultForOne: '{count} 条结果，关键词',
    goBack: '返回',
    back: '返回',
    notFoundTitle: '页面不存在',
    notFoundDesc: '这个页面可能已移动，或对应的快捷键集合还没有收录。',
    notFoundSearch: '搜索快捷键',
    notFoundHome: '返回首页',
    notFoundBrowse: '浏览分类',
    viewAllShortcuts: '查看 {name} 全部快捷键',
    searchInApp: '在 {name} 中搜索…',
    categoryDesign: '设计',
    categoryDevelopment: '开发',
    categoryProductivity: '效率',
    categoryVideo: '视频',
    categoryAudio: '音频',
    categorySystem: '系统',
    categoryBrowser: '浏览器',
    categoryAI: '人工智能',
    categoryAi: '人工智能',
    categoryOther: '其他',
    footerText: 'KeyAtlas — 为你的操作系统和常用软件服务的快捷键搜索引擎。',
    footerBuiltWith: '为效率爱好者精心打造。',
    footerReport: '报告缺失快捷键 / 推荐应用',
    addFavorite: '添加收藏',
    removeFavorite: '取消收藏',
    viewCards: '卡片视图',
    viewCompare: '对比视图',
    compareAction: '操作',
    statApps: '{count} 款应用',
    statShortcuts: '{count} 条快捷键',
    metaHomeTitle: 'KeyAtlas — 全平台快捷键搜索引擎',
    metaHomeDesc: '搜索 150+ 款软件在 Windows、macOS、Linux 上的快捷键。快速、免费、开放数据。',
    metaAppTitle: '{app} 快捷键大全 — KeyAtlas',
    metaAppDesc: '完整的 {app} 快捷键列表（Windows / Mac），共 {count} 条快捷键，来源官方文档。',
    metaCategoryTitle: '{category} 类快捷键 — KeyAtlas',
    metaCategoryDesc: '浏览所有 {category} 类工具的键盘快捷键，找到每款应用的快捷操作方式。',
    navHome: '首页',
    navSearch: '搜索',
    navCategories: '分类',
  },
};

type TranslationKeys = typeof translations.en;

let currentLang: Lang = detectLang();
const listeners = new Set<() => void>();

function detectLang(): Lang {
  if (typeof window === 'undefined') return 'en';
  const params = new URLSearchParams(window.location.search);
  if (params.has('lang')) {
    const l = params.get('lang');
    if (l === 'zh' || l === 'en') return l;
  }
  const stored = localStorage.getItem('keyatlas-lang');
  if (stored === 'zh' || stored === 'en') return stored;
  const navLang = navigator.language.toLowerCase();
  return navLang.startsWith('zh') ? 'zh' : 'en';
}

export function t(key: keyof TranslationKeys, vars?: Record<string, string>): string {
  const str = translations[currentLang][key] || translations.en[key] || key;
  if (!vars) return str;
  return Object.entries(vars).reduce(
    (result, [k, v]) => result.replace(new RegExp(`\\{${k}\\}`, 'g'), v),
    str
  );
}

export function getLang(): Lang {
  return currentLang;
}

/** Subscribe to language changes. Returns unsubscribe fn. */
export function useLangSubscribe(callback: () => void): () => void {
  listeners.add(callback);
  return () => { listeners.delete(callback); };
}

/** Hook: returns current lang and re-renders on change */
export function useLangState(): [Lang, (l: Lang) => void] {
  const [lang, setLangState] = useState<Lang>(currentLang);

  useEffect(() => {
    const cb = () => setLangState(currentLang);
    listeners.add(cb);
    return () => { listeners.delete(cb); };
  }, []);

  const setLangWrapper = (l: Lang) => setLang(l);
  return [lang, setLangWrapper];
}

import { useState, useEffect } from 'react';

export function setLang(lang: Lang): void {
  currentLang = lang;
  if (typeof window !== 'undefined') {
    localStorage.setItem('keyatlas-lang', lang);
    document.documentElement.lang = lang;
  }
  // Notify all subscribers → triggers React re-renders
  listeners.forEach(cb => cb());
}

export function getCategoryName(catId: string): string {
  const key = `category${catId.charAt(0).toUpperCase() + catId.slice(1)}` as keyof TranslationKeys;
  return t(key);
}
