import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { t, getCategoryName, useLangState } from '../i18n';
import { loadApps, getAppsByCategory } from '../data';
import AppCard from '../components/AppCard';
import { SkeletonGrid } from '../components/Skeleton';
import type { App } from '../types';
import { usePageMeta } from '../seo';

export default function CategoryPage() {
  const { categoryId } = useParams<{ categoryId: string }>();
  const navigate = useNavigate();
  const [allApps, setAllApps] = useState<App[] | null>(null);
  useLangState(); // subscribe to re-render on language change
  const catName = categoryId ? getCategoryName(categoryId) : t('popularCategories');
  usePageMeta(
    t('metaCategoryTitle', { category: catName }),
    t('metaCategoryDesc', { category: catName }),
    categoryId ? `/category/${categoryId}` : '/'
  );

  useEffect(() => { loadApps().then(setAllApps); }, []);

  if (!allApps) return (
    <div className="page-shell page-shell-padded">
      <SkeletonGrid count={6} />
    </div>
  );

  const apps = getAppsByCategory({ apps: allApps }, categoryId!);
  return (
    <div className="page-shell page-shell-padded">
      {/* Back button */}
      <button className="ka-back" onClick={() => navigate(-1)} style={{ marginBottom: 20 }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="15 18 9 12 15 6" />
        </svg>
        {t('back')}
      </button>

      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 'clamp(1.5rem, 3vw, 1.9rem)', fontWeight: 800, letterSpacing: '-0.02em' }}>{catName}</h1>
        <p style={{ marginTop: 4, color: 'var(--sub-color)' }}>{apps.length} apps</p>
      </div>

      <div className="ka-fluid-grid">
        {apps.map(app => (
          <AppCard key={app.id} app={app}
            shortcutCount={app.shortcutCount || 0} />
        ))}
      </div>

      {apps.length === 0 && (
        <div style={{ textAlign: 'center', padding: '64px 0', color: 'var(--sub-color)' }}>
          <p>{t('noResults')}</p>
        </div>
      )}
    </div>
  );
}
