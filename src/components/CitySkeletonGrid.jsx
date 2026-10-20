// CitySkeletonGrid.jsx — Day 3 (Cindy).
// Same grid dimensions as CityGrid so layout doesn't jump when real data arrives.

function CitySkeletonGrid({ count = 3 }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-7">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="aspect-[4/5] rounded-card bg-brand-surface animate-pulse"
        />
      ))}
    </div>
  );
}

export default CitySkeletonGrid;