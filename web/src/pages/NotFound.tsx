import { Link } from 'react-router-dom';
import { t, useLangState } from '../i18n';
import { usePageMeta, useJsonLd } from '../seo';

export default function NotFound() {
  useLangState();
  usePageMeta(`${t('notFoundTitle')} - KeyAtlas`, t('notFoundDesc'), '/404');
  useJsonLd({
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: `${t('notFoundTitle')} - KeyAtlas`,
    description: t('notFoundDesc'),
    url: 'https://keyatlas.pages.dev/404',
    isPartOf: {
      '@type': 'WebSite',
      name: 'KeyAtlas',
      url: 'https://keyatlas.pages.dev',
    },
  });

  return (
    <main className="page-shell page-shell-padded">
      <section className="not-found-panel" aria-labelledby="not-found-title">
        <div className="not-found-mark">404</div>
        <h1 id="not-found-title">{t('notFoundTitle')}</h1>
        <p>{t('notFoundDesc')}</p>
        <div className="not-found-actions">
          <Link className="ka-primary-link" to="/search">{t('notFoundSearch')}</Link>
          <Link className="ka-secondary-link" to="/">{t('notFoundHome')}</Link>
          <Link className="ka-secondary-link" to="/category/design">{t('notFoundBrowse')}</Link>
        </div>
      </section>
    </main>
  );
}
