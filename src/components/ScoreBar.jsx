// ScoreBar.jsx — Day 3 (Deborah). Used 17x inside CityDetailModal.
// Color-coded by score: red < 4, yellow 4 to 6.9, green >= 7.
// Missing/invalid scores render as "N/A" with an empty bar.

const COLORS = {
  red: '#ef4444',
  yellow: '#eab308',
  green: '#22c55e',
};

function getBarColor(score) {
  if (score < 4) return COLORS.red;
  if (score < 7) return COLORS.yellow;
  return COLORS.green;
}

function ScoreBar({ label, scoreOutOf10 }) {
  const hasScore =
    typeof scoreOutOf10 === 'number' && !Number.isNaN(scoreOutOf10);

  const widthPct = hasScore
    ? Math.max(0, Math.min(100, (scoreOutOf10 / 10) * 100))
    : 0;

  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span className="text-brand-text">{label}</span>
        <span className="text-brand-muted">
          {hasScore ? scoreOutOf10.toFixed(1) : 'N/A'}
        </span>
      </div>
      <div className="h-2 rounded-pill bg-brand-border overflow-hidden">
        <div
          className="h-full"
          style={{
            width: `${widthPct}%`,
            backgroundColor: hasScore ? getBarColor(scoreOutOf10) : 'transparent',
          }}
        />
      </div>
    </div>
  );
}

export default ScoreBar;