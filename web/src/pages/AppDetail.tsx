import { useState, useEffect, useMemo } from 'react';
import { useParams, Link, useNavigate, useSearchParams } from 'react-router-dom';
import { t, getCategoryName, useLangState, getLang } from '../i18n';
import { loadApps, loadAppShortcuts, getAppById } from '../data';
import ShortcutCard from '../components/ShortcutCard';
import AppIcon from '../components/AppIcon';
import KeyBadge from '../components/KeyBadge';
import Highlight from '../components/Highlight';
import { SkeletonGrid } from '../components/Skeleton';
import type { App, Shortcut } from '../types';
import { usePageMeta } from '../seo';
import { isFavoriteApp, recordRecentApp, toggleFavoriteApp } from '../webStorage';

type PlatformFilter = 'all' | 'windows' | 'mac' | 'linux';
type ViewMode = 'cards' | 'compare';

const VALID_PLATFORMS = new Set(['all', 'windows', 'mac', 'linux']);
const VALID_VIEWS = new Set(['cards', 'compare']);

function titleCase(value: string) {
  return value.replace(/[-_]+/g, ' ').replace(/\b\w/g, char => char.toUpperCase());
}

function shortcutGroup(shortcut: Shortcut) {
  const parts = shortcut.id.split('-');
  const appPart = parts[0];
  const group = parts[1] && appPart === shortcut.appId ? parts[1] : parts[0];
  return titleCase(group || shortcut.category || 'General');
}

function matchesShortcut(shortcut: Shortcut, query: string) {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return [
    shortcut.name.en,
    shortcut.name.zh,
    shortcut.description.en,
    shortcut.description.zh,
    ...(shortcut.keywords || []),
    shortcut.windows || '',
    shortcut.mac || '',
    shortcut.linux || '',
  ].some(field => (field || '').toLowerCase().includes(q));
}

function groupShortcuts(shortcuts: Shortcut[]) {
  const map = new Map<string, Shortcut[]>();
  for (const shortcut of shortcuts) {
    const key = shortcutGroup(shortcut);
    map.set(key, [...(map.get(key) || []), shortcut]);
  }
  return Array.from(map.entries());
}

export default function AppDetail() {
  const { appId } = useParams<{ appId: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [apps, setApps] = useState<App[] | null>(null);
  const [appShortcuts, setAppShortcuts] = useState<Shortcut[] | null>(null);
  const [favorite, setFavorite] = useState(false);
  useLangState();
  const currentLang = getLang();

  const platformParam = searchParams.get('platform') || 'all';
  const platform = (VALID_PLATFORMS.has(platformParam) ? platformParam : 'all') as PlatformFilter;
  const searchQ = searchParams.get('q') || '';
  const viewParam = searchParams.get('view') || 'cards';
  const viewMode = (VALID_VIEWS.has(viewParam) ? viewParam : 'cards') as ViewMode;

  const app = useMemo(() => apps ? getAppById({ apps }, appId || '') : null, [apps, appId]);
  usePageMeta(
    app ? t('metaAppTitle', { app: app.name.en }) : t('metaHomeTitle'),
    app ? t('metaAppDesc', { app: app.name.en, count: String(app.shortcutCount || 0) }) : t('metaHomeDesc'),
    appId ? `/apps/${appId}` : '/'
  );

  const updateParam = (key: string, value: string, defaultValue: string) => {
    const next = new URLSearchParams(searchParams);
    if (!value || value === defaultValue) next.delete(key);
    else next.set(key, value);
    setSearchParams(next, { replace: true });
  };

  useEffect(() => {
    let alive = true;
    setAppShortcuts(null);
    loadApps().then(loadedApps => { if (alive) setApps(loadedApps); });
    if (appId) {
      setFavorite(isFavoriteApp(appId));
      recordRecentApp(appId);
      loadAppShortcuts(appId)
        .then(shortcuts => { if (alive) setAppShortcuts(shortcuts); })
        .catch(() => { if (alive) setAppShortcuts([]); });
    }
    return () => { alive = false; };
  }, [appId]);

  if (!apps || appShortcuts === null) return (
    <div className="page-shell page-shell-padded">
      <SkeletonGrid count={6} />
    </div>
  );

  if (!app) return (
    <div className="page-shell" style={{ padding: '80px 0', textAlign: 'center' }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>App not found</h1>
      <Link to="/" style={{ color: 'var(--primary-strong-color)' }}>{t('goBack')}</Link>
    </div>
  );

  const filteredShortcuts = appShortcuts
    .filter(shortcut => platform === 'all' || shortcut[platform])
    .filter(shortcut => matchesShortcut(shortcut, searchQ));

  const grouped = groupShortcuts(filteredShortcuts);
  const platforms: { key: PlatformFilter; label: string }[] = [
    { key: 'all', label: t('platformAll') },
    { key: 'windows', label: t('platformWindows') },
    { key: 'mac', label: t('platformMac') },
    { key: 'linux', label: t('platformLinux') },
  ];

  return (
    <div className="page-shell page-shell-padded">
      <button className="ka-back" onClick={() => navigate(-1)} style={{ marginBottom: 20 }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="15 18 9 12 15 6" />
        </svg>
        {t('back')}
      </button>

      <div className="app-detail-head">
        <AppIcon name={currentLang === 'zh' && app.name?.zh ? app.name.zh : app.name.en} icon={app.icon} size={58} />
        <div style={{ minWidth: 0, flex: 1 }}>
          <h1 style={{ fontSize: 'clamp(1.5rem, 3vw, 1.9rem)', fontWeight: 800 }}>
            {currentLang === 'zh' && app.name?.zh ? app.name.zh : app.name.en}
          </h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 7, flexWrap: 'wrap' }}>
            <span className="ka-meta-pill">{getCategoryName(app.category)}</span>
            <span className={app.source === 'official' ? 'ka-meta-pill' : 'ka-meta-pill ka-muted-pill'}>
              {app.source === 'official' ? t('sourceOfficial') : t('sourceCommunity')}
            </span>
            <span className="ka-meta-pill ka-muted-pill">
              {t('shortcutsCount', { count: String(app.shortcutCount || appShortcuts.length) })}
            </span>
          </div>
        </div>
        <button
          className={`favorite-btn${favorite ? ' active' : ''}`}
          onClick={() => appId && setFavorite(toggleFavoriteApp(appId))}
          aria-label={favorite ? 'Remove favorite' : 'Add favorite'}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill={favorite ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
          </svg>
        </button>
      </div>

      <div className="app-detail-tools">
        <div style={{ position: 'relative', flex: '1 1 320px', maxWidth: 520 }}>
          <svg style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--sub-color)' }} width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
            <circle cx="11" cy="11" r="7" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            value={searchQ}
            onChange={event => updateParam('q', event.target.value, '')}
            placeholder={t('searchInApp', { name: app.name.en })}
            autoComplete="off"
            spellCheck={false}
            className="ka-input"
            style={{ paddingLeft: 40 }}
          />
        </div>

        <div className="ka-segmented">
          {platforms.map(item => (
            <button
              key={item.key}
              onClick={() => updateParam('platform', item.key, 'all')}
              className={`ka-segmented-btn${platform === item.key ? ' active' : ''}`}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div className="ka-segmented">
          <button onClick={() => updateParam('view', 'cards', 'cards')} className={`ka-segmented-btn${viewMode === 'cards' ? ' active' : ''}`}>
            Cards
          </button>
          <button onClick={() => updateParam('view', 'compare', 'cards')} className={`ka-segmented-btn${viewMode === 'compare' ? ' active' : ''}`}>
            Compare
          </button>
        </div>
      </div>

      {filteredShortcuts.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '64px 0', color: 'var(--sub-color)' }}>
          <p style={{ fontSize: 18, fontWeight: 500 }}>{t('noResults')}</p>
          <p style={{ marginTop: 4, fontSize: 14 }}>{t('tryDifferent')}</p>
        </div>
      ) : viewMode === 'compare' ? (
        <div className="compare-table">
          <div className="compare-head">
            <span>Action</span>
            <span>Windows</span>
            <span>macOS</span>
            <span>Linux</span>
          </div>
          {filteredShortcuts.map(shortcut => (
            <div className="compare-row" key={shortcut.id}>
              <div>
                <strong><Highlight text={currentLang === 'zh' && shortcut.name?.zh ? shortcut.name.zh : shortcut.name.en} query={searchQ} /></strong>
                <p><Highlight text={currentLang === 'zh' && shortcut.description?.zh ? shortcut.description.zh : shortcut.description.en} query={searchQ} /></p>
              </div>
              <KeyBadge keys={(shortcut.windows || '').split(/\s*\+\s*/).filter(Boolean)} />
              <KeyBadge keys={(shortcut.mac || '').split(/\s*\+\s*/).filter(Boolean)} />
              <KeyBadge keys={(shortcut.linux || '').split(/\s*\+\s*/).filter(Boolean)} />
            </div>
          ))}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
          {grouped.map(([group, shortcuts]) => (
            <section key={group}>
              <h2 className="section-title">{group}</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {shortcuts.map(shortcut => (
                  <ShortcutCard
                    key={shortcut.id}
                    shortcut={shortcut}
                    showCopy
                    platform={platform === 'all' ? undefined : platform}
                    query={searchQ}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
