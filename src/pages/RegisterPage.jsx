import { Link, Navigate, useLocation, useSearchParams } from 'react-router-dom';
import AuthForm from '../components/AuthForm.jsx';
import AuthShell from '../components/AuthShell.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { safeNextPath } from '../utils/safeNextPath.js';

function RegisterPage() {
  const { register, isAuthenticated } = useAuth();
  const [params] = useSearchParams();
  const { search } = useLocation();
  const next = safeNextPath(params.get('next'));

  if (isAuthenticated) return <Navigate to={next} replace />;

  return (
    <AuthShell>
      <AuthForm
        mode="register"
        onSubmit={register}
        footer={
          <p className="text-sm text-brand-muted">
            Already have an account?{' '}
            <Link to={`/login${search}`} className="text-brand-accent hover:underline">
              Sign in
            </Link>
          </p>
        }
      />
    </AuthShell>
  );
}

export default RegisterPage;