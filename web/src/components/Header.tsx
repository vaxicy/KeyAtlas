import { Link } from 'react-router-dom';
import { useLangState, t } from '../i18n';
import { useThemeState, type ThemeMode } from '../theme';

const headerStyle: React.CSSProperties = {
  position: 'sticky',
  top: 0,
  zIndex: 50,
  backdropFilter: 'blur(20px)',
  WebkitBackdropFilter: 'blur(20px)',
  background: 'color-mix(in srgb, var(--bg-color) 86%, transparent)',
  borderBottom: '1px solid var(--border-color)',
};
const brandLinkStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  textDecoration: 'none',
};
const actionsStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
};

const THEME_ICON: Record<ThemeMode, string> = {
  light: '☀️',
  dark: '🌙',
};
const THEME_LABEL: Record<ThemeMode, 'themeLight' | 'themeDark'> = {
  light: 'themeLight',
  dark: 'themeDark',
};
/** 二态循环：浅色 ↔ 深色 */
const NEXT_THEME: Record<ThemeMode, ThemeMode> = {
  light: 'dark',
  dark: 'light',
};

export default function Header() {
  const [lang, setLang] = useLangState();
  const [themeMode, setThemeMode] = useThemeState();

  const themeHint = `${t('themeLabel')}: ${t(THEME_LABEL[themeMode])}`;

  return (
    <header style={headerStyle}>
      <div
        className="page-shell"
        style={{ height: 58, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        {/* Brand */}
        <Link to="/" style={brandLinkStyle}>
          <img
            src="/icons/icon-48.png"
            alt="KeyAtlas"
            style={{ width: 30, height: 30, borderRadius: 8, boxShadow: '0 2px 6px rgba(79,70,229,.35)' }}
          />
          <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.15 }}>
            <span style={{
              fontSize: 16,
              fontWeight: 700,
              color: 'var(--text-color)',
            }}>
              KeyAtlas
            </span>
            <span style={{ fontSize: 11, color: 'var(--sub-color)', fontWeight: 500 }}>
              {t('tagline')}
            </span>
          </div>
        </Link>

        {/* Right actions — theme + language */}
        <div style={actionsStyle}>
          <button
            className="theme-toggle"
            onClick={() => setThemeMode(NEXT_THEME[themeMode])}
            title={themeHint}
            aria-label={themeHint}
          >
            <span aria-hidden="true">{THEME_ICON[themeMode]}</span>
            <span>{t(THEME_LABEL[themeMode])}</span>
          </button>
          <button
            className="theme-toggle"
            onClick={() => setLang(lang === 'en' ? 'zh' : 'en')}
            title={t('langLabel')}
            aria-label={t('langLabel')}
          >
            {lang === 'en' ? '中文' : 'EN'}
          </button>
        </div>
      </div>
    </header>
  );
}
