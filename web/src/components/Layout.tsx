import { Outlet } from 'react-router-dom';
import Header from './Header';
import { t, useLangState } from '../i18n';

export default function Layout() {
  useLangState();
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg-color)' }}>
      <Header />
      <main style={{ flex: 1 }}>
        <Outlet />
      </main>
      {/* Footer */}
      <footer style={{
        borderTop: '1px solid var(--border-color)',
        padding: '32px 0',
        marginTop: 'auto',
      }}>
        <div className="page-shell" style={{ textAlign: 'center' }}>
          <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-color)' }}>{t('appName')}</p>
          <p style={{ fontSize: 13, color: 'var(--sub-color)', marginTop: 4 }}>
            {t('footerBuiltWith')}
          </p>
          <p style={{ fontSize: 13, color: 'var(--sub-color)', marginTop: 10 }}>
            <a
              href="mailto:huangzero2004@gmail.com?subject=KeyAtlas%20feedback"
              style={{ color: 'var(--primary-strong-color)', fontWeight: 700, textDecoration: 'none' }}
            >
              Report missing shortcut / Suggest an app
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}
