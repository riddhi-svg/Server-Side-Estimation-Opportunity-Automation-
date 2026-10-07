import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithRedirect, 
  getRedirectResult, 
  onAuthStateChanged, 
  signOut,
  User 
} from 'firebase/auth';
import { UserProfile } from '../types/auth.types';

export const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || '',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || '',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || ''
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

export const googleProvider = new GoogleAuthProvider();
googleProvider.addScope('https://www.googleapis.com/auth/tagmanager.readonly');
googleProvider.setCustomParameters({ prompt: 'select_account' });

const TOKEN_STORAGE_KEY = 'gtm_oauth_access_token';

export function getStoredAccessToken(): string | null {
  return localStorage.getItem(TOKEN_STORAGE_KEY);
}

export function setStoredAccessToken(token: string | null) {
  if (token) localStorage.setItem(TOKEN_STORAGE_KEY, token);
  else localStorage.removeItem(TOKEN_STORAGE_KEY);
}

export function clearStoredAccessToken() {
  localStorage.removeItem(TOKEN_STORAGE_KEY);
}

export async function loginWithGoogle() {
  await signInWithRedirect(auth, googleProvider);
}

export async function logoutUser() {
  clearStoredAccessToken();
  await signOut(auth);
}

export async function checkServerAuth(): Promise<{ authenticated: boolean; hasEnterpriseToken: boolean }> {
  try {
    const res = await fetch('/api/auth/status');
    if (res.ok) return await res.json();
  } catch (err) {
    console.warn('Could not verify server auth status:', err);
  }
  return { authenticated: false, hasEnterpriseToken: false };
}

export async function gtmFetch(url: string, options: RequestInit = {}): Promise<Response | null> {
  const token = getStoredAccessToken();
  const headers = new Headers(options.headers || {});
  if (token) headers.set('Authorization', `Bearer ${token}`);

  const response = await fetch(url, { ...options, headers });
  if (response.status === 401) {
    const serverStatus = await checkServerAuth();
    if (!serverStatus.authenticated) {
      clearStoredAccessToken();
      await loginWithGoogle();
      return null;
    }
  }
  return response;
}

export function mapUser(user: User | null): UserProfile | null {
  if (!user) return null;
  return {
    uid: user.uid,
    email: user.email,
    displayName: user.displayName,
    photoURL: user.photoURL
  };
}

export async function checkRedirectResult(): Promise<string | null> {
  try {
    const result = await getRedirectResult(auth);
    if (result) {
      const cred = GoogleAuthProvider.credentialFromResult(result);
      if (cred?.accessToken) {
        setStoredAccessToken(cred.accessToken);
        return cred.accessToken;
      }
    }
  } catch (err) {
    console.error('Redirect sign-in error:', err);
  }
  return null;
}

export function subscribeAuthState(callback: (user: UserProfile | null, token: string | null) => void) {
  return onAuthStateChanged(auth, (user) => {
    const token = getStoredAccessToken();
    callback(mapUser(user), token);
  });
}
