import { Link } from 'react-router-dom';
import { useLangState } from '../i18n';

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

export default function Header() {
  const [lang, setLang] = useLangState();

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
              Shortcut Search Engine
            </span>
          </div>
        </Link>

        {/* Right actions — lang toggle only */}
        <button
          onClick={() => setLang(lang === 'en' ? 'zh' : 'en')}
          style={{
            padding: '5px 12px',
            fontSize: 13,
            fontWeight: 600,
            borderRadius: 9,
            background: 'var(--surface-color)',
            color: 'var(--sub-color)',
            border: 'none',
            cursor: 'pointer',
            boxShadow: 'var(--shadow)',
            transition: 'color .15s, background .15s, box-shadow .15s',
          }}
          onMouseEnter={e => { e.currentTarget.style.color = 'var(--primary-strong-color)'; e.currentTarget.style.background = 'var(--primary-soft-color)'; }}
          onMouseLeave={e => { e.currentTarget.style.color = 'var(--sub-color)'; e.currentTarget.style.background = 'var(--surface-color)'; }}
        >
          {lang === 'en' ? '中文' : 'EN'}
        </button>
      </div>
    </header>
  );
}
