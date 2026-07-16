interface Props {
  keys: string[];
  onCopy?: () => void;
}

export default function KeyBadge({ keys, onCopy }: Props) {
  if (!keys.length || !keys[0]) {
    return (
      <span className="kbd-badge" style={{
        '--key-bg': 'var(--surface-2-color)',
        '--key-border': 'var(--border-color)',
        '--key-text': 'var(--sub-color)',
        borderStyle: 'dashed',
      } as React.CSSProperties}>
        -
      </span>
    );
  }

  return (
    <div
      style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 2, cursor: onCopy ? 'copy' : undefined }}
      onClick={onCopy}
    >
      {keys.map((key, index) => (
        <span key={`${key}-${index}`} className="kbd-badge">{key}</span>
      ))}
    </div>
  );
}
