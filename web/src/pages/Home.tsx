import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { t, getCategoryName, useLangState, getLang } from '../i18n';
import { loadApps, loadAppShortcuts, getCategories } from '../data';
import SearchBar from '../components/SearchBar';
import ShortcutCard from '../components/ShortcutCard';
import AppCard from '../components/AppCard';
import { SkeletonGrid } from '../components/Skeleton';
import type { App, Shortcut } from '../types';
import { usePageMeta } from '../seo';
import { clearRecentApps, getFavoriteApps, getRecentApps, removeRecentApp } from '../webStorage';

const POPULAR_APP_IDS = ['chrome', 'vscode', 'figma', 'photoshop', 'windows', 'excel', 'notion', 'discord', 'cursor'];
const POPULAR_APP_LIMIT = 9;

export default function Home() {
  const [apps, setApps] = useState<App[] | null>(null);
  const [quickShortcuts, setQuickShortcuts] = useState<Shortcut[]>([]);
  const [recentVersion, setRecentVersion] = useState(0);
  const navigate = useNavigate();
  useLangState();
  const lang = getLang();
  usePageMeta(t('metaHomeTitle'), t('metaHomeDesc'), '/');

  useEffect(() => {
    loadApps().then(setApps);
    loadAppShortcuts('windows').then(shortcuts => {
      setQuickShortcuts(shortcuts.filter(shortcut => shortcut.type === 'shortcut').slice(0, 6));
    }).catch(() => setQuickShortcuts([]));
  }, []);

  if (!apps) return (
    <div className="page-shell page-shell-padded">
      <div style={{ textAlign: 'center', marginBottom: 40, height: 220 }}>
        <div className="ka-skeleton" style={{ width: 220, height: 40, margin: '0 auto 10px' }} />
        <div className="ka-skeleton" style={{ width: 300, height: 18, margin: '0 auto 26px' }} />
        <div className="ka-skeleton" style={{ width: '100%', maxWidth: 560, height: 52, margin: '0 auto' }} />
      </div>
      <SkeletonGrid count={5} />
    </div>
  );

  const popularApps = POPULAR_APP_IDS
    .map(id => apps.find(app => app.id === id))
    .filter(Boolean) as App[];
  const remaining = apps
    .filter(app => app.popular && !popularApps.find(popular => popular.id === app.id))
    .slice(0, Math.max(0, POPULAR_APP_LIMIT - popularApps.length));
  const allPopular = [...popularApps, ...remaining].slice(0, POPULAR_APP_LIMIT);
  const categories = getCategories({ apps });
  const totalShortcuts = apps.reduce((sum, app) => sum + (app.shortcutCount || 0), 0);
  const favoriteApps = getFavoriteApps(apps, 6);
  const recentApps = recentVersion >= 0 ? getRecentApps(apps, 6) : [];

  return (
    <div className="page-shell page-shell-padded">
      <div style={{ textAlign: 'center', marginBottom: 34 }}>
        <h1 style={{
          fontSize: 'clamp(2rem, 4vw, 2.7rem)',
          fontWeight: 800,
          marginBottom: 8,
          color: 'var(--text-color)',
        }}>
          KeyAtlas
        </h1>
        <p style={{ fontSize: 15, color: 'var(--sub-color)', marginBottom: 24, fontWeight: 500 }}>
          {t('tagline')}
        </p>
        <SearchBar size="large" autoFocus />
        <div className="ka-stat-row">
          <span className="ka-stat-pill">{apps.length} apps</span>
          <span className="ka-stat-pill">{totalShortcuts} shortcuts</span>
          <span className="ka-stat-pill">{lang === 'zh' ? '官方 / 社区来源' : 'Official / community sources'}</span>
          <span className="ka-stat-pill">{lang === 'zh' ? '更新于 2026-07-17' : 'Updated 2026-07-17'}</span>
        </div>
      </div>

      {favoriteApps.length > 0 && (
        <section style={{ marginBottom: 36 }}>
          <h2 className="section-title">{lang === 'zh' ? '收藏应用' : 'Favorite Apps'}</h2>
          <div className="ka-fluid-grid">
            {favoriteApps.map(app => (
              <AppCard key={app.id} app={app} shortcutCount={app.shortcutCount || 0} />
            ))}
          </div>
        </section>
      )}

      {recentApps.length > 0 && (
        <section style={{ marginBottom: 36 }}>
          <div className="section-title-row">
            <h2 className="section-title">{lang === 'zh' ? '最近查看' : 'Recently Viewed'}</h2>
            <div className="section-actions">
              <button
                type="button"
                className="ka-text-action"
                onClick={() => {
                  clearRecentApps();
                  setRecentVersion(version => version + 1);
                }}
              >
                {lang === 'zh' ? '清空' : 'Clear'}
              </button>
            </div>
          </div>
          <div className="ka-fluid-grid">
            {recentApps.map(app => (
              <div key={app.id} className="recent-card-wrap">
                <AppCard app={app} shortcutCount={app.shortcutCount || 0} hideArrow />
                <button
                  type="button"
                  className="recent-remove-btn"
                  aria-label={lang === 'zh' ? `移除 ${app.name.zh || app.name.en}` : `Remove ${app.name.en}`}
                  onClick={() => {
                    removeRecentApp(app.id);
                    setRecentVersion(version => version + 1);
                  }}
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      {quickShortcuts.length > 0 && (
        <section style={{ marginBottom: 36 }}>
          <h2 className="section-title">{t('quickStart')}</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {quickShortcuts.map(shortcut => (
              <ShortcutCard
                key={shortcut.id}
                shortcut={shortcut}
                appName={apps.find(app => app.id === shortcut.appId)?.name.en}
                showCopy
              />
            ))}
          </div>
        </section>
      )}

      <section style={{ marginBottom: 36 }}>
        <h2 className="section-title">{t('popularCategories')}</h2>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {categories.map(category => (
            <button
              key={category.id}
              onClick={() => navigate(`/category/${category.id}`)}
              className="ka-chip"
            >
              {getCategoryName(category.id)}
              <span className="count">({category.count})</span>
            </button>
          ))}
        </div>
      </section>

      <section style={{ marginBottom: 24 }}>
        <h2 className="section-title">{t('popularApps')}</h2>
        <div className="ka-centered-grid">
          {allPopular.map(app => (
            <AppCard key={app.id} app={app} shortcutCount={app.shortcutCount || 0} />
          ))}
        </div>
      </section>
    </div>
  );
}
