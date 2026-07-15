import { Outlet } from 'react-router-dom';
import Header from './Header';

export default function Layout() {
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
        <div style={{ maxWidth: 1024, margin: '0 auto', padding: '0 20px', textAlign: 'center' }}>
          <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-color)' }}>KeyAtlas</p>
          <p style={{ fontSize: 13, color: 'var(--sub-color)', marginTop: 4 }}>
            Shortcut Search Engine — Built for efficiency enthusiasts.
          </p>
        </div>
      </footer>
    </div>
  );
}
