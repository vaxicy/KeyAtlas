import { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { t, useLangState, getLang } from '../i18n';
import { loadSearchData } from '../data';
import { search } from '../search';
import type { AllData } from '../types';
import SearchBar from '../components/SearchBar';
import ShortcutCard from '../components/ShortcutCard';
import AppCard from '../components/AppCard';
import { SkeletonGrid } from '../components/Skeleton';
import EmptyState from '../components/EmptyState';
import { useJsonLd, usePageMeta } from '../seo';

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
  } catch {
    return [];
  }
}

function saveRecent(term: string) {
  if (!term.trim()) return;
  const current = loadRecent().filter(item => item !== term);
  try {
    localStorage.setItem(RECENT_KEY, JSON.stringify([term, ...current].slice(0, 8)));
  } catch {}
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

  usePageMeta(
    q ? `${q} - ${t('navSearch')} - KeyAtlas` : `${t('navSearch')} - KeyAtlas`,
    t('metaHomeDesc'),
    q ? `/search?q=${encodeURIComponent(q)}` : '/search'
  );
  useJsonLd({
    '@context': 'https://schema.org',
    '@type': 'SearchResultsPage',
    name: q ? `${q} - ${t('navSearch')} - KeyAtlas` : `${t('navSearch')} - KeyAtlas`,
    description: t('metaHomeDesc'),
    url: q ? `https://keyatlas.pages.dev/search?q=${encodeURIComponent(q)}` : 'https://keyatlas.pages.dev/search',
    isPartOf: {
      '@type': 'WebSite',
      name: 'KeyAtlas',
      url: 'https://keyatlas.pages.dev',
    },
  });

  useEffect(() => {
    let alive = true;
    setLoading(true);
    loadSearchData()
      .then(result => { if (alive) { setData(result); setLoading(false); } })
      .catch(err => { if (alive) { setError(err?.message || 'Failed to load data'); setLoading(false); } });
    setRecent(loadRecent());
    return () => { alive = false; };
  }, []);

  useEffect(() => {
    if (!q) return;
    saveRecent(q);
    setRecent(loadRecent());
  }, [q]);

  const results = useMemo(() => {
    if (!data || !q) return [];
    try {
      return search(q, data, 40);
    } catch {
      return [];
    }
  }, [q, data]);

  const filteredResults = useMemo(() => {
    if (platform === 'all') return results;
    return results.filter(result => result.type === 'shortcut' && (result.item as any)[platform]);
  }, [results, platform]);

  const recommendedApps = useMemo(() => {
    if (!data) return [];
    const byId = RECOMMENDED_APP_IDS
      .map(id => data.apps.find(app => app.id === id))
      .filter(Boolean) as AllData['apps'];
    if (byId.length >= RECOMMENDED_APP_IDS.length) return byId;
    const extra = data.apps.filter(app => app.popular && !byId.find(item => item.id === app.id));
    return [...byId, ...extra].slice(0, 6);
  }, [data]);

  const shortcutCountFor = (appId: string) =>
    data?.apps.find(app => app.id === appId)?.shortcutCount || 0;

  const platformPills: { key: PlatformFilter; label: string }[] = [
    { key: 'all', label: t('platformAll') },
    { key: 'windows', label: t('platformWindows') },
    { key: 'mac', label: t('platformMac') },
    { key: 'linux', label: t('platformLinux') },
  ];

  const renderTermChips = (terms: string[], onClear?: () => void) => (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
      {terms.map(term => (
        <button key={term} onClick={() => navigate(`/search?q=${encodeURIComponent(term)}`)} className="ka-chip">
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
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          {t('clearRecent')}
        </button>
      )}
    </div>
  );

  const renderRecommended = () => recommendedApps.length > 0 && (
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
  );

  return (
    <div className="page-shell page-shell-padded">
      <SearchBar defaultValue={q} autoFocus />

      {loading && (
        <div style={{ marginTop: 24 }}>
          <SkeletonGrid count={6} />
        </div>
      )}

      {!loading && error && (
        <div style={{ marginTop: 64, textAlign: 'center', color: '#e5484d' }}>
          <p style={{ fontSize: 16, fontWeight: 600 }}>{t('noResults')}</p>
          <p style={{ marginTop: 4, fontSize: 13, color: 'var(--sub-color)' }}>{error}</p>
        </div>
      )}

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
          {renderRecommended()}
        </div>
      )}

      {!loading && !error && q && filteredResults.length > 0 && (
        <div style={{ marginTop: 24, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div className="ka-segmented" style={{ alignSelf: 'flex-start' }}>
            {platformPills.map(item => (
              <button
                key={item.key}
                onClick={() => setPlatform(item.key)}
                className={`ka-segmented-btn${platform === item.key ? ' active' : ''}`}
              >
                {item.label}
              </button>
            ))}
          </div>
          <p style={{ fontSize: 14, color: 'var(--sub-color)', marginBottom: 4 }}>
            {t(filteredResults.length === 1 ? 'resultForOne' : 'resultsFor', { count: String(filteredResults.length) })} <strong>{q}</strong>
          </p>
          {filteredResults.map(result => (
            result.type === 'shortcut'
              ? <ShortcutCard key={`${(result.item as any).appId}-${(result.item as any).id}`} shortcut={result.item as any} showCopy query={q} />
              : <AppCard key={(result.item as any).id} app={result.item as any} shortcutCount={shortcutCountFor((result.item as any).id)} />
          ))}
        </div>
      )}

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
          {renderRecommended()}
        </div>
      )}
    </div>
  );
}
