import { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { t, useLangState, getLang } from '../i18n';
import { loadData } from '../data';
import { search } from '../search';
import type { AllData } from '../types';
import SearchBar from '../components/SearchBar';
import ShortcutCard from '../components/ShortcutCard';
import AppCard from '../components/AppCard';

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

export default function SearchPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const q = (searchParams.get('q') || '').trim();

  const [data, setData] = useState<AllData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  useLangState();
  const lang = getLang();

  // Load data once
  useEffect(() => {
    let alive = true;
    setLoading(true);
    loadData()
      .then(d => { if (alive) { setData(d); setLoading(false); } })
      .catch(err => { if (alive) { setError(err?.message || 'Failed to load data'); setLoading(false); } });
    return () => { alive = false; };
  }, []);

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

  const recommendedApps = useMemo(() => {
    if (!data) return [];
    const byId = RECOMMENDED_APP_IDS
      .map(id => data.apps.find(a => a.id === id))
      .filter(Boolean) as AllData['apps'];
    // Fallback: fill with popular apps if some ids missing
    if (byId.length < RECOMMENDED_APP_IDS.length) {
      const extra = data.apps.filter(a => a.popular && !byId.find(b => b.id === a.id));
      return [...byId, ...extra].slice(0, 6);
    }
    return byId;
  }, [data]);

  const shortcutCountFor = (appId: string) =>
    data ? data.shortcuts.filter(s => s.appId === appId).length : 0;

  const resultLabel = () => {
    const key = results.length === 1 ? 'resultForOne' : 'resultsFor';
    return t(key, { count: String(results.length) });
  };

  return (
    <div style={{ maxWidth: 1024, margin: '0 auto', padding: '32px 20px 48px' }}>
      <SearchBar defaultValue={q} autoFocus />

      {/* Loading */}
      {loading && (
        <div style={{ marginTop: 64, textAlign: 'center', color: 'var(--sub-color)' }}>
          <p style={{ fontSize: 16 }}>{t('loading')}</p>
        </div>
      )}

      {/* Error */}
      {!loading && error && (
        <div style={{ marginTop: 64, textAlign: 'center', color: '#e5484d' }}>
          <p style={{ fontSize: 16, fontWeight: 600 }}>{t('noResults')}</p>
          <p style={{ marginTop: 4, fontSize: 13, color: 'var(--sub-color)' }}>{error}</p>
        </div>
      )}

      {/* Empty query — show hot searches + recommended apps */}
      {!loading && !error && !q && (
        <div style={{ marginTop: 32 }}>
          <section style={{ marginBottom: 32 }}>
            <h2 className="section-title">{t('hotSearches')}</h2>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {HOT_TERMS.map(term => {
                const label = lang === 'zh' ? term.zh : term.en;
                return (
                  <button
                    key={term.en}
                    onClick={() => navigate(`/search?q=${encodeURIComponent(label)}`)}
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
                    {label}
                  </button>
                );
              })}
            </div>
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
      {!loading && !error && q && results.length > 0 && (
        <div style={{ marginTop: 24, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <p style={{ fontSize: 14, color: 'var(--sub-color)', marginBottom: 12 }}>
            {resultLabel()} “<strong>{q}</strong>”
          </p>
          {results.map(r => (
            r.type === 'shortcut'
              ? <ShortcutCard key={`${(r.item as any).appId}-${(r.item as any).id}`} shortcut={r.item as any} showCopy />
              : <AppCard key={(r.item as any).id} app={r.item as any} shortcutCount={shortcutCountFor((r.item as any).id)} />
          ))}
        </div>
      )}

      {/* No results — still show recommended apps as fallback */}
      {!loading && !error && q && results.length === 0 && (
        <div style={{ marginTop: 32 }}>
          <div style={{ textAlign: 'center', color: 'var(--sub-color)', marginBottom: 32 }}>
            <p style={{ fontSize: 18, fontWeight: 500 }}>{t('noResults')}</p>
            <p style={{ marginTop: 4, fontSize: 14 }}>{t('tryDifferent')}</p>
          </div>

          <section style={{ marginBottom: 32 }}>
            <h2 className="section-title">{t('hotSearches')}</h2>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {HOT_TERMS.map(term => {
                const label = lang === 'zh' ? term.zh : term.en;
                return (
                  <button
                    key={term.en}
                    onClick={() => navigate(`/search?q=${encodeURIComponent(label)}`)}
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
                    {label}
                  </button>
                );
              })}
            </div>
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
