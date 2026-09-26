// App.jsx — Day 1 skeleton only.
// Layout regions are placeholders so the repo runs end-to-end from commit 1.
// Each region below is claimed by a Day 2 ticket — see docs/prop-contracts.md
// for the exact props each slot will receive.

function App() {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="flex items-center justify-between border-b border-brand-border px-6 py-4">
        <h1 className="font-display text-2xl text-brand-text">NomadScore</h1>
        <button className="px-5 py-2 rounded-pill bg-brand-accent text-brand-bg font-medium">
          Log in
        </button>
      </header>

      <main className="flex-1 px-6 py-8 space-y-6">
        {/* Day 2 — Engineer B: <SearchBar /> + filter sliders */}
        <section className="border border-dashed border-brand-border rounded-card p-6 text-brand-muted">
          Search &amp; filter region (Engineer B, Day 2)
        </section>

        {/* Day 2 — Engineer B: <CityGrid /> */}
        <section className="border border-dashed border-brand-border rounded-card p-6 text-brand-muted">
          City grid region (Engineer B, Day 2)
        </section>
      </main>

      {/* Day 2 — Engineer C: shortlist drawer, likely fixed/slide-over */}
      <div className="border-t border-brand-border px-6 py-3 text-brand-muted text-sm">
        Shortlist drawer (Engineer C, Day 2)
      </div>

      {/* Day 2 — Engineer D: city detail modal, rendered conditionally */}
      {/* Day 2 — Engineer E: comparison drawer, rendered conditionally */}
    </div>
  );
}

export default App;