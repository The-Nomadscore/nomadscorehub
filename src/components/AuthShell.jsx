// AuthShell.jsx — the page frame around the login and register forms.
import { Link } from 'react-router-dom';

function AuthShell({ children }) {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="flex items-center justify-between border-b border-brand-border px-6 py-4">
        <Link
          to="/"
          className="font-display text-2xl text-brand-text focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-accent"
        >
          NomadScore
        </Link>
        <Link
          to="/explore"
          className="text-sm text-brand-muted hover:text-brand-text transition-colors"
        >
          Browse cities
        </Link>
      </header>
      <main className="flex-1 flex items-start sm:items-center justify-center px-6 py-10">
        {children}
      </main>
    </div>
  );
}

export default AuthShell;