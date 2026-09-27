// ErrorBanner.jsx — Day 3 (For Cindy).
// Renders differently for rate-limiting (429) vs any other ApiError,
// per the quirk flagged in docs/teleport-api-notes.md.

function ErrorBanner({ error, onRetry }) {
  const isRateLimited = error?.status === 429;

  return (
    <div className="border border-brand-danger/40 bg-brand-danger/10 text-brand-text rounded-card p-4 flex items-center justify-between">
      <span className="text-sm">
        {isRateLimited
          ? "We're being rate-limited by the city data API — try again in a moment."
          : error?.message || 'Something went wrong loading city data.'}
      </span>
      {onRetry && (
        <button
          onClick={onRetry}
          className="text-sm text-brand-accent shrink-0 ml-4"
        >
          Retry
        </button>
      )}
    </div>
  );
}

export default ErrorBanner;