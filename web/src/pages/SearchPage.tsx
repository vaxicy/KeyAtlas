import { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { t, useLangState, getLang } from '../i18n';
import { loadData } from '../data';
import { search } from '../search';
import type { AllData } from '../types';
import SearchBar from '../components/SearchBar';
import ShortcutCard from '../components/ShortcutCard';
import AppCard from '../components/AppCard';
import { SkeletonGrid } from '../components/Skeleton';
import EmptyState from '../components/EmptyState';

// Bilingual popular search terms shown when the query is empty.
const HOT_TERMS: { zh: string; en: string }[] = [
  { zh: '复制', en: 'copy' },
  { zh: '粘贴', en: 'paste' },
  { zh: '截图', en: 'screenshot' },
  { zh: '撤销', en: 'undo' },
  { zh: '全选', en: 'select all' },
  { zh: '保存', en: 'save' },
  { zh: '查找', en: 'find' },
  { zh: '切换窗口', en: 'switch window' },
];

const RECOMMENDED_APP_IDS = ['vscode', 'figma', 'photoshop', 'chrome', 'excel', 'notion'];
const RECENT_KEY = 'keyatlas-recent-searches';

type PlatformFilter = 'all' | 'windows' | 'mac' | 'linux';

function loadRecent(): string[] {
  try {
    const raw = localStorage.getItem(RECENT_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr.slice(0, 8) : [];
  } catch { return []; }
}

function saveRecent(term: string) {
  if (!term.trim()) return;
  const cur = loadRecent().filter(x => x !== term);
  const next = [term, ...cur].slice(0, 8);
  try { localStorage.setItem(RECENT_KEY, JSON.stringify(next)); } catch {}
}

export default function SearchPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const q = (searchParams.get('q') || '').trim();

  const [data, setData] = useState<AllData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [platform, setPlatform] = useState<PlatformFilter>('all');
  const [recent, setRecent] = useState<string[]>([]);
  useLangState();
  const lang = getLang();

  // Load data once
  useEffect(() => {
    let alive = true;
    setLoading(true);
    loadData()
      .then(d => { if (alive) { setData(d); setLoading(false); } })
      .catch(err => { if (alive) { setError(err?.message || 'Failed to load data'); setLoading(false); } });
    setRecent(loadRecent());
    return () => { alive = false; };
  }, []);

  // Save search term to recent history
  useEffect(() => {
    if (q) {
      saveRecent(q);
      setRecent(loadRecent());
    }
  }, [q]);

  // Compute results reactively from q + data
  const results = useMemo(() => {
    if (!data || !q) return [];
    try {
      return search(q, data, 40);
    } catch (err) {
      console.error('Search error:', err);
      return [];
    }
  }, [q, data]);

  // Filter by platform
  const filteredResults = useMemo(() => {
    if (platform === 'all') return results;
    return results.filter(r => {
      const item = r.item as any;
      return r.type === 'shortcut' && item[platform];
    });
  }, [results, platform]);

  const recommendedApps = useMemo(() => {
    if (!data) return [];
    const byId = RECOMMENDED_APP_IDS
      .map(id => data.apps.find(a => a.id === id))
      .filter(Boolean) as AllData['apps'];
    if (byId.length < RECOMMENDED_APP_IDS.length) {
      const extra = data.apps.filter(a => a.popular && !byId.find(b => b.id === a.id));
      return [...byId, ...extra].slice(0, 6);
    }
    return byId;
  }, [data]);

  const shortcutCountFor = (appId: string) =>
    data ? data.shortcuts.filter(s => s.appId === appId).length : 0;

  const resultLabel = () => {
    const key = filteredResults.length === 1 ? 'resultForOne' : 'resultsFor';
    return t(key, { count: String(filteredResults.length) });
  };

  const platformPills: { key: PlatformFilter; label: string }[] = [
    { key: 'all', label: t('platformAll') },
    { key: 'windows', label: t('platformWindows') },
    { key: 'mac', label: t('platformMac') },
    { key: 'linux', label: t('platformLinux') },
  ];

  const renderTermChips = (terms: string[], onClear?: () => void) => (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
      {terms.map(term => (
        <button
          key={term}
          onClick={() => navigate(`/search?q=${encodeURIComponent(term)}`)}
          style={{
            padding: '7px 16px',
            borderRadius: 9999,
            border: '1px solid var(--border-color)',
            background: 'var(--surface-2-color)',
            color: 'var(--text-color)',
            fontSize: 14,
            fontWeight: 500,
            cursor: 'pointer',
            transition: 'all 0.15s ease',
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
          {term}
        </button>
      ))}
      {onClear && (
        <button
          onClick={onClear}
          style={{
            padding: '7px 12px',
            borderRadius: 9999,
            border: 'none',
            background: 'transparent',
            color: 'var(--sub-color)',
            fontSize: 13,
            fontWeight: 500,
            cursor: 'pointer',
          }}
        >
          {t('clearRecent')}
        </button>
      )}
    </div>
  );

  return (
    <div style={{ maxWidth: 1024, margin: '0 auto', padding: '32px 20px 48px' }}>
      <SearchBar defaultValue={q} autoFocus />

      {/* Loading */}
      {loading && (
        <div style={{ marginTop: 24 }}>
          <SkeletonGrid count={6} />
        </div>
      )}

      {/* Error */}
      {!loading && error && (
        <div style={{ marginTop: 64, textAlign: 'center', color: '#e5484d' }}>
          <p style={{ fontSize: 16, fontWeight: 600 }}>{t('noResults')}</p>
          <p style={{ marginTop: 4, fontSize: 13, color: 'var(--sub-color)' }}>{error}</p>
        </div>
      )}

      {/* Empty query — show recent + hot searches + recommended apps */}
      {!loading && !error && !q && (
        <div style={{ marginTop: 32 }}>
          {recent.length > 0 && (
            <section style={{ marginBottom: 32 }}>
              <h2 className="section-title">{t('recentSearches')}</h2>
              {renderTermChips(recent, () => {
                localStorage.removeItem(RECENT_KEY);
                setRecent([]);
              })}
            </section>
          )}

          <section style={{ marginBottom: 32 }}>
            <h2 className="section-title">{t('hotSearches')}</h2>
            {renderTermChips(HOT_TERMS.map(term => lang === 'zh' ? term.zh : term.en))}
          </section>

          {recommendedApps.length > 0 && (
            <section>
              <h2 className="section-title">{t('recommendedApps')}</h2>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
                gap: 12,
              }}>
                {recommendedApps.map(app => (
                  <AppCard key={app.id} app={app} shortcutCount={shortcutCountFor(app.id)} />
                ))}
              </div>
            </section>
          )}
        </div>
      )}

      {/* Results */}
      {!loading && !error && q && filteredResults.length > 0 && (
        <div style={{ marginTop: 24, display: 'flex', flexDirection: 'column', gap: 12 }}>
          {/* Platform filter */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {platformPills.map(p => {
              const active = platform === p.key;
              return (
                <button
                  key={p.key}
                  onClick={() => setPlatform(p.key)}
                  style={{
                    padding: '5px 14px',
                    borderRadius: 9999,
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all .15s ease',
                    border: active ? '1px solid transparent' : '1px solid var(--border-color)',
                    background: active ? '#6366f1' : 'var(--surface-2-color)',
                    color: active ? '#ffffff' : 'var(--sub-color)',
                  }}
                >
                  {p.label}
                </button>
              );
            })}
          </div>

          <p style={{ fontSize: 14, color: 'var(--sub-color)', marginBottom: 4 }}>
            {resultLabel()} “<strong>{q}</strong>”
          </p>
          {filteredResults.map(r => (
            r.type === 'shortcut'
              ? <ShortcutCard key={`${(r.item as any).appId}-${(r.item as any).id}`} shortcut={r.item as any} showCopy />
              : <AppCard key={(r.item as any).id} app={r.item as any} shortcutCount={shortcutCountFor((r.item as any).id)} />
          ))}
        </div>
      )}

      {/* No results — still show recommended apps as fallback */}
      {!loading && !error && q && filteredResults.length === 0 && (
        <div style={{ marginTop: 32 }}>
          <EmptyState title={t('noResults')} desc={t('tryDifferent')} />

          {recent.length > 0 && (
            <section style={{ marginBottom: 32, marginTop: 24 }}>
              <h2 className="section-title">{t('recentSearches')}</h2>
              {renderTermChips(recent, () => {
                localStorage.removeItem(RECENT_KEY);
                setRecent([]);
              })}
            </section>
          )}

          <section style={{ marginBottom: 32 }}>
            <h2 className="section-title">{t('hotSearches')}</h2>
            {renderTermChips(HOT_TERMS.map(term => lang === 'zh' ? term.zh : term.en))}
          </section>

          {recommendedApps.length > 0 && (
            <section>
              <h2 className="section-title">{t('recommendedApps')}</h2>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
                gap: 12,
              }}>
                {recommendedApps.map(app => (
                  <AppCard key={app.id} app={app} shortcutCount={shortcutCountFor(app.id)} />
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
