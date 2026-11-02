// ProtectedRoute.jsx — Johnson (B4, #143).
// A layout route that only lets signed-in users through. Wrap pages in it in
// main.jsx:
//
//   <Route element={<ProtectedRoute />}>
//     <Route path="/itineraries" element={...} />
//   </Route>
//
// - Signed out: sends the visitor to /login?next=<the page they wanted>.
//   LoginPage (and RegisterPage) send them back there after signing in.
// - A saved token is still being checked: shows `fallback` instead of
//   redirecting, so a signed-in user who refreshes isn't bounced to login.
// - adminOnly: signed-in users who aren't admins go to /explore instead.
//   This only hides the screen; the server's admin_required check is what
//   protects admin data.
// Browsing cities stays public: /, /explore, /login and /register are not
// wrapped. Props: see docs/prop-contracts.md.

import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { loginPathFor } from '../utils/loginPath.js';

function ProtectedRoute({ adminOnly = false, fallback = null, children }) {
  const { isLoading, isAuthenticated, isAdmin } = useAuth();
  const location = useLocation();

  if (isLoading) return fallback;
  if (!isAuthenticated) return <Navigate to={loginPathFor(location)} replace />;
  if (adminOnly && !isAdmin) return <Navigate to="/explore" replace />;

  return children ?? <Outlet />;
}

export default ProtectedRoute;
