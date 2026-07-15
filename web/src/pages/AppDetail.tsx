import { useState, useEffect, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { t, getCategoryName, useLangState } from '../i18n';
import { loadData, getAppById, getShortcutsByAppId } from '../data';
import ShortcutCard from '../components/ShortcutCard';
import AppIcon from '../components/AppIcon';
import { SkeletonGrid } from '../components/Skeleton';

type PlatformFilter = 'all' | 'windows' | 'mac' | 'linux';

export default function AppDetail() {
  const { appId } = useParams<{ appId: string }>();
  const navigate = useNavigate();
  const [platform, setPlatform] = useState<PlatformFilter>('all');
  const [searchQ, setSearchQ] = useState('');
  useLangState(); // subscribe to re-render on language change

  const [data, setData] = useState<any>(null);
  const app = useMemo(() => data ? getAppById(data, appId || '') : null, [data, appId]);

  useEffect(() => {
    loadData().then(setData);
  }, [appId]);

  if (!data) return (
    <div style={{ maxWidth: 1024, margin: '0 auto', padding: '32px 20px 48px' }}>
      <SkeletonGrid count={6} />
    </div>
  );
  if (!app) return (
    <div style={{ maxWidth: 1024, margin: '0 auto', padding: '80px 20px', textAlign: 'center' }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>App not found</h1>
      <Link to="/" style={{ color: '#4f46e5' }}>{t('goBack')}</Link>
    </div>
  );

  let shortcuts = getShortcutsByAppId(data, appId!);

  // Platform filter
  if (platform !== 'all') {
    shortcuts = shortcuts.filter(s => s[platform]);
  }

  // In-app search
  if (searchQ.trim()) {
    const q = searchQ.trim().toLowerCase();
    shortcuts = shortcuts.filter(s =>
      [s.name.en, s.name.zh, s.description.en, s.description.zh, ...(s.keywords || []), s.windows || '', s.mac || '', s.linux || '']
        .some(f => f.toLowerCase().includes(q))
    );
  }

  const platforms: { key: PlatformFilter; label: string }[] = [
    { key: 'all', label: t('platformAll') },
    { key: 'windows', label: t('platformWindows') },
    { key: 'mac', label: t('platformMac') },
    { key: 'linux', label: t('platformLinux') },
  ];

  return (
    <div style={{ maxWidth: 1024, margin: '0 auto', padding: '32px 20px 48px' }}>
      {/* Back button */}
      <button className="ka-back" onClick={() => navigate(-1)} style={{ marginBottom: 20 }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="15 18 9 12 15 6" />
        </svg>
        {t('back')}
      </button>

      {/* App header */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
          <AppIcon name={app.name.en} icon={app.icon} size={56} />
          <div>
            <h1 style={{ fontSize: 'clamp(1.5rem, 3vw, 1.9rem)', fontWeight: 800, letterSpacing: '-0.02em' }}>{app.name.en}</h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4, flexWrap: 'wrap' }}>
              <span style={{
                fontSize: 13, fontWeight: 500, textTransform: 'capitalize',
                padding: '2px 10px', borderRadius: 8,
                background: '#eef2ff', color: '#4f46e5',
              }}>
                {getCategoryName(app.category)}
              </span>
              <span style={{
                fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em',
                padding: '2px 8px', borderRadius: 8,
                background: app.source === 'official' ? '#ecfdf5' : '#fffbeb',
                color: app.source === 'official' ? '#059669' : '#d97706',
              }}>
                {app.source === 'official' ? t('sourceOfficial') : t('sourceCommunity')}
              </span>
              <span style={{ fontSize: 14, color: 'var(--sub-color)' }}>
                {shortcuts.length} {t('shortcutsCount', { count: '' })}
              </span>
            </div>
          </div>
        </div>

        {/* In-app search */}
        <div style={{ position: 'relative', marginBottom: 16, maxWidth: 512 }}>
          <svg style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--sub-color)' }} width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
            <circle cx="11" cy="11" r="7" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text" value={searchQ} onChange={e => setSearchQ(e.target.value)}
            placeholder={t('searchInApp', { name: app.name.en })}
            autoComplete="off" spellCheck={false}
            className="ka-input"
            style={{ paddingLeft: 40 }}
          />
        </div>

        {/* Platform filter pills */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {platforms.map(p => {
            const active = platform === p.key;
            return (
              <button
                key={p.key}
                onClick={() => setPlatform(p.key)}
                style={{
                  padding: '6px 14px',
                  borderRadius: 10,
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all .15s ease',
                  border: active ? '1px solid transparent' : '1px solid var(--border-color)',
                  background: active ? '#6366f1' : 'var(--surface-2-color)',
                  color: active ? '#ffffff' : 'var(--sub-color)',
                }}
                onMouseEnter={e => { if (!active) { e.currentTarget.style.color = 'var(--text-color)'; e.currentTarget.style.background = 'var(--surface-color)'; } }}
                onMouseLeave={e => { if (!active) { e.currentTarget.style.color = 'var(--sub-color)'; e.currentTarget.style.background = 'var(--surface-2-color)'; } }}
              >
                {p.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Shortcuts list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {shortcuts.map(s => (
          <ShortcutCard key={s.id} shortcut={s} showCopy platform={platform === 'all' ? undefined : platform} />
        ))}

        {shortcuts.length === 0 && (
          <div style={{ textAlign: 'center', padding: '64px 0', color: 'var(--sub-color)' }}>
            <p style={{ fontSize: 18, fontWeight: 500 }}>{t('noResults')}</p>
            <p style={{ marginTop: 4, fontSize: 14 }}>{t('tryDifferent')}</p>
          </div>
        )}
      </div>
    </div>
  );
}
