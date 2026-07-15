import { useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { t, useLangState } from '../i18n';
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
  cursor: 'default',
  transition: 'all 0.2s ease',
};
const cardHoverStyle: React.CSSProperties = {
  boxShadow: '0 4px 12px rgba(0,0,0,.08)',
  borderColor: '#c7d2fe',
};

export default function ShortcutCard({ shortcut, appName, showCopy = true, platform }: Props) {
  const [copied, setCopied] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [lang] = useLangState();
  const winKeys = parseKeys(shortcut.windows);
  const macKeys = parseKeys(shortcut.mac);
  const linuxKeys = parseKeys(shortcut.linux);

  const handleCopy = useCallback(async () => {
    const text = winKeys.join(' + ') || macKeys.join(' + ');
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }, [winKeys, macKeys]);

  const displayKeys =
    platform === 'mac' ? macKeys
    : platform === 'linux' ? linuxKeys
    : platform === 'windows' ? winKeys
    : (winKeys.length > 0 ? winKeys : macKeys);
  const name = lang === 'zh' && shortcut.name?.zh ? shortcut.name.zh : shortcut.name.en;
  const desc = lang === 'zh' && shortcut.description?.zh ? shortcut.description.zh : shortcut.description.en;
  const isOfficial = (shortcut as any).source === 'official';

  return (
    <div
      style={hovered ? { ...cardStyle, ...cardHoverStyle } : cardStyle}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
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

        {/* Right: keys */}
        <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
          <div style={{ minWidth: 0, maxWidth: 'min(60vw, 480px)', display: 'flex', justifyContent: 'flex-end' }}>
            <KeyBadge keys={displayKeys} onCopy={showCopy ? handleCopy : undefined} />
          </div>
          {showCopy && (
            <button
              onClick={handleCopy}
              title={copied ? t('copied') : t('copy')}
              style={{
                flexShrink: 0,
                padding: 8,
                borderRadius: 8,
                border: 'none',
                background: 'transparent',
                color: 'var(--sub-color)',
                cursor: 'pointer',
                opacity: hovered ? 1 : 0,
                transition: 'all 0.15s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              aria-label={t('copy')}
            >
              {copied ? (
                <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
              ) : (
                <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
