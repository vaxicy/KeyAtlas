import { Link } from 'react-router-dom';
import { useLangState } from '../i18n';

const headerStyle: React.CSSProperties = {
  position: 'sticky',
  top: 0,
  zIndex: 50,
  backdropFilter: 'blur(20px)',
  background: 'rgba(248, 249, 251, 0.8)',
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
        style={{ maxWidth: 1024, margin: '0 auto', padding: '0 20px', height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        {/* Brand */}
        <Link to="/" style={brandLinkStyle}>
          <div style={{
            width: 32,
            height: 32,
            borderRadius: 8,
            background: 'linear-gradient(135deg, #6366f1, #4338ca)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(99,102,241,.3)',
          }}>
            <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="7" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </div>
          <span style={{
            fontSize: 17,
            fontWeight: 700,
            color: 'var(--text-color)',
            letterSpacing: '-0.01em',
          }}>
            KeyAtlas
          </span>
        </Link>

        {/* Right actions — lang toggle only */}
        <button
          onClick={() => setLang(lang === 'en' ? 'zh' : 'en')}
          style={{
            padding: '5px 12px',
            fontSize: 13,
            fontWeight: 600,
            borderRadius: 8,
            background: 'var(--surface-2-color)',
            color: 'var(--text-color)',
            border: '1px solid var(--border-color)',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = '#a5b4fc'; e.currentTarget.style.color = '#4f46e5'; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-color)'; e.currentTarget.style.color = 'var(--text-color)'; }}
        >
          {lang === 'en' ? '中文' : 'EN'}
        </button>
      </div>
    </header>
  );
}
