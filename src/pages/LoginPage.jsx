import { Link, Navigate, useLocation, useSearchParams } from 'react-router-dom';
import AuthForm from '../components/AuthForm.jsx';
import AuthShell from '../components/AuthShell.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { safeNextPath } from '../utils/safeNextPath.js';

function LoginPage() {
  const { login, isAuthenticated, sessionExpired } = useAuth();
  const [params] = useSearchParams();
  const { search } = useLocation();
  const next = safeNextPath(params.get('next'));

  // Signed in (just now, or already): go where the user was heading.
  if (isAuthenticated) return <Navigate to={next} replace />;

  return (
    <AuthShell>
      <AuthForm
        mode="login"
        onSubmit={login}
        notice={
          sessionExpired ? (
            <p
              role="status"
              className="border border-brand-warn/40 bg-brand-warn/10 text-brand-text rounded-card px-4 py-3 text-sm"
            >
              Your session expired. Please sign in again.
            </p>
          ) : null
        }
        footer={
          <p className="text-sm text-brand-muted">
            New here?{' '}
            <Link to={`/register${search}`} className="text-brand-accent hover:underline">
              Create an account
            </Link>
          </p>
        }
      />
    </AuthShell>
  );
}

export default LoginPage;