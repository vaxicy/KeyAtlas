import { useNavigate } from 'react-router-dom';
import { t, useLangState } from '../i18n';

interface Props {
  defaultValue?: string;
  size?: 'default' | 'large';
  autoFocus?: boolean;
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  background: 'var(--surface-color)',
  border: '1px solid var(--border-color)',
  borderRadius: 12,
  color: 'var(--text-color)',
  outline: 'none',
  transition: 'all 0.15s ease',
};

export default function SearchBar({ defaultValue = '', size = 'default', autoFocus }: Props) {
  const nav = useNavigate();
  useLangState(); // subscribe to re-render on language change
  const isLarge = size === 'large';

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const q = fd.get('q')?.toString().trim() || '';
    if (q) nav(`/search?q=${encodeURIComponent(q)}`);
  };

  return (
    <form onSubmit={handleSubmit} style={{ width: '100%' }}>
      <div style={isLarge ? { maxWidth: 560, margin: '0 auto', position: 'relative' } : { position: 'relative' }}>
        <svg
          style={{ position: 'absolute', left: isLarge ? 20 : 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--sub-color)', pointerEvents: 'none' }}
          width={isLarge ? 22 : 18}
          height={isLarge ? 22 : 18}
          fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
          viewBox="0 0 24 24"
        >
          <circle cx="11" cy="11" r="7"/>
          <line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
        <input
          name="q"
          type="text"
          autoComplete="off"
          spellCheck={false}
          placeholder={t('searchPlaceholder')}
          defaultValue={defaultValue}
          autoFocus={autoFocus}
          style={{
            ...inputStyle,
            paddingLeft: isLarge ? 52 : 40,
            paddingRight: 16,
            paddingTop: isLarge ? 16 : 10,
            paddingBottom: isLarge ? 16 : 10,
            fontSize: isLarge ? 16 : 14,
            fontWeight: isLarge ? 500 : 400,
            boxShadow: isLarge ? '0 4px 16px rgba(0,0,0,.08)' : undefined,
          }}
          onFocus={e => {
            e.currentTarget.style.borderColor = '#a5b4fc';
            e.currentTarget.style.boxShadow = '0 0 0 3px rgba(99,102,241,.12)';
          }}
          onBlur={e => {
            e.currentTarget.style.borderColor = 'var(--border-color)';
            e.currentTarget.style.boxShadow = isLarge ? '0 4px 16px rgba(0,0,0,.08)' : 'none';
          }}
        />
      </div>
    </form>
  );
}
