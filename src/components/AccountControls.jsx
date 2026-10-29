// AccountControls.jsx — the right-hand end of the app header.
//
// Props:
//   isLoading        a saved token is still being checked with the server
//   isAuthenticated  the server confirmed who is signed in
//   email            the signed-in user's email ('' when nobody is)
//   onSignOut        () => void

import { Link } from 'react-router-dom';

function AccountControls({ isLoading, isAuthenticated, email, onSignOut }) {
  if (isLoading) {
    // A placeholder, not a spinner: the page stays usable while we wait.
    return (
      <span
        role="status"
        className="inline-block h-9 w-20 rounded-pill bg-brand-surface animate-pulse"
      >
        <span className="sr-only">Checking your session</span>
      </span>
    );
  }

  if (isAuthenticated) {
    return (
      <div className="flex items-center gap-3">
        <span
          title={email}
          className="hidden sm:inline max-w-[12rem] truncate text-sm text-brand-muted"
        >
          {email}
        </span>
        <button
          type="button"
          onClick={onSignOut}
          aria-label={`Sign out ${email}`}
          className="px-5 py-2 rounded-pill border border-brand-border text-brand-text text-sm hover:border-brand-accent transition-colors"
        >
          Sign out
        </button>
      </div>
    );
  }

  return (
    <Link
      to="/login"
      className="px-5 py-2 rounded-pill bg-brand-accent text-brand-bg font-medium hover:opacity-90 transition-opacity"
    >
      Log in
    </Link>
  );
}

export default AccountControls;