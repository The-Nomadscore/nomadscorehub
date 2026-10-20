// ItinerarySkeleton.jsx — placeholder cards shown while itineraries load.
// Same grid and card shape as ItineraryList / ItineraryCard so the page
// doesn't jump when the real data arrives.

function SkeletonCard() {
  return (
    <div className="bg-brand-surface border border-brand-border rounded-card p-6 flex flex-col gap-3 animate-pulse">
      <div className="space-y-2">
        <div className="h-6 w-3/4 rounded bg-brand-border" />
        <div className="h-4 w-1/2 rounded bg-brand-border" />
      </div>
      <div className="h-7 w-48 rounded-pill bg-brand-border" />
      <div className="h-4 w-full rounded bg-brand-border" />
      <div className="flex gap-4 pt-2 mt-auto">
        <div className="h-4 w-10 rounded bg-brand-border" />
        <div className="h-4 w-14 rounded bg-brand-border" />
      </div>
    </div>
  );
}

function ItinerarySkeleton() {
  return (
    <section className="space-y-6" aria-busy="true" aria-label="Loading itineraries">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-2xl text-brand-text">Itineraries</h2>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>
    </section>
  );
}

export default ItinerarySkeleton;