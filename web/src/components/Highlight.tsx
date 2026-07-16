function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

interface Props {
  text?: string | null;
  query?: string;
}

export default function Highlight({ text, query }: Props) {
  const value = text || '';
  const q = (query || '').trim();
  if (!q) return <>{value}</>;

  const parts = value.split(new RegExp(`(${escapeRegExp(q)})`, 'ig'));
  return (
    <>
      {parts.map((part, index) => (
        part.toLowerCase() === q.toLowerCase()
          ? <mark key={index} className="ka-highlight">{part}</mark>
          : <span key={index}>{part}</span>
      ))}
    </>
  );
}
