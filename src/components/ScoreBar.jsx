// ScoreBar.jsx — Day 2 shell (Deborah). Used 17x inside CityDetailModal.
// TODO (Day 3): real color-coding thresholds (red/amber/green) —
// this shell just uses one accent color at partial width.

function ScoreBar({ label, scoreOutOf10 }) {
  const widthPct = Math.max(0, Math.min(100, (scoreOutOf10 / 10) * 100));

  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span className="text-brand-text">{label}</span>
        <span className="text-brand-muted">{scoreOutOf10.toFixed(1)}</span>
      </div>
      <div className="h-2 rounded-pill bg-brand-border overflow-hidden">
        <div
          className="h-full bg-brand-accent"
          style={{ width: `${widthPct}%` }}
        />
      </div>
    </div>
  );
}

export default ScoreBar;