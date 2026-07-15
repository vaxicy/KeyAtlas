export function SkeletonCard() {
  return (
    <div className="ka-skeleton-card">
      <div style={{ display: 'flex', gap: 12 }}>
        <div className="ka-skeleton" style={{ width: 120, height: 20 }} />
        <div className="ka-skeleton" style={{ width: 56, height: 18, marginLeft: 'auto' }} />
      </div>
      <div className="ka-skeleton" style={{ width: '90%', height: 14, marginTop: 12 }} />
      <div className="ka-skeleton" style={{ width: '60%', height: 14, marginTop: 8 }} />
      <div className="ka-skeleton" style={{ width: 70, height: 16, marginTop: 12, borderRadius: 6 }} />
    </div>
  );
}

export function SkeletonGrid({ count = 6 }: { count?: number }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {Array.from({ length: count }).map((_, i) => <SkeletonCard key={i} />)}
    </div>
  );
}
