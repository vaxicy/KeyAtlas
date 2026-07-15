interface Props {
  keys: string[];
  onCopy?: () => void;
}

export default function KeyBadge({ keys, onCopy }: Props) {
  if (!keys.length || !keys[0]) {
    return (
      <span className="kbd-badge"
        style={{ '--key-bg': 'var(--surface-2-color)', '--key-border': 'var(--border-color)', '--key-text': 'var(--sub-color)', borderStyle: 'dashed' } as React.CSSProperties}>
        —
      </span>
    );
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 2 }} onClick={onCopy}>
      {keys.map((k, i) => (
        <span key={i} className="kbd-badge">{k}</span>
      ))}
    </div>
  );
}
