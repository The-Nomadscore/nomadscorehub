import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  fetchMe,
  hasStoredToken,
  login as apiLogin,
  register as apiRegister,
  onAuthExpired,
  signOut,
} from '../services/api.js';

const AuthContext = createContext(null);

// status: 'loading'       a saved token is being checked with the server
//         'guest'         nobody is signed in (browsing is public)
//         'authenticated' the server confirmed the token
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [status, setStatus] = useState(() => (hasStoredToken() ? 'loading' : 'guest'));
  const [sessionExpired, setSessionExpired] = useState(false);

  // api.js tells us when the server rejects the saved token (expired or
  // invalid). It has already deleted the token, so we only update the screen.
  // Declared before the check below so it is listening before any reply arrives.
  useEffect(
    () =>
      onAuthExpired(() => {
        setUser(null);
        setStatus('guest');
        setSessionExpired(true);
      }),
    []
  );

  // On page load: if a token is saved, ask the server who it belongs to.
  useEffect(() => {
    if (!hasStoredToken()) return undefined;
    let cancelled = false;
    fetchMe()
      .then((me) => {
        if (cancelled) return;
        setUser(me);
        setStatus('authenticated');
      })
      .catch(() => {
        // A 401 was already handled by onAuthExpired above. Anything else
        // (server asleep, no network) must NOT delete the token: the user is
        // treated as a guest for now and the token is tried again next load.
        if (!cancelled) setStatus((s) => (s === 'loading' ? 'guest' : s));
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(async (email, password) => {
    const me = await apiLogin(email, password);
    setUser(me);
    setStatus('authenticated');
    setSessionExpired(false);
    return me;
  }, []);

  const register = useCallback(async (email, password) => {
    const me = await apiRegister(email, password);
    setUser(me);
    setStatus('authenticated');
    setSessionExpired(false);
    return me;
  }, []);

  const logout = useCallback(() => {
    signOut();
    setUser(null);
    setStatus('guest');
    setSessionExpired(false);
  }, []);

  const dismissSessionExpired = useCallback(() => setSessionExpired(false), []);

  const value = useMemo(
    () => ({
      user,
      status,
      isLoading: status === 'loading',
      isAuthenticated: status === 'authenticated',
      isAdmin: user?.is_admin === true,
      sessionExpired,
      dismissSessionExpired,
      login,
      register,
      logout,
    }),
    [user, status, sessionExpired, dismissSessionExpired, login, register, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
}