import { useState, useEffect, useCallback } from 'react';
import { AuthState, UserProfile } from '../types/auth.types';
import { 
  checkRedirectResult, 
  subscribeAuthState, 
  loginWithGoogle as doLogin, 
  logoutUser as doLogout,
  getStoredAccessToken
} from '../services/firebase';

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    user: null,
    accessToken: getStoredAccessToken(),
    loading: true
  });

  useEffect(() => {
    let mounted = true;

    async function init() {
      await checkRedirectResult();
      const unsubscribe = subscribeAuthState((user: UserProfile | null, token: string | null) => {
        if (!mounted) return;
        setAuthState({
          isAuthenticated: Boolean(user && token),
          user,
          accessToken: token,
          loading: false
        });
      });
      return unsubscribe;
    }

    const unsubPromise = init();
    return () => {
      mounted = false;
      unsubPromise.then(unsub => unsub && unsub());
    };
  }, []);

  const login = useCallback(async () => {
    await doLogin();
  }, []);

  const logout = useCallback(async () => {
    await doLogout();
    setAuthState({
      isAuthenticated: false,
      user: null,
      accessToken: null,
      loading: false
    });
  }, []);

  return {
    ...authState,
    login,
    logout
  };
}
