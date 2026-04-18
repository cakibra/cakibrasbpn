export function SkeletonCard(): JSX.Element {
  return (
    <div className="server-card skeleton-card">
      <div className="skeleton skeleton--line skeleton--w-40" />
      <div className="skeleton skeleton--line skeleton--w-75" />
      <div className="skeleton skeleton--line skeleton--w-30" />
      <div className="skeleton-row">
        <div className="skeleton skeleton--pill" />
        <div className="skeleton skeleton--pill" />
        <div className="skeleton skeleton--pill" />
      </div>
    </div>
  );
}
