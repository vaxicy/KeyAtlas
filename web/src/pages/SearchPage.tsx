import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { t, useLangState } from '../i18n';
import { loadData } from '../data';
import { search } from '../search';
import SearchBar from '../components/SearchBar';
import ShortcutCard from '../components/ShortcutCard';
import AppCard from '../components/AppCard';

export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQ = searchParams.get('q') || '';
  const [q] = useState(initialQ);
  const [results, setResults] = useState<any[]>([]);
  const [data, setData] = useState<any>(null);
  useLangState(); // subscribe to re-render on language change

  useEffect(() => {
    loadData().then(d => setData(d));
  }, []);

  useEffect(() => {
    if (!data) return;
    if (!q.trim()) { setResults([]); return; }
    const r = search(q, data, 40);
    setResults(r);
  }, [q, data]);

  // Sync URL param when q changes
  useEffect(() => {
    if (q.trim()) setSearchParams({ q: q });
    else setSearchParams({});
  }, [q]);

  return (
    <div style={{ maxWidth: 1024, margin: '0 auto', padding: '32px 20px 48px' }}>
      <SearchBar defaultValue={initialQ} autoFocus />

      {!q.trim() && !initialQ ? (
        <div style={{ marginTop: 64, textAlign: 'center', color: 'var(--sub-color)' }}>
          <svg width="48" height="48" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ display: 'block', margin: '0 auto 16px', opacity: 0.3 }} viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <p style={{ fontSize: 18, fontWeight: 500 }}>{t('searchPlaceholder')}</p>
        </div>
      ) : results.length > 0 ? (
        <div style={{ marginTop: 24, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <p style={{ fontSize: 14, color: 'var(--sub-color)', marginBottom: 12 }}>
            {results.length} result{results.length !== 1 ? 's' : ''} for "<strong>{q}</strong>"
          </p>
          {results.map(r => (
            r.type === 'shortcut'
              ? <ShortcutCard key={`${r.item.appId}-${r.item.id}`} shortcut={r.item} showCopy />
              : <AppCard key={(r.item as any).id} app={r.item as any} />
          ))}
        </div>
      ) : q.trim() ? (
        <div style={{ marginTop: 64, textAlign: 'center', color: 'var(--sub-color)' }}>
          <p style={{ fontSize: 18, fontWeight: 500 }}>{t('noResults')}</p>
          <p style={{ marginTop: 4, fontSize: 14 }}>{t('tryDifferent')}</p>
        </div>
      ) : null}
    </div>
  );
}
