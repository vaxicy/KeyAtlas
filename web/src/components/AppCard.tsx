import { Link } from 'react-router-dom';
import { t, getCategoryName, useLangState, getLang } from '../i18n';
import AppIcon from './AppIcon';
import type { App } from '../types';

interface Props {
  app: App;
  shortcutCount?: number;
  hideArrow?: boolean;
}

export default function AppCard({ app, shortcutCount, hideArrow = false }: Props) {
  useLangState();
  const lang = getLang();
  const displayName = lang === 'zh' && app.name?.zh ? app.name.zh : app.name.en;

  return (
    <Link to={`/apps/${app.id}`} className="app-card">
      <div className="app-card-inner">
        <AppIcon name={displayName} icon={app.icon} size={40} />
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
          <div className="app-card-meta">
            <span className="ka-meta-pill">{getCategoryName(app.category)}</span>
            {shortcutCount != null && (
              <span className="ka-meta-pill ka-muted-pill">
                {t('shortcutsCount', { count: String(shortcutCount) })}
              </span>
            )}
          </div>
        </div>
        {hideArrow ? <span aria-hidden="true" /> : (
          <svg style={{ flexShrink: 0, color: 'var(--sub-color)' }} width="18" height="18"
            viewBox="0 0 24 24"
            fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        )}
      </div>
    </Link>
  );
}
