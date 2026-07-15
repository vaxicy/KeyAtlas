interface Props {
  title: string;
  desc?: string;
}

export default function EmptyState({ title, desc }: Props) {
  return (
    <div className="ka-empty">
      <svg width="72" height="72" viewBox="0 0 24 24" fill="none" stroke="var(--border-color)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="7" />
        <line x1="21" y1="21" x2="16.65" y2="16.65" />
        <line x1="8" y1="11" x2="14" y2="11" />
      </svg>
      <p>{title}</p>
      {desc && <p>{desc}</p>}
    </div>
  );
}
