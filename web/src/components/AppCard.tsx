import { Link } from 'react-router-dom';
import { t, getCategoryName, useLangState, getLang } from '../i18n';
import type { App } from '../types';

interface Props {
  app: App;
  shortcutCount?: number;
}

export default function AppCard({ app, shortcutCount }: Props) {
  useLangState(); // subscribe to re-render on language change
  const lang = getLang();
  const displayName = lang === 'zh' && app.name?.zh ? app.name.zh : app.name.en;
  return (
    <Link to={`/apps/${app.id}`} className="app-card">
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <span className="app-card-icon" style={{
          fontSize: 24,
          flexShrink: 0,
          width: 40,
          height: 40,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'var(--surface-2-color)',
          borderRadius: 10,
        }}>
          {app.icon}
        </span>
        <div style={{ minWidth: 0, flex: 1 }}>
          <h3 className="app-card-title" style={{
            fontWeight: 600,
            color: 'var(--text-color)',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            transition: 'color 0.15s',
          }}>
            {displayName}
          </h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 2 }}>
            <span style={{ fontSize: 12, color: 'var(--sub-color)', textTransform: 'capitalize' }}>
              {getCategoryName(app.category)}
            </span>
            {shortcutCount != null && (
              <>
                <span style={{ fontSize: 12, color: 'var(--border-color)' }}>·</span>
                <span style={{ fontSize: 12, color: 'var(--sub-color)' }}>
                  {t('shortcutsCount', { count: String(shortcutCount) })}
                </span>
              </>
            )}
          </div>
        </div>
        <svg style={{ flexShrink: 0, color: 'var(--sub-color)' }} width="16" height="16"
          fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="9 18 15 12 9 6" />
        </svg>
      </div>
    </Link>
  );
}
