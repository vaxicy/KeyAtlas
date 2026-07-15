import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { t, getCategoryName, useLangState } from '../i18n';
import { loadData, getCategories, getShortcutsByAppId } from '../data';
import SearchBar from '../components/SearchBar';
import ShortcutCard from '../components/ShortcutCard';
import AppIcon from '../components/AppIcon';
import { SkeletonGrid } from '../components/Skeleton';
import type { AllData } from '../types';

const POPULAR_APP_IDS = ['chrome', 'vscode', 'figma', 'photoshop', 'windows', 'excel', 'notion', 'discord'];

export default function Home() {
  const [data, setData] = useState<AllData | null>(null);
  const [quickShortcuts, setQuickShortcuts] = useState<any[]>([]);
  const navigate = useNavigate();
  const [lang] = useLangState(); // reactive — triggers re-render on lang change

  useEffect(() => {
    loadData().then(d => {
      setData(d);
      const windowsShortcuts = d.shortcuts.filter(s =>
        s.appId === 'windows' && s.type === 'shortcut'
      ).slice(0, 6);
      setQuickShortcuts(windowsShortcuts);
    });
  }, []);

  if (!data) return (
    <div style={{ maxWidth: 1024, margin: '0 auto', padding: '32px 20px 48px' }}>
      <div style={{ textAlign: 'center', marginBottom: 40, height: 220 }}>
        <div className="ka-skeleton" style={{ width: 240, height: 44, margin: '0 auto 10px' }} />
        <div className="ka-skeleton" style={{ width: 320, height: 20, margin: '0 auto 28px' }} />
        <div className="ka-skeleton" style={{ width: '100%', maxWidth: 560, height: 48, margin: '0 auto' }} />
      </div>
      <SkeletonGrid count={5} />
    </div>
  );

  const popularApps = POPULAR_APP_IDS
    .map(id => data.apps.find(a => a.id === id))
    .filter(Boolean) as NonNullable<ReturnType<typeof data.apps.find>>[];
  const remaining = data.apps
    .filter(a => a.popular && !popularApps.find(p => p.id === a.id))
    .slice(0, 8 - popularApps.length);
  const allPopular = [...popularApps, ...remaining];

  const categories = getCategories(data);

  return (
    <div style={{ maxWidth: 1024, margin: '0 auto', padding: '32px 20px 48px' }}>
      {/* Hero */}
      <div style={{ textAlign: 'center', marginBottom: 40 }}>
        <h1 style={{
          fontSize: 'clamp(2.2rem, 5vw, 3.2rem)',
          fontWeight: 800,
          letterSpacing: '-0.02em',
          marginBottom: 10,
          background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
        }}>
          KeyAtlas
        </h1>
        <p style={{ fontSize: 17, color: 'var(--sub-color)', marginBottom: 28 }}>
          {t('tagline')}
        </p>
        <SearchBar size="large" autoFocus />
      </div>

      {/* Quick Start */}
      {quickShortcuts.length > 0 && (
        <section style={{ marginBottom: 36 }}>
          <h2 className="section-title">{t('quickStart')}</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {quickShortcuts.map(s => (
              <ShortcutCard key={s.id} shortcut={s}
                appName={data.apps.find(a => a.id === s.appId)?.name.en} showCopy />
            ))}
          </div>
        </section>
      )}

      {/* Categories (primary navigation) */}
      <section style={{
        marginBottom: 36,
        background: 'var(--surface-color)',
        border: '1px solid var(--border-color)',
        borderRadius: 16,
        padding: '24px 24px 20px',
      }}>
        <h2 className="section-title">{t('popularCategories')}</h2>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => navigate(`/category/${cat.id}`)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                padding: '6px 16px',
                borderRadius: 9999,
                border: '1px solid var(--border-color)',
                background: 'var(--surface-2-color)',
                color: 'var(--text-color)',
                fontSize: 14,
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                whiteSpace: 'nowrap',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = '#a5b4fc';
                e.currentTarget.style.color = '#4f46e5';
                e.currentTarget.style.background = '#eef2ff';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = 'var(--border-color)';
                e.currentTarget.style.color = 'var(--text-color)';
                e.currentTarget.style.background = 'var(--surface-2-color)';
              }}
            >
              {getCategoryName(cat.id)}
              <span style={{ fontSize: 12, fontWeight: 400, color: 'var(--sub-color)' }}>({cat.count})</span>
            </button>
          ))}
        </div>
      </section>

      {/* Popular Apps */}
      <section style={{ marginBottom: 24 }}>
        <h2 className="section-title">{t('popularApps')}</h2>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
          gap: 12,
        }}>
          {allPopular.map(app => (
            <a key={app.id}
              href={`/apps/${app.id}`}
              onClick={e => { e.preventDefault(); navigate(`/apps/${app.id}`); }}
              className="app-card-link"
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                {/* Icon placeholder */}
                <AppIcon name={lang === 'zh' && app.name?.zh ? app.name.zh : app.name.en} icon={app.icon} size={44} />
                <div style={{ minWidth: 0, flex: 1 }}>
                  <h3 className="app-card-title" style={{
                    fontWeight: 600,
                    color: 'var(--text-color)',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    transition: 'color 0.15s',
                  }}>
                    {lang === 'zh' && app.name?.zh ? app.name.zh : app.name.en}
                  </h3>
                  <p style={{
                    fontSize: 12,
                    color: 'var(--sub-color)',
                    marginTop: 3,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                  }}>
                    <span>{getCategoryName(app.category)}</span>
                    <span>·</span>
                    <span>{t('shortcutsCount', { count: String(getShortcutsByAppId(data, app.id).length) })}</span>
                  </p>
                </div>
                <svg style={{ flexShrink: 0, color: 'var(--sub-color)' }} width="16" height="16"
                  fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="9 18 15 12 9 6"/>
                </svg>
              </div>
            </a>
          ))}
        </div>
      </section>
    </div>
  );
}


