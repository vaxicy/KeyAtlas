import { useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { t, useLangState } from '../i18n';
import { useToast } from './Toast';
import KeyBadge from './KeyBadge';
import type { Shortcut as ShortcutType } from '../types';

interface Props {
  shortcut: ShortcutType;
  appName?: string;
  showCopy?: boolean;
  platform?: 'windows' | 'mac' | 'linux';
}

function parseKeys(raw?: string | null): string[] {
  if (!raw) return [];
  return raw.split(/\s*\+\s*/).map(k => k.trim()).filter(Boolean);
}

const cardStyle: React.CSSProperties = {
  background: 'var(--surface-color)',
  border: '1px solid var(--border-color)',
  borderRadius: 12,
  padding: 16,
  cursor: 'pointer',
  transition: 'box-shadow 0.2s ease, border-color 0.2s ease',
  outline: 'none',
};
/* ── Copy button (no tooltip — Toast handles feedback) ── */
function CopyButton({ copied, onCopy }: { copied: boolean; onCopy: (e?: React.MouseEvent) => void }) {
  return (
    <button
      className="sc-copy-btn"
      onClick={onCopy}
      style={{
        flexShrink: 0,
        width: 34,
        height: 34,
        borderRadius: 8,
        border: 'none',
        background: copied ? '#ecfdf5' : 'transparent',
        color: copied ? '#059669' : 'var(--sub-color)',
        cursor: 'pointer',
        opacity: 0.7,
        transition: 'opacity 0.15s ease',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
      aria-label={t('copy')}
    >
      {copied ? (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
      ) : (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>
      )}
    </button>
  );
}

export default function ShortcutCard({ shortcut, appName, showCopy = true, platform }: Props) {
  const [copied, setCopied] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [lang] = useLangState();
  const showToast = useToast();

  const winKeys = parseKeys(shortcut.windows);
  const macKeys = parseKeys(shortcut.mac);
  const linuxKeys = parseKeys(shortcut.linux);

  const handleCopy = useCallback(async (e?: React.MouseEvent) => {
    e?.stopPropagation();
    const text = winKeys.join(' + ') || macKeys.join(' + ');
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      showToast(t('toastCopied', { keys: text }));
      setTimeout(() => setCopied(false), 1500);
    } catch { /* ignore */ }
  }, [winKeys, macKeys, showToast]);

  const displayKeys =
    platform === 'mac' ? macKeys
    : platform === 'linux' ? linuxKeys
    : platform === 'windows' ? winKeys
    : (winKeys.length > 0 ? winKeys : macKeys);
  const name = lang === 'zh' && shortcut.name?.zh ? shortcut.name.zh : shortcut.name.en;
  const desc = lang === 'zh' && shortcut.description?.zh ? shortcut.description.zh : shortcut.description.en;
  const isOfficial = (shortcut as any).source === 'official';

  const platformRows = [
    { label: t('platformWindows'), keys: winKeys },
    { label: t('platformMac'), keys: macKeys },
    { label: t('platformLinux'), keys: linuxKeys },
  ].filter(r => r.keys.length > 0);

  return (
    <div
      className="shortcut-card"
      style={cardStyle}
      role="button"
      aria-label={t('copy') + ': ' + name}
      onClick={() => setExpanded(v => !v)}
      onKeyDown={e => {
        if (e.key === 'Enter') { e.preventDefault(); handleCopy(); }
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
        {/* Left: info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <h3 style={{
              fontWeight: 600,
              color: 'var(--text-color)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}>
              {name}
            </h3>
            {appName && (
              <Link to={`/apps/${shortcut.appId}`}
                onClick={e => e.stopPropagation()}
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  padding: '2px 8px',
                  borderRadius: 6,
                  background: 'var(--surface-2-color)',
                  color: 'var(--sub-color)',
                  textDecoration: 'none',
                  whiteSpace: 'nowrap',
                  flexShrink: 0,
                }}
                onMouseEnter={e => (e.currentTarget.style.color = '#4f46e5')}
                onMouseLeave={e => (e.currentTarget.style.color = 'var(--sub-color)')}
              >
                {appName}
              </Link>
            )}
          </div>
          <p style={{
            fontSize: 14,
            color: 'var(--sub-color)',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}>
            {desc}
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
            <span style={{
              fontSize: 10,
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              padding: '2px 8px',
              borderRadius: 6,
              background: isOfficial ? '#eef2ff' : '#f1f3f5',
              color: isOfficial ? '#4338ca' : 'var(--sub-color)',
            }}>
              {isOfficial ? t('sourceOfficial') : t('sourceCommunity')}
            </span>
          </div>
        </div>

        {/* Right: keys + copy */}
        <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ overflow: 'hidden', maxWidth: 'min(50vw, 420px)', display: 'flex', justifyContent: 'flex-end' }}>
            <KeyBadge keys={displayKeys} onCopy={showCopy ? handleCopy : undefined} />
          </div>
          {showCopy && (
            <CopyButton copied={copied} onCopy={handleCopy} />
          )}
        </div>
      </div>

      {/* Expanded: all-platform comparison */}
      {expanded && platformRows.length > 0 && (
        <div style={{ marginTop: 14 }}>
          {platformRows.map(row => (
            <div key={row.label} className="ka-compare-row">
              <span className="ka-compare-label">{row.label}</span>
              <KeyBadge keys={row.keys} onCopy={showCopy ? handleCopy : undefined} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
