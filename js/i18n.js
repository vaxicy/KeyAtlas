/**
 * KeyAtlas i18n module
 * All UI strings live here. Dynamic text MUST reference t.<key> — never hardcode.
 * Language priority: URL ?lang= > localStorage > navigator.language.
 */
const I18N = {
  en: {
    appName: "KeyAtlas",
    tagline: "Shortcut Search Engine",
    searchPlaceholder: "Search action, app or shortcut…",
    tabSearch: "Search",
    tabCategories: "Categories",
    tabFavorites: "Favorites",
    tabRecent: "Recent",
    settings: "Settings",
    osLabel: "Your OS",
    langLabel: "Language",
    themeLabel: "Theme",
    themeLight: "Light",
    themeDark: "Dark",
    all: "All",
    resultsCount: "{n} shortcuts",
    noResults: "No shortcuts found",
    noResultsQuery: 'No shortcuts for "{q}"',
    noResultsHint: "Try another keyword or app name.",
    kbdHint: "↑↓ to navigate · Enter to view · Esc to clear",
    startTyping: "Type to search shortcuts",
    startTypingHint: "e.g. copy, screenshot, VS Code",
    emptyFavorites: "No favorites yet",
    emptyFavoritesHint: "Tap the star on any shortcut to save it.",
    emptyFavoritesAction: "Browse shortcuts",
    emptyRecent: "No recent shortcuts",
    emptyRecentHint: "Shortcuts you view will appear here.",
    emptyRecentAction: "Browse shortcuts",
    clear: "Clear",
    back: "Back",
    copied: "Copied!",
    addFav: "Add to favorites",
    removeFav: "Remove from favorites",
    os_windows: "Windows",
    os_mac: "macOS",
    os_linux: "Linux",
    os_universal: "Universal",
    loading: "Loading…",
    settingsTitle: "Settings",
    close: "Close",
    filterLabel: "System",
    advancedFilters: "Advanced filters",
    aboutTitle: "About KeyAtlas",
    aboutDesc: "A fast, offline shortcut search engine for your OS and favorite apps.",
    aboutVersion: "Version {n}",
    browse: "Browse",
    quickStart: "Quick start",
    popularApps: "Popular apps",
    trySearch: "Try searching",
    grpSystem: "System",
    grpSoftware: "Software",
    grpScenes: "Scenes",
    copyKey: "Copy",
    shortcutLabel: "Shortcut",
    export: "Export",
    exportCopied: "Exported to clipboard!",
    suggestTitle: "Try a suggestion:",
    removeRecentOne: "Remove from recent",
    favExportTitle: "Favorited shortcuts",
    incognitoLabel: "Incognito Mode",
    incognitoHint: "Stop saving recently viewed shortcuts",
    supportTitle: "Support KeyAtlas",
    supportDesc: "If KeyAtlas helps you, buy me a coffee.",
    supportPaypal: "Donate via PayPal",
    supportWechat: "WeChat QR code",
    supportWechatHint: "Scan with WeChat to tip",
    legCommand: "Command", legOption: "Option", legShift: "Shift", legCtrl: "Ctrl", legWin: "Win"
  },
  zh: {
    appName: "KeyAtlas",
    tagline: "快捷键搜索引擎",
    searchPlaceholder: "搜索操作、软件或快捷键…",
    tabSearch: "搜索",
    tabCategories: "分类",
    tabFavorites: "收藏",
    tabRecent: "最近",
    settings: "设置",
    osLabel: "当前系统",
    langLabel: "语言",
    themeLabel: "主题",
    themeLight: "浅色",
    themeDark: "深色",
    all: "全部",
    resultsCount: "{n} 条快捷键",
    noResults: "未找到快捷键",
    noResultsQuery: '未找到 "{q}" 的快捷键',
    noResultsHint: "换个关键词或软件名试试。",
    kbdHint: "↑↓ 选择 · Enter 查看 · Esc 清空",
    startTyping: "输入以搜索快捷键",
    startTypingHint: "例如：复制、截图、VS Code",
    emptyFavorites: "还没有收藏",
    emptyFavoritesHint: "点击任意快捷键上的星标即可收藏。",
    emptyFavoritesAction: "去浏览快捷键",
    emptyRecent: "还没有最近记录",
    emptyRecentHint: "查看过的快捷键会显示在这里。",
    emptyRecentAction: "去浏览快捷键",
    clear: "清空",
    back: "返回",
    copied: "已复制！",
    addFav: "加入收藏",
    removeFav: "取消收藏",
    os_windows: "Windows",
    os_mac: "macOS",
    os_linux: "Linux",
    os_universal: "通用",
    loading: "加载中…",
    settingsTitle: "设置",
    close: "关闭",
    filterLabel: "系统",
    advancedFilters: "高级筛选",
    aboutTitle: "关于 KeyAtlas",
    aboutDesc: "一个快速、离线的快捷键搜索引擎，覆盖你的系统与常用软件。",
    aboutVersion: "版本 {n}",
    browse: "浏览",
    quickStart: "快速开始",
    popularApps: "热门软件",
    trySearch: "试试搜索",
    grpSystem: "系统",
    grpSoftware: "软件",
    grpScenes: "场景",
    copyKey: "复制",
    shortcutLabel: "快捷键",
    export: "导出",
    exportCopied: "已复制到剪贴板！",
    suggestTitle: "试试这些：",
    removeRecentOne: "从最近记录移除",
    favExportTitle: "收藏的快捷键",
    incognitoLabel: "无痕模式",
    incognitoHint: "开启后不记录最近浏览的快捷键",
    supportTitle: "支持 KeyAtlas",
    supportDesc: "如果这个工具帮到你，请我喝杯咖啡吧。",
    supportPaypal: "通过 PayPal 赞赏",
    supportWechat: "微信赞赏码",
    supportWechatHint: "用微信扫码赞赏",
    legCommand: "Cmd", legOption: "Option", legShift: "Shift", legCtrl: "Ctrl", legWin: "Win"
  }
};

const LANG_KEY = "keyatlas_lang";

function detectLang() {
  const params = new URLSearchParams(location.search);
  const urlLang = params.get("lang");
  if (urlLang && I18N[urlLang]) {
    localStorage.setItem(LANG_KEY, urlLang);
    return urlLang;
  }
  const stored = localStorage.getItem(LANG_KEY);
  if (stored && I18N[stored]) return stored;
  const nav = (navigator.language || "en").toLowerCase();
  return nav.startsWith("zh") ? "zh" : "en";
}

const i18n = {
  lang: detectLang(),
  get t() {
    return I18N[this.lang];
  },
  setLang(lang) {
    if (!I18N[lang]) return;
    this.lang = lang;
    localStorage.setItem(LANG_KEY, lang);
  },
  /** Resolve a bilingual {zh,en} field to the current language. */
  pick(obj) {
    if (!obj) return "";
    return obj[this.lang] || obj.en || obj.zh || "";
  },
  /** Simple {n} interpolation. */
  format(str, vars) {
    return str.replace(/\{(\w+)\}/g, (_, k) => (vars && vars[k] != null ? vars[k] : ""));
  }
};

window.i18n = i18n;
