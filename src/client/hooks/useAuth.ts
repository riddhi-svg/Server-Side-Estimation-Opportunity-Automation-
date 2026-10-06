import { useState, useEffect, useCallback } from 'react';
import { AuthState, UserProfile } from '../types/auth.types';
import { 
  checkRedirectResult, 
  subscribeAuthState, 
  loginWithGoogle as doLogin, 
  logoutUser as doLogout,
  getStoredAccessToken,
  checkServerAuth
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
      const serverStatus = await checkServerAuth();

      const unsubscribe = subscribeAuthState((user: UserProfile | null, token: string | null) => {
        if (!mounted) return;
        if (user && token) {
          setAuthState({
            isAuthenticated: true,
            user,
            accessToken: token,
            loading: false
          });
        } else if (serverStatus.authenticated) {
          setAuthState({
            isAuthenticated: true,
            user: {
              uid: 'enterprise-gtm',
              displayName: 'Enterprise GTM Connected',
              email: '.env Enterprise Token Active',
              photoURL: null
            },
            accessToken: null,
            loading: false
          });
        } else {
          setAuthState({
            isAuthenticated: false,
            user: null,
            accessToken: null,
            loading: false
          });
        }
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
    const serverStatus = await checkServerAuth();
    setAuthState({
      isAuthenticated: serverStatus.authenticated,
      user: serverStatus.authenticated
        ? {
            uid: 'enterprise-gtm',
            displayName: 'Enterprise GTM Connected',
            email: '.env Enterprise Token Active',
            photoURL: null
          }
        : null,
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
