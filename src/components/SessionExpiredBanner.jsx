// SessionExpiredBanner.jsx — shown when the server rejected the saved login
// while the user was using the app. Props: onDismiss () => void.

import { Link } from 'react-router-dom';

function SessionExpiredBanner({ onDismiss }) {
  return (
    <div
      role="status"
      className="border border-brand-warn/40 bg-brand-warn/10 text-brand-text rounded-card p-4 flex items-center justify-between gap-4"
    >
      <span className="text-sm">
        Your session expired.{' '}
        <Link to="/login" className="text-brand-accent hover:underline">
          Sign in again
        </Link>{' '}
        to continue.
      </span>
      <button
        type="button"
        onClick={onDismiss}
        className="text-sm text-brand-muted hover:text-brand-text shrink-0"
      >
        Dismiss
      </button>
    </div>
  );
}

export default SessionExpiredBanner;