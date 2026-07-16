import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { t, useLangState, getLang } from '../i18n';
import { loadApps } from '../data';
import { suggestApps, type Suggestion } from '../search';
import type { App } from '../types';

interface Props {
  defaultValue?: string;
  size?: 'default' | 'large';
  autoFocus?: boolean;
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  background: 'var(--surface-color)',
  border: '1px solid var(--border-color)',
  borderRadius: 'var(--radius)',
  color: 'var(--text-color)',
  outline: 'none',
  boxShadow: 'var(--shadow)',
  transition: 'border-color .15s ease, box-shadow .15s ease',
};

export default function SearchBar({ defaultValue = '', size = 'default', autoFocus }: Props) {
  const nav = useNavigate();
  useLangState(); // subscribe to re-render on language change
  const isLarge = size === 'large';

  const [value, setValue] = useState(defaultValue);
  const [apps, setApps] = useState<App[] | null>(null);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1); // highlighted suggestion index
  const wrapRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Lazy-load the small app catalog for suggestions. Full shortcut data loads only on search pages.
  useEffect(() => {
    loadApps().then(setApps).catch(() => {});
  }, []);

  // Keep input in sync when navigating between searches (defaultValue changes)
  useEffect(() => {
    setValue(defaultValue);
  }, [defaultValue]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  const computeSuggestions = useCallback((q: string) => {
    if (!apps || !q.trim()) { setSuggestions([]); return; }
    setSuggestions(suggestApps(q, apps, 8));
  }, [apps]);

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    setValue(v);
    setActive(-1);
    setOpen(true);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => computeSuggestions(v), 180);
  };

  const goSearch = (q: string) => {
    const query = q.trim();
    if (!query) return;
    setOpen(false);
    nav(`/search?q=${encodeURIComponent(query)}`);
  };

  const pickSuggestion = (s: Suggestion) => {
    setOpen(false);
    if (s.type === 'app') {
      nav(`/apps/${s.appId}`);
    } else {
      goSearch(s.label);
    }
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!open || suggestions.length === 0) {
      if (e.key === 'Enter') { e.preventDefault(); goSearch(value); }
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive(a => (a + 1) % suggestions.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive(a => (a - 1 + suggestions.length) % suggestions.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (active >= 0 && active < suggestions.length) pickSuggestion(suggestions[active]);
      else goSearch(value);
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  };

  const lang = getLang();

  return (
    <div ref={wrapRef} style={{ width: '100%', position: 'relative', ...(isLarge ? { maxWidth: 560, margin: '0 auto' } : {}) }}>
      <form onSubmit={e => { e.preventDefault(); goSearch(value); }} style={{ width: '100%' }}>
        <div style={{ position: 'relative' }}>
          <svg
            style={{ position: 'absolute', left: isLarge ? 20 : 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--sub-color)', pointerEvents: 'none' }}
            width={isLarge ? 22 : 18}
            height={isLarge ? 22 : 18}
            fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
            viewBox="0 0 24 24"
          >
            <circle cx="11" cy="11" r="7" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            name="q"
            type="text"
            autoComplete="off"
            spellCheck={false}
            role="combobox"
            aria-expanded={open && suggestions.length > 0}
            aria-controls="search-suggest-list"
            aria-autocomplete="list"
            placeholder={t('searchPlaceholder')}
            value={value}
            autoFocus={autoFocus}
            onChange={onChange}
            onKeyDown={onKeyDown}
            onFocus={e => {
              e.currentTarget.style.borderColor = '#a5b4fc';
              e.currentTarget.style.boxShadow = '0 0 0 3px rgba(99,102,241,.12)';
              if (value.trim()) { computeSuggestions(value); setOpen(true); }
            }}
            onBlur={e => {
              e.currentTarget.style.borderColor = 'var(--border-color)';
              e.currentTarget.style.boxShadow = 'var(--shadow)';
            }}
            style={{
              ...inputStyle,
              paddingLeft: isLarge ? 52 : 40,
              paddingRight: 16,
              paddingTop: isLarge ? 16 : 10,
              paddingBottom: isLarge ? 16 : 10,
              fontSize: isLarge ? 16 : 14,
              fontWeight: isLarge ? 500 : 400,
            }}
          />
        </div>
      </form>

      {/* Suggestions dropdown */}
      {open && suggestions.length > 0 && (
        <ul
          id="search-suggest-list"
          role="listbox"
          style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            left: 0,
            right: 0,
            margin: 0,
            padding: 6,
            listStyle: 'none',
            background: 'var(--surface-color)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius)',
            boxShadow: 'var(--shadow-lg)',
            zIndex: 50,
            maxHeight: 360,
            overflowY: 'auto',
          }}
        >
          {suggestions.map((s, i) => (
            <li
              key={`${s.type}-${s.appId}-${s.label}-${i}`}
              role="option"
              aria-selected={i === active}
              onMouseDown={e => { e.preventDefault(); pickSuggestion(s); }}
              onMouseEnter={() => setActive(i)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '9px 12px',
                borderRadius: 8,
                cursor: 'pointer',
                background: i === active ? 'var(--surface-2-color)' : 'transparent',
                transition: 'background 0.1s',
              }}
            >
              <span style={{
                flexShrink: 0,
                width: 22,
                height: 22,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--sub-color)',
              }}>
                {s.type === 'app' ? (
                  <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /></svg>
                ) : (
                  <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><circle cx="11" cy="11" r="7" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
                )}
              </span>
              <span style={{
                flex: 1,
                minWidth: 0,
                fontSize: 14,
                fontWeight: 500,
                color: 'var(--text-color)',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}>
                {s.label}
              </span>
              {s.type === 'app' ? (
                <span style={{
                  flexShrink: 0,
                  fontSize: 11,
                  fontWeight: 600,
                  color: '#4f46e5',
                  background: '#eef2ff',
                  padding: '2px 8px',
                  borderRadius: 9999,
                }}>
                  {lang === 'zh' ? '应用' : 'App'}
                </span>
              ) : s.sub && (
                <span style={{
                  flexShrink: 0,
                  fontSize: 12,
                  color: 'var(--sub-color)',
                  maxWidth: 120,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}>
                  {s.sub}
                </span>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
